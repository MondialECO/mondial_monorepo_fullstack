using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public sealed record ClarifierChatTurnResponse(
        List<CreatorChatMessage>? Messages,
        int QuestionIndex,
        int TotalQuestions,
        bool SummaryReady,
        string Verdict,
        int? CurrentQuestion,
        int Attempts,
        int MaxAttempts,
        bool AiUsed,
        List<ClarifierAnswer> Answers,
        string AiText);

    public interface IClarifierChatTurnRunner
    {
        /// <summary>
        /// One clarifier chat turn: persist the user message, AI-judge the answer, persist the
        /// answer records + AI reply. Shared by the HTTP endpoint and the SignalR hub.
        /// Throws <see cref="CreatorJourneyException"/> for client errors.
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
            if (ClarifierScript.CurrentQuestionIndex(answers) is not int questionIndex)
                throw new CreatorJourneyException(409, "All clarifier questions are already answered.");

            await _journeys.AppendChatMessageAsync(userId, "user", text, ideaId, questionIndex: questionIndex);

            // Language: prefer frontend-provided, then previous answer, default to en
            var lang = !string.IsNullOrWhiteSpace(language)
                ? language
                : (answers.FirstOrDefault(a => a.Language != null)?.Language ?? "en");

            var turn = await _clarifierTurns.EvaluateAsync(new ClarifierTurnInput(
                questionIndex,
                text,
                ClarifierScript.PriorAnswers(answers, questionIndex),
                answers.Sum(a => a.Attempts),
                lang), cancellationToken);

            var outcome = ClarifierScript.ApplyTurn(answers, questionIndex, text, turn, DateTime.UtcNow);
            var journey = await _journeys.SaveClarifierTurnAsync(
                userId, answers, outcome.AiText, outcome.AiKind, outcome.AiQuestionIndex, ideaId);

            var revise = outcome.Answer.Status == ClarifierAnswerStatus.Pending;
            return new ClarifierChatTurnResponse(
                Messages: journey.Phase2Data?.ChatMessages,
                QuestionIndex: answers.Count(a => ClarifierAnswerStatus.IsDone(a.Status)),
                TotalQuestions: ClarifierScript.TotalQuestions,
                SummaryReady: ClarifierScript.AllAnswered(answers), // client then starts/polls the C-2 session
                Verdict: revise ? ClarifierVerdict.Revise : ClarifierVerdict.Accept,
                CurrentQuestion: ClarifierScript.CurrentQuestionIndex(answers),
                Attempts: outcome.Answer.Attempts,
                MaxAttempts: ClarifierScript.MaxAttempts,
                AiUsed: turn.AiUsed,
                Answers: answers,
                AiText: outcome.AiText);
        }
    }
}
