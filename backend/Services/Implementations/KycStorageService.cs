using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace WebApp.Services.Implementations
{
    public class KycStorageService : IKycStorageService
    {
        private static readonly string[] AllowedExtensions = { ".png", ".jpg", ".jpeg", ".pdf", ".webp" };
        private const long MaxBytes = 20 * 1024 * 1024; // 20 MB

        private readonly ILogger<KycStorageService>? _logger;
        private readonly string _privateStorageRoot;
        private readonly string _legacyStorageRoot;

        public KycStorageService(ILogger<KycStorageService>? logger = null, string? customPrivateRoot = null, string? customLegacyRoot = null)
        {
            _logger = logger;
            _privateStorageRoot = customPrivateRoot ?? Path.Combine(Directory.GetCurrentDirectory(), "storage", "private", "kyc");
            _legacyStorageRoot = customLegacyRoot ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "identity", "documents");
        }

        public virtual async Task<string> SavePrivateKycDocumentAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                throw new ArgumentException($"Invalid file type: {extension}. Allowed types: {string.Join(", ", AllowedExtensions)}");

            if (file.Length > MaxBytes)
                throw new ArgumentException($"File too large. Max allowed: {MaxBytes / (1024 * 1024)}MB");

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var uploadPath = Path.Combine(_privateStorageRoot, uniqueFileName);

            Directory.CreateDirectory(Path.GetDirectoryName(uploadPath)!);

            using (var stream = new FileStream(uploadPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/storage/private/kyc/{uniqueFileName}";
        }

        public virtual string? ResolveKycEvidencePath(string? storedPath)
        {
            if (string.IsNullOrWhiteSpace(storedPath))
                return null;

            // Security: extract only the filename to prevent directory traversal
            var fileName = Path.GetFileName(storedPath);
            if (string.IsNullOrWhiteSpace(fileName) || fileName.Contains("..") || fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                return null;

            // 1. Check primary private KYC storage
            var privatePath = Path.Combine(_privateStorageRoot, fileName);
            if (File.Exists(privatePath))
                return privatePath;

            // 2. Check private face / selfie storage locations
            var privateFacePath = Path.Combine(Directory.GetCurrentDirectory(), "storage", "private", "face", fileName);
            if (File.Exists(privateFacePath))
                return privateFacePath;

            var privateSelfiePath = Path.Combine(Directory.GetCurrentDirectory(), "storage", "private", "selfie", fileName);
            if (File.Exists(privateSelfiePath))
                return privateSelfiePath;

            // 3. Check legacy storage path as fallback
            var legacyPath = Path.Combine(_legacyStorageRoot, fileName);
            if (File.Exists(legacyPath))
                return legacyPath;

            // 4. Check legacy capitalized / alternative folder fallbacks
            var legacyCapPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "Identity", fileName);
            if (File.Exists(legacyCapPath))
                return legacyCapPath;

            var legacyFacePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "face", fileName);
            if (File.Exists(legacyFacePath))
                return legacyFacePath;

            var legacySelfiePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "selfie", fileName);
            if (File.Exists(legacySelfiePath))
                return legacySelfiePath;

            return null;
        }

        public virtual string GetContentType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };
        }

        public virtual async Task<KycMigrationResult> MigrateLegacyFilesAsync(string? wwwrootDir = null, string? targetPrivateDir = null)
        {
            var result = new KycMigrationResult();
            var sourceDir = wwwrootDir ?? _legacyStorageRoot;
            var destDir = targetPrivateDir ?? _privateStorageRoot;

            if (!Directory.Exists(sourceDir))
            {
                return result;
            }

            Directory.CreateDirectory(destDir);
            var files = Directory.GetFiles(sourceDir);
            result.TotalFound = files.Length;

            foreach (var filePath in files)
            {
                var fileName = Path.GetFileName(filePath);
                var destFilePath = Path.Combine(destDir, fileName);

                try
                {
                    if (File.Exists(destFilePath))
                    {
                        var srcInfo = new FileInfo(filePath);
                        var dstInfo = new FileInfo(destFilePath);
                        if (dstInfo.Length == srcInfo.Length && dstInfo.Length > 0)
                        {
                            // Already migrated safely
                            File.Delete(filePath);
                            result.AlreadyMigratedCount++;
                            continue;
                        }
                    }

                    // Copy to private destination
                    using (var sourceStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                    using (var destinationStream = new FileStream(destFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
                    {
                        await sourceStream.CopyToAsync(destinationStream);
                    }

                    // Verify before deleting public source
                    if (File.Exists(destFilePath) && new FileInfo(destFilePath).Length > 0)
                    {
                        File.Delete(filePath);
                        result.MigratedCount++;
                        _logger?.LogInformation("Migrated KYC evidence {FileName} to private storage", fileName);
                    }
                    else
                    {
                        result.FailedCount++;
                        _logger?.LogWarning("Verification failed for {FileName} during KYC storage migration", fileName);
                    }
                }
                catch (Exception ex)
                {
                    result.FailedCount++;
                    _logger?.LogError(ex, "Exception during KYC migration of file {FileName}", fileName);
                }
            }

            return result;
        }
    }
}
