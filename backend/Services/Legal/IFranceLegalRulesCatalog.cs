using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Services.Legal
{
    /// <summary>
    /// Contract for the authoritative France statutory legal rules catalog.
    /// Loaded deterministically from versioned registry resources.
    /// </summary>
    public interface IFranceLegalRulesCatalog
    {
        string RulesVersion { get; }
        string Jurisdiction { get; }
        LegalRulesCatalogFile GetCatalog();
        IReadOnlyList<LegalRuleDefinition> GetAllRules();
        LegalRuleDefinition? GetRuleById(string ruleId);
    }
}
