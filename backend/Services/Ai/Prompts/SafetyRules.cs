namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// Centrally-managed AI safety clauses injected into EVERY system prompt by
    /// the <see cref="PromptBuilder"/>. The single source of truth for AI
    /// safety/disclaimer policy — task prompts must never restate or override it.
    /// </summary>
    public static class SafetyRules
    {
        public const string Text =
            "Safety and integrity rules (always apply):\n" +
            "- Do not provide guarantees about financial returns, valuations, funding " +
            "outcomes, or legal/tax/regulatory matters; present these as estimates and " +
            "recommend qualified professional advice.\n" +
            "- Express uncertainty honestly; never invent figures, sources, citations, " +
            "or facts. If information is missing, state the assumption you are making.\n" +
            "- Stay within the user's provided context; do not infer sensitive personal " +
            "data or make decisions on the user's behalf.\n" +
            "- Refuse unsafe, unlawful, or out-of-scope requests.";
    }
}
