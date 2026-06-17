using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// <see cref="IPromptVersionStore"/> backed by <see cref="PromptVersionRepository"/>.
    /// Maps between the in-code <see cref="PromptTemplate"/> and the persisted
    /// <see cref="PromptVersion"/> document, and owns idempotent seeding.
    /// </summary>
    public sealed class PromptVersionStore : IPromptVersionStore
    {
        private readonly PromptVersionRepository _repository;
        private readonly ILogger<PromptVersionStore> _logger;

        public PromptVersionStore(PromptVersionRepository repository, ILogger<PromptVersionStore> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<PromptTemplate?> GetActiveAsync(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentException("Prompt key is required.", nameof(key));

            var doc = await _repository.GetActiveAsync(key);
            return doc is null ? null : ToTemplate(doc);
        }

        public async Task<int> SeedAsync(IEnumerable<PromptTemplate> templates)
        {
            ArgumentNullException.ThrowIfNull(templates);

            var seeded = 0;
            foreach (var template in templates)
            {
                // Idempotent: skip if this exact (key, version) is already stored.
                if (await _repository.ExistsAsync(template.Key, template.Version))
                    continue;

                // Ensure a single active version per key (partial-unique index).
                await _repository.DeactivateAllForKeyAsync(template.Key);

                await _repository.AddAsync(new PromptVersion
                {
                    Key = template.Key,
                    Version = template.Version,
                    SystemText = template.SystemText,
                    OutputContract = template.OutputContract,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                });

                seeded++;
                _logger.LogInformation("Seeded prompt template '{Key}' v{Version} (active).",
                    template.Key, template.Version);
            }

            return seeded;
        }

        private static PromptTemplate ToTemplate(PromptVersion doc) => new()
        {
            Key = doc.Key,
            Version = doc.Version,
            SystemText = doc.SystemText,
            OutputContract = doc.OutputContract,
        };
    }
}
