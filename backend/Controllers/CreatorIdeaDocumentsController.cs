using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Repository;

namespace WebApp.Controllers;

/// <summary>
/// Read/download surface for real Creator-idea file assets. It deliberately does
/// not infer documents from phase completion or generated structured data.
/// </summary>
[Route("api/creator/ideas/{ideaId}/documents")]
[ApiController]
[Authorize]
public class CreatorIdeaDocumentsController : ControllerBase
{
    private const string ReadyStatus = "ready";
    private readonly ICreatorIdeaStore _ideas;
    private readonly string _uploadsPath;

    public CreatorIdeaDocumentsController(ICreatorIdeaStore ideas, IConfiguration configuration)
    {
        _ideas = ideas;
        _uploadsPath = configuration["FileStorage:UploadPath"] ?? "uploads";
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException("User not authenticated");

    // GET /api/creator/ideas/{ideaId}/documents
    [HttpGet]
    public async Task<IActionResult> List(string ideaId)
    {
        try
        {
            var idea = await GetOwnedIdeaAsync(ideaId);
            var documents = (idea.Documents ?? new List<CreatorIdeaDocument>())
                .Select(document => TryResolveExistingFile(idea, document, out var info)
                    ? new
                    {
                        id = document.Id,
                        documentType = document.DocumentType,
                        title = document.Title,
                        fileName = document.FileName,
                        mimeType = document.MimeType,
                        // FileInfo is the source of truth, rather than an estimated
                        // display value that may have become stale in metadata.
                        sizeBytes = info!.Length,
                        sourceModule = document.SourceModule,
                        createdAt = document.CreatedAt,
                        updatedAt = document.UpdatedAt,
                        downloadable = true,
                    }
                    : null)
                .Where(document => document != null)
                .ToList();

            return Ok(ApiResponse.Ok("Documents loaded", new { documents }));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse.Error(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
        catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
    }

    // GET /api/creator/ideas/{ideaId}/documents/{documentId}/download
    [HttpGet("{documentId}/download")]
    public async Task<IActionResult> Download(string ideaId, string documentId)
    {
        try
        {
            var idea = await GetOwnedIdeaAsync(ideaId);
            var document = (idea.Documents ?? new List<CreatorIdeaDocument>()).FirstOrDefault(item => item.Id == documentId);
            if (document == null || !TryResolveExistingFile(idea, document, out var info))
                return NotFound(ApiResponse.Error("Document not found."));

            return PhysicalFile(info!.FullName, document.MimeType, Path.GetFileName(document.FileName));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse.Error(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
        catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
    }

    private async Task<CreatorIdea> GetOwnedIdeaAsync(string ideaId)
    {
        if (string.IsNullOrWhiteSpace(ideaId))
            throw new KeyNotFoundException("Idea not found.");

        var idea = await _ideas.GetOwnedAsync(ideaId, GetUserId());
        return idea ?? throw new KeyNotFoundException("Idea not found.");
    }

    private bool TryResolveExistingFile(CreatorIdea idea, CreatorIdeaDocument document, out FileInfo? file)
    {
        file = null;
        if (!CreatorIdeaDocumentTypes.IsSupported(document.DocumentType)
            || !string.Equals(document.Status, ReadyStatus, StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(document.StorageReference)
            || string.IsNullOrWhiteSpace(document.FileName)
            || !string.Equals(Path.GetFileName(document.FileName), document.FileName, StringComparison.Ordinal))
            return false;

        // A document record can only point to a filename under its own Creator +
        // idea directory. This prevents a manipulated metadata record from turning
        // the download endpoint into an arbitrary local-file reader.
        var storageName = Path.GetFileName(document.StorageReference);
        if (!string.Equals(storageName, document.StorageReference, StringComparison.Ordinal))
            return false;

        var directory = Path.GetFullPath(Path.Combine(_uploadsPath, "creator-ideas", idea.UserId, idea.Id));
        var candidate = Path.GetFullPath(Path.Combine(directory, storageName));
        if (!candidate.StartsWith(directory + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            || !System.IO.File.Exists(candidate))
            return false;

        file = new FileInfo(candidate);
        return true;
    }
}
