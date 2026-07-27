using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// One multiple-choice skills-test question. <see cref="CorrectIndex"/> is server-only
/// and is NEVER included in the client-facing DTO — grading happens on the server.
/// </summary>
public class SkillsTestQuestion
{
    public string Id { get; set; } = "";
    public ServiceCategory Category { get; set; }
    public string Prompt { get; set; } = "";
    public List<string> Options { get; set; } = new();

    /// <summary>Zero-based index of the correct option. Server-side only.</summary>
    public int CorrectIndex { get; set; }
}

/// <summary>
/// Static skills-test question bank + test policy constants (Module 1: Profile &amp; Trust).
///
/// PLACEHOLDER CONTENT: this seeds a small, manually-authored generic professional set so
/// the end-to-end mechanism (select N → answer → auto-grade → cooldown) is testable for
/// every <see cref="ServiceCategory"/>. Authoring the real, complete per-category question
/// content is a separate content task — do NOT treat these as production questions.
///
/// Structure is per-category on purpose (<see cref="ForCategory"/>), so real category banks
/// can drop in later without changing the service/controller. Swapping this static source
/// for a DB-backed bank is a localized change behind the same method.
/// </summary>
public static class SkillsTestQuestionBank
{
    /// <summary>Questions drawn per attempt (randomly selected from the category bank).</summary>
    public const int QuestionsPerAttempt = 5;

    /// <summary>Pass threshold as a percentage of questions answered correctly.</summary>
    public const double PassThresholdPercent = 70.0;

    /// <summary>Cooldown before a provider may retest a category (failure or improvement).</summary>
    public const int RetestCooldownDays = 30;

    // Generic professional placeholder questions, re-tagged per category by ForCategory.
    // Correct answers live here (server-side) and are stripped before reaching the client.
    private static readonly List<(string Prompt, string[] Options, int Correct)> Placeholder = new()
    {
        ("A client's requested scope has grown beyond the original agreement. What is the most professional first step?",
            new[] { "Silently absorb the extra work", "Stop all work immediately", "Document the change and agree a revised scope and price before proceeding", "Invoice for the extra work without notice" }, 2),
        ("When you cannot meet an agreed deadline, best practice is to:",
            new[] { "Wait until the deadline passes to explain", "Notify the client early with a revised timeline", "Deliver incomplete work on time and say nothing", "Cancel the engagement" }, 1),
        ("Under an hourly pricing model, what should you give the client for transparency?",
            new[] { "Nothing until the final invoice", "A tracked, itemized record of hours worked", "A single lump-sum estimate only", "Only the final total" }, 1),
        ("What is the most appropriate way to handle confidential client materials?",
            new[] { "Store them in a shared public folder", "Reuse them freely for other clients", "Keep them access-controlled and use them only for that engagement", "Post anonymized versions publicly" }, 2),
        ("A client messages outside your stated working hours. A strong response-time practice is to:",
            new[] { "Reply instantly at any hour, every time", "Ignore it until convenient", "Acknowledge within your stated response window and set expectations", "Reply only if it feels urgent to you" }, 2),
        ("Before starting paid work, the clearest way to prevent disputes is to:",
            new[] { "Rely on a verbal understanding", "Agree written scope, milestones, and acceptance criteria", "Start immediately and clarify later", "Let the client redefine the work as you go" }, 1),
        ("A client requests revisions beyond your agreed revision cap. The professional approach is to:",
            new[] { "Refuse and end the project", "Do unlimited revisions for free", "Reference the agreed cap and offer more as a scoped add-on", "Ignore the request" }, 2),
        ("Which reflects good invoicing practice for a milestone-based engagement?",
            new[] { "Invoice the full amount up front", "Invoice each milestone as its acceptance criteria are met", "Never invoice until the whole project ends", "Invoice random amounts as needed" }, 1),
    };

    /// <summary>
    /// The (placeholder) question bank for a category. Returns a stable, category-tagged set;
    /// the service selects <see cref="QuestionsPerAttempt"/> at random from it per attempt.
    /// </summary>
    public static IReadOnlyList<SkillsTestQuestion> ForCategory(ServiceCategory category)
    {
        var list = new List<SkillsTestQuestion>(Placeholder.Count);
        for (var i = 0; i < Placeholder.Count; i++)
        {
            var q = Placeholder[i];
            list.Add(new SkillsTestQuestion
            {
                Id = $"{category}-{i}",
                Category = category,
                Prompt = q.Prompt,
                Options = new List<string>(q.Options),
                CorrectIndex = q.Correct,
            });
        }
        return list;
    }

    /// <summary>Look up a single question by its bank id (used to grade a submission).</summary>
    public static SkillsTestQuestion? ById(ServiceCategory category, string id) =>
        ForCategory(category).FirstOrDefault(q => q.Id == id);
}
