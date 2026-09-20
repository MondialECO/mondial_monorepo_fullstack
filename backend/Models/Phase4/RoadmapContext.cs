using System;
using System.Collections.Generic;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Models.Phase4
{
    public class RoadmapContext
    {
        public string UserId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public CreatorJourneyProject Project { get; set; } = new();
        public ConstructionSnapshot ConstructionSnapshot { get; set; } = new();
        public Phase4SourceVersions CurrentSourceVersions { get; set; } = new();
        
        // Contextual inputs
        public ForecastSession? Forecast { get; set; }
        public CreatorLegalChecklist? LegalChecklist { get; set; }
        public CreatorFormationGenerator? Formation { get; set; }
        public BusinessPlanSession? BusinessPlan { get; set; }
        public ProfessionalProfileRecord? Profile { get; set; }
        public ProfileVentureContext? VentureContext { get; set; }
        public string WeeklyAvailability { get; set; } = "10–20 hours/week";
        public string CurrentSituation { get; set; } = string.Empty;
        public string PreviousExperience { get; set; } = string.Empty;
    }

    public enum CapacityTier
    {
        VeryLight,  // <5h/w
        Light,      // 5-10h/w
        Standard,   // 10-20h/w
        Accelerated,// 20-30h/w
        Intensive,  // 30h+/Full-time
        Conservative// Not sure yet / default
    }
}
