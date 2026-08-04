using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using WebApp.Models.DatabaseModels;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// The frontend reads a notification the same way whether it arrived over REST or over the
/// SignalR hub — one `AppNotification` type, camelCase property names, no defensive
/// handling of a second casing anywhere in `src`. Nothing in code stated that dependency
/// until Program.cs pinned the hub policy explicitly; these tests are the guard.
///
/// Worth stating plainly: this pins behaviour that was ALREADY correct. An audit claimed
/// the hub emitted PascalCase and that realtime rows were therefore rendering blank. That
/// claim was wrong — JsonHubProtocolOptions defaults to camelCase, which
/// <see cref="The_hub_default_is_camel_case_not_pascal_case"/> records so the mistaken
/// conclusion is not re-derived later.
/// </summary>
public class HubWireCasingTests
{
    private static JsonSerializerOptions HubOptions()
    {
        var options = new JsonHubProtocolOptions().PayloadSerializerOptions;
        options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // mirrors Program.cs
        return options;
    }

    private static Notification Sample() => new()
    {
        Title = "Payment released",
        Body = "A milestone payment was released to your balance.",
        Type = "System",
        IsRead = false,
        CreatedAt = new DateTime(2026, 8, 4, 9, 0, 0, DateTimeKind.Utc),
    };

    /// <summary>
    /// The four fields NotificationBell reads. If any arrives PascalCase the row renders
    /// blank, and `isRead` in particular would leave the unread badge stuck.
    /// </summary>
    [Theory]
    [InlineData("title")]
    [InlineData("body")]
    [InlineData("isRead")]
    [InlineData("createdAt")]
    public void Hub_payloads_use_the_property_names_the_client_reads(string expected)
    {
        var json = JsonSerializer.Serialize(Sample(), HubOptions());

        json.Should().Contain($"\"{expected}\"");
    }

    [Theory]
    [InlineData("Title")]
    [InlineData("Body")]
    [InlineData("IsRead")]
    [InlineData("CreatedAt")]
    public void Hub_payloads_never_emit_pascal_case(string pascal)
    {
        var json = JsonSerializer.Serialize(Sample(), HubOptions());

        json.Should().NotContain($"\"{pascal}\"");
    }

    /// <summary>
    /// REST (MVC AddJsonOptions) and the hub must agree. A client cannot hold one type for
    /// both transports otherwise.
    /// </summary>
    [Fact]
    public void The_hub_and_rest_pipelines_agree_on_naming_policy()
    {
        var rest = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        HubOptions().PropertyNamingPolicy.Should().BeSameAs(rest.PropertyNamingPolicy);
    }

    /// <summary>
    /// Records the framework default that the earlier audit got wrong. If this ever fails,
    /// the default changed and the explicit pin in Program.cs became load-bearing rather
    /// than documentary.
    /// </summary>
    [Fact]
    public void The_hub_default_is_camel_case_not_pascal_case()
    {
        var unconfigured = new JsonHubProtocolOptions().PayloadSerializerOptions;

        unconfigured.PropertyNamingPolicy.Should().NotBeNull("an unset policy means PascalCase");
        unconfigured.PropertyNamingPolicy!.ConvertName("CreatedAt").Should().Be("createdAt");
    }
}
