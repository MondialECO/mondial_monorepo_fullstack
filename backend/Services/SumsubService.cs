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

        public SumsubService(HttpClient httpClient, IConfiguration configuration, ILogger<SumsubService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Generate or get access token for a Sumsub applicant.
        /// Creates new applicant if doesn't exist.
        /// </summary>
        public async Task<string> GenerateAccessTokenAsync(string userId, string email)
        {
            if (string.IsNullOrWhiteSpace(AppToken))
                throw new InvalidOperationException("Sumsub AppToken not configured");

            try
            {
                // Create or get applicant
                var applicantId = await EnsureApplicantAsync(userId, email);

                // Generate access token with 15 minute expiry
                var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();
                var body = new
                {
                    externalUserId = userId,
                    ttlInSecs = 900 // 15 minutes
                };

                var url = $"{BaseUrl}/resources/accessTokens?externalUserId={Uri.EscapeDataString(userId)}";
                var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(body),
                    Encoding.UTF8,
                    "application/json"
                );

                AddAuthHeaders(request, "POST", url);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Sumsub token generation failed: {response.StatusCode} - {content}");
                    throw new Exception($"Failed to generate Sumsub token: {response.StatusCode}");
                }

                var jsonDoc = JsonDocument.Parse(content);
                var token = jsonDoc.RootElement.GetProperty("token").GetString();

                _logger.LogInformation($"Generated Sumsub token for user {userId}");
                return token ?? throw new Exception("No token in response");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating Sumsub token for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Ensure applicant exists in Sumsub, create if not.
        /// </summary>
        private async Task<string> EnsureApplicantAsync(string userId, string email)
        {
            try
            {
                // Check if applicant exists
                var url = $"{BaseUrl}/resources/applicants?externalUserId={Uri.EscapeDataString(userId)}";
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                AddAuthHeaders(request, "GET", url);

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
                return await CreateApplicantAsync(userId, email);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error checking/creating Sumsub applicant for {userId}, proceeding");
                return userId; // Fallback to userId as applicant ID
            }
        }

        /// <summary>
        /// Create new applicant in Sumsub.
        /// </summary>
        private async Task<string> CreateApplicantAsync(string userId, string email)
        {
            try
            {
                var body = new
                {
                    externalUserId = userId,
                    email = email,
                    phone = "+1000000000" // Placeholder
                };

                var url = $"{BaseUrl}/resources/applicants";
                var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(body),
                    Encoding.UTF8,
                    "application/json"
                );

                AddAuthHeaders(request, "POST", url);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Failed to create Sumsub applicant: {response.StatusCode}");
                    return userId; // Fallback
                }

                var jsonDoc = JsonDocument.Parse(content);
                var id = jsonDoc.RootElement.GetProperty("id").GetString();
                _logger.LogInformation($"Created Sumsub applicant {id} for user {userId}");
                return id ?? userId;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error creating Sumsub applicant");
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
                AddAuthHeaders(request, "GET", url);

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
                    FaceVerified = GetVerificationState(root, "SELFIE") == "APPROVED",
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
        /// Uses X-App-Token and custom signature for POST/PUT/DELETE.
        /// </summary>
        private void AddAuthHeaders(HttpRequestMessage request, string method, string url)
        {
            request.Headers.Add("X-App-Token", AppToken);

            // Only sign POST, PUT, DELETE requests
            if (method == "POST" || method == "PUT" || method == "DELETE")
            {
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var signature = GenerateSignature(method, url, timestamp);
                request.Headers.Add("X-App-Access-Ts", timestamp.ToString());
                request.Headers.Add("X-App-Access-Sig", signature);
            }
        }

        /// <summary>
        /// Generate signature for Sumsub API authentication.
        /// Signature = HMAC-SHA256(AppToken, "method|path|timestamp")
        /// </summary>
        private string GenerateSignature(string method, string url, long timestamp)
        {
            // Extract path from full URL
            var uri = new Uri(url);
            var path = uri.PathAndQuery;

            var signatureBase = $"{method.ToUpper()}|{path}|{timestamp}";
            var key = Encoding.UTF8.GetBytes(AppToken);

            using var hmac = new HMACSHA256(key);
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signatureBase));
            return Convert.ToHexString(hash).ToLower();
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
        public bool FaceVerified { get; set; }
        public bool PhoneVerified { get; set; }
        public bool EmailVerified { get; set; }
        public bool IsError { get; set; }

        public bool IsAllVerified => IdentityVerified && FaceVerified;
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
