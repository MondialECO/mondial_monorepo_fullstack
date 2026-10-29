using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;

namespace WebApp.Services.Implementations
{
    public sealed record ClarifierTurnOutcome(ClarifierAnswer Answer, string AiText, string AiKind, int? AiQuestionIndex);

    /// <summary>
    /// The six clarifier questions, the project fields each one feeds, and the
    /// read-side derivations over <see cref="ClarifierAnswer"/> records.
    /// </summary>
    public static class ClarifierScript
    {
        public static readonly string[] Questions =
        {
            "In one sentence, what problem are you solving?",
            "Who feels this problem most acutely — describe your target user.",
            "How do they cope today? What are the existing alternatives?",
            "What's your proposed solution, in a sentence or two?",
            "What makes your approach different or better, and what relevant experience or advantage do you bring?",
            "Why is this important now, and what's the single riskiest assumption you're making?",
        };

        public static int TotalQuestions => Questions.Length;

        /// <summary>Attempts per question before the answer is accepted as weak.</summary>
        public const int MaxAttempts = 5;

        public const int MaxFieldLength = 1000;

        public const string ClosingMessage = "Thanks — that's everything I need. Building your clarified summary now.";

        // Index 0 = question 1. The first key of each entry receives the raw answer when nothing was extracted.
        private static readonly string[][] FieldsByQuestion =
        {
            new[] { "problem" },
            new[] { "targetUser" },
            new[] { "existingAlternatives" },
            new[] { "solution" },
            new[] { "creatorEdge", "founderAdvantage" },
            new[] { "whyNow", "riskiestAssumption" },
        };

        public static string QuestionText(int questionIndex) => Questions[questionIndex - 1];

        public static IReadOnlyList<string> FieldsFor(int questionIndex) => FieldsByQuestion[questionIndex - 1];

        /// <summary>
        /// Returns the answer records, deriving them for legacy ideas that predate
        /// per-question records: each legacy user message (no QuestionIndex) becomes an accepted answer.
        /// </summary>
        public static List<ClarifierAnswer> GetAnswers(CreatorPhase2Data? p2)
        {
            if (p2?.ClarifierAnswers is { Count: > 0 } existing)
                return existing;

            return (p2?.ChatMessages ?? new List<CreatorChatMessage>())
                .Where(m => m.Sender == "user" && m.QuestionIndex == null)
                .Take(TotalQuestions)
                .Select((m, i) => new ClarifierAnswer
                {
                    QuestionIndex = i + 1,
                    Status = ClarifierAnswerStatus.Accepted,
                    Attempts = 1,
                    RawAnswer = m.Text ?? string.Empty,
                    UpdatedAt = m.Timestamp,
                })
                .ToList();
        }

        /// <summary>1-based index of the first unfinished question, or null when all are done.</summary>
        public static int? CurrentQuestionIndex(IReadOnlyCollection<ClarifierAnswer> answers)
        {
            for (var q = 1; q <= TotalQuestions; q++)
            {
                var a = answers.FirstOrDefault(x => x.QuestionIndex == q);
                if (a == null || !ClarifierAnswerStatus.IsDone(a.Status))
                    return q;
            }
            return null;
        }

        public static bool AllAnswered(IReadOnlyCollection<ClarifierAnswer> answers) =>
            CurrentQuestionIndex(answers) == null;

        /// <summary>Finished answers before <paramref name="questionIndex"/>, as AI context.</summary>
        public static List<PriorClarifierAnswer> PriorAnswers(IEnumerable<ClarifierAnswer> answers, int questionIndex) =>
            answers
                .Where(a => a.QuestionIndex < questionIndex && ClarifierAnswerStatus.IsDone(a.Status))
                .OrderBy(a => a.QuestionIndex)
                .Select(a => new PriorClarifierAnswer(a.QuestionIndex, string.Join(" ", EffectiveFields(a).Values.Distinct())))
                .ToList();

