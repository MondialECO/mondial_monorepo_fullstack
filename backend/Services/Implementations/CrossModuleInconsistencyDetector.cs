using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

/// <summary>
/// Deterministic cross-module inconsistency detector for Phase 7 AI Expert Review.
/// Performs rigorous, evidence-based verification across platform modules.
/// </summary>
public static class CrossModuleInconsistencyDetector
{
    public static List<CrossModuleInconsistency> DetectInconsistencies(Companies company)
    {
        var inconsistencies = new List<CrossModuleInconsistency>();

        // 1. Funding Ask vs Capital Allocation
        if (company.FundingAskAmount > 0 && company.CapitalAllocation?.Count > 0)
        {
            var totalAllocation = company.CapitalAllocation.Sum(a => a?.Percent ?? 0);
            if (Math.Abs(totalAllocation - 100.0) > 0.01)
            {
                inconsistencies.Add(new CrossModuleInconsistency
                {
                    ModuleA = "Phase 5 Funding Ask",
                    ModuleB = "Phase 5 Capital Allocation",
                    Description = $"Capital allocation breakdown sums to {totalAllocation:F1}%, diverging from the required 100% total.",
                    Evidence = $"Target Raise: EUR {company.FundingAskAmount:N0} | Allocation Sum: {totalAllocation:F1}%",
                    Severity = "HIGH"
                });
            }
        }

        // 2. Pre-Money Valuation vs Raise Amount
        if (company.FundingAskAmount.HasValue && company.PreMoneyValuation.HasValue)
        {
            if (company.PreMoneyValuation.Value < company.FundingAskAmount.Value)
            {
                inconsistencies.Add(new CrossModuleInconsistency
                {
                    ModuleA = "Phase 5 Pre-Money Valuation",
                    ModuleB = "Phase 5 Funding Ask",
                    Description = "Pre-money valuation is lower than the requested raise amount, causing mathematical dilution inversion.",
                    Evidence = $"Pre-Money: EUR {company.PreMoneyValuation:N0} < Raise: EUR {company.FundingAskAmount:N0}",
                    Severity = "CRITICAL"
                });
            }
        }

        // 3. Pre-Money Valuation vs Recorded Actual Revenue
        var annualActualRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        if (annualActualRevenue > 0 && company.PreMoneyValuation.HasValue && company.PreMoneyValuation.Value > 0)
        {
            var multiple = company.PreMoneyValuation.Value / annualActualRevenue;
            if (multiple > 100.0)
            {
                inconsistencies.Add(new CrossModuleInconsistency
                {
                    ModuleA = "Phase 3 Actual Revenue",
                    ModuleB = "Phase 5 Pre-Money Valuation",
                    Description = $"Valuation multiple ({multiple:F1}x) represents an extreme premium relative to recorded annual revenue.",
                    Evidence = $"Annual Actual Revenue: EUR {annualActualRevenue:N0} | Pre-Money Valuation: EUR {company.PreMoneyValuation:N0}",
                    Severity = "MEDIUM"
                });
            }
        }

        // 4. Cap Table vs Equity Offered
        if (company.EquityOfferedPercent.HasValue && company.EquityStructure?.Count > 0)
        {
            var totalShares = company.TotalShares ?? (company.EquityStructure.Sum(e => (long)e.SharesOwned));
            var allocatedPercent = totalShares > 0
                ? (company.EquityStructure.Sum(e => (double)e.SharesOwned) * 100.0 / totalShares)
                : 100.0;

            if (allocatedPercent + company.EquityOfferedPercent.Value > 100.01)
            {
                inconsistencies.Add(new CrossModuleInconsistency
                {
                    ModuleA = "Phase 4 Cap Table",
                    ModuleB = "Phase 5 Equity Offered",
                    Description = "Existing shareholder ownership plus new equity offered exceeds 100% of pre-round authorized equity.",
                    Evidence = $"Existing Total: {allocatedPercent:F1}% + Offered: {company.EquityOfferedPercent:F1}% = {allocatedPercent + company.EquityOfferedPercent.Value:F1}%",
                    Severity = "CRITICAL"
                });
            }
        }

        // 5. Legal Registration vs Document Verification
        if (!string.IsNullOrWhiteSpace(company.RegistrationNumber) && company.DocumentStatuses != null)
        {
            var regDocs = company.DocumentStatuses.Where(d =>
                d.Type?.Contains("registration", StringComparison.OrdinalIgnoreCase) == true ||
                d.Type?.Contains("kbis", StringComparison.OrdinalIgnoreCase) == true ||
                d.Type?.Contains("incorporation", StringComparison.OrdinalIgnoreCase) == true).ToList();

            if (regDocs.Count > 0 && regDocs.All(d => d.Status == "rejected"))
            {
                inconsistencies.Add(new CrossModuleInconsistency
                {
                    ModuleA = "Phase 2 Legal Registration",
                    ModuleB = "Phase 2 Verification Documents",
                    Description = "Registration SIRET is declared, but all uploaded registration proof documents are rejected.",
                    Evidence = $"SIRET: {company.RegistrationNumber} | All {regDocs.Count} registration documents rejected",
                    Severity = "HIGH"
                });
            }
        }

        return inconsistencies;
    }
}
