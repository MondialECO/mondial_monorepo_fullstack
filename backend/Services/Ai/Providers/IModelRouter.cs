namespace WebApp.Services.Ai.Providers
{
    /// <summary>
    /// Resolves an OpenRouter model id from a task type (e.g. "Probe",
    /// "IdeaClarifier"). Backed by the configured <c>Ai:ModelRouting</c> map.
    /// </summary>
    public interface IModelRouter
    {
        /// <summary>
        /// Returns the model id mapped to <paramref name="taskType"/>, or the
        /// configured default when there is no explicit route. Throws when the
        /// task type is unknown AND no default model is configured.
        /// </summary>
        string Resolve(string taskType);
    }
}
