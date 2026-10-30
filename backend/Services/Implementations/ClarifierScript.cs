using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;

namespace WebApp.Services.Implementations
{
    public sealed record ClarifierTurnOutcome(string AiText, string AiKind, int? AiTopic, List<string>? Chips);

    /// <summary>
    /// One clarifier topic. <see cref="Rule"/> and the examples are the single source for the AI
    /// prompt; the examples must satisfy the rule exactly as written.
    /// </summary>
    public sealed record ClarifierTopicDef(
        int Index, string Key, string[] Fields, string Rule,
        string[] ClearExamples, string[] UnclearExamples,
        string BaseEn, string BaseFr, string FollowUpEn, string FollowUpFr);

    public static class ClarifierTopicState
    {
        public const string Empty = "empty";
        public const string Unclear = "unclear";
        public const string Weak = "weak";
        public const string Clear = "clear";

        public static int Rank(string state) => state switch { Clear => 3, Weak => 2, Unclear => 1, _ => 0 };
    }

    /// <summary>
    /// The open clarifier: one fixed opener, six topics (record index 1–6, unchanged from the
    /// fixed-question era so C-2 and legacy data keep working), base questions and one AI
    /// follow-up per topic. Topic state lives on <see cref="ClarifierAnswer"/>:
    /// no record = empty, Pending = unclear, AcceptedWeak = weak, Accepted = clear.
    /// </summary>
    public static class ClarifierScript
    {
        public const string OpenerEn = "Tell me your idea in your own words. However rough it is is fine.";
        public const string OpenerFr = "Racontez-moi votre idée avec vos propres mots. Même si elle est encore brute, c'est parfait.";

        public const string ClosingEn = "Thanks — that's everything I need. Building your clarified summary now.";
        public const string ClosingFr = "Merci, j'ai tout ce qu'il me faut. Je prépare maintenant votre synthèse clarifiée.";

        public const int MaxFieldLength = 1000;

        public static readonly ClarifierTopicDef[] Topics =
        {
            new(1, "problem", new[] { "problem" },
                "A specific, concrete problem (not a general state such as being hungry or busy), and it is clear why it hurts — either stated or obvious from the problem itself.",
                new[]
                {
                    "Dorm students can't find cheap healthy food.",
                    "Freelance designers wait 60+ days to get paid because chasing invoices by email feels awkward.",
                    "Tall women can't find jeans long enough in regular stores, so they pay for tailoring or settle for a bad fit.",
                },
                new[] { "Students are hungry.", "Freelancers have money problems.", "Clothes don't fit well." },
                "What problem are you fixing?",
                "Quel problème voulez-vous résoudre ?",
                "What problem are you fixing, and what happens to people because of it?",
                "Quel problème résolvez-vous, et que subissent les gens à cause de lui ?"),
            new(2, "who", new[] { "targetUser" },
                "A specific group of people, narrower than a broad category such as \"students\", \"people\" or \"everyone\".",
                new[] { "Dorm students.", "Freelance graphic designers who bill clients monthly.", "Women over 1.78 m who buy jeans online." },
                new[] { "Students.", "Small businesses.", "Everyone who wears clothes." },
                "Who has this problem the most?",
                "Qui rencontre ce problème le plus ?",
                "Which group exactly? The more specific, the better.",
                "Quel groupe précisément ? Plus c'est précis, mieux c'est."),
            new(3, "alternatives", new[] { "existingAlternatives" },
                "At least one real thing they do or use today (a method, product or app) AND the reason it falls short is stated in words. \"Nothing\" counts only when a reason is given.",
                new[]
                {
                    "They order Uber Eats, but it's too expensive on a student budget.",
                    "Spreadsheet reminders — they forget to follow up, and clients ignore plain emails.",
                    "Nothing — tall-specific brands only ship from abroad and returns cost too much.",
                },
                new[] { "Eat junk.", "Excel.", "Other brands." },
                "What do they do about it today?",
                "Que font-ils aujourd'hui pour y faire face ?",
                "What's bad about the way they handle it today?",
                "Qu'est-ce qui ne va pas avec leur façon de faire actuelle ?"),
            new(4, "solution", new[] { "solution" },
                "What the Creator will build AND its form (app, website, service, physical product, or another concrete form).",
                new[]
                {
                    "I want to make a meal-sharing app.",
                    "A web tool that sends polite payment reminders from the freelancer's own email.",
                    "A direct-to-consumer jeans brand sold online, with inseams up to 40 inches.",
                },
                new[] { "Something to help them eat better.", "An app.", "Something for tall women." },
                "What do you want to build?",
                "Que voulez-vous construire ?",
                "How would someone use it? An app, a website, a service?",
                "Comment quelqu'un l'utiliserait-il ? Une application, un site web, un service ?"),
            new(5, "edge", new[] { "creatorEdge", "founderAdvantage" },
                "Something concrete that makes it different from or better than the alternatives, OR a concrete advantage the Creator has (experience, access, skill).",
                new[]
                {
                    "Meals are cooked by students for students, so it's cheaper than delivery.",
                    "I freelanced for eight years and already have 300 designers on my newsletter.",
                    "I'm 1.85 m myself and worked as a pattern maker at a denim factory.",
                },
                new[] { "It's better.", "We really care about freelancers.", "Our quality is great." },
                "Why would people pick yours, and why are you the right person to build it?",
                "Pourquoi choisirait-on votre solution, et pourquoi êtes-vous la bonne personne pour la construire ?",
                "Have you lived this problem, or know people who have?",
                "Avez-vous vécu ce problème, ou connaissez-vous des gens qui l'ont vécu ?"),
            new(6, "whyNowRisk", new[] { "whyNow", "riskiestAssumption" },
                "BOTH parts: (a) a concrete reason the timing is right now AND (b) one specific thing that could go wrong. Missing either part is unclear.",
                new[]
                {
                    "Food prices rose a lot this year; the biggest risk is students not trusting food cooked by strangers.",
                    "Freelancing grew fast since remote work became normal; the biggest risk is clients finding automatic reminders pushy.",
                    "Most jeans are now bought online; the biggest risk is getting the fit right without try-ons.",
                },
                new[] { "Now is a good time.", "Remote work is growing.", "Returns might be expensive." },
                "Why is now a good time? And what's the one thing that could go wrong?",
                "Pourquoi est-ce le bon moment ? Et quelle est la seule chose qui pourrait mal tourner ?",
                "Could you add what's missing: why now is a good time, and the one thing that could go wrong?",
                "Pouvez-vous ajouter ce qui manque : pourquoi c'est le bon moment, et la seule chose qui pourrait mal tourner ?"),
        };

