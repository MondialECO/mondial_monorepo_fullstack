using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public sealed record ClarifierChatTurnResponse(
        List<CreatorChatMessage>? Messages,
        int DoneCount,
        int TotalTopics,
        bool SummaryReady,
        int? CurrentTopic,
        bool AiUsed,
        List<ClarifierAnswer> Answers,
        string AiText,
        List<string>? Chips);

    public interface IClarifierChatTurnRunner
    {
        /// <summary>
        /// One clarifier chat turn: AI-judge every topic from the transcript plus the new message (in
        /// memory), then persist the user message, AI reply, topic records and counters in one versioned
        /// write — nothing is stored before the AI answers. Shared by the
        /// HTTP endpoint and the SignalR hub. Throws <see cref="CreatorJourneyException"/> for client errors.
        /// </summary>
        Task<ClarifierChatTurnResponse> RunAsync(string userId, string? message, string? language, string? ideaId,
            CancellationToken cancellationToken = default);
    }

    public sealed class ClarifierChatTurnRunner : IClarifierChatTurnRunner
    {
        public const int MaxAnswerLength = 4000;

        private readonly ICreatorJourneyService _journeys;
        private readonly IClarifierTurnService _clarifierTurns;

        public ClarifierChatTurnRunner(ICreatorJourneyService journeys, IClarifierTurnService clarifierTurns)
        {
            _journeys = journeys;
            _clarifierTurns = clarifierTurns;
        }

        public async Task<ClarifierChatTurnResponse> RunAsync(string userId, string? message, string? language, string? ideaId,
            CancellationToken cancellationToken = default)
        {
            var text = message?.Trim();
            if (string.IsNullOrWhiteSpace(text))
                throw new CreatorJourneyException(400, "Message is required.");
            if (text.Length > MaxAnswerLength)
                throw new CreatorJourneyException(400, $"Answers are limited to {MaxAnswerLength} characters.");

            var current = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var answers = ClarifierScript.GetAnswers(current.Phase2Data);
            if (ClarifierScript.NextTopic(answers) is not int askedTopic)
                throw new CreatorJourneyException(409, "All clarifier topics are already covered.");

            var transcript = (current.Phase2Data?.ChatMessages ?? new List<CreatorChatMessage>())
                .Select(m => new ClarifierTranscriptLine(m.Sender, m.Text ?? string.Empty))
                .ToList();

            // Language: prefer frontend-provided, then previous answer, default to en
            var lang = !string.IsNullOrWhiteSpace(language)
                ? language
                : (answers.FirstOrDefault(a => a.Language != null)?.Language ?? "en");

            var offTopicStreak = current.Phase2Data?.ClarifierOffTopicStreak ?? 0;
            var offTopicCount = current.Phase2Data?.ClarifierOffTopicCount ?? 0;

            var result = await _clarifierTurns.EvaluateAsync(new ClarifierTopicsInput(
                ClarifierScript.Snapshot(answers),
                transcript,
                text,
                askedTopic,
                answers.Sum(a => a.Attempts) + offTopicCount, // off-topic turns were AI calls too
                lang), cancellationToken);

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, askedTopic, text, result, lang, DateTime.UtcNow,
                offTopicStreak, ClarifierScript.LastQuestionText(current.Phase2Data?.ChatMessages, askedTopic));
            var wasOffTopic = outcome.OffTopicStreak > 0;
            // The user message is persisted only together with its reply: a failed or conflicting
            // write stores nothing, and the client rolls back its optimistic bubble.
            var journey = await _journeys.SaveClarifierTurnAsync(userId, new ClarifierTurnWrite(
                answers,
                new ClarifierTurnMessage("user", text, null, askedTopic),
                new ClarifierTurnMessage("ai", outcome.AiText, outcome.AiKind, outcome.AiTopic, outcome.Chips),
                outcome.OffTopicStreak,
                wasOffTopic ? offTopicCount + 1 : offTopicCount), ideaId);

            return new ClarifierChatTurnResponse(
                Messages: journey.Phase2Data?.ChatMessages,
                DoneCount: answers.Count(a => ClarifierAnswerStatus.IsDone(a.Status)),
                TotalTopics: ClarifierScript.TotalTopics,
                SummaryReady: ClarifierScript.AllAnswered(answers), // client then starts/polls the C-2 session
                CurrentTopic: ClarifierScript.NextTopic(answers),
                AiUsed: result.AiUsed,
                Answers: answers,
                AiText: outcome.AiText,
                Chips: outcome.Chips);
        }
    }
}
