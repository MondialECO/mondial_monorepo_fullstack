using FluentAssertions;
using WebApp.Validation;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Server-side counterpart to src/lib/service-provider/url-security.ts. §15.1 shipped the
/// browser guard as defence in depth and recorded that the backend equivalent was still
/// required — a direct API call bypasses the frontend entirely, and these values are
/// rendered as anchors to other users.
/// </summary>
public class UrlSafetyTests
{
    [Theory]
    [InlineData("https://example.com")]
    [InlineData("http://example.com")]
    [InlineData("https://example.com/path?q=1#frag")]
    [InlineData("HTTPS://EXAMPLE.COM")]
    [InlineData("  https://example.com  ")]
    [InlineData("https://sub.example.co.uk:8443/a")]
    public void Complete_http_urls_are_accepted(string url)
        => UrlSafety.IsHttpUrl(url).Should().BeTrue();

    /// <summary>
    /// The scheme cases are the point of the guard: Uri.TryCreate accepts every one of
    /// these as a well-formed absolute URI, so parsing alone proves nothing.
    /// </summary>
    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("JavaScript:alert(1)")]
    [InlineData("data:text/html;base64,PHNjcmlwdD4=")]
    [InlineData("file:///etc/passwd")]
    [InlineData("vbscript:msgbox(1)")]
    [InlineData("ftp://example.com")]
    public void Dangerous_and_unknown_schemes_are_rejected(string url)
        => UrlSafety.IsHttpUrl(url).Should().BeFalse();

    [Theory]
    [InlineData("//example.com")]          // protocol-relative: not absolute
    [InlineData("/uploads/documents/x")]   // site-relative
    [InlineData("example.com")]            // bare host, no scheme
    [InlineData("not a url")]
    [InlineData("http://")]                // no host
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Malformed_relative_and_empty_values_are_rejected(string? url)
        => UrlSafety.IsHttpUrl(url).Should().BeFalse();

    /// <summary>
    /// Matches the frontend's hostname requirement. Uri.TryCreate alone accepts this with
    /// an empty Host, where the browser's new URL() check does not.
    /// </summary>
    [Fact]
    public void An_http_url_with_no_host_is_rejected()
        => UrlSafety.IsHttpUrl("http:///path").Should().BeFalse();

    // ---- opaque-or-URL fields (proposal attachments) ----

    [Theory]
    [InlineData("attachment-token-123")]
    [InlineData("proposal/2026/spec.pdf")]
    [InlineData("")]
    [InlineData(null)]
    public void Opaque_references_are_left_alone(string? value)
    {
        UrlSafety.LooksLikeUrlReference(value).Should().BeFalse();
        UrlSafety.IsSafeOpaqueOrHttpUrl(value).Should().BeTrue();
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:text/html,x")]
    [InlineData("//evil.example.com")]
    public void Url_shaped_references_must_still_be_safe(string value)
    {
        UrlSafety.LooksLikeUrlReference(value).Should().BeTrue();
        UrlSafety.IsSafeOpaqueOrHttpUrl(value).Should().BeFalse();
    }

    [Fact]
    public void A_url_shaped_reference_that_is_a_real_http_url_passes()
        => UrlSafety.IsSafeOpaqueOrHttpUrl("https://example.com/spec.pdf").Should().BeTrue();
}
