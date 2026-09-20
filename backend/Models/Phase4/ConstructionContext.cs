using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Models.Phase4
{
    public class ConstructionContext
    {
        public ProjectData Project { get; set; } = new();
        public BrandData Brand { get; set; } = new();
        public MarketData Market { get; set; } = new();
        public BusinessModelData BusinessModel { get; set; } = new();
        public ForecastData Forecast { get; set; } = new();
        public LegalData Legal { get; set; } = new();
        public FormationData Formation { get; set; } = new();
        public BusinessPlanData BusinessPlan { get; set; } = new();
        public InvestorReadinessData InvestorReadiness { get; set; } = new();
        public FounderProfileData FounderProfile { get; set; } = new();
        public Phase4SourceVersions CurrentSourceVersions { get; set; } = new();
    }

    public class ProjectData
    {
        public string Name { get; set; } = string.Empty;
        public string Concept { get; set; } = string.Empty;
        public string Tagline { get; set; } = string.Empty;
        public string TargetUser { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string MarketGap { get; set; } = string.Empty;
        public string CreatorEdge { get; set; } = string.Empty;
        public string Sector { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Version { get; set; } = 1;
        public DateTime? UpdatedAt { get; set; }
    }

    public class BrandData
    {
        public string BrandingMethod { get; set; } = string.Empty;
        public string LogoType { get; set; } = string.Empty;
        public string LogoAsset { get; set; } = string.Empty;
        public string PaletteName { get; set; } = string.Empty;
        public string TypographyPairing { get; set; } = string.Empty;
    }

    public class MarketData
    {
        public string SessionId { get; set; } = string.Empty;
        public int Version { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public bool HasMarketStudy { get; set; }
        public string TargetCustomer { get; set; } = string.Empty;
        public string ProblemNeed { get; set; } = string.Empty;
        public string CompetitorContext { get; set; } = string.Empty;
        public string MarketSignals { get; set; } = string.Empty;
        public string TamSamSom { get; set; } = string.Empty;
    }

    public class BusinessModelData
    {
        public string SessionId { get; set; } = string.Empty;
        public int Version { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public bool HasBusinessModel { get; set; }
        public List<string> CustomerSegments { get; set; } = new();
        public string ValueProposition { get; set; } = string.Empty;
        public List<string> Channels { get; set; } = new();
        public List<string> KeyActivities { get; set; } = new();
        public List<string> KeyResources { get; set; } = new();
        public List<string> KeyPartners { get; set; } = new();
        public List<string> CostStructure { get; set; } = new();
        public List<string> RevenueStreams { get; set; } = new();
    }

    public class ForecastData
    {
        public string SessionId { get; set; } = string.Empty;
        public int Version { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public bool HasForecast { get; set; }
        public decimal? Arpu { get; set; }
        public int? BreakEvenMonth { get; set; }
        public decimal? RunwayMonths { get; set; }
        public decimal? TotalLaunchBudget { get; set; }
        public decimal? FundingNeed { get; set; }
    }

    public class LegalData
    {
        public bool HasLegalAssessment { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int ChecklistCompletedCount { get; set; }
        public int ChecklistTotalCount { get; set; }
        public List<string> RequiredLicenses { get; set; } = new();
        public List<string> PendingObligations { get; set; } = new();
        public int HighPriorityPendingCount { get; set; }
    }

    public class FormationData
    {
        public int Version { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string RecommendedType { get; set; } = string.Empty;
        public string SelectedType { get; set; } = string.Empty;
        public List<string> YouHave { get; set; } = new();
        public List<CreatorSkillGap> YouNeed { get; set; } = new();
        public bool CofounderNeeded { get; set; }
    }

    public class BusinessPlanData
    {
        public string SessionId { get; set; } = string.Empty;
        public int Version { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public bool HasPlan { get; set; }
        public bool ExecutiveSummaryPresent { get; set; }
    }

    public class InvestorReadinessData
    {
        public double Score { get; set; }
        public string Stage { get; set; } = string.Empty;
    }

    public class FounderProfileData
    {
        public List<ProfileSkill> Skills { get; set; } = new();
        public List<ProfessionalExperience> Experiences { get; set; } = new();
        public List<ProfessionalEducation> Education { get; set; } = new();
        public List<ProfessionalLanguage> Languages { get; set; } = new();
        public string CurrentSituation { get; set; } = string.Empty;
        public string WeeklyAvailability { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string PreviousEntrepreneurialExperience { get; set; } = string.Empty;
        public string LearningPreference { get; set; } = string.Empty;
        public string DelegationPreference { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
    }
}
