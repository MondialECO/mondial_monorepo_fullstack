using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Audit;

namespace WebApp.Services
{
    /// <summary>
    /// Single source of truth for the universal Phase-1 gate: which items are
    /// required, whether an item is verified, and the derived promotion to
    /// <c>Onboarding.Phase == 1</c>. Shared so the self-serve onboarding flow AND
    /// the concierge admin KYC-approval path evaluate the SAME rule — no second
    /// copy of the gate.
    /// 
    /// Current Universal MVP Policy:
    /// EMAIL = PHASE 1 (Phone & Identity verification are optional/deferred).
    /// Reversible via FeatureFlags:RequirePhoneVerificationInUniversalOnboarding
    /// and FeatureFlags:RequireIdentityVerificationInUniversalOnboarding.
    /// </summary>
    public static class OnboardingGate
    {
        public const string RequireIdentityFlagKey = "FeatureFlags:RequireIdentityVerificationInUniversalOnboarding";
        public const string RequirePhoneFlagKey = "FeatureFlags:RequirePhoneVerificationInUniversalOnboarding";

        /// <summary>
        /// Reads whether identity verification is required for Universal Phase 1 from configuration.
        /// Defaults to false (deferred).
        /// </summary>
        public static bool IsIdentityRequired(IConfiguration? config)
        {
            if (config == null) return false;
            return config.GetValue<bool>(RequireIdentityFlagKey, false);
        }

        /// <summary>
        /// Reads whether phone verification is required for Universal Phase 1 from configuration.
        /// Defaults to false (optional).
        /// </summary>
        public static bool IsPhoneRequired(IConfiguration? config)
        {
            if (config == null) return false;
            return config.GetValue<bool>(RequirePhoneFlagKey, false);
        }

        /// <summary>Required item set for universal Phase 1 based on active configuration policy.</summary>
        public static HashSet<string> RequiredItemsFor(string role, IConfiguration? config = null)
        {
            var items = new List<string> { "email" };
            if (IsPhoneRequired(config))
            {
                items.Add("phone");
            }
            if (IsIdentityRequired(config))
            {
                items.Add("identity");
            }
            return new HashSet<string>(items, StringComparer.OrdinalIgnoreCase);
        }

        public static bool IsItemVerified(ApplicationUser user, string key)
        {
            var ob = user?.Onboarding;
            if (ob == null) return false;

            return key.ToLowerInvariant() switch
            {
                "identity"  => ob.IdentityDocumentVerified,
                "phone"     => ob.PhoneVerified,
                "email"     => ob.EmailOtpVerified,
                "residence" => ob.Residence?.Uploaded ?? false,
                "income"    => ob.Income?.Uploaded ?? false,
                "tax"       => ob.Tax?.Uploaded ?? false,
                "license"   => ob.License?.Uploaded ?? false,
                _ => false,
            };
        }

        /// <summary>
        /// Authoritative completion evaluation for Universal Phase 1.
        /// Email verification is always required.
        /// When RequirePhone = false (MVP default): Phone verification is optional.
        /// When RequireIdentity = false (MVP default): Identity document verification is deferred.
        /// </summary>
        public static bool IsComplete(ApplicationUser user, IConfiguration? config = null)
        {
            if (user?.Onboarding == null) return false;
            var requireIdentity = IsIdentityRequired(config);
            var requirePhone = IsPhoneRequired(config);
            return user.Onboarding.EmailOtpVerified &&
                   (!requirePhone || user.Onboarding.PhoneVerified) &&
                   (!requireIdentity || user.Onboarding.IdentityDocumentVerified);
        }

        /// <summary>
        /// Derived promotion: when required core items are verified, promote onboarding
        /// to Phase 1. Idempotent — never re-promotes (<c>Phase &lt; 1</c> guard) and
        /// never downgrades. Sets KycStatus = "VERIFIED" only when IdentityDocumentVerified == true.
        /// </summary>
        public static async Task PromoteIfCompleteAsync(
            ApplicationUser user,
            UserManager<ApplicationUser> userManager,
            IConfiguration? config,
            IAuditLogger? audit)
        {
            if (user?.Onboarding == null) return;

            var complete = IsComplete(user, config);

            if (complete && user.Onboarding.Phase < 1)
            {
                user.Onboarding.Phase = 1;
                user.Onboarding.CompletedAt = DateTime.UtcNow;

                // KycStatus is set to VERIFIED only if the identity document has actually been verified
                if (user.Onboarding.IdentityDocumentVerified)
                {
                    user.KycStatus = "VERIFIED";
                    user.Kyc ??= new KycVerification();
                    user.Kyc.Status = VerificationStatus.Verified;
                    user.Kyc.VerifiedAt = DateTime.UtcNow;
                }

                if (user.Tier_level < 1) user.Tier_level = 1;
                await userManager.UpdateAsync(user);
                audit?.Record("onboarding_complete", user.Email!, true, new { role = user.User });
            }
        }

        public static Task PromoteIfCompleteAsync(
            ApplicationUser user,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
            => PromoteIfCompleteAsync(user, userManager, (IConfiguration?)null, audit);

        public static Task PromoteIfCompleteAsync(
            ApplicationUser user,
            UserManager<ApplicationUser> userManager,
            IConfiguration? config)
            => PromoteIfCompleteAsync(user, userManager, config, (IAuditLogger?)null);
    }
}
