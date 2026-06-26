using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai
{
    /// <summary>
    /// One-time, idempotent starter-credit backfill: grants every existing user
    /// who has no <c>AICredits</c> ledger a starter balance. Mirrors the
    /// Onboarding backfill pattern — safe to run on every boot (only users
    /// lacking a ledger are touched). Gated by config in Program.cs.
    /// </summary>
    public interface IAiCreditSeeder
    {
        /// <summary>Grants starter credits; returns the number of NEW ledgers created.</summary>
        Task<int> GrantStarterCreditsAsync(int amount);
    }

    public sealed class AiCreditSeeder : IAiCreditSeeder
    {
        private readonly IMongoDatabase _database;
        private readonly AiCreditLedgerRepository _credits;

        public AiCreditSeeder(IMongoDatabase database, AiCreditLedgerRepository credits)
        {
            _database = database;
            _credits = credits;
        }

        public async Task<int> GrantStarterCreditsAsync(int amount)
        {
            if (amount <= 0)
                return 0;

            var users = _database.GetCollection<ApplicationUser>("users");
            var ids = await users.Find(FilterDefinition<ApplicationUser>.Empty)
                .Project(u => u.Id)
                .ToListAsync();

            var granted = 0;
            foreach (var id in ids)
            {
                if (await _credits.TryGrantInitialAsync(id.ToString(), amount))
                    granted++;
            }
            return granted;
        }
    }
}
