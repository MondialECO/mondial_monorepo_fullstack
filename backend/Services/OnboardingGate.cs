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
    /// copy of the gate. Promotion stays derived (never hand-set to a phase value
    /// from the outside; callers only flip the item flags this evaluates).
    /// </summary>
    public static class OnboardingGate
    {
        /// <summary>The base 4 mandatory items every role must verify.</summary>
        public static readonly string[] CoreRequired =
            { "identity", "face", "phone", "email" };

        /// <summary>Required item set for universal Phase 1. Every role completes the same core 4.</summary>
        public static HashSet<string> RequiredItemsFor(string role)
            => new(CoreRequired, StringComparer.OrdinalIgnoreCase);

        public static bool IsItemVerified(ApplicationUser user, string key)
        {
            var ob = user.Onboarding;
            return key.ToLowerInvariant() switch
            {
                "identity"  => ob.IdentityDocumentVerified,
                "face"      => ob.FaceVerified,
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
        /// Derived promotion: when all core items are verified, promote onboarding
        /// to Phase 1. Idempotent — never re-promotes (<c>Phase &lt; 1</c> guard) and
        /// never downgrades. Mirrors the legacy Kyc/KycStatus fields so older reads
        /// keep working. <paramref name="audit"/> is optional so callers without an
        /// audit sink (e.g. the admin approval controller) can still promote.
        /// </summary>
        public static async Task PromoteIfCompleteAsync(
            ApplicationUser user,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            var required = RequiredItemsFor(user.User ?? "");
            var allRequiredDone = required.All(key => IsItemVerified(user, key));

            if (allRequiredDone && user.Onboarding.Phase < 1)
            {
                user.Onboarding.Phase = 1;
                user.Onboarding.CompletedAt = DateTime.UtcNow;
                // Mirror the legacy KycStatus so older code keeps working.
                user.KycStatus = "VERIFIED";
                user.Kyc.Status = VerificationStatus.Verified;
                user.Kyc.VerifiedAt = DateTime.UtcNow;
                if (user.Tier_level < 1) user.Tier_level = 1;
                await userManager.UpdateAsync(user);
                audit?.Record("onboarding_complete", user.Email!, true, new { role = user.User });
            }
        }
    }
}