        /// <summary>
        /// Applies one judged turn to the answer list (mutating it) and builds the AI reply.
        /// A revise keeps the same question until <see cref="MaxAttempts"/>, then accepts as weak.
        /// </summary>
        public static ClarifierTurnOutcome ApplyTurn(List<ClarifierAnswer> answers, int questionIndex, string text,
            ClarifierTurnResult turn, DateTime now)
        {
            var answer = answers.FirstOrDefault(a => a.QuestionIndex == questionIndex);
            if (answer == null)
            {
                answer = new ClarifierAnswer { QuestionIndex = questionIndex };
                answers.Add(answer);
                answers.Sort((a, b) => a.QuestionIndex.CompareTo(b.QuestionIndex));
            }

            answer.Attempts++;
            answer.RawAnswer = text;
            answer.AiExtracted = turn.Extracted;
            answer.UserEdited = null;
            answer.Language = turn.Language ?? answer.Language;
            answer.UpdatedAt = now;

            var accepted = turn.Verdict == ClarifierVerdict.Accept;
            answer.Status = accepted ? ClarifierAnswerStatus.Accepted
                : answer.Attempts >= MaxAttempts ? ClarifierAnswerStatus.AcceptedWeak
                : ClarifierAnswerStatus.Pending;

            if (answer.Status == ClarifierAnswerStatus.Pending)
                return new(answer, turn.Feedback ?? QuestionText(questionIndex), "feedback", questionIndex);

            // On a weak accept the AI's feedback is criticism of an answer we're moving past, so drop it.
            var ack = accepted ? turn.Feedback : null;
            if (questionIndex < TotalQuestions)
            {
                var next = turn.NextQuestion ?? QuestionText(questionIndex + 1);
                return new(answer, ack == null ? next : $"{ack}\n\n{next}", "question", questionIndex + 1);
            }
            return new(answer, ack == null ? ClosingMessage : $"{ack}\n\n{ClosingMessage}", "ack", null);
        }

        /// <summary>
        /// Re-judged edit of a finished answer. A revise leaves the previous answer intact
        /// (a finished question never drops back to pending); the attempt still counts toward the AI budget.
        /// Unlike a first answer, an edit is NOT fail-open: the user already has a valid answer, so an
        /// unverifiable edit must not overwrite it.
        /// </summary>
        /// <returns>True when the new text replaced the answer.</returns>
        public static bool ApplyAnswerEdit(ClarifierAnswer answer, string text, ClarifierTurnResult turn, DateTime now)
        {
            answer.Attempts++;
            if (turn.Verdict == ClarifierVerdict.Revise || !turn.AiUsed)
                return false;

            answer.UpdatedAt = now;

            answer.RawAnswer = text;
            answer.AiExtracted = turn.Extracted;
            answer.UserEdited = null;
            answer.Language = turn.Language ?? answer.Language;
            answer.Status = ClarifierAnswerStatus.Accepted;
            return true;
        }

        /// <summary>Merges direct field edits; an empty value clears that key's edit. Returns an error message or null.</summary>
        public static string? ApplyFieldEdits(ClarifierAnswer answer, IReadOnlyDictionary<string, string?> fields, DateTime now)
        {
            var allowed = FieldsFor(answer.QuestionIndex);
            var unknown = fields.Keys.FirstOrDefault(k => !allowed.Contains(k));
            if (unknown != null)
                return $"Field '{unknown}' does not belong to question {answer.QuestionIndex}.";

            var edited = new Dictionary<string, string>(answer.UserEdited ?? new Dictionary<string, string>());
            foreach (var (key, value) in fields)
            {
                var trimmed = value?.Trim();
                if (string.IsNullOrEmpty(trimmed))
                    edited.Remove(key);
                else if (trimmed.Length > MaxFieldLength)
                    return $"Field '{key}' is limited to {MaxFieldLength} characters.";
                else
                    edited[key] = trimmed;
            }

            answer.UserEdited = edited.Count > 0 ? edited : null;
            answer.UpdatedAt = now;
            return null;
        }

        /// <summary>Field values to use downstream: user edit, else AI extraction, else the raw answer.</summary>
        public static Dictionary<string, string> EffectiveFields(ClarifierAnswer answer)
        {
            var result = new Dictionary<string, string>();
            var fields = FieldsFor(answer.QuestionIndex);

            foreach (var key in fields)
            {
                if (answer.UserEdited != null && answer.UserEdited.TryGetValue(key, out var edited) && !string.IsNullOrWhiteSpace(edited))
                    result[key] = edited.Trim();
                else if (answer.AiExtracted.TryGetValue(key, out var extracted) && !string.IsNullOrWhiteSpace(extracted))
                    result[key] = extracted.Trim();
            }

            if (result.Count == 0 && !string.IsNullOrWhiteSpace(answer.RawAnswer))
            {
                // Matches legacy behaviour: question 6's raw text fills both whyNow and riskiestAssumption.
                foreach (var key in fields)
                    if (answer.QuestionIndex == 6 || key == fields[0])
                        result[key] = answer.RawAnswer.Trim();
            }

            return result;
        }
    }
}
