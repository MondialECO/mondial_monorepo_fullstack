using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Write seam over the shared <c>AIInsights</c> store, so AI modules (C-2/3/4)
    /// can persist insights and be unit-tested without a live Mongo connection.
    /// Thin adapter — it does not modify the C-1 <see cref="AiInsightRepository"/>.
    /// </summary>
    public interface IAiInsightWriter
    {
        Task WriteAsync(AiInsight insight);
    }

    public sealed class AiInsightWriter : IAiInsightWriter
    {
        private readonly AiInsightRepository _repository;

        public AiInsightWriter(AiInsightRepository repository) => _repository = repository;

        public Task WriteAsync(AiInsight insight) => _repository.AddAsync(insight);
    }
}
