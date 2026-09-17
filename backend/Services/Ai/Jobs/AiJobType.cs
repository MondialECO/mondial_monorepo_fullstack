namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Kinds of AI job. Only <see cref="Probe"/> executes end-to-end in C-1
    /// (health/self-test); the module types are reserved for C-2/3/4, which
    /// register an <c>IAiTaskHandler</c> for their value — no new Hangfire jobs.
    /// </summary>
    public enum AiJobType
    {
        IdeaGenerator,
        IdeaClarifier,
        MarketStudy,
        BusinessModel,
        BusinessPlan,
        Forecast,
        Probe,
        DirectionGeneration,
        LogoParameterSelection,
        /// <summary>
        /// [Legacy/Deprecated] Deterministic SVG operation; now free and executes locally without AI routing.
        /// Retained for historical ledger and request document deserialization.
        /// </summary>
        [System.Obsolete("Deterministic SVG operation. Retained for historical document deserialization.")]
        LogoConceptRegenerate,
        ColorGeneration,
        TypographyGeneration,
    }
}
