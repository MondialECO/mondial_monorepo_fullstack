namespace WebApp.Services
{
    public class SaveFile
    {
        private static readonly Dictionary<string, FolderPolicy> _policies = new(StringComparer.Ordinal)
        {
            {
                "media", new(
                    new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov" },
                    30 * 1024 * 1024
                )
            },
            {
                "documents", new(
                    new[] { ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".webp", ".gif" },
                    20 * 1024 * 1024
                )
            },
            {
                "investor/finance", new(
                    new[] { ".pdf", ".jpg", ".jpeg", ".png" },
                    20 * 1024 * 1024
                )
            },
            {
                "Identity", new(
                    new[] { ".pdf", ".doc", ".docx", ".ppt", ".pptx" },
                    20 * 1024 * 1024
                )
            },
            {
                "Face", new(
                    new[] { ".mp4", ".webm", ".mov" },
                    20 * 1024 * 1024
                )
            },
            {
                "profile", new(
                    new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" },
                    20 * 1024 * 1024
                )
            },
            {
                "branding", new(
                    new[] { ".png", ".svg", ".jpg", ".jpeg" },
                    5 * 1024 * 1024
                )
            },
            {
                "identity/documents", new(
                    new[] { ".png", ".jpg", ".jpeg" },
                    20 * 1024 * 1024
                )
            },
            {
                "service-provider/profile", new(
                    new[] { ".jpg", ".jpeg", ".png", ".webp" },
                    5 * 1024 * 1024
                )
            },
            {
                "service-provider/cover", new(
                    new[] { ".jpg", ".jpeg", ".png", ".webp" },
                    8 * 1024 * 1024
                )
            },
            {
                "service-provider/portfolio", new(
                    new[] { ".jpg", ".jpeg", ".png", ".webp" },
                    8 * 1024 * 1024
                )
            },
            // Credential documents are the one Service Provider upload that accepts a
            // document type as well as images, matching the credential upload policy
            // (PDF, PNG, JPG). Images-only policies above are unchanged.
            {
                "service-provider/credentials", new(
                    new[] { ".pdf", ".png", ".jpg", ".jpeg" },
                    10 * 1024 * 1024
                )
            },
            {
                "service-provider/gallery", new(
                    new[] { ".jpg", ".jpeg", ".png", ".webp" },
                    8 * 1024 * 1024
                )
            },
            {
                "service-provider/preview-video", new(
                    new[] { ".mp4", ".webm", ".mov" },
                    50 * 1024 * 1024
                )
            },
        };

        private sealed record FolderPolicy(string[] AllowedExtensions, long MaxBytes);

        public virtual async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            if (!_policies.TryGetValue(folderName, out var policy))
                throw new ArgumentException($"Unknown folder: {folderName}");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!policy.AllowedExtensions.Contains(extension))
                throw new ArgumentException($"Invalid file type: {extension}");

            if (file.Length > policy.MaxBytes)
                throw new ArgumentException($"File too large. Max allowed: {policy.MaxBytes / (1024 * 1024)}MB");

            // Unique file name
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            
            // Sensitive KYC documents are routed to private storage outside wwwroot
            if (string.Equals(folderName, "identity/documents", StringComparison.OrdinalIgnoreCase))
            {
                var privatePath = Path.Combine("storage", "private", "kyc", uniqueFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(privatePath)!);
                using (var stream = new FileStream(privatePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                return $"/storage/private/kyc/{uniqueFileName}";
            }

            var uploadPath = Path.Combine("wwwroot", "uploads", folderName, uniqueFileName);

            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(uploadPath)!);

            // Save file
            using (var stream = new FileStream(uploadPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative path (frontend / API)
            return $"/uploads/{folderName}/{uniqueFileName}";
        }
    }
}
