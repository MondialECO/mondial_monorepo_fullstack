namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Request body for <c>POST /api/ai/forecast</c>. The forecast requires an active
    /// business plan (ForecastController.Start enforces via 422 guards:
    /// business_plan_required, business_plan_not_found, business_plan_not_complete).
    /// It uses the plan's context as the authoritative generation input alongside
    /// numeric inputs (ARPU / OPEX / monthly growth / TAM / churn). The horizon is
    /// fixed at 12 months — there is intentionally no horizon parameter.
    /// </summary>
    public class StartForecastRequest
    {
        /// <summary>Required business-plan session (enforced at Start by 422 guards).</summary>
        public string? BusinessPlanSessionId { get; set; }

        /// <summary>Optional source business idea, used only as secondary context.</summary>
        public string? BusinessIdeaId { get; set; }

        // ---- Standalone forecast inputs ----
        public double? Arpu { get; set; }
        public double? Opex { get; set; }
        public double? MonthlyGrowthPct { get; set; }
        public double? Tam { get; set; }

        /// <summary>Monthly churn as a percent (e.g. 3 = 3%/month). Drives LTV/CAC.</summary>
        public double? MonthlyChurnPct { get; set; }
    }
}
