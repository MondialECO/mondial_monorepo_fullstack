using MongoDB.Bson;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai
{
    /// <summary>
    /// Aggregates <c>ModelUsage</c> + <c>AICredits</c> for GET /ai/usage and
    /// reads <c>AIInsights</c> for GET /ai/insights. Read-only, owner-scoped.
    /// </summary>
    public sealed class AiUsageService : IAiUsageService
    {
        private readonly AiModelUsageRepository _usage;
        private readonly AiCreditLedgerRepository _credits;
        private readonly AiInsightRepository _insights;

        public AiUsageService(
            AiModelUsageRepository usage,
            AiCreditLedgerRepository credits,
            AiInsightRepository insights)
        {
            _usage = usage;
            _credits = credits;
            _insights = insights;
        }

        public async Task<AiUsageDto> GetUsageAsync(string ownerUserId, string? period = null)
        {
            var entries = await _usage.GetByOwnerAsync(ownerUserId);
            var credit = await _credits.GetByOwnerAsync(ownerUserId);

            var debits = credit?.Debits ?? new List<Models.DatabaseModels.Ai.AiCreditDebit>();
            var refunded = debits.Where(d => d.Refunded).Sum(d => d.Amount);
            var netSpent = debits.Where(d => !d.Refunded).Sum(d => d.Amount);

            var dto = new AiUsageDto
            {
                TotalCalls = entries.Count,
                PromptTokens = entries.Sum(e => (long)e.PromptTokens),
                CompletionTokens = entries.Sum(e => (long)e.CompletionTokens),
                TotalTokens = entries.Sum(e => (long)e.TotalTokens),
                EstimatedCost = entries.Sum(e => e.EstimatedCost),
                CreditBalance = credit?.Balance ?? 0,
                LifetimeGranted = credit?.LifetimeGranted ?? 0,
                LifetimeSpent = credit?.LifetimeSpent ?? 0,
                NetCreditsSpent = netSpent,
                RefundedCredits = refunded,
            };

            // Period evaluation: only populated when period=current is explicitly requested.
            // When period=lifetime or omitted, period fields remain null (omitted from JSON response).
            if (string.Equals(period, "current", StringComparison.OrdinalIgnoreCase))
            {
                var now = DateTime.UtcNow;
                var hasActivePeriod = credit?.PeriodStart != null
                                      && credit?.PeriodEnd != null
                                      && now >= credit.PeriodStart.Value
                                      && now <= credit.PeriodEnd.Value;

                if (hasActivePeriod)
                {
                    dto.PeriodActive = true;
                    dto.PeriodStart = credit!.PeriodStart;
                    dto.PeriodEnd = credit!.PeriodEnd;
                    dto.PeriodCreditsSpent = credit!.PeriodCreditsSpent ?? 0;
                }
                else
                {
                    dto.PeriodActive = false;
                }
            }

            return dto;
        }

        public async Task<List<AiInsightDto>> GetInsightsAsync(string ownerUserId, int skip, int limit)
        {
            var docs = await _insights.GetByOwnerAsync(ownerUserId, skip, limit);
            return docs.Select(d => new AiInsightDto
            {
                Id = d.Id,
                Type = d.Type,
                Payload = d.Payload is null ? null : BsonTypeMapper.MapToDotNetValue(d.Payload),
                SourceRequestId = d.SourceRequestId,
                CreatedAt = d.CreatedAt,
            }).ToList();
        }
    }
}
