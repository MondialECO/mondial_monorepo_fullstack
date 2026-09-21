using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Models.Phase4
{
    public class NeedsContext
    {
        public ConstructionSnapshot? ConstructionSnapshot { get; set; }
        public OperationalRoadmap? OperationalRoadmap { get; set; }
        public MarketData Market { get; set; } = new();
        public BusinessModelData BusinessModel { get; set; } = new();
        public ForecastData Forecast { get; set; } = new();
        public LegalData Legal { get; set; } = new();
        public FormationData Formation { get; set; } = new();
        public FounderProfileData FounderProfile { get; set; } = new();
        public ProfileVentureContext? VentureContext { get; set; }
        public NeedsSourceVersions CurrentSourceVersions { get; set; } = new();
        public bool IsSnapshotStale { get; set; }
        public bool IsRoadmapStale { get; set; }
    }
}
