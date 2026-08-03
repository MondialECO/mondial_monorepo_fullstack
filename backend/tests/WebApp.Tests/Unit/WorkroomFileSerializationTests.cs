using System.Text.Json;
using FluentAssertions;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// WorkroomDetailResponse returns WorkroomFile raw, so this model's shape is the wire
/// contract. StoragePath is the physical location on the server; it was reaching every
/// participant in the engagement-detail response, independent of the auth-gated download
/// endpoint, which controls the download route but not this field.
/// </summary>
public class WorkroomFileSerializationTests
{
    private static readonly JsonSerializerOptions ApiOptions = new(JsonSerializerDefaults.Web);

    // Real ObjectId strings: Id and EngagementId carry [BsonRepresentation(ObjectId)], so
    // the BSON round-trip below rejects anything that is not 24 hex characters. The JSON
    // assertions do not care, but one fixture serves both.
    private static WorkroomFile File() => new()
    {
        Id = ObjectId.GenerateNewId().ToString(),
        EngagementId = ObjectId.GenerateNewId().ToString(),
        UploadedBy = "user-1",
        OriginalName = "brief.pdf",
        StoragePath = "/uploads/documents/2f8c1e00-secret.pdf",
        ContentType = "application/pdf",
        SizeBytes = 1024,
        Status = WorkroomFileStatus.Ready,
    };

    [Fact]
    public void StoragePath_is_not_serialised_to_the_client()
    {
        var json = JsonDocument.Parse(JsonSerializer.Serialize(File(), ApiOptions)).RootElement;

        json.TryGetProperty("storagePath", out _).Should().BeFalse(
            "the physical storage path is server-internal");
    }

    /// <summary>
    /// A property-name check alone would miss the value leaking under a different casing or
    /// through some other member, so the raw payload is searched too.
    /// </summary>
    [Fact]
    public void The_storage_path_value_appears_nowhere_in_the_payload()
        => JsonSerializer.Serialize(File(), ApiOptions)
            .Should().NotContain("secret.pdf").And.NotContain("/uploads/");

    /// <summary>
    /// The fields the UI genuinely needs must survive — this is a removal, and removing too
    /// much would break the files panel silently.
    /// </summary>
    [Fact]
    public void Everything_the_client_actually_uses_still_serialises()
    {
        var json = JsonDocument.Parse(JsonSerializer.Serialize(File(), ApiOptions)).RootElement;

        foreach (var property in new[]
                 { "id", "engagementId", "originalName", "contentType", "sizeBytes", "status", "providerPrivate", "immutable", "createdAt" })
            json.TryGetProperty(property, out _).Should().BeTrue($"'{property}' is used by the files panel");
    }

    /// <summary>
    /// JsonIgnore affects System.Text.Json only. MongoDB.Driver uses its own serializer, so
    /// the path must still persist — otherwise downloads break for every existing file.
    /// </summary>
    [Fact]
    public void The_path_still_round_trips_through_bson()
    {
        var bson = File().ToBsonDocument();

        bson.Contains("StoragePath").Should().BeTrue();
        MongoDB.Bson.Serialization.BsonSerializer
            .Deserialize<WorkroomFile>(bson).StoragePath
            .Should().Be("/uploads/documents/2f8c1e00-secret.pdf");
    }
}
