using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    public class IdentityDocumentOptionDto
    {
        public string Type { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool RequiresBack { get; set; }
    }

    public class IdentityConfigDto
    {
        public string Country { get; set; } = "FR";
        public bool AllowLegacyUpload { get; set; }
        public List<IdentityDocumentOptionDto> Documents { get; set; } = new();
    }

    public class IdentitySessionDto
    {
        public string VerificationId { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string? ApplicantId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string IssuingCountry { get; set; } = string.Empty;
    }

    public class IdentityStatusDto
    {
        public bool Required { get; set; }
        public bool Verified { get; set; }
        public string Status { get; set; } = "not_started";
        public string? DocumentType { get; set; }
        public string? IssuingCountry { get; set; }
        public string? ReviewReason { get; set; }
        public string? Provenance { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }

    public class StartSessionRequest
    {
        public string? CountryCode { get; set; } = "FR";
        public string DocumentType { get; set; } = string.Empty;
        public string? IssuingCountry { get; set; }
        public string? Nationality { get; set; }
    }

    public interface IIdentityVerificationService
    {
        IdentityConfigDto GetIdentityConfig(string countryCode);

        Task<IdentitySessionDto> CreateOrGetSessionAsync(
            string userId,
            string countryCode,
            string documentType,
            string? issuingCountry = null,
            string? nationality = null);

        Task<IdentityStatusDto> GetCurrentStatusAsync(string userId);

        Task<bool> ProcessProviderWebhookAsync(string rawBody, string signature, string? eventId = null);

        Task<UniversalIdentityVerification> RecordManualUploadAsync(
            string userId,
            string documentType,
            string frontPath,
            string? backPath,
            string? issuingCountry = null);

        Task<bool> RecordAdminDecisionAsync(
            string userId,
            string adminId,
            bool approved,
            string? reason = null,
            string? internalNote = null);

        Task<bool> RetryVerificationAsync(string userId);
    }
}
