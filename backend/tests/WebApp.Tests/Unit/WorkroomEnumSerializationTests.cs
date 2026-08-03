using System.Text.Json;
using FluentAssertions;
using WebApp.Models.DatabaseModels;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// WorkroomDetailResponse ships six BSON model classes raw — Deliverables,
/// RevisionRequests, Tasks, ClientInputRequests, Files and Review — so their enum
/// declarations are the wire contract. An unannotated enum serialises as its integer
/// ordinal, which every frontend consumer of these fields reads as a string; the
/// comparisons silently never match.
///
/// The absence of exactly these assertions is what let that ship. Asserted per property
/// rather than per enum type, because the defect is always "this field on the wire", and
/// a per-property list is what catches a new field added to one of these models later.
/// </summary>
public class WorkroomEnumSerializationTests
{
    // Mirrors the API's default: ASP.NET Core uses System.Text.Json with camelCase
    // property naming, and nothing in Program.cs overrides the enum handling.
    private static readonly JsonSerializerOptions ApiOptions =
        new(JsonSerializerDefaults.Web);

    private static JsonElement Serialize<T>(T value) =>
        JsonDocument.Parse(JsonSerializer.Serialize(value, ApiOptions)).RootElement;

    private static void ShouldBeStringNamed(JsonElement root, string property, string expected)
    {
        root.TryGetProperty(property, out var element).Should().BeTrue($"'{property}' should be present");
        element.ValueKind.Should().Be(
            JsonValueKind.String,
            $"'{property}' must reach the client as an enum name, not an ordinal");
        element.GetString().Should().Be(expected);
    }

    [Fact]
    public void Deliverable_status_serialises_as_a_name()
    {
        var json = Serialize(new Deliverable { DeliverableStatus = DeliverableStatus.Superseded });

        ShouldBeStringNamed(json, "deliverableStatus", "Superseded");
    }

    [Fact]
    public void RevisionRequest_all_three_enums_serialise_as_names()
    {
        var json = Serialize(new RevisionRequest
        {
            ScopeClassification = RevisionScopeClassification.PotentialScopeChange,
            FeedbackCollectionStatus = FeedbackCollectionStatus.Consolidated,
            RevisionRequestStatus = RevisionRequestStatus.InProgress,
        });

        ShouldBeStringNamed(json, "scopeClassification", "PotentialScopeChange");
        // FeedbackCollectionStatus was missed by an earlier per-property audit, which is
        // why the converter is applied at the enum-type level rather than per property.
        ShouldBeStringNamed(json, "feedbackCollectionStatus", "Consolidated");
        ShouldBeStringNamed(json, "revisionRequestStatus", "InProgress");
    }

    [Fact]
    public void WorkroomTask_visibility_and_status_serialise_as_names()
    {
        var json = Serialize(new WorkroomTask
        {
            Visibility = WorkroomTaskVisibility.ProviderPrivate,
            Status = WorkroomTaskStatus.Blocked,
        });

        ShouldBeStringNamed(json, "visibility", "ProviderPrivate");
        ShouldBeStringNamed(json, "status", "Blocked");
    }

    [Fact]
    public void ClientInputRequest_type_and_status_serialise_as_names()
    {
        var json = Serialize(new ClientInputRequest
        {
            Type = ClientInputType.Clarification,
            Status = ClientInputStatus.Supplied,
        });

        ShouldBeStringNamed(json, "type", "Clarification");
        // CoordinationPanel compares this against the literal 'Supplied'.
        ShouldBeStringNamed(json, "status", "Supplied");
    }

    [Fact]
    public void WorkroomFile_status_serialises_as_a_name()
    {
        var json = Serialize(new WorkroomFile { Status = WorkroomFileStatus.Ready });

        // isFileDownloadable() and the download endpoint both gate on Ready.
        ShouldBeStringNamed(json, "status", "Ready");
    }

    [Fact]
    public void Review_visibility_and_verification_serialise_as_names()
    {
        var json = Serialize(new Review
        {
            Visibility = ReviewVisibility.Private,
            VerificationStatus = ReviewVerificationStatus.Verified,
        });

        ShouldBeStringNamed(json, "visibility", "Private");
        ShouldBeStringNamed(json, "verificationStatus", "Verified");
    }

    /// <summary>
    /// Round-trips the default value of every in-scope enum, so a member added at the
    /// front of a declaration (shifting every ordinal) cannot pass unnoticed.
    /// </summary>
    [Theory]
    [InlineData(typeof(DeliverableStatus))]
    [InlineData(typeof(RevisionScopeClassification))]
    [InlineData(typeof(FeedbackCollectionStatus))]
    [InlineData(typeof(RevisionRequestStatus))]
    [InlineData(typeof(WorkroomTaskVisibility))]
    [InlineData(typeof(WorkroomTaskStatus))]
    [InlineData(typeof(ClientInputType))]
    [InlineData(typeof(ClientInputStatus))]
    [InlineData(typeof(WorkroomFileStatus))]
    [InlineData(typeof(ReviewVisibility))]
    [InlineData(typeof(ReviewVerificationStatus))]
    public void Every_in_scope_enum_serialises_every_member_as_its_name(Type enumType)
    {
        foreach (var member in Enum.GetValues(enumType))
        {
            var json = JsonSerializer.Serialize(member, enumType, ApiOptions);

            json.Should().Be(
                $"\"{member}\"",
                $"{enumType.Name}.{member} must serialise as its name");
        }
    }
}
