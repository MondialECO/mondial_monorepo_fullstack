using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;

namespace WebApp.Services.Implementations
{
    public sealed record ClarifierTurnOutcome(string AiText, string AiKind, int? AiTopic, List<string>? Chips);

    /// <summary>One clear and one unclear calibration example from one business domain.</summary>
    public sealed record ClarifierExample(string Domain, string Clear, string Unclear);

    /// <summary>A French calibration example, so the judgment bar does not shift with the language.</summary>
    public sealed record ClarifierFrenchExample(string Text, bool IsClear);

    /// <summary>
    /// One clarifier topic. <see cref="Rule"/> and the examples are the single source for the AI
    /// prompt; every clear example satisfies the rule as written and every unclear one visibly fails it.
    /// Examples span several domains so the AI is never anchored to one idea; they are never chips.
    /// </summary>
    public sealed record ClarifierTopicDef(
        int Index, string Key, string[] Fields, string Rule,
        ClarifierExample[] Examples, ClarifierFrenchExample French,
        string BaseEn, string BaseFr, string FollowUpEn, string FollowUpFr)
    {
        public IEnumerable<string> ClearExamples =>
            Examples.Select(e => e.Clear).Concat(French.IsClear ? new[] { French.Text } : Array.Empty<string>());

        public IEnumerable<string> UnclearExamples =>
            Examples.Select(e => e.Unclear).Concat(French.IsClear ? Array.Empty<string>() : new[] { French.Text });
    }

    /// <summary>Calibration domains (code-only labels; not sent to the AI).</summary>
    public static class ClarifierDomain
    {
        public const string Food = "food-student-app";
        public const string Freelance = "freelancer-b2b-tool";
        public const string Fashion = "tall-women-jeans-brand";
        public const string LocalService = "local-service-tutoring";
        public const string Marketplace = "two-sided-marketplace-textbooks";
        public const string Impact = "impact-clothing-repair";
    }

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

        // The summary only starts when the Creator clicks "Generate my summary" — don't claim it already runs.
        public const string ClosingEn = "Thanks — that's everything I need. You can now generate your summary.";
        public const string ClosingFr = "Merci, j'ai tout ce qu'il me faut. Vous pouvez maintenant générer votre synthèse.";

        public const int MaxFieldLength = 1000;

