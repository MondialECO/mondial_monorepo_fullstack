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
        private static CreatorChatMessage Msg(string sender, string text) =>
            new() { Id = Guid.NewGuid().ToString(), Sender = sender, Text = text };

        [Fact]
        public void GetAnswers_LegacyIdea_DerivesAcceptedAnswersFromUserMessages()
        {
            var p2 = new CreatorPhase2Data
            {
                ChatMessages = new List<CreatorChatMessage>
                {
                    Msg("ai", "q1"), Msg("user", "a1"), Msg("ai", "q2"), Msg("user", "a2"),
                },
            };

            var answers = ClarifierScript.GetAnswers(p2);

            answers.Select(a => (a.QuestionIndex, a.RawAnswer, a.Status)).Should().Equal(
                (1, "a1", ClarifierAnswerStatus.Accepted),
                (2, "a2", ClarifierAnswerStatus.Accepted));
            ClarifierScript.CurrentQuestionIndex(answers).Should().Be(3);
        }

        [Fact]
        public void GetAnswers_IgnoresNewFlowUserMessagesWithoutRecords()
        {
            // A first turn whose AI write never landed: the message carries a QuestionIndex, so it is not a legacy answer.
            var p2 = new CreatorPhase2Data
            {
                ChatMessages = new List<CreatorChatMessage>
                {
                    new() { Id = "m1", Sender = "user", Text = "an app", QuestionIndex = 1 },
                },
            };

            ClarifierScript.GetAnswers(p2).Should().BeEmpty();
        }

        [Fact]
        public void GetAnswers_PrefersStoredRecordsOverMessages()
        {
            var stored = new ClarifierAnswer { QuestionIndex = 1, Status = ClarifierAnswerStatus.Pending, Attempts = 2 };
            var p2 = new CreatorPhase2Data
            {
                ChatMessages = new List<CreatorChatMessage> { Msg("user", "a"), Msg("user", "b") },
                ClarifierAnswers = new List<ClarifierAnswer> { stored },
            };

            ClarifierScript.GetAnswers(p2).Should().ContainSingle().Which.Should().BeSameAs(stored);
        }

        [Fact]
        public void CurrentQuestionIndex_PendingAnswerKeepsSameQuestion_AndAllDoneReturnsNull()
        {
            var answers = new List<ClarifierAnswer>
            {
                new() { QuestionIndex = 1, Status = ClarifierAnswerStatus.Accepted },
                new() { QuestionIndex = 2, Status = ClarifierAnswerStatus.Pending, Attempts = 3 },
            };
            ClarifierScript.CurrentQuestionIndex(answers).Should().Be(2);

            var done = Enumerable.Range(1, 6)
                .Select(q => new ClarifierAnswer { QuestionIndex = q, Status = q == 4 ? ClarifierAnswerStatus.AcceptedWeak : ClarifierAnswerStatus.Accepted })
                .ToList();
            ClarifierScript.AllAnswered(done).Should().BeTrue();
        }

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

        private static ClarifierTurnResult Turn(string verdict, string? feedback = null, string? next = null,
            Dictionary<string, string>? extracted = null) =>
            new() { Verdict = verdict, Feedback = feedback, NextQuestion = next, Extracted = extracted ?? new(), Language = "bn", AiUsed = true };

        [Fact]
        public void ApplyTurn_Revise_KeepsQuestionPendingWithFeedback()
        {
            var answers = new List<ClarifierAnswer>();

            var outcome = ClarifierScript.ApplyTurn(answers, 1, "an app", Turn(ClarifierVerdict.Revise, "আরও নির্দিষ্ট করুন"), DateTime.UtcNow);

            outcome.Should().BeEquivalentTo(new { AiText = "আরও নির্দিষ্ট করুন", AiKind = "feedback", AiQuestionIndex = (int?)1 });
            answers.Should().ContainSingle().Which.Should().BeEquivalentTo(new
            {
                QuestionIndex = 1, Status = ClarifierAnswerStatus.Pending, Attempts = 1, RawAnswer = "an app", Language = "bn",
            });
            ClarifierScript.CurrentQuestionIndex(answers).Should().Be(1);
        }

        [Fact]
        public void ApplyTurn_Accept_StoresExtractionAndAsksLocalizedNextQuestion()
        {
            var answers = new List<ClarifierAnswer> { new() { QuestionIndex = 1, Attempts = 2, UserEdited = new() { ["problem"] = "old" } } };

            var outcome = ClarifierScript.ApplyTurn(answers, 1, "busy people skip gyms",
                Turn(ClarifierVerdict.Accept, "দারুণ!", "কার জন্য?", new() { ["problem"] = "Busy people skip gyms." }), DateTime.UtcNow);

            outcome.Should().BeEquivalentTo(new { AiText = "দারুণ!\n\nকার জন্য?", AiKind = "question", AiQuestionIndex = (int?)2 });
            var a = answers.Single();
            a.Status.Should().Be(ClarifierAnswerStatus.Accepted);
            a.Attempts.Should().Be(3);
            a.UserEdited.Should().BeNull();
            ClarifierScript.EffectiveFields(a)["problem"].Should().Be("Busy people skip gyms.");
        }

        [Fact]
        public void ApplyTurn_FifthRevise_AcceptsWeakAndMovesOnWithoutCriticism()
        {
            var answers = new List<ClarifierAnswer> { new() { QuestionIndex = 2, Attempts = ClarifierScript.MaxAttempts - 1 } };

            var outcome = ClarifierScript.ApplyTurn(answers, 2, "everyone", Turn(ClarifierVerdict.Revise, "too vague"), DateTime.UtcNow);

            answers.Single().Status.Should().Be(ClarifierAnswerStatus.AcceptedWeak);
            outcome.AiText.Should().Be(ClarifierScript.QuestionText(3));
            outcome.AiQuestionIndex.Should().Be(3);
        }

        [Fact]
        public void ApplyTurn_LastQuestionAccepted_SendsClosingAndCompletes()
        {
            var answers = Enumerable.Range(1, 5)
                .Select(q => new ClarifierAnswer { QuestionIndex = q, Status = ClarifierAnswerStatus.Accepted })
                .ToList();

            var outcome = ClarifierScript.ApplyTurn(answers, 6, "timing", ClarifierTurnResult.FailOpen(), DateTime.UtcNow);

            outcome.Should().BeEquivalentTo(new { AiText = ClarifierScript.ClosingMessage, AiKind = "ack", AiQuestionIndex = (int?)null });
            ClarifierScript.AllAnswered(answers).Should().BeTrue();
        }

        [Fact]
        public void PriorAnswers_OnlyFinishedEarlierQuestions_UsingEffectiveValues()
        {
            var answers = new List<ClarifierAnswer>
            {
                new() { QuestionIndex = 1, Status = ClarifierAnswerStatus.Accepted, RawAnswer = "raw", AiExtracted = new() { ["problem"] = "clean" } },
                new() { QuestionIndex = 2, Status = ClarifierAnswerStatus.Pending, RawAnswer = "pending" },
            };

            ClarifierScript.PriorAnswers(answers, 3).Should().Equal(new PriorClarifierAnswer(1, "clean"));
        }

        [Fact]
        public void ApplyAnswerEdit_Revise_KeepsOldAnswerButCountsAttempt()
        {
            var answer = new ClarifierAnswer
            {
                QuestionIndex = 2, Status = ClarifierAnswerStatus.Accepted, Attempts = 1, RawAnswer = "office workers",
                AiExtracted = new() { ["targetUser"] = "Office workers" },
            };

            ClarifierScript.ApplyAnswerEdit(answer, "people", Turn(ClarifierVerdict.Revise, "too vague"), DateTime.UtcNow).Should().BeFalse();

            answer.Should().BeEquivalentTo(new { Status = ClarifierAnswerStatus.Accepted, Attempts = 2, RawAnswer = "office workers" });
            answer.AiExtracted["targetUser"].Should().Be("Office workers");
        }

        [Fact]
        public void ApplyAnswerEdit_WithoutAi_NeverOverwritesAValidAnswer()
        {
            var updated = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var answer = new ClarifierAnswer
            {
                QuestionIndex = 1, Status = ClarifierAnswerStatus.Accepted, Attempts = 1, RawAnswer = "busy people skip gyms", UpdatedAt = updated,
            };

            ClarifierScript.ApplyAnswerEdit(answer, "fitness", ClarifierTurnResult.FailOpen(), DateTime.UtcNow).Should().BeFalse();

            answer.RawAnswer.Should().Be("busy people skip gyms");
            answer.UpdatedAt.Should().Be(updated, "a rejected edit must not make the summary look stale");
        }

        [Fact]
        public void ApplyAnswerEdit_Accept_ReplacesAnswerClearsEditsAndUpgradesWeak()
        {
            var answer = new ClarifierAnswer
            {
                QuestionIndex = 2, Status = ClarifierAnswerStatus.AcceptedWeak, Attempts = 5, RawAnswer = "everyone",
                UserEdited = new() { ["targetUser"] = "manual" },
            };

            ClarifierScript.ApplyAnswerEdit(answer, "nurses on night shifts",
                Turn(ClarifierVerdict.Accept, extracted: new() { ["targetUser"] = "Night-shift nurses" }), DateTime.UtcNow).Should().BeTrue();

            answer.Should().BeEquivalentTo(new { Status = ClarifierAnswerStatus.Accepted, Attempts = 6, RawAnswer = "nurses on night shifts" });
            answer.UserEdited.Should().BeNull();
            ClarifierScript.EffectiveFields(answer)["targetUser"].Should().Be("Night-shift nurses");
        }

        [Fact]
        public void ApplyFieldEdits_MergesTrimsAndEmptyClearsKey()
        {
            var answer = new ClarifierAnswer
            {
                QuestionIndex = 6, AiExtracted = new() { ["whyNow"] = "ai why", ["riskiestAssumption"] = "ai risk" },
                UserEdited = new() { ["whyNow"] = "my why" },
            };

            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["riskiestAssumption"] = " my risk " }, DateTime.UtcNow).Should().BeNull();
            ClarifierScript.EffectiveFields(answer).Should().BeEquivalentTo(new Dictionary<string, string> { ["whyNow"] = "my why", ["riskiestAssumption"] = "my risk" });

            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["whyNow"] = "", ["riskiestAssumption"] = null }, DateTime.UtcNow).Should().BeNull();
            answer.UserEdited.Should().BeNull();
            ClarifierScript.EffectiveFields(answer)["whyNow"].Should().Be("ai why");
        }

        [Fact]
        public void ApplyFieldEdits_RejectsForeignKeyAndOverlongValue_WithoutChanging()
        {
            var answer = new ClarifierAnswer { QuestionIndex = 1 };

            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["solution"] = "x" }, DateTime.UtcNow).Should().Contain("solution");
            ClarifierScript.ApplyFieldEdits(answer, new Dictionary<string, string?> { ["problem"] = new string('a', ClarifierScript.MaxFieldLength + 1) }, DateTime.UtcNow)
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
