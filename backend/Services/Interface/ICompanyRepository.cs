using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    public interface ICompanyRepository
    {
        Task<Companies?> GetByUserIdAsync(string userId);
        Task CreateAsync(Companies company);
    }
}
