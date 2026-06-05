namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Kinds of AI job. Only <see cref="Probe"/> executes end-to-end in C-1
    /// (health/self-test); the module types are reserved for C-2/3/4, which
    /// register an <c>IAiTaskHandler</c> for their value — no new Hangfire jobs.
    /// </summary>
    public enum AiJobType
    {
        IdeaClarifier,
        BusinessPlan,
        Forecast,
        Probe,
    }
}
