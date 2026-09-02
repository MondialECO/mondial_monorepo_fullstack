using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace WebApp.Services
{
    public interface IKycStorageService
    {
        Task<string> SavePrivateKycDocumentAsync(IFormFile file);
        string? ResolveKycEvidencePath(string? storedPath);
        string GetContentType(string filePath);
        Task<KycMigrationResult> MigrateLegacyFilesAsync(string? wwwrootDir = null, string? targetPrivateDir = null);
    }

    public class KycMigrationResult
    {
        public int TotalFound { get; set; }
        public int MigratedCount { get; set; }
        public int AlreadyMigratedCount { get; set; }
        public int FailedCount { get; set; }
    }
}
