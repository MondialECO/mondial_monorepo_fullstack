using FluentAssertions;
using System;
using System.Collections.Generic;
using System.Linq;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class ClarifierScriptTests
    {
        private static readonly DateTime Now = new(2026, 10, 31, 0, 0, 0, DateTimeKind.Utc);

        private static CreatorChatMessage Msg(string sender, string text) =>
            new() { Id = Guid.NewGuid().ToString(), Sender = sender, Text = text };

        private static ClarifierTopicJudgement J(string status, Dictionary<string, string>? extracted = null,
            string? followUp = null, params string[] chips) =>
            new() { Status = status, Extracted = extracted ?? new(), FollowUp = followUp, Chips = chips.ToList() };

        private static ClarifierTopicsResult Ai(Dictionary<int, ClarifierTopicJudgement> topics, string? ack = null,
            int? nextBaseTopic = null, string? nextBase = null, string lang = "en") =>
            new() { Topics = topics, Ack = ack, NextBaseTopic = nextBaseTopic, NextBaseQuestion = nextBase, Language = lang, AiUsed = true };

        private static ClarifierAnswer Rec(int index, string status, bool followUpUsed = false, string raw = "") =>
            new() { QuestionIndex = index, Status = status, FollowUpUsed = followUpUsed, RawAnswer = raw };

        private static string State(List<ClarifierAnswer> answers, int index) =>
            ClarifierScript.StateOf(answers.FirstOrDefault(a => a.QuestionIndex == index));

        // ---- definitions ----

        [Fact]
        public void Topics_AreCompleteAndAskOrderIsAPermutation()
        {
            ClarifierScript.Topics.Select(t => t.Index).Should().Equal(1, 2, 3, 4, 5, 6);
            ClarifierScript.AskOrder.Should().BeEquivalentTo(new[] { 1, 2, 3, 4, 5, 6 });
            ClarifierScript.AskOrder.Should().Equal(1, 2, 4, 3, 5, 6);
            foreach (var t in ClarifierScript.Topics)
            {
                t.Fields.Should().NotBeEmpty();
                // One clear + one unclear example from each of >= 6 business domains, so the AI isn't anchored to one idea.
                t.Examples.Select(e => e.Domain).Distinct().Should().HaveCountGreaterThanOrEqualTo(6, $"{t.Key} needs examples from 6 domains");
                t.Examples.Should().OnlyContain(e => !string.IsNullOrWhiteSpace(e.Clear) && !string.IsNullOrWhiteSpace(e.Unclear),
                    $"{t.Key}: every domain needs both a clear and an unclear example");
                // A French example keeps the judgment bar the same across languages.
                t.French.Text.Should().NotBeNullOrWhiteSpace($"{t.Key} needs a French example");
                new[] { t.Rule, t.BaseEn, t.BaseFr, t.FollowUpEn, t.FollowUpFr }.Should().OnlyContain(s => !string.IsNullOrWhiteSpace(s));
            }
        }

        [Fact]
        public void SolutionRule_TreatsTheMealSharingAppExampleAsClear()
        {
            var solution = ClarifierScript.Topic(4);
            solution.ClearExamples.Should().Contain("I want to make a meal-sharing app.");
            solution.Rule.Should().Contain("form");
        }

        [Fact]
        public void FixedTextLanguage_UsesDetectedEnFrElseUiLanguage()
        {
            ClarifierScript.FixedTextLanguage("fr", "en").Should().Be("fr");
            ClarifierScript.FixedTextLanguage("bn", "fr").Should().Be("fr");
            ClarifierScript.FixedTextLanguage(null, null).Should().Be("en");
        }

        // ---- legacy + ordering ----

        [Fact]
        public void GetAnswers_LegacyIdea_DerivesAcceptedAnswersFromUserMessages()
        {
            var p2 = new CreatorPhase2Data
            {
                ChatMessages = new List<CreatorChatMessage> { Msg("ai", "q1"), Msg("user", "a1"), Msg("ai", "q2"), Msg("user", "a2") },
            };

            var answers = ClarifierScript.GetAnswers(p2);

            answers.Select(a => (a.QuestionIndex, a.RawAnswer, a.Status)).Should().Equal(
                (1, "a1", ClarifierAnswerStatus.Accepted),
                (2, "a2", ClarifierAnswerStatus.Accepted));
            ClarifierScript.NextTopic(answers).Should().Be(4, "solution is asked before alternatives");
        }

        [Fact]
        public void GetAnswers_IgnoresNewFlowUserMessagesWithoutRecords()
        {
            var p2 = new CreatorPhase2Data
            {
                ChatMessages = new List<CreatorChatMessage> { new() { Id = "m1", Sender = "user", Text = "an app", QuestionIndex = 1 } },
            };

            ClarifierScript.GetAnswers(p2).Should().BeEmpty();
        }

        [Fact]
        public void NextTopic_OpenerIsProblem_WeakAndClearAreDone()
        {
            ClarifierScript.NextTopic(new List<ClarifierAnswer>()).Should().Be(1);

            var answers = new List<ClarifierAnswer>
            {
                Rec(1, ClarifierAnswerStatus.Accepted), Rec(2, ClarifierAnswerStatus.AcceptedWeak), Rec(4, ClarifierAnswerStatus.Pending),
            };
            ClarifierScript.NextTopic(answers).Should().Be(4);

            var done = Enumerable.Range(1, 6).Select(i => Rec(i, i == 3 ? ClarifierAnswerStatus.AcceptedWeak : ClarifierAnswerStatus.Accepted)).ToList();
            ClarifierScript.AllAnswered(done).Should().BeTrue();
        }

        // ---- turns ----

        [Fact]
        public void Opener_CoveringThreeTopics_ClearsThemAndAsksAlternativesBase()
        {
            var answers = new List<ClarifierAnswer>();
            var result = Ai(new()
            {
                [1] = J("clear", new() { ["problem"] = "No cheap healthy food." }),
                [2] = J("clear", new() { ["targetUser"] = "Dorm students." }),
                [4] = J("clear", new() { ["solution"] = "A meal-sharing app." }),
            }, ack: "Love it.", nextBaseTopic: 3, nextBase: "What do they do about it today?");

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "Dorm students can't find cheap healthy food, I want to make a meal-sharing app.", result, "en", Now);

            new[] { 1, 2, 4 }.Select(i => State(answers, i)).Should().OnlyContain(s => s == ClarifierTopicState.Clear);
            answers.Single(a => a.QuestionIndex == 1).Attempts.Should().Be(1, "only the asked topic counts an attempt");
            answers.Single(a => a.QuestionIndex == 2).Attempts.Should().Be(0);
            answers.Single(a => a.QuestionIndex == 2).RawAnswer.Should().StartWith("Dorm students");
            outcome.Should().BeEquivalentTo(new { AiText = "Love it.\n\nWhat do they do about it today?", AiKind = "question", AiTopic = (int?)3 });
        }

        [Fact]
        public void Opener_WithoutProblem_MarksProblemUnclearAndUsesItsOneFollowUp()
        {
            var answers = new List<ClarifierAnswer>();
            var result = Ai(new() { [4] = J("clear", new() { ["solution"] = "A food app." }) });

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "A food app.", result, "en", Now);

            var problem = answers.Single(a => a.QuestionIndex == 1);
            ClarifierScript.StateOf(problem).Should().Be(ClarifierTopicState.Unclear);
            problem.FollowUpUsed.Should().BeTrue();
            outcome.AiKind.Should().Be("followup");
            outcome.AiTopic.Should().Be(1);
            outcome.AiText.Should().Be(ClarifierScript.FallbackFollowUp(1, "en"), "problem never gets a separate base question");
            outcome.Chips.Should().BeNull("chips only ever come from the AI; there are no fallback chips");
        }

        [Fact]
        public void AiFailure_FollowUp_HasNoChips()
        {
            var answers = new List<ClarifierAnswer> { Rec(1, ClarifierAnswerStatus.Accepted), Rec(2, ClarifierAnswerStatus.Pending) };

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 4, "x", ClarifierTopicsResult.FailOpen(), "en", Now);

            outcome.AiTopic.Should().Be(2);
            outcome.AiKind.Should().Be("followup");
            outcome.Chips.Should().BeNull();
        }

        [Fact]
        public void AskedTopicUnclear_FirstTime_AsksAiFollowUpWithChips()
        {
            var answers = new List<ClarifierAnswer> { Rec(1, ClarifierAnswerStatus.Accepted) };
            var result = Ai(new() { [2] = J("unclear", followUp: "Which students exactly?", chips: new[] { "dorm students", "part-time workers" }) });

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 2, "students", result, "en", Now);

            State(answers, 2).Should().Be(ClarifierTopicState.Unclear);
            outcome.Should().BeEquivalentTo(new
            {
                AiText = "Which students exactly?", AiKind = "followup", AiTopic = (int?)2,
                Chips = new List<string> { "dorm students", "part-time workers" },
            });
        }

        [Fact]
        public void AskedTopicStillUnclear_AfterFollowUp_BecomesWeakAndMovesOn()
        {
            var answers = new List<ClarifierAnswer> { Rec(1, ClarifierAnswerStatus.Accepted), Rec(2, ClarifierAnswerStatus.Pending, followUpUsed: true, raw: "students") };
            var result = Ai(new() { [2] = J("unclear", followUp: "Which ones?") });

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 2, "young ones", result, "en", Now);

            var who = answers.Single(a => a.QuestionIndex == 2);
            ClarifierScript.StateOf(who).Should().Be(ClarifierTopicState.Weak);
            who.RawAnswer.Should().Be("students\nyoung ones");
            outcome.AiTopic.Should().Be(4);
            outcome.AiText.Should().Be(ClarifierScript.BaseQuestion(4, "en"));
        }

        [Fact]
        public void AiFailure_AskedTopicGoesWeak_AndNextBaseIsInUiLanguage()
        {
            var answers = new List<ClarifierAnswer>();

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "mon idée", ClarifierTopicsResult.FailOpen(), "fr", Now);

            var problem = answers.Single();
            ClarifierScript.StateOf(problem).Should().Be(ClarifierTopicState.Weak);
            problem.RawAnswer.Should().Be("mon idée");
            outcome.AiText.Should().Be(ClarifierScript.BaseQuestion(2, "fr"));
            outcome.AiKind.Should().Be("question");
        }

        [Fact]
        public void OtherTopics_OnlyMoveUp_WeakCanBecomeClear_ClearIsLocked()
        {
            var answers = new List<ClarifierAnswer>
            {
                Rec(1, ClarifierAnswerStatus.Accepted, raw: "locked"),
                Rec(2, ClarifierAnswerStatus.AcceptedWeak, raw: "students"),
                Rec(3, ClarifierAnswerStatus.AcceptedWeak, raw: "junk"),
                Rec(4, ClarifierAnswerStatus.Pending, raw: "an app"),
            };
            var result = Ai(new()
            {
                [1] = J("unclear"),
                [2] = J("clear", new() { ["targetUser"] = "Dorm students." }),
                [3] = J("unclear"),
                [4] = J("empty"),
                [5] = J("clear", new() { ["creatorEdge"] = "Cooked by students." }),
            });

            ClarifierScript.ApplyTopicsTurn(answers, 4, "dorm students, a meal app", result, "en", Now);

            State(answers, 1).Should().Be(ClarifierTopicState.Clear);
            answers.Single(a => a.QuestionIndex == 1).RawAnswer.Should().Be("locked");
            State(answers, 2).Should().Be(ClarifierTopicState.Clear, "a weak topic can recover");
            State(answers, 3).Should().Be(ClarifierTopicState.Weak, "weak is never downgraded");
            State(answers, 5).Should().Be(ClarifierTopicState.Clear);
        }

        [Fact]
        public void LastTopicCleared_SendsClosingInDetectedLanguage()
        {
            var answers = Enumerable.Range(1, 5).Select(i => Rec(i, ClarifierAnswerStatus.Accepted)).ToList();
            var result = Ai(new() { [6] = J("clear", new() { ["whyNow"] = "Prices rose.", ["riskiestAssumption"] = "Trust." }) }, ack: "Parfait.", lang: "fr");

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 6, "Les prix montent ; le risque est la confiance.", result, "en", Now);

            outcome.Should().BeEquivalentTo(new { AiText = $"Parfait.\n\n{ClarifierScript.ClosingFr}", AiKind = "ack", AiTopic = (int?)null });
            ClarifierScript.AllAnswered(answers).Should().BeTrue();
        }

        [Fact]
        public void NextBaseFromAi_IgnoredWhenItIsForAnotherTopic()
        {
            var answers = new List<ClarifierAnswer>();
            var result = Ai(new() { [1] = J("clear", new() { ["problem"] = "A real problem." }) }, nextBaseTopic: 5, nextBase: "wrong topic");

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "x", result, "en", Now);

            outcome.AiText.Should().Be(ClarifierScript.BaseQuestion(2, "en"));
        }

        // ---- off-topic / unreadable ----

        private static ClarifierTopicsResult OffTopic(string relevance = ClarifierRelevance.OffTopic, string? nudge = "Ha, hello! Back to your idea.",
            string? simple = null, string lang = "en", params string[] chips) =>
            new() { AiUsed = true, Relevance = relevance, Nudge = nudge, SimpleQuestion = simple, SimpleChips = chips.ToList(), Language = lang };

        [Fact]
        public void OffTopic_ChangesNoTopic_KeepsTheFollowUp_StoresNothing_AndReasksTheSameQuestion()
        {
            var unclear = Rec(2, ClarifierAnswerStatus.Pending, raw: "students");
            unclear.Attempts = 1;
            var answers = new List<ClarifierAnswer> { Rec(1, ClarifierAnswerStatus.Accepted), unclear };

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 2, "hi", OffTopic(), "en", Now,
                offTopicStreak: 0, sameQuestion: "Which students exactly?");

            answers.Should().HaveCount(2);
            unclear.Should().BeEquivalentTo(new { Status = ClarifierAnswerStatus.Pending, Attempts = 1, RawAnswer = "students", FollowUpUsed = false });
            outcome.Should().BeEquivalentTo(new
            {
                AiText = "Ha, hello! Back to your idea.\n\nWhich students exactly?", AiKind = "nudge", AiTopic = (int?)2, Chips = (List<string>?)null,
                OffTopicStreak = 1,
            });
        }

        [Fact]
        public void Unreadable_OnTheOpener_CreatesNoRecord_AndReasksTheOpener()
        {
            var answers = new List<ClarifierAnswer>();

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "asdf", OffTopic(ClarifierRelevance.Unreadable, nudge: null, lang: "fr"), "fr", Now);

            answers.Should().BeEmpty();
            outcome.AiText.Should().Be($"{ClarifierScript.NudgeFr}\n\n{ClarifierScript.OpenerFr}");
        }

        [Fact]
        public void SecondNonRelevantTurnInARow_ReasksInSimplerWords_WithIdeaChipsForWho()
        {
            var answers = new List<ClarifierAnswer> { Rec(1, ClarifierAnswerStatus.Accepted) };

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 2, "lol", OffTopic(simple: "Who has this problem?", chips: new[] { "dorm students", "commuters" }),
                "en", Now, offTopicStreak: 1, sameQuestion: "Who has this problem the most?");

            outcome.OffTopicStreak.Should().Be(2);
            outcome.AiText.Should().EndWith("Who has this problem?");
            outcome.Chips.Should().Equal("dorm students", "commuters");
            answers.Should().HaveCount(1, "still nothing stored");
        }

        [Fact]
        public void SimplerReask_FallsBackToFixedSimpleQuestion_AndNoChipsForTopicsWithoutChips()
        {
            var answers = Enumerable.Range(1, 2).Select(i => Rec(i, ClarifierAnswerStatus.Accepted))
                .Append(Rec(4, ClarifierAnswerStatus.Accepted)).ToList();

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 3, "???", OffTopic(chips: new[] { "should not show" }), "en", Now, offTopicStreak: 3);

            outcome.AiText.Should().EndWith(ClarifierScript.SimpleBaseQuestion(3, "en"));
            outcome.Chips.Should().BeNull("alternatives does not allow chips");
        }

        [Fact]
        public void OnTopicAnswer_ResetsTheStreak()
        {
            var answers = new List<ClarifierAnswer>();
            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "real answer",
                Ai(new() { [1] = J("clear", new() { ["problem"] = "Real problem." }) }), "en", Now, offTopicStreak: 2);

            outcome.OffTopicStreak.Should().Be(0);
            State(answers, 1).Should().Be(ClarifierTopicState.Clear);
        }

        [Fact]
        public void AiFailure_KeepsTheFailOpenRule_EvenDuringAStreak()
        {
            var answers = new List<ClarifierAnswer>();
            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "hi", ClarifierTopicsResult.FailOpen(), "en", Now, offTopicStreak: 1);

            State(answers, 1).Should().Be(ClarifierTopicState.Weak);
            outcome.OffTopicStreak.Should().Be(0);
        }

        [Fact]
        public void SimpleBaseQuestions_ExistForEveryTopicInEnAndFr() =>
            ClarifierScript.Topics.Should().OnlyContain(t =>
                !string.IsNullOrWhiteSpace(ClarifierScript.SimpleBaseQuestion(t.Index, "en"))
                && !string.IsNullOrWhiteSpace(ClarifierScript.SimpleBaseQuestion(t.Index, "fr")));

        [Fact]
        public void LastQuestionText_TakesTheQuestionAfterTheAck()
        {
            var messages = new List<CreatorChatMessage>
            {
                new() { Sender = "ai", QuestionIndex = 2, Text = "Nice.\n\nWho has this problem the most?" },
                new() { Sender = "user", QuestionIndex = 2, Text = "students" },
                new() { Sender = "ai", QuestionIndex = 2, Text = "Got it.\n\nWhich students exactly?" },
            };

            ClarifierScript.LastQuestionText(messages, 2).Should().Be("Which students exactly?");
            ClarifierScript.LastQuestionText(messages, 3).Should().BeNull();
        }

        // ---- clear needs content ----

        [Fact]
        public void ClearWithoutExtractedContent_IsTreatedAsUnclear_AndUsesTheFollowUp()
        {
            var answers = new List<ClarifierAnswer>();
            var result = Ai(new() { [1] = J("clear", followUp: "What happens to them?") });

            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 1, "something", result, "en", Now);

            State(answers, 1).Should().Be(ClarifierTopicState.Unclear);
            outcome.AiKind.Should().Be("followup");
        }

        [Fact]
        public void ClearWithOnlyWhitespaceContent_IsUnclear()
        {
            var answers = Enumerable.Range(1, 5).Select(i => Rec(i, ClarifierAnswerStatus.Accepted)).ToList();
            var result = Ai(new() { [6] = J("clear", new() { ["whyNow"] = "  ", ["riskiestAssumption"] = "" }) });

            ClarifierScript.ApplyTopicsTurn(answers, 6, "x", result, "en", Now);

            State(answers, 6).Should().Be(ClarifierTopicState.Unclear);
        }

        [Fact]
        public void WhyNowRisk_ClearNeedsBothParts()
        {
            ClarifierScript.HasRequiredContent(6, new Dictionary<string, string> { ["whyNow"] = "Prices rose." }).Should().BeFalse();
            ClarifierScript.HasRequiredContent(6, new Dictionary<string, string> { ["whyNow"] = "Prices rose.", ["riskiestAssumption"] = "Trust." }).Should().BeTrue();

            var answers = Enumerable.Range(1, 5).Select(i => Rec(i, ClarifierAnswerStatus.Accepted)).ToList();
            var outcome = ClarifierScript.ApplyTopicsTurn(answers, 6, "Prices rose.",
                Ai(new() { [6] = J("clear", new() { ["whyNow"] = "Prices rose." }) }), "en", Now);

            State(answers, 6).Should().Be(ClarifierTopicState.Unclear, "the risk part is missing");
            outcome.AiTopic.Should().Be(6);
        }

        [Fact]
        public void Edge_ClearNeedsOnlyOneOfItsFields()
        {
            ClarifierScript.HasRequiredContent(5, new Dictionary<string, string> { ["founderAdvantage"] = "Ex-pattern maker." }).Should().BeTrue();
            ClarifierScript.HasRequiredContent(5, new Dictionary<string, string>()).Should().BeFalse();
        }

        [Fact]
        public void NonAskedTopic_ClearWithoutContent_IsNotUpgradedToClear()
        {
            var answers = new List<ClarifierAnswer> { Rec(1, ClarifierAnswerStatus.Accepted), Rec(2, ClarifierAnswerStatus.AcceptedWeak) };
            var result = Ai(new() { [2] = J("clear"), [4] = J("clear", new() { ["solution"] = "An app for X." }) });

            ClarifierScript.ApplyTopicsTurn(answers, 4, "an app for X", result, "en", Now);

            State(answers, 2).Should().Be(ClarifierTopicState.Weak, "a contentless clear must not upgrade a weak topic");
        }

        [Fact]
        public void Edit_ClearWithoutContent_IsRejected()
        {
            var answer = Rec(2, ClarifierAnswerStatus.AcceptedWeak, raw: "everyone");

            ClarifierScript.ApplyAnswerEdit(answer, "people", Ai(new() { [2] = J("clear") }), Now).Should().BeFalse();
            answer.Status.Should().Be(ClarifierAnswerStatus.AcceptedWeak);
        }

        // ---- edits ----

        [Fact]
        public void ApplyAnswerEdit_Clear_ReplacesAnswerAndUpgradesWeak()
        {
            var answer = Rec(2, ClarifierAnswerStatus.AcceptedWeak, raw: "everyone");
            answer.UserEdited = new() { ["targetUser"] = "manual" };

            ClarifierScript.ApplyAnswerEdit(answer, "night-shift nurses",
                Ai(new() { [2] = J("clear", new() { ["targetUser"] = "Night-shift nurses" }) }), Now).Should().BeTrue();

            answer.Should().BeEquivalentTo(new { Status = ClarifierAnswerStatus.Accepted, Attempts = 1, RawAnswer = "night-shift nurses" });
            answer.UserEdited.Should().BeNull();
        }

        [Fact]
        public void ApplyAnswerEdit_UnclearOrNoAi_KeepsPreviousAnswer()
        {
            var answer = Rec(2, ClarifierAnswerStatus.Accepted, raw: "office workers");
            answer.UpdatedAt = Now;

            ClarifierScript.ApplyAnswerEdit(answer, "people", Ai(new() { [2] = J("unclear", followUp: "Who exactly?") }), DateTime.UtcNow).Should().BeFalse();
            ClarifierScript.ApplyAnswerEdit(answer, "people", ClarifierTopicsResult.FailOpen(), DateTime.UtcNow).Should().BeFalse();

            answer.RawAnswer.Should().Be("office workers");
            answer.Attempts.Should().Be(2);
            answer.UpdatedAt.Should().Be(Now, "a rejected edit must not make the summary look stale");
        }

        // ---- fields ----

        [Fact]
        public void EffectiveFields_UserEditWinsOverExtraction_PerKey()
        {
            var answer = new ClarifierAnswer
            {
                QuestionIndex = 6,
                RawAnswer = "raw",
                AiExtracted = new() { ["whyNow"] = "ai why", ["riskiestAssumption"] = "ai risk" },
                UserEdited = new() { ["riskiestAssumption"] = "my risk" },
            };

            ClarifierScript.EffectiveFields(answer).Should().BeEquivalentTo(new Dictionary<string, string>
            {
                ["whyNow"] = "ai why",
                ["riskiestAssumption"] = "my risk",
            });
        }

        [Fact]
        public void ApplyFieldEdits_MergesTrimsAndEmptyClearsKey()
        {
            var answer = new ClarifierAnswer
            {
                QuestionIndex = 6, AiExtracted = new() { ["whyNow"] = "ai why", ["riskiestAssumption"] = "ai risk" },
                UserEdited = new() { ["whyNow"] = "my why" },
            };

            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["riskiestAssumption"] = " my risk " }, Now).Should().BeNull();
            ClarifierScript.EffectiveFields(answer).Should().BeEquivalentTo(new Dictionary<string, string> { ["whyNow"] = "my why", ["riskiestAssumption"] = "my risk" });

            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["whyNow"] = "", ["riskiestAssumption"] = null }, Now).Should().BeNull();
            answer.UserEdited.Should().BeNull();
            ClarifierScript.EffectiveFields(answer)["whyNow"].Should().Be("ai why");
        }

        [Fact]
        public void ApplyFieldEdits_RejectsForeignKeyAndOverlongValue_WithoutChanging()
        {
            var answer = new ClarifierAnswer { QuestionIndex = 1 };

            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["solution"] = "x" }, Now).Should().Contain("solution");
            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["problem"] = new string('a', ClarifierScript.MaxFieldLength + 1) }, Now)
                .Should().Contain("limited");
            answer.UserEdited.Should().BeNull();
        }

        [Fact]
        public void EffectiveFields_NothingExtracted_FallsBackToRawAnswer()
        {
            ClarifierScript.EffectiveFields(new ClarifierAnswer { QuestionIndex = 5, RawAnswer = " edge " })
                .Should().BeEquivalentTo(new Dictionary<string, string> { ["creatorEdge"] = "edge" });

            ClarifierScript.EffectiveFields(new ClarifierAnswer { QuestionIndex = 6, RawAnswer = "both" })
                .Should().BeEquivalentTo(new Dictionary<string, string> { ["whyNow"] = "both", ["riskiestAssumption"] = "both" });
        }
    }
}
