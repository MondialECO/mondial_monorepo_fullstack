using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

public class PhaseValidator : IPhaseValidator
{
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
                errors.Add("Registration number (SIRET) is required");

            if (string.IsNullOrWhiteSpace(company.LegalStructure))
                errors.Add("Legal structure is required");

            if (string.IsNullOrWhiteSpace(company.IncorporationDate))
                errors.Add("Incorporation date is required");

            if (string.IsNullOrWhiteSpace(company.RegisteredAddress))
                errors.Add("Registered address is required");

            if (string.IsNullOrWhiteSpace(company.Country))
                errors.Add("Country is required");

            if (company.BeneficialOwners == null || company.BeneficialOwners.Count == 0)
                errors.Add("At least one beneficial owner is required");

            if (company.Documents == null || company.Documents.Count == 0)
                errors.Add("At least one document must be uploaded");

            // Check that documents are approved
            var unapprovedDocs = company.Documents?.Where(d => d.Status != "approved").ToList();
            if (unapprovedDocs?.Count > 0)
                errors.Add($"{unapprovedDocs.Count} document(s) still pending review");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase3Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
            if (totalRevenue <= 0)
                errors.Add("Must have positive quarterly revenue data");

            if (company.Valuation == null || company.Valuation <= 0)
                errors.Add("Valuation must be calculated");

            if (company.EquityStructure == null || company.EquityStructure.Count == 0)
                errors.Add("Equity structure must be defined");

            if (company.FundingAskAmount == null || company.FundingAskAmount <= 0)
                errors.Add("Funding ask amount is required");

            if (string.IsNullOrWhiteSpace(company.FundingRoundType))
                errors.Add("Funding round type must be specified");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase4Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (company.EquityStructure == null || company.EquityStructure.Count == 0)
                errors.Add("Cap table must be defined");

            if (company.TotalShares == null || company.TotalShares <= 0)
                errors.Add("Total shares must be set");

            var totalOwnership = company.EquityStructure?.Sum(e => (e.SharesOwned / (double)company.TotalShares) * 100) ?? 0;
            if (totalOwnership < 90 || totalOwnership > 100)
                errors.Add($"Cap table must total 100% (currently {totalOwnership:F2}%)");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase5Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (company.FundingAskAmount == null || company.FundingAskAmount <= 0)
                errors.Add("Funding ask amount is required");

            if (string.IsNullOrWhiteSpace(company.FundingRoundType))
                errors.Add("Funding round type must be specified");

            if (company.CapitalAllocation == null || company.CapitalAllocation.Count == 0)
                errors.Add("Capital allocation breakdown is required");

            var allocationTotal = company.CapitalAllocation?.Sum(c => c.Percent) ?? 0;
            if (allocationTotal < 95 || allocationTotal > 105)
                errors.Add($"Capital allocation must total 100% (currently {allocationTotal:F2}%)");

            if (company.ResourceMap?.HiringPlan?.Count == 0)
                errors.Add("Hiring plan is required");

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

            if (company.DataRoomDocuments == null || company.DataRoomDocuments.Count == 0)
                errors.Add("Data room must contain at least one document");

            var requiredCategories = new[] { "legal", "financial", "business" };
            var uploadedCategories = company.DataRoomDocuments?
                .Select(d => d.Category?.ToLower())
                .Where(c => requiredCategories.Contains(c))
                .Distinct()
                .ToList() ?? new List<string>();

            var missingCategories = requiredCategories.Except(uploadedCategories).ToList();
            if (missingCategories.Count > 0)
                errors.Add($"Missing required document categories: {string.Join(", ", missingCategories)}");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase7Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (company.AiReview == null)
                errors.Add("AI review must be completed");

            if (company.AiReview?.OverallScore < 60)
                errors.Add($"AI review score must be at least 60 (currently {company.AiReview?.OverallScore})");

            if (!company.AiReview?.InvestorReadyBadge ?? false)
                errors.Add("Company must receive investor-ready badge");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase8Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            // Phase 8 is informational - just track investor interactions
            // No strict validation needed - investors will be matched automatically

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase9Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            // Phase 9 validation happens per deal, not at company level
            // This is a placeholder for when needed

            return (errors.Count == 0, errors);
        });
    }
}
