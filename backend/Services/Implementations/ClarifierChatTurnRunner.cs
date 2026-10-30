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
        /// One clarifier chat turn: persist the user message, AI-judge every topic from the whole
        /// transcript, persist the topic records + AI reply in one versioned write. Shared by the
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

            await _journeys.AppendChatMessageAsync(userId, "user", text, ideaId, questionIndex: askedTopic);

            // Language: prefer frontend-provided, then previous answer, default to en
            var lang = !string.IsNullOrWhiteSpace(language)
                ? language
                : (answers.FirstOrDefault(a => a.Language != null)?.Language ?? "en");

            var result = await _clarifierTurns.EvaluateAsync(new ClarifierTopicsInput(
                ClarifierScript.Snapshot(answers),
                transcript,
                text,
                askedTopic,
                answers.Sum(a => a.Attempts),
                lang), cancellationToken);

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, askedTopic, text, result, lang, DateTime.UtcNow);
            var journey = await _journeys.SaveClarifierTurnAsync(
                userId, answers, outcome.AiText, outcome.AiKind, outcome.AiTopic, ideaId, outcome.Chips);

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
