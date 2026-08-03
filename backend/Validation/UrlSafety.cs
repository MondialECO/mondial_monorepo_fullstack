namespace WebApp.Validation;

/// <summary>
/// Server-side counterpart to <c>src/lib/service-provider/url-security.ts</c>. The two must
/// agree on what is storable, or the frontend guard becomes the only real check and any
/// direct API call bypasses it — which is exactly what §15.1 flagged as outstanding.
///
/// The frontend rule is: trim, parse as an absolute URL, require an http/https protocol
/// and a non-empty hostname. This mirrors it, including the hostname requirement —
/// <c>Uri.TryCreate</c> alone accepts <c>http:///path</c> with an empty Host, which the
/// browser-side <c>new URL()</c> check rejects.
/// </summary>
public static class UrlSafety
{
    public const string HttpUrlError = "Enter a complete URL beginning with http:// or https://.";

    /// <summary>
    /// True only for a complete, well-formed http(s) URL. Rejects javascript:, data:,
    /// file:, vbscript:, protocol-relative (//host — not absolute, so parsing fails),
    /// relative paths and malformed values.
    /// </summary>
    public static bool IsHttpUrl(string? url) =>
        Uri.TryCreate(url?.Trim(), UriKind.Absolute, out var u)
        && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps)
        && !string.IsNullOrEmpty(u.Host);

    /// <summary>
    /// Whether a value is shaped like a URL reference — it carries a scheme, or begins
    /// protocol-relative. Mirrors the frontend's <c>looksLikeUrlReference</c>.
    ///
    /// Used where a field is contractually an opaque string that MAY hold a URL: an opaque
    /// token stays legal, but the moment a value looks like a link it has to survive
    /// <see cref="IsHttpUrl"/>, because something downstream will render it as one.
    /// </summary>
    public static bool LooksLikeUrlReference(string? value)
    {
        var candidate = value?.Trim();
        if (string.IsNullOrEmpty(candidate)) return false;

        return candidate.StartsWith("//", StringComparison.Ordinal)
            || System.Text.RegularExpressions.Regex.IsMatch(
                candidate, @"^[a-z][a-z\d+.-]*:", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    /// <summary>
    /// The rule for opaque-but-possibly-URL fields: anything not URL-shaped passes
    /// through, anything URL-shaped must be a valid http(s) URL.
    /// </summary>
    public static bool IsSafeOpaqueOrHttpUrl(string? value) =>
        !LooksLikeUrlReference(value) || IsHttpUrl(value);
}
