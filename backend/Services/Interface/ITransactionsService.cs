using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    public interface ITransactionsService
    {
        Task<Transactions> CreateTransactionAsync(Transactions transaction);
        Task<IEnumerable<Transactions>> GetByUserAsync(string userId);
        Task<IEnumerable<Transactions>> GetRecentAsync(int limit = 50);
        Task<Transactions> GetByIdAsync(string id);
        Task DeleteTransactionAsync(string id);
    }
}
