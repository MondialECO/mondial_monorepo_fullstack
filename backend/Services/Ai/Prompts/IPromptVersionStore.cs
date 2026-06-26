namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// Reads/persists prompt templates in the <c>PromptVersions</c> collection.
    /// Only the ACTIVE version of a key is resolvable for execution. Seeding is
    /// idempotent: an in-code template is inserted (as active) only when its
    /// (key, version) is not already present.
    /// </summary>
    public interface IPromptVersionStore
    {
        /// <summary>The active template for a key, or null if none is active.</summary>
        Task<PromptTemplate?> GetActiveAsync(string key);

        /// <summary>
        /// Idempotently seeds the given in-code templates. Returns the count of
        /// versions newly inserted (0 on a no-op re-run).
        /// </summary>
        Task<int> SeedAsync(IEnumerable<PromptTemplate> templates);
    }
}
