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
        }

        public MongoDbContext(IMongoDatabase database)
        {
            _database = database;
        }

        public virtual IMongoCollection<ApplicationUser> ApplicationUsers => _database.GetCollection<ApplicationUser>("ApplicationUsers");

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

        // Extra collections
        public virtual IMongoCollection<ContactModel> Contacts => _database.GetCollection<ContactModel>("Contacts");
        public virtual IMongoCollection<FormData> FormDatas => _database.GetCollection<FormData>("FormDatas");

        // Chat Collections
        public virtual IMongoCollection<Conversation> Conversations => _database.GetCollection<Conversation>("Conversations");
        public virtual IMongoCollection<ChatMessage> ChatMessages => _database.GetCollection<ChatMessage>("ChatMessages");

        // notifications collection
        public virtual IMongoCollection<Notification> Notifications => _database.GetCollection<Notification>("Notifications");
        public virtual IMongoCollection<PushSubscriptionEntity> PushSubscription => _database.GetCollection<PushSubscriptionEntity>("PushSubscriptions");

    }

}
