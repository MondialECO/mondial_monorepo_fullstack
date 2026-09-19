using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos.Ai;

namespace WebApp.Services.Legal
{
    /// <summary>
    /// Builder that transforms deterministic legal assessment results into Section 12:
    /// Legal &amp; Regulatory Framework structured data for the Executive Business Plan.
    /// </summary>
    public interface ILegalFrameworkSectionBuilder
    {
        LegalRegulatoryFrameworkDto Build(CreatorLegalAssessment assessment, CreatorIdea idea, LegalRulesCatalogFile catalog);
    }
}
