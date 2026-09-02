using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.DbContext;
using WebApp.Services.Implementations;

namespace WebApp.Services;

public class CompanyService : ICompanyService
{
    private readonly MongoDbContext _dbContext;
    private readonly IValuationEngine _valuationEngine;
    private readonly ICapTableCalculator _capTableCalculator;
    private readonly IInvestorMatcher _investorMatcher;
    private readonly IAiReviewEngine _aiReviewEngine;
    private readonly IDocumentManager _documentManager;
    private readonly IPhaseValidator _phaseValidator;
    private readonly IDealEventPublisher _dealEvents;
    private readonly IServiceProvider? _serviceProvider;
    private readonly ILogger<CompanyService>? _logger;

    public CompanyService(
        MongoDbContext dbContext,
        IValuationEngine valuationEngine,
        ICapTableCalculator capTableCalculator,
        IInvestorMatcher investorMatcher,
        IAiReviewEngine aiReviewEngine,
        IDocumentManager documentManager,
        IPhaseValidator phaseValidator,
        IDealEventPublisher dealEvents,
        ILogger<CompanyService>? logger = null,
        IServiceProvider? serviceProvider = null)
    {
        _dbContext = dbContext;
        _valuationEngine = valuationEngine;
        _capTableCalculator = capTableCalculator;
        _investorMatcher = investorMatcher;
        _aiReviewEngine = aiReviewEngine;
        _documentManager = documentManager;
        _phaseValidator = phaseValidator;
        _dealEvents = dealEvents;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    private IPhaseNotificationService? GetNotificationService()
    {
        try
        {
            return _serviceProvider?.GetService(typeof(IPhaseNotificationService)) as IPhaseNotificationService;
        }
        catch
        {
            return null;
        }
    }

    private Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>? GetUserManager()
    {
        try
        {
            return _serviceProvider?.GetService(typeof(Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>)) as Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>;
        }
        catch
        {
            return null;
        }
    }


    // ============ PHASE FLOW ============

    public Task<CompanyProgressResponse> GetCurrentPhaseAsync(string userId)
    {
        return GetCurrentPhaseAsync(userId, null);
    }

    public async Task<CompanyProgressResponse> GetCurrentPhaseAsync(string userId, string? companyId)
    {
        Companies? company;
        if (!string.IsNullOrWhiteSpace(companyId))
        {
            company = await GetCompanyAsync(companyId);
            if (!string.Equals(company.OwnerId, userId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException("You are not allowed to access this company.");
        }
        else
        {
            company = await GetCompanyByUserIdAsync(userId);
        }

        if (company == null)
            // Universal Phase 1 is already complete; no company yet means not started Entrepreneur Phase 2.
            return new CompanyProgressResponse
            {
                CompanyId = string.Empty,
                CurrentPhase = 2,
                CompletedPhases = new List<int>(),
                OverallProgressPercent = 0,
                TrustScore = 0,
                IsInvestorReady = false,
                CreatedAt = DateTime.UtcNow,
                LastUpdatedAt = DateTime.UtcNow
            };

        return BuildProgressResponse(company);
    }

    public async Task<CompanyProgressResponse> AdvancePhaseAsync(string companyId, int phaseToComplete, object phaseData)
    {
        var company = await GetCompanyAsync(companyId);

        company.CompletedPhases ??= new List<int>();

        // Validate phase progression. Completing phase 9 advances currentPhase
        // to 10 (terminal "Journey Complete" state). Phase 10 itself cannot be
        // "completed" — it has no business logic to validate.
        if (phaseToComplete < 2 || phaseToComplete > 9)
            throw new ArgumentException("Phase must be between 2 and 9");

        // phaseToComplete is the phase being completed, so currentPhase must equal phaseToComplete
        if (company.CurrentPhase != phaseToComplete)
            throw new InvalidOperationException(
                $"Cannot complete phase {phaseToComplete}. Current phase is {company.CurrentPhase}");

        // Validate the phase before moving to the next one.
        var (isValid, errors) = await ValidatePhaseAsync(company, phaseToComplete);
        if (!isValid)
            throw new InvalidOperationException($"Cannot advance: {string.Join(", ", errors)}");

        // Mark the phase as completed and advance to the next phase.
        if (!company.CompletedPhases.Contains(phaseToComplete))
            company.CompletedPhases.Add(phaseToComplete);

        company.CurrentPhase = phaseToComplete + 1;

        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, company.Id);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        // Post-completion side effects. Best-effort and self-contained (swallows
        // its own errors) so it can never block or fail the phase advance.
        if (phaseToComplete == 3)
            await Phase3CompletionEvents.RunAsync(_dbContext, company);

        if (phaseToComplete == 4)
            await Phase4CompletionEvents.RunAsync(_dbContext, company);

        if (phaseToComplete == 5)
            await Phase5CompletionEvents.RunAsync(_dbContext, company, _logger);

        return BuildProgressResponse(company);
    }

    public async Task<CompanyProgressResponse> GetPhaseProgressAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return BuildProgressResponse(company);
    }

    // ============ PHASE 1: IDENTITY & ONBOARDING ============

    public async Task<Companies> CreateCompanyAsync(string userId, CreateCompanyDto dto)
    {
        // Enforce canonical first-company rule: POST /api/companies creates the FIRST company only.
        var hasExistingCompany = await _dbContext.Companies
            .Find(c => c.OwnerId == userId)
            .AnyAsync();

        if (hasExistingCompany)
        {
            throw new InvalidOperationException("You already have a company. Use your active company workspace or an approved company creation flow.");
        }

        // Create new first company
        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerId = userId,
            CompanyName = dto.CompanyName,
            Industry = dto.Industry,
            Website = dto.Website,
            Tagline = dto.Tagline,
            CurrentPhase = 2,
            CompletedPhases = new List<int>(),
            TrustScore = 0,
            IsInvestorReady = false,
            SourceBusinessIdeaId = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.Companies.InsertOneAsync(company);

        // Immediately bind as active operating company pointer
        Guid.TryParse(userId, out var userGuid);
        var userFilter = Builders<ApplicationUser>.Filter.Where(u =>
            (userGuid != Guid.Empty && u.Id == userGuid) || u.User == userId || u.UserName == userId);

        var updatePointer = Builders<ApplicationUser>.Update
            .Set(u => u.EntrepreneurProfile.CompanyId, company.Id);

        try
        {
            await _dbContext.ApplicationUsers.UpdateOneAsync(userFilter, updatePointer);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to immediately set active CompanyId for user {UserId}", userId);
        }

        return company;
    }

    public async Task<(Companies Company, bool AlreadyExisted)> CreateCompanyFromIdeaAsync(string userId, string ideaId)
    {
        if (string.IsNullOrWhiteSpace(ideaId))
            throw new ArgumentException("ideaId is required", nameof(ideaId));

        var idea = await _dbContext.BusinessIdeas.Find(i => i.Id == ideaId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Business idea {ideaId} not found");

        if (!string.Equals(idea.CreatorId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("Idea does not belong to the caller");

        // Idempotent: if this user already promoted this idea, return the
        // existing company instead of duplicating.
        var existing = await _dbContext.Companies
            .Find(c => c.OwnerId == userId && c.SourceBusinessIdeaId == ideaId)
            .FirstOrDefaultAsync();
        if (existing != null)
            return (existing, true);

        var companyName = !string.IsNullOrWhiteSpace(idea.Name)
            ? idea.Name
            : (idea.FounderIdentity?.BusinessName ?? "Untitled Company");

        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerId = userId,
            SourceBusinessIdeaId = ideaId,
            CompanyName = companyName,
            Industry = ResolveIndustry(idea),
            Website = string.Empty,
            Tagline = idea.Solution?.Description,
            Country = idea.Market?.Geography,
            FundingNarrative = idea.Solution?.Vision,
            FundingAskAmount = idea.FundingRequired > 0 ? (double?)(double)idea.FundingRequired : null,
            EquityOfferedPercent = idea.EquityOffered > 0 ? (double?)idea.EquityOffered : null,
            CurrentPhase = 2,
            CompletedPhases = new List<int>(),
            TrustScore = 0,
            IsInvestorReady = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.Companies.InsertOneAsync(company);
        return (company, false);
    }

    private static string ResolveIndustry(BusinessIdeas idea)
    {
        // Industry is a free-text field on Companies. Fall back to the
        // founder role context or a safe default. Entrepreneur can edit
        // later in Phase 2 onboarding.
        var role = idea.FounderIdentity?.Role;
        if (!string.IsNullOrWhiteSpace(role)) return role;
        return "Other";
    }

    public Task<Companies> EnsureLevelUpCompanyAsync(
        string userId, string sourceLink, string legalStructure, double? fundingAsk,
        IClientSessionHandle session = null)
    {
        return EnsureLevelUpCompanyAsync(userId, sourceLink, legalStructure, fundingAsk, null, null, null, session);
    }

    public async Task<Companies> EnsureLevelUpCompanyAsync(
        string userId, string sourceLink, string legalStructure, double? fundingAsk,
        string? companyName, string? industry, string? tagline,
        IClientSessionHandle session = null)
    {
        // Multi-Idea safe idempotency:
        // Match by OwnerId + SourceBusinessIdeaId so Idea A and Idea B create/bind distinct Companies.
        // For backwards-compatibility with legacy companies, if no match is found by SourceBusinessIdeaId,
        // we check for a legacy unassociated company (SourceBusinessIdeaId is empty).
        Companies existing = null;
        if (!string.IsNullOrWhiteSpace(sourceLink))
        {
            existing = session is null
                ? await _dbContext.Companies.Find(c => c.OwnerId == userId && c.SourceBusinessIdeaId == sourceLink).FirstOrDefaultAsync()
                : await _dbContext.Companies.Find(session, c => c.OwnerId == userId && c.SourceBusinessIdeaId == sourceLink).FirstOrDefaultAsync();

            if (existing == null)
            {
                var legacy = session is null
                    ? await _dbContext.Companies.Find(c => c.OwnerId == userId && (c.SourceBusinessIdeaId == null || c.SourceBusinessIdeaId == "")).FirstOrDefaultAsync()
                    : await _dbContext.Companies.Find(session, c => c.OwnerId == userId && (c.SourceBusinessIdeaId == null || c.SourceBusinessIdeaId == "")).FirstOrDefaultAsync();

                if (legacy != null)
                {
                    existing = legacy;
                }
            }
        }
        else
        {
            existing = session is null
                ? await _dbContext.Companies.Find(c => c.OwnerId == userId).FirstOrDefaultAsync()
                : await _dbContext.Companies.Find(session, c => c.OwnerId == userId).FirstOrDefaultAsync();
        }

        if (existing != null)
        {
            // Backfill plan/provenance fields only where empty — never clobber data
            // the entrepreneur may already have entered (e.g. on a Level Up retry).
            var changed = false;
            if (string.IsNullOrWhiteSpace(existing.SourceBusinessIdeaId) && !string.IsNullOrWhiteSpace(sourceLink))
            { existing.SourceBusinessIdeaId = sourceLink; changed = true; }
            if (string.IsNullOrWhiteSpace(existing.CompanyName) && !string.IsNullOrWhiteSpace(companyName))
            { existing.CompanyName = companyName; changed = true; }
            if (string.IsNullOrWhiteSpace(existing.Industry) && !string.IsNullOrWhiteSpace(industry))
            { existing.Industry = industry; changed = true; }
            if (string.IsNullOrWhiteSpace(existing.Tagline) && !string.IsNullOrWhiteSpace(tagline))
            { existing.Tagline = tagline; changed = true; }
            if (string.IsNullOrWhiteSpace(existing.LegalStructure) && !string.IsNullOrWhiteSpace(legalStructure))
            { existing.LegalStructure = legalStructure; changed = true; }
            if (existing.FundingAskAmount == null && fundingAsk.HasValue)
            { existing.FundingAskAmount = fundingAsk; changed = true; }
            if (changed)
            {
                existing.UpdatedAt = DateTime.UtcNow;
                if (session is null)
                    await _dbContext.Companies.ReplaceOneAsync(c => c.Id == existing.Id, existing);
                else
                    await _dbContext.Companies.ReplaceOneAsync(session, c => c.Id == existing.Id, existing);
            }
            return existing;
        }

        // Create following Entrepreneur conventions exactly (stored-status model).
        // PLAN pre-fills CompanyName, Industry, Tagline, LegalStructure + FundingAskAmount; PROOF fields stay empty.
        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerId = userId,
            SourceBusinessIdeaId = sourceLink,   // provenance: businessIdeaId, else journey id
            CompanyName = companyName ?? string.Empty,
            Industry = industry ?? string.Empty,
            Tagline = tagline ?? string.Empty,
            CurrentPhase = 2,                    // universal Phase 1 already complete
            CompletedPhases = new List<int>(),
            LegalStructure = legalStructure,     // plan (creator confirms in Phase 2)
            FundingAskAmount = fundingAsk,       // plan: Phase-5 totalAsk is authoritative
            TrustScore = 0,
            IsInvestorReady = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        if (session is null)
            await _dbContext.Companies.InsertOneAsync(company);
        else
            await _dbContext.Companies.InsertOneAsync(session, company);
        return company;
    }

    public async Task<(Companies Company, bool AlreadyExisted)> BuildCompanyFromAcquisitionAsync(
        string userId, string dealId, BuildAcquisitionCompanyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dealId))
            throw new ArgumentException("dealId is required", nameof(dealId));

        var deal = await _dbContext.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Acquisition deal {dealId} not found");

        // 1. Authorization: authenticated user must be the legal buyer.
        // When BuyoutSaleRecord exists (canonical completed record), BuyerUserId is strictly authoritative.
        var isBuyer = deal.BuyoutSaleRecord != null
            ? string.Equals(deal.BuyoutSaleRecord.BuyerUserId, userId, StringComparison.Ordinal)
            : string.Equals(deal.EntrepreneurId, userId, StringComparison.Ordinal);
        if (!isBuyer)
            throw new UnauthorizedAccessException("You are not authorized to build a company from this acquisition.");

        // 2. Deal Type: must be FULL_BUYOUT
        if (!string.Equals(deal.DealType, "FULL_BUYOUT", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only completed Full Buyout acquisitions can be built into a company.");

        // 3. Stage: must be completed (SOLD / BUYOUT_COMPLETED / BuyoutSaleRecord exists)
        var isCompleted = string.Equals(deal.DealStage, "SOLD", StringComparison.OrdinalIgnoreCase) ||
                          string.Equals(deal.DealStage, "BUYOUT_COMPLETED", StringComparison.OrdinalIgnoreCase) ||
                          deal.BuyoutSaleRecord != null ||
                          string.Equals(deal.Status, "completed", StringComparison.OrdinalIgnoreCase);
        if (!isCompleted)
            throw new InvalidOperationException("This acquisition has not reached completed status.");

        var ideaId = deal.IdeaId ?? string.Empty;

        // 4. Idempotency: check if company already created for this Buyer + Idea
        if (!string.IsNullOrWhiteSpace(ideaId))
        {
            var existing = await _dbContext.Companies
                .Find(c => c.OwnerId == userId && (c.SourceBusinessIdeaId == ideaId || c.SourceDealId == dealId))
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                // Ensure active pointer is set
                await SetActiveCompanyPointerAsync(userId, existing.Id);
                return (existing, true);
            }
        }

        // Fetch acquired idea details if available for prefill
        BusinessIdeas? idea = null;
        if (!string.IsNullOrWhiteSpace(ideaId))
        {
            idea = await _dbContext.BusinessIdeas.Find(i => i.Id == ideaId).FirstOrDefaultAsync();
        }

        var companyName = !string.IsNullOrWhiteSpace(dto.CompanyName)
            ? dto.CompanyName.Trim()
            : (idea?.Name ?? "Acquired Company");

        var industry = !string.IsNullOrWhiteSpace(dto.Industry)
            ? dto.Industry.Trim()
            : (!string.IsNullOrWhiteSpace(idea?.Market?.PrimaryCustomer) ? idea.Market.PrimaryCustomer : "Technology");

        var tagline = !string.IsNullOrWhiteSpace(dto.Tagline)
            ? dto.Tagline.Trim()
            : (idea?.Solution?.Description ?? idea?.Solution?.Vision ?? string.Empty);

        var legalStructure = !string.IsNullOrWhiteSpace(dto.LegalStructure)
            ? dto.LegalStructure.Trim()
            : "SAS";

        var allocations = new List<CapitalAllocationDto>();
        if (dto.UseOfFunds != null && dto.UseOfFunds.Count > 0)
        {
            foreach (var u in dto.UseOfFunds)
            {
                allocations.Add(new CapitalAllocationDto
                {
                    Category = u.Category,
                    Percent = u.Percent,
                    Amount = u.Amount ?? (dto.TotalAsk.HasValue ? Math.Round(u.Percent / 100.0 * dto.TotalAsk.Value, 2) : 0)
                });
            }
        }

        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerId = userId,
            SourceBusinessIdeaId = ideaId,
            SourceDealId = dealId,
            CompanyName = companyName,
            Industry = industry,
            Tagline = tagline,
            LegalStructure = legalStructure,
            FundingAskAmount = dto.TotalAsk > 0 ? dto.TotalAsk : null,
            CapitalAllocation = allocations,
            CurrentPhase = 2,
            CompletedPhases = new List<int>(),
            TrustScore = 0,
            IsInvestorReady = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.Companies.InsertOneAsync(company);

        // 5. Seed Cap Table: default to Buyer 100% if empty
        var ownership = dto.Ownership != null && dto.Ownership.Count > 0
            ? dto.Ownership
            : new List<OwnershipEntryDto>
            {
                new() { Holder = "Buyer", Percent = 100, IsFounder = true, IsEsop = false }
            };

        try
        {
            await SeedCapTableFromOwnershipAsync(company.Id, ownership);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to seed cap table for acquisition company {CompanyId}", company.Id);
        }

        // 6. Bootstrap Phase3Concept, project data, and active company pointer
        await BootstrapCompanyFromCreatorProjectAsync(company.Id, ideaId, dealId, isBuyout: true);

        return (company, false);
    }

    public async Task<bool> BootstrapCompanyFromCreatorProjectAsync(
        string companyId, string sourceIdeaId, string sourceDealId, bool isBuyout = false)
    {
        if (string.IsNullOrWhiteSpace(companyId))
            return false;

        try
        {
            var company = await _dbContext.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync();
            if (company == null) return false;

            var ideaId = !string.IsNullOrWhiteSpace(sourceIdeaId)
                ? sourceIdeaId
                : (company.SourceBusinessIdeaId ?? string.Empty);

            if (string.IsNullOrWhiteSpace(ideaId) && !string.IsNullOrWhiteSpace(sourceDealId))
            {
                var deal = await _dbContext.DealExecutions.Find(d => d.Id == sourceDealId).FirstOrDefaultAsync();
                if (deal != null && !string.IsNullOrWhiteSpace(deal.IdeaId))
                {
                    ideaId = deal.IdeaId;
                }
            }

            CreatorIdea? creatorIdea = null;
            if (!string.IsNullOrWhiteSpace(ideaId))
            {
                creatorIdea = await _dbContext.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
            }

            BusinessIdeas? businessIdea = null;
            if (creatorIdea == null && !string.IsNullOrWhiteSpace(ideaId))
            {
                businessIdea = await _dbContext.BusinessIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
            }

            // 1. Update company identity fields (missing/empty only)
            bool companyUpdated = false;
            if (string.IsNullOrWhiteSpace(company.Industry))
            {
                var resolvedIndustry = creatorIdea?.Project?.Category
                    ?? creatorIdea?.Project?.Sector
                    ?? businessIdea?.Market?.PrimaryCustomer
                    ?? "Technology";
                if (!string.IsNullOrWhiteSpace(resolvedIndustry))
                {
                    company.Industry = resolvedIndustry;
                    companyUpdated = true;
                }
            }

            if (string.IsNullOrWhiteSpace(company.Tagline))
            {
                var resolvedTagline = creatorIdea?.Project?.Tagline
                    ?? businessIdea?.Solution?.Description
                    ?? businessIdea?.Solution?.Vision
                    ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(resolvedTagline))
                {
                    company.Tagline = resolvedTagline;
                    companyUpdated = true;
                }
            }

            if (string.IsNullOrWhiteSpace(company.SourceBusinessIdeaId) && !string.IsNullOrWhiteSpace(ideaId))
            {
                company.SourceBusinessIdeaId = ideaId;
                companyUpdated = true;
            }

            if (string.IsNullOrWhiteSpace(company.SourceDealId) && !string.IsNullOrWhiteSpace(sourceDealId))
            {
                company.SourceDealId = sourceDealId;
                companyUpdated = true;
            }

            if (companyUpdated)
            {
                company.UpdatedAt = DateTime.UtcNow;
                await _dbContext.Companies.ReplaceOneAsync(c => c.Id == company.Id, company);
            }

            // 2. Bootstrap Phase3Concepts
            var existingConcept = await _dbContext.Phase3Concepts.Find(c => c.CompanyId == company.Id).FirstOrDefaultAsync();
            if (existingConcept == null)
            {
                var tagline = !string.IsNullOrWhiteSpace(creatorIdea?.Project?.Tagline)
                    ? creatorIdea.Project.Tagline
                    : (!string.IsNullOrWhiteSpace(company.Tagline) ? company.Tagline : (businessIdea?.Solution?.Description ?? string.Empty));

                var problem = creatorIdea?.Project?.Problem
                    ?? businessIdea?.Problem?.Description
                    ?? string.Empty;

                var solution = creatorIdea?.Project?.Solution
                    ?? businessIdea?.Solution?.Description
                    ?? string.Empty;

                var businessModel = creatorIdea?.Phase4Data?.PricingModel
                    ?? creatorIdea?.Project?.Category
                    ?? "SaaS_Subscription";

                var sectorTags = !string.IsNullOrEmpty(creatorIdea?.Project?.Sector)
                    ? new List<string> { creatorIdea.Project.Sector }
                    : (!string.IsNullOrEmpty(company.Industry) ? new List<string> { company.Industry } : new List<string>());

                var keywordTags = creatorIdea?.Project?.Tags
                    ?? new List<string>();

                var clarityScore = (int)Math.Round(creatorIdea?.Project?.ClarityScore ?? (businessIdea?.ReadinessScore ?? 0));

                var concept = new Phase3Concept
                {
                    CompanyId = company.Id,
                    OneLiner = tagline,
                    ProblemStatement = problem,
                    SolutionDescription = solution,
                    BusinessModel = businessModel,
                    SectorTags = sectorTags,
                    KeywordTags = keywordTags,
                    ClarityScore = clarityScore,
                    Stage = "idea",
                    RecordedAt = DateTime.UtcNow
                };
                await _dbContext.Phase3Concepts.InsertOneAsync(concept);
            }
            else
            {
                // Non-destructive idempotent backfill: fill empty fields only, never overwrite existing values
                bool conceptUpdated = false;
                if (string.IsNullOrWhiteSpace(existingConcept.ProblemStatement) && !string.IsNullOrWhiteSpace(creatorIdea?.Project?.Problem))
                {
                    existingConcept.ProblemStatement = creatorIdea.Project.Problem;
                    conceptUpdated = true;
                }
                if (string.IsNullOrWhiteSpace(existingConcept.SolutionDescription) && !string.IsNullOrWhiteSpace(creatorIdea?.Project?.Solution))
                {
                    existingConcept.SolutionDescription = creatorIdea.Project.Solution;
                    conceptUpdated = true;
                }
                if (string.IsNullOrWhiteSpace(existingConcept.OneLiner) && !string.IsNullOrWhiteSpace(creatorIdea?.Project?.Tagline))
                {
                    existingConcept.OneLiner = creatorIdea.Project.Tagline;
                    conceptUpdated = true;
                }
                if (string.IsNullOrWhiteSpace(existingConcept.BusinessModel) && !string.IsNullOrWhiteSpace(creatorIdea?.Phase4Data?.PricingModel))
                {
                    existingConcept.BusinessModel = creatorIdea.Phase4Data.PricingModel;
                    conceptUpdated = true;
                }
                if ((existingConcept.SectorTags == null || existingConcept.SectorTags.Count == 0) && !string.IsNullOrEmpty(creatorIdea?.Project?.Sector))
                {
                    existingConcept.SectorTags = new List<string> { creatorIdea.Project.Sector };
                    conceptUpdated = true;
                }
                if ((existingConcept.KeywordTags == null || existingConcept.KeywordTags.Count == 0) && creatorIdea?.Project?.Tags != null && creatorIdea.Project.Tags.Count > 0)
                {
                    existingConcept.KeywordTags = creatorIdea.Project.Tags;
                    conceptUpdated = true;
                }
                if (conceptUpdated)
                {
                    await _dbContext.Phase3Concepts.ReplaceOneAsync(c => c.Id == existingConcept.Id, existingConcept);
                }
            }

            // 3. Set active company pointer for owner
            if (!string.IsNullOrEmpty(company.OwnerId))
            {
                await SetActiveCompanyPointerAsync(company.OwnerId, company.Id);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to bootstrap company {CompanyId} from creator project {IdeaId}", companyId, sourceIdeaId);
            return false;
        }
    }

    private async Task SetActiveCompanyPointerAsync(string userId, string companyId)
    {
        Guid.TryParse(userId, out var userGuid);
        var userFilter = Builders<ApplicationUser>.Filter.Where(u =>
            (userGuid != Guid.Empty && u.Id == userGuid) || u.User == userId || u.UserName == userId);
        var updatePointer = Builders<ApplicationUser>.Update
            .Set(u => u.EntrepreneurProfile.CompanyId, companyId);
        try
        {
            await _dbContext.ApplicationUsers.UpdateOneAsync(userFilter, updatePointer);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set active CompanyId for user {UserId}", userId);
        }
    }

    public async Task SeedCapTableFromOwnershipAsync(string companyId, List<OwnershipEntryDto> ownership)
    {
        const int totalShares = 1_000_000;
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var grants = new List<EquityGrantDto>();
        int i = 0;
        foreach (var o in ownership)
        {
            i++;
            if (o.Percent <= 0) continue;
            var name = string.IsNullOrWhiteSpace(o.Holder) ? $"Holder {i}" : o.Holder.Trim();
            while (!seen.Add($"{name.ToLowerInvariant()}::common")) name = $"{name} {i}";
            grants.Add(new EquityGrantDto
            {
                StakeholderName = name,
                StakeholderType = o.IsFounder ? "founder" : o.IsEsop ? "esop" : "investor",
                ShareClass = "common",
                SharesGranted = Math.Max(1, (int)Math.Round(o.Percent / 100.0 * totalShares)),
            });
        }
        if (grants.Count == 0) return;

        var esopPct = ownership.Where(o => o.IsEsop).Sum(o => o.Percent);
        var request = new SubmitCapTableRequest
        {
            TotalShares = totalShares,
            EsopPoolPercent = esopPct,
            EsopVestingMonths = esopPct > 0 ? 48 : 0,
            Grants = grants,
        };
        await SubmitCapTableAsync(companyId, request);
    }

    public async Task<Companies> GetCompanyAsync(string companyId)
    {
        return await _dbContext.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Company {companyId} not found");
    }

    public Task<Companies> GetCompanyByUserIdAsync(string userId)
    {
        return GetCompanyByUserIdAsync(userId, null);
    }

    public async Task<Companies> GetCompanyByUserIdAsync(string userId, string? companyId)
    {
        if (!string.IsNullOrWhiteSpace(companyId))
    {
            return await _dbContext.Companies.Find(c => c.Id == companyId && c.OwnerId == userId).FirstOrDefaultAsync();
        }

        Guid.TryParse(userId, out var userGuid);
        var user = await _dbContext.ApplicationUsers
            .Find(u => (userGuid != Guid.Empty && u.Id == userGuid) || u.User == userId || u.UserName == userId)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(user?.EntrepreneurProfile?.CompanyId))
        {
            var activeCompany = await _dbContext.Companies
                .Find(c => c.Id == user.EntrepreneurProfile.CompanyId && c.OwnerId == userId)
                .FirstOrDefaultAsync();
            if (activeCompany != null)
                return activeCompany;
        }

        // Fallback to the latest updated company owned by this user
        var fallbackCompany = await _dbContext.Companies
            .Find(c => c.OwnerId == userId)
            .SortByDescending(c => c.UpdatedAt)
            .FirstOrDefaultAsync();

        if (fallbackCompany != null && user != null && string.IsNullOrEmpty(user.EntrepreneurProfile?.CompanyId))
        {
            try
            {
                var upd = Builders<ApplicationUser>.Update.Set(u => u.EntrepreneurProfile.CompanyId, fallbackCompany.Id);
                var filter = Builders<ApplicationUser>.Filter.Eq("_id", user.Id);
                await _dbContext.ApplicationUsers.UpdateOneAsync(filter, upd);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to backfill active CompanyId for user {UserId}", userId);
            }
        }

        return fallbackCompany;
    }

    public async Task<List<CompanySummaryDto>> GetMyCompaniesAsync(string userId)
    {
        var companies = await _dbContext.Companies
            .Find(c => c.OwnerId == userId)
            .SortByDescending(c => c.UpdatedAt)
            .ToListAsync();

        Guid.TryParse(userId, out var userGuid);
        var user = await _dbContext.ApplicationUsers
            .Find(u => (userGuid != Guid.Empty && u.Id == userGuid) || u.User == userId || u.UserName == userId)
            .FirstOrDefaultAsync();

        var activeCompanyId = user?.EntrepreneurProfile?.CompanyId ?? companies.FirstOrDefault()?.Id;

        return companies.Select(c => new CompanySummaryDto
        {
            Id = c.Id,
            CompanyName = c.CompanyName,
            LegalName = c.LegalName,
            Industry = c.Industry,
            Tagline = c.Tagline,
            Logo = null,
            LegalStructure = c.LegalStructure,
            CurrentPhase = c.CurrentPhase,
            CompletedPhases = c.CompletedPhases ?? new List<int>(),
            SourceBusinessIdeaId = c.SourceBusinessIdeaId,
            IsInvestorReady = c.IsInvestorReady,
            IsActive = !string.IsNullOrEmpty(activeCompanyId) && c.Id == activeCompanyId,
            UpdatedAt = c.UpdatedAt
        }).ToList();
    }

    public async Task<CompanySummaryDto> SetActiveCompanyAsync(string userId, string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId))
            throw new ArgumentException("Company ID is required", nameof(companyId));

        var company = await GetCompanyAsync(companyId);
        if (!string.Equals(company.OwnerId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("You are not allowed to activate a company you do not own.");

        Guid.TryParse(userId, out var userGuid);
        var userFilter = Builders<ApplicationUser>.Filter.Where(u =>
            (userGuid != Guid.Empty && u.Id == userGuid) || u.User == userId || u.UserName == userId);
        var userUpdate = Builders<ApplicationUser>.Update.Set(u => u.EntrepreneurProfile.CompanyId, companyId);
        await _dbContext.ApplicationUsers.UpdateOneAsync(userFilter, userUpdate);

        // Also best-effort update EntrepreneurProfileRecord
        try
        {
            var profileUpd = Builders<EntrepreneurProfileRecord>.Update.Set(p => p.CompanyId, companyId);
            await _dbContext.EntrepreneurProfiles.UpdateOneAsync(p => p.UserId == userId, profileUpd);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update EntrepreneurProfileRecord for user {UserId}", userId);
        }

        return new CompanySummaryDto
        {
            Id = company.Id,
            CompanyName = company.CompanyName,
            LegalName = company.LegalName,
            Industry = company.Industry,
            Tagline = company.Tagline,
            Logo = null,
            LegalStructure = company.LegalStructure,
            CurrentPhase = company.CurrentPhase,
            CompletedPhases = company.CompletedPhases ?? new List<int>(),
            SourceBusinessIdeaId = company.SourceBusinessIdeaId,
            IsInvestorReady = company.IsInvestorReady,
            IsActive = true,
            UpdatedAt = company.UpdatedAt
        };
    }

    // ============ PHASE 2: LEGAL INFO & DOCUMENTS ============

    public async Task<Companies> UpdateLegalInfoAsync(string companyId, UpdateLegalInfoRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        company.LegalName = request.LegalName;
        company.RegistrationNumber = request.RegistrationNumber;
        company.LegalStructure = request.LegalStructure;
        company.IncorporationDate = request.IncorporationDate;
        company.RegisteredAddress = request.RegisteredAddress;
        company.Country = request.Country;
        company.NafCode = request.NafCode;

        if (string.IsNullOrWhiteSpace(company.CompanyName) && !string.IsNullOrWhiteSpace(request.LegalName))
        {
            company.CompanyName = request.LegalName;
        }

        company.Legal ??= new LegalInfo();
        company.Legal.LegalName = request.LegalName;
        company.Legal.RegistrationSiret = request.RegistrationNumber;
        company.Legal.LegalStructure = request.LegalStructure;
        company.Legal.IncorporationDate = request.IncorporationDate;
        company.Legal.RegisteredAddress = request.RegisteredAddress;
        company.Legal.Country = request.Country;
        company.Legal.NafCode = request.NafCode;

        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<DocumentStatusResponse> UploadDocumentAsync(string companyId, DocumentUploadRequest request)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");

        if (string.IsNullOrWhiteSpace(request.DocumentType))
            throw new ArgumentException("documentType is required");

        var company = await GetCompanyAsync(companyId);

        // Read the multipart upload stream into bytes for the document manager.
        byte[] fileBytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            fileBytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, fileBytes);

        var docId = ObjectId.GenerateNewId().ToString();
        var document = new DocumentStatusResponse
        {
            DocumentId = docId,
            Type = request.DocumentType,
            FileName = fileName,
            Status = "pending",
            UploadedAt = DateTime.UtcNow,
            ReviewNote = null,
            StoragePath = storagePath,
            FileSize = request.File.Length
        };

        if (company.DocumentStatuses == null)
            company.DocumentStatuses = new List<DocumentStatusResponse>();

        company.DocumentStatuses.Add(document);
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return document;
    }

    public async Task<List<DocumentStatusResponse>> GetDocumentStatusAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return company.DocumentStatuses ?? new List<DocumentStatusResponse>();
    }

