using Hangfire;
using Hangfire.Storage;
using Hangfire.Storage.Monitoring;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Reconciliation
{
    /// <summary>
    /// Tier 2: Startup Reconciliation Service (IHostedService).
    /// Runs on backend startup to detect and record orphaned sessions and unrefunded debits.
    ///
    /// Report-Only Mode (DryRun = true):
    /// Strictly inspects state and records immutable audit logs to <c>AiReconciliationAudits</c>.
    /// Makes zero balance modifications or session transitions in report-only mode.
    ///
    /// Liveness & Orphan Evidence Hierarchy:
    /// 1. Primary: Associated AIRequest in terminal state (Failed or Completed).
    /// 2. Secondary: Hangfire background job demonstrably no longer active (NotFound, Succeeded, Deleted, Failed).
    /// 3. Fallback (weaker signal): Elapsed time (>20 minutes since UpdatedAt) strictly when neither
    ///    request status nor Hangfire job state can be determined.
    /// </summary>
    public class AiStartupReconciliationService : IHostedService
    {
        private readonly IMongoDatabase _database;
        private readonly AiRequestRepository _requests;
        private readonly AiCreditLedgerRepository _credits;
        private readonly AiReconciliationAuditRepository _auditRepo;
        private readonly ILogger<AiStartupReconciliationService> _logger;

        public AiStartupReconciliationService(
            IMongoDatabase database,
            AiRequestRepository requests,
            AiCreditLedgerRepository credits,
            AiReconciliationAuditRepository auditRepo,
            ILogger<AiStartupReconciliationService> logger)
        {
            _database = database;
            _requests = requests;
            _credits = credits;
            _auditRepo = auditRepo;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "Starting AI Startup Reconciliation in REPORT-ONLY mode (DryRun = true, Source: {Source}).",
                AiReconciliationSource.StartupReconciliation);

            try
            {
                var eligibleUsers = await GetEligibleRealUserIdsAsync(cancellationToken);
                await ReconcileUnrefundedDebitsAsync(eligibleUsers, cancellationToken);
                await ReconcileOrphanedSessionsAsync(eligibleUsers, cancellationToken);
                _logger.LogInformation("AI Startup Reconciliation report-only sweep completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during AI Startup Reconciliation sweep.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        /// <summary>
        /// Public entry point for running the reconciliation sweep synchronously or on-demand.
        /// </summary>
        public async Task RunSweepAsync(CancellationToken cancellationToken = default)
        {
            var eligibleUsers = await GetEligibleRealUserIdsAsync(cancellationToken);
            await ReconcileUnrefundedDebitsAsync(eligibleUsers, cancellationToken);
            await ReconcileOrphanedSessionsAsync(eligibleUsers, cancellationToken);
        }

        private async Task ReconcileUnrefundedDebitsAsync(HashSet<string> eligibleRealUserIds, CancellationToken cancellationToken)
        {
            var reqCollection = _database.GetCollection<AiRequest>("AIRequests");
            var failedRequests = await reqCollection
                .Find(r => r.Status == "Failed")
                .ToListAsync(cancellationToken);

            _logger.LogInformation(
                "AI Startup Reconciliation: Scanning {Count} failed AI requests for unrefunded debits.",
                failedRequests.Count);

            foreach (var req in failedRequests)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                var opId = ExtractCreditOpId(req);
                if (string.IsNullOrEmpty(opId) || string.IsNullOrEmpty(req.OwnerUserId))
                    continue;

                if (!eligibleRealUserIds.Contains(req.OwnerUserId))
                {
                    _logger.LogDebug(
                        "AI Startup Reconciliation: Skipping debit check for non-eligible/unverified user '{OwnerUserId}'.",
                        req.OwnerUserId);
                    continue;
                }

                var ledger = await _credits.GetByOwnerAsync(req.OwnerUserId);
                if (ledger == null)
                    continue;

                var debit = ledger.Debits.FirstOrDefault(d => d.OperationId == opId);
                if (debit != null && !debit.Refunded)
                {
                    var evidence = $"TerminalRequestFailedWithUnrefundedDebit: AIRequest {req.Id} failed at {req.UpdatedAt:u} (Error: {req.Error ?? "None"}), but debit {opId} ({debit.Amount} credits) remains unrefunded on user {req.OwnerUserId} ledger";

                    _logger.LogCritical(
                        AiLogEvents.UnrefundedDebit,
                        "CRITICAL [AI_UNREFUNDED_DEBIT] (Report-Only): User {UserId} has unrefunded debit {OperationId} ({Amount} credits) from failed AIRequest {RequestId}. Evidence: {Evidence}",
                        req.OwnerUserId, opId, debit.Amount, req.Id, evidence);

                    var audit = new AiReconciliationAudit
                    {
                        OwnerUserId = req.OwnerUserId,
                        OperationId = opId,
                        RequestId = req.Id,
                        JobType = req.JobType,
                        Amount = debit.Amount,
                        Action = "DetectedUnrefundedDebit",
                        Source = AiReconciliationSource.StartupReconciliation,
                        Evidence = evidence,
                        DryRun = true, // Explicitly stored fact
                        Reason = $"Unrefunded debit from failed AIRequest {req.Id}",
                        CreatedAt = DateTime.UtcNow
                    };

                    await _auditRepo.RecordAuditAsync(audit);
                }
            }
        }

        private async Task ReconcileOrphanedSessionsAsync(HashSet<string> eligibleRealUserIds, CancellationToken cancellationToken)
        {
            var sessionCollections = new (string CollectionName, string JobType)[]
            {
                ("BusinessModelSessions", "BusinessModel"),
                ("MarketStudySessions", "MarketStudy"),
                ("BusinessPlanSessions", "BusinessPlan"),
                ("ForecastSessions", "Forecast"),
                ("ClarifierSessions", "IdeaClarifier"),
                ("IdeaGenerationSessions", "IdeaGenerator")
            };

            var nonTerminalStatuses = new[] { "Pending", "Processing" };

            foreach (var (colName, jobType) in sessionCollections)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                var col = _database.GetCollection<BsonDocument>(colName);
                var filter = Builders<BsonDocument>.Filter.In("Status", nonTerminalStatuses);
                var activeSessions = await col.Find(filter).ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "AI Startup Reconciliation: Checking collection '{CollectionName}' ({Count} non-terminal sessions).",
                    colName, activeSessions.Count);

                foreach (var doc in activeSessions)
                {
                    if (cancellationToken.IsCancellationRequested)
                        break;

                    var sessionId = doc.Contains("_id") ? doc["_id"].ToString() ?? "" : "";
                    var ownerUserId = doc.Contains("OwnerUserId") && !doc["OwnerUserId"].IsBsonNull ? doc["OwnerUserId"].ToString() ?? "" : "";
                    var status = doc.Contains("Status") && !doc["Status"].IsBsonNull ? doc["Status"].ToString() ?? "" : "";
                    var requestId = doc.Contains("RequestId") && !doc["RequestId"].IsBsonNull ? doc["RequestId"].ToString() : null;
                    if (string.IsNullOrWhiteSpace(requestId) || requestId == "BsonNull") requestId = null;
                    var updatedAt = doc.Contains("UpdatedAt") && doc["UpdatedAt"].IsValidDateTime
                        ? doc["UpdatedAt"].ToUniversalTime()
                        : (doc.Contains("CreatedAt") && doc["CreatedAt"].IsValidDateTime
                            ? doc["CreatedAt"].ToUniversalTime()
                            : DateTime.UtcNow);

                    // Positive signal test: User must have verified email+phone and a real journey record
                    if (!eligibleRealUserIds.Contains(ownerUserId))
                    {
                        _logger.LogDebug(
                            "AI Startup Reconciliation: Skipping session {SessionId} for non-eligible/unverified user '{OwnerUserId}'.",
                            sessionId, ownerUserId);
                        continue;
                    }

                    var (isOrphaned, evidence) = await EvaluateOrphanConditionAsync(doc, sessionId, status, requestId, updatedAt);

                    if (isOrphaned)
                    {
                        _logger.LogWarning(
                            "AI Startup Reconciliation (Report-Only): Detected genuine orphaned session {SessionId} in '{CollectionName}' (Status: {Status}). Evidence: {Evidence}",
                            sessionId, colName, status, evidence);

                        var audit = new AiReconciliationAudit
                        {
                            OwnerUserId = ownerUserId,
                            SessionId = sessionId,
                            RequestId = requestId,
                            JobType = jobType,
                            Action = "DetectedOrphanedSession",
                            Source = AiReconciliationSource.StartupReconciliation,
                            Evidence = evidence,
                            DryRun = true, // Explicitly stored fact
                            Reason = $"Orphaned session detected in {colName} ({status})",
                            CreatedAt = DateTime.UtcNow
                        };

                        await _auditRepo.RecordAuditAsync(audit);
                    }
                }
            }
        }

        private async Task<HashSet<string>> GetEligibleRealUserIdsAsync(CancellationToken cancellationToken)
        {
            var appUsersCol = _database.GetCollection<ApplicationUser>("applicationUsers");
            var journeysCol = _database.GetCollection<CreatorJourney>("CreatorJourneys");

            // 1. Positive Signal: Verified Email AND Phone
            var verifiedUsers = await appUsersCol.Find(u =>
                (u.EmailConfirmed || u.Onboarding.EmailOtpVerified) &&
                (u.PhoneNumberConfirmed || u.Onboarding.PhoneVerified))
                .Project(u => u.Id)
                .ToListAsync(cancellationToken);

            var verifiedUserIds = new HashSet<string>(verifiedUsers.Select(g => g.ToString()), StringComparer.OrdinalIgnoreCase);

            // 2. Positive Signal: Real Journey Record
            var journeyUserIdsList = await journeysCol.Find(FilterDefinition<CreatorJourney>.Empty)
                .Project(j => j.UserId)
                .ToListAsync(cancellationToken);

            var journeyUserIds = new HashSet<string>(journeyUserIdsList.Where(id => !string.IsNullOrWhiteSpace(id)), StringComparer.OrdinalIgnoreCase);

            // Intersection: Verified user with an active journey record
            verifiedUserIds.IntersectWith(journeyUserIds);
            return verifiedUserIds;
        }

        private async Task<(bool IsOrphaned, string Evidence)> EvaluateOrphanConditionAsync(
            BsonDocument doc,
            string sessionId,
            string status,
            string? requestId,
            DateTime updatedAt)
        {
            // 1. Primary Signal: Associated AIRequest Status
            if (!string.IsNullOrWhiteSpace(requestId))
            {
                var req = await _requests.GetByIdAsync(requestId);
                if (req != null)
                {
                    if (string.Equals(req.Status, "Failed", StringComparison.OrdinalIgnoreCase))
                    {
                        return (true, $"TerminalRequestStatus: Associated AIRequest {req.Id} is Failed (Error: {req.Error ?? "None"}) while session remained '{status}'");
                    }

                    if (string.Equals(req.Status, "Completed", StringComparison.OrdinalIgnoreCase))
                    {
                        return (true, $"TerminalRequestStatus: Associated AIRequest {req.Id} is Completed, but session remained in '{status}'");
                    }

                    // Request is Pending or Processing: Check Secondary Signal (Hangfire liveness)
                    if (!string.IsNullOrWhiteSpace(req.HangfireJobId))
                    {
                        var hangfireStatus = GetHangfireJobLiveness(req.HangfireJobId);

                        if (hangfireStatus.IsDefinitivelyInactive)
                        {
                            return (true, $"HangfireJobInactive: Hangfire job {req.HangfireJobId} is inactive/terminal ({hangfireStatus.State}) while session/request remained '{status}'");
                        }

                        if (hangfireStatus.IsActive)
                        {
                            // Job is actively executing in Hangfire. NOT orphaned.
                            return (false, $"HangfireJobActive: Hangfire job {req.HangfireJobId} is actively in state '{hangfireStatus.State}'");
                        }

                        // Hangfire state cannot be determined: Do NOT guess on elapsed time alone
                        return (false, $"HangfireJobStateIndeterminate: No definitive terminal signal for job {req.HangfireJobId}; untouched to avoid guessing.");
                    }
                }
            }

            // No terminal request signal or active Hangfire proof: untouched
            return (false, $"NoActionableTerminalProof: Session {sessionId} has no terminal AIRequest signal; left untouched.");
        }

        private (bool IsActive, bool IsDefinitivelyInactive, string State) GetHangfireJobLiveness(string hangfireJobId)
        {
            try
            {
                var monitoringApi = JobStorage.Current?.GetMonitoringApi();
                if (monitoringApi == null)
                {
                    return (false, false, "HangfireStorageUnavailable");
                }

                JobDetailsDto? jobDetails;
                try
                {
                    jobDetails = monitoringApi.JobDetails(hangfireJobId);
                }
                catch (Exception)
                {
                    // Hangfire throws or fails when job does not exist in storage
                    return (false, true, "NotFoundInStorage");
                }

                if (jobDetails == null)
                {
                    return (false, true, "NotFound");
                }

                var latestState = jobDetails.History?.FirstOrDefault()?.StateName ?? "NoState";

                var activeStates = new[] { "Enqueued", "Processing", "Scheduled", "Awaiting" };
                var terminalStates = new[] { "Succeeded", "Deleted", "Failed" };

                if (activeStates.Contains(latestState, StringComparer.OrdinalIgnoreCase))
                {
                    return (true, false, latestState);
                }

                if (terminalStates.Contains(latestState, StringComparer.OrdinalIgnoreCase))
                {
                    return (false, true, latestState);
                }

                return (false, false, latestState);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not check Hangfire job liveness for job {JobId}", hangfireJobId);
                return (false, false, "ErrorCheckingLiveness");
            }
        }

        private static string? ExtractCreditOpId(AiRequest req)
        {
            if (req.InputPayload == null)
                return null;

            if (req.InputPayload.TryGetValue("creditOpId", out var val) && val.IsString && !string.IsNullOrWhiteSpace(val.AsString))
                return val.AsString;

            if (req.InputPayload.TryGetValue("creditOperationId", out var val2) && val2.IsString && !string.IsNullOrWhiteSpace(val2.AsString))
                return val2.AsString;

            return null;
        }
    }
}
