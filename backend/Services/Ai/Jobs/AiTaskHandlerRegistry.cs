namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Resolves the <see cref="IAiTaskHandler"/> registered for an
    /// <see cref="AiJobType"/>. Handlers self-register in DI; this builds the
    /// type→handler map and throws on duplicate or missing registration.
    /// </summary>
    public sealed class AiTaskHandlerRegistry
    {
        private readonly IReadOnlyDictionary<AiJobType, IAiTaskHandler> _handlers;

        public AiTaskHandlerRegistry(IEnumerable<IAiTaskHandler> handlers)
        {
            var map = new Dictionary<AiJobType, IAiTaskHandler>();
            foreach (var handler in handlers)
            {
                if (map.ContainsKey(handler.Type))
                    throw new InvalidOperationException(
                        $"Duplicate IAiTaskHandler registered for job type '{handler.Type}'.");
                map[handler.Type] = handler;
            }
            _handlers = map;
        }

        public IAiTaskHandler Resolve(AiJobType type)
        {
            if (_handlers.TryGetValue(type, out var handler))
                return handler;

            throw new InvalidOperationException(
                $"No IAiTaskHandler registered for job type '{type}'. " +
                "The owning module must register its handler in AddAiServices.");
        }

        public bool IsSupported(AiJobType type) => _handlers.ContainsKey(type);
    }
}
