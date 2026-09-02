using System;
using System.Collections.Generic;

namespace WebApp.Models.Dtos
{
    public class AdminUserListQuery
    {
        public string? Search { get; set; }
        public string? Role { get; set; }
        public string? KycStatus { get; set; }
        public string? LoginStatus { get; set; } // "active" or "locked"
        public string? Country { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
    }

    public class PendingKycListQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
    }

    public class AdminUserListItemDto
    {
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? PublicSlug { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Country { get; set; }
        public List<string> Roles { get; set; } = new();
        public DateTime JoinedAt { get; set; }
        public DateTime? LastLogin { get; set; }
        public string KycStatus { get; set; } = "NotStarted";
        public bool IsLocked { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
        public int OnboardingPhase { get; set; }
    }

    public class AdminPagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public long TotalItems { get; set; }
        public int TotalPages { get; set; }
    }

    public class AdminUserDetailDto
    {
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? ImagePath { get; set; }
        public string? Bio { get; set; }
        public string? Title { get; set; }
        public List<string> Roles { get; set; } = new();
        public DateTime JoinedAt { get; set; }
        public DateTime? LastLogin { get; set; }
        public bool IsLocked { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
        public int OnboardingPhase { get; set; }

        // Verification summary
        public string KycStatus { get; set; } = "NotStarted";
        public bool KycIdentityVerified { get; set; }
        public bool KycFaceVerified { get; set; }
        public DateTime? KycVerifiedAt { get; set; }
        public string? KycRejectionReason { get; set; }

        public bool? SpVerified { get; set; }
        public string? SpVerificationStatus { get; set; }
        public double? SpTrustScore { get; set; }

        public bool? InvestorFinanceVerified { get; set; }
        public string? InvestorFinanceStatus { get; set; }

        // Universal Profile preview
        public AdminUniversalProfileSummary? UniversalProfile { get; set; }

        // Role-specific activity summary metrics
        public AdminRoleActivitySummary RoleActivity { get; set; } = new();
    }

    public class AdminUniversalProfileSummary
    {
        public string? PublicSlug { get; set; }
        public string? Headline { get; set; }
        public string? Bio { get; set; }
        public string? ProfessionalOverview { get; set; }
        public List<string> Skills { get; set; } = new();
        public List<string> ExpertiseDomains { get; set; } = new();
        public List<string> Languages { get; set; } = new();
        public int ExperienceCount { get; set; }
        public int EducationCount { get; set; }
        public int PortfolioItemCount { get; set; }
    }

    public class AdminRoleActivitySummary
    {
        public int CreatorIdeasCount { get; set; }
        public int EntrepreneurCompaniesCount { get; set; }
        public int InvestorMatchesCount { get; set; }
        public int InvestorInvestmentsCount { get; set; }
        public int ServiceProviderListingsCount { get; set; }
        public int ServiceProviderWorkroomsCount { get; set; }
    }

    public class AddUserRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }

    public class RemoveUserRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }

    public class UserLockoutRequest
    {
        public string? UserId { get; set; }
        public string? Reason { get; set; }
    }

    public class AdminVerificationSummaryDto
    {
        public int PendingKycCount { get; set; }
        public int PendingSpCount { get; set; }
        public int PendingInvestorFinanceCount { get; set; }

        public int VerifiedKycCount { get; set; }
        public int VerifiedSpCount { get; set; }
        public int VerifiedInvestorFinanceCount { get; set; }

        public int RejectedKycCount { get; set; }
        public int RejectedSpCount { get; set; }
        public int RejectedInvestorFinanceCount { get; set; }
    }

    public class PendingKycUserDto
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? UserName { get; set; }
        public string? User { get; set; }
        public List<string> Roles { get; set; } = new();
        public string? PhoneNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public PendingKycAddressDto? Address { get; set; }
        public PendingKycDetailDto? Kyc { get; set; }
    }

    public class PendingKycAddressDto
    {
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
    }

    public class PendingKycDetailDto
    {
        public int Status { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string? DocumentType { get; set; }
        public bool DocumentUploaded { get; set; }
        public bool FaceSubmitted { get; set; }
        public PendingKycIdentityDto? Identity { get; set; }
        public PendingKycFaceDto? Face { get; set; }
    }

    public class PendingKycIdentityDto
    {
        public string? DocumentType { get; set; }
        public bool DocumentUploaded { get; set; }
        public int Status { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class PendingKycFaceDto
    {
        public bool FaceSubmitted { get; set; }
        public int Status { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class AdminKycReviewDto
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? UserName { get; set; }
        public string? User { get; set; }
        public List<string> Roles { get; set; } = new();
        public string? PhoneNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public PendingKycAddressDto? Address { get; set; }
        public AdminKycReviewDetailDto? Kyc { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class AdminKycReviewDetailDto
    {
        public int Status { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public AdminKycReviewIdentityDto? Identity { get; set; }
        public AdminKycReviewFaceDto? Face { get; set; }
    }

    public class AdminKycReviewIdentityDto
    {
        public string? DocumentType { get; set; }
        public string? DocumentNumber { get; set; }
        public string? FrontImagePath { get; set; }
        public string? BackImagePath { get; set; }
        public int Status { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }

    public class AdminKycReviewFaceDto
    {
        public string? SelfieImagePath { get; set; }
        public int Status { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }
}