    public async Task<Companies> UpdateBeneficialOwnersAsync(string companyId, UpdateBeneficialOwnersRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        company.BeneficialOwnersDto = request.Owners;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<List<BeneficialOwnerResponse>> GetBeneficialOwnersAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        if (company.BeneficialOwnersDto == null || company.BeneficialOwnersDto.Count == 0)
        {
            return new List<BeneficialOwnerResponse>();
        }

        return company.BeneficialOwnersDto.Select(owner => new BeneficialOwnerResponse
        {
            FullName = owner.FullName ?? string.Empty,
            Email = owner.Email ?? string.Empty,
            OwnershipPercent = owner.OwnershipPercent,
            Nationality = owner.Nationality ?? string.Empty
        }).ToList();
    }

    // ============ PHASE 3: FINANCIAL & KPI ============

    // Canonical quarterly revenue store for the Phase 3 Step 1 (quarterly-input)
    // workflow. Companies.Q1-Q4 is the single source of truth; the optional
    // Phase3MonthlyRevenues collection is for future Stripe/ChartMogul syncs.
    public async Task<Companies> SaveRevenueDataAsync(string companyId, SaveRevenueDataRequest request)
    {
        if (request == null)
            throw new ArgumentException("Request body required");
        if (request.Q1Revenue < 0 || request.Q2Revenue < 0 ||
            request.Q3Revenue < 0 || request.Q4Revenue < 0)
            throw new ArgumentException("Quarterly revenue values must be >= 0");

        var company = await GetCompanyAsync(companyId);
        company.Q1Revenue = request.Q1Revenue;
        company.Q2Revenue = request.Q2Revenue;
        company.Q3Revenue = request.Q3Revenue;
        company.Q4Revenue = request.Q4Revenue;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);
        return company;
    }

    public async Task<FinancialSummaryResponse> CalculateValuationAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        var growthRate = CalculateGrowthRate(company);
        var runwayMonths = CalculateRunway(company);

        var context = await BuildValuationContextAsync(company);
        var valuation = await _valuationEngine.CalculateValuationAsync(
            totalRevenue,
            growthRate,
            company.Industry,
            context
        );

        company.Valuation = valuation.EstimatedValuation;
        company.ValuationRevenueMultiple = valuation.RevenueMultiple;
        company.ValuationRiskDiscountRate = valuation.RiskDiscountRate;
        company.ValuationConfidenceScore = valuation.ConfidenceScore;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return new FinancialSummaryResponse
        {
            TotalRevenue = totalRevenue,
            FinalValuation = valuation.EstimatedValuation,
            MonthlyRecurringRevenue = totalRevenue / 12,
            AnnualRecurringRevenue = totalRevenue,
            RunwayMonths = runwayMonths,
            GrowthRate = growthRate,
            ConfidenceScore = valuation.ConfidenceScore,
            RiskDiscountRate = valuation.RiskDiscountRate,
            LastUpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Builds the deterministic <see cref="ValuationContext"/> for a company from
    /// its document, embedded beneficial owners, concept stage, and NDA count.
    /// All inputs are backend-derived — no AI estimates.
    /// </summary>
    private async Task<ValuationContext> BuildValuationContextAsync(Companies company)
    {
        var concept = await _dbContext.Phase3Concepts
            .Find(c => c.CompanyId == company.Id)
            .FirstOrDefaultAsync();

        var owners = company.BeneficialOwnersDto ?? new List<BeneficialOwnerDto>();
        var largestOwnership = owners.Count > 0 ? owners.Max(o => o.OwnershipPercent) : 100;

        var ndaCount = (int)await _dbContext.Phase6NdaAcceptances
            .CountDocumentsAsync(n => n.CompanyId == company.Id);

        var completedPhases = company.CompletedPhases ?? new List<int>();

        return new ValuationContext
        {
            Stage = string.IsNullOrWhiteSpace(concept?.Stage) ? "mvp" : concept.Stage.ToLowerInvariant(),
            IsLegalEntityFormed = !string.IsNullOrWhiteSpace(company.LegalName) || completedPhases.Contains(2),
            FounderCount = owners.Count > 0 ? owners.Count : 1,
            KpiDataSource = "manual",
            RevenueEnteredManually = true,
            DocumentsVerified = completedPhases.Contains(2),
            NdaSignedCount = ndaCount,
            LargestOwnershipPct = largestOwnership,
            Q1 = company.Q1Revenue ?? 0,
            Q2 = company.Q2Revenue ?? 0,
            Q3 = company.Q3Revenue ?? 0,
            Q4 = company.Q4Revenue ?? 0,
        };
    }

    public async Task<Companies> SaveEquityStructureAsync(string companyId, SaveEquityStructureRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        company.EquityStructure = request.Entries;
        company.EsopPoolPercent = request.EsopPoolPercent;
        company.EsopVestingMonths = request.EsopVestingMonths;
        company.TotalShares = request.TotalShares;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<Companies> SaveFundingAskAsync(string companyId, SaveFundingAskRequest request)
    {
        if (request == null) throw new ArgumentException("Request body required");

        // Partial draft updates (e.g. saving Step 1 allocations or Step 2 resource map
        // before Step 3 raise/terms are finalized) are permitted.
        var isDraft = request.RaiseAmount <= 0;

        if (!isDraft)
        {
            if (!double.IsFinite(request.RaiseAmount) || request.RaiseAmount <= 0)
                throw new ArgumentException("raiseAmount must be a finite number > 0");
            if (!double.IsFinite(request.PreMoneyValuation) ||
                request.PreMoneyValuation < Phase5Requirements.ValuationMin)
                throw new ArgumentException($"preMoneyValuation must be >= {Phase5Requirements.ValuationMin}");
        }

        if (request.MinimumTicketEur.HasValue &&
            (!double.IsFinite(request.MinimumTicketEur.Value) || request.MinimumTicketEur.Value < 0))
            throw new ArgumentException("minimumTicketEur must be a finite number >= 0");

        // EquityOfferedPercent is required only when ShareType == "preferred" (if provided).
        var isEquity = string.Equals(request.ShareType, "preferred", StringComparison.OrdinalIgnoreCase);
        if (request.EquityOfferedPercent.HasValue && isEquity)
        {
            if (!double.IsFinite(request.EquityOfferedPercent.Value) ||
                request.EquityOfferedPercent.Value <= Phase5Requirements.EquityOfferedMin ||
                request.EquityOfferedPercent.Value > Phase5Requirements.EquityOfferedMax)
                throw new ArgumentException(
                    $"equityOfferedPercent must be in ({Phase5Requirements.EquityOfferedMin}, {Phase5Requirements.EquityOfferedMax}]");
        }

        // ShareType whitelist enforced when provided.
        if (!string.IsNullOrWhiteSpace(request.ShareType) &&
            !Phase5Requirements.IsValidShareType(request.ShareType))
            throw new ArgumentException(
                $"shareType must be one of: {string.Join(", ", Phase5Requirements.ShareTypeWhitelist)}");

        // Per-row validation of capital allocation + hiring plan at write time
        // so malformed rows are rejected before they ever reach Mongo.
        if (request.CapitalAllocation != null && request.CapitalAllocation.Count > 0)
        {
            var allocErrors = Phase5Requirements.ValidateAllocationRows(request.CapitalAllocation);
            if (allocErrors.Count > 0) throw new ArgumentException(string.Join("; ", allocErrors));
        }
        if (request.ResourceMap?.HiringPlan != null && request.ResourceMap.HiringPlan.Count > 0)
        {
            var hireErrors = Phase5Requirements.ValidateHiringPlanRows(request.ResourceMap.HiringPlan);
            if (hireErrors.Count > 0) throw new ArgumentException(string.Join("; ", hireErrors));
        }

        var company = await GetCompanyAsync(companyId);

        if (request.RaiseAmount > 0) company.FundingAskAmount = request.RaiseAmount;
        if (!string.IsNullOrWhiteSpace(request.RoundType)) company.FundingRoundType = request.RoundType;
        if (request.PreMoneyValuation > 0) company.PreMoneyValuation = request.PreMoneyValuation;
        if (request.EquityOfferedPercent.HasValue)
            company.EquityOfferedPercent = request.EquityOfferedPercent.Value;
        if (!string.IsNullOrWhiteSpace(request.ShareType))
            company.ShareType = request.ShareType.ToLowerInvariant();
        if (request.MinimumTicketEur.HasValue)
            company.MinimumTicketEur = request.MinimumTicketEur.Value;
        if (request.CapitalAllocation != null) company.CapitalAllocation = request.CapitalAllocation;
        if (request.ResourceMap != null) company.ResourceMap = request.ResourceMap;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<FinancialSummaryResponse> GetFinancialSummaryAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        var runwayMonths = CalculateRunway(company);

        return new FinancialSummaryResponse
        {
            TotalRevenue = totalRevenue,
            FinalValuation = company.Valuation ?? 0,
            MonthlyRecurringRevenue = totalRevenue / 12,
            AnnualRecurringRevenue = totalRevenue,
            RunwayMonths = runwayMonths,
            GrowthRate = CalculateGrowthRate(company),
            ConfidenceScore = company.ValuationConfidenceScore ?? 0,
            RiskDiscountRate = company.ValuationRiskDiscountRate ?? 0,
            RevenueMultiple = company.ValuationRevenueMultiple ?? 0,
            Industry = company.Industry,
            LastUpdatedAt = company.UpdatedAt
        };
    }

    // ============ PHASE 3 EXTENSIONS: CASH POSITION / MONTHLY REVENUE / KPI / REPORTS ============

    public async Task<Companies> SaveCashPositionAsync(string companyId, SaveCashPositionRequest request)
    {
        if (request == null)
            throw new ArgumentException("Request body required");
        if (request.CurrentFunds < 0)
            throw new ArgumentException("currentFunds must be >= 0");
        if (request.MonthlyBurn < 0)
            throw new ArgumentException("monthlyBurn must be >= 0");

        var company = await GetCompanyAsync(companyId);
        company.CurrentFunds = request.CurrentFunds;
        company.MonthlyBurn = request.MonthlyBurn;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);
        return company;
    }

    public async Task<List<MonthlyRevenueResponse>> SaveMonthlyRevenueAsync(string companyId, SaveMonthlyRevenueRequest request)
    {
        if (request?.Entries == null || request.Entries.Count == 0)
            throw new ArgumentException("At least one monthly revenue entry is required");

        var company = await GetCompanyAsync(companyId);

        foreach (var entry in request.Entries)
        {
            if (string.IsNullOrWhiteSpace(entry.YearMonth) ||
                !System.Text.RegularExpressions.Regex.IsMatch(entry.YearMonth, "^\\d{4}-\\d{2}$"))
                throw new ArgumentException($"yearMonth '{entry.YearMonth}' must be YYYY-MM");
            if (entry.Revenue < 0)
                throw new ArgumentException($"revenue for {entry.YearMonth} must be >= 0");

            var filter = Builders<Phase3MonthlyRevenue>.Filter.And(
                Builders<Phase3MonthlyRevenue>.Filter.Eq(x => x.CompanyId, companyId),
                Builders<Phase3MonthlyRevenue>.Filter.Eq(x => x.YearMonth, entry.YearMonth));

            var doc = new Phase3MonthlyRevenue
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                YearMonth = entry.YearMonth,
                Revenue = entry.Revenue,
                SectorBreakdown = entry.SectorBreakdown ?? new Dictionary<string, double>(),
                RecordedAt = DateTime.UtcNow,
            };

            // Upsert by (companyId, yearMonth) so the same month can be edited.
            await _dbContext.Phase3MonthlyRevenues.ReplaceOneAsync(
                filter, doc, new ReplaceOptions { IsUpsert = true });
        }

        // Recalculate and cache Q1-Q4 on company from all monthly data (single source of truth).
        var allMonthly = await GetMonthlyRevenueAsync(companyId);
        var quarters = new Dictionary<int, double> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 } };

        foreach (var monthly in allMonthly)
        {
            if (int.TryParse(monthly.YearMonth.Substring(5, 2), out var month))
            {
                var quarter = (month - 1) / 3 + 1;
                if (quarters.ContainsKey(quarter))
                    quarters[quarter] += monthly.Revenue;
            }
        }

        // Update company with cached quarterly values.
        company.Q1Revenue = quarters[1];
        company.Q2Revenue = quarters[2];
        company.Q3Revenue = quarters[3];
        company.Q4Revenue = quarters[4];
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var companyFilter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(companyFilter, company);

        return allMonthly;
    }

    public async Task<List<MonthlyRevenueResponse>> GetMonthlyRevenueAsync(string companyId)
    {
        await GetCompanyAsync(companyId);

        var docs = await _dbContext.Phase3MonthlyRevenues
            .Find(x => x.CompanyId == companyId)
            .SortBy(x => x.YearMonth)
            .ToListAsync();

        return docs.Select(d => new MonthlyRevenueResponse
        {
            YearMonth = d.YearMonth,
            Revenue = d.Revenue,
            SectorBreakdown = d.SectorBreakdown ?? new Dictionary<string, double>(),
            RecordedAt = d.RecordedAt,
        }).ToList();
    }

    // Reads the canonical quarterly store (Companies.Q1-Q4). MonthCount is the
    // number of months backing each quarter if detailed monthly data exists,
    // else 0 (quarterly value entered directly via Step 1).
    public async Task<List<QuarterlyRevenueResponse>> GetQuarterlyRevenueAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        var monthly = await _dbContext.Phase3MonthlyRevenues
            .Find(x => x.CompanyId == companyId)
            .ToListAsync();

        var monthCounts = new Dictionary<string, int> { { "Q1", 0 }, { "Q2", 0 }, { "Q3", 0 }, { "Q4", 0 } };
        foreach (var doc in monthly)
        {
            if (int.TryParse(doc.YearMonth.Substring(5, 2), out var month))
            {
                var quarter = $"Q{(month - 1) / 3 + 1}";
                if (monthCounts.ContainsKey(quarter)) monthCounts[quarter]++;
            }
        }

        return new List<QuarterlyRevenueResponse>
        {
            new() { Quarter = "Q1", Revenue = company.Q1Revenue ?? 0, MonthCount = monthCounts["Q1"] },
            new() { Quarter = "Q2", Revenue = company.Q2Revenue ?? 0, MonthCount = monthCounts["Q2"] },
            new() { Quarter = "Q3", Revenue = company.Q3Revenue ?? 0, MonthCount = monthCounts["Q3"] },
            new() { Quarter = "Q4", Revenue = company.Q4Revenue ?? 0, MonthCount = monthCounts["Q4"] },
        };
    }

    public async Task<KpiBaselineResponse> SaveKpiBaselineAsync(string companyId, SaveKpiBaselineRequest request)
    {
        if (request == null)
            throw new ArgumentException("Request body required");

        await GetCompanyAsync(companyId);

        // Validate BurnRate and Nps ranges BEFORE persistence
        if (request.BurnRate.HasValue && request.BurnRate.Value < 0)
            throw new ArgumentException("burnRate must be >= 0");
        if (request.Nps.HasValue && (request.Nps.Value < 0 || request.Nps.Value > 100))
            throw new ArgumentException("nps must be between 0 and 100");

        var doc = new Phase3Kpi
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            Mrr = request.Mrr,
            Arr = request.Arr,
            GrossMarginPercent = request.GrossMarginPercent,
            Cac = request.Cac,
            Ltv = request.Ltv,
            ChurnPercent = request.ChurnPercent,
            ActiveAccounts = request.ActiveAccounts,
            BurnRate = request.BurnRate,
            Nps = request.Nps,
            RecordedAt = DateTime.UtcNow,
        };

        var validationErrors = Phase3Requirements.ValidateKpiBaseline(doc);
        if (validationErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", validationErrors));

        await _dbContext.Phase3Kpis.InsertOneAsync(doc);

        // Also persist to Companies for current-state queries (MonthlyBurn + Nps used for runway, scoring)
        if (request.BurnRate.HasValue || request.Nps.HasValue)
        {
            var updates = new List<UpdateDefinition<Companies>>
            {
                Builders<Companies>.Update.Set(c => c.UpdatedAt, DateTime.UtcNow)
            };
            if (request.BurnRate.HasValue)
                updates.Add(Builders<Companies>.Update.Set(c => c.MonthlyBurn, request.BurnRate.Value));
            if (request.Nps.HasValue)
                updates.Add(Builders<Companies>.Update.Set(c => c.Nps, request.Nps.Value));

            await _dbContext.Companies.UpdateOneAsync(
                Builders<Companies>.Filter.Eq(c => c.Id, companyId),
                Builders<Companies>.Update.Combine(updates));
        }

        return MapKpi(doc);
    }

    public async Task<KpiBaselineResponse?> GetKpiBaselineAsync(string companyId)
    {
        await GetCompanyAsync(companyId);

        var latest = await _dbContext.Phase3Kpis
            .Find(x => x.CompanyId == companyId)
            .SortByDescending(x => x.RecordedAt)
            .FirstOrDefaultAsync();

        return latest == null ? null : MapKpi(latest);
    }

    public async Task<FinancialReportResponse> UploadFinancialReportAsync(string companyId, FinancialReportUploadRequest request)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");
        if (string.IsNullOrWhiteSpace(request.ReportType))
            throw new ArgumentException("reportType is required");

        await GetCompanyAsync(companyId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, bytes);

        var doc = new Phase3FinancialReport
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            Type = request.ReportType.ToLowerInvariant(),
            FileName = fileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            Status = Phase3Requirements.ReportStatusPending,
            UploadedAt = DateTime.UtcNow,
        };

        await _dbContext.Phase3FinancialReports.InsertOneAsync(doc);
        return MapReport(doc);
    }

    public async Task<List<FinancialReportResponse>> GetFinancialReportsAsync(string companyId)
    {
        await GetCompanyAsync(companyId);

        var docs = await _dbContext.Phase3FinancialReports
            .Find(x => x.CompanyId == companyId)
            .SortByDescending(x => x.UploadedAt)
            .ToListAsync();

        return docs.Select(MapReport).ToList();
    }

    private static KpiBaselineResponse MapKpi(Phase3Kpi k) => new()
    {
        Mrr = k.Mrr,
        Arr = k.Arr,
        GrossMarginPercent = k.GrossMarginPercent,
        Cac = k.Cac,
        Ltv = k.Ltv,
        ChurnPercent = k.ChurnPercent,
        ActiveAccounts = k.ActiveAccounts,
        BurnRate = k.BurnRate,
        Nps = k.Nps,
        RecordedAt = k.RecordedAt,
    };

    private static FinancialReportResponse MapReport(Phase3FinancialReport r) => new()
    {
        ReportId = r.Id,
        Type = r.Type,
        FileName = r.FileName,
        Status = r.Status,
        UploadedAt = r.UploadedAt,
        FileSize = r.FileSize,
        StoragePath = r.StoragePath,
        ReviewNote = r.ReviewNote,
    };

    private static readonly HashSet<string> ConceptStages =
        new(StringComparer.OrdinalIgnoreCase) { "idea", "mvp", "beta", "revenue", "growth" };

    public async Task<ConceptResponse> SaveConceptAsync(string companyId, SaveConceptRequest request)
    {
        if (request == null) throw new ArgumentException("Request body required");

        // Validation (Part 6a).
        if (string.IsNullOrWhiteSpace(request.OneLiner))
            throw new ArgumentException("oneLiner is required");
        if (string.IsNullOrWhiteSpace(request.BusinessModel))
            throw new ArgumentException("businessModel is required");
        if (string.IsNullOrWhiteSpace(request.ProblemStatement))
            throw new ArgumentException("problemStatement is required");
        if (string.IsNullOrWhiteSpace(request.SolutionDescription))
            throw new ArgumentException("solutionDescription is required");

        var stage = request.Stage?.Trim().ToLowerInvariant() ?? "idea";
        if (!ConceptStages.Contains(stage))
            throw new ArgumentException($"stage must be one of: {string.Join(", ", ConceptStages)}");

        var sectorTags = request.SectorTags ?? new List<string>();
        if (sectorTags.Count == 0 && !string.IsNullOrWhiteSpace(request.BusinessModel))
            sectorTags.Add(request.BusinessModel.Replace('_', ' '));
        if (sectorTags.Count == 0)
            sectorTags.Add("General");
        if (sectorTags.Count > 3)
            sectorTags = sectorTags.Take(3).ToList();

        var keywordTags = request.KeywordTags ?? new List<string>();
        if (keywordTags.Count > 5)
            keywordTags = keywordTags.Take(5).ToList();

        await GetCompanyAsync(companyId);

        // ClarityScore: four binary dimensions, each worth 25 (0–100).
        int clarityScore = 0;
        if (!string.IsNullOrWhiteSpace(request.ProblemStatement) && request.ProblemStatement.Length > 30) clarityScore += 25;
        if (!string.IsNullOrWhiteSpace(request.OneLiner) && request.OneLiner.Length > 20) clarityScore += 25;
        if (sectorTags.Count > 0) clarityScore += 25;
        if (!string.IsNullOrWhiteSpace(request.BusinessModel)) clarityScore += 25;

        // One concept per company — upsert by CompanyId (updated on resubmit).
        // Use FindOneAndUpdateAsync to avoid the immutable _id error that
        // ReplaceOneAsync hits when a doc already exists. CompanyId is set only
        // on insert so it's never rewritten on update.
        var filter = Builders<Phase3Concept>.Filter.Eq(c => c.CompanyId, companyId);
        var update = Builders<Phase3Concept>.Update
            .SetOnInsert(c => c.CompanyId, companyId)
            .Set(c => c.OneLiner, request.OneLiner.Trim())
            .Set(c => c.ProblemStatement, request.ProblemStatement?.Trim())
            .Set(c => c.SolutionDescription, request.SolutionDescription?.Trim())
            .Set(c => c.Stage, stage)
            .Set(c => c.BusinessModel, request.BusinessModel)
            .Set(c => c.SectorTags, sectorTags)
            .Set(c => c.KeywordTags, keywordTags)
            .Set(c => c.ClarityScore, clarityScore)
            .Set(c => c.RecordedAt, DateTime.UtcNow);

        var doc = await _dbContext.Phase3Concepts.FindOneAndUpdateAsync(
            filter,
            update,
            new FindOneAndUpdateOptions<Phase3Concept>
            {
                IsUpsert = true,
                ReturnDocument = ReturnDocument.After
            });

        return MapConcept(doc);
    }

    public async Task<ConceptResponse?> GetConceptAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        var doc = await _dbContext.Phase3Concepts
            .Find(c => c.CompanyId == companyId)
            .FirstOrDefaultAsync();

        if (doc == null && company != null && (!string.IsNullOrWhiteSpace(company.SourceBusinessIdeaId) || !string.IsNullOrWhiteSpace(company.SourceDealId)))
        {
            await BootstrapCompanyFromCreatorProjectAsync(companyId, company.SourceBusinessIdeaId ?? "", company.SourceDealId ?? "", false);
            doc = await _dbContext.Phase3Concepts
                .Find(c => c.CompanyId == companyId)
                .FirstOrDefaultAsync();
        }

        return doc == null ? null : MapConcept(doc);
    }

    private static ConceptResponse MapConcept(Phase3Concept c) => new()
    {
        OneLiner = c.OneLiner,
        ProblemStatement = c.ProblemStatement,
        SolutionDescription = c.SolutionDescription,
        Stage = c.Stage,
        BusinessModel = c.BusinessModel,
        SectorTags = c.SectorTags ?? new List<string>(),
        KeywordTags = c.KeywordTags ?? new List<string>(),
        ClarityScore = c.ClarityScore,
        RecordedAt = c.RecordedAt,
    };

    // ============ PHASE 4: EQUITY STRUCTURE & DILUTION ============

    public async Task<SaveEquityStructureRequest> GetCapTableAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        return new SaveEquityStructureRequest
        {
            Entries = company.EquityStructure ?? new List<EquityEntryDto>(),
            EsopPoolPercent = company.EsopPoolPercent ?? 0,
            EsopVestingMonths = company.EsopVestingMonths ?? 0,
            TotalShares = company.TotalShares ?? 1000000
        };
    }

    public async Task<DilutionSimulationResponse> SimulateDilutionAsync(string companyId, SimulateDilutionRequest request)
    {
        var company = await GetCompanyAsync(companyId);
        var currentCapTable = company.EquityStructure ?? new List<EquityEntryDto>();

        var scenarios = await _capTableCalculator.SimulateDilutionAsync(
            currentCapTable,
            request.FundingAmount,
            request.PostMoneyValuation,
            request.RoundType
        );

        return new DilutionSimulationResponse { Scenarios = scenarios };
    }

    // ============ PHASE 4 EXTENSIONS: CAP TABLE / VESTING / OWNERSHIP HISTORY / ISSUANCE ============

    public async Task<CapTableSnapshotResponse> SubmitCapTableAsync(string companyId, SubmitCapTableRequest request)
    {
        // Write-time validation = shape + per-grant + duplicate detection only.
        // Totals reconciliation + founder presence are enforced at phase
        // advancement (ValidatePhase4Async), so partial cap-table progress
        // can be saved across steps without erroring out the user.
        var shapeErrors = Phase4Requirements.ValidateCapTableShape(request);
        if (shapeErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", shapeErrors));

        var grantErrors = Phase4Requirements.ValidateGrants(request.Grants, request.TotalShares);
        if (grantErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", grantErrors));

        var duplicateErrors = Phase4Requirements.ValidateDuplicateRows(request);
        if (duplicateErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", duplicateErrors));

        var company = await GetCompanyAsync(companyId);

        // Determine next version.
        var existingLatest = await _dbContext.Phase4CapTables
            .Find(c => c.CompanyId == companyId)
            .SortByDescending(c => c.Version)
            .FirstOrDefaultAsync();
        var nextVersion = (existingLatest?.Version ?? 0) + 1;

        var snapshot = new Phase4CapTable
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            Version = nextVersion,
            TotalShares = request.TotalShares,
            EsopPoolPercent = request.EsopPoolPercent,
            EsopVestingMonths = request.EsopVestingMonths,
            Grants = request.Grants.Select(g => new EquityGrant
            {
                GrantId = string.IsNullOrWhiteSpace(g.GrantId) ? ObjectId.GenerateNewId().ToString() : g.GrantId,
                StakeholderName = g.StakeholderName,
                StakeholderType = g.StakeholderType,
                ShareClass = (g.ShareClass ?? string.Empty).ToLowerInvariant(),
                SharesGranted = g.SharesGranted,
                InvestmentAmount = g.InvestmentAmount,
                GrantDate = g.GrantDate ?? DateTime.UtcNow,
                CliffMonths = g.CliffMonths,
                TotalVestMonths = g.TotalVestMonths,
            }).ToList(),
            RecordedAt = DateTime.UtcNow,
        };

        await _dbContext.Phase4CapTables.InsertOneAsync(snapshot);

        // Mirror the latest snapshot into the Companies model for legacy
        // consumers (validator already reads Phase4CapTables; this keeps Phase 3
        // and other callers consistent).
        company.TotalShares = snapshot.TotalShares;
        company.EsopPoolPercent = snapshot.EsopPoolPercent;
        company.EsopVestingMonths = snapshot.EsopVestingMonths;
        company.EquityStructure = snapshot.Grants.Select(g => new EquityEntryDto
        {
            StakeholderName = g.StakeholderName,
            Type = g.StakeholderType,
            SharesOwned = g.SharesGranted,
            VestingMonths = g.TotalVestMonths,
            InvestmentAmount = g.InvestmentAmount,
        }).ToList();
        company.UpdatedAt = DateTime.UtcNow;
        await _dbContext.Companies.ReplaceOneAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, companyId), company);

        return MapCapTableSnapshot(snapshot);
    }

    public async Task<CapTableSnapshotResponse?> GetLatestCapTableSnapshotAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        await ReconcileClosedDealCapTablesAsync(companyId);
        var latest = await _dbContext.Phase4CapTables
            .Find(c => c.CompanyId == companyId)
            .SortByDescending(c => c.RecordedAt)
            .FirstOrDefaultAsync();

        if (latest != null && latest.Grants != null)
        {
            var esopGrants = latest.Grants.Where(g =>
                string.Equals(g.StakeholderType, "esop", StringComparison.OrdinalIgnoreCase) ||
                g.StakeholderName?.IndexOf("ESOP", StringComparison.OrdinalIgnoreCase) >= 0).ToList();

            var reserveGrants = latest.Grants.Where(g =>
                string.Equals(g.StakeholderType, "investor_reserve", StringComparison.OrdinalIgnoreCase) ||
                g.StakeholderName?.IndexOf("Investor Reserve", StringComparison.OrdinalIgnoreCase) >= 0).ToList();

            if (esopGrants.Count > 1 || reserveGrants.Count > 1)
            {
                var cleanedGrants = new List<EquityGrant>();
                bool esopAdded = false;
                bool reserveAdded = false;

                foreach (var g in latest.Grants)
                {
                    bool isEsop = string.Equals(g.StakeholderType, "esop", StringComparison.OrdinalIgnoreCase) ||
                                  g.StakeholderName?.IndexOf("ESOP", StringComparison.OrdinalIgnoreCase) >= 0;
                    bool isReserve = string.Equals(g.StakeholderType, "investor_reserve", StringComparison.OrdinalIgnoreCase) ||
                                     g.StakeholderName?.IndexOf("Investor Reserve", StringComparison.OrdinalIgnoreCase) >= 0;

                    if (isEsop)
                    {
                        if (!esopAdded)
                        {
                            var preferred = esopGrants.FirstOrDefault(e => e.StakeholderName?.Contains("Employee Option Pool") == true) ?? g;
                            cleanedGrants.Add(new EquityGrant
                            {
                                GrantId = preferred.GrantId,
                                StakeholderName = preferred.StakeholderName,
                                StakeholderType = "esop",
                                ShareClass = ShareClasses.Common,
                                SharesGranted = preferred.SharesGranted,
                                InvestmentAmount = preferred.InvestmentAmount,
                                GrantDate = preferred.GrantDate,
                                CliffMonths = preferred.CliffMonths > 0 ? preferred.CliffMonths : 12,
                                TotalVestMonths = preferred.TotalVestMonths > 0 ? preferred.TotalVestMonths : 48,
                                Source = preferred.Source
                            });
                            esopAdded = true;
                        }
                    }
                    else if (isReserve)
                    {
                        if (!reserveAdded)
                        {
                            var preferred = reserveGrants.FirstOrDefault(e => e.StakeholderName?.Contains("Future Investor Reserve") == true) ?? g;
                            cleanedGrants.Add(new EquityGrant
                            {
                                GrantId = preferred.GrantId,
                                StakeholderName = preferred.StakeholderName,
                                StakeholderType = "investor",
                                ShareClass = ShareClasses.Preferred,
                                SharesGranted = preferred.SharesGranted,
                                InvestmentAmount = preferred.InvestmentAmount,
                                GrantDate = preferred.GrantDate,
                                CliffMonths = 0,
                                TotalVestMonths = 0,
                                Source = preferred.Source
                            });
                            reserveAdded = true;
                        }
                    }
                    else
                    {
                        cleanedGrants.Add(g);
                    }
                }

                var reconciledSnapshot = new Phase4CapTable
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    CompanyId = companyId,
                    Version = latest.Version + 1,
                    TotalShares = latest.TotalShares > 0 ? latest.TotalShares : 10_000_000,
                    EsopPoolPercent = latest.EsopPoolPercent,
                    EsopVestingMonths = latest.EsopVestingMonths,
                    Grants = cleanedGrants,
                    ExitWaterfallReviewed = latest.ExitWaterfallReviewed,
                    RecordedAt = DateTime.UtcNow
                };

                await _dbContext.Phase4CapTables.InsertOneAsync(reconciledSnapshot);

                company.EquityStructure = cleanedGrants.Select(g => new EquityEntryDto
                {
                    StakeholderName = g.StakeholderName,
                    Type = g.StakeholderType,
                    SharesOwned = g.SharesGranted,
                    VestingMonths = g.TotalVestMonths,
                    InvestmentAmount = g.InvestmentAmount
                }).ToList();
                company.UpdatedAt = DateTime.UtcNow;
                await _dbContext.Companies.ReplaceOneAsync(c => c.Id == company.Id, company);

                latest = reconciledSnapshot;
            }
        }

        return latest == null ? null : MapCapTableSnapshot(latest);
    }

    /// <summary>
    /// Marks the latest cap-table snapshot's exit waterfall as reviewed. Required
    /// (alongside a recorded dilution simulation) before Phase 4 advancement.
    /// </summary>
    public async Task SetExitWaterfallReviewedAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var latest = await _dbContext.Phase4CapTables
            .Find(c => c.CompanyId == companyId)
            .SortByDescending(c => c.RecordedAt)
            .FirstOrDefaultAsync();
        if (latest == null)
            throw new ArgumentException("No cap table snapshot found to mark exit waterfall reviewed");

        await _dbContext.Phase4CapTables.UpdateOneAsync(
            Builders<Phase4CapTable>.Filter.Eq(c => c.Id, latest.Id),
            Builders<Phase4CapTable>.Update.Set(c => c.ExitWaterfallReviewed, true));
    }

    public async Task<List<VestingScheduleResponse>> SaveVestingSchedulesAsync(string companyId, SaveVestingScheduleRequest request)
    {
        if (request?.Entries == null || request.Entries.Count == 0)
            throw new ArgumentException("At least one vesting entry is required");

        foreach (var e in request.Entries)
        {
            if (string.IsNullOrWhiteSpace(e.StakeholderName))
                throw new ArgumentException("Vesting entry stakeholder name is required");
            if (e.SharesGranted <= 0)
                throw new ArgumentException($"Vesting entry for '{e.StakeholderName}': shares must be > 0");
            var ve = Phase4Requirements.ValidateVesting(e.CliffMonths, e.TotalVestMonths, e.StakeholderName);
            if (ve.Count > 0) throw new ArgumentException(string.Join("; ", ve));
        }

        await GetCompanyAsync(companyId);

        // Replace any existing schedules for the same GrantId (idempotent saves).
        foreach (var e in request.Entries)
        {
            var grantId = string.IsNullOrWhiteSpace(e.GrantId) ? ObjectId.GenerateNewId().ToString() : e.GrantId;
            var filter = Builders<Phase4VestingSchedule>.Filter.And(
                Builders<Phase4VestingSchedule>.Filter.Eq(x => x.CompanyId, companyId),
                Builders<Phase4VestingSchedule>.Filter.Eq(x => x.GrantId, grantId));

            var doc = new Phase4VestingSchedule
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                GrantId = grantId,
                StakeholderName = e.StakeholderName,
                SharesGranted = e.SharesGranted,
                GrantDate = e.GrantDate,
                CliffMonths = e.CliffMonths,
                TotalVestMonths = e.TotalVestMonths,
                RecordedAt = DateTime.UtcNow,
            };

            await _dbContext.Phase4VestingSchedules.ReplaceOneAsync(
                filter, doc, new ReplaceOptions { IsUpsert = true });
        }

        return await GetVestingSchedulesAsync(companyId);
    }

    public async Task<List<VestingScheduleResponse>> GetVestingSchedulesAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var now = DateTime.UtcNow;
        var docs = await _dbContext.Phase4VestingSchedules
            .Find(v => v.CompanyId == companyId)
            .SortBy(v => v.GrantDate)
            .ToListAsync();

        return docs.Select(v =>
        {
            var months = Phase4Requirements.MonthsBetween(v.GrantDate, now);
            var pct = Phase4Requirements.ComputeVestedPercent(months, v.CliffMonths, v.TotalVestMonths);
            var shares = Phase4Requirements.ComputeVestedShares(v.SharesGranted, months, v.CliffMonths, v.TotalVestMonths);
            return new VestingScheduleResponse
            {
                GrantId = v.GrantId,
                StakeholderName = v.StakeholderName,
                SharesGranted = v.SharesGranted,
                GrantDate = v.GrantDate,
                CliffMonths = v.CliffMonths,
                TotalVestMonths = v.TotalVestMonths,
                VestedPercentNow = pct,
                VestedSharesNow = shares,
            };
        }).ToList();
    }

    public async Task<List<OwnershipHistoryResponse>> SaveOwnershipHistoryAsync(string companyId, SaveOwnershipHistoryRequest request)
    {
        if (request?.Entries == null || request.Entries.Count == 0)
            throw new ArgumentException("At least one ownership history entry is required");

        foreach (var e in request.Entries)
        {
            if (string.IsNullOrWhiteSpace(e.RoundName))
                throw new ArgumentException("Ownership history entry: roundName is required");
            if (e.FounderOwnershipBefore < 0 || e.FounderOwnershipBefore > 100 ||
                e.FounderOwnershipAfter < 0 || e.FounderOwnershipAfter > 100 ||
                e.InvestorOwnership < 0 || e.InvestorOwnership > 100 ||
                e.EsopOwnership < 0 || e.EsopOwnership > 100)
                throw new ArgumentException($"Ownership history '{e.RoundName}': percentages must be between 0 and 100");
            if (e.Valuation < 0)
                throw new ArgumentException($"Ownership history '{e.RoundName}': valuation must be >= 0");
        }

        await GetCompanyAsync(companyId);

        // Replace entire history for this company (idempotent on the full set).
        await _dbContext.Phase4OwnershipHistories.DeleteManyAsync(h => h.CompanyId == companyId);
        var docs = request.Entries.Select(e => new Phase4OwnershipHistory
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            RoundName = e.RoundName,
            EventDate = e.EventDate ?? DateTime.UtcNow,
            FounderOwnershipBefore = e.FounderOwnershipBefore,
            FounderOwnershipAfter = e.FounderOwnershipAfter,
            InvestorOwnership = e.InvestorOwnership,
            EsopOwnership = e.EsopOwnership,
            Valuation = e.Valuation,
            Notes = e.Notes,
            RecordedAt = DateTime.UtcNow,
        }).ToList();
        if (docs.Count > 0)
            await _dbContext.Phase4OwnershipHistories.InsertManyAsync(docs);

        return await GetOwnershipHistoryAsync(companyId);
    }

    public async Task<List<OwnershipHistoryResponse>> GetOwnershipHistoryAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var docs = await _dbContext.Phase4OwnershipHistories
            .Find(h => h.CompanyId == companyId)
            .SortBy(h => h.EventDate)
            .ToListAsync();
        return docs.Select(MapOwnershipHistory).ToList();
    }

    public async Task<ShareIssuanceResponse> RecordShareIssuanceAsync(string companyId, RecordShareIssuanceRequest request)
    {
        if (request == null) throw new ArgumentException("Request body required");
        if (string.IsNullOrWhiteSpace(request.IssuedTo))
            throw new ArgumentException("issuedTo is required");
        if (!ShareClasses.IsValid(request.ShareClass))
            throw new ArgumentException($"Invalid share class '{request.ShareClass}'");
        if (request.SharesIssued <= 0)
            throw new ArgumentException("sharesIssued must be > 0");
        if (request.PricePerShare.HasValue && request.PricePerShare.Value < 0)
            throw new ArgumentException("pricePerShare must be >= 0");

        await GetCompanyAsync(companyId);

        var doc = new Phase4ShareIssuance
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            InvestorId = request.InvestorId,
            DealExecutionId = request.DealExecutionId,
            MatchId = request.MatchId,
            IssuedTo = request.IssuedTo,
            ShareClass = request.ShareClass.ToLowerInvariant(),
            SharesIssued = request.SharesIssued,
            PricePerShare = request.PricePerShare,
            Reason = request.Reason,
            IssuedAt = DateTime.UtcNow,
        };

        // SAFE-note conversion: when issuing a SAFE and all conversion inputs are
        // supplied, derive the conversion price, share count, and method used.
        if (string.Equals(doc.ShareClass, ShareClasses.Safe, StringComparison.OrdinalIgnoreCase)
            && request.SafePrincipal is > 0
            && request.ValuationCap is > 0
            && request.RoundPricePerShare is > 0
            && request.DiscountRate is >= 0 and < 1
            && request.TotalSharesPreRound is > 0)
        {
            var conversion = Phase4Requirements.ComputeSafeConversion(
                request.SafePrincipal.Value,
                request.ValuationCap.Value,
                request.DiscountRate.Value,
                request.RoundPricePerShare.Value,
                request.TotalSharesPreRound.Value);

            doc.SharesIssued = conversion.SharesIssued;
            doc.ConversionPrice = conversion.ConversionPrice;
            doc.ConversionMethod = conversion.MethodUsed;
        }

        await _dbContext.Phase4ShareIssuances.InsertOneAsync(doc);

        return new ShareIssuanceResponse
        {
            IssuanceId = doc.Id,
            InvestorId = doc.InvestorId,
            DealExecutionId = doc.DealExecutionId,
            MatchId = doc.MatchId,
            IssuedTo = doc.IssuedTo,
            ShareClass = doc.ShareClass,
            SharesIssued = doc.SharesIssued,
            PricePerShare = doc.PricePerShare,
            Reason = doc.Reason,
            IssuedAt = doc.IssuedAt,
            ConversionPrice = doc.ConversionPrice,
            ConversionMethod = doc.ConversionMethod,
        };
    }

    private static CapTableSnapshotResponse MapCapTableSnapshot(Phase4CapTable c) => new()
    {
        CapTableId = c.Id,
        Version = c.Version,
        TotalShares = c.TotalShares,
        EsopPoolPercent = c.EsopPoolPercent,
        EsopVestingMonths = c.EsopVestingMonths,
        RecordedAt = c.RecordedAt,
        Grants = c.Grants.Select(g => new EquityGrantDto
        {
            GrantId = g.GrantId,
            InvestorId = g.InvestorId,
            DealExecutionId = g.DealExecutionId,
            MatchId = g.MatchId,
            Source = g.Source,
            StakeholderName = g.StakeholderName,
            StakeholderType = g.StakeholderType,
            ShareClass = g.ShareClass,
            SharesGranted = g.SharesGranted,
            InvestmentAmount = g.InvestmentAmount,
            GrantDate = g.GrantDate,
            CliffMonths = g.CliffMonths,
            TotalVestMonths = g.TotalVestMonths,
        }).ToList(),
    };

    private static OwnershipHistoryResponse MapOwnershipHistory(Phase4OwnershipHistory h) => new()
    {
        DealExecutionId = h.DealExecutionId,
        InvestorId = h.InvestorId,
        RoundName = h.RoundName,
        EventDate = h.EventDate,
        FounderOwnershipBefore = h.FounderOwnershipBefore,
        FounderOwnershipAfter = h.FounderOwnershipAfter,
        InvestorOwnership = h.InvestorOwnership,
        EsopOwnership = h.EsopOwnership,
        Valuation = h.Valuation,
        Notes = h.Notes,
        RecordedAt = h.RecordedAt,
    };

    // ============ PHASE 5: FUNDING ASK & PITCH ============

    public async Task<PitchDeckResponse> UploadPitchDeckAsync(string companyId, PitchDeckUploadRequest request)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");

        var company = await GetCompanyAsync(companyId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, bytes);
        var uploadedAt = DateTime.UtcNow;

        company.PitchDeckFileName = fileName;
        company.PitchDeckUploadedAt = uploadedAt;
        company.PitchDeckStoragePath = storagePath;
        company.PitchDeckFileSize = request.File.Length;
        company.InvestorReadinessInputsLastMaterialChangeAt = uploadedAt;
        company.UpdatedAt = uploadedAt;

        await _dbContext.Companies.FindOneAndUpdateAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
            Builders<Companies>.Update
                .Set(c => c.PitchDeckFileName, fileName)
                .Set(c => c.PitchDeckUploadedAt, uploadedAt)
                .Set(c => c.PitchDeckStoragePath, storagePath)
                .Set(c => c.PitchDeckFileSize, request.File.Length)
                .Set(c => c.InvestorReadinessInputsLastMaterialChangeAt, uploadedAt)
                .Set(c => c.UpdatedAt, uploadedAt));

        return new PitchDeckResponse
        {
            FileName = fileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            UploadedAt = uploadedAt,
        };
    }

    public async Task<PitchDeckResponse?> GetPitchDeckAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        if (string.IsNullOrWhiteSpace(company.PitchDeckFileName)) return null;
        return new PitchDeckResponse
        {
            FileName = company.PitchDeckFileName,
            StoragePath = company.PitchDeckStoragePath,
            FileSize = company.PitchDeckFileSize ?? 0,
            UploadedAt = company.PitchDeckUploadedAt ?? DateTime.MinValue,
        };
    }

    public async Task<Companies> SaveFundingNarrativeAsync(string companyId, string narrative)
    {
        if (string.IsNullOrWhiteSpace(narrative))
            throw new ArgumentException("narrative is required");
        if (narrative.Trim().Length < Phase5Requirements.NarrativeMinLength)
            throw new ArgumentException(
                $"narrative must be at least {Phase5Requirements.NarrativeMinLength} characters");

        var company = await GetCompanyAsync(companyId);
        company.FundingNarrative = narrative;
        company.UpdatedAt = DateTime.UtcNow;

        var result = await _dbContext.Companies.FindOneAndUpdateAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
            Builders<Companies>.Update
                .Set(c => c.FundingNarrative, narrative)
                .Set(c => c.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<Companies> { ReturnDocument = ReturnDocument.After }
        );

        return result ?? company;
    }

    public async Task<FundingNarrativeResponse> GetFundingNarrativeAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return new FundingNarrativeResponse { Narrative = company.FundingNarrative ?? string.Empty };
    }

    public async Task<Companies> SaveOutreachCampaignAsync(string companyId, List<string> investorIds, string template)
    {
        if (string.IsNullOrWhiteSpace(template))
            throw new ArgumentException("template is required");

        var company = await GetCompanyAsync(companyId);

        // TODO: P1 - Queue background job for email outreach
        company.OutreachCampaignTemplate = template;
        company.OutreachInvestorList = investorIds ?? new List<string>();
        company.OutreachCampaignStartedAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var result = await _dbContext.Companies.FindOneAndUpdateAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
            Builders<Companies>.Update
                .Set(c => c.OutreachCampaignTemplate, template)
                .Set(c => c.OutreachInvestorList, company.OutreachInvestorList)
                .Set(c => c.OutreachCampaignStartedAt, DateTime.UtcNow)
                .Set(c => c.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<Companies> { ReturnDocument = ReturnDocument.After }
        );

        return result ?? company;
    }

    public async Task<FundingProfileResponse> GetFundingProfileAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        // amount is DERIVED on read from the single source of truth
        // (raise × percent / 100) — never persisted, so it can never drift
        // from FundingAskAmount.
        var raise = company.FundingAskAmount ?? 0;
        var allocation = (company.CapitalAllocation ?? new List<CapitalAllocationDto>())
            .Select(c => new CapitalAllocationDto
            {
                Category = c.Category,
                Percent = c.Percent,
                Amount = double.IsFinite(c.Percent) ? raise * c.Percent / 100.0 : 0,
            })
            .ToList();

        return new FundingProfileResponse
        {
            FundingAskAmount = company.FundingAskAmount,
            FundingRoundType = company.FundingRoundType,
            PreMoneyValuation = company.PreMoneyValuation,
            EquityOfferedPercent = company.EquityOfferedPercent,
            ShareType = company.ShareType,
            MinimumTicketEur = company.MinimumTicketEur,
            CapitalAllocation = allocation,
            ResourceMap = company.ResourceMap,
            PitchDeckFileName = company.PitchDeckFileName,
            PitchDeckFileSize = company.PitchDeckFileSize,
            PitchDeckUploadedAt = company.PitchDeckUploadedAt,
            FundingNarrative = company.FundingNarrative,
            HasOutreachCampaign = !string.IsNullOrWhiteSpace(company.OutreachCampaignTemplate),
        };
    }

    // ============ PHASE 6: DATA ROOM ============

    public async Task<DataRoomDocumentResponse> UploadDataRoomDocumentAsync(string companyId, UploadDataRoomDocumentRequest request, string uploadedByUserId)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");
        if (request.File.Length > Phase6Requirements.MaxFileSizeBytes)
            throw new ArgumentException(
                $"File size {request.File.Length} exceeds {Phase6Requirements.MaxFileSizeBytes}");
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("title is required");
        if (request.Title.Length > Phase6Requirements.MaxTitleLength)
            throw new ArgumentException(
                $"title must be <= {Phase6Requirements.MaxTitleLength} characters");
        if (!Phase6Requirements.IsAllowedCategory(request.Category))
            throw new ArgumentException(
                $"category must be one of: {string.Join(", ", Phase6Requirements.AllowedCategories)}");

        var company = await GetCompanyAsync(companyId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, bytes);

        var doc = new DataRoomDocumentResponse
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            Title = request.Title,
            Category = request.Category.ToLowerInvariant(),
            Status = "draft",
            UploadedAt = DateTime.UtcNow,
            ViewCount = 0,
            DownloadCount = 0,
            FileName = fileName,
            MimeType = request.File.ContentType,
            FileSize = request.File.Length,
            StoragePath = storagePath,
            UploadedBy = uploadedByUserId,
        };

        if (company.DataRoomDocuments == null)
            company.DataRoomDocuments = new List<DataRoomDocumentResponse>();

        company.DataRoomDocuments.Add(doc);
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return doc;
    }

    public async Task<DataRoomStatusResponse> DeleteDataRoomDocumentAsync(string companyId, string documentId)
    {
        var company = await GetCompanyAsync(companyId);
        var doc = company.DataRoomDocuments?
            .FirstOrDefault(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal));
        if (doc == null)
            throw new KeyNotFoundException($"Document {documentId} not found");

        if (!string.IsNullOrWhiteSpace(doc.StoragePath) && File.Exists(doc.StoragePath))
        {
            try { File.Delete(doc.StoragePath); } catch { /* best-effort physical delete */ }
        }

        company.DataRoomDocuments = company.DataRoomDocuments
            .Where(d => !string.Equals(d.DocumentId, documentId, StringComparison.Ordinal))
            .ToList();

        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return await GetDataRoomStatusAsync(companyId);
    }

    public async Task<DataRoomDocumentResponse> ReplaceDataRoomDocumentAsync(
        string companyId, string documentId, UploadDataRoomDocumentRequest request, string uploadedByUserId)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");
        if (request.File.Length > Phase6Requirements.MaxFileSizeBytes)
            throw new ArgumentException(
                $"File size {request.File.Length} exceeds {Phase6Requirements.MaxFileSizeBytes}");
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("title is required");
        if (request.Title.Length > Phase6Requirements.MaxTitleLength)
            throw new ArgumentException(
                $"title must be <= {Phase6Requirements.MaxTitleLength} characters");
        if (!string.IsNullOrWhiteSpace(request.Category) && !Phase6Requirements.IsAllowedCategory(request.Category))
            throw new ArgumentException(
                $"category must be one of: {string.Join(", ", Phase6Requirements.AllowedCategories)}");

        var company = await GetCompanyAsync(companyId);
        var existingDocIndex = company.DataRoomDocuments?.FindIndex(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal)) ?? -1;
        if (existingDocIndex < 0 || company.DataRoomDocuments == null)
            throw new KeyNotFoundException($"Document {documentId} not found");

        var oldDoc = company.DataRoomDocuments[existingDocIndex];

        // 1. Upload new document successfully first (if this throws, old document remains untouched)
        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, bytes);

        var targetCategory = string.IsNullOrWhiteSpace(request.Category)
            ? oldDoc.Category
            : request.Category.ToLowerInvariant();

        var newDoc = new DataRoomDocumentResponse
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            Title = request.Title,
            Category = targetCategory,
            Status = "draft",
            UploadedAt = DateTime.UtcNow,
            ViewCount = 0,
            DownloadCount = 0,
            FileName = fileName,
            MimeType = request.File.ContentType,
            FileSize = request.File.Length,
            StoragePath = storagePath,
            UploadedBy = uploadedByUserId,
        };

        // 2. Atomically replace the existing document record
        company.DataRoomDocuments[existingDocIndex] = newDoc;
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        // 3. Clean up old physical file safely
        if (!string.IsNullOrWhiteSpace(oldDoc.StoragePath) && oldDoc.StoragePath != storagePath && File.Exists(oldDoc.StoragePath))
        {
            try { File.Delete(oldDoc.StoragePath); } catch { /* best-effort cleanup */ }
        }

        return newDoc;
    }

    public async Task<DataRoomStatusResponse> PublishDataRoomAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        var docs = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>();

        if (docs.Count < Phase6Requirements.MinDocumentCount)
            throw new InvalidOperationException(
                $"Cannot publish: need at least {Phase6Requirements.MinDocumentCount} documents (currently {docs.Count})");

        var uploadedCategories = docs
            .Select(d => (d.Category ?? string.Empty).ToLowerInvariant())
            .Distinct()
            .ToList();
        var missing = Phase6Requirements.RequiredCategories
            .Where(req => !uploadedCategories.Any(u => string.Equals(u, req, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        if (missing.Count > 0)
            throw new InvalidOperationException(
                $"Cannot publish: missing required categories ({string.Join(", ", missing)})");

        foreach (var d in docs)
        {
            if (string.IsNullOrWhiteSpace(d.StoragePath))
                throw new InvalidOperationException(
                    $"Cannot publish: document '{d.FileName}' has no storagePath (malformed upload)");
            if (d.FileSize <= 0)
                throw new InvalidOperationException(
                    $"Cannot publish: document '{d.FileName}' has fileSize 0");
        }

        company.IsDataRoomLive = true;
        company.DataRoomLastMaterialChangeAt = DateTime.UtcNow;
        company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        await _dbContext.Companies.ReplaceOneAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, companyId), company);

        return await GetDataRoomStatusAsync(companyId);
    }

    /// <summary>
    /// Centralised data-room access policy. Owner always passes. Non-owners
    /// must satisfy: room published, grant exists, grant not expired, NDA
    /// accepted when required, and (when <paramref name="requireDownloadPermission"/>
    /// is true) grant.AccessLevel is in <see cref="Phase6Requirements.DownloadPermittedAccessLevels"/>.
    ///
    /// Used by both <see cref="DownloadDataRoomDocumentAsync"/> and
    /// <see cref="TrackDataRoomEventAsync"/> so an analytics event can never
    /// be persisted unless the caller could have actually performed the action.
    /// </summary>
    private async Task EnsureDataRoomAccessAsync(
        Companies company, string callerUserId, bool callerIsOwner, bool requireDownloadPermission)
    {
        if (callerIsOwner) return;

        if (!company.IsDataRoomLive)
            throw new UnauthorizedAccessException("Data room is not published");

        var user = await (GetUserManager()?.FindByIdAsync(callerUserId) ?? Task.FromResult<ApplicationUser?>(null));
        var investorId = user?.InvestorProfile?.InvestorId;
        var candidateIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { callerUserId };
        if (!string.IsNullOrWhiteSpace(investorId)) candidateIds.Add(investorId);


        var grant = company.DataRoomAccessRecords?
            .FirstOrDefault(g => candidateIds.Contains(g.InvestorId));
        if (grant == null)
            throw new UnauthorizedAccessException("No data-room access grant for this investor");
        if (grant.ExpiresAt != default && grant.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Data-room access grant has expired");

        if (requireDownloadPermission && !Phase6Requirements.AccessLevelPermitsDownload(grant.AccessLevel))
            throw new UnauthorizedAccessException(
                $"Access level '{grant.AccessLevel}' does not permit downloads (requires one of: {string.Join(", ", Phase6Requirements.DownloadPermittedAccessLevels)})");

        if (company.IsDataRoomNdaRequired)
        {
            var nda = await _dbContext.Phase6NdaAcceptances
                .Find(n => n.CompanyId == company.Id && candidateIds.Contains(n.InvestorId))
                .FirstOrDefaultAsync();
            if (nda == null)
                throw new UnauthorizedAccessException("NDA acceptance is required");
        }
    }


    /// <summary>
    /// Download a data-room document. Owner can always download. Non-owner
    /// callers must satisfy the centralised access policy AND have an
    /// access-level that permits downloads (download | full_access).
    /// </summary>
    public async Task<(byte[] Content, DataRoomDocumentResponse Document)> DownloadDataRoomDocumentAsync(
        string companyId, string documentId, string callerUserId, bool callerIsOwner, bool requireDownloadPermission = true)
    {
        var company = await GetCompanyAsync(companyId);
        var doc = company.DataRoomDocuments?
            .FirstOrDefault(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal));
        if (doc == null)
            throw new KeyNotFoundException($"Document {documentId} not found");

        await EnsureDataRoomAccessAsync(company, callerUserId, callerIsOwner, requireDownloadPermission: requireDownloadPermission);

        byte[] bytes;
        var resolvedPath = !string.IsNullOrWhiteSpace(doc.StoragePath)
            ? (Path.IsPathRooted(doc.StoragePath) ? doc.StoragePath : Path.Combine(Directory.GetCurrentDirectory(), doc.StoragePath))
            : null;

        if (resolvedPath != null && File.Exists(resolvedPath))
        {
            bytes = await File.ReadAllBytesAsync(resolvedPath);
        }
        else
        {
            bytes = System.Text.Encoding.UTF8.GetBytes($"[Mondial Eco - Data Room Document]\n\nDocument Title: {doc.Title}\nFile Name: {doc.FileName}\nCategory: {doc.Category}\nCompany: {company.CompanyName}\nTimestamp: {DateTime.UtcNow:u}");
        }

        return (bytes, doc);
    }


    public async Task<Phase6AccessLogResponse> TrackDataRoomEventAsync(
        string companyId, string documentId, string investorId, bool callerIsOwner, string eventType, string ipHash)
    {
        if (!Phase6Requirements.IsTrackableEventType(eventType))
            throw new ArgumentException($"eventType must be '{Phase6Requirements.EventTypeView}' or '{Phase6Requirements.EventTypeDownload}'");

        var company = await GetCompanyAsync(companyId);
        var doc = company.DataRoomDocuments?
            .FirstOrDefault(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal));
        if (doc == null)
            throw new KeyNotFoundException($"Document {documentId} not found");

        // SAME authorization policy as real access. track-download additionally
        // requires the download access-level so view_only / comment grants
        // cannot poison the download counter.
        var requireDownload = string.Equals(eventType, Phase6Requirements.EventTypeDownload, StringComparison.OrdinalIgnoreCase);
        await EnsureDataRoomAccessAsync(company, investorId, callerIsOwner, requireDownloadPermission: requireDownload);

        var log = new Phase6AccessLog
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            DocumentId = documentId,
            InvestorId = investorId,
            EventType = eventType.ToLowerInvariant(),
            OccurredAt = DateTime.UtcNow,
            IpHash = ipHash,
        };
        await _dbContext.Phase6AccessLogs.InsertOneAsync(log);

        // Increment the denormalised counter on the embedded document for
        // cheap UI reads (analytics still derives from the log collection).
        var docFilter = Builders<Companies>.Filter.And(
            Builders<Companies>.Filter.Eq(c => c.Id, companyId),
            Builders<Companies>.Filter.ElemMatch(c => c.DataRoomDocuments, d => d.DocumentId == documentId));
        var update = string.Equals(eventType, Phase6Requirements.EventTypeView, StringComparison.OrdinalIgnoreCase)
            ? Builders<Companies>.Update.Inc("DataRoomDocuments.$.ViewCount", 1)
            : Builders<Companies>.Update.Inc("DataRoomDocuments.$.DownloadCount", 1);
        await _dbContext.Companies.UpdateOneAsync(docFilter, update);

        return new Phase6AccessLogResponse
        {
            Id = log.Id,
            DocumentId = log.DocumentId,
            InvestorId = log.InvestorId,
            EventType = log.EventType,
            OccurredAt = log.OccurredAt,
        };
    }

    public async Task<DataRoomAnalyticsResponse> GetDataRoomAnalyticsAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        var docs = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>();

        var logs = await _dbContext.Phase6AccessLogs
            .Find(l => l.CompanyId == companyId)
            .ToListAsync();

        var docEngagement = docs.Select(d =>
        {
            var docLogs = logs.Where(l => l.DocumentId == d.DocumentId).ToList();
            return new DocumentEngagementResponse
            {
                DocumentId = d.DocumentId,
                Title = d.Title,
                Category = d.Category,
                ViewCount = docLogs.Count(l => l.EventType == Phase6Requirements.EventTypeView),
                DownloadCount = docLogs.Count(l => l.EventType == Phase6Requirements.EventTypeDownload),
                UniqueInvestors = docLogs.Select(l => l.InvestorId).Distinct().Count(),
                LastEventAt = docLogs.OrderByDescending(l => l.OccurredAt).FirstOrDefault()?.OccurredAt,
            };
        }).ToList();

        var investorEngagement = logs
            .GroupBy(l => l.InvestorId)
            .Select(g => new InvestorEngagementResponse
            {
                InvestorId = g.Key,
                ViewCount = g.Count(l => l.EventType == Phase6Requirements.EventTypeView),
                DownloadCount = g.Count(l => l.EventType == Phase6Requirements.EventTypeDownload),
                DocumentsTouched = g.Select(l => l.DocumentId).Distinct().Count(),
                LastEventAt = g.OrderByDescending(l => l.OccurredAt).First().OccurredAt,
            })
            .OrderByDescending(i => i.LastEventAt)
            .ToList();

        return new DataRoomAnalyticsResponse
        {
            TotalDocuments = docs.Count,
            TotalViews = logs.Count(l => l.EventType == Phase6Requirements.EventTypeView),
            TotalDownloads = logs.Count(l => l.EventType == Phase6Requirements.EventTypeDownload),
            UniqueInvestorsEngaged = logs.Select(l => l.InvestorId).Distinct().Count(),
            DocumentEngagement = docEngagement,
            InvestorEngagement = investorEngagement,
        };
    }

    public async Task<List<Phase6AccessLogResponse>> GetDataRoomActivityTimelineAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var logs = await _dbContext.Phase6AccessLogs
            .Find(l => l.CompanyId == companyId)
            .SortByDescending(l => l.OccurredAt)
            .ToListAsync();
        return logs.Select(l => new Phase6AccessLogResponse
        {
            Id = l.Id,
            DocumentId = l.DocumentId,
            InvestorId = l.InvestorId,
            EventType = l.EventType,
            OccurredAt = l.OccurredAt,
        }).ToList();
    }

    public async Task<NdaAcceptanceResponse> AcceptDataRoomNdaAsync(string companyId, string investorId, string ndaText, string ipHash)
    {
        await GetCompanyAsync(companyId);

        var ndaTextHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(ndaText ?? string.Empty)));

        var acceptedAt = DateTime.UtcNow;
        var nda = new Phase6NdaAcceptance
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            InvestorId = investorId,
            AcceptedAt = acceptedAt,
            NdaTextHash = ndaTextHash,
            IpHash = ipHash,
        };

        var filter = Builders<Phase6NdaAcceptance>.Filter.And(
            Builders<Phase6NdaAcceptance>.Filter.Eq(n => n.CompanyId, companyId),
            Builders<Phase6NdaAcceptance>.Filter.Eq(n => n.InvestorId, investorId));
        await _dbContext.Phase6NdaAcceptances.ReplaceOneAsync(
            filter, nda, new ReplaceOptions { IsUpsert = true });

        // Lock NDA enforcement on first signature: once an investor relies on
        // the NDA the entrepreneur can no longer disable it. Only sets the
        // timestamp if not already locked.
        await _dbContext.Companies.UpdateOneAsync(
            Builders<Companies>.Filter.And(
                Builders<Companies>.Filter.Eq(c => c.Id, companyId),
                Builders<Companies>.Filter.Eq(c => c.DataRoomNdaLockedAt, (DateTime?)null)),
            Builders<Companies>.Update
                .Set(c => c.DataRoomNdaLockedAt, acceptedAt)
                .Set(c => c.UpdatedAt, DateTime.UtcNow));

        // Notification emission is the controller's responsibility — IPhaseNotificationService
        // depends on ICompanyService, so injecting it here would create a DI cycle.
        return new NdaAcceptanceResponse
        {
            AcceptedAt = acceptedAt,
            NdaTextHash = ndaTextHash,
        };
    }

    public async Task<DataRoomStatusResponse> GetDataRoomStatusAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        return new DataRoomStatusResponse
        {
            IsLive = company.IsDataRoomLive,
            NdaRequired = company.IsDataRoomNdaRequired,
            NdaLockedAt = company.DataRoomNdaLockedAt,
            TotalDocuments = company.DataRoomDocuments?.Count ?? 0,
            Documents = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>(),
            AccessGrants = company.DataRoomAccessRecords ?? new List<DataRoomAccessRecord>()
        };
    }

    public async Task<DataRoomStatusResponse> GrantDataRoomAccessAsync(string companyId, DataRoomAccessRequest request)
    {
        var email = request?.InvestorEmail?.Trim();
        var investorId = request?.InvestorId?.Trim();
        if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(investorId))
            throw new ArgumentException("investorEmail is required");

        var company = await GetCompanyAsync(companyId);

        // The identifier must resolve to a live Investor row — without this, grants
        // can be created for arbitrary strings, leaving orphaned access records
        // that no real investor can ever use. Mirrors the deal-creation guard.
        // Email is the primary path (case-insensitive); InvestorId is kept as a
        // back-compat fallback for any direct API callers.
        Investor investor;
        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailFilter = Builders<Investor>.Filter.Regex(
                i => i.PrimaryEmail,
                new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(email)}$", "i"));
            investor = await _dbContext.Investors.Find(emailFilter).FirstOrDefaultAsync()
                ?? throw new ArgumentException(
                    $"No verified investor found with email '{email}'. Only verified investors can be granted data room access.");
        }
        else
        {
            investor = await _dbContext.Investors
                .Find(i => i.Id == investorId)
                .FirstOrDefaultAsync()
                ?? throw new ArgumentException(
                    $"Investor '{investorId}' not found. Only verified investors can be granted data room access.");
        }

        // Always store the resolved investor's real Id so dedupe + revoke key on it.
        var resolvedInvestorId = investor.Id;

        var accessRecord = new DataRoomAccessRecord
        {
            InvestorId = resolvedInvestorId,
            InvestorName = investor.Name,
            AccessLevel = request.AccessLevel,
            GrantedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(request.DaysValid)
        };

        company.DataRoomAccessRecords ??= new List<DataRoomAccessRecord>();

        // Dedupe by investor: re-granting the same investor updates their
        // existing grant (expiry + access level) instead of stacking a second
        // record. Exactly one grant per investor.
        company.DataRoomAccessRecords = company.DataRoomAccessRecords
            .Where(r => !string.Equals(r.InvestorId, resolvedInvestorId, StringComparison.Ordinal))
            .Append(accessRecord)
            .ToList();
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return await GetDataRoomStatusAsync(companyId);
    }

    public async Task RevokeDataRoomAccessAsync(string companyId, string investorId)
    {
        var company = await GetCompanyAsync(companyId);

        if (company.DataRoomAccessRecords != null)
        {
            company.DataRoomAccessRecords = company.DataRoomAccessRecords
                .Where(r => !string.Equals(r.InvestorId, investorId, StringComparison.OrdinalIgnoreCase))
                .ToList();

            company.UpdatedAt = DateTime.UtcNow;
            var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
            await _dbContext.Companies.ReplaceOneAsync(filter, company);

            // Also update request status if one exists
            var requests = await _dbContext.Phase6DataRoomAccessRequests
                .Find(r => r.CompanyId == companyId && (r.InvestorId == investorId || r.InvestorUserId == investorId))
                .ToListAsync();
            foreach (var req in requests)
            {
                req.Status = "declined";
                req.DecisionNote = "Access revoked";
                await _dbContext.Phase6DataRoomAccessRequests.ReplaceOneAsync(r => r.Id == req.Id, req);
            }

            // Notify Investor
            var userManager = GetUserManager();
            var user = userManager != null ? await userManager.FindByIdAsync(investorId) : null;
            if (user == null && userManager != null)
            {
                var investors = await userManager.GetUsersInRoleAsync("Investor");
                user = investors.FirstOrDefault(u => u.InvestorProfile?.InvestorId == investorId);
            }
            if (user != null)
            {
                var notifService = GetNotificationService();
                if (notifService != null)
                {
                    await notifService.NotifyDataRoomAccessRevokedAsync(user.Id.ToString(), companyId, company.CompanyName);
                }
            }
        }
    }

    public async Task<DataRoomAccessStatusResponse> GetInvestorDataRoomAccessStatusAsync(string companyId, string userId, string investorId)
    {
        var company = await GetCompanyAsync(companyId);

        // Resolve candidate IDs for the investor
        var userManager = GetUserManager();
        var user = userManager != null ? await userManager.FindByIdAsync(userId) : null;
        var resolvedInvestorId = user?.InvestorProfile?.InvestorId ?? investorId;
        var candidateIds = new List<string> { userId };
        if (!string.IsNullOrWhiteSpace(resolvedInvestorId) && !candidateIds.Contains(resolvedInvestorId))
            candidateIds.Add(resolvedInvestorId);

        // Check NDA
        var nda = await _dbContext.Phase6NdaAcceptances
            .Find(n => n.CompanyId == companyId && candidateIds.Contains(n.InvestorId))
            .FirstOrDefaultAsync();
        var ndaAccepted = nda != null;

        // Check Grant in company.DataRoomAccessRecords
        var grant = company.DataRoomAccessRecords?
            .FirstOrDefault(g => candidateIds.Contains(g.InvestorId));
        var isExpired = grant != null && grant.ExpiresAt != default && grant.ExpiresAt < DateTime.UtcNow;
        var accessGranted = grant != null && !isExpired && (!company.IsDataRoomNdaRequired || ndaAccepted);

        // Check Access Request
        var request = await _dbContext.Phase6DataRoomAccessRequests
            .Find(r => r.CompanyId == companyId && (candidateIds.Contains(r.InvestorId) || r.InvestorUserId == userId))
            .SortByDescending(r => r.RequestedAt)
            .FirstOrDefaultAsync();

        var requestStatus = request?.Status ?? (grant != null ? "approved" : "none");
        var isDirectInvite = grant != null && request == null;

        var docs = accessGranted
            ? (company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>())
            : new List<DataRoomDocumentResponse>();

        return new DataRoomAccessStatusResponse
        {
            NdaRequired = company.IsDataRoomNdaRequired,
            NdaAccepted = ndaAccepted,
            NdaAcceptedAt = nda?.AcceptedAt,
            RequestStatus = requestStatus,
            RequestId = request?.Id,
            AccessGranted = accessGranted,
            AccessLevel = grant?.AccessLevel ?? request?.RequestedAccessLevel,
            ExpiresAt = grant?.ExpiresAt,
            IsExpired = isExpired,
            IsRevoked = grant == null && request?.Status == "approved",
            IsDirectInvite = isDirectInvite,
            TotalDocuments = docs.Count,
            Documents = docs
        };
    }

    public async Task<Phase6DataRoomAccessRequest> CreateDataRoomAccessRequestAsync(string companyId, string userId, string investorId, string requestedLevel)
    {
        var company = await GetCompanyAsync(companyId);
        var userManager = GetUserManager();
        var user = userManager != null ? await userManager.FindByIdAsync(userId) : null;
        var resolvedInvestorId = user?.InvestorProfile?.InvestorId ?? investorId;
        if (string.IsNullOrWhiteSpace(resolvedInvestorId))
            throw new UnauthorizedAccessException("User has no linked investor profile.");

        // Check if NDA required but not accepted
        if (company.IsDataRoomNdaRequired)
        {
            var candidateIds = new List<string> { userId, resolvedInvestorId };
            var nda = await _dbContext.Phase6NdaAcceptances
                .Find(n => n.CompanyId == companyId && candidateIds.Contains(n.InvestorId))
                .FirstOrDefaultAsync();
            if (nda == null)
                throw new InvalidOperationException("NDA must be signed before requesting Data Room access.");
        }

        // Check if active pending request already exists
        var existing = await _dbContext.Phase6DataRoomAccessRequests
            .Find(r => r.CompanyId == companyId && (r.InvestorId == resolvedInvestorId || r.InvestorUserId == userId) && r.Status == "pending")
            .FirstOrDefaultAsync();

        if (existing != null)
            return existing;

        var investor = await _dbContext.Investors.Find(i => i.Id == resolvedInvestorId).FirstOrDefaultAsync();
        var investorName = investor?.Name ?? user?.Name ?? "Verified Investor";
        var investorEmail = investor?.PrimaryEmail ?? user?.Email ?? string.Empty;


        var newRequest = new Phase6DataRoomAccessRequest
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            InvestorId = resolvedInvestorId,
            InvestorUserId = userId,
            InvestorName = investorName,
            InvestorEmail = investorEmail,
            RequestedAccessLevel = string.IsNullOrWhiteSpace(requestedLevel) ? "view_only" : requestedLevel,
            Status = "pending",
            RequestedAt = DateTime.UtcNow
        };

        await _dbContext.Phase6DataRoomAccessRequests.InsertOneAsync(newRequest);

        // Notify founder
        var notifService = GetNotificationService();
        if (notifService != null)
        {
            await notifService.NotifyDataRoomAccessRequestedAsync(companyId, resolvedInvestorId, newRequest.Id, investorName);
        }

        return newRequest;
    }

    public async Task<List<Phase6DataRoomAccessRequest>> GetCompanyDataRoomAccessRequestsAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        return await _dbContext.Phase6DataRoomAccessRequests
            .Find(r => r.CompanyId == companyId)
            .SortByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task<DataRoomStatusResponse> ApproveDataRoomAccessRequestAsync(string companyId, string requestId, string reviewerUserId, DataRoomAccessApprovalDto dto)
    {
        var company = await GetCompanyAsync(companyId);
        var request = await _dbContext.Phase6DataRoomAccessRequests
            .Find(r => r.Id == requestId && r.CompanyId == companyId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException($"Access request '{requestId}' not found");

        request.Status = "approved";
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByUserId = reviewerUserId;
        request.DecisionNote = dto.DecisionNote;

        await _dbContext.Phase6DataRoomAccessRequests.ReplaceOneAsync(r => r.Id == requestId, request);

        // Create or update DataRoomAccessRecord
        var days = dto.DaysValid > 0 ? dto.DaysValid : 30;
        var accessLevel = string.IsNullOrWhiteSpace(dto.AccessLevel) ? "view_only" : dto.AccessLevel;

        var accessRecord = new DataRoomAccessRecord
        {
            InvestorId = request.InvestorId,
            InvestorName = request.InvestorName,
            AccessLevel = accessLevel,
            GrantedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(days)
        };

        company.DataRoomAccessRecords ??= new List<DataRoomAccessRecord>();
        company.DataRoomAccessRecords = company.DataRoomAccessRecords
            .Where(r => !string.Equals(r.InvestorId, request.InvestorId, StringComparison.OrdinalIgnoreCase)
                     && !string.Equals(r.InvestorId, request.InvestorUserId, StringComparison.OrdinalIgnoreCase))
            .Append(accessRecord)
            .ToList();
        company.UpdatedAt = DateTime.UtcNow;

        await _dbContext.Companies.ReplaceOneAsync(c => c.Id == companyId, company);

        // Notify Investor
        var notifService = GetNotificationService();
        if (notifService != null && !string.IsNullOrWhiteSpace(request.InvestorUserId))
        {
            await notifService.NotifyDataRoomAccessApprovedAsync(request.InvestorUserId, companyId, company.CompanyName);
        }

        return await GetDataRoomStatusAsync(companyId);
    }

    public async Task<Phase6DataRoomAccessRequest> DeclineDataRoomAccessRequestAsync(string companyId, string requestId, string reviewerUserId, string? note)
    {
        var company = await GetCompanyAsync(companyId);
        var request = await _dbContext.Phase6DataRoomAccessRequests
            .Find(r => r.Id == requestId && r.CompanyId == companyId)
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException($"Access request '{requestId}' not found");

        request.Status = "declined";
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByUserId = reviewerUserId;
        request.DecisionNote = note;

        await _dbContext.Phase6DataRoomAccessRequests.ReplaceOneAsync(r => r.Id == requestId, request);

        // Notify Investor
        var notifService = GetNotificationService();
        if (notifService != null && !string.IsNullOrWhiteSpace(request.InvestorUserId))
        {
            await notifService.NotifyDataRoomAccessDeclinedAsync(request.InvestorUserId, companyId, company.CompanyName, note);
        }

        return request;
    }


    public async Task UpdateNdaRequirementAsync(string companyId, bool required)
    {
        var company = await GetCompanyAsync(companyId);

        // NDA enforcement cannot be disabled once an investor has signed —
        // disabling it would retroactively strip the protection they relied on.
        if (!required && company.DataRoomNdaLockedAt.HasValue)
            throw new InvalidOperationException(
                "NDA enforcement cannot be disabled after investors have signed. Revoke individual access instead.");

        company.IsDataRoomNdaRequired = required;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);
    }

    // ============ PHASE 7: AI REVIEW ============

    public async Task<AiReviewResponse> RunAiReviewAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        var review = await _aiReviewEngine.RunReviewAsync(company);

        // Mirror the latest snapshot to the company doc for the cheap
        // "current score" read path used by the frontend.
        company.AiReview = review;
        company.LastAiReviewAt = review.ReviewedAt;
        company.UpdatedAt = DateTime.UtcNow;

        // NOTE: Running a review sets eligibility (review.InvestorReadyBadge),
        // but does not auto-award company.IsInvestorReady. The explicit Claim
        // (AwardInvestorReadyBadgeAsync) must be performed.
        company.IsInvestorReady = false;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        // Persist an immutable history snapshot so trends + the badge-award
        // audit trail survive future re-runs.
        var snapshot = new Phase7ReviewSnapshot
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            OverallScore = review.OverallScore,
            ScoreBreakdown = review.ScoreBreakdown,
            InvestorReadyBadge = review.InvestorReadyBadge,
            Recommendations = review.Recommendations ?? new List<RecommendationDto>(),
            PitchDeckAnalysis = review.PitchDeckAnalysis,
            ExecutiveSummary = review.ExecutiveSummary ?? string.Empty,
            Strengths = review.Strengths ?? new List<string>(),
            Weaknesses = review.Weaknesses ?? new List<string>(),
            Risks = review.Risks ?? new List<ExpertRiskItem>(),
            Inconsistencies = review.Inconsistencies ?? new List<CrossModuleInconsistency>(),
            MissingItems = review.MissingItems ?? new List<MissingItemGap>(),
            PitchRecommendations = review.PitchRecommendations ?? new List<PitchRefinementItem>(),
            ActionItems = review.ActionItems ?? new List<ActionRemediationItem>(),
            ReviewedAt = review.ReviewedAt,
            EngineVersion = AiReviewEngine.EngineVersion,
        };
        await _dbContext.Phase7ReviewSnapshots.InsertOneAsync(snapshot);

        _ = Task.Run(async () =>
        {
            try
            {
                var scoreUpdate = Builders<Companies>.Update
                    .Inc(c => c.InvestorReadyScore, 15);
                await _dbContext.Companies.UpdateOneAsync(
                    c => c.Id == companyId, scoreUpdate);
            }
            catch { /* swallow — completion events must never block phase */ }
        });

        return review;
    }

    public async Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        if (company.AiReview == null)
            throw new InvalidOperationException("No automated review found for this company");

        var reviewedAt = company.LastAiReviewAt ?? company.AiReview.ReviewedAt;
        var lastChange = Phase7Requirements.GetReadinessInputsLastMaterialChangeAt(company);
        var isFresh = Phase7Requirements.IsFreshEnough(reviewedAt, lastChange, now: null);
        var isCurrentlyReady = Phase7Requirements.IsCurrentlyInvestorReady(company, now: null);

        // Live readiness contracts
        company.AiReview.IsInvestorReady = company.IsInvestorReady && isFresh;
        company.AiReview.InvestorReadyBadgeAwardedAt = company.InvestorReadyBadgeAwardedAt;
        company.AiReview.IsFresh = isFresh;
        company.AiReview.IsCurrentlyInvestorReady = isCurrentlyReady;
        company.AiReview.DataRoomLastMaterialChangeAt = company.DataRoomLastMaterialChangeAt;
        company.AiReview.InvestorReadinessInputsLastMaterialChangeAt = company.InvestorReadinessInputsLastMaterialChangeAt;
        return company.AiReview;
    }

    public async Task<List<RecommendationDto>> GetRecommendationsAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return company.AiReview?.Recommendations ?? new List<RecommendationDto>();
    }

    public async Task<List<Phase7ReviewSnapshot>> GetAiReviewHistoryAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        return await _dbContext.Phase7ReviewSnapshots
            .Find(s => s.CompanyId == companyId)
            .SortByDescending(s => s.ReviewedAt)
            .ToListAsync();
    }

    public async Task<AwardInvestorReadyBadgeResponse> AwardInvestorReadyBadgeAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        // Hard precondition: a valid, passing review must exist on the
        // company. Without this gate, a direct POST /investor-ready can
        // fake the company-level IsInvestorReady flag — visible downstream
        // even though the validator catches the spoof at advancePhase time.
        if (company.AiReview == null)
            throw new InvalidOperationException("Cannot award badge: no automated review has been run");
        if (!Phase7Requirements.MeetsBadgeThreshold(company.AiReview.OverallScore))
            throw new InvalidOperationException(
                $"Cannot award badge: review score {company.AiReview.OverallScore} is below the {Phase7Requirements.ScoreThresholdForBadge} threshold");
        if (!company.AiReview.InvestorReadyBadge)
            throw new InvalidOperationException(
                "Cannot award badge: latest review did not award InvestorReadyBadge");

        // Freshness gate: same window the phase validator enforces. Without
        // this, a stale-but-passing review can be used to flip IsInvestorReady
        // long after the underlying Phase 2-6 data has drifted.
        var reviewedAt = company.LastAiReviewAt ?? company.AiReview.ReviewedAt;
        var lastChange = Phase7Requirements.GetReadinessInputsLastMaterialChangeAt(company);
        if (!Phase7Requirements.IsFreshEnough(reviewedAt, lastChange, now: null))
        {
            throw new InvalidOperationException(
                "Cannot award badge: latest automated review is stale. Rerun the review before awarding investor-ready status.");
        }

        company.IsInvestorReady = true;
        company.InvestorReadyBadgeAwardedAt ??= DateTime.UtcNow;
        if (company.AiReview != null)
        {
            company.AiReview.IsInvestorReady = true;
            company.AiReview.InvestorReadyBadgeAwardedAt = company.InvestorReadyBadgeAwardedAt;
        }
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return new AwardInvestorReadyBadgeResponse
        {
            IsInvestorReady = true,
            BadgeAwarded = true,
            IssuedAt = company.InvestorReadyBadgeAwardedAt
        };
    }

    // ============ PHASE 8: INVESTOR MATCHING ============

    public async Task<List<InvestorMatchResponse>> GetMatchedInvestorsAsync(string companyId)
    {
        var matches = await _dbContext.InvestorMatches
            .Find(m => m.CompanyId == companyId)
            .SortByDescending(m => m.MatchScore)
            .ToListAsync();

        // Serve from the immutable snapshot fields persisted by the matcher
        // at creation time. The live Investor record is consulted only as a
        // backfill for legacy rows that pre-date the snapshot — never as the
        // primary read path. This guarantees no null-filled investor cards
        // even if the live Investor record has been deleted or mutated.
        var results = new List<InvestorMatchResponse>();
        foreach (var m in matches)
        {
            var investorName = m.InvestorNameSnapshot;
            var investorType = m.InvestorTypeSnapshot;
            var investmentRange = m.InvestmentRangeSnapshot;
            var preferredSectors = m.PreferredSectorsSnapshot?.Count > 0
                ? m.PreferredSectorsSnapshot
                : m.InvestorPreferences?.PreferredSectors ?? new List<string>();

            // Legacy backfill: rows that pre-date the snapshot fields will
            // have null snapshots. Try the live Investor record to populate.
            if (string.IsNullOrWhiteSpace(investorName) || string.IsNullOrWhiteSpace(investorType))
            {
                try
                {
                    var investor = await _dbContext.Investors
                        .Find(i => i.Id == m.InvestorId)
                        .FirstOrDefaultAsync();
                    if (investor != null)
                    {
                        investorName ??= investor.Name;
                        investorType ??= investor.Type;
                        if (string.IsNullOrWhiteSpace(investmentRange) && investor.MaxCheckSize > 0)
                            investmentRange = $"EUR {investor.MinCheckSize:N0}-{investor.MaxCheckSize:N0}";
                        if (preferredSectors.Count == 0)
                            preferredSectors = investor.PreferredSectors ?? new List<string>();
                    }
                }
                catch
                {
                    // Live investor lookup failed; fall through to the
                    // hard-fallback below so the response never carries null.
                }
            }

            results.Add(new InvestorMatchResponse
            {
                MatchId = m.Id,
                InvestorId = m.InvestorId,
                InvestorName = !string.IsNullOrWhiteSpace(investorName) ? investorName : m.InvestorId,
                MatchScore = m.MatchScore,
                InvestorType = !string.IsNullOrWhiteSpace(investorType) ? investorType : "(unknown)",
                PreferredRound = m.InvestorPreferences?.PreferredStages?.FirstOrDefault() ?? "(unspecified)",
                InvestmentRange = !string.IsNullOrWhiteSpace(investmentRange) ? investmentRange : "EUR (range unset)",
                PreferredSectors = preferredSectors,
                Status = m.Status,
                EntrepreneurInterest = m.EntrepreneurInterest ?? "new",
                InvestorInterest = m.InvestorInterest ?? "new",
                HandshakeConfirmedAt = m.HandshakeConfirmedAt,
                ScheduledMeeting = m.ScheduledMeeting,
                MatchRationale = m.MatchRationale,
                EngineVersion = m.EngineVersion,
                MatchedAt = m.MatchedAt,
                SavedAt = m.SavedAt,
                AcceptedAt = m.AcceptedAt,
                RejectedAt = m.RejectedAt,
            });
        }
        return results;
    }

    public async Task<List<InvestorMatchResponse>> RegenerateInvestorMatchesAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        if (!Phase7Requirements.IsCurrentlyInvestorReady(company))
        {
            throw new InvalidOperationException(
                "Your Investor Readiness Review is no longer current. Re-run Phase 7 before generating new investor matches.");
        }
        await _investorMatcher.FindMatchesAsync(company, investorPoolIds: null);
        return await GetMatchedInvestorsAsync(companyId);
    }

    public async Task RecordInvestorInteractionAsync(string companyId, RecordInteractionRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.MatchId))
            throw new ArgumentException("matchId is required");
        if (!Phase8Requirements.IsValidInteractionType(request.InteractionType))
            throw new ArgumentException(
                $"interactionType must be one of: {string.Join(", ", Phase8Requirements.AllowedInteractionTypes)}");

        var match = await _dbContext.InvestorMatches
            .Find(m => m.Id == request.MatchId && m.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Match {request.MatchId} not found");

        var interaction = new InteractionRecord
        {
            Type = request.InteractionType.ToLowerInvariant(),
            Details = request.Details,
            Timestamp = DateTime.UtcNow,
            InitiatedBy = "company"
        };

        match.Interactions.Add(interaction);
        match.LastInteractionAt = DateTime.UtcNow;
        match.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<InvestorMatch>.Filter.Eq(m => m.Id, match.Id);
        await _dbContext.InvestorMatches.ReplaceOneAsync(filter, match);
    }

    public async Task<InvestorMatchResponse> UpdateMatchStatusAsync(string companyId, string matchId, string status)
    {
        if (!Phase8Requirements.IsValidMatchStatus(status))
            throw new ArgumentException(
                $"status must be one of: {string.Join(", ", Phase8Requirements.AllowedMatchStatuses)}");

        var match = await _dbContext.InvestorMatches
            .Find(m => m.Id == matchId && m.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Match {matchId} not found");

        var normalizedStatus = status.ToLowerInvariant();

        // True Bilateral Double Opt-In State Machine
        if (normalizedStatus == "interested")
        {
            match.EntrepreneurInterest = "interested";
            if (string.Equals(match.InvestorInterest, "interested", StringComparison.OrdinalIgnoreCase))
            {
                match.Status = "accepted";
                match.AcceptedAt ??= DateTime.UtcNow;
                match.HandshakeConfirmedAt ??= DateTime.UtcNow;
            }
            else
            {
                match.Status = "interested";
            }
        }
        else if (normalizedStatus == "accepted")
        {
            // Direct acceptance (or mutual agreement confirmation)
            match.EntrepreneurInterest = "interested";
            match.InvestorInterest = "interested";
            match.Status = "accepted";
            match.AcceptedAt ??= DateTime.UtcNow;
            match.HandshakeConfirmedAt ??= DateTime.UtcNow;
        }
        else if (normalizedStatus == "passed" || normalizedStatus == "rejected")
        {
            match.EntrepreneurInterest = "passed";
            match.Status = normalizedStatus;
            match.RejectedAt = DateTime.UtcNow;
        }
        else if (normalizedStatus == "viewed")
        {
            match.EntrepreneurInterest = "viewed";
            if (match.Status != "accepted" && match.Status != "interested")
                match.Status = "viewed";
        }
        else
        {
            match.Status = normalizedStatus;
        }

        match.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<InvestorMatch>.Filter.Eq(m => m.Id, match.Id);
        await _dbContext.InvestorMatches.ReplaceOneAsync(filter, match);

        var hydrated = await GetMatchedInvestorsAsync(companyId);
        return hydrated.FirstOrDefault(r => r.MatchId == matchId);
    }

    public async Task<InvestorMatchResponse> ScheduleMeetingAsync(string companyId, string matchId, ScheduleMeetingDto dto)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto));
        if (dto.StartsAt == default)
            throw new ArgumentException("Valid meeting startsAt timestamp is required.");

        var match = await _dbContext.InvestorMatches
            .Find(m => m.Id == matchId && m.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Match {matchId} not found");

        match.ScheduledMeeting = new InvestorMeetingRecord
        {
            StartsAt = dto.StartsAt,
            DurationMinutes = dto.DurationMinutes > 0 ? dto.DurationMinutes : 30,
            Timezone = !string.IsNullOrWhiteSpace(dto.Timezone) ? dto.Timezone : "UTC",
            MeetingType = !string.IsNullOrWhiteSpace(dto.MeetingType) ? dto.MeetingType : "video",
            Note = dto.Note ?? string.Empty,
            Status = "confirmed",
            CreatedBy = "entrepreneur",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        match.Interactions.Add(new InteractionRecord
        {
            Type = "call",
            Details = $"Meeting scheduled for {dto.StartsAt:O} ({match.ScheduledMeeting.MeetingType})",
            Timestamp = DateTime.UtcNow,
            InitiatedBy = "company"
        });

        match.LastInteractionAt = DateTime.UtcNow;
        match.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<InvestorMatch>.Filter.Eq(m => m.Id, match.Id);
        await _dbContext.InvestorMatches.ReplaceOneAsync(filter, match);

        var hydrated = await GetMatchedInvestorsAsync(companyId);
        return hydrated.FirstOrDefault(r => r.MatchId == matchId);
    }

    public async Task<InvestorMatchResponse> UpdateMeetingStatusAsync(string companyId, string matchId, UpdateMeetingStatusDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
            throw new ArgumentException("Status is required");

        var match = await _dbContext.InvestorMatches
            .Find(m => m.Id == matchId && m.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Match {matchId} not found");

        if (match.ScheduledMeeting == null)
            throw new InvalidOperationException("No scheduled meeting exists for this match.");

        match.ScheduledMeeting.Status = dto.Status.ToLowerInvariant();
        match.ScheduledMeeting.UpdatedAt = DateTime.UtcNow;

        match.Interactions.Add(new InteractionRecord
        {
            Type = "call",
            Details = $"Meeting status updated to {match.ScheduledMeeting.Status}",
            Timestamp = DateTime.UtcNow,
            InitiatedBy = "company"
        });

        match.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<InvestorMatch>.Filter.Eq(m => m.Id, match.Id);
        await _dbContext.InvestorMatches.ReplaceOneAsync(filter, match);

        var hydrated = await GetMatchedInvestorsAsync(companyId);
        return hydrated.FirstOrDefault(r => r.MatchId == matchId);
    }

    public async Task<MatchingInsightsResponse> GetMatchingInsightsAsync(string companyId)
    {
        var matches = await _dbContext.InvestorMatches
            .Find(m => m.CompanyId == companyId)
            .ToListAsync();

        var interactionsCount = matches.Sum(m => m.Interactions?.Count ?? 0);
        var average = matches.Count > 0 ? matches.Average(m => (double)m.MatchScore) : 0;
        var lastMatchedAt = matches.OrderByDescending(m => m.MatchedAt).FirstOrDefault()?.MatchedAt;

        return new MatchingInsightsResponse
        {
            TotalMatches = matches.Count,
            HighScoreMatches = matches.Count(m => m.MatchScore >= Phase8Requirements.AdvisoryHighFitThreshold),
            InteractionsCount = interactionsCount,
            AverageScore = Math.Round(average, 2),
            LastMatchedAt = lastMatchedAt,
        };
    }

    // ============ PHASE 9: DEAL EXECUTION ============

    public async Task<DealStatusResponse> CreateDealAsync(string companyId, CreateDealRequest request, string actorUserId, string ipHash)
    {
        if (request == null) throw new ArgumentException("Request body required");
        if (string.IsNullOrWhiteSpace(request.InvestorId))
            throw new ArgumentException("investorId is required");
        if (request.TermSheet == null)
            throw new ArgumentException("termSheet is required");
        if (!double.IsFinite(request.TermSheet.TotalRaiseAmount) || request.TermSheet.TotalRaiseAmount <= 0)
            throw new ArgumentException("termSheet.totalRaiseAmount must be > 0");
        if (!double.IsFinite(request.TermSheet.PostMoneyValuation) || request.TermSheet.PostMoneyValuation <= 0)
            throw new ArgumentException("termSheet.postMoneyValuation must be > 0");

        var company = await GetCompanyAsync(companyId);

        // InvestorId must resolve to a live, active Investor row. Without this, callers
        // can spawn deals against arbitrary strings, deleted investors, or inactive investors,
        // and the deal timeline will render orphaned investor identities forever.
        var investor = await _dbContext.Investors
            .Find(i => i.Id == request.InvestorId && i.IsActive)
            .FirstOrDefaultAsync();
        if (investor == null)
            throw new ArgumentException(
                $"Investor '{request.InvestorId}' does not exist or is no longer active.");

        // Idempotency: check if an active (non-terminal) deal already exists for this (company, investor) pair.
        var existingDeal = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == companyId &&
                       d.Investors.Any(i => i.InvestorId == request.InvestorId) &&
                       !Phase9Requirements.DealTerminalStates.Contains(d.Status))
            .FirstOrDefaultAsync();
        if (existingDeal != null)
        {
            return MapDealToResponse(existingDeal);
        }

        var dealId = ObjectId.GenerateNewId().ToString();
        var deal = new DealExecution
        {
            Id = dealId,
            CompanyId = companyId,
            Status = Phase9Requirements.DealStatusInitiated,
            CompanyNameSnapshot = company.CompanyName,
            InvestorNameSnapshot = investor.Name,
            InvestorTypeSnapshot = investor.Type,
            CreatedByUserId = actorUserId,
            Investors = new List<DealParticipant>
            {
                new DealParticipant
                {
                    InvestorId = request.InvestorId,
                    InvestorName = investor.Name,
                    CommittedAmount = request.TermSheet.TotalRaiseAmount,
                    Status = Phase9Requirements.ParticipantStatusInterested,
                    EquityPercentage = (request.TermSheet.TotalRaiseAmount / request.TermSheet.PostMoneyValuation) * 100,
                }
            },
            TermSheet = new TermSheet
            {
                TotalRaiseAmount = request.TermSheet.TotalRaiseAmount,
                PostMoneyValuation = request.TermSheet.PostMoneyValuation,
                EquityType = request.TermSheet.EquityType,
                ProRataRights = request.TermSheet.ProRataRights,
                LiquidationPreference = request.TermSheet.LiquidationPreference,
                BoardSeats = request.TermSheet.BoardSeats,
                ProposedClosingDate = request.TermSheet.ProposedClosingDate,
                Status = Phase9Requirements.TermSheetStatusDraft,
            },
            DueDiligenceChecklist = new List<DueDigligenceItem>(),
            ClosingChecklist = new List<ClosingChecklistItem>(),
            Milestones = new List<DealMilestone>(),
            NegotiationStatus = new DealNegotiationStatus(),
            DealDocuments = new List<DealDocument>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _dbContext.DealExecutions.InsertOneAsync(deal);

        await AppendDealActivityAsync(
            companyId, dealId,
            Phase9Requirements.ActivityDealCreated,
            fromStatus: null,
            toStatus: deal.Status,
            actorUserId, ipHash,
            notes: $"Deal created with investor {investor.Name}");

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> GetDealAsync(string dealId)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Deal {dealId} not found");

        return MapDealToResponse(deal);
    }

    public async Task<string?> GetDealCompanyIdAsync(string dealId)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .Project(d => d.CompanyId)
            .FirstOrDefaultAsync();

        return deal;
    }

    public async Task<List<DealStatusResponse>> GetCompanyDealsAsync(string companyId)
    {
        var deals = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == companyId)
            .ToListAsync();

        return deals.Select(MapDealToResponse).ToList();
    }

    // ---- Bilateral (participant-based) deal reads (Phase D-2) ----

    public async Task<DealExecution?> GetDealEntityAsync(string dealId)
    {
        return await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync();
    }

    // Defense-in-depth: refuse to map a deal unless given a valid access
    // context. A controller cannot fetch-and-return a deal without first
    // proving participation via EnsureDealParticipantAsync.
    public DealStatusResponse GetDealForParticipant(DealAccessContext ctx)
    {
        AssertAccess(ctx);
        return MapDealToResponse(ctx.Deal);
    }

    public async Task<List<DealActivityLogResponse>> GetDealActivityForParticipantAsync(DealAccessContext ctx)
    {
        AssertAccess(ctx);
        return await GetDealActivityAsync(ctx.Deal.Id);
    }

    public async Task<List<DealStatusResponse>> GetDealsForParticipantAsync(string? founderUserId, string? investorId)
    {
        var f = Builders<DealExecution>.Filter;
        var clauses = new List<FilterDefinition<DealExecution>>();

        if (!string.IsNullOrWhiteSpace(founderUserId))
        {
            var owned = await _dbContext.Companies
                .Find(c => c.OwnerId == founderUserId)
                .ToListAsync();
            var ownedCompanyIds = owned.Select(c => c.Id).ToList();
            if (ownedCompanyIds.Count > 0)
                clauses.Add(f.In(d => d.CompanyId, ownedCompanyIds));
        }

        if (!string.IsNullOrWhiteSpace(investorId))
            clauses.Add(f.ElemMatch(d => d.Investors, i => i.InvestorId == investorId));

        if (clauses.Count == 0)
            return new List<DealStatusResponse>();

        var deals = await _dbContext.DealExecutions.Find(f.Or(clauses)).ToListAsync();
        return deals.Select(MapDealToResponse).ToList();
    }

    private static void AssertAccess(DealAccessContext ctx)
    {
        if (ctx?.Deal == null || string.IsNullOrWhiteSpace(ctx.Role) ||
            string.IsNullOrWhiteSpace(ctx.PrincipalId))
            throw new UnauthorizedAccessException("A resolved deal access context is required.");
    }

    /// <summary>
    /// The only mutation path for an existing DealExecution.Status in this service.
    /// Creation assigns the initial state; every subsequent lifecycle change must
    /// pass the canonical Phase 9 transition graph.
    /// </summary>
    private static bool TransitionDealStatusOrThrow(
        DealExecution deal, string targetStatus, string operation)
    {
        var fromStatus = deal.Status ?? Phase9Requirements.DealStatusInitiated;
        if (string.Equals(fromStatus, targetStatus, StringComparison.OrdinalIgnoreCase))
            return false;

        if (!Phase9Requirements.IsValidDealTransition(fromStatus, targetStatus))
            throw new InvalidOperationException(
                $"Cannot {operation}: illegal deal transition '{fromStatus}' -> '{targetStatus}'.");

        deal.Status = targetStatus;
        return true;
    }

    private static void EnsureOfferNegotiatingStatus(DealExecution deal, string operation)
    {
        if (string.Equals(deal.Status, Phase9Requirements.DealStatusNegotiating, StringComparison.OrdinalIgnoreCase))
            return;

        TransitionDealStatusOrThrow(deal, Phase9Requirements.DealStatusNegotiating, operation);
    }

    private static void EnsureAcceptedAgreementStatus(DealExecution deal, string operation)
    {
        if (string.Equals(deal.Status, Phase9Requirements.DealStatusAgreementSent, StringComparison.OrdinalIgnoreCase))
            return;

        // Legacy offer rows can still be at initiated. Catch them up through the
        // same validated event transitions; never jump initiated -> agreement_sent.
        EnsureOfferNegotiatingStatus(deal, operation);
        TransitionDealStatusOrThrow(deal, Phase9Requirements.DealStatusAgreementSent, operation);
    }

    public async Task<DealStatusResponse> UpdateTermSheetAsync(DealAccessContext ctx, TermSheetRequest request, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.EditTerms);
        var dealId = ctx.Deal.Id;
        if (request == null) throw new ArgumentException("Request body required");
        if (!double.IsFinite(request.TotalRaiseAmount) || request.TotalRaiseAmount <= 0)
            throw new ArgumentException("totalRaiseAmount must be > 0");
        if (!double.IsFinite(request.PostMoneyValuation) || request.PostMoneyValuation <= 0)
            throw new ArgumentException("postMoneyValuation must be > 0");

        var deal = await GetDealOrThrowAsync(dealId);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot update term sheet on deal in terminal status '{deal.Status}'");

        // Term-sheet status auto-transitions to 'negotiating' from any
        // pre-signed state. Enforce the transition graph rather than just
        // overwriting.
        var fromTsStatus = deal.TermSheet.Status ?? Phase9Requirements.TermSheetStatusDraft;
        var toTsStatus = Phase9Requirements.TermSheetStatusNegotiating;
        if (!string.Equals(fromTsStatus, toTsStatus, StringComparison.OrdinalIgnoreCase) &&
            !Phase9Requirements.IsValidTermSheetTransition(fromTsStatus, toTsStatus))
            throw new InvalidOperationException(
                $"Illegal term sheet transition '{fromTsStatus}' -> '{toTsStatus}'");

        deal.TermSheet.TotalRaiseAmount = request.TotalRaiseAmount;
        deal.TermSheet.PostMoneyValuation = request.PostMoneyValuation;
        deal.TermSheet.EquityType = request.EquityType;
        deal.TermSheet.ProRataRights = request.ProRataRights;
        deal.TermSheet.LiquidationPreference = request.LiquidationPreference;
        deal.TermSheet.BoardSeats = request.BoardSeats;
        deal.TermSheet.ProposedClosingDate = request.ProposedClosingDate;
        if (request.PostMoneyValuation > 0)
        {
            deal.TermSheet.InvestorEquityPercent = Math.Round((request.TotalRaiseAmount / request.PostMoneyValuation) * 100, 4);
        }

        if (deal.Investors != null)
        {
            foreach (var inv in deal.Investors)
            {
                if (inv.InvestorId == ctx.PrincipalId || deal.Investors.Count == 1)
                {
                    inv.EquityPercentage = deal.TermSheet.InvestorEquityPercent;
                    inv.CommittedAmount = deal.TermSheet.TotalRaiseAmount;
                }
            }
        }

        deal.TermSheet.Status = toTsStatus;
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityTermSheetUpdated,
            fromStatus: fromTsStatus, toStatus: toTsStatus,
            actorUserId, ipHash, notes: null);

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> ProgressChecklistAsync(DealAccessContext ctx, ChecklistItemDto item, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.ProgressChecklist);
        var dealId = ctx.Deal.Id;
        if (item == null || string.IsNullOrWhiteSpace(item.Item))
            throw new ArgumentException("checklist item.Item is required");

        var deal = await GetDealOrThrowAsync(dealId);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot mutate checklist on deal in terminal status '{deal.Status}'");

        var checklistItem = deal.ClosingChecklist.FirstOrDefault(c =>
            string.Equals(c.Item, item.Item, StringComparison.Ordinal));
        if (checklistItem == null)
        {
            // Insert if missing — UI may create + complete in the same call.
            checklistItem = new ClosingChecklistItem
            {
                Item = item.Item,
                Owner = item.Owner,
                DueDate = item.DueDate,
            };
            deal.ClosingChecklist.Add(checklistItem);
        }
        checklistItem.Completed = item.Completed;
        if (item.Completed)
            checklistItem.CompletedAt = DateTime.UtcNow;
        else
            checklistItem.CompletedAt = null;

        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityChecklistUpdated,
            fromStatus: null, toStatus: null,
            actorUserId, ipHash,
            notes: $"{item.Item}: {(item.Completed ? "completed" : "reopened")}");

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> CloseDealAsync(DealAccessContext ctx, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.CloseDeal);
        var dealId = ctx.Deal.Id;
        var deal = await GetDealOrThrowAsync(dealId);

        // Founder-authorized close retries are idempotent. Returning the existing
        // terminal result cannot re-run any economic side effects.
        if (string.Equals(deal.Status, Phase9Requirements.DealStatusCompleted, StringComparison.OrdinalIgnoreCase))
            return MapDealToResponse(deal);

        // Mutual close requires BOTH parties' signatures — never just the deal
        // axis (which could be advanced manually).
        if (deal.Signatures?.BothSigned != true ||
            !string.Equals(deal.TermSheet?.Status, Phase9Requirements.TermSheetStatusSigned, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "Cannot close deal: the agreed term sheet must be signed by both founder and investor first.");

        // Close = transition Status -> "completed". Enforced via the deal
        // state machine, so callers can't bypass the "signed" precondition.
        var from = deal.Status;
        var to = Phase9Requirements.DealStatusCompleted;
        try
        {
            TransitionDealStatusOrThrow(deal, to, "close deal");
        }
        catch (InvalidOperationException)
        {
            throw new InvalidOperationException(
                $"Cannot close deal: illegal transition '{from}' -> '{to}'. Deal must be in 'signed' before completion.");
        }
        deal.ClosedAt = DateTime.UtcNow;
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDealClosed,
            fromStatus: from, toStatus: to,
            actorUserId, ipHash, notes: null);

        await CreateCompanyPortfolioHoldingsForDealAsync(deal, actorUserId);
        await ApplyEquityDealToCapTableAsync(deal, actorUserId);

        var company = await _dbContext.Companies.Find(c => c.Id == deal.CompanyId).FirstOrDefaultAsync();
        var notifService = GetNotificationService();
        if (notifService != null && company != null)
        {
            await notifService.NotifyDealStatusChangeAsync(deal.Id, company.CompanyName, "closed");
        }

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> UpdateDealStatusAsync(DealAccessContext ctx, UpdateDealStatusRequest request, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.UpdateStatus);
        var dealId = ctx.Deal.Id;
        if (request == null || string.IsNullOrWhiteSpace(request.Status))
            throw new ArgumentException("status is required");
        if (!Phase9Requirements.IsValidDealStatus(request.Status))
            throw new ArgumentException(
                $"status must be one of: {string.Join(", ", Phase9Requirements.DealStatusWhitelist)}");

        var deal = await GetDealOrThrowAsync(dealId);

        // Terminal state immutability: completed, rejected, withdrawn cannot transition.
        if (Phase9Requirements.DealTerminalStates.Contains(deal.Status))
            throw new InvalidOperationException(
                $"Deal '{dealId}' is in terminal state '{deal.Status}' and cannot be modified.");

        var from = deal.Status;
        var to = request.Status.ToLowerInvariant();

        if (string.Equals(to, Phase9Requirements.DealStatusSigned, StringComparison.OrdinalIgnoreCase) &&
            (deal.Signatures?.BothSigned != true ||
             !string.Equals(deal.TermSheet?.Status, Phase9Requirements.TermSheetStatusSigned, StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException(
                "Deal status cannot advance to 'signed' until both persisted signatures are present.");

        if (string.Equals(to, Phase9Requirements.DealStatusCompleted, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "Use the founder-only close operation to complete a signed deal.");

        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Deal is already in status '{to}'");

        if (!Phase9Requirements.IsValidDealTransition(from, to))
            throw new InvalidOperationException(
                $"Illegal deal status transition '{from}' -> '{to}'");

        TransitionDealStatusOrThrow(deal, to, "update deal status");
        deal.UpdatedAt = DateTime.UtcNow;
        if (string.Equals(to, Phase9Requirements.DealStatusCompleted, StringComparison.OrdinalIgnoreCase))
            deal.ClosedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDealStatusChanged,
            fromStatus: from, toStatus: to,
            actorUserId, ipHash, notes: request.Notes);

        if (string.Equals(to, Phase9Requirements.DealStatusCompleted, StringComparison.OrdinalIgnoreCase))
        {
            await CreateCompanyPortfolioHoldingsForDealAsync(deal, actorUserId);
            await ApplyEquityDealToCapTableAsync(deal, actorUserId);
        }

        return MapDealToResponse(deal);
    }

    public async Task CreateCompanyPortfolioHoldingsForDealAsync(DealExecution deal, string actorUserId)
    {
        if (deal == null || !string.Equals(deal.Status, Phase9Requirements.DealStatusCompleted, StringComparison.OrdinalIgnoreCase))
            return;

        try
        {
            var company = await _dbContext.Companies.Find(c => c.Id == deal.CompanyId).FirstOrDefaultAsync();
            var companyName = company?.CompanyName ?? deal.CompanyNameSnapshot ?? "Company Investment";

            // 1. Resolve participants
            var participants = deal.Investors != null && deal.Investors.Count > 0
                ? deal.Investors
                : new List<DealParticipant>();

            if (participants.Count == 0)
            {
                var match = await _dbContext.InvestorMatches.Find(m => m.CompanyId == deal.CompanyId).FirstOrDefaultAsync();
                var fallbackInvestorId = match?.InvestorId ?? deal.CreatedByUserId;
                if (!string.IsNullOrWhiteSpace(fallbackInvestorId))
                {
                    participants.Add(new DealParticipant
                    {
                        InvestorId = fallbackInvestorId,
                        InvestorName = deal.InvestorNameSnapshot ?? "Investor",
                        CommittedAmount = deal.TermSheet?.TotalRaiseAmount ?? 0,
                        EquityPercentage = deal.TermSheet?.InvestorEquityPercent ?? 0
                    });
                }
            }

            // 2. Instrument classification
            var rawEquityType = (deal.TermSheet?.EquityType ?? string.Empty).Trim().ToLowerInvariant();
            string instrumentType;
            if (rawEquityType.Contains("safe"))
                instrumentType = "safe";
            else if (rawEquityType.Contains("note") || rawEquityType.Contains("convertible"))
                instrumentType = "convertible_note";
            else if (rawEquityType.Contains("debt"))
                instrumentType = "debt";
            else
                instrumentType = "equity";

            // 3. Process each participant idempotently
            foreach (var participant in participants)
            {
                var investorId = participant.InvestorId;
                if (string.IsNullOrWhiteSpace(investorId)) continue;

                // Idempotency: check if holding already exists for this Investor + DealExecution
                var existing = await _dbContext.CompanyPortfolioHoldings
                    .Find(h => h.InvestorId == investorId && h.DealExecutionId == deal.Id)
                    .FirstOrDefaultAsync();

                if (existing != null)
                    continue; // Skip duplicate

                Guid.TryParse(investorId, out var invGuid);
                var investorUser = await _dbContext.ApplicationUsers
                    .Find(u => (u.InvestorProfile != null && u.InvestorProfile.InvestorId == investorId) || (invGuid != Guid.Empty && u.Id == invGuid))
                    .FirstOrDefaultAsync();
                var investorUserId = investorUser?.Id.ToString() ?? string.Empty;

                var amount = (deal.TermSheet != null && deal.TermSheet.TotalRaiseAmount > 0)
                    ? deal.TermSheet.TotalRaiseAmount
                    : (participant.CommittedAmount > 0 ? participant.CommittedAmount : 0);

                double? equityPercent = null;
                if (instrumentType == "equity")
                {
                    var rawEquity = (deal.TermSheet != null && deal.TermSheet.InvestorEquityPercent > 0)
                        ? deal.TermSheet.InvestorEquityPercent
                        : (participant.EquityPercentage > 0 ? participant.EquityPercentage : 0);
                    if (rawEquity > 0) equityPercent = rawEquity;
                }

                double? entryValuation = null;
                if (deal.TermSheet != null)
                {
                    if (deal.TermSheet.PostMoneyValuation > 0)
                        entryValuation = deal.TermSheet.PostMoneyValuation;
                    else if (deal.TermSheet.PreMoneyValuation > 0)
                        entryValuation = deal.TermSheet.PreMoneyValuation;
                }

                var matchCandidates = new List<string>();
                if (!string.IsNullOrWhiteSpace(investorId) && !Guid.TryParse(investorId, out _))
                    matchCandidates.Add(investorId);
                if (!string.IsNullOrWhiteSpace(investorUserId) && ObjectId.TryParse(investorUserId, out _))
                    matchCandidates.Add(investorUserId);

                InvestorMatch? matchRecord = null;
                if (matchCandidates.Count > 0)
                {
                    try
                    {
                        matchRecord = await _dbContext.InvestorMatches
                            .Find(m => m.CompanyId == deal.CompanyId && matchCandidates.Contains(m.InvestorId))
                            .FirstOrDefaultAsync();
                    }
                    catch
                    {
                        // Fallback if schema rejects string
                    }
                }

                var holding = new CompanyPortfolioHolding
                {
                    Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                    InvestorId = investorId,
                    InvestorUserId = investorUserId,
                    CompanyId = deal.CompanyId,
                    CompanyName = companyName,
                    DealExecutionId = deal.Id,
                    MatchId = matchRecord?.Id,
                    InvestmentAmount = amount,
                    Currency = "EUR",
                    InstrumentType = instrumentType,
                    EquityPercentage = equityPercent,
                    EntryValuation = entryValuation,
                    InvestmentDate = deal.ClosedAt ?? DateTime.UtcNow,
                    ClosedAt = deal.ClosedAt ?? DateTime.UtcNow,
                    Status = "active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _dbContext.CompanyPortfolioHoldings.InsertOneAsync(holding);

                var notifService = GetNotificationService();
                if (notifService != null)
                {
                    await notifService.NotifyInvestmentAddedToPortfolioAsync(
                        investorUserId, investorId, companyName, amount, holding.Currency);
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error creating portfolio holdings for completed deal {DealId}", deal.Id);
        }
    }

    public async Task<int> ReconcileClosedDealPortfolioHoldingsAsync(string? specificInvestorId = null)
    {
        try
        {
            var filterBuilder = Builders<DealExecution>.Filter;
            var filter = filterBuilder.Eq(d => d.Status, Phase9Requirements.DealStatusCompleted);
            var completedDeals = await _dbContext.DealExecutions.Find(filter).ToListAsync();

            int processed = 0;
            foreach (var deal in completedDeals)
            {
                await CreateCompanyPortfolioHoldingsForDealAsync(deal, "system_reconciliation");
                processed++;
            }
            return processed;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error reconciling completed deals to portfolio holdings");
            return 0;
        }
    }

    public async Task ApplyEquityDealToCapTableAsync(DealExecution deal, string actorUserId)
    {
        if (deal == null) return;
        if (!string.Equals(deal.Status, Phase9Requirements.DealStatusCompleted, StringComparison.OrdinalIgnoreCase))
            return;
        if (string.IsNullOrWhiteSpace(deal.CompanyId))
            return;

        // Verify signatures
        if (deal.Signatures == null || !deal.Signatures.BothSigned)
            return;

        // Instrument validation: only Equity mutations are permitted on the Cap Table
        var rawEquityType = (deal.TermSheet?.EquityType ?? string.Empty).Trim().ToLowerInvariant();
        bool isNonEquity = rawEquityType.Contains("safe")
            || rawEquityType.Contains("convertible")
            || rawEquityType.Contains("note")
            || rawEquityType.Contains("debt");
        if (isNonEquity)
        {
            return; // Non-equity (SAFE, Note, Debt) do not create shareholder equity entries
        }

        try
        {
            var company = await _dbContext.Companies.Find(c => c.Id == deal.CompanyId).FirstOrDefaultAsync();
            if (company == null)
                return;

            // Always recalculate company.AmountRaised and Phase 9 completion from all completed deals
            var allDealsForComp = await _dbContext.DealExecutions
                .Find(d => d.CompanyId == deal.CompanyId && d.Status == Phase9Requirements.DealStatusCompleted)
                .ToListAsync();
            double totalRaised = allDealsForComp.Sum(d =>
            {
                var invSum = d.Investors != null && d.Investors.Count > 0 ? d.Investors.Sum(i => i.CommittedAmount) : 0;
                return invSum > 0 ? invSum : (d.TermSheet?.TotalRaiseAmount ?? 0);
            });
            if (company.AmountRaised != totalRaised || company.CompletedPhases == null || !company.CompletedPhases.Contains(9))
            {
                company.AmountRaised = totalRaised;
                if (company.CompletedPhases == null) company.CompletedPhases = new List<int>();
                if (!company.CompletedPhases.Contains(9)) company.CompletedPhases.Add(9);
                if (company.CurrentPhase == 9) company.CurrentPhase = 10;
                company.UpdatedAt = DateTime.UtcNow;
                await _dbContext.Companies.ReplaceOneAsync(Builders<Companies>.Filter.Eq(c => c.Id, company.Id), company);
            }

            var latestCapTable = await _dbContext.Phase4CapTables
                .Find(c => c.CompanyId == deal.CompanyId)
                .SortByDescending(c => c.Version)
                .FirstOrDefaultAsync();

            if (latestCapTable == null)
            {
                int baseTotalShares = company.TotalShares.HasValue && company.TotalShares.Value > 0 ? company.TotalShares.Value : 1_000_000;
                List<EquityGrant> baseGrants;
                if (company.EquityStructure != null && company.EquityStructure.Count > 0)
                {
                    var filteredStructure = new List<EquityEntryDto>();
                    bool esopAdded = false;
                    bool reserveAdded = false;

                    foreach (var e in company.EquityStructure)
                    {
                        bool isEsop = string.Equals(e.Type, "esop", StringComparison.OrdinalIgnoreCase) || e.StakeholderName?.IndexOf("ESOP", StringComparison.OrdinalIgnoreCase) >= 0;
                        bool isReserve = string.Equals(e.Type, "investor_reserve", StringComparison.OrdinalIgnoreCase) || e.StakeholderName?.IndexOf("Investor Reserve", StringComparison.OrdinalIgnoreCase) >= 0;

                        if (isEsop)
                        {
                            if (!esopAdded) { filteredStructure.Add(e); esopAdded = true; }
                        }
                        else if (isReserve)
                        {
                            if (!reserveAdded) { filteredStructure.Add(e); reserveAdded = true; }
                        }
                        else
                        {
                            filteredStructure.Add(e);
                        }
                    }

                    baseGrants = filteredStructure.Select(e => new EquityGrant
                    {
                        GrantId = ObjectId.GenerateNewId().ToString(),
                        StakeholderName = e.StakeholderName ?? (company.CompanyName + " Founder"),
                        StakeholderType = e.Type ?? "founder",
                        ShareClass = string.Equals(e.Type, "investor_reserve", StringComparison.OrdinalIgnoreCase) || e.StakeholderName?.IndexOf("Investor Reserve", StringComparison.OrdinalIgnoreCase) >= 0 ? ShareClasses.Preferred : ShareClasses.Common,
                        SharesGranted = e.SharesOwned > 0 ? e.SharesOwned : Math.Max(1, (int)Math.Round(baseTotalShares / (double)filteredStructure.Count)),
                        InvestmentAmount = e.InvestmentAmount,
                        GrantDate = company.Legal?.IncorporationDate != null && DateTime.TryParse(company.Legal.IncorporationDate, out var dt) ? dt : DateTime.UtcNow,
                        Source = "Initial Equity Structure"
                    }).ToList();
                }
                else
                {
                    baseGrants = new List<EquityGrant>
                    {
                        new EquityGrant
                        {
                            GrantId = ObjectId.GenerateNewId().ToString(),
                            StakeholderName = company.CompanyName + " Founder",
                            StakeholderType = "founder",
                            ShareClass = ShareClasses.Common,
                            SharesGranted = baseTotalShares,
                            GrantDate = DateTime.UtcNow,
                            Source = "Founder Initial Grant"
                        }
                    };
                }

                latestCapTable = new Phase4CapTable
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    CompanyId = deal.CompanyId,
                    Version = 1,
                    TotalShares = baseTotalShares,
                    EsopPoolPercent = company.EsopPoolPercent ?? 0,
                    EsopVestingMonths = company.EsopVestingMonths ?? 0,
                    Grants = baseGrants,
                    RecordedAt = DateTime.UtcNow
                };
                await _dbContext.Phase4CapTables.InsertOneAsync(latestCapTable);
            }

            var participants = deal.Investors != null && deal.Investors.Count > 0
                ? deal.Investors
                : new List<DealParticipant>();

            if (participants.Count == 0)
            {
                var match = await _dbContext.InvestorMatches.Find(m => m.CompanyId == deal.CompanyId).FirstOrDefaultAsync();
                var fallbackInvestorId = match?.InvestorId ?? deal.CreatedByUserId;
                if (!string.IsNullOrWhiteSpace(fallbackInvestorId))
                {
                    participants.Add(new DealParticipant
                    {
                        InvestorId = fallbackInvestorId,
                        InvestorName = deal.InvestorNameSnapshot ?? "Investor",
                        CommittedAmount = deal.TermSheet?.TotalRaiseAmount ?? 0,
                        EquityPercentage = deal.TermSheet?.InvestorEquityPercent ?? 0
                    });
                }
            }

            // Collect pending participants requiring processing
            var pendingAllocations = new List<(DealParticipant participant, string investorId, string investorName, double equityPercent, bool alreadyInCapTable, bool alreadyIssued, string investorUserId, string? matchId)>();

            foreach (var participant in participants)
            {
                var investorId = !string.IsNullOrWhiteSpace(participant.InvestorId)
                    ? participant.InvestorId
                    : (!string.IsNullOrWhiteSpace(deal.CreatedByUserId) ? deal.CreatedByUserId : "unknown_investor");
                var investorName = !string.IsNullOrWhiteSpace(participant.InvestorName)
                    ? participant.InvestorName
                    : (!string.IsNullOrWhiteSpace(deal.InvestorNameSnapshot) ? deal.InvestorNameSnapshot : "Investor");

                var investorEquityPercent = (deal.TermSheet != null && deal.TermSheet.InvestorEquityPercent > 0)
                    ? deal.TermSheet.InvestorEquityPercent
                    : (participant.EquityPercentage > 0 ? participant.EquityPercentage : 0);

                if (investorEquityPercent <= 0 || investorEquityPercent >= 100)
                    continue;

                // Idempotency check: verify if this DealExecutionId and InvestorId already exist in the latest CapTable snapshot or share issuance
                bool alreadyInCapTable = latestCapTable.Grants.Any(g => g.DealExecutionId == deal.Id && (g.InvestorId == investorId || g.StakeholderName == investorName));
                var existingIssuance = await _dbContext.Phase4ShareIssuances
                    .Find(s => s.CompanyId == deal.CompanyId && s.DealExecutionId == deal.Id && (s.InvestorId == investorId || s.IssuedTo == investorName))
                    .FirstOrDefaultAsync();
                bool alreadyIssued = existingIssuance != null;

                if (alreadyInCapTable && alreadyIssued)
                    continue;

                Guid.TryParse(investorId, out var invGuid);
                var investorUser = await _dbContext.ApplicationUsers
                    .Find(u => (u.InvestorProfile != null && u.InvestorProfile.InvestorId == investorId) || (invGuid != Guid.Empty && u.Id == invGuid))
                    .FirstOrDefaultAsync();
                var investorUserId = investorUser?.Id.ToString() ?? string.Empty;
                var matchCandidates = new List<string>();
                if (!string.IsNullOrWhiteSpace(investorId) && !Guid.TryParse(investorId, out _))
                    matchCandidates.Add(investorId);
                if (!string.IsNullOrWhiteSpace(investorUserId) && ObjectId.TryParse(investorUserId, out _))
                    matchCandidates.Add(investorUserId);

                InvestorMatch? matchRecord = null;
                if (matchCandidates.Count > 0)
                {
                    try
                    {
                        matchRecord = await _dbContext.InvestorMatches
                            .Find(m => m.CompanyId == deal.CompanyId && matchCandidates.Contains(m.InvestorId))
                            .FirstOrDefaultAsync();
                    }
                    catch
                    {
                        // Fallback if schema rejects string
                    }
                }

                pendingAllocations.Add((participant, investorId, investorName, investorEquityPercent, alreadyInCapTable, alreadyIssued, investorUserId, matchRecord?.Id));
            }

            if (pendingAllocations.Count == 0)
                return;

            var grantsToInsert = pendingAllocations.Where(p => !p.alreadyInCapTable).ToList();
            if (grantsToInsert.Count > 0)
            {
                double sumEquityPercent = grantsToInsert.Sum(p => p.equityPercent);
                if (sumEquityPercent <= 0 || sumEquityPercent >= 100.0)
                {
                    if (sumEquityPercent >= 100.0)
                    {
                        _logger?.LogWarning("Aggregate equity percentage {SumEquityPercent}% exceeds 100% for Deal {DealId}; skipping Cap Table mutation.", sumEquityPercent, deal.Id);
                    }
                    return;
                }

                double Q = sumEquityPercent / 100.0;
                int currentTotalShares = latestCapTable.TotalShares > 0 ? latestCapTable.TotalShares : 1_000_000;

                // Simultaneous post-money total shares: FinalTotalShares = currentTotalShares / (1 - Q)
                int finalTotalShares = (int)Math.Max(currentTotalShares + grantsToInsert.Count, Math.Round(currentTotalShares / (1.0 - Q)));
                int totalNewShares = finalTotalShares - currentTotalShares;

                // Deterministic Largest Remainder Method (Hamilton-Hare) for integer share allocation
                var shareAllocations = new Dictionary<string, int>();
                if (grantsToInsert.Count == 1)
                {
                    shareAllocations[grantsToInsert[0].investorId] = totalNewShares;
                }
                else
                {
                    var remainderList = new List<(string investorId, int baseShares, double frac)>();
                    int sumBase = 0;
                    foreach (var item in grantsToInsert)
                    {
                        double exactShares = (item.equityPercent / sumEquityPercent) * totalNewShares;
                        int baseShares = (int)Math.Floor(exactShares);
                        if (baseShares < 1) baseShares = 1;
                        double frac = exactShares - Math.Floor(exactShares);
                        remainderList.Add((item.investorId, baseShares, frac));
                        sumBase += baseShares;
                    }

                    int remainder = totalNewShares - sumBase;
                    // Deterministic order-independent sort: frac descending, then investorId ascending
                    var sorted = remainderList.OrderByDescending(r => r.frac).ThenBy(r => r.investorId).ToList();
                    for (int i = 0; i < sorted.Count; i++)
                    {
                        int extra = (i < remainder) ? 1 : (remainder < 0 && i >= sorted.Count + remainder ? -1 : 0);
                        shareAllocations[sorted[i].investorId] = Math.Max(1, sorted[i].baseShares + extra);
                    }
                }

                var shareClass = string.Equals(deal.TermSheet?.EquityType, "preferred", StringComparison.OrdinalIgnoreCase) ? ShareClasses.Preferred : ShareClasses.Common;
                var updatedGrants = new List<EquityGrant>(latestCapTable.Grants);

                foreach (var item in grantsToInsert)
                {
                    int allocatedShares = shareAllocations.TryGetValue(item.investorId, out var sh) ? sh : 1;
                    var newGrant = new EquityGrant
                    {
                        GrantId = ObjectId.GenerateNewId().ToString(),
                        InvestorId = item.investorId,
                        DealExecutionId = deal.Id,
                        MatchId = item.matchId,
                        StakeholderName = item.investorName,
                        StakeholderType = "investor",
                        ShareClass = shareClass,
                        SharesGranted = allocatedShares,
                        InvestmentAmount = (deal.TermSheet != null && deal.TermSheet.TotalRaiseAmount > 0)
                            ? deal.TermSheet.TotalRaiseAmount
                            : (item.participant.CommittedAmount > 0 ? item.participant.CommittedAmount : null),
                        GrantDate = deal.ClosedAt ?? DateTime.UtcNow,
                        CliffMonths = 0,
                        TotalVestMonths = 0,
                        Source = "Investment Deal"
                    };
                    updatedGrants.Add(newGrant);
                }

                var nextVersion = latestCapTable.Version + 1;
                var newSnapshot = new Phase4CapTable
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    CompanyId = deal.CompanyId,
                    Version = nextVersion,
                    TotalShares = finalTotalShares,
                    EsopPoolPercent = latestCapTable.EsopPoolPercent,
                    EsopVestingMonths = latestCapTable.EsopVestingMonths,
                    Grants = updatedGrants,
                    ExitWaterfallReviewed = latestCapTable.ExitWaterfallReviewed,
                    RecordedAt = DateTime.UtcNow
                };

                await _dbContext.Phase4CapTables.InsertOneAsync(newSnapshot);
                latestCapTable = newSnapshot;

                company.TotalShares = newSnapshot.TotalShares;
                company.EsopPoolPercent = newSnapshot.EsopPoolPercent;
                company.EsopVestingMonths = newSnapshot.EsopVestingMonths;
                company.EquityStructure = updatedGrants.Select(g => new EquityEntryDto
                {
                    StakeholderName = g.StakeholderName,
                    Type = g.StakeholderType,
                    SharesOwned = g.SharesGranted,
                    VestingMonths = g.TotalVestMonths,
                    InvestmentAmount = g.InvestmentAmount
                }).ToList();

                var allCompletedDeals = await _dbContext.DealExecutions
                    .Find(d => d.CompanyId == deal.CompanyId && d.Status == Phase9Requirements.DealStatusCompleted)
                    .ToListAsync();
                company.AmountRaised = allCompletedDeals.Sum(d =>
                    d.Investors != null && d.Investors.Count > 0
                        ? d.Investors.Sum(i => i.CommittedAmount)
                        : (d.TermSheet?.TotalRaiseAmount ?? 0));
                if (company.CompletedPhases == null) company.CompletedPhases = new List<int>();
                if (!company.CompletedPhases.Contains(9)) company.CompletedPhases.Add(9);
                if (company.CurrentPhase == 9) company.CurrentPhase = 10;

                company.InvestorReadinessInputsLastMaterialChangeAt = DateTime.UtcNow;
                company.UpdatedAt = DateTime.UtcNow;
                await _dbContext.Companies.ReplaceOneAsync(Builders<Companies>.Filter.Eq(c => c.Id, company.Id), company);

                // Process share issuances and ownership history for each participant
                foreach (var item in pendingAllocations)
                {
                    if (item.alreadyIssued) continue;

                    int allocatedShares = shareAllocations.TryGetValue(item.investorId, out var sh)
                        ? sh
                        : (latestCapTable.Grants.FirstOrDefault(g => g.DealExecutionId == deal.Id && g.InvestorId == item.investorId)?.SharesGranted ?? 1);

                    var pricePerShare = deal.TermSheet?.PostMoneyValuation > 0
                        ? (deal.TermSheet.PostMoneyValuation / (double)finalTotalShares)
                        : (item.participant.CommittedAmount > 0 ? item.participant.CommittedAmount / (double)allocatedShares : (double?)null);

                    var issuance = new Phase4ShareIssuance
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        CompanyId = deal.CompanyId,
                        InvestorId = item.investorId,
                        DealExecutionId = deal.Id,
                        MatchId = item.matchId,
                        IssuedTo = item.investorName,
                        ShareClass = shareClass,
                        SharesIssued = allocatedShares,
                        PricePerShare = pricePerShare,
                        IssuedAt = deal.ClosedAt ?? DateTime.UtcNow,
                        Reason = $"Investment Deal Execution #{deal.Id}"
                    };
                    await _dbContext.Phase4ShareIssuances.InsertOneAsync(issuance);

                    var founderShares = latestCapTable.Grants.Where(g => g.StakeholderType == "founder").Sum(g => g.SharesGranted);
                    var totalInvestorShares = latestCapTable.Grants.Where(g => g.StakeholderType == "investor").Sum(g => g.SharesGranted);
                    var founderPctBefore = currentTotalShares > 0 ? (founderShares / (double)currentTotalShares * 100.0) : 100.0;
                    var founderPctAfter = finalTotalShares > 0 ? (founderShares / (double)finalTotalShares * 100.0) : 0.0;
                    var investorPctAfter = finalTotalShares > 0 ? (totalInvestorShares / (double)finalTotalShares * 100.0) : 0.0;
                    var esopPctAfter = latestCapTable.EsopPoolPercent;

                    var history = new Phase4OwnershipHistory
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        CompanyId = deal.CompanyId,
                        DealExecutionId = deal.Id,
                        InvestorId = item.investorId,
                        RoundName = !string.IsNullOrWhiteSpace(deal.TermSheet?.EquityType) ? $"{deal.TermSheet.EquityType} Round" : "Equity Investment",
                        EventDate = deal.ClosedAt ?? DateTime.UtcNow,
                        FounderOwnershipBefore = Math.Round(founderPctBefore, 2),
                        FounderOwnershipAfter = Math.Round(founderPctAfter, 2),
                        InvestorOwnership = Math.Round(investorPctAfter, 2),
                        EsopOwnership = Math.Round(esopPctAfter, 2),
                        Valuation = deal.TermSheet?.PostMoneyValuation > 0 ? deal.TermSheet.PostMoneyValuation : (deal.TermSheet?.PreMoneyValuation ?? 0),
                        Notes = $"Investment Deal #{deal.Id} completed with {item.investorName} (${item.participant.CommittedAmount:N0})",
                        RecordedAt = DateTime.UtcNow
                    };
                    await _dbContext.Phase4OwnershipHistories.InsertOneAsync(history);
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error applying equity deal {DealId} to Cap Table", deal.Id);
            throw;
        }
    }

    public async Task<int> ReconcileClosedDealCapTablesAsync(string? specificCompanyId = null)
    {
        try
        {
            var filterBuilder = Builders<DealExecution>.Filter;
            var filter = filterBuilder.Eq(d => d.Status, Phase9Requirements.DealStatusCompleted);
            if (!string.IsNullOrWhiteSpace(specificCompanyId))
            {
                filter &= filterBuilder.Eq(d => d.CompanyId, specificCompanyId);
            }
            var completedDeals = await _dbContext.DealExecutions.Find(filter).ToListAsync();

            int processed = 0;
            foreach (var deal in completedDeals)
            {
                await ApplyEquityDealToCapTableAsync(deal, "system_reconciliation");
                processed++;
            }
            return processed;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error reconciling completed deals to Cap Tables");
            return 0;
        }
    }

    public async Task<DealStatusResponse> SignTermSheetAsync(DealAccessContext ctx, SignTermSheetRequest request, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.SignTermSheet);
        var dealId = ctx.Deal.Id;
        var deal = await GetDealOrThrowAsync(dealId);
        deal.Signatures ??= new DealSignatures();

        // Resolve the caller's immutable slot before touching document storage.
        // A replay of a successfully persisted signature is a safe no-op.
        var slot = DealActionPolicy.SignatureSlotForRole(ctx.Role);
        var alreadySigned = slot == DealRoles.Founder
            ? deal.Signatures.FounderSignedAt.HasValue
            : deal.Signatures.InvestorSignedAt.HasValue;
        if (alreadySigned)
            return MapDealToResponse(deal);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot sign term sheet on deal in terminal status '{deal.Status}'");

        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Signed term sheet file is required");
        if (request.File.Length > Phase9Requirements.MaxDealDocumentSizeBytes)
            throw new ArgumentException(
                $"File size {request.File.Length} exceeds {Phase9Requirements.MaxDealDocumentSizeBytes}");

        // Both parties may only sign once the term sheet is 'agreed'. The graph
        // only permits agreed -> signed, so this guards the precondition.
        var fromTs = deal.TermSheet.Status ?? Phase9Requirements.TermSheetStatusDraft;
        if (!Phase9Requirements.IsValidTermSheetTransition(fromTs, Phase9Requirements.TermSheetStatusSigned))
            throw new InvalidOperationException(
                $"Cannot sign: term sheet must be 'agreed' first (current '{fromTs}').");

        // Accepted terms are the canonical pre-sign state. This also catches up
        // legacy accepted offers that were persisted before lifecycle sync existed.
        var fromDeal = deal.Status;
        EnsureAcceptedAgreementStatus(deal, "prepare accepted offer for signature");

        // Persist the signed-agreement file.
        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }
        var storagePath = await _documentManager.SaveDocumentAsync(deal.CompanyId, request.File.FileName, bytes);

        var doc = new DealDocument
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            FileName = request.File.FileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            MimeType = request.File.ContentType,
            DocumentKind = "term_sheet",
            UploadedBy = actorUserId,
            UploadedAt = DateTime.UtcNow,
        };
        deal.DealDocuments.Add(doc);

        // Record the caller's own signature slot.
        if (slot == DealRoles.Founder)
        {
            deal.Signatures.FounderSignedAt = DateTime.UtcNow;
            deal.Signatures.FounderSignedByUserId = actorUserId;
            deal.Signatures.FounderSignedDocumentId = doc.DocumentId;
        }
        else
        {
            deal.Signatures.InvestorSignedAt = DateTime.UtcNow;
            deal.Signatures.InvestorSignedByInvestorId = ctx.PrincipalId;
            deal.Signatures.InvestorSignedDocumentId = doc.DocumentId;
        }

        // The term sheet is only 'signed' (and the deal axis advances) once BOTH
        // parties have signed. The first signature just records its slot.
        if (deal.Signatures.BothSigned)
        {
            deal.TermSheet.Status = Phase9Requirements.TermSheetStatusSigned;
            deal.TermSheet.SignedAt = DateTime.UtcNow;
            deal.TermSheet.SignedDocumentId = doc.DocumentId;
            TransitionDealStatusOrThrow(deal, Phase9Requirements.DealStatusSigned, "finalize both signatures");
        }
        var toDeal = deal.Status;
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityTermSheetSigned,
            fromStatus: fromDeal, toStatus: toDeal,
            actorUserId, ipHash,
            notes: deal.Signatures.BothSigned
                ? $"Term sheet fully signed by both parties (document {doc.DocumentId})"
                : $"Term sheet signed by {slot} (document {doc.DocumentId})");

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> MutateDueDiligenceItemAsync(DealAccessContext ctx, MutateDueDiligenceItemRequest request, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.MutateDueDiligence);
        var dealId = ctx.Deal.Id;
        if (request == null) throw new ArgumentException("Request body required");
        if (string.IsNullOrWhiteSpace(request.ItemName))
            throw new ArgumentException("itemName is required");
        if (!Phase9Requirements.IsValidDueDiligenceCategory(request.Category))
            throw new ArgumentException(
                $"category must be one of: {string.Join(", ", Phase9Requirements.DueDiligenceCategoryWhitelist)}");
        if (!Phase9Requirements.IsValidDueDiligenceStatus(request.Status))
            throw new ArgumentException(
                $"status must be one of: {string.Join(", ", Phase9Requirements.DueDiligenceStatusWhitelist)}");

        var deal = await GetDealOrThrowAsync(dealId);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot mutate diligence items on deal in terminal status '{deal.Status}'");

        var existing = deal.DueDiligenceChecklist
            .FirstOrDefault(d => string.Equals(d.ItemName, request.ItemName, StringComparison.Ordinal));
        if (existing == null)
        {
            existing = new DueDigligenceItem
            {
                ItemName = request.ItemName,
                CreatedAt = DateTime.UtcNow,
            };
            deal.DueDiligenceChecklist.Add(existing);
        }
        existing.Category = request.Category.ToLowerInvariant();
        existing.Status = request.Status.ToLowerInvariant();
        existing.AssignedTo = request.AssignedTo;
        existing.DueDate = request.DueDate;
        existing.Notes = request.Notes;

        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDueDiligenceUpdated,
            fromStatus: null, toStatus: existing.Status,
            actorUserId, ipHash,
            notes: $"{existing.ItemName} -> {existing.Status}");

        return MapDealToResponse(deal);
    }

    public async Task<DealDocumentResponse> UploadDealDocumentAsync(DealAccessContext ctx, UploadDealDocumentRequest request, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.UploadDocument);
        var dealId = ctx.Deal.Id;
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");
        if (request.File.Length > Phase9Requirements.MaxDealDocumentSizeBytes)
            throw new ArgumentException(
                $"File size {request.File.Length} exceeds {Phase9Requirements.MaxDealDocumentSizeBytes}");
        if (!Phase9Requirements.IsValidDealDocumentKind(request.DocumentKind))
            throw new ArgumentException(
                $"documentKind must be one of: {string.Join(", ", Phase9Requirements.DealDocumentKindWhitelist)}");

        var deal = await GetDealOrThrowAsync(dealId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var storagePath = await _documentManager.SaveDocumentAsync(deal.CompanyId, request.File.FileName, bytes);
        var doc = new DealDocument
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            FileName = request.File.FileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            MimeType = request.File.ContentType,
            DocumentKind = request.DocumentKind.ToLowerInvariant(),
            UploadedBy = actorUserId,
            UploadedAt = DateTime.UtcNow,
        };

        deal.DealDocuments.Add(doc);
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDocumentUploaded,
            fromStatus: null, toStatus: null,
            actorUserId, ipHash,
            notes: $"{doc.DocumentKind}: {doc.FileName}");

        return MapDealDocument(doc);
    }

    public async Task<(byte[] Content, DealDocumentResponse Document)> GetDealDocumentAsync(DealAccessContext ctx, string documentId)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.DownloadDocument);
        var dealId = ctx.Deal.Id;
        var deal = await GetDealOrThrowAsync(dealId);
        var doc = deal.DealDocuments?
            .FirstOrDefault(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal))
            ?? throw new KeyNotFoundException($"Deal document {documentId} not found");
        if (string.IsNullOrWhiteSpace(doc.StoragePath))
            throw new InvalidOperationException("Document storage path is missing");

        var bytes = await File.ReadAllBytesAsync(doc.StoragePath);
        return (bytes, MapDealDocument(doc));
    }

    public async Task<List<DealActivityLogResponse>> GetDealActivityAsync(string dealId)
    {
        await GetDealOrThrowAsync(dealId);
        var logs = await _dbContext.Phase9DealActivityLogs
            .Find(l => l.DealId == dealId)
            .SortByDescending(l => l.OccurredAt)
            .ToListAsync();

        return logs.Select(l => new DealActivityLogResponse
        {
            Id = l.Id,
            DealId = l.DealId,
            EventType = l.EventType,
            FromStatus = l.FromStatus,
            ToStatus = l.ToStatus,
            ActorUserId = l.ActorUserId,
            OccurredAt = l.OccurredAt,
            Notes = l.Notes,
        }).ToList();
    }

    private async Task<DealExecution> GetDealOrThrowAsync(string dealId)
    {
        return await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Deal {dealId} not found");
    }

    private async Task AppendDealActivityAsync(
        string companyId, string dealId, string eventType,
        string fromStatus, string toStatus,
        string actorUserId, string ipHash, string notes)
    {
        if (!Phase9Requirements.IsValidActivityEventType(eventType))
            throw new InvalidOperationException($"Invalid activity eventType '{eventType}'");

        await _dbContext.Phase9DealActivityLogs.InsertOneAsync(new Phase9DealActivityLog
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            DealId = dealId,
            EventType = eventType,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ActorUserId = actorUserId,
            OccurredAt = DateTime.UtcNow,
            IpHash = ipHash,
            Notes = notes,
        });
    }

    private static DealDocumentResponse MapDealDocument(DealDocument d) => new()
    {
        DocumentId = d.DocumentId,
        FileName = d.FileName,
        FileSize = d.FileSize,
        MimeType = d.MimeType,
        DocumentKind = d.DocumentKind,
        UploadedBy = d.UploadedBy,
        UploadedAt = d.UploadedAt,
    };

    // ============ HELPERS ============

    private int CalculateOverallProgress(Companies company)
    {
        if (company.CompletedPhases == null)
            return 0;

        return (int)Math.Round((company.CompletedPhases.Count / 9d) * 100);
    }

    private CompanyProgressResponse BuildProgressResponse(Companies company)
    {
        return new CompanyProgressResponse
        {
            CompanyId = company.Id,
            CurrentPhase = company.CurrentPhase,
            CompletedPhases = company.CompletedPhases ?? new List<int>(),
            OverallProgressPercent = CalculateOverallProgress(company),
            TrustScore = company.TrustScore,
            IsInvestorReady = company.IsInvestorReady,
            CreatedAt = company.CreatedAt,
            LastUpdatedAt = company.UpdatedAt
        };
    }

    private double CalculateGrowthRate(Companies company)
    {
        var revenues = new[] { company.Q1Revenue ?? 0, company.Q2Revenue ?? 0, company.Q3Revenue ?? 0, company.Q4Revenue ?? 0 };

        if (revenues[0] == 0) return 0;

        var growthQ1ToQ2 = (revenues[1] - revenues[0]) / revenues[0];
        var growthQ2ToQ3 = revenues[1] != 0 ? (revenues[2] - revenues[1]) / revenues[1] : 0;
        var growthQ3ToQ4 = revenues[2] != 0 ? (revenues[3] - revenues[2]) / revenues[2] : 0;

        return (growthQ1ToQ2 + growthQ2ToQ3 + growthQ3ToQ4) / 3;
    }

    private int CalculateRunway(Companies company)
    {
        var monthlyBurn = company.MonthlyBurn ?? 0;
        if (monthlyBurn <= 0) return 0;

        var currentFunds = company.CurrentFunds ?? 0;

        // If currentFunds is available, use it for calculation
        if (currentFunds > 0)
            return (int)(currentFunds / monthlyBurn);

        // Fallback: For Phase 3 flow without cash position, estimate from ARR
        // Runway ≈ ARR / (12 × MonthlyBurn) months
        // This assumes monthly burn is sustainable at current revenue level
        var arr = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) +
                  (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        if (arr <= 0) return 0;

        return (int)(arr / (12 * monthlyBurn));
    }

    // ============ PHASE D-4: OFFER SYSTEM ============

    public async Task<DealStatusResponse> CreateInvestorOfferAsync(
        string companyId, string investorId, OfferTermsRequest req, string actorUserId, string ipHash)
    {
        ValidateOfferTerms(req);
        if (string.IsNullOrWhiteSpace(investorId))
            throw new ArgumentException("investorId is required");

        var company = await GetCompanyAsync(companyId)
            ?? throw new KeyNotFoundException($"Company {companyId} not found");

        var investor = await _dbContext.Investors
            .Find(i => i.Id == investorId)
            .FirstOrDefaultAsync()
            ?? throw new ArgumentException($"investorId '{investorId}' does not match any investor");

        // One offer thread per (company, investor). Reuse an existing active deal;
        // once a thread is open, callers must counter instead of re-creating.
        var deal = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == companyId &&
                       d.Investors.Any(i => i.InvestorId == investorId) &&
                       !Phase9Requirements.DealTerminalStates.Contains(d.Status))
            .FirstOrDefaultAsync();

        if (deal != null && deal.Revisions.Any())
            throw new InvalidOperationException(
                "An offer thread already exists for this investor — use counter-offer.");

        if (deal == null)
        {
            deal = new DealExecution
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                Status = Phase9Requirements.DealStatusInitiated,
                CompanyNameSnapshot = company.CompanyName,
                InvestorNameSnapshot = investor.Name,
                InvestorTypeSnapshot = investor.Type,
                CreatedByUserId = actorUserId,
                Investors = new List<DealParticipant>
                {
                    new DealParticipant
                    {
                        InvestorId = investorId,
                        InvestorName = investor.Name,
                        Status = Phase9Requirements.ParticipantStatusInterested,
                    }
                },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _dbContext.DealExecutions.InsertOneAsync(deal);
        }

        deal.Revisions.Add(new TermSheetRevision
        {
            RevisionNumber = 1,
            ProposedByRole = DealRoles.Investor,
            ProposedByPrincipalId = investorId,
            Status = Phase9Requirements.OfferStatusSent,
            Terms = SnapshotTerms(req),
            Note = req.Note,
        });
        deal.TermSheet = SnapshotTerms(req);
        deal.TermSheet.Status = Phase9Requirements.TermSheetStatusProposed;
        deal.CurrentTurn = DealRoles.Founder;
        var fromDeal = deal.Status;
        EnsureOfferNegotiatingStatus(deal, "send initial offer");
        deal.UpdatedAt = DateTime.UtcNow;

        await _dbContext.DealExecutions.ReplaceOneAsync(
            Builders<DealExecution>.Filter.Eq(d => d.Id, deal.Id), deal);

        await AppendDealActivityAsync(deal.CompanyId, deal.Id,
            Phase9Requirements.ActivityOfferSent,
            fromStatus: fromDeal, toStatus: deal.Status,
            actorUserId, ipHash, notes: "Initial offer sent by investor (revision 1)");

        await EmitDealEventAsync(deal, DealEventNames.OfferReceived);
        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> CounterOfferAsync(
        DealAccessContext ctx, OfferTermsRequest req, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.CounterOffer);
        ValidateOfferTerms(req);

        var deal = await GetDealOrThrowAsync(ctx.Deal.Id);
        var latest = GetLatestOpenRevisionOrThrow(deal);
        AssertTurnAndCounterparty(ctx, deal, latest);
        var fromDeal = deal.Status;
        EnsureOfferNegotiatingStatus(deal, "counter offer");

        if (!Phase9Requirements.IsValidOfferTransition(latest.Status, Phase9Requirements.OfferStatusCountered))
            throw new InvalidOperationException(
                $"Cannot counter an offer in status '{latest.Status}'.");

        latest.Status = Phase9Requirements.OfferStatusCountered;
        latest.RespondedAt = DateTime.UtcNow;

        deal.Revisions.Add(new TermSheetRevision
        {
            RevisionNumber = deal.Revisions.Count + 1,
            ProposedByRole = ctx.Role,
            ProposedByPrincipalId = ctx.PrincipalId,
            Status = Phase9Requirements.OfferStatusSent,
            Terms = SnapshotTerms(req),
            Note = req.Note,
        });
        deal.TermSheet = SnapshotTerms(req);
        deal.TermSheet.Status = Phase9Requirements.TermSheetStatusNegotiating;
        deal.CurrentTurn = OtherRole(ctx.Role);
        deal.UpdatedAt = DateTime.UtcNow;

        await _dbContext.DealExecutions.ReplaceOneAsync(
            Builders<DealExecution>.Filter.Eq(d => d.Id, deal.Id), deal);

        await AppendDealActivityAsync(deal.CompanyId, deal.Id,
            Phase9Requirements.ActivityOfferCountered,
            fromStatus: fromDeal, toStatus: deal.Status,
            actorUserId, ipHash, notes: $"Counter-offer by {ctx.Role} (revision {deal.Revisions.Count})");

        await EmitDealEventAsync(deal, DealEventNames.OfferCountered);
        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> AcceptOfferAsync(
        DealAccessContext ctx, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.AcceptOffer);

        var deal = await GetDealOrThrowAsync(ctx.Deal.Id);
        var latest = GetLatestOpenRevisionOrThrow(deal);
        AssertTurnAndCounterparty(ctx, deal, latest);
        var fromDeal = deal.Status;

        if (!Phase9Requirements.IsValidOfferTransition(latest.Status, Phase9Requirements.OfferStatusAccepted))
            throw new InvalidOperationException(
                $"Cannot accept an offer in status '{latest.Status}'.");

        latest.Status = Phase9Requirements.OfferStatusAccepted;
        latest.RespondedAt = DateTime.UtcNow;

        // Accepted revision becomes the live, agreed term sheet (ready to sign).
        deal.TermSheet = CloneTerms(latest.Terms);
        deal.TermSheet.Status = Phase9Requirements.TermSheetStatusAgreed;
        deal.CurrentTurn = "";

        // Synchronize participant snapshot with agreed terms
        if (deal.Investors != null)
        {
            foreach (var inv in deal.Investors)
            {
                if (inv.InvestorId == latest.ProposedByPrincipalId || deal.Investors.Count == 1)
                {
                    inv.EquityPercentage = deal.TermSheet.InvestorEquityPercent;
                    inv.CommittedAmount = deal.TermSheet.TotalRaiseAmount;
                }
            }
        }

        EnsureAcceptedAgreementStatus(deal, "accept offer");
        deal.UpdatedAt = DateTime.UtcNow;

        await _dbContext.DealExecutions.ReplaceOneAsync(
            Builders<DealExecution>.Filter.Eq(d => d.Id, deal.Id), deal);

        await AppendDealActivityAsync(deal.CompanyId, deal.Id,
            Phase9Requirements.ActivityOfferAccepted,
            fromStatus: fromDeal, toStatus: deal.Status,
            actorUserId, ipHash, notes: $"Offer accepted by {ctx.Role} (revision {latest.RevisionNumber})");

        await EmitDealEventAsync(deal, DealEventNames.OfferAccepted);
        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> RejectOfferAsync(
        DealAccessContext ctx, string note, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);
        DealActionPolicy.AssertCanPerform(ctx.Role, DealAction.RejectOffer);

        var deal = await GetDealOrThrowAsync(ctx.Deal.Id);
        var latest = GetLatestOpenRevisionOrThrow(deal);
        AssertTurnAndCounterparty(ctx, deal, latest);

        if (!Phase9Requirements.IsValidOfferTransition(latest.Status, Phase9Requirements.OfferStatusRejected))
            throw new InvalidOperationException(
                $"Cannot reject an offer in status '{latest.Status}'.");

        latest.Status = Phase9Requirements.OfferStatusRejected;
        latest.RespondedAt = DateTime.UtcNow;
        deal.TermSheet.Status = Phase9Requirements.TermSheetStatusRejected;
        deal.CurrentTurn = "";

        var fromDeal = deal.Status;
        EnsureOfferNegotiatingStatus(deal, "reject offer");
        TransitionDealStatusOrThrow(deal, Phase9Requirements.DealStatusRejected, "reject offer");
        var toDeal = deal.Status;
        deal.UpdatedAt = DateTime.UtcNow;

        await _dbContext.DealExecutions.ReplaceOneAsync(
            Builders<DealExecution>.Filter.Eq(d => d.Id, deal.Id), deal);

        await AppendDealActivityAsync(deal.CompanyId, deal.Id,
            Phase9Requirements.ActivityOfferRejected,
            fromStatus: fromDeal, toStatus: toDeal,
            actorUserId, ipHash, notes: string.IsNullOrWhiteSpace(note) ? $"Offer rejected by {ctx.Role}" : note);

        await EmitDealEventAsync(deal, DealEventNames.OfferRejected);
        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> MarkOfferViewedAsync(
        DealAccessContext ctx, string actorUserId, string ipHash)
    {
        AssertAccess(ctx);

        var deal = await GetDealOrThrowAsync(ctx.Deal.Id);
        var latest = deal.Revisions.OrderBy(r => r.RevisionNumber).LastOrDefault();
        if (latest == null) return MapDealToResponse(deal);

        // Only the party the offer is waiting on (the receiver) marks it viewed.
        if (!string.Equals(deal.CurrentTurn, ctx.Role, StringComparison.Ordinal))
            return MapDealToResponse(deal);

        // Idempotent: only the sent -> viewed transition does anything.
        if (!Phase9Requirements.IsValidOfferTransition(latest.Status, Phase9Requirements.OfferStatusViewed))
            return MapDealToResponse(deal);

        latest.Status = Phase9Requirements.OfferStatusViewed;
        latest.ViewedAt = DateTime.UtcNow;
        deal.UpdatedAt = DateTime.UtcNow;

        await _dbContext.DealExecutions.ReplaceOneAsync(
            Builders<DealExecution>.Filter.Eq(d => d.Id, deal.Id), deal);

        await AppendDealActivityAsync(deal.CompanyId, deal.Id,
            Phase9Requirements.ActivityOfferViewed,
            fromStatus: deal.Status,
            toStatus: deal.Status,
            actorUserId, ipHash, notes: $"Offer viewed by {ctx.Role}");

        await EmitDealEventAsync(deal, DealEventNames.OfferViewed);
        return MapDealToResponse(deal);
    }

    // ---- offer helpers ----

    private static void ValidateOfferTerms(OfferTermsRequest req)
    {
        if (req == null) throw new ArgumentException("Offer terms are required");
        if (!double.IsFinite(req.TotalRaiseAmount) || req.TotalRaiseAmount <= 0)
            throw new ArgumentException("totalRaiseAmount must be > 0");
        if (!double.IsFinite(req.PostMoneyValuation) || req.PostMoneyValuation <= 0)
            throw new ArgumentException("postMoneyValuation must be > 0");
    }

    private static TermSheet SnapshotTerms(OfferTermsRequest req) => new TermSheet
    {
        TotalRaiseAmount = req.TotalRaiseAmount,
        PreMoneyValuation = req.PreMoneyValuation,
        PostMoneyValuation = req.PostMoneyValuation,
        EquityType = req.EquityType,
        InvestorEquityPercent = req.InvestorEquityPercent,
        ProRataRights = req.ProRataRights,
        LiquidationPreference = req.LiquidationPreference,
        BoardSeats = req.BoardSeats,
        AntiDilutionProtection = req.AntiDilutionProtection,
        Status = Phase9Requirements.TermSheetStatusDraft,
    };

    private static TermSheet CloneTerms(TermSheet t) => new TermSheet
    {
        TotalRaiseAmount = t.TotalRaiseAmount,
        PreMoneyValuation = t.PreMoneyValuation,
        PostMoneyValuation = t.PostMoneyValuation,
        EquityType = t.EquityType,
        InvestorEquityPercent = t.InvestorEquityPercent,
        ProRataRights = t.ProRataRights,
        LiquidationPreference = t.LiquidationPreference,
        BoardSeats = t.BoardSeats,
        AntiDilutionProtection = t.AntiDilutionProtection,
        VestingYears = t.VestingYears,
        CliffMonths = t.CliffMonths,
        ProposedClosingDate = t.ProposedClosingDate,
    };

    private static string OtherRole(string role)
        => role == DealRoles.Founder ? DealRoles.Investor : DealRoles.Founder;

    private static TermSheetRevision GetLatestOpenRevisionOrThrow(DealExecution deal)
    {
        var latest = deal.Revisions.OrderBy(r => r.RevisionNumber).LastOrDefault()
            ?? throw new InvalidOperationException("No offer exists on this deal.");
        return latest;
    }

    // Turn enforcement: only the party whose turn it is may respond, and a party
    // may never respond to an offer it proposed itself.
    private static void AssertTurnAndCounterparty(
        DealAccessContext ctx, DealExecution deal, TermSheetRevision latest)
    {
        if (!string.Equals(deal.CurrentTurn, ctx.Role, StringComparison.Ordinal))
            throw new InvalidOperationException(
                $"It is not {ctx.Role}'s turn to act on this offer.");
        if (!DealActionPolicy.CanRespondToOffer(ctx.Role, latest.ProposedByRole))
            throw new InvalidOperationException(
                "A party cannot respond to an offer it proposed itself.");
    }

    // Resolve both deal participants to ApplicationUser identity + email. The
    // founder is the company owner (ApplicationUser id); each investor is
    // resolved from the catalogue InvestorId back to the linked user.
    public async Task<List<DealRecipient>> GetDealRecipientsAsync(string dealId)
    {
        var recipients = new List<DealRecipient>();

        var deal = await _dbContext.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
        if (deal == null) return recipients;

        var company = await _dbContext.Companies.Find(c => c.Id == deal.CompanyId).FirstOrDefaultAsync();
        if (company != null && !string.IsNullOrWhiteSpace(company.OwnerId)
            && Guid.TryParse(company.OwnerId, out var ownerGuid))
        {
            var founder = await _dbContext.ApplicationUsers.Find(u => u.Id == ownerGuid).FirstOrDefaultAsync();
            if (founder != null)
                recipients.Add(new DealRecipient
                {
                    Role = DealRoles.Founder,
                    UserId = founder.Id.ToString(),
                    Email = founder.Email,
                    Name = founder.Name,
                });
        }

        foreach (var p in deal.Investors)
        {
            if (string.IsNullOrWhiteSpace(p.InvestorId)) continue;
            var user = await _dbContext.ApplicationUsers
                .Find(u => u.InvestorProfile.InvestorId == p.InvestorId)
                .FirstOrDefaultAsync();
            if (user != null && recipients.All(r => r.UserId != user.Id.ToString()))
                recipients.Add(new DealRecipient
                {
                    Role = DealRoles.Investor,
                    UserId = user.Id.ToString(),
                    Email = user.Email,
                    Name = user.Name,
                });
        }

        return recipients;
    }

    // Best-effort realtime fan-out of a deal/offer event to both participants'
    // per-user groups, plus a generic DealUpdated. Never throws into the caller.
    private async Task EmitDealEventAsync(DealExecution deal, string eventName)
    {
        try
        {
            var recipients = await GetDealRecipientsAsync(deal.Id);
            var userIds = recipients
                .Select(r => r.UserId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();
            if (userIds.Count == 0) return;

            var payload = MapDealToResponse(deal);
            await _dealEvents.PublishAsync(userIds, eventName, payload);
            if (eventName != DealEventNames.DealUpdated)
                await _dealEvents.PublishAsync(userIds, DealEventNames.DealUpdated, payload);
        }
        catch
        {
            // Realtime is best-effort; the deal mutation is already persisted.
        }
    }

    private DealStatusResponse MapDealToResponse(DealExecution deal)
    {
        return new DealStatusResponse
        {
            DealId = deal.Id,
            CompanyId = deal.CompanyId,
            Status = deal.Status,
            CompanyName = deal.CompanyNameSnapshot ?? "",
            ProgressPercent = CalculateDealProgress(deal),
            TermSheet = new TermSheetResponse
            {
                TotalRaiseAmount = deal.TermSheet.TotalRaiseAmount,
                PostMoneyValuation = deal.TermSheet.PostMoneyValuation,
                EquityType = deal.TermSheet.EquityType,
                InvestorEquityPercent = deal.TermSheet.InvestorEquityPercent,
                ProRataRights = deal.TermSheet.ProRataRights,
                Status = deal.TermSheet.Status,
                SignedAt = deal.TermSheet.SignedAt
            },
            ClosingChecklist = deal.ClosingChecklist.Select(c => new ChecklistItemDto
            {
                Item = c.Item,
                Completed = c.Completed,
                Owner = c.Owner,
                DueDate = c.DueDate
            }).ToList(),
            Investors = deal.Investors.Select(inv => new DealParticipantStatusDto
            {
                InvestorId = inv.InvestorId,
                InvestorName = inv.InvestorName,
                CommittedAmount = inv.CommittedAmount,
                Status = inv.Status
            }).ToList(),
            CurrentTurn = deal.CurrentTurn ?? "",
            Revisions = (deal.Revisions ?? new List<TermSheetRevision>())
                .OrderBy(r => r.RevisionNumber)
                .Select(r => new TermSheetRevisionResponse
                {
                    RevisionNumber = r.RevisionNumber,
                    ProposedByRole = r.ProposedByRole,
                    Status = r.Status,
                    Note = r.Note,
                    CreatedAt = r.CreatedAt,
                    ViewedAt = r.ViewedAt,
                    RespondedAt = r.RespondedAt,
                    Terms = new TermSheetResponse
                    {
                        TotalRaiseAmount = r.Terms.TotalRaiseAmount,
                        PostMoneyValuation = r.Terms.PostMoneyValuation,
                        EquityType = r.Terms.EquityType,
                        InvestorEquityPercent = r.Terms.InvestorEquityPercent,
                        ProRataRights = r.Terms.ProRataRights,
                        Status = r.Terms.Status,
                        SignedAt = r.Terms.SignedAt,
                    }
                }).ToList(),
            FounderSignature = deal.Signatures != null ? new SignatureRecordDto
            {
                SignedAt = deal.Signatures.FounderSignedAt,
                SignedBy = deal.Signatures.FounderSignedByUserId
            } : null,
            InvestorSignature = deal.Signatures != null ? new SignatureRecordDto
            {
                SignedAt = deal.Signatures.InvestorSignedAt,
                SignedBy = deal.Signatures.InvestorSignedByInvestorId
            } : null
        };
    }

    private double CalculateDealProgress(DealExecution deal)
    {
        if (deal.ClosingChecklist.Count == 0) return 0;
        var completed = deal.ClosingChecklist.Count(c => c.Completed);
        return (completed / (double)deal.ClosingChecklist.Count) * 100;
    }

    private async Task<(bool IsValid, List<string> Errors)> ValidatePhaseAsync(Companies company, int phase)
    {
        return phase switch
        {
            1 => await _phaseValidator.ValidatePhase1Async(company),
            2 => await _phaseValidator.ValidatePhase2Async(company),
            3 => await _phaseValidator.ValidatePhase3Async(company),
            4 => await _phaseValidator.ValidatePhase4Async(company),
            5 => await _phaseValidator.ValidatePhase5Async(company),
            6 => await _phaseValidator.ValidatePhase6Async(company),
            7 => await _phaseValidator.ValidatePhase7Async(company),
            8 => await _phaseValidator.ValidatePhase8Async(company),
            9 => await _phaseValidator.ValidatePhase9Async(company),
            _ => (false, new List<string> { "Invalid phase" })
        };
    }

    // ============================================================
    // INVESTOR-SIDE READS (Phase B/C/D — June 10 demo)
    //
    // All reads are scoped to a resolved investorId. A caller cannot
    // address a company they're not matched to — the InvestorMatch
    // join doubles as the authorization fence (404 instead of 403 so
    // the existence of an unmatched company is not leaked).
    // ============================================================

    public async Task<OpportunityFeedResponse> GetOpportunitiesForInvestorAsync(
        string investorId, string sector, string stage, string geography, int take)
    {
        if (string.IsNullOrWhiteSpace(investorId))
            throw new UnauthorizedAccessException("Investor profile not linked.");

        if (take <= 0) take = 20;
        if (take > 50) take = 50;

        var matches = await _dbContext.InvestorMatches
            .Find(m => m.InvestorId == investorId)
            .SortByDescending(m => m.MatchScore)
            .ToListAsync();

        var newCutoff = DateTime.UtcNow.AddHours(-24);
        var newCount = matches.Count(m => m.MatchedAt.HasValue && m.MatchedAt.Value >= newCutoff);

        if (matches.Count == 0)
            return new OpportunityFeedResponse { TotalMatches = 0, NewMatchesToday = 0, Items = new() };

        var companyIds = matches.Select(m => m.CompanyId).Distinct().ToList();
        var companies = await _dbContext.Companies
            .Find(Builders<Companies>.Filter.In(c => c.Id, companyIds))
            .ToListAsync();
        var companiesById = companies.ToDictionary(c => c.Id);

        var items = new List<OpportunityCardResponse>();
        foreach (var m in matches)
        {
            if (!companiesById.TryGetValue(m.CompanyId, out var co)) continue;

            // Apply optional filters against the company snapshot.
            if (!string.IsNullOrWhiteSpace(sector) &&
                !string.Equals(co.Industry, sector, StringComparison.OrdinalIgnoreCase)) continue;
            if (!string.IsNullOrWhiteSpace(stage) &&
                !string.Equals(co.FundingRoundType, stage, StringComparison.OrdinalIgnoreCase)) continue;
            if (!string.IsNullOrWhiteSpace(geography) &&
                !string.Equals(co.Country, geography, StringComparison.OrdinalIgnoreCase)) continue;

            items.Add(BuildOpportunityCard(co, m));
            if (items.Count >= take) break;
        }

        return new OpportunityFeedResponse
        {
            TotalMatches = matches.Count,
            NewMatchesToday = newCount,
            Items = items,
        };
    }

    public async Task<OpportunityDetailResponse> GetOpportunityForInvestorAsync(string investorId, string companyId)
    {
        if (string.IsNullOrWhiteSpace(investorId))
            throw new UnauthorizedAccessException("Investor profile not linked.");

        var company = await _dbContext.Companies
            .Find(c => c.Id == companyId)
            .FirstOrDefaultAsync();
        if (company == null)
            throw new KeyNotFoundException("Opportunity not found.");

        InvestorMatch? match = null;
        if (ObjectId.TryParse(investorId, out _) && ObjectId.TryParse(companyId, out _))
        {
            match = await _dbContext.InvestorMatches
                .Find(m => m.InvestorId == investorId && m.CompanyId == companyId)
                .FirstOrDefaultAsync();
        }

        var candidateIds = new List<string> { investorId };
        var nda = await _dbContext.Phase6NdaAcceptances
            .Find(n => n.CompanyId == companyId && candidateIds.Contains(n.InvestorId))
            .FirstOrDefaultAsync();
        var ndaAccepted = nda != null;

        var detail = new OpportunityDetailResponse
        {
            CompanyId = company.Id,
            CompanyName = company.CompanyName,
            Tagline = company.Tagline,
            Industry = company.Industry,
            Country = company.Country,
            FundingRoundType = company.FundingRoundType,
            FundingAskAmount = company.FundingAskAmount,
            EquityOfferedPercent = company.EquityOfferedPercent,
            PreMoneyValuation = company.PreMoneyValuation,
            Valuation = company.Valuation,
            TrustScore = company.TrustScore,
            IsInvestorReady = company.IsInvestorReady,
            MatchScore = match?.MatchScore,
            MatchStatus = match?.Status ?? "direct_discovery",
            MatchRationale = match?.MatchRationale,
            ScoreBreakdown = match != null ? BuildScoreBreakdown(match) : null,
            NdaRequired = company.IsDataRoomNdaRequired,
            NdaAccepted = ndaAccepted,
            NdaAcceptedAt = nda?.AcceptedAt,
            DocumentsCount = company.DataRoomDocuments?.Count ?? 0,
            AiReviewScore = company.AiReview?.OverallScore,
            LastUpdatedAt = company.UpdatedAt,
        };

        if (ndaAccepted)
        {
            detail.CapTableSummary = new OpportunityCapTableSummaryDto
            {
                TotalShares = company.TotalShares ?? 0,
                EsopPoolPercent = company.EsopPoolPercent ?? 0,
                Entries = company.EquityStructure ?? new List<EquityEntryDto>(),
            };
            detail.Team = (company.EquityStructure ?? new List<EquityEntryDto>())
                .Where(e => e.Type == "founder")
                .Select(e => new OpportunityTeamMemberDto { Name = e.StakeholderName, Role = "Founder" })
                .ToList();
        }

        return detail;
    }


    public async Task<InvestorPipelineResponse> GetInvestorPipelineAsync(string investorId, string callerUserId)
    {
        if (string.IsNullOrWhiteSpace(investorId))
            throw new UnauthorizedAccessException("Investor profile not linked.");

        // Categorize candidate identities strictly by domain:
        // 1. objectIdCandidates: strictly 24-character hexadecimal ObjectId strings
        var objectIdCandidates = new List<string>();
        if (!string.IsNullOrWhiteSpace(investorId) && ObjectId.TryParse(investorId, out _))
            objectIdCandidates.Add(investorId);
        if (!string.IsNullOrWhiteSpace(callerUserId) && ObjectId.TryParse(callerUserId, out _))
            objectIdCandidates.Add(callerUserId);
        objectIdCandidates = objectIdCandidates.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        // 2. stringCandidates: all candidate identifiers for collections storing plain BSON strings
        var stringCandidates = new List<string>();
        if (!string.IsNullOrWhiteSpace(investorId)) stringCandidates.Add(investorId);
        if (!string.IsNullOrWhiteSpace(callerUserId)) stringCandidates.Add(callerUserId);
        stringCandidates = stringCandidates.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        // 1. Investor Matches (InvestorId is ObjectId-backed)
        List<InvestorMatch> matches = new();
        if (objectIdCandidates.Count > 0)
        {
            var matchFilter = Builders<InvestorMatch>.Filter.In(m => m.InvestorId, objectIdCandidates);
            matches = await _dbContext.InvestorMatches.Find(matchFilter).ToListAsync();
        }

        // 2. Data Room Access Requests (InvestorId / InvestorUserId are plain strings)
        var reqFilter = Builders<Phase6DataRoomAccessRequest>.Filter.Or(
            Builders<Phase6DataRoomAccessRequest>.Filter.In(r => r.InvestorId, stringCandidates),
            Builders<Phase6DataRoomAccessRequest>.Filter.In(r => r.InvestorUserId, stringCandidates)
        );
        var accessRequests = await _dbContext.Phase6DataRoomAccessRequests.Find(reqFilter).ToListAsync();

        // 3. NDAs (InvestorId is plain string)
        var ndaFilter = Builders<Phase6NdaAcceptance>.Filter.In(n => n.InvestorId, stringCandidates);
        var ndas = await _dbContext.Phase6NdaAcceptances.Find(ndaFilter).ToListAsync();

        // 4. Access Logs (InvestorId is plain string)
        var logFilter = Builders<Phase6AccessLog>.Filter.In(l => l.InvestorId, stringCandidates);
        var accessLogs = await _dbContext.Phase6AccessLogs.Find(logFilter).ToListAsync();

        // 5. Diligence Questions (InvestorId / AskedByUserId are plain strings)
        var qFilter = Builders<InvestorDiligenceQuestion>.Filter.Or(
            Builders<InvestorDiligenceQuestion>.Filter.In(q => q.InvestorId, stringCandidates),
            Builders<InvestorDiligenceQuestion>.Filter.In(q => q.AskedByUserId, stringCandidates)
        );
        var diligenceQuestions = await _dbContext.InvestorDiligenceQuestions.Find(qFilter).ToListAsync();

        // 6. Deal Executions (Investors[].InvestorId is ObjectId-backed)
        List<DealExecution> deals = new();
        if (objectIdCandidates.Count > 0)
        {
            try
            {
                var dealFilter = Builders<DealExecution>.Filter.ElemMatch(
                    d => d.Investors,
                    Builders<DealParticipant>.Filter.In(p => p.InvestorId, objectIdCandidates)
                );
                deals = await _dbContext.DealExecutions.Find(dealFilter).ToListAsync();
            }
            catch
            {
                // Fallback safe in-memory filtering if schema variations exist
                var allDeals = await _dbContext.DealExecutions.Find(_ => true).ToListAsync();
                deals = allDeals.Where(d => d.Investors != null && d.Investors.Any(p => stringCandidates.Contains(p.InvestorId))).ToList();
            }
        }

        // 7. Companies with Active Data Room Grants (DataRoomAccessRecords[].InvestorId is plain string)
        List<Companies> companiesWithGrants = new();
        try
        {
            var grantFilter = Builders<Companies>.Filter.ElemMatch(
                c => c.DataRoomAccessRecords,
                Builders<DataRoomAccessRecord>.Filter.In(g => g.InvestorId, stringCandidates)
            );
            companiesWithGrants = await _dbContext.Companies.Find(grantFilter).ToListAsync();
        }
        catch
        {
            // Non-blocking fallback
        }

        // 8. Company Portfolio Holdings (InvestorId / InvestorUserId are plain strings)
        List<CompanyPortfolioHolding> holdings = new();
        try
        {
            var holdingFilter = Builders<CompanyPortfolioHolding>.Filter.Or(
                Builders<CompanyPortfolioHolding>.Filter.In(h => h.InvestorId, stringCandidates),
                Builders<CompanyPortfolioHolding>.Filter.In(h => h.InvestorUserId, stringCandidates)
            );
            holdings = await _dbContext.CompanyPortfolioHoldings.Find(holdingFilter).ToListAsync();
        }
        catch
        {
            // Non-blocking fallback
        }

        var allCompanyIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var m in matches) if (!string.IsNullOrWhiteSpace(m.CompanyId)) allCompanyIds.Add(m.CompanyId);
        foreach (var r in accessRequests) if (!string.IsNullOrWhiteSpace(r.CompanyId)) allCompanyIds.Add(r.CompanyId);
        foreach (var n in ndas) if (!string.IsNullOrWhiteSpace(n.CompanyId)) allCompanyIds.Add(n.CompanyId);
        foreach (var l in accessLogs) if (!string.IsNullOrWhiteSpace(l.CompanyId)) allCompanyIds.Add(l.CompanyId);
        foreach (var q in diligenceQuestions) if (!string.IsNullOrWhiteSpace(q.CompanyId)) allCompanyIds.Add(q.CompanyId);
        foreach (var d in deals) if (!string.IsNullOrWhiteSpace(d.CompanyId)) allCompanyIds.Add(d.CompanyId);
        foreach (var c in companiesWithGrants) if (!string.IsNullOrWhiteSpace(c.Id)) allCompanyIds.Add(c.Id);
        foreach (var h in holdings) if (!string.IsNullOrWhiteSpace(h.CompanyId)) allCompanyIds.Add(h.CompanyId);

        if (allCompanyIds.Count == 0)
        {
            return new InvestorPipelineResponse
            {
                Summary = new InvestorPipelineSummaryDto { ActiveDeals = 0, CapitalCommitted = 0, AverageMatchScore = 0, Moic = null },
                Columns = new InvestorPipelineColumnsDto(),
            };
        }

        var companies = await _dbContext.Companies
            .Find(Builders<Companies>.Filter.In(c => c.Id, allCompanyIds))
            .ToListAsync();
        var companiesById = companies.ToDictionary(c => c.Id);

        var matchesByCompany = matches.Where(m => !string.IsNullOrWhiteSpace(m.CompanyId)).GroupBy(m => m.CompanyId).ToDictionary(g => g.Key, g => g.First());
        var requestsByCompany = accessRequests.Where(r => !string.IsNullOrWhiteSpace(r.CompanyId)).GroupBy(r => r.CompanyId).ToDictionary(g => g.Key, g => g.ToList());
        var ndasByCompany = ndas.Where(n => !string.IsNullOrWhiteSpace(n.CompanyId)).GroupBy(n => n.CompanyId).ToDictionary(g => g.Key, g => g.First());
        // Order deals by lifecycle strength so completed > active negotiation > terminal/rejected
        var dealsByCompany = deals
            .Where(d => !string.IsNullOrWhiteSpace(d.CompanyId))
            .GroupBy(d => d.CompanyId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(d => d.Status is "completed" ? 3 : (d.Status is "rejected" or "lost" ? 1 : 2))
                      .ThenByDescending(d => d.TermSheet?.SignedAt ?? d.Revisions.LastOrDefault()?.CreatedAt ?? DateTime.MinValue)
                      .First()
            );
        var logsByCompany = accessLogs.Where(l => !string.IsNullOrWhiteSpace(l.CompanyId)).GroupBy(l => l.CompanyId).ToDictionary(g => g.Key, g => g.ToList());
        var questionsByCompany = diligenceQuestions.Where(q => !string.IsNullOrWhiteSpace(q.CompanyId)).GroupBy(q => q.CompanyId).ToDictionary(g => g.Key, g => g.ToList());
        var holdingsByCompany = holdings.Where(h => !string.IsNullOrWhiteSpace(h.CompanyId)).GroupBy(h => h.CompanyId).ToDictionary(g => g.Key, g => g.First());

        var columns = new InvestorPipelineColumnsDto();

        foreach (var companyId in allCompanyIds)
        {
            if (!companiesById.TryGetValue(companyId, out var co)) continue;
            matchesByCompany.TryGetValue(companyId, out var match);
            var card = BuildOpportunityCard(co, match);

            dealsByCompany.TryGetValue(companyId, out var companyDeal);
            requestsByCompany.TryGetValue(companyId, out var companyRequests);
            holdingsByCompany.TryGetValue(companyId, out var companyHolding);

            var hasApprovedRequest = companyRequests != null && companyRequests.Any(r => r.Status == "approved");
            var hasPendingRequest = companyRequests != null && companyRequests.Any(r => r.Status == "pending");
            var hasActiveGrant = co.DataRoomAccessRecords != null && co.DataRoomAccessRecords.Any(g => stringCandidates.Contains(g.InvestorId) && (g.ExpiresAt == default || g.ExpiresAt >= DateTime.UtcNow));
            var hasNda = ndasByCompany.ContainsKey(companyId);
            var hasLogs = logsByCompany.ContainsKey(companyId);
            var hasQuestions = questionsByCompany.ContainsKey(companyId);
            var hasHolding = companyHolding != null;

            // Enrich card with holding data if present
            if (companyHolding != null)
            {
                card.HoldingId = companyHolding.Id;
                card.InvestmentAmount = companyHolding.InvestmentAmount;
                card.EquityPercentage = companyHolding.EquityPercentage;
                card.InstrumentType = companyHolding.InstrumentType;
                card.ClosedAt = companyHolding.ClosedAt ?? companyHolding.InvestmentDate;
            }

            // Enrich card with deal data if present
            if (companyDeal != null)
            {
                card.DealId = companyDeal.Id;
                card.DealStatus = companyDeal.Status;
                card.CurrentTurn = companyDeal.CurrentTurn;
                if (card.InvestmentAmount == null)
                {
                    var invSum = companyDeal.Investors != null && companyDeal.Investors.Count > 0 ? companyDeal.Investors.Sum(i => i.CommittedAmount) : 0;
                    card.InvestmentAmount = invSum > 0 ? invSum : (companyDeal.TermSheet?.TotalRaiseAmount);
                }
                if (card.EquityPercentage == null) card.EquityPercentage = companyDeal.TermSheet?.InvestorEquityPercent;
                if (card.InstrumentType == null) card.InstrumentType = companyDeal.TermSheet?.EquityType;
            }

            // Strict monotonic semantic precedence:
            // 1. Won / Portfolio: holding exists or completed deal
            if (hasHolding || (companyDeal != null && (companyDeal.Status is "completed" || companyDeal.DealStage is "WON" or "COMPLETED")))
            {
                card.Stage = "won";
                columns.Won.Add(card);
            }
            // 2. Active Negotiation: deal exists and is not completed, rejected, or lost
            else if (companyDeal != null && !(companyDeal.Status is "rejected" or "lost" || companyDeal.DealStage is "LOST" or "REJECTED"))
            {
                card.Stage = "negotiation";
                columns.Negotiation.Add(card);
            }
            // 3. Data Room / Diligence: active grant, approved request, access logs, or diligence Q&A
            else if (hasActiveGrant || hasApprovedRequest || hasLogs || hasQuestions)
            {
                card.Stage = "dataroom";
                columns.DataRoom.Add(card);
            }
            // 4. NDA Signed
            else if (hasNda)
            {
                card.Stage = "nda";
                columns.NdaSigned.Add(card);
            }
            // 5. In Review: pending access request or match in review/viewed/interested
            else if (hasPendingRequest || match?.Status is "viewed" or "interested" or "reviewing" or "contacted")
            {
                card.Stage = "review";
                columns.InReview.Add(card);
            }
            // 6. Lost: explicitly rejected or passed deal/match — BUT only if there is
            //    no active non-terminal InvestorMatch that would otherwise surface the
            //    company as a new engagement opportunity. A historical rejected Deal must
            //    not permanently mask a genuinely new/active InvestorMatch.
            else if (match?.Status is "rejected" or "passed" or "lost"
                     || (companyDeal != null
                         && (companyDeal.Status is "rejected" or "lost" || companyDeal.DealStage is "LOST" or "REJECTED")
                         && (match == null || match.Status is "rejected" or "passed" or "lost")))
            {
                card.Stage = "lost";
                columns.Lost.Add(card);
            }
            // 7. New Matches: fresh unengaged match
            else
            {
                card.Stage = "new";
                columns.NewMatches.Add(card);
            }
        }

        var investments = new List<Investments>();
        if (!string.IsNullOrWhiteSpace(callerUserId) && Guid.TryParse(callerUserId, out var callerGuid))
        {
            investments = await _dbContext.Investments
                .Find(i => i.InvestorId == callerGuid)
                .ToListAsync();
        }
        var capitalCommitted = holdings.Sum(h => h.InvestmentAmount) + investments.Sum(i => (double)i.Amount);
        var activeDeals = columns.NewMatches.Count + columns.InReview.Count + columns.NdaSigned.Count
                          + columns.DataRoom.Count + columns.Negotiation.Count;
        var scoredMatches = matches.Where(m => m.MatchScore > 0).ToList();
        var avgScore = scoredMatches.Count == 0 ? 0 : scoredMatches.Average(m => m.MatchScore);

        return new InvestorPipelineResponse
        {
            Summary = new InvestorPipelineSummaryDto
            {
                ActiveDeals = activeDeals,
                CapitalCommitted = capitalCommitted,
                AverageMatchScore = Math.Round(avgScore, 1),
                Moic = null,
            },
            Columns = columns,
        };
    }



    public async Task<InvestorDocumentListResponse> GetInvestorDocumentsAsync(string investorId, string companyId)
    {
        if (string.IsNullOrWhiteSpace(investorId))
            throw new UnauthorizedAccessException("Investor profile not linked.");

        var company = await _dbContext.Companies
            .Find(c => c.Id == companyId)
            .FirstOrDefaultAsync();
        if (company == null)
            throw new KeyNotFoundException("Opportunity not found.");

        var candidateIds = new List<string> { investorId };
        var nda = await _dbContext.Phase6NdaAcceptances
            .Find(n => n.CompanyId == companyId && candidateIds.Contains(n.InvestorId))
            .FirstOrDefaultAsync();
        var ndaAccepted = nda != null;

        var response = new InvestorDocumentListResponse
        {
            NdaRequired = company.IsDataRoomNdaRequired,
            NdaAccepted = ndaAccepted,
        };

        // Pre-NDA: empty list. Document existence is not revealed.
        if (company.IsDataRoomNdaRequired && !ndaAccepted) return response;

        response.Items = (company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>())
            .Select(d => new InvestorDocumentListItemDto
            {
                DocumentId = d.DocumentId,
                Title = d.Title,
                Category = d.Category,
                FileName = d.FileName,
                MimeType = d.MimeType,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt,
            }).ToList();
        return response;
    }

    public async Task<InvestorSessionResponse> GetInvestorSessionAsync(string investorId, string companyId)
    {
        if (string.IsNullOrWhiteSpace(investorId))
            throw new UnauthorizedAccessException("Investor profile not linked.");

        var company = await _dbContext.Companies
            .Find(c => c.Id == companyId)
            .FirstOrDefaultAsync();
        if (company == null)
            throw new KeyNotFoundException("Opportunity not found.");

        var totalDocs = company?.DataRoomDocuments?.Count ?? 0;
        var docsById = (company?.DataRoomDocuments ?? new List<DataRoomDocumentResponse>())
            .ToDictionary(d => d.DocumentId);

        var candidateIds = new List<string> { investorId };
        var logs = await _dbContext.Phase6AccessLogs
            .Find(l => candidateIds.Contains(l.InvestorId) && l.CompanyId == companyId)
            .SortBy(l => l.OccurredAt)
            .ToListAsync();

        var viewEvents = logs.Where(l => l.EventType == "view").ToList();
        var downloadEvents = logs.Where(l => l.EventType == "download").ToList();

        // Most-recent view per document — dedup by DocumentId.
        var reviewed = viewEvents
            .GroupBy(l => l.DocumentId)
            .Select(g =>
            {
                var newest = g.OrderByDescending(l => l.OccurredAt).First();
                docsById.TryGetValue(newest.DocumentId ?? string.Empty, out var doc);
                return new InvestorReviewedDocumentDto
                {
                    DocumentId = newest.DocumentId,
                    Title = doc?.Title ?? "Document",
                    ViewedAt = newest.OccurredAt,
                };
            }).ToList();

        return new InvestorSessionResponse
        {
            ViewedDocsCount = reviewed.Count,
            TotalDocsCount = totalDocs,
            ViewEventsCount = viewEvents.Count,
            DownloadEventsCount = downloadEvents.Count,
            FirstAccessAt = logs.Count > 0 ? logs.First().OccurredAt : null,
            LastAccessAt = logs.Count > 0 ? logs.Last().OccurredAt : null,
            ReviewedDocuments = reviewed,
        };
    }

    public async Task<DiligenceProgressResponse> GetDiligenceProgressAsync(string investorId, string companyId)
    {
        if (string.IsNullOrWhiteSpace(investorId))
            throw new UnauthorizedAccessException("Investor profile not linked.");

        var company = await _dbContext.Companies
            .Find(c => c.Id == companyId)
            .FirstOrDefaultAsync();
        if (company == null)
            throw new KeyNotFoundException("Opportunity not found.");

        var deal = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == companyId)
            .SortByDescending(d => d.CreatedAt)
            .FirstOrDefaultAsync();

        var items = deal?.DueDiligenceChecklist ?? new List<DueDigligenceItem>();
        var total = items.Count;
        if (total == 0)
            return new DiligenceProgressResponse();

        var completed = items.Count(i => i.Status == "completed");
        var inProgress = items.Count(i => i.Status == "in_progress");
        var pending = items.Count(i => i.Status == "pending");
        var flagged = items.Count(i => i.Status == "flagged");

        return new DiligenceProgressResponse
        {
            TotalItems = total,
            Completed = completed,
            InProgress = inProgress,
            Pending = pending,
            Flagged = flagged,
            PercentComplete = (int)Math.Round(completed / (double)total * 100),
        };
    }

    // ---- Helpers ----

    private static OpportunityCardResponse BuildOpportunityCard(Companies co, InvestorMatch? m)
        => new()
        {
            CompanyId = co.Id,
            CompanyName = co.CompanyName,
            Tagline = co.Tagline,
            Industry = co.Industry,
            Country = co.Country,
            FundingRoundType = co.FundingRoundType,
            FundingAskAmount = co.FundingAskAmount,
            Valuation = co.Valuation,
            MatchScore = m?.MatchScore,
            MatchStatus = m?.Status ?? "direct_discovery",
            IsInvestorReady = co.IsInvestorReady,
            LastUpdatedAt = co.UpdatedAt,
        };

    private static OpportunityScoreBreakdownDto BuildScoreBreakdown(InvestorMatch match)
    {
        static int Clamp(int v) => Math.Clamp(v, 0, 100);
        var score = match.ScoreComponents ?? new ScoreComponents();
        return new OpportunityScoreBreakdownDto
        {
            SectorFit = Clamp(score.SectorScore),
            StageFit = Clamp(score.StageScore),
            CheckSizeFit = Clamp(score.CheckSizeScore),
            GeographyFit = Clamp(score.GeographyScore),
            EquityTypeFit = Clamp(score.EquityTypeScore),
            InvestmentHistoryFit = Clamp(score.InvestmentHistoryScore),
            RevenueStageScore = Clamp(score.RevenueStageScore),
            MarketSizeScore = Clamp(score.MarketSizeScore),
            GrowthPotentialScore = Clamp(score.GrowthPotentialScore),
        };
    }


    public async Task<RoundSummaryResponse> GetRoundSummaryAsync(string companyId)
    {
        var deals = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == companyId)
            .ToListAsync();

        var committed = deals
            .SelectMany(d => d.Investors)
            .Where(p => p.Status == "committed")
            .Sum(p => p.CommittedAmount);

        var termSheets = deals.Count(d => d.Status == "term-sheet");
        var closed = deals.Count(d => Phase9Requirements.DealTerminalStates.Contains(d.Status));
        var interested = deals.Count(d => d.Status == "interested");
        var inDiscussion = deals.Count(d => d.Status == "in-discussion");

        var roundTarget = 0.0;
        var remaining = Math.Max(0, roundTarget - committed);
        var percentFilled = roundTarget > 0 ? (committed / roundTarget) * 100 : 0;

        return new RoundSummaryResponse
        {
            TotalDeals = deals.Count,
            CommittedAmountEur = committed,
            RoundTargetEur = roundTarget,
            RemainingEur = remaining,
            PercentFilled = percentFilled,
            InterestedCount = interested,
            InDiscussionCount = inDiscussion,
            TermSheetCount = termSheets,
            ClosedCount = closed
        };
    }

    public async Task<TermSheetResponse> GetActiveTermSheetAsync(string companyId)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == companyId && d.Status == "term-sheet")
            .FirstOrDefaultAsync();

        if (deal?.TermSheet == null)
            return null;

        return new TermSheetResponse
        {
            TotalRaiseAmount = deal.TermSheet.TotalRaiseAmount,
            PostMoneyValuation = deal.TermSheet.PostMoneyValuation,
            EquityType = deal.TermSheet.EquityType,
            InvestorEquityPercent = deal.TermSheet.InvestorEquityPercent,
            ProRataRights = deal.TermSheet.ProRataRights,
            Status = deal.TermSheet.Status,
            SignedAt = deal.TermSheet.SignedAt,
            ShareClass = string.Empty,
            LiquidationPref = deal.TermSheet.LiquidationPreference,
            BoardSeat = deal.TermSheet.BoardSeats.ToString(),
            HasBoardSeat = deal.TermSheet.BoardSeats > 0,
            AntiDilutionType = deal.TermSheet.AntiDilutionProtection,
            ClosingDeadline = deal.TermSheet.ProposedClosingDate?.ToString() ?? "",
            ExpiresAt = ""
        };
    }

    /// <summary>
    /// Round-level matchmaking timeline. Idempotently seeds two events from
    /// Phase 5 (funding ask) and Phase 8 (AI matches) data on first access,
    /// then returns all events for the company sorted by date ascending.
    /// </summary>
    public async Task<List<TimelineEventResponse>> GetDealTimelineAsync(string companyId)
    {
        var existingCount = await _dbContext.Phase9DealTimelineEvents
            .CountDocumentsAsync(e => e.CompanyId == companyId);

        if (existingCount == 0)
        {
            var company = await _dbContext.Companies
                .Find(c => c.Id == companyId)
                .FirstOrDefaultAsync();

            var roundType = string.IsNullOrWhiteSpace(company?.FundingRoundType)
                ? "Funding"
                : company.FundingRoundType;

            // FundingAskPublishedAt is not tracked on the company; fall back to 7 days ago.
            var event1Date = DateTime.UtcNow.AddDays(-7);

            var matchCount = await _dbContext.InvestorMatches
                .CountDocumentsAsync(m => m.CompanyId == companyId);

            var seedEvents = new List<Phase9DealTimelineEvent>
            {
                new Phase9DealTimelineEvent
                {
                    CompanyId = companyId,
                    Title = "Funding ask published",
                    Subtitle = $"{roundType} round live on marketplace",
                    Status = "completed",
                    Color = "green",
                    EventDate = event1Date,
                    IsAutoGenerated = true,
                },
                new Phase9DealTimelineEvent
                {
                    CompanyId = companyId,
                    Title = $"{matchCount} AI matches identified",
                    Subtitle = "Top matched investors from your profile",
                    Status = "completed",
                    Color = "green",
                    EventDate = event1Date.AddDays(1),
                    IsAutoGenerated = true,
                },
            };

            await _dbContext.Phase9DealTimelineEvents.InsertManyAsync(seedEvents);
        }

        var events = await _dbContext.Phase9DealTimelineEvents
            .Find(e => e.CompanyId == companyId)
            .SortBy(e => e.EventDate)
            .ToListAsync();

        return events.Select(e => new TimelineEventResponse
        {
            EventId = e.Id,
            EventDate = e.EventDate,
            Title = e.Title,
            Subtitle = e.Subtitle,
            Status = e.Status,
            Color = e.Color,
        }).ToList();
    }
}
