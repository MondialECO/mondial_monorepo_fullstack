using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

public class CapTableCalculator : ICapTableCalculator
{
    public async Task<List<DilutionScenarioDto>> SimulateDilutionAsync(
        List<EquityEntryDto> currentCapTable,
        double fundingAmount,
        double postMoneyValuation,
        string roundType)
    {
        return await Task.Run(() =>
        {
            var scenarios = new List<DilutionScenarioDto>();

            // Current state
            var totalCurrentShares = currentCapTable.Sum(e => e.SharesOwned);
            var founderEquity = currentCapTable
                .Where(e => e.Type == "founder")
                .Sum(e => e.SharesOwned) / (double)totalCurrentShares * 100;

            // Pre-money valuation calculation
            var preMoneyValuation = postMoneyValuation - fundingAmount;

            // New shares issued to investor
            var newSharesIssued = fundingAmount > 0 && postMoneyValuation > 0
                ? (fundingAmount / postMoneyValuation) * (totalCurrentShares + fundingAmount / postMoneyValuation)
                : 0;

            var investorEquityPercent = newSharesIssued / (totalCurrentShares + newSharesIssued) * 100;
            var founderEquityAfter = founderEquity * (totalCurrentShares / (totalCurrentShares + newSharesIssued));

            // Main scenario
            scenarios.Add(new DilutionScenarioDto
            {
                Round = roundType,
                FounderOwnershipBefore = founderEquity,
                FounderOwnershipAfter = founderEquityAfter,
                InvestorOwnership = investorEquityPercent,
                Valuation = postMoneyValuation
            });

            // Optimistic scenario (20% higher valuation)
            var optimisticValuation = postMoneyValuation * 1.2;
            var optimisticNewShares = fundingAmount / optimisticValuation * totalCurrentShares;
            var optimisticInvestorEquity = optimisticNewShares / (totalCurrentShares + optimisticNewShares) * 100;
            var optimisticFounderEquity = founderEquity * (totalCurrentShares / (totalCurrentShares + optimisticNewShares));

            scenarios.Add(new DilutionScenarioDto
            {
                Round = $"{roundType} (Optimistic)",
                FounderOwnershipBefore = founderEquity,
                FounderOwnershipAfter = optimisticFounderEquity,
                InvestorOwnership = optimisticInvestorEquity,
                Valuation = optimisticValuation
            });

            // Conservative scenario (20% lower valuation)
            var conservativeValuation = postMoneyValuation * 0.8;
            var conservativeNewShares = fundingAmount / conservativeValuation * totalCurrentShares;
            var conservativeInvestorEquity = conservativeNewShares / (totalCurrentShares + conservativeNewShares) * 100;
            var conservativeFounderEquity = founderEquity * (totalCurrentShares / (totalCurrentShares + conservativeNewShares));

            scenarios.Add(new DilutionScenarioDto
            {
                Round = $"{roundType} (Conservative)",
                FounderOwnershipBefore = founderEquity,
                FounderOwnershipAfter = conservativeFounderEquity,
                InvestorOwnership = conservativeInvestorEquity,
                Valuation = conservativeValuation
            });

            return scenarios;
        });
    }
}
