using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace WebApp.Services.Interface
{
    public class CompanySearchMatchDto
    {
        public string Siren { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? PostalCode { get; set; }
        public string? City { get; set; }
        public string? Department { get; set; }
        public string? ActivityCode { get; set; }
        public string Status { get; set; } = "unknown"; // "active", "closed", "unknown"
    }

    public class CompanySearchResponseDto
    {
        public string Query { get; set; } = string.Empty;
        public List<CompanySearchMatchDto> Matches { get; set; } = new();
        public int TotalResults { get; set; }
    }

    public interface ICompanySearchService
    {
        Task<CompanySearchResponseDto> SearchCompaniesAsync(string query, int limit = 5, CancellationToken cancellationToken = default);
    }
}
