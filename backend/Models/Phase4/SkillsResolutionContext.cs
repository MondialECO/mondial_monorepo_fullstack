using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Models.Phase4
{
    public class SkillsResolutionContext
    {
        public NeedsAnalysis? NeedsAnalysis { get; set; }
        public OperationalRoadmap? OperationalRoadmap { get; set; }
        public ProfessionalProfileRecord? ProfessionalProfile { get; set; }
        public List<ProfileSkill> Skills { get; set; } = new();
        public List<ProfessionalExperience> Experiences { get; set; } = new();
        public List<ProfessionalEducation> Education { get; set; } = new();
        public List<UserCredentialRecord> Credentials { get; set; } = new();
        public List<ProfessionalLanguage> Languages { get; set; } = new();
        public ProfileVentureContext? VentureContext { get; set; }

        public CreatorLegalAssessment? LegalAssessment { get; set; }
        public CreatorFormationGenerator? Formation { get; set; }

        public SkillsSourceVersions CurrentSourceVersions { get; set; } = new();
        public bool IsNeedsAnalysisStale { get; set; }
    }
}
