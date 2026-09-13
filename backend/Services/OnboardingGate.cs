using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
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
    /// Final Universal Requirements:
    /// EMAIL + PHONE + VERIFIED IDENTITY DOCUMENT = PHASE 1.
    /// Face verification is completely removed.
    /// </summary>
    public static class OnboardingGate
    {
        /// <summary>The final 3 mandatory universal items every role must verify.</summary>
        public static readonly string[] CoreRequired =
            { "identity", "phone", "email" };

        /// <summary>Required item set for universal Phase 1. Every role completes the same 3 core items.</summary>
        public static HashSet<string> RequiredItemsFor(string role)
        {
            return new(CoreRequired, StringComparer.OrdinalIgnoreCase);
        }

        public static bool IsItemVerified(ApplicationUser user, string key)
        {
            var ob = user.Onboarding;
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
        /// Derived promotion: when all core items are verified (Email + Phone + Identity), promote onboarding
        /// to Phase 1. Idempotent — never re-promotes (<c>Phase &lt; 1</c> guard) and
        /// never downgrades. Mirrors the legacy Kyc/KycStatus fields so older reads
        /// keep working.
        /// </summary>
        public static async Task PromoteIfCompleteAsync(
            ApplicationUser user,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            if (user.Onboarding == null) return;

            var complete =
                user.Onboarding.EmailOtpVerified &&
                user.Onboarding.PhoneVerified &&
                user.Onboarding.IdentityDocumentVerified;

            if (complete && user.Onboarding.Phase < 1)
            {
                user.Onboarding.Phase = 1;
                user.Onboarding.CompletedAt = DateTime.UtcNow;
                // Mirror the legacy KycStatus so older code keeps working.
                user.KycStatus = "VERIFIED";
                user.Kyc ??= new KycVerification();
                user.Kyc.Status = VerificationStatus.Verified;
                user.Kyc.VerifiedAt = DateTime.UtcNow;
                if (user.Tier_level < 1) user.Tier_level = 1;
                await userManager.UpdateAsync(user);
                audit?.Record("onboarding_complete", user.Email!, true, new { role = user.User });
            }
        }
    }
}
