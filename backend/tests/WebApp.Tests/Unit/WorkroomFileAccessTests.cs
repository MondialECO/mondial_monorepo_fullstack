using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Authorization rules for workroom file download. These replace unauthenticated static
/// serving, so every branch is security-relevant and gets a case — including the ones
/// that must NOT be distinguishable from each other in the response.
/// </summary>
public class WorkroomFileAccessTests
{
    private const string Provider = "provider-1";
    private const string Client = "client-1";
    private const string Stranger = "stranger-1";

    private static WorkroomEngagement Engagement() =>
        new() { Id = "engagement-1", ProviderId = Provider, ClientId = Client };

    private static WorkroomFile File(
        bool providerPrivate = false,
        WorkroomFileStatus status = WorkroomFileStatus.Ready) =>
        new()
        {
            Id = "file-1",
            EngagementId = "engagement-1",
            StoragePath = "/uploads/documents/abc.pdf",
            OriginalName = "brief.pdf",
            ContentType = "application/pdf",
            Status = status,
            ProviderPrivate = providerPrivate,
        };

    [Fact]
    public void Client_can_download_a_ready_shared_file()
        => WorkroomFileAccess.Evaluate(File(), Engagement(), Client)
            .Should().Be(WorkroomFileAccessResult.Allowed);

    [Fact]
    public void Provider_can_download_a_ready_shared_file()
        => WorkroomFileAccess.Evaluate(File(), Engagement(), Provider)
            .Should().Be(WorkroomFileAccessResult.Allowed);

    /// <summary>
    /// A non-participant reaches here with a null engagement, because the lookup that
    /// feeds this is participant-scoped.
    /// </summary>
    [Fact]
    public void Non_participant_is_denied()
        => WorkroomFileAccess.Evaluate(File(), engagement: null, Stranger)
            .Should().Be(WorkroomFileAccessResult.Denied);

    [Fact]
    public void Client_is_denied_a_provider_private_file_despite_being_a_participant()
        => WorkroomFileAccess.Evaluate(File(providerPrivate: true), Engagement(), Client)
            .Should().Be(WorkroomFileAccessResult.Denied);

    [Fact]
    public void Provider_can_download_their_own_provider_private_file()
        => WorkroomFileAccess.Evaluate(File(providerPrivate: true), Engagement(), Provider)
            .Should().Be(WorkroomFileAccessResult.Allowed);

    /// <summary>
    /// The denial for "not yours" and the denial for "does not exist" must be the same
    /// value, or the endpoint becomes an oracle for probing file ids.
    /// </summary>
    [Fact]
    public void Missing_file_and_forbidden_file_are_indistinguishable()
    {
        var missing = WorkroomFileAccess.Evaluate(file: null, engagement: null, Stranger);
        var forbidden = WorkroomFileAccess.Evaluate(File(providerPrivate: true), Engagement(), Client);

        missing.Should().Be(WorkroomFileAccessResult.Denied);
        forbidden.Should().Be(WorkroomFileAccessResult.Denied);
        missing.Should().Be(forbidden);
    }

    [Theory]
    [InlineData(WorkroomFileStatus.Selected)]
    [InlineData(WorkroomFileStatus.Uploading)]
    [InlineData(WorkroomFileStatus.Scanning)]
    [InlineData(WorkroomFileStatus.Failed)]
    [InlineData(WorkroomFileStatus.Archived)]
    [InlineData(WorkroomFileStatus.Restricted)]
    public void Only_ready_files_are_served(WorkroomFileStatus status)
        => WorkroomFileAccess.Evaluate(File(status: status), Engagement(), Client)
            .Should().Be(WorkroomFileAccessResult.NotReady);

    /// <summary>A Ready record with no path never finished uploading.</summary>
    [Fact]
    public void Ready_file_with_no_storage_path_is_not_served()
    {
        var file = File();
        file.StoragePath = "";

        WorkroomFileAccess.Evaluate(file, Engagement(), Client)
            .Should().Be(WorkroomFileAccessResult.NotReady);
    }

    /// <summary>
    /// Privacy is checked before readiness, so a client probing a provider-private file
    /// cannot learn its status from the difference between Denied and NotReady.
    /// </summary>
    [Fact]
    public void Privacy_outranks_readiness_for_a_client()
        => WorkroomFileAccess.Evaluate(
                File(providerPrivate: true, status: WorkroomFileStatus.Scanning), Engagement(), Client)
            .Should().Be(WorkroomFileAccessResult.Denied);
}
