namespace WebApp.Services;

public interface IDocumentManager
{
    Task<string> SaveDocumentAsync(string companyId, string fileName, byte[] fileContent);
    Task<byte[]> GetDocumentAsync(string companyId, string documentId);
    Task DeleteDocumentAsync(string companyId, string documentId);
    Task<string> GetDownloadUrlAsync(string companyId, string documentId);
}
