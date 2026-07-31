using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Curated Category → Sub-Category (ServiceType) taxonomy. Static, deterministic lookup keyed by
/// ServiceCategory enum. Used for cascading dropdown UI and server-side validation.
/// The "Other" category permits free-text ServiceType; all others enforce the approved list.
/// Deterministic and testable — swapping this table for a data-backed source is a localized change
/// behind Lookup().
/// </summary>
public static class ServiceTypeLookup
{
    private static readonly Dictionary<ServiceCategory, List<string>> SubCategories = new()
    {
        [ServiceCategory.Development] = new()
        {
            "Web App Development",
            "Mobile App Development",
            "Backend/API Development",
            "DevOps & Infrastructure",
            "QA & Testing",
            "Blockchain/Web3",
            "No-Code/Low-Code Development",
            "Technical Architecture Consulting",
        },
        [ServiceCategory.Design] = new()
        {
            "UI/UX Design",
            "Brand Identity & Logo",
            "Product Design",
            "Marketing/Graphic Assets",
            "Landing Page Design",
            "Design Systems",
            "Illustration & Iconography",
        },
        [ServiceCategory.Marketing] = new()
        {
            "Digital Marketing Strategy",
            "SEO & Content Marketing",
            "Paid Advertising (PPC)",
            "Social Media Marketing",
            "Growth Hacking",
            "Email Marketing & Automation",
            "PR & Communications",
        },
        [ServiceCategory.Legal] = new()
        {
            "Startup Incorporation & Formation",
            "Contract Drafting & Review",
            "IP Protection (Trademarks/Patents)",
            "Employment & HR Law",
            "Fundraising & Securities Law",
            "Terms/Privacy Policy Drafting",
            "Compliance & Regulatory",
        },
        [ServiceCategory.Finance] = new()
        {
            "Financial Modeling & Forecasting",
            "Fundraising Strategy & Pitch Prep",
            "Valuation Services",
            "CFO-as-a-Service",
            "Cap Table Management",
            "Budgeting & Cash Flow",
        },
        [ServiceCategory.Accounting] = new()
        {
            "Bookkeeping",
            "Tax Preparation & Planning",
            "Payroll Management",
            "Financial Statement Preparation",
            "Audit Support",
            "R&D Tax Credits",
        },
        [ServiceCategory.Operations] = new()
        {
            "Process Design & Optimization",
            "Supply Chain & Logistics",
            "Project Management",
            "Vendor Management",
            "Automation/Tooling Setup",
            "Customer Support Setup",
        },
        [ServiceCategory.Strategy] = new()
        {
            "Business Strategy Consulting",
            "Market Research & Analysis",
            "Go-to-Market Strategy",
            "Competitive Analysis",
            "Product Strategy",
            "Pricing Strategy",
        },
        [ServiceCategory.DueDiligence] = new()
        {
            "Financial Due Diligence",
            "Legal Due Diligence",
            "Technical/IP Due Diligence",
            "Market Due Diligence",
            "Operational Due Diligence",
        },
        [ServiceCategory.FundraisingSupport] = new()
        {
            "Pitch Deck Creation",
            "Investor Outreach & Matchmaking",
            "Data Room Preparation",
            "Term Sheet Negotiation Support",
            "Investor Relations",
        },
        [ServiceCategory.AiAutomation] = new()
        {
            "AI Strategy Consulting",
            "Workflow Automation",
            "Chatbot/AI Assistant Development",
            "Data Pipeline & MLOps",
            "AI Model Integration",
        },
        [ServiceCategory.HrRecruitment] = new()
        {
            "Technical Recruiting",
            "Executive Search",
            "HR Policy & Compliance",
            "Onboarding Program Design",
            "Compensation & Benefits Design",
        },
        // Other: no fixed list — free text allowed
    };

    /// <summary>
    /// Get approved Sub-Category options for a given Category.
    /// Returns an empty list for "Other" (which allows free text).
    /// </summary>
    public static List<string> GetSubCategories(ServiceCategory category) =>
        SubCategories.TryGetValue(category, out var subs) ? new List<string>(subs) : new();

    /// <summary>
    /// Validate that the provided ServiceType is approved for the given Category.
    /// Returns true if valid; false otherwise. "Other" category always returns true (free text allowed).
    /// </summary>
    public static bool IsValidServiceType(ServiceCategory category, string? serviceType)
    {
        if (string.IsNullOrWhiteSpace(serviceType))
            return false;

        // Other category allows any non-empty string
        if (category == ServiceCategory.Other)
            return true;

        // All other categories must match an approved value
        return SubCategories.TryGetValue(category, out var approved) && approved.Contains(serviceType);
    }
}
