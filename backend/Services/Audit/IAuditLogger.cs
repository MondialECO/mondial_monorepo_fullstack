using System;
using System.Collections;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Audit
{
    /// <summary>
    /// Structured audit trail for security-sensitive operations
    /// (authentication, credential changes, privileged/destructive actions).
    /// Emitted on a dedicated "Audit" log category with the request
    /// correlation id so events can be filtered and traced, and persisted
    /// into the queryable AdminAuditLogs collection.
    /// </summary>
    public interface IAuditLogger
    {
        void Record(string action, string actor, bool success, object? details = null);
    }

    public class AuditLogger : IAuditLogger
    {
        private readonly ILogger _logger;
        private readonly IHttpContextAccessor _http;
        private readonly IServiceProvider _serviceProvider;

        private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "password", "passwordhash", "securitystamp", "currentpassword", "newpassword",
            "token", "jwt", "secret", "otp", "code", "pin", "cvv", "card",
            "accountnumber", "iban", "bankaccount", "documentnumber", "idnumber",
            "evidence", "frontimage", "backimage", "selfieimage", "proofoffunds"
        };

        public AuditLogger(ILoggerFactory loggerFactory, IHttpContextAccessor http, IServiceProvider serviceProvider)
        {
            _logger = loggerFactory.CreateLogger("Audit");
            _http = http;
            _serviceProvider = serviceProvider;
        }

        public void Record(string action, string actor, bool success, object? details = null)
        {
            var ctx = _http.HttpContext;
            var ip = ctx?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var correlationId = ctx?.TraceIdentifier ?? "none";

            _logger.LogInformation(
                "AUDIT {Action} actor={Actor} success={Success} ip={Ip} correlationId={CorrelationId} details={@Details}",
                action,
                actor,
                success,
                ip,
                correlationId,
                details);

            // Asynchronously & safely persist to MongoDb without blocking callers
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetService<MongoDbContext>();
                    if (db == null) return;

                    var (targetType, targetId, sanitizedDoc) = SanitizeAndExtractDetails(details);

                    var auditEntry = new AdminAuditLog
                    {
                        Action = action,
                        Actor = string.IsNullOrWhiteSpace(actor) ? "system" : actor,
                        Success = success,
                        TargetType = targetType,
                        TargetId = targetId,
                        IpAddress = ip,
                        CorrelationId = correlationId,
                        Timestamp = DateTime.UtcNow,
                        Details = sanitizedDoc
                    };

                    await db.AdminAuditLogs.InsertOneAsync(auditEntry);
                }
                catch
                {
                    // Fail-safe: Audit DB failures must never crash request pipeline
                }
            });
        }

        private static (string? TargetType, string? TargetId, BsonDocument? SanitizedDoc) SanitizeAndExtractDetails(object? details)
        {
            if (details == null) return (null, null, null);

            try
            {
                var json = JsonSerializer.Serialize(details);
                using var jsonDoc = JsonDocument.Parse(json);
                var bsonDoc = new BsonDocument();
                string? targetType = null;
                string? targetId = null;

                if (jsonDoc.RootElement.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in jsonDoc.RootElement.EnumerateObject())
                    {
                        var name = prop.Name;
                        if (SensitiveKeys.Contains(name))
                        {
                            bsonDoc[name] = "[REDACTED]";
                            continue;
                        }

                        // Target detection heuristics
                        if (string.Equals(name, "targetType", StringComparison.OrdinalIgnoreCase))
                            targetType = prop.Value.GetString();
                        else if (string.Equals(name, "targetId", StringComparison.OrdinalIgnoreCase))
                            targetId = prop.Value.GetString();
                        else if (string.Equals(name, "serviceId", StringComparison.OrdinalIgnoreCase))
                        {
                            targetType ??= "ServiceListing";
                            targetId ??= prop.Value.GetString();
                        }
                        else if (string.Equals(name, "ideaId", StringComparison.OrdinalIgnoreCase))
                        {
                            targetType ??= "CreatorOffer";
                            targetId ??= prop.Value.GetString();
                        }
                        else if (string.Equals(name, "reviewId", StringComparison.OrdinalIgnoreCase))
                        {
                            targetType ??= "Review";
                            targetId ??= prop.Value.GetString();
                        }
                        else if (string.Equals(name, "userId", StringComparison.OrdinalIgnoreCase))
                        {
                            targetType ??= "UserProfile";
                            targetId ??= prop.Value.GetString();
                        }
                        else if (string.Equals(name, "reportId", StringComparison.OrdinalIgnoreCase))
                        {
                            targetType ??= "ContentReport";
                            targetId ??= prop.Value.GetString();
                        }

                        switch (prop.Value.ValueKind)
                        {
                            case JsonValueKind.String:
                                bsonDoc[name] = prop.Value.GetString();
                                break;
                            case JsonValueKind.Number:
                                if (prop.Value.TryGetInt64(out var l)) bsonDoc[name] = l;
                                else if (prop.Value.TryGetDouble(out var d)) bsonDoc[name] = d;
                                break;
                            case JsonValueKind.True:
                            case JsonValueKind.False:
                                bsonDoc[name] = prop.Value.GetBoolean();
                                break;
                            case JsonValueKind.Null:
                                bsonDoc[name] = BsonNull.Value;
                                break;
                            default:
                                bsonDoc[name] = prop.Value.ToString();
                                break;
                        }
                    }
                }

                return (targetType, targetId, bsonDoc);
            }
            catch
            {
                return (null, null, new BsonDocument("raw", details.ToString() ?? ""));
            }
        }
    }
}
