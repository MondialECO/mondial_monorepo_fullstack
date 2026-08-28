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
            EnsureWorkroomIndexes();
            EnsureAnalyticsIndexes();
            EnsureProfileSplitIndexes();
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
            EnsureWorkroomIndexes();
            EnsureAnalyticsIndexes();
            EnsureProfileSplitIndexes();
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

        // "applicationUsers", not "ApplicationUsers": Identity owns this collection and
        // AspNetCore.Identity.MongoDbCore derives the name through MongoDbGenericRepository's
        // Pluralize -> Camelize. MongoDB is case-sensitive and GetCollection on an absent
        // name returns an empty collection instead of throwing, so the PascalCase spelling
        // silently returned nothing for every reader and matched nothing for every writer.
        public virtual IMongoCollection<ApplicationUser> ApplicationUsers => _database.GetCollection<ApplicationUser>("applicationUsers");

        // ---- Service Provider data split (approved SP-only migration) ----
        // Three root collections joined by unique UserId. Initially populated and
        // consumed by Service Providers only; Creator/Entrepreneur/Investor keep
        // their embedded models until a separately approved migration.
        public virtual IMongoCollection<ProfessionalProfileRecord> ProfessionalProfiles => _database.GetCollection<ProfessionalProfileRecord>("ProfessionalProfiles");
        public virtual IMongoCollection<UserCredentialRecord> UserCredentials => _database.GetCollection<UserCredentialRecord>("UserCredentials");
        public virtual IMongoCollection<ServiceProviderProfileRecord> ServiceProviderProfiles => _database.GetCollection<ServiceProviderProfileRecord>("ServiceProviderProfiles");

        // Creator journey collection (Phases 2–6 source of truth)
        public virtual IMongoCollection<CreatorJourney> CreatorJourneys => _database.GetCollection<CreatorJourney>("CreatorJourneys");
        public virtual IMongoCollection<CreatorIdea> CreatorIdeas => _database.GetCollection<CreatorIdea>("CreatorIdeas");

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
        public virtual IMongoCollection<ProjectInterest> ProjectInterests => _database.GetCollection<ProjectInterest>("ProjectInterests");
        public virtual IMongoCollection<MarketplaceProjectAccessGrant> MarketplaceProjectAccessGrants => _database.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants");
        public virtual IMongoCollection<MarketplaceProjectAccessLog> MarketplaceProjectAccessLogs => _database.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs");
        public virtual IMongoDatabase Database => _database;

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

        // Module 4 — Workroom & Earnings. Provider financial settings stay embedded
        // on ServiceProviderProfile; all records below are genuinely unbounded.
        public virtual IMongoCollection<WorkroomEngagement> WorkroomEngagements => _database.GetCollection<WorkroomEngagement>("WorkroomEngagements");
        public virtual IMongoCollection<Contract> Contracts => _database.GetCollection<Contract>("Contracts");
        public virtual IMongoCollection<WorkroomMilestone> WorkroomMilestones => _database.GetCollection<WorkroomMilestone>("WorkroomMilestones");
        public virtual IMongoCollection<Deliverable> Deliverables => _database.GetCollection<Deliverable>("Deliverables");
        public virtual IMongoCollection<RevisionRequest> RevisionRequests => _database.GetCollection<RevisionRequest>("RevisionRequests");
        public virtual IMongoCollection<FinancialTransaction> FinancialTransactions => _database.GetCollection<FinancialTransaction>("FinancialTransactions");
        public virtual IMongoCollection<Review> Reviews => _database.GetCollection<Review>("Reviews");
        public virtual IMongoCollection<WorkroomTask> WorkroomTasks => _database.GetCollection<WorkroomTask>("WorkroomTasks");
        public virtual IMongoCollection<ClientInputRequest> ClientInputRequests => _database.GetCollection<ClientInputRequest>("ClientInputRequests");
        public virtual IMongoCollection<WorkroomFile> WorkroomFiles => _database.GetCollection<WorkroomFile>("WorkroomFiles");
        public virtual IMongoCollection<PaymentOperation> PaymentOperations => _database.GetCollection<PaymentOperation>("PaymentOperations");
        public virtual IMongoCollection<PayoutRequest> PayoutRequests => _database.GetCollection<PayoutRequest>("PayoutRequests");
        public virtual IMongoCollection<Invoice> Invoices => _database.GetCollection<Invoice>("Invoices");
        public virtual IMongoCollection<HourlyTimeEntry> HourlyTimeEntries => _database.GetCollection<HourlyTimeEntry>("HourlyTimeEntries");
        public virtual IMongoCollection<WorkroomAuditEvent> WorkroomAuditEvents => _database.GetCollection<WorkroomAuditEvent>("WorkroomAuditEvents");
        public virtual IMongoCollection<RepeatClientCoupon> RepeatClientCoupons => _database.GetCollection<RepeatClientCoupon>("RepeatClientCoupons");

        // Module 5 — metrics are read-time only; manual provider tasks are the
        // module's single stateful collection.
        public virtual IMongoCollection<GrowthTask> GrowthTasks => _database.GetCollection<GrowthTask>("GrowthTasks");

        // Module 5 Phase A — analytics tracking: daily impression/click/inquiry buckets
        // and session dedup records (TTL).
        public virtual IMongoCollection<AnalyticsDailyBucket> AnalyticsDailyBuckets => _database.GetCollection<AnalyticsDailyBucket>("AnalyticsDailyBuckets");
        public virtual IMongoCollection<AnalyticsSessionSeen> AnalyticsSessionSeen => _database.GetCollection<AnalyticsSessionSeen>("AnalyticsSessionSeen");

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
                    // Marketplace: Published listings filtered by category + sort
                    new CreateIndexModel<ServiceListing>(
                        Builders<ServiceListing>.IndexKeys
                            .Ascending(x => x.Status)
                            .Ascending(x => x.Category)
                            .Descending(x => x.UpdatedAt),
                        new CreateIndexOptions { Background = true }),
                    // Marketplace: Text search on title
                    new CreateIndexModel<ServiceListing>(
                        Builders<ServiceListing>.IndexKeys.Text(x => x.Title),
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

        private void EnsureWorkroomIndexes()
        {
            try
            {
                WorkroomEngagements.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<WorkroomEngagement>(Builders<WorkroomEngagement>.IndexKeys.Ascending(x => x.ProposalId), new CreateIndexOptions { Background = true, Unique = true }),
                    new CreateIndexModel<WorkroomEngagement>(Builders<WorkroomEngagement>.IndexKeys.Ascending(x => x.ProviderId).Ascending(x => x.EngagementStatus).Descending(x => x.UpdatedAt), new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<WorkroomEngagement>(Builders<WorkroomEngagement>.IndexKeys.Ascending(x => x.ClientId).Ascending(x => x.EngagementStatus).Descending(x => x.UpdatedAt), new CreateIndexOptions { Background = true }),
                });
                Contracts.Indexes.CreateOne(new CreateIndexModel<Contract>(Builders<Contract>.IndexKeys.Ascending(x => x.EngagementId), new CreateIndexOptions { Background = true, Unique = true }));
                WorkroomMilestones.Indexes.CreateOne(new CreateIndexModel<WorkroomMilestone>(Builders<WorkroomMilestone>.IndexKeys.Ascending(x => x.EngagementId).Ascending(x => x.DisplayOrder), new CreateIndexOptions { Background = true }));
                Deliverables.Indexes.CreateOne(new CreateIndexModel<Deliverable>(Builders<Deliverable>.IndexKeys.Ascending(x => x.MilestoneId).Ascending(x => x.SubmittedAt), new CreateIndexOptions { Background = true }));
                RevisionRequests.Indexes.CreateOne(new CreateIndexModel<RevisionRequest>(Builders<RevisionRequest>.IndexKeys.Ascending(x => x.MilestoneId).Ascending(x => x.RevisionRequestStatus), new CreateIndexOptions { Background = true }));
                FinancialTransactions.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<FinancialTransaction>(Builders<FinancialTransaction>.IndexKeys.Ascending(x => x.ProviderId).Descending(x => x.CreatedAt), new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<FinancialTransaction>(Builders<FinancialTransaction>.IndexKeys.Ascending(x => x.IdempotencyKey), new CreateIndexOptions { Background = true, Unique = true }),
                });
                Reviews.Indexes.CreateOne(new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(x => x.EngagementId), new CreateIndexOptions { Background = true, Unique = true }));
                PaymentOperations.Indexes.CreateOne(new CreateIndexModel<PaymentOperation>(Builders<PaymentOperation>.IndexKeys.Ascending(x => x.IdempotencyKey), new CreateIndexOptions { Background = true, Unique = true }));
                PayoutRequests.Indexes.CreateOne(new CreateIndexModel<PayoutRequest>(Builders<PayoutRequest>.IndexKeys.Ascending(x => x.ProviderId).Descending(x => x.CreatedAt), new CreateIndexOptions { Background = true }));
                Invoices.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<Invoice>(Builders<Invoice>.IndexKeys.Ascending(x => x.InvoiceNumber), new CreateIndexOptions { Background = true, Unique = true }),
                    new CreateIndexModel<Invoice>(Builders<Invoice>.IndexKeys.Ascending(x => x.ProviderId).Descending(x => x.CreatedAt), new CreateIndexOptions { Background = true }),
                });
                HourlyTimeEntries.Indexes.CreateOne(new CreateIndexModel<HourlyTimeEntry>(Builders<HourlyTimeEntry>.IndexKeys.Ascending(x => x.EngagementId).Descending(x => x.StartedAt), new CreateIndexOptions { Background = true }));
                WorkroomAuditEvents.Indexes.CreateOne(new CreateIndexModel<WorkroomAuditEvent>(Builders<WorkroomAuditEvent>.IndexKeys.Ascending(x => x.EntityId).Descending(x => x.Timestamp), new CreateIndexOptions { Background = true }));
                RepeatClientCoupons.Indexes.CreateOne(new CreateIndexModel<RepeatClientCoupon>(Builders<RepeatClientCoupon>.IndexKeys.Ascending(x => x.ProviderId).Ascending(x => x.ClientId).Ascending(x => x.Status), new CreateIndexOptions { Background = true }));
            }
            catch
            {
                // Best-effort startup index creation, matching Modules 2 and 3.
            }
        }

        private void EnsureAnalyticsIndexes()
        {
            try
            {
                GrowthTasks.Indexes.CreateOne(new CreateIndexModel<GrowthTask>(
                    Builders<GrowthTask>.IndexKeys.Ascending(x => x.ProviderId)
                        .Ascending(x => x.Status).Descending(x => x.UpdatedAt),
                    new CreateIndexOptions { Background = true }));

                // Unique (ListingId, Date) — one bucket per listing per day.
                AnalyticsDailyBuckets.Indexes.CreateOne(new CreateIndexModel<AnalyticsDailyBucket>(
                    Builders<AnalyticsDailyBucket>.IndexKeys
                        .Ascending(x => x.ListingId)
                        .Ascending(x => x.Date),
                    new CreateIndexOptions { Background = true, Unique = true }
                ));

                // Compound (ProviderId, Date) — provider-wide date-range aggregation.
                AnalyticsDailyBuckets.Indexes.CreateOne(new CreateIndexModel<AnalyticsDailyBucket>(
                    Builders<AnalyticsDailyBucket>.IndexKeys
                        .Ascending(x => x.ProviderId)
                        .Descending(x => x.Date),
                    new CreateIndexOptions { Background = true }
                ));

                // Compound (ListingId, SessionKey, EventType) — dedup lookup.
                AnalyticsSessionSeen.Indexes.CreateOne(new CreateIndexModel<AnalyticsSessionSeen>(
                    Builders<AnalyticsSessionSeen>.IndexKeys
                        .Ascending(x => x.ListingId)
                        .Ascending(x => x.SessionKey)
                        .Ascending(x => x.EventType),
                    new CreateIndexOptions { Background = true }
                ));

                // TTL — MongoDB auto-removes documents past ExpiresAt.
                AnalyticsSessionSeen.Indexes.CreateOne(new CreateIndexModel<AnalyticsSessionSeen>(
                    Builders<AnalyticsSessionSeen>.IndexKeys.Ascending(x => x.ExpiresAt),
                    new CreateIndexOptions
                    {
                        Background = true,
                        ExpireAfter = TimeSpan.Zero
                    }
                ));
            }
            catch
            {
                // Best-effort startup index creation, matching Modules 2–5.
            }
        }

        // Service Provider data-split indexes. Slug / Skills / Industries indexes
        // are deliberately deferred until a real consumer queries those fields.
        private void EnsureProfileSplitIndexes()
        {
            try
            {
                ProfessionalProfiles.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<ProfessionalProfileRecord>(
                        Builders<ProfessionalProfileRecord>.IndexKeys.Ascending(x => x.UserId),
                        new CreateIndexOptions { Unique = true, Background = true }),
                    new CreateIndexModel<ProfessionalProfileRecord>(
                        Builders<ProfessionalProfileRecord>.IndexKeys.Descending(x => x.UpdatedAt),
                        new CreateIndexOptions { Background = true }),
                });

                UserCredentials.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<UserCredentialRecord>(
                        Builders<UserCredentialRecord>.IndexKeys.Ascending(x => x.UserId),
                        new CreateIndexOptions { Background = true }),
                    // Review queue: pending credentials ordered by submission time.
                    new CreateIndexModel<UserCredentialRecord>(
                        Builders<UserCredentialRecord>.IndexKeys.Ascending(x => x.Status).Ascending(x => x.SubmittedAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<UserCredentialRecord>(
                        Builders<UserCredentialRecord>.IndexKeys.Ascending(x => x.ExpiresAt),
                        new CreateIndexOptions { Background = true, Sparse = true }),
                });

                ServiceProviderProfiles.Indexes.CreateMany(new[]
                {
                    new CreateIndexModel<ServiceProviderProfileRecord>(
                        Builders<ServiceProviderProfileRecord>.IndexKeys.Ascending(x => x.UserId),
                        new CreateIndexOptions { Unique = true, Background = true }),
                    new CreateIndexModel<ServiceProviderProfileRecord>(
                        Builders<ServiceProviderProfileRecord>.IndexKeys.Ascending(x => x.ProviderId),
                        new CreateIndexOptions { Background = true }),
                    // Admin verification queue: replaces the legacy all-users scan.
                    new CreateIndexModel<ServiceProviderProfileRecord>(
                        Builders<ServiceProviderProfileRecord>.IndexKeys.Ascending(x => x.VerificationStatus).Ascending(x => x.VerificationSubmittedAt),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<ServiceProviderProfileRecord>(
                        Builders<ServiceProviderProfileRecord>.IndexKeys.Ascending(x => x.ServiceCategories),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<ServiceProviderProfileRecord>(
                        Builders<ServiceProviderProfileRecord>.IndexKeys.Ascending(x => x.NewOrderAvailability),
                        new CreateIndexOptions { Background = true }),
                    // SP matching filters on tier (>= Tier2) after cutover.
                    new CreateIndexModel<ServiceProviderProfileRecord>(
                        Builders<ServiceProviderProfileRecord>.IndexKeys.Ascending(x => x.ProviderTier),
                        new CreateIndexOptions { Background = true }),
                    new CreateIndexModel<ServiceProviderProfileRecord>(
                        Builders<ServiceProviderProfileRecord>.IndexKeys.Descending(x => x.UpdatedAt),
                        new CreateIndexOptions { Background = true }),
                });
            }
            catch
            {
                // Best-effort; never block or fail context construction.
            }
        }

    }

}
