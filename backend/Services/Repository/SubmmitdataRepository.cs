using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using MongoDB.Driver;
using WebApp.DbContext;
namespace WebApp.Services.Repository
{
    public class SubmmitdataRepository : ISubmmitdata
    {
        private readonly MongoDbContext _context;

        public SubmmitdataRepository(MongoDbContext context)
        {
            _context = context;
        }

        public async Task AddDataAsync(FormData formData)
        {
            await _context.FormDatas.InsertOneAsync(formData);
        }

        public async Task<bool> DeleteById(Guid id)
        {
            var result = await _context.FormDatas.DeleteOneAsync(f => f.Id == id);
            return result.DeletedCount > 0;
        }

        public async Task<List<FormData>> GetAll()
        {
            return await _context.FormDatas.Find(_ => true).ToListAsync();
        }

        public async Task<FormData> GetById(Guid id)
        {
            return await _context.FormDatas.Find(f => f.Id == id).FirstOrDefaultAsync();
        }
    }
}
