namespace WebApp.Services.Implementations;

public class DocumentManager : IDocumentManager
{
    private readonly string _basePath;

    public DocumentManager(string basePath = "uploads")
    {
        _basePath = basePath;
        if (!Directory.Exists(_basePath))
            Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveDocumentAsync(string companyId, string fileName, byte[] fileContent)
    {
        return await Task.Run(() =>
        {
            var companyFolder = Path.Combine(_basePath, companyId);
            if (!Directory.Exists(companyFolder))
                Directory.CreateDirectory(companyFolder);

            // Sanitize filename and add timestamp for uniqueness
            var sanitizedName = Path.GetFileName(fileName);
            var timestamp = DateTime.UtcNow.Ticks;
            var finalFileName = $"{timestamp}_{sanitizedName}";
            var filePath = Path.Combine(companyFolder, finalFileName);

            File.WriteAllBytes(filePath, fileContent);

            return filePath;
        });
    }

    public async Task<byte[]> GetDocumentAsync(string companyId, string documentId)
    {
        return await Task.Run(() =>
        {
            var filePath = Path.Combine(_basePath, companyId, documentId);
            if (!File.Exists(filePath))
                throw new FileNotFoundException($"Document {documentId} not found for company {companyId}");

            return File.ReadAllBytes(filePath);
        });
    }

    public async Task DeleteDocumentAsync(string companyId, string documentId)
    {
        await Task.Run(() =>
        {
            var filePath = Path.Combine(_basePath, companyId, documentId);
            if (File.Exists(filePath))
                File.Delete(filePath);
        });
    }

    public async Task<string> GetDownloadUrlAsync(string companyId, string documentId)
    {
        return await Task.CompletedTask.ContinueWith(_ =>
        {
            // For local storage, return the relative path
            // In production, this would return a presigned S3 URL or similar
            return $"/api/documents/download/{companyId}/{documentId}";
        });
    }
}
