using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface ISupportCatalogueService
    {
        Task EnsureCatalogueSeededAsync();
        Task<List<SupportOpportunity>> GetActiveOpportunitiesAsync(string country, string? region = null);
        Task<SupportOpportunity?> GetOpportunityByIdAsync(string opportunityId);
        Task<List<SupportSourceRegistryRecord>> GetSourceRegistryAsync();
        Task SyncSourceAsync(string sourceId);
        Task<bool> IsSourceFreshAsync(string sourceId);
        Task<SupportSourceSnapshot> RecordSnapshotAsync(string sourceId, string externalId, string? payload = null);
    }
}
