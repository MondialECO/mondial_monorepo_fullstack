using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WebApp.Services
{
    /// <summary>
    /// Sumsub KYC API integration service.
    /// Handles token generation, applicant management, and verification checks.
    ///
    /// API Docs: https://docs.sumsub.com/api-reference
    /// </summary>
    public class SumsubService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SumsubService> _logger;

        private string AppToken => (_configuration["Sumsub:AppToken"] ?? "").Trim();
        private string SecretKey => (_configuration["Sumsub:SecretKey"] ?? "").Trim();
        private string BaseUrl => (_configuration["Sumsub:BaseUrl"] ?? "https://api.sumsub.com").Trim().TrimEnd('/');
        private string WebhookSecret => (_configuration["Sumsub:WebhookSecret"] ?? "").Trim();
        private string LevelName => (_configuration["Sumsub:LevelName"] ?? "").Trim();

        public SumsubService(HttpClient httpClient, IConfiguration configuration, ILogger<SumsubService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        private static bool IsPlaceholder(string? val)
        {
            if (string.IsNullOrWhiteSpace(val)) return true;
            var trimmed = val.Trim();
            return (trimmed.StartsWith("<") && trimmed.EndsWith(">")) ||
                   trimmed.Equals("YOUR_REAL_APP_TOKEN", StringComparison.OrdinalIgnoreCase) ||
                   trimmed.Equals("YOUR_REAL_SECRET_KEY", StringComparison.OrdinalIgnoreCase) ||
                   trimmed.Equals("YOUR_REAL_WEBHOOK_SECRET", StringComparison.OrdinalIgnoreCase) ||
                   trimmed.Equals("<sumsub-app-token>", StringComparison.OrdinalIgnoreCase) ||
                   trimmed.Equals("<sumsub-secret-key>", StringComparison.OrdinalIgnoreCase) ||
                   trimmed.Equals("<sumsub-webhook-secret>", StringComparison.OrdinalIgnoreCase);
        }

        public void ValidateConfiguration(bool requireWebhookSecret = false)
        {
            if (string.IsNullOrWhiteSpace(BaseUrl))
                throw new InvalidOperationException("Sumsub BaseUrl is not configured. Failing closed.");

            if (IsPlaceholder(AppToken))
                throw new InvalidOperationException("Sumsub AppToken is not configured or contains placeholder. Failing closed.");

            if (IsPlaceholder(SecretKey))
                throw new InvalidOperationException("Sumsub SecretKey is not configured or contains placeholder. Failing closed.");

            if (string.IsNullOrWhiteSpace(LevelName))
                throw new InvalidOperationException("Sumsub LevelName is not configured. Failing closed.");

            if (requireWebhookSecret && IsPlaceholder(WebhookSecret))
                throw new InvalidOperationException("Sumsub WebhookSecret is not configured or contains placeholder. Failing closed.");
        }

        /// <summary>
        /// Generate or get access token for a Sumsub applicant using the WebSDK endpoint.
        /// Target Endpoint: POST /resources/accessTokens/sdk
        /// Explicitly binds to the configured verification level (e.g. "id-document-only") in the JSON body.
        /// Fails closed if LevelName or AppToken is missing/unconfigured.
        /// </summary>
        public async Task<string> GenerateAccessTokenAsync(string userId, string email, string? levelName = null)
        {
            var effectiveLevel = !string.IsNullOrWhiteSpace(levelName) ? levelName.Trim() : LevelName;
            if (string.IsNullOrWhiteSpace(effectiveLevel))
            {
                _logger.LogError("Sumsub LevelName is not configured. Failing closed to prevent default level fallback.");
                throw new InvalidOperationException("Sumsub LevelName not configured. Failing closed to prevent default level fallback.");
            }

            ValidateConfiguration();

            try
            {
                // Create or get applicant bound to the specified level
                var applicantId = await EnsureApplicantAsync(userId, email, effectiveLevel);

                // SDK token payload: userId, levelName, ttlInSecs (900s)
                var payload = new
                {
                    userId = userId,
                    levelName = effectiveLevel,
                    ttlInSecs = 900 // 15 minutes
                };

                var bodyJson = JsonSerializer.Serialize(payload);
                var bodyBytes = Encoding.UTF8.GetBytes(bodyJson);

                var url = $"{BaseUrl}/resources/accessTokens/sdk";
                var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Content = new ByteArrayContent(bodyBytes);
                request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

                AddAuthHeaders(request, "POST", url, bodyBytes);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Sumsub token generation failed: {response.StatusCode} - {content}");
                    throw new Exception($"Failed to generate Sumsub token: {response.StatusCode}");
                }

                var jsonDoc = JsonDocument.Parse(content);
                var token = jsonDoc.RootElement.GetProperty("token").GetString();

                _logger.LogInformation($"Generated Sumsub WebSDK token for user {userId} with level {effectiveLevel}");
                return token ?? throw new Exception("No token in response");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating Sumsub token for user {userId} with level {effectiveLevel}");
                throw;
            }
        }

        /// <summary>
        /// Ensure applicant exists in Sumsub, create if not.
        /// Target Endpoint: GET /resources/applicants/-/byExternalUserId/{externalUserId}
        /// </summary>
        private async Task<string> EnsureApplicantAsync(string userId, string email, string? levelName = null)
        {
            var encodedUserId = Uri.EscapeDataString(userId);
            var url = $"{BaseUrl}/resources/applicants/-/byExternalUserId/{encodedUserId}";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            AddAuthHeaders(request, "GET", url, null);

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(content);
                if (jsonDoc.RootElement.TryGetProperty("id", out var idElement))
                {
                    var applicantId = idElement.GetString();
                    if (!string.IsNullOrWhiteSpace(applicantId))
                    {
                        return applicantId;
                    }
                }
                return userId;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // Applicant does not exist yet -> create
                return await CreateApplicantAsync(userId, email, levelName);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to query Sumsub applicant for user {UserId}: {StatusCode} - {Content}", userId, response.StatusCode, errorContent);
                throw new InvalidOperationException($"Failed to query Sumsub applicant: {response.StatusCode}");
            }
        }

        /// <summary>
        /// Create new applicant in Sumsub.
        /// Target Endpoint: POST /resources/applicants?levelName={levelName}
        /// </summary>
        private async Task<string> CreateApplicantAsync(string userId, string email, string? levelName = null)
        {
            var effectiveLevel = !string.IsNullOrWhiteSpace(levelName) ? levelName : LevelName;
            if (string.IsNullOrWhiteSpace(effectiveLevel))
            {
                _logger.LogError("Sumsub LevelName is not configured for applicant creation. Failing closed.");
                throw new InvalidOperationException("Sumsub LevelName not configured. Failing closed to prevent default level fallback.");
            }

            var payload = new
            {
                externalUserId = userId,
                email = email
            };

            var bodyJson = JsonSerializer.Serialize(payload);
            var bodyBytes = Encoding.UTF8.GetBytes(bodyJson);

            var url = $"{BaseUrl}/resources/applicants?levelName={Uri.EscapeDataString(effectiveLevel)}";

            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new ByteArrayContent(bodyBytes);
            request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

            AddAuthHeaders(request, "POST", url, bodyBytes);

            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
                {
                    _logger.LogInformation("Sumsub applicant already exists for user {UserId}. Re-querying existing applicant ID.", userId);
                    return await QueryExistingApplicantIdAsync(userId);
                }

                _logger.LogError("Failed to create Sumsub applicant for user {UserId}: {StatusCode} - {Content}", userId, response.StatusCode, content);
                throw new InvalidOperationException($"Failed to create Sumsub applicant: {response.StatusCode}");
            }

            var jsonDoc = JsonDocument.Parse(content);
            var id = jsonDoc.RootElement.GetProperty("id").GetString();
            _logger.LogInformation("Created Sumsub applicant {ApplicantId} for user {UserId} with level {Level}", id, userId, effectiveLevel);
            return id ?? userId;
        }

        private async Task<string> QueryExistingApplicantIdAsync(string userId)
        {
            try
            {
                var encodedUserId = Uri.EscapeDataString(userId);
                var url = $"{BaseUrl}/resources/applicants/-/byExternalUserId/{encodedUserId}";
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                AddAuthHeaders(request, "GET", url, null);

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var jsonDoc = JsonDocument.Parse(content);
                    if (jsonDoc.RootElement.TryGetProperty("id", out var idElement))
                    {
                        var id = idElement.GetString();
                        if (!string.IsNullOrWhiteSpace(id))
                        {
                            return id;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to re-query applicant ID for user {UserId}", userId);
            }

            return userId;
        }

        /// <summary>
        /// Get verification status for applicant.
        /// Returns status of each verification method (identity, face, phone, etc.)
        /// </summary>
        public async Task<SumsubVerificationStatus> GetVerificationStatusAsync(string externalUserId)
        {
            try
            {
                var encodedUserId = Uri.EscapeDataString(externalUserId);
                var url = $"{BaseUrl}/resources/applicants/-/byExternalUserId/{encodedUserId}";
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                AddAuthHeaders(request, "GET", url, null);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to get Sumsub status: {response.StatusCode}");
                    return new SumsubVerificationStatus { IsError = true };
                }

                var jsonDoc = JsonDocument.Parse(content);
                var root = jsonDoc.RootElement;

                var status = new SumsubVerificationStatus
                {
                    ApplicantId = root.GetProperty("id").GetString(),
                    CreatedAt = root.TryGetProperty("createdAt", out var createdAt)
                        ? createdAt.GetInt64()
                        : 0,
                    IdentityVerified = GetVerificationState(root, "IDENTITY") == "APPROVED",
                    PhoneVerified = GetVerificationState(root, "PHONE") == "APPROVED",
                    EmailVerified = GetVerificationState(root, "EMAIL") == "APPROVED",
                };

                return status;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting Sumsub status for {externalUserId}");
                return new SumsubVerificationStatus { IsError = true };
            }
        }

        /// <summary>
        /// Get verification state for a specific check type.
        /// </summary>
        private string GetVerificationState(JsonElement element, string checkType)
        {
            try
            {
                if (element.TryGetProperty("verification", out var verification))
                {
                    if (verification.TryGetProperty(checkType, out var check))
                    {
                        if (check.TryGetProperty("reviewResult", out var reviewResult))
                        {
                            if (reviewResult.TryGetProperty("reviewAnswer", out var answer))
                            {
                                return answer.GetString() ?? "UNKNOWN";
                            }
                        }
                    }
                }
            }
            catch { }
            return "UNKNOWN";
        }

        /// <summary>
        /// Verify webhook signature from Sumsub.
        /// </summary>
        public bool VerifyWebhookSignature(string body, string signature)
        {
            if (IsPlaceholder(WebhookSecret))
            {
                _logger.LogWarning("Sumsub webhook secret not configured or is a placeholder");
                return false;
            }

            try
            {
                var key = Encoding.UTF8.GetBytes(WebhookSecret);
                using var hmac = new HMACSHA256(key);
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
                var computedSignature = Convert.ToHexString(hash).ToLower();
                var receivedSignature = signature?.ToLower() ?? "";

                return computedSignature == receivedSignature;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying webhook signature");
                return false;
            }
        }

        /// <summary>
        /// Add Sumsub authentication headers to request.
        /// Header: X-App-Token, X-App-Access-Ts, X-App-Access-Sig
        /// Signature = HMAC-SHA256(SecretKey, timestamp + METHOD + URI_WITH_QUERY + EXACT_BODY)
        /// </summary>
        private void AddAuthHeaders(HttpRequestMessage request, string method, string url, byte[]? bodyBytes = null)
        {
            if (IsPlaceholder(AppToken))
            {
                _logger.LogError("Sumsub AppToken is not configured or contains placeholder. Failing closed.");
                throw new InvalidOperationException("Sumsub AppToken is not configured or contains placeholder. Failing closed.");
            }

            request.Headers.Add("X-App-Token", AppToken);

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var signature = GenerateSignature(method, url, timestamp, bodyBytes);
            request.Headers.Add("X-App-Access-Ts", timestamp.ToString());
            request.Headers.Add("X-App-Access-Sig", signature);
        }

        /// <summary>
        /// Generate signature for Sumsub API authentication.
        /// Signature format: HMAC-SHA256(SecretKey, timestamp + HTTP_METHOD + URI_WITH_QUERY + EXACT_REQUEST_BODY)
        /// Fails closed if SecretKey is missing or a placeholder. Never falls back to AppToken.
        /// </summary>
        public string GenerateSignature(string method, string url, long timestamp, byte[]? bodyBytes = null)
        {
            if (IsPlaceholder(SecretKey))
            {
                _logger.LogError("Sumsub SecretKey is not configured or contains placeholder. Failing closed.");
                throw new InvalidOperationException("Sumsub SecretKey is not configured or contains placeholder. Failing closed.");
            }

            // Extract path and query from full URL
            var uri = new Uri(url);
            var pathAndQuery = uri.PathAndQuery;

            var prefixString = $"{timestamp}{method.ToUpperInvariant()}{pathAndQuery}";
            var prefixBytes = Encoding.UTF8.GetBytes(prefixString);
            var bodyPart = bodyBytes != null && bodyBytes.Length > 0 ? bodyBytes : Array.Empty<byte>();

            var dataToSign = new byte[prefixBytes.Length + bodyPart.Length];
            Buffer.BlockCopy(prefixBytes, 0, dataToSign, 0, prefixBytes.Length);
            if (bodyPart.Length > 0)
            {
                Buffer.BlockCopy(bodyPart, 0, dataToSign, prefixBytes.Length, bodyPart.Length);
            }

            var keyBytes = Encoding.UTF8.GetBytes(SecretKey);
            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(dataToSign);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }

    /// <summary>
    /// Sumsub verification status response.
    /// </summary>
    public class SumsubVerificationStatus
    {
        public string ApplicantId { get; set; }
        public long CreatedAt { get; set; }
        public bool IdentityVerified { get; set; }
        public bool PhoneVerified { get; set; }
        public bool EmailVerified { get; set; }
        public bool IsError { get; set; }

        public bool IsAllVerified => IdentityVerified;
    }

    /// <summary>
    /// Sumsub webhook payload.
    /// </summary>
    public class SumsubWebhookPayload
    {
        [System.Text.Json.Serialization.JsonPropertyName("applicantId")]
        public string ApplicantId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("externalUserId")]
        public string ExternalUserId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("reviewStatus")]
        public string ReviewStatus { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("createdAt")]
        public long CreatedAt { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("clientId")]
        public string ClientId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("inspectionId")]
        public string InspectionId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("applicantEmail")]
        public string ApplicantEmail { get; set; }
    }
}
