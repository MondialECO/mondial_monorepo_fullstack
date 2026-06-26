using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.DbContext;

namespace WebApp.Services.Implementations;

public class InvestorService : IInvestorService
{
    private readonly MongoDbContext _dbContext;
    private readonly ILogger<InvestorService> _logger;

    public InvestorService(MongoDbContext dbContext, ILogger<InvestorService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Investor> CreateInvestorAsync(Investor investor)
    {
        investor.Id = ObjectId.GenerateNewId().ToString();
        investor.CreatedAt = DateTime.UtcNow;
        investor.UpdatedAt = DateTime.UtcNow;

        await _dbContext.Investors.InsertOneAsync(investor);
        _logger.LogInformation($"Investor {investor.Name} created with ID {investor.Id}");

        return investor;
    }

    public async Task<Investor> GetInvestorAsync(string investorId)
    {
        var objectId = investorId;
        var investor = await _dbContext.Investors.Find(i => i.Id == objectId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Investor {investorId} not found");

        return investor;
    }

    public async Task<List<Investor>> GetAllActiveInvestorsAsync()
    {
        return await _dbContext.Investors
            .Find(i => i.IsActive)
            .SortByDescending(i => i.ProfileScore)
            .ToListAsync();
    }

    public async Task<List<Investor>> FindInvestorsByPreferencesAsync(
        List<string> sectors,
        List<string> stages,
        double minCheckSize,
        double maxCheckSize,
        string geography)
    {
        var builder = Builders<Investor>.Filter;
        var filters = new List<FilterDefinition<Investor>>
        {
            builder.Eq(i => i.IsActive, true),
            builder.Lte(i => i.MinCheckSize, maxCheckSize),
            builder.Gte(i => i.MaxCheckSize, minCheckSize)
        };

        if (sectors != null && sectors.Count > 0)
        {
            filters.Add(builder.AnyIn(i => i.PreferredSectors, sectors));
        }

        if (stages != null && stages.Count > 0)
        {
            filters.Add(builder.AnyIn(i => i.PreferredStages, stages));
        }

        if (!string.IsNullOrWhiteSpace(geography))
        {
            filters.Add(builder.AnyEq(i => i.PreferredGeographies, geography));
        }

        var combinedFilter = builder.And(filters);

        return await _dbContext.Investors
            .Find(combinedFilter)
            .SortByDescending(i => i.ProfileScore)
            .ToListAsync();
    }

    public async Task<Investor> UpdateInvestorAsync(string investorId, Investor investor)
    {
        var objectId = investorId;
        investor.UpdatedAt = DateTime.UtcNow;

        var result = await _dbContext.Investors.ReplaceOneAsync(
            i => i.Id == objectId,
            investor
        );

        if (result.ModifiedCount == 0)
            throw new KeyNotFoundException($"Investor {investorId} not found");

        _logger.LogInformation($"Investor {investorId} updated");
        return investor;
    }

    public async Task DeleteInvestorAsync(string investorId)
    {
        var objectId = investorId;
        var result = await _dbContext.Investors.DeleteOneAsync(i => i.Id == objectId);

        if (result.DeletedCount == 0)
            throw new KeyNotFoundException($"Investor {investorId} not found");

        _logger.LogInformation($"Investor {investorId} deleted");
    }

    public async Task<int> GetInvestorMatchCountAsync(string investorId)
    {
        return (int)await _dbContext.InvestorMatches
            .CountDocumentsAsync(m => m.InvestorId == investorId);
    }
}
