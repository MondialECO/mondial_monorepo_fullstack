using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface ISupportSourceAdapter
    {
        string SourceId { get; }
        string SourceName { get; }
        string AuthorityLevel { get; }
        string Jurisdiction { get; }
        string GeographicScope { get; }
        string FreshnessPolicy { get; }

        Task<List<SupportOpportunity>> FetchAndNormalizeAsync();
        Task<SupportSourceSnapshot> CreateSnapshotAsync(string opportunityExternalId, string? rawPayload = null);
        Task<bool> ValidateFreshnessAsync(DateTime lastCheckedAt);
        SupportSourceRegistryRecord GetRegistryMetadata();
    }

    public interface IRegionalSupportAdapter : ISupportSourceAdapter
    {
        string TargetRegion { get; }
    }
}
