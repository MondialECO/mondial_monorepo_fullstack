using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Repository
{
    public class CompanyRepository : ICompanyRepository<Companies>
    {
        public Task CreateAsync(Companies company)
        {
            throw new NotImplementedException();
        }

        public Task<Companies?> GetByUserIdAsync(string userId)
        {
            throw new NotImplementedException();
        }
    }

    public interface ICompanyRepository<T>
    {
    }
}
