using System;
using System.Collections.Generic;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Phase4
{
    // =========================================================================
    // LAUNCH ASSETS DOMAIN MODELS (Phase 4.8)
    // =========================================================================

    public class LaunchAssetSection
    {
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string StatusBadge { get; set; } = string.Empty;
        public bool IsIncluded { get; set; } = true;
        public bool IsRequired { get; set; } = false;
        public string? Headline { get; set; }
        public string? Description { get; set; }
        public string? ButtonLabel { get; set; }
        public string? ButtonDestinationType { get; set; }
        public string? ButtonDestinationValue { get; set; }
        public string? ExclusionReason { get; set; }
        public string? ActionLabel { get; set; }
        public string? ActionRoute { get; set; }
    }

    public class LaunchWorkflowStep
    {
        public int StepNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
    }

    public class LaunchSolutionCard
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = "layers";
    }

    public class LaunchWorkflowDetailedItem
    {
        public int StepNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class LaunchFaqItem
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
    }

    public class LaunchPricingExclusion
    {
        public bool Excluded { get; set; } = true;
        public decimal ChosenPrice { get; set; } = 15;
        public string BillingPeriod { get; set; } = "month";
        public string Unit { get; set; } = "business";
        public string Currency { get; set; } = "€";
        public string Reason { get; set; } = "Your chosen price is €15 per business / month. Confirm the offer details before adding pricing to the website.";
        public string ActionLabel { get; set; } = "Review pricing details →";
        public string ActionRoute { get; set; } = "/dashboard/creator/phase-4/pricing";
    }

    public class LaunchProofExclusion
    {
        public bool Excluded { get; set; } = true;
        public bool ProofNeeded { get; set; } = true;
        public string Reason { get; set; } = "No supporting evidence has been added, so this section is not included.";
        public string ActionLabel { get; set; } = "Review proof →";
        public string ActionRoute { get; set; } = "/dashboard/creator/phase-3/evidence";
    }

    // =========================================================================
    // ROOT LAUNCH ASSETS ENTITY (Persisted on CreatorJourney.Phase4Data.LaunchAssets)
    // =========================================================================

    [BsonIgnoreExtraElements]
    public class LaunchAssetsPlan
    {
        public string AssetType { get; set; } = "ONE-PAGE WEBSITE";
        public int Version { get; set; } = 1;
        public string Status { get; set; } = "Draft";
        public string ReleaseTag { get; set; } = "v1.0-rc";
        public string PublishedStatus { get; set; } = "Available to view in MBC. Not published.";
        public DateTime LastGeneratedAt { get; set; } = DateTime.UtcNow;
        public string ActiveSectionKey { get; set; } = "hero";

        // Section A: Hero
        public string BrandName { get; set; } = string.Empty;
        public string ConceptBadge { get; set; } = "PREVIEWING CONCEPT";
        public string Headline { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ButtonLabel { get; set; } = "Express interest";
        public string ButtonDestinationType { get; set; } = "NotSet"; // "Email" | "Link" | "NotSet"
        public string ButtonDestinationValue { get; set; } = string.Empty;
        public bool ButtonDestinationConfigured { get; set; } = false;
        public string HeroHelpText { get; set; } = "Help shape the project by sharing how you work today.";

        // Planned Workflow (Hero Sub-container)
        public string PlannedWorkflowTitle { get; set; } = "PLANNED WORKFLOW";
        public string PlannedWorkflowSubtitle { get; set; } = "High-level interface structure";
        public List<LaunchWorkflowStep> WorkflowSteps { get; set; } = new();

        // Section B: Problem
        public string ProblemEyebrow { get; set; } = "KEEP TRACK OF THE NEXT STEP";
        public string ProblemStatement { get; set; } = string.Empty;
        public string OperationalMomentumStatement { get; set; } = string.Empty;

        // Section C: Planned Solution
        public string SolutionHeader { get; set; } = "What’s being planned";
        public string SolutionSubheader { get; set; } = "Straightforward tools designed strictly around routine project administration.";
        public List<LaunchSolutionCard> PlannedSolutions { get; set; } = new();

        // Section D: How It Works
        public string HowItWorksHeader { get; set; } = "A simpler flow for your work";
        public string HowItWorksSubheader { get; set; } = "This describes the planned workflow.";
        public List<LaunchWorkflowDetailedItem> WorkflowDetails { get; set; } = new();

        // Section E: FAQ
        public string FaqHeader { get; set; } = "Frequently Asked Questions";
        public string FaqSubheader { get; set; } = "Honest answers about development status and availability.";
        public List<LaunchFaqItem> Faqs { get; set; } = new();

        // Section F: Final CTA
        public string FinalCtaHeader { get; set; } = "Share how you work today";
        public string FinalCtaSubheader { get; set; } = "Your experience can help shape what this project focuses on.";

        // Section G: Footer
        public string FooterNotice { get; set; } = "Project in preparation";

        // Section Directory & Management
        public List<LaunchAssetSection> Sections { get; set; } = new();
        public LaunchPricingExclusion PricingExclusion { get; set; } = new();
        public LaunchProofExclusion ProofExclusion { get; set; } = new();

        // Lineage & Version Tracking
        public Phase4SourceVersions SourceVersions { get; set; } = new();
    }

    // =========================================================================
    // DTOs (REQUEST / RESPONSE)
    // =========================================================================

    public class LaunchAssetsResponse
    {
        public string IdeaId { get; set; } = string.Empty;
        public long IdeaVersion { get; set; }
        public LaunchAssetsPlan? Assets { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
    }

    public class UpdateLaunchAssetsRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public string? ActiveSectionKey { get; set; }

        // Section A: Hero
        public string? Headline { get; set; }
        public string? Description { get; set; }
        public string? ButtonLabel { get; set; }
        public string? ButtonDestinationType { get; set; }
        public string? ButtonDestinationValue { get; set; }

        // Section B: Problem
        public string? ProblemEyebrow { get; set; }
        public string? ProblemStatement { get; set; }
        public string? OperationalMomentumStatement { get; set; }

        // Section C: Planned Solution
        public string? SolutionHeader { get; set; }
        public string? SolutionSubheader { get; set; }
        public List<LaunchSolutionCard>? PlannedSolutions { get; set; }

        // Section D: How It Works
        public string? HowItWorksHeader { get; set; }
        public string? HowItWorksSubheader { get; set; }
        public List<LaunchWorkflowDetailedItem>? WorkflowDetails { get; set; }

        // Section E: FAQ
        public string? FaqHeader { get; set; }
        public string? FaqSubheader { get; set; }
        public List<LaunchFaqItem>? Faqs { get; set; }

        // Section F: Final CTA
        public string? FinalCtaHeader { get; set; }
        public string? FinalCtaSubheader { get; set; }

        // Section G: Footer
        public string? BrandName { get; set; }
        public string? FooterNotice { get; set; }

        public List<LaunchAssetSection>? Sections { get; set; }
    }

    public class GenerateLaunchAssetsRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }
}
