using System.Text.Json;

namespace WebApp.Services.Implementations;

/// <summary>
/// Sanitizes Tiptap editor JSON documents for safe rendering.
/// Removes dangerous HTML/JavaScript content, preserves allowed formatting.
/// </summary>
public static class ProfessionalOverviewSanitizer
{
    public const int SchemaVersion = 1;

    private static readonly HashSet<string> AllowedNodeTypes = new()
    {
        "doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem", "hardBreak", "horizontalRule",
        "codeBlock", "blockquote",
    };

    private static readonly HashSet<string> TextContainingNodes = new()
    {
        "text", "paragraph", "heading", "listItem", "blockquote", "codeBlock",
    };

    private static readonly HashSet<string> AllowedMarkTypes = new()
    {
        "bold", "italic", "code", "link", "underline", "strike", "superscript", "subscript",
    };

    public static bool TrySanitize(
        JsonElement document,
        out JsonElement? sanitized,
        out string? error)
    {
        try
        {
            if (document.ValueKind != JsonValueKind.Object)
            {
                error = "Document must be a JSON object.";
                sanitized = null;
                return false;
            }

            using var doc = JsonDocument.Parse(document.GetRawText());
            var cleaned = SanitizeNode(doc.RootElement);
            sanitized = cleaned;
            error = null;
            return true;
        }
        catch (Exception ex)
        {
            error = $"Failed to sanitize document: {ex.Message}";
            sanitized = null;
            return false;
        }
    }

    private static JsonElement SanitizeNode(JsonElement node)
    {
        if (node.ValueKind != JsonValueKind.Object)
            return node;

        using var doc = JsonDocument.Parse("{}");
        var options = new JsonSerializerOptions { WriteIndented = false };
        var dict = new Dictionary<string, object?>();

        foreach (var prop in node.EnumerateObject())
        {
            switch (prop.Name)
            {
                case "type":
                    var type = prop.Value.GetString();
                    if (string.IsNullOrEmpty(type) || !AllowedNodeTypes.Contains(type))
                        continue;
                    dict["type"] = type;
                    break;

                case "attrs":
                    if (prop.Value.ValueKind == JsonValueKind.Object)
                    {
                        var sanitizedAttrs = SanitizeAttrs(prop.Value);
                        if (sanitizedAttrs.Count > 0)
                            dict["attrs"] = sanitizedAttrs;
                    }
                    break;

                case "content":
                    if (prop.Value.ValueKind == JsonValueKind.Array)
                    {
                        var sanitizedContent = new List<object>();
                        foreach (var child in prop.Value.EnumerateArray())
                        {
                            if (child.ValueKind == JsonValueKind.Object)
                            {
                                var childType = child.GetProperty("type").GetString();
                                if (!string.IsNullOrEmpty(childType) && AllowedNodeTypes.Contains(childType))
                                {
                                    var sanitized = SanitizeNode(child);
                                    if (sanitized.ValueKind != JsonValueKind.Undefined)
                                        sanitizedContent.Add(sanitized);
                                }
                            }
                        }
                        if (sanitizedContent.Count > 0)
                            dict["content"] = sanitizedContent;
                    }
                    break;

                case "marks":
                    if (prop.Value.ValueKind == JsonValueKind.Array)
                    {
                        var sanitizedMarks = new List<object>();
                        foreach (var mark in prop.Value.EnumerateArray())
                        {
                            if (mark.ValueKind == JsonValueKind.Object)
                            {
                                var sanitizedMark = SanitizeMark(mark);
                                if (sanitizedMark != null)
                                    sanitizedMarks.Add(sanitizedMark);
                            }
                        }
                        if (sanitizedMarks.Count > 0)
                            dict["marks"] = sanitizedMarks;
                    }
                    break;

                case "text":
                    dict["text"] = prop.Value.GetString() ?? "";
                    break;
            }
        }

        var json = JsonSerializer.Serialize(dict, options);
        return JsonDocument.Parse(json).RootElement;
    }

    private static Dictionary<string, object?> SanitizeAttrs(JsonElement attrs)
    {
        var result = new Dictionary<string, object?>();

        foreach (var prop in attrs.EnumerateObject())
        {
            switch (prop.Name)
            {
                case "level":
                    if (prop.Value.ValueKind == JsonValueKind.Number)
                        result["level"] = prop.Value.GetInt32();
                    break;

                case "href":
                    var href = prop.Value.GetString();
                    if (!string.IsNullOrEmpty(href) && !href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
                        result["href"] = href;
                    break;

                case "start":
                    if (prop.Value.ValueKind == JsonValueKind.Number)
                        result["start"] = prop.Value.GetInt32();
                    break;
            }
        }

        return result;
    }

    private static Dictionary<string, object?>? SanitizeMark(JsonElement mark)
    {
        var type = mark.GetProperty("type").GetString();
        if (string.IsNullOrEmpty(type) || !AllowedMarkTypes.Contains(type))
            return null;

        var result = new Dictionary<string, object?> { { "type", type } };

        if (mark.TryGetProperty("attrs", out var attrs) && attrs.ValueKind == JsonValueKind.Object)
        {
            var sanitizedAttrs = new Dictionary<string, object?>();
            foreach (var prop in attrs.EnumerateObject())
            {
                if (prop.Name == "href")
                {
                    var href = prop.Value.GetString();
                    if (!string.IsNullOrEmpty(href) && !href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
                    {
                        sanitizedAttrs["href"] = href;
                        sanitizedAttrs["rel"] = "noopener noreferrer nofollow";
                    }
                }
            }
            if (sanitizedAttrs.Count > 0)
                result["attrs"] = sanitizedAttrs;
        }

        return result;
    }
}