        /// <summary>Order topics are asked in. The opener counts as the problem topic's base question.</summary>
        public static readonly int[] AskOrder = { 1, 2, 4, 3, 5, 6 };

        public static int TotalTopics => Topics.Length;

        public static ClarifierTopicDef Topic(int index) => Topics[index - 1];

        public static ClarifierTopicDef? TopicByKey(string? key) => Topics.FirstOrDefault(t => t.Key == key);

        public static IReadOnlyList<string> FieldsFor(int index) => Topic(index).Fields;

        /// <summary>en or fr for fixed texts: the detected language when it is en/fr, else the UI language.</summary>
        public static string FixedTextLanguage(string? detected, string? uiLanguage) =>
            detected is "en" or "fr" ? detected : uiLanguage == "fr" ? "fr" : "en";

        public static string BaseQuestion(int index, string lang) => lang == "fr" ? Topic(index).BaseFr : Topic(index).BaseEn;

        public static string FallbackFollowUp(int index, string lang) => lang == "fr" ? Topic(index).FollowUpFr : Topic(index).FollowUpEn;

        public static string Closing(string lang) => lang == "fr" ? ClosingFr : ClosingEn;

        public static string StateOf(ClarifierAnswer? a) => a?.Status switch
        {
            null => ClarifierTopicState.Empty,
            ClarifierAnswerStatus.Accepted => ClarifierTopicState.Clear,
            ClarifierAnswerStatus.AcceptedWeak => ClarifierTopicState.Weak,
            _ => ClarifierTopicState.Unclear,
        };

        private static string StatusFor(string state) => state switch
        {
            ClarifierTopicState.Clear => ClarifierAnswerStatus.Accepted,
            ClarifierTopicState.Weak => ClarifierAnswerStatus.AcceptedWeak,
            _ => ClarifierAnswerStatus.Pending,
        };

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
                .Take(TotalTopics)
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

        /// <summary>The topic to ask next: first in <see cref="AskOrder"/> that is empty or unclear; null when all are done.</summary>
        public static int? NextTopic(IReadOnlyCollection<ClarifierAnswer> answers)
        {
            foreach (var index in AskOrder)
            {
                var state = StateOf(answers.FirstOrDefault(a => a.QuestionIndex == index));
                if (state is ClarifierTopicState.Empty or ClarifierTopicState.Unclear)
                    return index;
            }
            return null;
        }

        public static bool AllAnswered(IReadOnlyCollection<ClarifierAnswer> answers) => NextTopic(answers) == null;

        public static List<ClarifierTopicSnapshot> Snapshot(IReadOnlyCollection<ClarifierAnswer> answers) =>
            Topics.Select(t =>
            {
                var a = answers.FirstOrDefault(x => x.QuestionIndex == t.Index);
                return new ClarifierTopicSnapshot(t.Index, StateOf(a), a == null ? new Dictionary<string, string>() : EffectiveFields(a));
            }).ToList();

