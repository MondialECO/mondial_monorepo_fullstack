using System;
using System.Text.RegularExpressions;

namespace WebApp.Services.Implementations;

public static class ProfileSlugGenerator
{
    public static string GenerateSlug(string? input, string fallbackId = "")
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            var cleanedFallback = (fallbackId ?? "").Replace("-", "").ToLowerInvariant();
            return cleanedFallback.Length >= 4
                ? $"member-{cleanedFallback[..Math.Min(8, cleanedFallback.Length)]}"
                : $"member-{Guid.NewGuid():N}"[..15];
        }

        var normalized = input.Trim().ToLowerInvariant();
        var slug = Regex.Replace(normalized, @"[\s_\.]+", "-");
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');

        if (string.IsNullOrWhiteSpace(slug) || slug.Length < 2)
        {
            var cleanedFallback = (fallbackId ?? "").Replace("-", "").ToLowerInvariant();
            return cleanedFallback.Length >= 4
                ? $"member-{cleanedFallback[..Math.Min(8, cleanedFallback.Length)]}"
                : $"member-{Guid.NewGuid():N}"[..15];
        }

        return slug;
    }
}
