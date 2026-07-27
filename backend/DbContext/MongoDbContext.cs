using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDbGenericRepository;
using WebApp.Models.DatabaseModels;
namespace WebApp.DbContext
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            _database = client.GetDatabase(settings.Value.DatabaseName);
            EnsureMatchmakingQueueIndexes();
            EnsurePhase4Indexes();
            EnsurePhase6Indexes();
            EnsurePhase9Indexes();
            EnsureCreatorJourneyIndexes();
            EnsureServiceCatalogIndexes();
            EnsureLeadsIndexes();
        }

        public MongoDbContext(IMongoDatabase database)
        {
            _database = database;
            EnsureMatchmakingQueueIndexes();
            EnsurePhase4Indexes();
            EnsurePhase6Indexes();
            EnsurePhase9Indexes();
            EnsureCreatorJourneyIndexes();
            EnsureServiceCatalogIndexes();
            EnsureLeadsIndexes();
        }

        // Smart Matchmaking outbox indexes: Status (consumer polling), CompanyId
        // (lookup/dedup), CreatedAt desc (ordering). Background builds; not a TTL
        // index — the outbox is durable, not ephemeral. Best-effort + swallowed so
        // context construction never blocks or fails (unit tests mock the context
        // and the MatchmakingQueue getter is unset, so this no-ops there).
        private void EnsureMatchmakingQueueIndexes()
        {
            try
            {
                var models = new[]
                {
                    new CreateIndexModel<MatchmakingQueueItem>(
                        Builders<MatchmakingQueueItem>.IndexKeys.Ascending(x => x.Status),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<MatchmakingQueueItem>(
                        Builders<MatchmakingQueueItem>.IndexKeys.Ascending(x => x.CompanyId),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<MatchmakingQueueItem>(
                        Builders<MatchmakingQueueItem>.IndexKeys.Descending(x => x.CreatedAt),
                        new CreateIndexOptions { Background = true }),
                };
                MatchmakingQueue.Indexes.CreateMany(models);
            }
            catch
            {
                // Best-effort; never block or fail context construction.
            }
        }

        // Phase 4 sub-collection indexes. Same best-effort + swallowed pattern as
        // the matchmaking outbox: lookup by CompanyId, ordering by RecordedAt/
        // EventDate/IssuedAt/Version, plus a unique composite {CompanyId, GrantId}
        // on vesting schedules that enforces the upsert-key invariant at the DB
        // level. Background builds; never block or fail context construction.
        private void EnsurePhase4Indexes()
        {
            try
            {
                Phase4CapTables.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Phase4CapTable>(
                        Builders<Phase4CapTable>.IndexKeys.Ascending(x => x.CompanyId),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Phase4CapTable>(
                        Builders<Phase4CapTable>.IndexKeys.Descending(x => x.RecordedAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Phase4CapTable>(
                        Builders<Phase4CapTable>.IndexKeys.Descending(x => x.Version),
                        new CreateIndexOptions { Background = true }),
                });

                Phase4VestingSchedules.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Phase4VestingSchedule>(
                        Builders<Phase4VestingSchedule>.IndexKeys.Ascending(x => x.CompanyId),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Phase4VestingSchedule>(
                        Builders<Phase4VestingSchedule>.IndexKeys
                            .Ascending(x => x.CompanyId).Ascending(x => x.GrantId),
                        new CreateIndexOptions { Background = true, Unique = true }),
                });

                Phase4OwnershipHistories.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Phase4OwnershipHistory>(
                        Builders<Phase4OwnershipHistory>.IndexKeys.Ascending(x => x.CompanyId),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Phase4OwnershipHistory>(
                        Builders<Phase4OwnershipHistory>.IndexKeys.Descending(x => x.EventDate),
                        new CreateIndexOptions { Background = true }),
                });

                Phase4ShareIssuances.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Phase4ShareIssuance>(
                        Builders<Phase4ShareIssuance>.IndexKeys.Ascending(x => x.CompanyId),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Phase4ShareIssuance>(
                        Builders<Phase4ShareIssuance>.IndexKeys.Descending(x => x.IssuedAt),
                        new CreateIndexOptions { Background = true }),
                });
            }
            catch
            {
                // Best-effort; never block or fail context construction.
            }
        }

        // Phase 6 data-room access-log indexes. Analytics and the activity
        // timeline both query by CompanyId; the timeline sorts by OccurredAt and
        // engagement groups by InvestorId. Same best-effort + swallowed pattern.
        private void EnsurePhase6Indexes()
        {
            try
            {
                Phase6AccessLogs.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Phase6AccessLog>(
                        Builders<Phase6AccessLog>.IndexKeys
                            .Ascending(x => x.CompanyId).Descending(x => x.OccurredAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Phase6AccessLog>(
                        Builders<Phase6AccessLog>.IndexKeys
                            .Ascending(x => x.CompanyId).Ascending(x => x.InvestorId),
                        new CreateIndexOptions { Background = true }),
                });
            }
            catch
            {
                // Best-effort; never block or fail context construction.
            }
        }

        // Phase 9 deal-pipeline indexes. Primary deal lookup by company + status,
        // activity timeline by company + timestamp, and deal documents by recency.
        // Same best-effort + swallowed pattern.
        private void EnsurePhase9Indexes()
        {
            try
            {
                DealExecutions.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<DealExecution>(
                        Builders<DealExecution>.IndexKeys
                            .Ascending(x => x.CompanyId).Ascending(x => x.Status),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<DealExecution>(
                        Builders<DealExecution>.IndexKeys
                            .Ascending(x => x.CompanyId).Descending(x => x.CreatedAt),
                        new CreateIndexOptions { Background = true }),
                });

                Phase9DealActivityLogs.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Phase9DealActivityLog>(
                        Builders<Phase9DealActivityLog>.IndexKeys
                            .Ascending(x => x.CompanyId).Descending(x => x.OccurredAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Phase9DealActivityLog>(
                        Builders<Phase9DealActivityLog>.IndexKeys
                            .Ascending(x => x.DealId).Descending(x => x.OccurredAt),
                        new CreateIndexOptions { Background = true }),
                });

                Phase9DealTimelineEvents.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Phase9DealTimelineEvent>(
                        Builders<Phase9DealTimelineEvent>.IndexKeys
                            .Ascending(x => x.CompanyId).Ascending(x => x.EventDate),
                        new CreateIndexOptions { Background = true }),
                });
            }
            catch
            {
                // Best-effort; never block or fail context construction.
            }
        }

        // Creator journey (Phases 2–6 source of truth). One doc per user; status is
        // DERIVED on read, never stored. Unique {UserId} enforces one-per-user;
        // {BusinessIdeaId}/{CompanyId} support reverse lookups. Same best-effort +
        // swallowed pattern as the other Ensure*Indexes methods.
        private void EnsureCreatorJourneyIndexes()
        {
            try
            {
                CreatorJourneys.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<CreatorJourney>(
                        Builders<CreatorJourney>.IndexKeys.Ascending(x => x.UserId),
                        new CreateIndexOptions { Background = true, Unique = true }),
                    new CreateIndexModel<CreatorJourney>(
                        Builders<CreatorJourney>.IndexKeys.Ascending(x => x.BusinessIdeaId),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<CreatorJourney>(
                        Builders<CreatorJourney>.IndexKeys.Ascending(x => x.CompanyId),
                        new CreateIndexOptions { Background = true }),
                });
            }
            catch
            {
                // Best-effort; never block or fail context construction.
            }
        }

        public virtual IMongoCollection<ApplicationUser> ApplicationUsers => _database.GetCollection<ApplicationUser>("ApplicationUsers");

        // Creator journey collection (Phases 2–6 source of truth)
        public virtual IMongoCollection<CreatorJourney> CreatorJourneys => _database.GetCollection<CreatorJourney>("CreatorJourneys");

        // IP valuation audit log (Phase 5 Path A)
        public virtual IMongoCollection<IpValuationRecord> IpValuations => _database.GetCollection<IpValuationRecord>("IpValuations");

        // Entrepreneur profiles created at Level Up (Phase 6)
        public virtual IMongoCollection<EntrepreneurProfileRecord> EntrepreneurProfiles => _database.GetCollection<EntrepreneurProfileRecord>("EntrepreneurProfiles");

        // Smart-match run snapshots (Phase 6)
        public virtual IMongoCollection<SmartMatchRun> SmartMatchRuns => _database.GetCollection<SmartMatchRun>("SmartMatchRuns");

        // Business Collections
        public virtual IMongoCollection<BusinessIdeas> BusinessIdeas => _database.GetCollection<BusinessIdeas>("BusinessIdeas");
        public virtual IMongoCollection<IdeaClick> IdeaClicks => _database.GetCollection<IdeaClick>("IdeaClicks");
        public virtual IMongoCollection<Investments> Investments => _database.GetCollection<Investments>("Investments");
        public virtual IMongoCollection<Transactions> Transactions => _database.GetCollection<Transactions>("Transactions");

        // Entrepreneur Collections
        public virtual IMongoCollection<Companies> Companies => _database.GetCollection<Companies>("Companies");
        public virtual IMongoCollection<InvestorMatch> InvestorMatches => _database.GetCollection<InvestorMatch>("InvestorMatches");
        public virtual IMongoCollection<DealExecution> DealExecutions => _database.GetCollection<DealExecution>("DealExecutions");
        public virtual IMongoCollection<Investor> Investors => _database.GetCollection<Investor>("Investors");

        // Phase 3 sub-collections
        public virtual IMongoCollection<Phase3Kpi> Phase3Kpis => _database.GetCollection<Phase3Kpi>("Phase3Kpis");
        public virtual IMongoCollection<Phase3MonthlyRevenue> Phase3MonthlyRevenues => _database.GetCollection<Phase3MonthlyRevenue>("Phase3MonthlyRevenues");
        public virtual IMongoCollection<Phase3FinancialReport> Phase3FinancialReports => _database.GetCollection<Phase3FinancialReport>("Phase3FinancialReports");
        public virtual IMongoCollection<Phase3Concept> Phase3Concepts => _database.GetCollection<Phase3Concept>("Phase3Concepts");

        // Smart Matchmaking outbox
        public virtual IMongoCollection<MatchmakingQueueItem> MatchmakingQueue => _database.GetCollection<MatchmakingQueueItem>("MatchmakingQueue");

        // Phase 4 sub-collections
        public virtual IMongoCollection<Phase4CapTable> Phase4CapTables => _database.GetCollection<Phase4CapTable>("Phase4CapTables");
        public virtual IMongoCollection<Phase4VestingSchedule> Phase4VestingSchedules => _database.GetCollection<Phase4VestingSchedule>("Phase4VestingSchedules");
        public virtual IMongoCollection<Phase4OwnershipHistory> Phase4OwnershipHistories => _database.GetCollection<Phase4OwnershipHistory>("Phase4OwnershipHistories");
        public virtual IMongoCollection<Phase4ShareIssuance> Phase4ShareIssuances => _database.GetCollection<Phase4ShareIssuance>("Phase4ShareIssuances");

        // Phase 6 sub-collections
        public virtual IMongoCollection<Phase6AccessLog> Phase6AccessLogs => _database.GetCollection<Phase6AccessLog>("Phase6AccessLogs");
        public virtual IMongoCollection<Phase6NdaAcceptance> Phase6NdaAcceptances => _database.GetCollection<Phase6NdaAcceptance>("Phase6NdaAcceptances");

        // Phase 7 sub-collections
        public virtual IMongoCollection<Phase7ReviewSnapshot> Phase7ReviewSnapshots => _database.GetCollection<Phase7ReviewSnapshot>("Phase7ReviewSnapshots");

        // Phase 9 sub-collections
        public virtual IMongoCollection<Phase9DealActivityLog> Phase9DealActivityLogs => _database.GetCollection<Phase9DealActivityLog>("Phase9DealActivityLogs");
        public virtual IMongoCollection<Phase9DealTimelineEvent> Phase9DealTimelineEvents => _database.GetCollection<Phase9DealTimelineEvent>("Phase9DealTimelineEvents");

        // Extra collections
        public virtual IMongoCollection<ContactModel> Contacts => _database.GetCollection<ContactModel>("Contacts");
        public virtual IMongoCollection<FormData> FormDatas => _database.GetCollection<FormData>("FormDatas");

        // Chat Collections
        public virtual IMongoCollection<Conversation> Conversations => _database.GetCollection<Conversation>("Conversations");
        public virtual IMongoCollection<ChatMessage> ChatMessages => _database.GetCollection<ChatMessage>("ChatMessages");

        // notifications collection
        public virtual IMongoCollection<Notification> Notifications => _database.GetCollection<Notification>("Notifications");
        public virtual IMongoCollection<PushSubscriptionEntity> PushSubscription => _database.GetCollection<PushSubscriptionEntity>("PushSubscriptions");

        // Module 2 — Service Catalog (canon §6). Singular class → plural collection.
        public virtual IMongoCollection<ServiceListing> ServiceListings => _database.GetCollection<ServiceListing>("ServiceListings");
        public virtual IMongoCollection<ServicePackage> ServicePackages => _database.GetCollection<ServicePackage>("ServicePackages");
        public virtual IMongoCollection<ServiceFAQ> ServiceFAQs => _database.GetCollection<ServiceFAQ>("ServiceFAQs");

        // Module 3 — Leads / client acquisition.
        public virtual IMongoCollection<ClientBrief> ClientBriefs => _database.GetCollection<ClientBrief>("ClientBriefs");
        public virtual IMongoCollection<ClientBriefInteraction> ClientBriefInteractions => _database.GetCollection<ClientBriefInteraction>("ClientBriefInteractions");
        public virtual IMongoCollection<Proposal> Proposals => _database.GetCollection<Proposal>("Proposals");

        // Service-catalog lookup indexes: listings by owner, packages/FAQs by their
        // parent service. Best-effort + swallowed so context construction never blocks
        // or fails (unit tests mock the context; the getters are unset there → no-op).
        private void EnsureServiceCatalogIndexes()
        {
            try
            {
                ServiceListings.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<ServiceListing>(
                        Builders<ServiceListing>.IndexKeys.Ascending(x => x.ProviderId),
                        new CreateIndexOptions { Background = true }),
                });
                ServicePackages.Indexes.CreateOne(new CreateIndexModel<ServicePackage>(
                    Builders<ServicePackage>.IndexKeys.Ascending(x => x.ServiceId),
                    new CreateIndexOptions { Background = true }));
                ServiceFAQs.Indexes.CreateOne(new CreateIndexModel<ServiceFAQ>(
                    Builders<ServiceFAQ>.IndexKeys.Ascending(x => x.ServiceId),
                    new CreateIndexOptions { Background = true }));
            }
            catch
            {
                // Best-effort; never block or fail context construction.
            }
        }

        // No TTL index: expiry is a soft state transition performed by Hangfire.
        private void EnsureLeadsIndexes()
        {
            try
            {
                ClientBriefs.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<ClientBrief>(
                        Builders<ClientBrief>.IndexKeys.Ascending(x => x.Status).Ascending(x => x.ExpiresAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<ClientBrief>(
                        Builders<ClientBrief>.IndexKeys.Ascending(x => x.ServiceCategory).Descending(x => x.PublishedAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<ClientBrief>(
                        Builders<ClientBrief>.IndexKeys.Ascending(x => x.ClientId).Descending(x => x.CreatedAt),
                        new CreateIndexOptions { Background = true }),
                });
                ClientBriefInteractions.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<ClientBriefInteraction>(
                        Builders<ClientBriefInteraction>.IndexKeys.Ascending(x => x.ProviderId).Ascending(x => x.ClientBriefId),
                        new CreateIndexOptions { Background = true, Unique = true }),
                    new CreateIndexModel<ClientBriefInteraction>(
                        Builders<ClientBriefInteraction>.IndexKeys.Ascending(x => x.ProviderId).Ascending(x => x.Saved).Descending(x => x.UpdatedAt),
                        new CreateIndexOptions { Background = true }),
                });
                Proposals.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Proposal>(
                        Builders<Proposal>.IndexKeys.Ascending(x => x.ProviderId).Ascending(x => x.Status).Descending(x => x.UpdatedAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Proposal>(
                        Builders<Proposal>.IndexKeys.Ascending(x => x.ClientId).Ascending(x => x.Status).Descending(x => x.UpdatedAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<Proposal>(
                        Builders<Proposal>.IndexKeys.Ascending(x => x.ClientBriefId).Ascending(x => x.ProviderId),
                        new CreateIndexOptions { Background = true }),
                });
            }
            catch
            {
                // Best-effort; never prevent context construction.
            }
        }

    }

}
