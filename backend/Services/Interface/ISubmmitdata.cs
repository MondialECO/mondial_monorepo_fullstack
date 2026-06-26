using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    public interface ISubmmitdata
    {
        Task AddDataAsync(FormData formData);
        Task<bool> DeleteById(Guid id);
        Task<List<FormData>> GetAll();
        Task<FormData> GetById(Guid id);
    }
}
