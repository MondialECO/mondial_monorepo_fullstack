namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// In-code descriptor for a prompt template. Doubles as the carrier returned
    /// by <c>IPromptVersionStore.GetActiveAsync</c> (mapped from the active
    /// <c>PromptVersions</c> document) so the builder consumes one shape
    /// regardless of source. Module-specific templates (Clarifier / BusinessPlan
    /// / Forecast) are added by C-2/3/4; C-1 ships only the Probe template.
    /// </summary>
    public sealed class PromptTemplate
    {
        public required string Key { get; init; }
        public required int Version { get; init; }
        public required string SystemText { get; init; }
        public string? OutputContract { get; init; }

        /// <summary>
        /// The Probe template — the only task that executes end-to-end in C-1
        /// (health/self-test). Real module prompts arrive with their modules.
        /// </summary>
        public static readonly PromptTemplate Probe = new()
        {
            Key = "probe",
            Version = 1,
            SystemText =
                "You are Mondial's AI self-test probe. Confirm the AI pipeline is " +
                "working by responding succinctly and accurately to the user's task. " +
                "Do not fabricate data; if asked something you cannot verify, say so.",
            OutputContract =
                "Respond in plain text, at most two short sentences. No markdown, no preamble.",
        };

        /// <summary>
        /// C-2 Idea Clarifier (one-shot). Transforms a raw idea into the structured
        /// opportunity contract consumed by C-3 (Business Plan) and C-4 (Forecast).
        /// The <see cref="OutputContract"/> is the locked hand-off shape — its keys
        /// mirror <c>ClarifierOutputDto</c> exactly (<c>schemaVersion = 1</c>).
        /// Safety clauses are injected by the builder via <see cref="SafetyRules"/>,
        /// so they are not restated here.
        /// </summary>
        public static readonly PromptTemplate IdeaClarifier = new()
        {
            Key = "idea-clarifier",
            Version = 1,
            SystemText =
                "You are Mondial's Idea Clarifier. In a single pass, transform a " +
                "founder's raw business idea into a clear, structured opportunity. " +
                "Be specific and concrete: name the real problem, who has it, what " +
                "already exists, how the proposed solution is different, and the " +
                "honest risks. Ground every statement in the idea the user provides " +
                "— do not invent markets, numbers, or competitors. When the input is " +
                "thin, make the missing assumption explicit (in the assumptions list) " +
                "rather than fabricating detail. Judge clarity strictly: a high " +
                "clarity score means the problem, audience, and solution are already " +
                "well defined; a low score means the idea is still vague.",
            OutputContract =
                "Respond with ONE JSON object and nothing else — no markdown, no code " +
                "fences, no commentary before or after. It MUST match this schema " +
                "exactly (camelCase keys, all keys present; arrays may be empty but " +
                "must not be omitted; add no extra keys):\n" +
                "{\n" +
                "  \"schemaVersion\": 1,\n" +
                "  \"problemDefinition\": { \"statement\": string, \"painPoints\": [string], \"severity\": \"low\" | \"medium\" | \"high\" },\n" +
                "  \"targetAudience\": { \"primarySegment\": string, \"characteristics\": [string], \"sizeQualitative\": string },\n" +
                "  \"existingAlternatives\": [ { \"name\": string, \"gap\": string } ],\n" +
                "  \"proposedSolution\": { \"summary\": string, \"differentiation\": string, \"valueProposition\": string },\n" +
                "  \"riskAssessment\": [ { \"category\": string, \"description\": string, \"likelihood\": \"low\" | \"medium\" | \"high\", \"mitigation\": string } ],\n" +
                "  \"assumptions\": [string],\n" +
                "  \"clarityScore\": integer (0-100),\n" +
                "  \"clarityRationale\": string,\n" +
                "  \"tags\": [string]\n" +
                "}\n" +
                "schemaVersion MUST be 1. clarityScore MUST be an integer between 0 " +
                "and 100. severity and likelihood MUST be one of low, medium, or high. " +
                "sizeQualitative is a qualitative reach statement only — never a " +
                "specific market value or revenue figure.",
        };

        /// <summary>
        /// C-3 Business Plan (one-shot, single structured JSON completion). Turns the
        /// clarified opportunity (the authoritative input — see locked C-3 decision #2)
        /// into the seven-section BusinessPlanOutput contract. The
        /// <see cref="OutputContract"/> keys mirror <c>BusinessPlanOutputDto</c> exactly
        /// (<c>schemaVersion = 1</c>) and deliberately exclude any funding ask (locked
        /// C-3 decision #1). Safety clauses are injected by the builder via
        /// <see cref="SafetyRules"/>, so they are not restated here.
        /// </summary>
        public static readonly PromptTemplate BusinessPlan = new()
        {
            Key = "business-plan",
            Version = 1,
            SystemText =
                "You are Mondial's Business Plan Architect. In a single pass, turn a " +
                "clarified business opportunity into a concrete, investor-readable " +
                "business plan. Ground every section strictly in the clarified " +
                "opportunity you are given — it is the authoritative source. You may " +
                "use the founder's original submission only as secondary context to " +
                "fill gaps; never contradict the clarified opportunity. Be specific " +
                "and realistic: name real segments, channels, competitors and risks " +
                "implied by the input. Do NOT invent precise market sizes, revenue " +
                "figures, valuations, or a funding ask — keep sizing and economics " +
                "qualitative. When the input is thin, state the assumption plainly " +
                "rather than fabricating numbers.",
            OutputContract =
                "Respond with ONE JSON object and nothing else — no markdown, no code " +
                "fences, no commentary before or after. It MUST match this schema " +
                "exactly (camelCase keys, all keys present; arrays may be empty but " +
                "must not be omitted; add no extra keys; do NOT add any funding ask):\n" +
                "{\n" +
                "  \"schemaVersion\": 1,\n" +
                "  \"executiveSummary\": { \"overview\": string, \"valueProposition\": string, \"highlights\": [string] },\n" +
                "  \"marketAnalysis\": { \"overview\": string, \"targetSegments\": [string], \"marketSizeQualitative\": string, \"trends\": [string] },\n" +
                "  \"competitorAnalysis\": { \"overview\": string, \"competitors\": [ { \"name\": string, \"positioning\": string, \"strengths\": [string], \"weaknesses\": [string], \"ourAdvantage\": string } ] },\n" +
                "  \"revenueModel\": { \"summary\": string, \"revenueStreams\": [ { \"name\": string, \"description\": string } ], \"pricingStrategy\": string, \"keyMetrics\": [string] },\n" +
                "  \"goToMarket\": { \"strategy\": string, \"channels\": [string], \"phases\": [ { \"name\": string, \"description\": string } ] },\n" +
                "  \"operationsPlan\": { \"overview\": string, \"keyActivities\": [string], \"resources\": [string], \"milestones\": [ { \"title\": string, \"description\": string, \"timeframe\": string } ] },\n" +
                "  \"risks\": [ { \"category\": string, \"description\": string, \"likelihood\": \"low\" | \"medium\" | \"high\", \"impact\": \"low\" | \"medium\" | \"high\", \"mitigation\": string } ]\n" +
                "}\n" +
                "schemaVersion MUST be 1. likelihood and impact MUST each be one of " +
                "low, medium, or high. marketSizeQualitative is a qualitative reach " +
                "statement only — never a specific market value or revenue figure. Do " +
                "not include any funding ask, funding amount, or valuation request " +
                "field of any kind.",
        };

        /// <summary>
        /// C-4 Forecast (one-shot, single structured JSON completion). Projects the
        /// clarified opportunity / business plan into a fixed 12-month financial
        /// outlook: revenue, cost, cash-flow, and break-even. The forecast horizon is
        /// locked to 12 monthly periods — no custom horizon and no yearly roll-up. The
        /// <see cref="OutputContract"/> keys are the locked seven-field hand-off shape
        /// (<c>schemaVersion = 1</c>) and deliberately exclude any funding ask. The
        /// <c>advisoryNotice</c> field carries the human-readable estimate disclaimer
        /// that aligns with <see cref="SafetyRules"/>; safety clauses themselves are
        /// injected by the builder, so they are not restated in the system text.
        /// </summary>
        public static readonly PromptTemplate Forecast = new()
        {
            Key = "forecast",
            Version = 1,
            SystemText =
                "You are Mondial's Financial Forecast Analyst. In a single pass, turn a " +
                "clarified business opportunity and its business plan into a grounded " +
                "12-month financial forecast. Project exactly 12 consecutive monthly " +
                "periods (month 1 through month 12) — never a custom horizon and never " +
                "a yearly forecast. Ground every figure in the input and in the " +
                "assumptions you state; when the input is thin, make the driving " +
                "assumption explicit rather than fabricating precision. Present all " +
                "numbers as planning estimates, not guarantees. Do NOT include any " +
                "funding ask, capital request, or valuation of any kind.",
            OutputContract =
                "Respond with ONE JSON object and nothing else — no markdown, no code " +
                "fences, no commentary before or after. It MUST match this schema " +
                "exactly (camelCase keys, all keys present; arrays may be empty but " +
                "must not be omitted; add no extra keys; do NOT add any funding ask):\n" +
                "{\n" +
                "  \"schemaVersion\": 1,\n" +
                "  \"revenueForecast\": { \"currency\": string, \"summary\": string, \"monthly\": [ { \"month\": integer (1-12), \"amount\": number, \"notes\": string } ] },\n" +
                "  \"costForecast\": { \"currency\": string, \"summary\": string, \"monthly\": [ { \"month\": integer (1-12), \"fixedCosts\": number, \"variableCosts\": number, \"notes\": string } ] },\n" +
                "  \"cashFlowProjection\": { \"currency\": string, \"summary\": string, \"monthly\": [ { \"month\": integer (1-12), \"netCashFlow\": number, \"endingBalance\": number, \"notes\": string } ] },\n" +
                "  \"breakEvenAnalysis\": { \"breakEvenMonth\": integer (1-12) | null, \"summary\": string, \"isAchievedWithinHorizon\": boolean },\n" +
                "  \"assumptions\": [string],\n" +
                "  \"risks\": [ { \"category\": string, \"description\": string, \"likelihood\": \"low\" | \"medium\" | \"high\", \"impact\": \"low\" | \"medium\" | \"high\", \"mitigation\": string } ],\n" +
                "  \"advisoryNotice\": string\n" +
                "}\n" +
                "schemaVersion MUST be 1. Each monthly array MUST contain exactly 12 " +
                "entries, one per month, with month values 1 through 12 in order. " +
                "breakEvenMonth MUST be an integer 1-12 when break-even is reached " +
                "within the horizon, otherwise null with isAchievedWithinHorizon false. " +
                "likelihood and impact MUST each be one of low, medium, or high. " +
                "advisoryNotice MUST state plainly that these figures are planning " +
                "estimates, not guarantees of financial outcomes, and that qualified " +
                "professional advice is recommended. Do not include any funding ask, " +
                "capital request, or valuation field of any kind.",
        };

        /// <summary>All in-code templates seeded into <c>PromptVersions</c> on startup.</summary>
        public static readonly IReadOnlyList<PromptTemplate> All = new[] { Probe, IdeaClarifier, BusinessPlan, Forecast };
    }
}
