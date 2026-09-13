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

        private string AppToken => _configuration["Sumsub:AppToken"] ?? "";
        private string BaseUrl => _configuration["Sumsub:BaseUrl"] ?? "https://api.sumsub.com";
        private string WebhookSecret => _configuration["Sumsub:WebhookSecret"] ?? "";
        private string LevelName => _configuration["Sumsub:LevelName"] ?? "";

        public SumsubService(HttpClient httpClient, IConfiguration configuration, ILogger<SumsubService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Generate or get access token for a Sumsub applicant using the WebSDK endpoint.
        /// Target Endpoint: POST /resources/accessTokens/sdk
        /// Explicitly binds to the configured verification level (e.g. "id-document-only") in the JSON body.
        /// Fails closed if LevelName or AppToken is missing/unconfigured.
        /// </summary>
        public async Task<string> GenerateAccessTokenAsync(string userId, string email, string? levelName = null)
        {
            var effectiveLevel = !string.IsNullOrWhiteSpace(levelName) ? levelName : LevelName;
            if (string.IsNullOrWhiteSpace(effectiveLevel))
            {
                _logger.LogError("Sumsub LevelName is not configured. Failing closed to prevent default level fallback.");
                throw new InvalidOperationException("Sumsub LevelName not configured. Failing closed to prevent default level fallback.");
            }

            if (string.IsNullOrWhiteSpace(AppToken))
                throw new InvalidOperationException("Sumsub AppToken not configured");

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
        /// </summary>
        private async Task<string> EnsureApplicantAsync(string userId, string email, string? levelName = null)
        {
            try
            {
                // Check if applicant exists
                var url = $"{BaseUrl}/resources/applicants?externalUserId={Uri.EscapeDataString(userId)}";
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                AddAuthHeaders(request, "GET", url, null);

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var jsonDoc = JsonDocument.Parse(content);
                    if (jsonDoc.RootElement.TryGetProperty("id", out var idElement))
                    {
                        return idElement.GetString() ?? userId;
                    }
                }

                // Create new applicant if not found
                return await CreateApplicantAsync(userId, email, levelName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error checking/creating Sumsub applicant for {userId}, proceeding");
                return userId; // Fallback to userId as applicant ID
            }
        }

        /// <summary>
        /// Create new applicant in Sumsub.
        /// Target Endpoint: POST /resources/applicants?levelName={levelName}
        /// </summary>
        private async Task<string> CreateApplicantAsync(string userId, string email, string? levelName = null)
        {
            try
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
                    _logger.LogWarning($"Failed to create Sumsub applicant: {response.StatusCode} - {content}");
                    return userId; // Fallback
                }

                var jsonDoc = JsonDocument.Parse(content);
                var id = jsonDoc.RootElement.GetProperty("id").GetString();
                _logger.LogInformation($"Created Sumsub applicant {id} for user {userId} with level {effectiveLevel}");
                return id ?? userId;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error creating Sumsub applicant for user {userId}");
                return userId;
            }
        }

        /// <summary>
        /// Get verification status for applicant.
        /// Returns status of each verification method (identity, face, phone, etc.)
        /// </summary>
        public async Task<SumsubVerificationStatus> GetVerificationStatusAsync(string externalUserId)
        {
            try
            {
                var url = $"{BaseUrl}/resources/applicants?externalUserId={Uri.EscapeDataString(externalUserId)}";
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
            if (string.IsNullOrWhiteSpace(WebhookSecret))
            {
                _logger.LogWarning("Sumsub webhook secret not configured");
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
            request.Headers.Add("X-App-Token", AppToken);

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var signature = GenerateSignature(method, url, timestamp, bodyBytes);
            request.Headers.Add("X-App-Access-Ts", timestamp.ToString());
            request.Headers.Add("X-App-Access-Sig", signature);
        }

        /// <summary>
        /// Generate signature for Sumsub API authentication.
        /// Signature format: HMAC-SHA256(SecretKey, timestamp + HTTP_METHOD + URI_WITH_QUERY + EXACT_REQUEST_BODY)
        /// </summary>
        public string GenerateSignature(string method, string url, long timestamp, byte[]? bodyBytes = null)
        {
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

            var signingKey = !string.IsNullOrWhiteSpace(_configuration["Sumsub:SecretKey"])
                ? _configuration["Sumsub:SecretKey"]!
                : AppToken;

            var keyBytes = Encoding.UTF8.GetBytes(signingKey);
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
