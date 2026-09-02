using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

public class PhaseValidator : IPhaseValidator
{
    private readonly MongoDbContext _dbContext;

    public PhaseValidator(MongoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase1Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(company.CompanyName))
                errors.Add("Company name is required");

            if (string.IsNullOrWhiteSpace(company.Industry))
                errors.Add("Industry is required");

            if (string.IsNullOrWhiteSpace(company.Website))
                errors.Add("Website is required");

            if (string.IsNullOrWhiteSpace(company.Tagline))
                errors.Add("Tagline is required");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase2Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(company.LegalName))
                errors.Add("Legal name is required");

            if (string.IsNullOrWhiteSpace(company.RegistrationNumber))
                errors.Add("Company registration number is required");

            if (string.IsNullOrWhiteSpace(company.LegalStructure))
                errors.Add("Legal structure is required");

            if (string.IsNullOrWhiteSpace(company.IncorporationDate))
                errors.Add("Incorporation date is required");

            if (string.IsNullOrWhiteSpace(company.RegisteredAddress))
                errors.Add("Registered address is required");

            if (string.IsNullOrWhiteSpace(company.Country))
                errors.Add("Country is required");

            // Check beneficial owners — validate canonical fields, not just count.
            if (company.BeneficialOwnersDto == null || company.BeneficialOwnersDto.Count == 0)
            {
                errors.Add("At least one beneficial owner is required");
            }
            else
            {
                for (var i = 0; i < company.BeneficialOwnersDto.Count; i++)
                {
                    var owner = company.BeneficialOwnersDto[i];
                    if (string.IsNullOrWhiteSpace(owner.FullName))
                        errors.Add($"Beneficial owner #{i + 1}: full name is required");
                    if (string.IsNullOrWhiteSpace(owner.Email))
                        errors.Add($"Beneficial owner #{i + 1}: email is required");
                    if (owner.OwnershipPercent <= 0 || owner.OwnershipPercent > 100)
                        errors.Add($"Beneficial owner #{i + 1}: ownership percent must be between 0 and 100");
                }
            }

            // Check documents — backend-authoritative required set.
            // Phase 2 completion means every required document type has been
            // submitted with a non-rejected status. Pending and approved both count.
            var statuses = company.DocumentStatuses ?? new List<DocumentStatusResponse>();
            foreach (var requiredType in Phase2Requirements.RequiredDocumentTypes)
            {
                var hasAcceptable = statuses.Any(d =>
                    Phase2Requirements.MatchesType(d.Type, requiredType) &&
                    Phase2Requirements.IsAcceptableStatus(d.Status));

                if (!hasAcceptable)
                    errors.Add($"Required document '{requiredType}' is missing or rejected");
            }

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase3Async(Companies company)
    {
        var errors = new List<string>();

        // Revenue ----------------------------------------------------------
        // Revenue may legitimately be 0 (Pre-Revenue). Negative revenue is rejected.
        if ((company.Q1Revenue ?? 0) < 0 || (company.Q2Revenue ?? 0) < 0 || (company.Q3Revenue ?? 0) < 0 || (company.Q4Revenue ?? 0) < 0)
            errors.Add("Quarterly revenue cannot be negative");

        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        if (totalRevenue < 0)
            errors.Add("Total revenue cannot be negative");

        // Valuation --------------------------------------------------------
        if (company.Valuation == null || company.Valuation <= 0)
            errors.Add("Valuation must be calculated");

        // KPI baseline -----------------------------------------------------
        // Phase 3's four-step workflow (Revenue → Automated Valuation →
        // Live KPI Tracking → Concept Overview) collects revenue, an AI
        // valuation, and a KPI baseline. Funding ask, capital allocation,
        // equity structure, cash position, and financial-report uploads are
        // NOT part of this workflow (they belong to later phases) and are
        // therefore not required to complete Phase 3.
        var latestKpi = await _dbContext.Phase3Kpis
            .Find(k => k.CompanyId == company.Id)
            .SortByDescending(k => k.RecordedAt)
            .FirstOrDefaultAsync();

        var kpiErrors = Phase3Requirements.ValidateKpiBaseline(latestKpi);
        errors.AddRange(kpiErrors);

        // Concept Overview (Step 4) must exist before Phase 3 can complete.
        var concept = await _dbContext.Phase3Concepts
            .Find(c => c.CompanyId == company.Id)
            .FirstOrDefaultAsync();
        if (concept == null)
            errors.Add("Concept overview is required");

        return (errors.Count == 0, errors);
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase4Async(Companies company)
    {
        var errors = new List<string>();

        // Latest submitted cap table (versioned, authoritative for Phase 4 review).
        var capTable = await _dbContext.Phase4CapTables
            .Find(c => c.CompanyId == company.Id)
            .SortByDescending(c => c.RecordedAt)
            .FirstOrDefaultAsync();

        if (capTable == null)
        {
            errors.Add("Cap table must be submitted");
            return (false, errors);
        }

        if (capTable.TotalShares <= 0)
            errors.Add("Total shares must be > 0");

        if (capTable.Grants == null || capTable.Grants.Count == 0)
        {
            errors.Add("Cap table must contain at least one grant");
            return (false, errors);
        }

        // No negative ownership.
        if (capTable.Grants.Any(g => g.SharesGranted < 0))
            errors.Add("Cap table contains negative share grants");

        // Issued equity shares <= total, and reconcile to ~100% of total.
        // Non-equity instruments (e.g. SAFE, Note) do not count toward issued equity.
        var issued = capTable.Grants
            .Where(g => ShareClasses.IsEquityClass(g.ShareClass))
            .Sum(g => g.SharesGranted);
        if (issued > capTable.TotalShares)
            errors.Add($"Issued shares ({issued}) exceed total authorised shares ({capTable.TotalShares})");

        var issuedPercent = capTable.TotalShares > 0
            ? (issued / (double)capTable.TotalShares) * 100.0 : 0;
        if (issuedPercent <= Phase4Requirements.OwnershipMinPercent)
            errors.Add("Ownership totals must be > 0%");
        if (issuedPercent > Phase4Requirements.OwnershipMaxPercent)
            errors.Add($"Ownership totals must be <= 100% (currently {issuedPercent:F2}%)");
        if (issuedPercent < Phase4Requirements.OwnershipReconciledMin ||
            issuedPercent > Phase4Requirements.OwnershipReconciledMax)
            errors.Add($"Cap table must reconcile to ~100% of total shares (currently {issuedPercent:F2}%)");

        // Founder presence (must hold an equity share class).
        if (!capTable.Grants.Any(g =>
                string.Equals(g.StakeholderType, "founder", StringComparison.OrdinalIgnoreCase) &&
                ShareClasses.IsEquityClass(g.ShareClass)))
            errors.Add("At least one founder grant is required");

        // Valid equity share class on every grant.
        foreach (var g in capTable.Grants)
        {
            if (!ShareClasses.IsEquityClass(g.ShareClass))
                errors.Add($"Grant '{g.StakeholderName}': invalid equity share class '{g.ShareClass}'");
        }

        // Duplicate share-class rows for the same stakeholder.
        var dupKeys = capTable.Grants
            .GroupBy(g => $"{(g.StakeholderName ?? string.Empty).Trim().ToLowerInvariant()}::{(g.ShareClass ?? string.Empty).Trim().ToLowerInvariant()}")
            .Where(grp => grp.Count() > 1)
            .Select(grp => grp.Key)
            .ToList();
        foreach (var k in dupKeys)
            errors.Add($"Duplicate cap-table row detected for {k.Replace("::", " / ")}");

        // ESOP allocation sanity.
        if (capTable.EsopPoolPercent < 0 || capTable.EsopPoolPercent > 100)
            errors.Add("ESOP pool percent must be between 0 and 100");
        if (capTable.EsopPoolPercent > 0 && capTable.EsopVestingMonths <= 0)
            errors.Add("ESOP vesting months must be > 0 when ESOP pool is non-zero");

        // Vesting schedule validity (per grant inline + standalone schedules).
        foreach (var g in capTable.Grants)
            errors.AddRange(Phase4Requirements.ValidateVesting(
                g.CliffMonths, g.TotalVestMonths,
                string.IsNullOrWhiteSpace(g.StakeholderName) ? "grant" : g.StakeholderName));

        var vestingSchedules = await _dbContext.Phase4VestingSchedules
            .Find(v => v.CompanyId == company.Id)
            .ToListAsync();
        foreach (var v in vestingSchedules)
        {
            if (v.SharesGranted <= 0)
                errors.Add($"Vesting schedule for '{v.StakeholderName}': shares must be > 0");
            errors.AddRange(Phase4Requirements.ValidateVesting(
                v.CliffMonths, v.TotalVestMonths, $"vesting for {v.StakeholderName}"));
        }

        // Note: Dilution simulation and Exit waterfall reviews are optional planning/scenario
        // tools and do not block Phase 4 advancement if the cap table is valid.

        return (errors.Count == 0, errors);
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase5Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            // Pitch deck checked first — cheapest gate, fast-fails the common
            // "forgot to upload" case before any numeric validation.
            if (string.IsNullOrWhiteSpace(company.PitchDeckFileName))
                errors.Add("Pitch deck must be uploaded");

            if (company.FundingAskAmount == null ||
                !double.IsFinite(company.FundingAskAmount.Value) ||
                company.FundingAskAmount <= 0)
                errors.Add("Funding ask amount is required");

            if (string.IsNullOrWhiteSpace(company.FundingRoundType))
                errors.Add("Funding round type must be specified");

            if (company.PreMoneyValuation == null ||
                !double.IsFinite(company.PreMoneyValuation.Value) ||
                company.PreMoneyValuation < Phase5Requirements.ValuationMin)
                errors.Add($"Pre-money valuation must be >= {Phase5Requirements.ValuationMin}");

            var isEquity = string.Equals(company.ShareType, "preferred", StringComparison.OrdinalIgnoreCase);
            if (isEquity)
            {
                if (company.EquityOfferedPercent == null ||
                    !double.IsFinite(company.EquityOfferedPercent.Value) ||
                    company.EquityOfferedPercent <= Phase5Requirements.EquityOfferedMin ||
                    company.EquityOfferedPercent > Phase5Requirements.EquityOfferedMax)
                    errors.Add($"Equity offered must be between {Phase5Requirements.EquityOfferedMin} and {Phase5Requirements.EquityOfferedMax}%");
            }

            if (!Phase5Requirements.IsValidShareType(company.ShareType))
                errors.Add($"Share type must be one of: {string.Join(", ", Phase5Requirements.ShareTypeWhitelist)}");

            if (company.CapitalAllocation == null || company.CapitalAllocation.Count == 0)
            {
                errors.Add("Capital allocation breakdown is required");
            }
            else
            {
                errors.AddRange(Phase5Requirements.ValidateAllocationRows(company.CapitalAllocation));

                var allocationTotal = company.CapitalAllocation
                    .Where(c => c != null)
                    .Sum(c => c.Percent);
                if (!double.IsFinite(allocationTotal) ||
                    allocationTotal < Phase5Requirements.AllocationMinTotalPercent ||
                    allocationTotal > Phase5Requirements.AllocationMaxTotalPercent)
                    errors.Add($"Capital allocation must total 100% (currently {allocationTotal:F2}%)");
            }

            // Hiring plan is optional; if rows are provided, each row must be valid.
            if (company.ResourceMap?.HiringPlan != null && company.ResourceMap.HiringPlan.Count > 0)
            {
                errors.AddRange(Phase5Requirements.ValidateHiringPlanRows(company.ResourceMap.HiringPlan));
            }

            if (string.IsNullOrWhiteSpace(company.FundingNarrative) ||
                company.FundingNarrative.Trim().Length < Phase5Requirements.NarrativeMinLength)
                errors.Add($"Funding narrative must be at least {Phase5Requirements.NarrativeMinLength} characters");
            else if (company.FundingNarrative.Trim().Length > Phase5Requirements.NarrativeMaxLength)
                errors.Add($"Funding narrative must be at most {Phase5Requirements.NarrativeMaxLength} characters");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase6Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (!company.IsDataRoomLive)
                errors.Add("Data room must be published");

            var docs = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>();

            if (docs.Count == 0)
            {
                errors.Add("Data room must contain at least one document");
                return (false, errors);
            }

            if (docs.Count < Phase6Requirements.MinDocumentCount)
                errors.Add($"Data room must contain at least {Phase6Requirements.MinDocumentCount} documents (currently {docs.Count})");

            // Per-document shape integrity (defends against malformed metadata
            // written by a direct API spoof bypassing the controller validation).
            for (var i = 0; i < docs.Count; i++)
            {
                var d = docs[i];
                var label = string.IsNullOrWhiteSpace(d?.FileName) ? $"document #{i + 1}" : d.FileName;
                if (d == null) { errors.Add($"Document row #{i + 1} is null"); continue; }
                if (string.IsNullOrWhiteSpace(d.DocumentId))
                    errors.Add($"Document '{label}': documentId is missing");
                if (string.IsNullOrWhiteSpace(d.FileName))
                    errors.Add($"Document #{i + 1}: fileName is missing");
                if (string.IsNullOrWhiteSpace(d.StoragePath))
                    errors.Add($"Document '{label}': storagePath is missing (malformed upload)");
                if (d.FileSize <= 0)
                    errors.Add($"Document '{label}': fileSize must be > 0");
                if (!Phase6Requirements.IsAllowedCategory(d.Category))
                    errors.Add($"Document '{label}': category '{d.Category}' is not in the allowed whitelist");
            }

            // Required categories present (case-insensitive).
            var uploadedCategories = docs
                .Select(d => (d.Category ?? string.Empty).ToLowerInvariant())
                .Distinct()
                .ToList();
            var missingCategories = Phase6Requirements.RequiredCategories
                .Where(req => !uploadedCategories.Any(u => string.Equals(u, req, StringComparison.OrdinalIgnoreCase)))
                .ToList();
            if (missingCategories.Count > 0)
                errors.Add($"Missing required document categories: {string.Join(", ", missingCategories)}");

            // Access records: grants are optional. Malformed records must not persist.
            // Expired grants do NOT block Phase 6 completion (expired investors are blocked at runtime).
            var grants = company.DataRoomAccessRecords ?? new List<DataRoomAccessRecord>();
            for (var i = 0; i < grants.Count; i++)
            {
                var g = grants[i];
                if (g == null) continue;
                if (string.IsNullOrWhiteSpace(g.InvestorId))
                    errors.Add($"Access grant #{i + 1}: investorId is missing");
                if (string.IsNullOrWhiteSpace(g.AccessLevel))
                    errors.Add($"Access grant for investor '{g.InvestorId}': accessLevel is missing");
            }

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase7Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (company.AiReview == null)
            {
                errors.Add("Automated readiness review must be completed");
                return (false, errors);
            }

            if (!Phase7Requirements.MeetsAdvanceThreshold(company.AiReview.OverallScore))
                errors.Add($"Review score must be at least {Phase7Requirements.ScoreThresholdForAdvance} (currently {company.AiReview.OverallScore})");

            if (!company.AiReview.InvestorReadyBadge)
                errors.Add("Latest review did not award the investor-ready badge");

            if (!company.IsInvestorReady)
                errors.Add("Investor-ready badge has not been claimed/awarded");

            // Freshness — review must reflect the current company state and not predate recent material readiness input changes.
            var reviewedAt = company.LastAiReviewAt ?? company.AiReview.ReviewedAt;
            var lastChange = Phase7Requirements.GetReadinessInputsLastMaterialChangeAt(company);
            if (!Phase7Requirements.IsFreshEnough(reviewedAt, lastChange, now: null))
                errors.Add(
                    $"Review is stale (run at {reviewedAt:o}, max age {Phase7Requirements.MaxReviewAgeForAdvance.TotalDays:F0} days or material readiness input change at {lastChange:o}) — rerun before advancing");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase8Async(Companies company)
    {
        var errors = new List<string>();

        var matches = await _dbContext.InvestorMatches
            .Find(m => m.CompanyId == company.Id)
            .ToListAsync();

        if (matches.Count < Phase8Requirements.MinPersistedMatches)
        {
            errors.Add(
                $"Investor matching must have produced at least {Phase8Requirements.MinPersistedMatches} match before Phase 8 can advance (currently {matches.Count})");
            return (false, errors);
        }

        var hasMutualHandshake = matches.Any(m =>
            string.Equals(m.Status, "accepted", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(m.EntrepreneurInterest, "interested", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(m.InvestorInterest, "interested", StringComparison.OrdinalIgnoreCase) &&
            m.HandshakeConfirmedAt.HasValue);

        if (!hasMutualHandshake)
        {
            errors.Add("Phase 8 requires at least one confirmed mutual investor handshake before advancing to Phase 9.");
        }

        foreach (var m in matches)
        {
            // Structural shape
            if (string.IsNullOrWhiteSpace(m.InvestorId))
                errors.Add($"Match {m.Id} has no investorId (malformed row)");
            if (m.MatchScore < 0 || m.MatchScore > 100)
                errors.Add($"Match {m.Id} has out-of-range score {m.MatchScore}");
            if (!Phase8Requirements.IsValidMatchStatus(m.Status))
                errors.Add($"Match {m.Id} has invalid status '{m.Status}'");

            // Matcher-produced provenance gates — minimal hand-rolled rows
            // (status="new", score=80, nothing else) must NOT pass.
            if (string.IsNullOrWhiteSpace(m.MatchRationale))
                errors.Add($"Match {m.Id} is missing MatchRationale (not produced by the matcher)");
            if (!string.Equals(m.EngineVersion, InvestorMatcher.EngineVersion, StringComparison.Ordinal))
                errors.Add(
                    $"Match {m.Id} has unexpected engineVersion '{m.EngineVersion}' (expected '{InvestorMatcher.EngineVersion}')");
            if (!m.MatchedAt.HasValue)
                errors.Add($"Match {m.Id} has no MatchedAt timestamp (malformed row)");
            if (m.InvestorPreferences == null)
            {
                errors.Add($"Match {m.Id} has no investorPreferences snapshot");
            }
            else
            {
                var prefs = m.InvestorPreferences;
                var hasAnyPref =
                    (prefs.PreferredSectors?.Count > 0) ||
                    (prefs.PreferredStages?.Count > 0) ||
                    (prefs.PreferredGeographies?.Count > 0) ||
                    prefs.MaxInvestmentAmount > 0;
                if (!hasAnyPref)
                    errors.Add($"Match {m.Id}: investorPreferences snapshot is empty (matcher would have captured at least one field)");
            }

            // Investor must still be hydratable — guards against orphaned matches.
            if (!string.IsNullOrWhiteSpace(m.InvestorId))
            {
                var investorCursor = await _dbContext.Investors
                    .FindAsync(i => i.Id == m.InvestorId);
                var investorExists = await investorCursor.AnyAsync();
                if (!investorExists)
                    errors.Add($"Match {m.Id}: investor {m.InvestorId} no longer exists — rerun matching");
            }

            foreach (var i in m.Interactions ?? new List<InteractionRecord>())
            {
                if (!Phase8Requirements.IsValidInteractionType(i.Type))
                    errors.Add($"Match {m.Id} contains invalid interaction type '{i.Type}'");
            }
        }

        return (errors.Count == 0, errors);
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase9Async(Companies company)
    {
        var errors = new List<string>();

        var deals = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == company.Id)
            .ToListAsync();

        if (deals.Count < Phase9Requirements.MinDealsForCompletion)
        {
            errors.Add(
                $"At least {Phase9Requirements.MinDealsForCompletion} deal must exist (currently {deals.Count})");
            return (false, errors);
        }

        // All deal-status values on persisted rows must be in the whitelist.
        // Any pre-existing free-form status (e.g. "negotiation", "closed")
        // surfaces as a phase-advancement error so callers must migrate via
        // legal transitions, not via raw writes.
        foreach (var d in deals)
        {
            if (!Phase9Requirements.IsValidDealStatus(d.Status))
                errors.Add($"Deal {d.Id} has invalid status '{d.Status}'");

            foreach (var p in d.Investors ?? new List<DealParticipant>())
            {
                if (!Phase9Requirements.IsValidParticipantStatus(p.Status))
                    errors.Add($"Deal {d.Id} participant {p.InvestorId} has invalid status '{p.Status}'");
            }

            if (d.TermSheet != null && !string.IsNullOrWhiteSpace(d.TermSheet.Status) &&
                !Phase9Requirements.IsValidTermSheetStatus(d.TermSheet.Status))
                errors.Add($"Deal {d.Id} has invalid term sheet status '{d.TermSheet.Status}'");
        }

        // At least one deal must be in a successful terminal state.
        var hasTerminalSuccess = deals.Any(d =>
            Phase9Requirements.RequiredTerminalStatesForCompletion.Any(t =>
                string.Equals(t, d.Status, StringComparison.OrdinalIgnoreCase)));

        if (!hasTerminalSuccess)
            errors.Add(
                $"At least one deal must be in a terminal success state ({string.Join("/", Phase9Requirements.RequiredTerminalStatesForCompletion)}) before Phase 9 can advance");

        return (errors.Count == 0, errors);
    }
}
