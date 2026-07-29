using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// One professional credential as its own root document (UserCredentials
    /// collection). The _id is the credential's stable GUID string, so embedded
    /// credentials migrate with their ids preserved verbatim.
    ///
    /// Ownership is server-verified: UserId always comes from the authenticated
    /// principal and every lookup is scoped to it. Status is server-controlled —
    /// provider actions may only ever produce Draft or PendingReview; Verified,
    /// Rejected and ResubmissionRequired require authorised review, and Expired is
    /// derived from ExpiresAt at projection time, never persisted.
    ///
    /// The document reference reuses ProviderMediaAsset: StorageKey stays
    /// server-only, PublicUrl is owner-visible only (public projections show
    /// Verified credential summaries without URL, number or note). Physical files
    /// stay in the existing SaveFile folder — only references live here; no binary
    /// or Base64 content is ever stored.
    /// </summary>
    public class UserCredentialRecord
    {
        [BsonId]
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        /// <summary>Owning ApplicationUser id. Never accepted from a request body.</summary>
        public string UserId { get; set; } = "";

        public CredentialKind Kind { get; set; } = CredentialKind.Certification;
        public string Title { get; set; } = "";
        public string? IssuingOrganization { get; set; }

        public DateTime? IssuedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }

        /// <summary>Provider-supplied reference number. Owner-only; never public.</summary>
        public string? CredentialNumber { get; set; }

        public ProviderMediaAsset? Document { get; set; }

        /// <summary>Original file name, display-only (Path.GetFileName-stripped).
        /// Never used to build a filesystem path.</summary>
        public string? DocumentFileName { get; set; }

        public CredentialStatus Status { get; set; } = CredentialStatus.Draft;

        /// <summary>Provider-facing remediation reason only. Internal reviewer
        /// notes are deliberately not modelled here.</summary>
        public string? ReviewNote { get; set; }

        /// <summary>Which role contexts this credential applies to. Initially
        /// always [ServiceProvider]; extensible without a schema change.</summary>
        public List<CredentialApplicableRole> ApplicableRoles { get; set; } = new()
        {
            CredentialApplicableRole.ServiceProvider,
        };

        public DateTime? SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Role context a credential applies to. Serialized as Int32 ordinals like the
    /// other Service Provider enums — append new roles at the end, never reorder.
    /// Only ServiceProvider is consumed today.
    /// </summary>
    public enum CredentialApplicableRole
    {
        ServiceProvider,
    }
}