        /// <summary>
        /// Applies one judged turn (mutating <paramref name="answers"/>) and builds the next AI message.
        /// The asked topic: clear → clear; otherwise unclear, or weak once its one follow-up was used
        /// or when the AI failed. Other topics may only move up (empty/unclear/weak → better); a clear
        /// topic is locked and changes only through Edit.
        /// </summary>
        public static ClarifierTurnOutcome ApplyTopicsTurn(List<ClarifierAnswer> answers, int askedTopic, string text,
            ClarifierTopicsResult result, string? uiLanguage, DateTime now)
        {
            foreach (var def in Topics)
            {
                var answer = answers.FirstOrDefault(a => a.QuestionIndex == def.Index);
                var old = StateOf(answer);
                if (old == ClarifierTopicState.Clear)
                    continue;

                var asked = def.Index == askedTopic;
                var judgement = result.AiUsed && result.Topics.TryGetValue(def.Index, out var j) ? j : null;
                var judged = judgement?.Status ?? ClarifierTopicState.Empty;

                string target;
                if (asked)
                    target = judged == ClarifierTopicState.Clear ? ClarifierTopicState.Clear
                        : !result.AiUsed || answer?.FollowUpUsed == true ? ClarifierTopicState.Weak
                        : ClarifierTopicState.Unclear;
                else if (ClarifierTopicState.Rank(judged) > ClarifierTopicState.Rank(old) && judged != ClarifierTopicState.Weak)
                    target = judged;
                else
                    continue;

                if (answer == null)
                {
                    answer = new ClarifierAnswer { QuestionIndex = def.Index };
                    answers.Add(answer);
                }

                answer.Status = StatusFor(target);
                if (judgement?.Extracted is { Count: > 0 } extracted)
                    answer.AiExtracted = extracted;
                if (asked)
                {
                    answer.Attempts++;
                    answer.RawAnswer = string.IsNullOrEmpty(answer.RawAnswer) ? text : $"{answer.RawAnswer}\n{text}";
                }
                else if (string.IsNullOrEmpty(answer.RawAnswer))
                {
                    answer.RawAnswer = text;
                }
                answer.Language = result.Language ?? answer.Language;
                answer.UpdatedAt = now;
            }
            answers.Sort((a, b) => a.QuestionIndex.CompareTo(b.QuestionIndex));

            var lang = FixedTextLanguage(result.Language, uiLanguage);
            var ack = result.AiUsed ? result.Ack : null;
            var next = NextTopic(answers);
            if (next is not int nextIndex)
                return new(Join(ack, Closing(lang)), "ack", null, null);

            var nextAnswer = answers.FirstOrDefault(a => a.QuestionIndex == nextIndex);
            if (StateOf(nextAnswer) == ClarifierTopicState.Unclear)
            {
                nextAnswer!.FollowUpUsed = true;
                var nj = result.AiUsed && result.Topics.TryGetValue(nextIndex, out var n) ? n : null;
                var question = nj?.FollowUp ?? FallbackFollowUp(nextIndex, lang);
                return new(Join(ack, question), "followup", nextIndex, nj?.Chips is { Count: > 0 } chips ? chips : null);
            }

            var baseQuestion = result.AiUsed && result.NextBaseTopic == nextIndex && result.NextBaseQuestion != null
                ? result.NextBaseQuestion
                : BaseQuestion(nextIndex, lang);
            return new(Join(ack, baseQuestion), "question", nextIndex, null);
        }

        private static string Join(string? ack, string text) => string.IsNullOrWhiteSpace(ack) ? text : $"{ack}\n\n{text}";

        /// <summary>
        /// Re-judged edit of a finished topic. Applied only when the AI judges the new text clear;
        /// otherwise the previous answer stays (an edit is not fail-open). The attempt still counts
        /// toward the AI budget.
        /// </summary>
        public static bool ApplyAnswerEdit(ClarifierAnswer answer, string text, ClarifierTopicsResult result, DateTime now)
        {
            answer.Attempts++;
            if (!result.AiUsed || !result.Topics.TryGetValue(answer.QuestionIndex, out var j) || j.Status != ClarifierTopicState.Clear)
                return false;

            answer.UpdatedAt = now;
            answer.RawAnswer = text;
            answer.AiExtracted = j.Extracted;
            answer.UserEdited = null;
            answer.Language = result.Language ?? answer.Language;
            answer.Status = ClarifierAnswerStatus.Accepted;
            return true;
        }

        /// <summary>Merges direct field edits; an empty value clears that key's edit. Returns an error message or null.</summary>
        public static string? ApplyFieldEdits(ClarifierAnswer answer, IReadOnlyDictionary<string, string?> fields, DateTime now)
        {
            var allowed = FieldsFor(answer.QuestionIndex);
            var unknown = fields.Keys.FirstOrDefault(k => !allowed.Contains(k));
            if (unknown != null)
                return $"Field '{unknown}' does not belong to topic {answer.QuestionIndex}.";

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
                // Topic 6's raw text fills both whyNow and riskiestAssumption.
                foreach (var key in fields)
                    if (answer.QuestionIndex == 6 || key == fields[0])
                        result[key] = answer.RawAnswer.Trim();
            }

            return result;
        }
    }
}
