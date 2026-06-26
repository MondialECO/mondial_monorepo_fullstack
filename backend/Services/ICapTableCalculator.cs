using WebApp.Models.Dtos;

namespace WebApp.Services;

public interface ICapTableCalculator
{
    Task<List<DilutionScenarioDto>> SimulateDilutionAsync(
        List<EquityEntryDto> currentCapTable,
        double fundingAmount,
        double postMoneyValuation,
        string roundType
    );
}
