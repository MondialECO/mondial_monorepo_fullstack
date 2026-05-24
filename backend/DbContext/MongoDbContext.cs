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

        public IMongoCollection<ApplicationUser> ApplicationUsers => _database.GetCollection<ApplicationUser>("ApplicationUsers");

        // Business Collections
        public IMongoCollection<BusinessIdeas> BusinessIdeas => _database.GetCollection<BusinessIdeas>("BusinessIdeas");
        public IMongoCollection<IdeaClick> IdeaClicks => _database.GetCollection<IdeaClick>("IdeaClicks");
        public IMongoCollection<Investments> Investments => _database.GetCollection<Investments>("Investments");
        public IMongoCollection<Transactions> Transactions => _database.GetCollection<Transactions>("Transactions");

        // Entrepreneur Collections
        public IMongoCollection<Companies> Companies => _database.GetCollection<Companies>("Companies");
        public IMongoCollection<InvestorMatch> InvestorMatches => _database.GetCollection<InvestorMatch>("InvestorMatches");
        public IMongoCollection<DealExecution> DealExecutions => _database.GetCollection<DealExecution>("DealExecutions");
        public IMongoCollection<Investor> Investors => _database.GetCollection<Investor>("Investors");

        // Phase 3 sub-collections
        public IMongoCollection<Phase3Kpi> Phase3Kpis => _database.GetCollection<Phase3Kpi>("Phase3Kpis");
        public IMongoCollection<Phase3MonthlyRevenue> Phase3MonthlyRevenues => _database.GetCollection<Phase3MonthlyRevenue>("Phase3MonthlyRevenues");
        public IMongoCollection<Phase3FinancialReport> Phase3FinancialReports => _database.GetCollection<Phase3FinancialReport>("Phase3FinancialReports");

        // Phase 4 sub-collections
        public IMongoCollection<Phase4CapTable> Phase4CapTables => _database.GetCollection<Phase4CapTable>("Phase4CapTables");
        public IMongoCollection<Phase4VestingSchedule> Phase4VestingSchedules => _database.GetCollection<Phase4VestingSchedule>("Phase4VestingSchedules");
        public IMongoCollection<Phase4OwnershipHistory> Phase4OwnershipHistories => _database.GetCollection<Phase4OwnershipHistory>("Phase4OwnershipHistories");
        public IMongoCollection<Phase4ShareIssuance> Phase4ShareIssuances => _database.GetCollection<Phase4ShareIssuance>("Phase4ShareIssuances");

        // Phase 6 sub-collections
        public IMongoCollection<Phase6AccessLog> Phase6AccessLogs => _database.GetCollection<Phase6AccessLog>("Phase6AccessLogs");
        public IMongoCollection<Phase6NdaAcceptance> Phase6NdaAcceptances => _database.GetCollection<Phase6NdaAcceptance>("Phase6NdaAcceptances");

        // Phase 7 sub-collections
        public IMongoCollection<Phase7ReviewSnapshot> Phase7ReviewSnapshots => _database.GetCollection<Phase7ReviewSnapshot>("Phase7ReviewSnapshots");

        // Extra collections
        public IMongoCollection<ContactModel> Contacts => _database.GetCollection<ContactModel>("Contacts");
        public IMongoCollection<FormData> FormDatas => _database.GetCollection<FormData>("FormDatas");

        // Chat Collections
        public IMongoCollection<Conversation> Conversations => _database.GetCollection<Conversation>("Conversations");
        public IMongoCollection<ChatMessage> ChatMessages => _database.GetCollection<ChatMessage>("ChatMessages");

        // notifications collection
        public IMongoCollection<Notification> Notifications => _database.GetCollection<Notification>("Notifications");
        public IMongoCollection<PushSubscriptionEntity> PushSubscription => _database.GetCollection<PushSubscriptionEntity>("PushSubscriptions");

    }

}
