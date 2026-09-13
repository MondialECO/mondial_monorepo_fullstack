using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Audit;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class IdentityVerificationService : IIdentityVerificationService
    {
        private readonly MongoDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SumsubService _sumsub;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly IAuditLogger _audit;
        private readonly ILogger<IdentityVerificationService> _logger;

        private static readonly HashSet<string> ValidFranceDocTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "national_id",
            "passport",
            "residence_permit"
        };

        public IdentityVerificationService(
            MongoDbContext db,
            UserManager<ApplicationUser> userManager,
            SumsubService sumsub,
            IConfiguration configuration,
            IWebHostEnvironment env,
            IAuditLogger audit,
            ILogger<IdentityVerificationService> logger)
        {
            _db = db;
            _userManager = userManager;
            _sumsub = sumsub;
            _configuration = configuration;
            _env = env;
            _audit = audit;
            _logger = logger;
        }

        public IdentityConfigDto GetIdentityConfig(string countryCode)
        {
            var code = (countryCode ?? "FR").ToUpperInvariant();
            var allowLegacy = _configuration.GetValue<bool>("FeatureFlags:AllowLegacyIdentityUpload", false);

            var config = new IdentityConfigDto
            {
                Country = code,
                AllowLegacyUpload = allowLegacy
            };

            if (code == "FR" || code == "FRA")
            {
                config.Documents = new List<IdentityDocumentOptionDto>
                {
                    new()
                    {
                        Type = "national_id",
                        Label = "French National Identity Card (CNI)",
                        RequiresBack = true
                    },
                    new()
                    {
                        Type = "passport",
                        Label = "Passport",
                        RequiresBack = false
                    },
                    new()
                    {
                        Type = "residence_permit",
                        Label = "Residence Permit (Titre de séjour)",
                        RequiresBack = true
                    }
                };
            }
            else
            {
                config.Documents = new List<IdentityDocumentOptionDto>
                {
                    new()
                    {
                        Type = "passport",
                        Label = "Passport",
                        RequiresBack = false
                    },
                    new()
                    {
                        Type = "national_id",
                        Label = "National Identity Card",
                        RequiresBack = true
                    },
                    new()
                    {
                        Type = "residence_permit",
                        Label = "Residence Permit",
                        RequiresBack = true
                    }
                };
            }

            return config;
        }

        public async Task<IdentitySessionDto> CreateOrGetSessionAsync(
            string userId,
            string countryCode,
            string documentType,
            string? issuingCountry = null,
            string? nationality = null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException($"User '{userId}' not found");

            var docType = documentType.ToLowerInvariant();
            var residenceCountry = (countryCode ?? "FR").ToUpperInvariant();
            var docIssuingCountry = (issuingCountry ?? residenceCountry).ToUpperInvariant();

            // Validate against active France options if residence is France
            if (residenceCountry == "FR" && !ValidFranceDocTypes.Contains(docType))
            {
                throw new ArgumentException($"Document type '{documentType}' is not accepted for France identity verification");
            }

            // Find current active verification record
            var currentAttempt = await _db.UniversalIdentityVerifications
                .Find(x => x.UserId == userId && x.IsCurrent)
                .FirstOrDefaultAsync();

            if (currentAttempt != null && currentAttempt.Status == IdentityVerificationState.Verified)
            {
                return new IdentitySessionDto
                {
                    VerificationId = currentAttempt.Id,
                    AccessToken = string.Empty,
                    ApplicantId = currentAttempt.ProviderApplicantId,
                    Status = "verified",
                    DocumentType = currentAttempt.DocumentType ?? docType,
                    IssuingCountry = currentAttempt.IssuingCountry ?? docIssuingCountry
                };
            }

            // Generate short-lived Sumsub token
            var token = await _sumsub.GenerateAccessTokenAsync(userId, user.Email ?? $"{userId}@mondial.local");
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new InvalidOperationException("Sumsub provider failed to return an access token.");
            }

            if (currentAttempt == null)
            {
                currentAttempt = new UniversalIdentityVerification
                {
                    UserId = userId,
                    IsCurrent = true,
                    Provider = "sumsub",
                    Status = IdentityVerificationState.Submitted,
                    DocumentType = docType,
                    IssuingCountry = docIssuingCountry,
                    ResidenceCountry = residenceCountry,
                    Nationality = nationality,
                    SubmittedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                try
                {
                    await _db.UniversalIdentityVerifications.InsertOneAsync(currentAttempt);
                }
                catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey || ex.Message.Contains("E11000"))
                {
                    // Concurrency race: another simultaneous request created a current attempt
                    _logger.LogWarning("Race condition caught during session creation for user {UserId}. Fetching existing current attempt.", userId);
                    currentAttempt = await _db.UniversalIdentityVerifications
                        .Find(x => x.UserId == userId && x.IsCurrent)
                        .FirstOrDefaultAsync() ?? currentAttempt;
                }
            }
            else
            {
                currentAttempt.DocumentType = docType;
                currentAttempt.IssuingCountry = docIssuingCountry;
                currentAttempt.ResidenceCountry = residenceCountry;
                currentAttempt.Nationality = nationality ?? currentAttempt.Nationality;
                currentAttempt.Status = IdentityVerificationState.Submitted;
                currentAttempt.SubmittedAt = DateTime.UtcNow;
                currentAttempt.UpdatedAt = DateTime.UtcNow;

                await _db.UniversalIdentityVerifications.ReplaceOneAsync(
                    x => x.Id == currentAttempt.Id,
                    currentAttempt);
            }

            _audit.Record("identity_session_created", user.Email!, true, new
            {
                documentType = docType,
                issuingCountry = docIssuingCountry,
                residenceCountry
            });

            return new IdentitySessionDto
            {
                VerificationId = currentAttempt.Id,
                AccessToken = token,
                ApplicantId = currentAttempt.ProviderApplicantId,
                Status = "submitted",
                DocumentType = docType,
                IssuingCountry = docIssuingCountry
            };
        }

        public async Task<IdentityStatusDto> GetCurrentStatusAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new IdentityStatusDto
                {
                    Required = true,
                    Verified = false,
                    Status = "not_started"
                };
            }

            var attempt = await _db.UniversalIdentityVerifications
                .Find(x => x.UserId == userId && x.IsCurrent)
                .FirstOrDefaultAsync();

            // Backward compatibility for existing Phase 1 users
            var isLegacyVerified = user.Onboarding?.IdentityDocumentVerified ?? false;

            if (attempt == null)
            {
                return new IdentityStatusDto
                {
                    Required = true,
                    Verified = isLegacyVerified,
                    Status = isLegacyVerified ? "verified" : "not_started",
                    Provenance = isLegacyVerified ? "LEGACY_VERIFICATION_PROVENANCE_UNKNOWN" : null,
                    DocumentType = user.Onboarding?.IdentityDocumentType
                };
            }

            var statusStr = attempt.Status switch
            {
                IdentityVerificationState.NotStarted => "not_started",
                IdentityVerificationState.Uploading => "uploading",
                IdentityVerificationState.Submitted => "submitted",
                IdentityVerificationState.Processing => "processing",
                IdentityVerificationState.ManualReview => "manual_review",
                IdentityVerificationState.Verified => "verified",
                IdentityVerificationState.Rejected => "rejected",
                IdentityVerificationState.RetryRequired => "retry_required",
                IdentityVerificationState.Expired => "expired",
                _ => "not_started"
            };

            return new IdentityStatusDto
            {
                Required = true,
                Verified = attempt.Status == IdentityVerificationState.Verified || isLegacyVerified,
                Status = statusStr,
                DocumentType = attempt.DocumentType,
                IssuingCountry = attempt.IssuingCountry,
                ReviewReason = attempt.FailureReasonCode ?? attempt.FailureDetails,
                Provenance = attempt.Provider,
                SubmittedAt = attempt.SubmittedAt,
                VerifiedAt = attempt.VerifiedAt
            };
        }

        public async Task<bool> ProcessProviderWebhookAsync(string rawBody, string signature, string? eventId = null)
        {
            if (string.IsNullOrWhiteSpace(rawBody))
            {
                _logger.LogWarning("Webhook payload is empty");
                return false;
            }

            // Calculate payload digest (SHA256 hex) for operational auditing without storing raw PII
            string payloadDigest;
            using (var sha256 = SHA256.Create())
            {
                var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawBody));
                payloadDigest = Convert.ToHexString(hashBytes).ToLowerInvariant();
            }

            // Webhook signature verification against exact raw body
            var isValidSig = _sumsub.VerifyWebhookSignature(rawBody, signature);
            if (!isValidSig)
            {
                _logger.LogWarning("Sumsub webhook signature validation failed");
                await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                {
                    EventId = eventId,
                    PayloadDigest = payloadDigest,
                    ProcessingResult = "invalid_signature",
                    ErrorMessage = "Webhook signature verification failed or secret not configured"
                });
                return false;
            }

            JsonDocument doc;
            try
            {
                doc = JsonDocument.Parse(rawBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse webhook JSON payload");
                await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                {
                    EventId = eventId,
                    PayloadDigest = payloadDigest,
                    ProcessingResult = "malformed_payload",
                    ErrorMessage = ex.Message
                });
                return false;
            }

            using (doc)
            {
                var root = doc.RootElement;
                var applicantId = root.TryGetProperty("applicantId", out var appElem) ? appElem.GetString() : null;
                var externalUserId = root.TryGetProperty("externalUserId", out var userElem) ? userElem.GetString() : null;
                var reviewStatus = root.TryGetProperty("reviewStatus", out var statusElem) ? statusElem.GetString() : null;

                if (string.IsNullOrWhiteSpace(externalUserId))
                {
                    _logger.LogWarning("Webhook received without externalUserId (applicantId: {ApplicantId})", applicantId);
                    await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                    {
                        EventId = eventId,
                        ApplicantId = applicantId,
                        PayloadDigest = payloadDigest,
                        ProcessingResult = "missing_external_user",
                        ErrorMessage = "No externalUserId in webhook payload"
                    });
                    return true; // Acknowledge to prevent provider retries
                }

                // Check applicant ownership collision
                if (!string.IsNullOrEmpty(applicantId))
                {
                    var existingApplicantMapping = await _db.UniversalIdentityVerifications
                        .Find(x => x.Provider == "sumsub" && x.ProviderApplicantId == applicantId && x.UserId != externalUserId)
                        .FirstOrDefaultAsync();

                    if (existingApplicantMapping != null)
                    {
                        _logger.LogError("SECURITY ALERT: Applicant ID {ApplicantId} is already associated with user {OtherUserId}, rejecting mutation for {UserId}",
                            applicantId, existingApplicantMapping.UserId, externalUserId);

                        await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                        {
                            EventId = eventId,
                            ApplicantId = applicantId,
                            ExternalUserId = externalUserId,
                            PayloadDigest = payloadDigest,
                            ProcessingResult = "applicant_collision_rejected",
                            ErrorMessage = $"Applicant ID collision with user {existingApplicantMapping.UserId}"
                        });

                        return false;
                    }
                }

                var user = await _userManager.FindByIdAsync(externalUserId);
                if (user == null)
                {
                    _logger.LogWarning("Webhook user not found: {UserId}", externalUserId);
                    await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                    {
                        EventId = eventId,
                        ApplicantId = applicantId,
                        ExternalUserId = externalUserId,
                        PayloadDigest = payloadDigest,
                        ProcessingResult = "unknown_user",
                        ErrorMessage = $"User {externalUserId} not found in database"
                    });
                    return true;
                }

                var attempt = await _db.UniversalIdentityVerifications
                    .Find(x => x.UserId == externalUserId && x.IsCurrent)
                    .FirstOrDefaultAsync();

                if (attempt == null)
                {
                    attempt = new UniversalIdentityVerification
                    {
                        UserId = externalUserId,
                        IsCurrent = true,
                        Provider = "sumsub",
                        ProviderApplicantId = applicantId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _db.UniversalIdentityVerifications.InsertOneAsync(attempt);
                }

                var prevState = attempt.Status;

                // Idempotency check: deduplicate based on eventId or status
                var effectiveEventId = eventId ?? $"{reviewStatus}-{applicantId}-{DateTime.UtcNow:yyyyMMddHHmmss}";
                if (!string.IsNullOrEmpty(eventId) && attempt.ProcessedEventIds.Contains(eventId))
                {
                    _logger.LogInformation("Duplicate webhook event ignored: {EventId}", eventId);
                    await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                    {
                        EventId = eventId,
                        ApplicantId = applicantId,
                        ExternalUserId = externalUserId,
                        VerificationId = attempt.Id,
                        PayloadDigest = payloadDigest,
                        ProcessingResult = "duplicate"
                    });
                    return true;
                }

                // Parse review result if available
                string? reviewAnswer = null;
                string? rejectType = null;
                List<string> rejectLabels = new();

                if (root.TryGetProperty("reviewResult", out var reviewResultElem))
                {
                    if (reviewResultElem.TryGetProperty("reviewAnswer", out var answerElem))
                        reviewAnswer = answerElem.GetString();
                    if (reviewResultElem.TryGetProperty("reviewRejectType", out var rejectElem))
                        rejectType = rejectElem.GetString();
                    if (reviewResultElem.TryGetProperty("rejectLabels", out var labelsElem) && labelsElem.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var l in labelsElem.EnumerateArray())
                        {
                            var val = l.GetString();
                            if (!string.IsNullOrEmpty(val)) rejectLabels.Add(val);
                        }
                    }
                }

                // OUT-OF-ORDER PROTECTION: Once Verified, never downgrade from a stale pending/processing event
                if (attempt.Status == IdentityVerificationState.Verified &&
                    (reviewStatus == "pending" || reviewStatus == "init" || reviewAnswer == null))
                {
                    _logger.LogInformation("Ignoring stale pending webhook for already Verified user {UserId}", externalUserId);
                    await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                    {
                        EventId = eventId,
                        ApplicantId = applicantId,
                        ExternalUserId = externalUserId,
                        VerificationId = attempt.Id,
                        PayloadDigest = payloadDigest,
                        ProcessingResult = "out_of_order_ignored"
                    });
                    return true;
                }

                user.Onboarding ??= new OnboardingState();

                // Evaluate provider decision
                if (reviewAnswer == "RED")
                {
                    var isRetryable = string.Equals(rejectType, "RETRY", StringComparison.OrdinalIgnoreCase);
                    attempt.Status = isRetryable ? IdentityVerificationState.RetryRequired : IdentityVerificationState.Rejected;
                    attempt.RejectedAt = DateTime.UtcNow;

                    // Normalize safe rejection reason code
                    attempt.FailureReasonCode = NormalizeRejectReason(rejectLabels);
                    attempt.FailureDetails = rejectLabels.Count > 0 ? string.Join(", ", rejectLabels) : null;

                    // Legacy projection: Identity is NOT verified
                    user.Onboarding.IdentityDocumentVerified = false;
                    user.Kyc ??= new KycVerification();
                    user.Kyc.Identity ??= new IdentityVerification();
                    user.Kyc.Identity.Status = VerificationStatus.Rejected;
                    user.Kyc.Identity.RejectionReason = attempt.FailureReasonCode;

                    await _userManager.UpdateAsync(user);

                    _audit.Record("sumsub_webhook_rejected", user.Email!, false, new
                    {
                        applicantId,
                        reason = attempt.FailureReasonCode,
                        isRetryable
                    });
                }
                else if (reviewAnswer == "GREEN" || (string.IsNullOrEmpty(reviewAnswer) && reviewStatus == "completed"))
                {
                    attempt.Status = IdentityVerificationState.Verified;
                    attempt.VerifiedAt = DateTime.UtcNow;
                    attempt.FailureReasonCode = null;
                    attempt.FailureDetails = null;

                    // Authoritative legacy projection: Identity is VERIFIED
                    user.Onboarding.IdentityDocumentVerified = true;
                    user.Kyc ??= new KycVerification();
                    user.Kyc.Identity ??= new IdentityVerification();
                    user.Kyc.Identity.Status = VerificationStatus.Verified;
                    user.Kyc.Identity.VerifiedAt = DateTime.UtcNow;

                    // CRITICAL: FACE VERIFICATION IS NEVER SET OR TOUCHED
                    // Face remains completely independent and disabled for France MVP

                    await _userManager.UpdateAsync(user);

                    // Re-evaluate Universal Onboarding gate
                    await OnboardingGate.PromoteIfCompleteAsync(user, _userManager, _audit);

                    _audit.Record("sumsub_webhook_approved", user.Email!, true, new
                    {
                        applicantId,
                        verificationId = attempt.Id
                    });
                }
                else if (reviewStatus == "onHold")
                {
                    attempt.Status = IdentityVerificationState.ManualReview;
                    user.Onboarding.IdentityDocumentVerified = false;
                    await _userManager.UpdateAsync(user);

                    _audit.Record("sumsub_webhook_manual_review", user.Email!, true, new { applicantId });
                }
                else
                {
                    // "pending", "init", "queued", etc.
                    attempt.Status = IdentityVerificationState.Processing;
                    user.Onboarding.IdentityDocumentVerified = false;
                    await _userManager.UpdateAsync(user);

                    _audit.Record("sumsub_webhook_processing", user.Email!, true, new { applicantId });
                }

                attempt.ProviderApplicantId = applicantId ?? attempt.ProviderApplicantId;
                if (!string.IsNullOrEmpty(effectiveEventId))
                {
                    attempt.ProcessedEventIds.Add(effectiveEventId);
                }
                attempt.UpdatedAt = DateTime.UtcNow;

                await _db.UniversalIdentityVerifications.ReplaceOneAsync(
                    x => x.Id == attempt.Id,
                    attempt);

                // Record durable decision audit log
                await _db.IdentityDecisionAuditLogs.InsertOneAsync(new IdentityDecisionAuditLog
                {
                    VerificationId = attempt.Id,
                    UserId = externalUserId,
                    PreviousState = prevState,
                    NewState = attempt.Status,
                    Source = "provider_webhook",
                    ReviewerOrProvider = "sumsub",
                    DecisionReason = attempt.FailureReasonCode ?? reviewAnswer ?? reviewStatus ?? "UNKNOWN",
                    Timestamp = DateTime.UtcNow
                });

                // Record operational delivery log
                await _db.IdentityWebhookDeliveryLogs.InsertOneAsync(new IdentityWebhookDeliveryLog
                {
                    EventId = eventId,
                    ApplicantId = applicantId,
                    ExternalUserId = externalUserId,
                    VerificationId = attempt.Id,
                    PayloadDigest = payloadDigest,
                    ProcessingResult = "success"
                });

                return true;
            }
        }

        public async Task<UniversalIdentityVerification> RecordManualUploadAsync(
            string userId,
            string documentType,
            string frontPath,
            string? backPath,
            string? issuingCountry = null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException($"User '{userId}' not found");

            var docType = documentType.ToLowerInvariant();
            user.Onboarding ??= new OnboardingState();

            // Save document paths
            user.Onboarding.IdentityDocumentType = docType;
            user.Onboarding.IdentityFrontImagePath = frontPath;
            user.Onboarding.IdentityBackImagePath = backPath;
            user.Onboarding.IdentityDocumentUploadedAt = DateTime.UtcNow;

            // MANDATORY: UPLOADING DOES NOT VERIFY IDENTITY
            user.Onboarding.IdentityDocumentVerified = false;

            user.Kyc ??= new KycVerification();
            user.Kyc.Identity ??= new IdentityVerification();
            user.Kyc.Identity.DocumentType = docType;
            user.Kyc.Identity.FrontImage = frontPath;
            user.Kyc.Identity.BackImage = backPath;
            user.Kyc.Identity.SubmittedAt = DateTime.UtcNow;
            user.Kyc.Identity.Status = VerificationStatus.Pending;

            await _userManager.UpdateAsync(user);

            // Find or create current verification attempt
            var attempt = await _db.UniversalIdentityVerifications
                .Find(x => x.UserId == userId && x.IsCurrent)
                .FirstOrDefaultAsync();

            var prevState = attempt?.Status ?? IdentityVerificationState.NotStarted;

            if (attempt == null)
            {
                attempt = new UniversalIdentityVerification
                {
                    UserId = userId,
                    IsCurrent = true,
                    Provider = "manual",
                    Status = IdentityVerificationState.Submitted,
                    DocumentType = docType,
                    IssuingCountry = issuingCountry ?? "FR",
                    ResidenceCountry = "FR",
                    FrontImagePath = frontPath,
                    BackImagePath = backPath,
                    SubmittedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _db.UniversalIdentityVerifications.InsertOneAsync(attempt);
            }
            else
            {
                attempt.Provider = "manual";
                attempt.DocumentType = docType;
                attempt.FrontImagePath = frontPath;
                attempt.BackImagePath = backPath;
                attempt.IssuingCountry = issuingCountry ?? attempt.IssuingCountry ?? "FR";
                attempt.Status = IdentityVerificationState.Submitted;
                attempt.SubmittedAt = DateTime.UtcNow;
                attempt.UpdatedAt = DateTime.UtcNow;

                await _db.UniversalIdentityVerifications.ReplaceOneAsync(
                    x => x.Id == attempt.Id,
                    attempt);
            }

            // Record durable decision audit log
            await _db.IdentityDecisionAuditLogs.InsertOneAsync(new IdentityDecisionAuditLog
            {
                VerificationId = attempt.Id,
                UserId = userId,
                PreviousState = prevState,
                NewState = IdentityVerificationState.Submitted,
                Source = "user_upload",
                ReviewerOrProvider = user.Email ?? userId,
                DecisionReason = "MANUAL_DOCUMENT_UPLOADED",
                Timestamp = DateTime.UtcNow
            });

            _audit.Record("identity_manual_upload_submitted", user.Email!, true, new
            {
                documentType = docType,
                verificationId = attempt.Id
            });

            return attempt;
        }

        public async Task<bool> RecordAdminDecisionAsync(
            string userId,
            string adminId,
            bool approved,
            string? reason = null,
            string? internalNote = null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return false;

            var attempt = await _db.UniversalIdentityVerifications
                .Find(x => x.UserId == userId && x.IsCurrent)
                .FirstOrDefaultAsync();

            var prevState = attempt?.Status ?? IdentityVerificationState.NotStarted;
            var newState = approved ? IdentityVerificationState.Verified : IdentityVerificationState.Rejected;

            if (attempt == null)
            {
                attempt = new UniversalIdentityVerification
                {
                    UserId = userId,
                    IsCurrent = true,
                    Provider = "manual",
                    Status = newState,
                    VerifiedAt = approved ? DateTime.UtcNow : null,
                    RejectedAt = approved ? null : DateTime.UtcNow,
                    FailureReasonCode = approved ? null : (reason ?? "ADMIN_REJECTED"),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _db.UniversalIdentityVerifications.InsertOneAsync(attempt);
            }
            else
            {
                attempt.Status = newState;
                attempt.VerifiedAt = approved ? DateTime.UtcNow : attempt.VerifiedAt;
                attempt.RejectedAt = approved ? null : DateTime.UtcNow;
                attempt.FailureReasonCode = approved ? null : (reason ?? "ADMIN_REJECTED");
                attempt.UpdatedAt = DateTime.UtcNow;

                await _db.UniversalIdentityVerifications.ReplaceOneAsync(x => x.Id == attempt.Id, attempt);
            }

            // Record durable decision audit log (ZERO raw PII, ZERO images)
            await _db.IdentityDecisionAuditLogs.InsertOneAsync(new IdentityDecisionAuditLog
            {
                VerificationId = attempt.Id,
                UserId = userId,
                PreviousState = prevState,
                NewState = newState,
                Source = "manual_admin",
                ReviewerOrProvider = adminId,
                DecisionReason = reason ?? (approved ? "ADMIN_APPROVED" : "ADMIN_REJECTED"),
                InternalNote = internalNote,
                Timestamp = DateTime.UtcNow
            });

            // Authoritative legacy projection
            user.Onboarding ??= new OnboardingState();
            user.Onboarding.IdentityDocumentVerified = approved;
            // CRITICAL: FaceVerified is NEVER touched by identity events!

            user.Kyc ??= new KycVerification();
            user.Kyc.Identity ??= new IdentityVerification();
            user.Kyc.Identity.Status = approved ? VerificationStatus.Verified : VerificationStatus.Rejected;
            user.Kyc.Status = approved ? VerificationStatus.Verified : VerificationStatus.Rejected;
            if (approved)
            {
                user.Kyc.VerifiedAt = DateTime.UtcNow;
                user.Kyc.Identity.VerifiedAt = DateTime.UtcNow;
            }
            else
            {
                user.Kyc.Identity.RejectionReason = reason;
            }

            await _userManager.UpdateAsync(user);

            if (approved)
            {
                await OnboardingGate.PromoteIfCompleteAsync(user, _userManager, _audit);
            }

            _audit.Record(approved ? "admin_kyc_approved" : "admin_kyc_rejected", adminId, true, new
            {
                targetUserId = userId,
                verificationId = attempt.Id,
                reason,
                approved
            });

            return true;
        }

        public async Task<bool> RetryVerificationAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            // Atomically archive all current attempts so IsCurrent = false
            var update = Builders<UniversalIdentityVerification>.Update
                .Set(x => x.IsCurrent, false)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            await _db.UniversalIdentityVerifications.UpdateManyAsync(
                x => x.UserId == userId && x.IsCurrent,
                update);

            if (user.Onboarding != null)
            {
                user.Onboarding.IdentityDocumentVerified = false;
                await _userManager.UpdateAsync(user);
            }

            // Record decision history
            await _db.IdentityDecisionAuditLogs.InsertOneAsync(new IdentityDecisionAuditLog
            {
                VerificationId = "none",
                UserId = userId,
                PreviousState = IdentityVerificationState.Rejected,
                NewState = IdentityVerificationState.NotStarted,
                Source = "system_retry",
                ReviewerOrProvider = user.Email ?? userId,
                DecisionReason = "USER_REQUESTED_RETRY",
                Timestamp = DateTime.UtcNow
            });

            _audit.Record("identity_verification_retry_requested", user.Email!, true);
            return true;
        }

        private static string NormalizeRejectReason(List<string> labels)
        {
            if (labels == null || labels.Count == 0) return "VERIFICATION_FAILED";

            var combined = string.Join(" ", labels).ToUpperInvariant();

            if (combined.Contains("EXPIR")) return "DOCUMENT_EXPIRED";
            if (combined.Contains("BLUR") || combined.Contains("QUALITY") || combined.Contains("GLARE") || combined.Contains("LOW_RESOLUTION")) return "DOCUMENT_BLURRY";
            if (combined.Contains("UNSUPPORTED") || combined.Contains("TYPE") || combined.Contains("NOT_ACCEPTABLE")) return "UNSUPPORTED_DOCUMENT";
            if (combined.Contains("DAMAG") || combined.Contains("CORRUPT") || combined.Contains("INCOMPLETE")) return "DOCUMENT_DAMAGED";
            if (combined.Contains("MISMATCH") || combined.Contains("DOES_NOT_MATCH") || combined.Contains("NAME") || combined.Contains("DOB")) return "DETAILS_MISMATCH";
            if (combined.Contains("REVIEW") || combined.Contains("HOLD") || combined.Contains("SUSPICIOUS")) return "ADDITIONAL_REVIEW_REQUIRED";

            return "VERIFICATION_FAILED";
        }
    }
}