        public static readonly ClarifierTopicDef[] Topics =
        {
            new(1, "problem", new[] { "problem" },
                "A specific, concrete problem (not a general state such as being hungry or busy), and it is clear why it hurts — either stated or obvious from the problem itself.",
                new ClarifierExample[]
                {
                    new(ClarifierDomain.Food, "Dorm students can't find cheap healthy food.", "Students are hungry."),
                    new(ClarifierDomain.Freelance, "Freelance designers wait 60+ days to get paid because chasing invoices feels awkward.", "Freelancers have money problems."),
                    new(ClarifierDomain.Fashion, "Tall women can't find long-enough jeans in stores, so they pay for tailoring.", "Clothes don't fit well."),
                    new(ClarifierDomain.LocalService, "Parents can't find a maths tutor nearby under €30/hour, so kids fall behind before exams.", "Kids struggle at school."),
                    new(ClarifierDomain.Marketplace, "Students pay €80 for textbooks used one term, while last year's students can't resell theirs.", "Textbooks are a problem."),
                    new(ClarifierDomain.Impact, "People bin clothes with small tears because local repair is rare and expensive.", "Fashion is bad for the planet."),
                },
                new ClarifierFrenchExample("Les étudiants ont du mal.", IsClear: false),
                "What problem are you fixing?",
                "Quel problème voulez-vous résoudre ?",
                "What problem are you fixing, and what happens to people because of it?",
                "Quel problème résolvez-vous, et que subissent les gens à cause de lui ?"),
            new(2, "who", new[] { "targetUser" },
                "A specific group of people, narrower than a broad category such as \"students\", \"people\" or \"everyone\".",
                new ClarifierExample[]
                {
                    new(ClarifierDomain.Food, "Dorm students.", "Students."),
                    new(ClarifierDomain.Freelance, "Freelance graphic designers who bill clients monthly.", "Small businesses."),
                    new(ClarifierDomain.Fashion, "Women over 1.78 m who buy jeans online.", "Everyone who wears clothes."),
                    new(ClarifierDomain.LocalService, "Parents of pupils preparing for the brevet exam.", "Parents."),
                    new(ClarifierDomain.Marketplace, "First-year university students on a tight budget.", "Young people."),
                    new(ClarifierDomain.Impact, "Office workers who own mid-range clothes they want to keep.", "People who care about the planet."),
                },
                new ClarifierFrenchExample("Les artisans indépendants du bâtiment qui facturent à la journée.", IsClear: true),
                "Who has this problem the most?",
                "Qui rencontre ce problème le plus ?",
                "Which group exactly? The more specific, the better.",
                "Quel groupe précisément ? Plus c'est précis, mieux c'est."),
            new(3, "alternatives", new[] { "existingAlternatives" },
                "At least one real thing they do or use today (a method, product or app) AND the reason it falls short is stated in words. \"Nothing\" counts only when a reason is given.",
                new ClarifierExample[]
                {
                    new(ClarifierDomain.Food, "They order Uber Eats, but it's too expensive on a student budget.", "Eat junk."),
                    new(ClarifierDomain.Freelance, "Spreadsheet reminders — they forget to follow up and clients ignore plain emails.", "Excel."),
                    new(ClarifierDomain.Fashion, "Nothing — tall-specific brands ship from abroad and returns cost too much.", "Other brands."),
                    new(ClarifierDomain.LocalService, "Online tutoring, but kids lose focus on video calls.", "Google."),
                    new(ClarifierDomain.Marketplace, "Facebook groups, but listings get buried and nobody knows a fair price.", "Facebook."),
                    new(ClarifierDomain.Impact, "A tailor in town, but a simple fix costs more than a new T-shirt.", "Tailors."),
                },
                new ClarifierFrenchExample("Ils utilisent Vinted, mais les frais de port rendent les petits articles trop chers.", IsClear: true),
                "What do they do about it today?",
                "Que font-ils aujourd'hui pour y faire face ?",
                "What's bad about the way they handle it today?",
                "Qu'est-ce qui ne va pas avec leur façon de faire actuelle ?"),
            new(4, "solution", new[] { "solution" },
                "What the Creator will build AND its form (app, website, service, physical product, or another concrete form).",
                new ClarifierExample[]
                {
                    new(ClarifierDomain.Food, "I want to make a meal-sharing app.", "Something to help them eat better."),
                    new(ClarifierDomain.Freelance, "A web tool that sends polite payment reminders from the freelancer's own email.", "An app."),
                    new(ClarifierDomain.Fashion, "An online jeans brand with inseams up to 40 inches.", "Something for tall women."),
                    new(ClarifierDomain.LocalService, "A service where local university students tutor at the pupil's home.", "Better tutoring."),
                    new(ClarifierDomain.Marketplace, "A campus app where students sell used textbooks to each other.", "A platform."),
                    new(ClarifierDomain.Impact, "Weekly repair pop-up stands in office lobbies.", "Helping people repair."),
                },
                new ClarifierFrenchExample("Une application.", IsClear: false),
                "What do you want to build?",
                "Que voulez-vous construire ?",
                "How would someone use it? An app, a website, a service?",
                "Comment quelqu'un l'utiliserait-il ? Une application, un site web, un service ?"),
            new(5, "edge", new[] { "creatorEdge", "founderAdvantage" },
                "Something concrete that makes it different from or better than the alternatives, OR a concrete advantage the Creator has (experience, access, skill).",
                new ClarifierExample[]
                {
                    new(ClarifierDomain.Food, "Meals are cooked by students for students, so it's cheaper than delivery.", "It's better."),
                    new(ClarifierDomain.Freelance, "I freelanced for eight years and have 300 designers on my newsletter.", "We really care about freelancers."),
                    new(ClarifierDomain.Fashion, "I'm 1.85 m and worked as a pattern maker at a denim factory.", "Our quality is great."),
                    new(ClarifierDomain.LocalService, "Our tutors are ex-pupils of the same schools, so they know the exact curriculum.", "Our tutors are good."),
                    new(ClarifierDomain.Marketplace, "Books are matched by course code, so buyers find the exact edition in seconds.", "It's easier."),
                    new(ClarifierDomain.Impact, "I'm a trained seamstress and two employers already agreed to host stands.", "We're eco-friendly."),
                },
                new ClarifierFrenchExample("J'ai enseigné les maths dix ans et je connais les parents du quartier.", IsClear: true),
                "Why would people pick yours, and why are you the right person to build it?",
                "Pourquoi choisirait-on votre solution, et pourquoi êtes-vous la bonne personne pour la construire ?",
                "Have you lived this problem, or know people who have?",
                "Avez-vous vécu ce problème, ou connaissez-vous des gens qui l'ont vécu ?"),
            new(6, "whyNowRisk", new[] { "whyNow", "riskiestAssumption" },
                "BOTH parts: (a) a concrete reason the timing is right now AND (b) one specific thing that could go wrong. Missing either part is unclear.",
                new ClarifierExample[]
                {
                    new(ClarifierDomain.Food, "Food prices rose this year; the biggest risk is students not trusting food cooked by strangers.", "Now is a good time."),
                    new(ClarifierDomain.Freelance, "Freelancing grew with remote work; the biggest risk is clients finding automatic reminders pushy.", "Remote work is growing."),
                    new(ClarifierDomain.Fashion, "Most jeans are now bought online; the biggest risk is fit without try-ons.", "Returns might be expensive."),
                    new(ClarifierDomain.LocalService, "Maths results dropped after the reform; the biggest risk is finding enough reliable tutors.", "Tutoring is popular right now."),
                    new(ClarifierDomain.Marketplace, "Textbook prices rose 15% this year; the biggest risk is too few sellers in the first term.", "Students might not use it."),
                    new(ClarifierDomain.Impact, "A new EU rule pushes firms to cut textile waste; the biggest risk is staff not bringing clothes in.", "Sustainability is trendy."),
                },
                new ClarifierFrenchExample("C'est le bon moment.", IsClear: false),
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
