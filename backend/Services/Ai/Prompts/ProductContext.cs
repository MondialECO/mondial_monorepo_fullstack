namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// Single source of the Mondial product-context layer injected into every
    /// AI prompt. Keeps "what Mondial is" out of individual task prompts so the
    /// product framing is consistent and centrally editable.
    /// </summary>
    public static class ProductContext
    {
        public const string Text =
            "Product context — Mondial:\n" +
            "Mondial is a venture-building and fundraising platform that helps founders " +
            "turn an idea into an investable company. It guides entrepreneurs through a " +
            "structured journey (idea clarification, business planning, financial " +
            "forecasting, investor matching and deal execution) and connects them with " +
            "investors and advisors. Your outputs support founders making real funding " +
            "and business decisions, so they must be practical, specific to the user's " +
            "context, and free of generic filler.";
    }
}
