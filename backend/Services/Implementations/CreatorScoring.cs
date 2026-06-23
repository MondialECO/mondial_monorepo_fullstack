namespace WebApp.Services.Implementations
{
    /// <summary>
    /// ONE source for the TAM-driven scoring tiers + unit-economics check, so the
    /// readiness score (Phase 3) and the IP valuation (Phase 5) can never disagree
    /// about TAM (closes audit FG-2). The canonical TAM is the persisted forecast
    /// input (<c>ForecastSession.Inputs.Tam</c>) — a real number the creator entered.
    /// When TAM is null (no forecast yet) every consumer degrades the SAME documented way.
    /// </summary>
    public static class CreatorScoring
    {
        private const double OneBillion = 1_000_000_000d;
        private const double HundredMillion = 100_000_000d;

        /// <summary>IP-valuation market multiplier. null → 1.0 (documented no-forecast fallback).</summary>
        public static double MarketMult(double? tam) =>
            tam == null ? 1.0 : tam > OneBillion ? 1.5 : tam > HundredMillion ? 1.2 : 0.9;

        /// <summary>IP-valuation market-potential sub-score (0–100). null → 40.</summary>
        public static double MarketPotential(double? tam) =>
            tam == null ? 40 : tam > OneBillion ? 90 : tam > HundredMillion ? 70 : 50;

        /// <summary>
        /// Readiness MarketEvidence TAM sub-score (+8 budget), on the SAME tier
        /// thresholds as the IP valuation so the two agree: a strong market (&gt;100M)
        /// scores full, a small TAM scores partial. When TAM is null we fall back to
        /// the marketGap-presence proxy (documented), not a third behavior.
        /// </summary>
        public static double MarketEvidenceTamScore(double? tam, bool marketGapPresent) =>
            tam == null ? (marketGapPresent ? 8 : 0) : tam > HundredMillion ? 8 : tam > 0 ? 4 : 0;

        /// <summary>~3 months of ARPU to acquire a customer (a standard SaaS 3-month CAC
        /// payback). Replaces the old 0.22×ARPU CAC, which was so low that LTV/CAC never
        /// dropped below 3 for any churn ≤ 50% — i.e. the +7 always awarded. With a
        /// realistic CAC, the ≥3 rule actually bites as churn rises.</summary>
        private const double CacMonthsOfArpu = 3.0;

        /// <summary>Documented fallback churn (4%/month) for sessions with no churn input
        /// (older forecasts, or churn not entered) — preserves the prior award rather than
        /// silently scoring 0.</summary>
        private const double FallbackMonthlyChurn = 0.04;

        /// <summary>
        /// Real, churn-driven LTV/CAC health (closes the Tier-1b non-discrimination flaw).
        /// LTV = ARPU / churn (lifetime = 1/churn months), CAC = ARPU × 3 (3-month payback).
        /// The ratio = 1 / (3 × churn) now VARIES with churn and crosses the ≥3 bar at
        /// ~11.1%/month: low-churn creators clear it, high-churn creators don't.
        /// No ARPU (no forecast) → false (sub-score 0, documented — not a break-even proxy).
        /// Churn absent → <see cref="FallbackMonthlyChurn"/> (documented), so legacy sessions
        /// keep their prior result instead of regressing to 0.
        /// </summary>
        public static bool LtvCacHealthy(double? arpu, double? monthlyChurnPct)
        {
            if (!arpu.HasValue || arpu.Value <= 0) return false;

            double churn = monthlyChurnPct.HasValue && monthlyChurnPct.Value > 0
                ? monthlyChurnPct.Value / 100.0   // percent → decimal (e.g. 3 → 0.03)
                : FallbackMonthlyChurn;

            double ltv = arpu.Value / churn;            // lifetime gross revenue per customer
            double cac = arpu.Value * CacMonthsOfArpu;  // realistic acquisition cost
            return cac > 0 && (ltv / cac) >= 3.0;
        }
    }
}
