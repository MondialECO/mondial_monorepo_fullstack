using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;

namespace WebApp.Services.Ai.Providers
{
    /// <summary>
    /// Reads the <c>Ai:ModelRouting</c> configuration (task-type → model id) and
    /// resolves a model per request, falling back to the configured default.
    /// </summary>
    public sealed class ModelRouter : IModelRouter
    {
        private readonly ModelRoutingSettings _routing;
        private readonly ILogger<ModelRouter> _logger;

        public ModelRouter(IOptions<AiSettings> aiSettings, ILogger<ModelRouter> logger)
        {
            _routing = aiSettings.Value.ModelRouting ?? new ModelRoutingSettings();
            _logger = logger;
        }

        public string Resolve(string taskType)
        {
            if (string.IsNullOrWhiteSpace(taskType))
                throw new ArgumentException("Task type must be provided.", nameof(taskType));

            if (_routing.Models is { } map && map.TryGetValue(taskType, out var model) && !string.IsNullOrWhiteSpace(model))
                return model;

            if (!string.IsNullOrWhiteSpace(_routing.DefaultModel))
            {
                _logger.LogDebug("No explicit model route for task '{TaskType}'; using default '{Default}'.",
                    taskType, _routing.DefaultModel);
                return _routing.DefaultModel;
            }

            throw new InvalidOperationException(
                $"No model route configured for task type '{taskType}' and no default model is set.");
        }
    }
}
