using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;

namespace WebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IProfessionalProfileStore _professionalStore;
    private readonly IServiceProviderProfileStore _spStore;
    private readonly IUserCredentialStore? _credentialStore;
    private readonly IServiceProviderProfileSplitMigration _migration;
    private readonly IProfileEditorService _editor;
    private readonly IServiceProviderMediaService _media;
    private readonly MongoDbContext? _context;

    public ProfileController(
        UserManager<ApplicationUser> userManager,
        IProfessionalProfileStore professionalStore,
        IServiceProviderProfileStore spStore,
        IServiceProviderProfileSplitMigration migration,
        IProfileEditorService editor,
        IServiceProviderMediaService media,
        MongoDbContext? context = null,
        IUserCredentialStore? credentialStore = null)
    {
        _userManager = userManager;
        _professionalStore = professionalStore;
        _spStore = spStore;
        _migration = migration;
        _editor = editor;
        _media = media;
        _context = context;
        _credentialStore = credentialStore;
    }

    private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Invalid => BadRequest(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };

    [HttpPost("media/profile-image")]
    [Authorize]
    [RequestSizeLimit(5 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> UploadProfileImage(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _media.UploadProfileMediaAsync(userId, ProviderProfileMediaKind.ProfileImage, file, cancellationToken));
    }

    [HttpDelete("media/profile-image")]
    [Authorize]
    public async Task<IActionResult> RemoveProfileImage(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _media.RemoveProfileMediaAsync(userId, ProviderProfileMediaKind.ProfileImage, cancellationToken));
    }

    [HttpPost("media/cover-image")]
    [Authorize]
    [RequestSizeLimit(8 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> UploadCoverImage(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _media.UploadProfileMediaAsync(userId, ProviderProfileMediaKind.CoverImage, file, cancellationToken));
    }

    [HttpDelete("media/cover-image")]
    [Authorize]
    public async Task<IActionResult> RemoveCoverImage(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _media.RemoveProfileMediaAsync(userId, ProviderProfileMediaKind.CoverImage, cancellationToken));
    }

    [HttpGet("editor/draft")]
    [Authorize]
    public async Task<IActionResult> GetProfileDraft(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _editor.GetDraftAsync(userId, cancellationToken));
    }

    [HttpPut("editor/draft")]
    [Authorize]
    public async Task<IActionResult> SaveProfileDraft(
        [FromBody] ProfileDraftRequest request,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _editor.SaveDraftAsync(userId, request, cancellationToken));
    }

    [HttpDelete("editor/draft")]
    [Authorize]
    public async Task<IActionResult> DiscardProfileDraft(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _editor.DiscardDraftAsync(userId, cancellationToken));
    }

    [HttpPost("editor/submit")]
    [Authorize]
    public async Task<IActionResult> SubmitProfileEditor(
        [FromBody] SubmitProfileEditorRequest request,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        return Map(await _editor.SubmitAsync(userId, request, cancellationToken));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return NotFound(new { success = false, message = "User not found." });

        var professional = await _migration.EnsureProfessionalProfileAsync(user, ct);
        var roles = await _userManager.GetRolesAsync(user);

        var dto = MapToUniversalDto(professional, user, roles);
        return Ok(new { success = true, data = dto });
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateUniversalProfileRequestDto request, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { success = false, message = "User is not authenticated." });

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return NotFound(new { success = false, message = "User not found." });

        var professional = await _migration.EnsureProfessionalProfileAsync(user, ct);

        if (request.Headline is not null) professional.Headline = request.Headline.Trim();
        if (request.Bio is not null) professional.Bio = request.Bio.Trim();
        if (request.AvailabilityDisplay.HasValue) professional.AvailabilityDisplay = request.AvailabilityDisplay.Value;

        if (request.ProfileImage is not null)
        {
            professional.ProfileImage = new ProviderMediaAsset
            {
                PublicUrl = request.ProfileImage.PublicUrl ?? string.Empty,
                StorageKey = request.ProfileImage.StoragePath ?? string.Empty,
                Width = request.ProfileImage.Width ?? 400,
                Height = request.ProfileImage.Height ?? 400,
                Bytes = request.ProfileImage.FileSizeBytes ?? 0,
                UploadedAt = DateTime.UtcNow,
            };
        }

        if (request.CoverImage is not null)
        {
            professional.CoverImage = new ProviderMediaAsset
            {
                PublicUrl = request.CoverImage.PublicUrl ?? string.Empty,
                StorageKey = request.CoverImage.StoragePath ?? string.Empty,
                Width = request.CoverImage.Width ?? 1200,
                Height = request.CoverImage.Height ?? 300,
                Bytes = request.CoverImage.FileSizeBytes ?? 0,
                UploadedAt = DateTime.UtcNow,
            };
        }

        if (request.Experiences is not null)
        {
            professional.Experiences = request.Experiences.Select(e => new ProfessionalExperience
            {
                Id = string.IsNullOrWhiteSpace(e.Id) ? Guid.NewGuid().ToString("N") : e.Id,
                JobTitle = e.JobTitle,
                CompanyName = e.CompanyName,
                StartDate = ParseDate(e.StartDate),
                EndDate = ParseNullableDate(e.EndDate),
                IsCurrent = e.IsCurrent,
                Description = e.Description,
                UpdatedAt = DateTime.UtcNow
            }).ToList();
        }

        if (request.Education is not null)
        {
            professional.Education = request.Education.Select(e => new ProfessionalEducation
            {
                Id = string.IsNullOrWhiteSpace(e.Id) ? Guid.NewGuid().ToString("N") : e.Id,
                Institution = e.Institution,
                Degree = e.Degree,
                FieldOfStudy = e.FieldOfStudy,
                StartYear = e.StartYear,
                EndYear = e.EndYear,
                Description = e.Description,
                UpdatedAt = DateTime.UtcNow
            }).ToList();
        }

        if (request.Skills is not null)
        {
            professional.Skills = request.Skills.Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();
        }

        if (request.LanguageProficiencies is not null)
        {
            professional.LanguageProficiencies = request.LanguageProficiencies.Select(l => new ProfessionalLanguage
            {
                Id = string.IsNullOrWhiteSpace(l.Id) ? Guid.NewGuid().ToString("N") : l.Id,
                Language = l.Language,
                Proficiency = ParseProficiency(l.Proficiency)
            }).ToList();
            professional.Languages = professional.LanguageProficiencies.Select(l => l.Language).Distinct().ToList();
        }

        if (request.Industries is not null)
        {
            professional.Industries = request.Industries.Where(i => !string.IsNullOrWhiteSpace(i)).Distinct().ToList();
        }

        if (request.SocialLinks is not null)
        {
            professional.SocialLinks = request.SocialLinks.Select(s => new ProfessionalSocialLink
            {
                Id = string.IsNullOrWhiteSpace(s.Id) ? Guid.NewGuid().ToString("N") : s.Id,
                Platform = s.Platform,
                Url = s.Url
            }).ToList();
        }

        if (request.ProfessionalOverview.HasValue)
        {
            var rawJson = request.ProfessionalOverview.Value.GetRawText();
            var plainText = request.ProfessionalOverview.Value.TryGetProperty("plainText", out var pt) ? pt.GetString() ?? string.Empty : string.Empty;
            BsonDocument? doc = null;
            try
            {
                doc = BsonDocument.Parse(rawJson);
            }
            catch
            {
                doc = new BsonDocument("type", "doc");
            }

            professional.ProfessionalOverview = new ProfessionalOverviewContent
            {
                SchemaVersion = 1,
                PlainText = plainText,
                Document = doc ?? new BsonDocument("type", "doc")
            };
        }

        professional.ProfileVersion++;
        professional.UpdatedAt = DateTime.UtcNow;

        await _professionalStore.UpsertAsync(professional, cancellationToken: ct);

        var roles = await _userManager.GetRolesAsync(user);
        var dto = MapToUniversalDto(professional, user, roles);
        return Ok(new { success = true, message = "Profile updated successfully.", data = dto });
    }

    [HttpGet("public/{identifier}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicProfile(string identifier, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(identifier))
            return BadRequest(new { success = false, message = "Identifier is required." });

        var normalizedId = identifier.Trim().ToLowerInvariant();
        ApplicationUser? user = null;
        ProfessionalProfileRecord? professional = null;

        // 1. Primary lookup by stable PublicSlug
        professional = await _professionalStore.GetByPublicSlugAsync(normalizedId, ct);
        if (professional is not null)
        {
            user = await _userManager.FindByIdAsync(professional.UserId);
        }

        // 2. Secondary lookup by UserId or UserName
        if (user is null)
        {
            user = await _userManager.FindByIdAsync(identifier) ?? await _userManager.FindByNameAsync(identifier);
            if (user is not null && professional is null)
            {
                professional = await _professionalStore.GetByUserIdAsync(user.Id.ToString(), ct);
            }
        }

        if (user is null)
            return NotFound(new { success = false, message = "Public profile not found." });

        if (professional is null)
            professional = await _migration.EnsureProfessionalProfileAsync(user, ct);

        // Ensure PublicSlug is backfilled if missing
        if (string.IsNullOrWhiteSpace(professional.PublicSlug))
        {
            professional.PublicSlug = ProfileSlugGenerator.GenerateSlug(user.UserName ?? user.Name, user.Id.ToString());
            await _professionalStore.UpsertAsync(professional, cancellationToken: ct);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var baseDto = MapToUniversalDto(professional, user, roles);

        var publicDto = new PublicUserProfileResponseDto
        {
            UserId = baseDto.UserId,
            Name = baseDto.Name,
            Slug = baseDto.Slug,
            Headline = baseDto.Headline,
            Bio = baseDto.Bio,
            Country = baseDto.Country,
            City = baseDto.City,
            ProfessionalOverview = baseDto.ProfessionalOverview,
            ProfileImage = baseDto.ProfileImage,
            CoverImage = baseDto.CoverImage,
            Experiences = baseDto.Experiences,
            Education = baseDto.Education,
            Skills = baseDto.Skills,
            LanguageProficiencies = baseDto.LanguageProficiencies,
            Languages = baseDto.Languages,
            Industries = baseDto.Industries,
            SocialLinks = baseDto.SocialLinks,
            AvailabilityDisplay = baseDto.AvailabilityDisplay,
            Roles = baseDto.Roles,
            CompletionPercentage = baseDto.CompletionPercentage,
            CreatedAt = baseDto.CreatedAt,
            UpdatedAt = baseDto.UpdatedAt,
        };

        if (roles.Contains("ServiceProvider", StringComparer.OrdinalIgnoreCase))
        {
            try
            {
                var spRecord = await _spStore.GetByUserIdAsync(user.Id.ToString(), ct);
                var verifiedCreds = new List<PublicVerifiedCredentialDto>();
                if (_credentialStore is not null)
                {
                    var userCreds = await _credentialStore.GetByUserIdAsync(user.Id.ToString(), ct);
                    verifiedCreds = userCreds
                        .Where(c => c.Status == CredentialStatus.Verified)
                        .Select(c => new PublicVerifiedCredentialDto
                        {
                            Id = c.Id,
                            Title = c.Title,
                            IssuingOrganization = c.IssuingOrganization,
                            Status = "Verified",
                            IssuedAt = c.IssuedAt,
                            ExpiresAt = c.ExpiresAt
                        }).ToList();
                }

                var publishedListings = new List<PublicServiceListingDto>();
                if (_context is not null)
                {
                    var listings = await _context.ServiceListings
                        .Find(s => s.ProviderId == user.Id.ToString() && s.Status == CatalogStatus.Published)
                        .ToListAsync(ct);

                    var listingIds = listings.Select(l => l.Id).ToList();
                    var packages = listingIds.Count > 0
                        ? await _context.ServicePackages
                            .Find(p => listingIds.Contains(p.ServiceId))
                            .ToListAsync(ct)
                        : new List<ServicePackage>();

                    var packageMap = packages
                        .GroupBy(p => p.ServiceId)
                        .ToDictionary(g => g.Key, g => g.OrderBy(p => p.Price).FirstOrDefault());

                    publishedListings = listings.Select(l =>
                    {
                        packageMap.TryGetValue(l.Id, out var cheapestPkg);
                        return new PublicServiceListingDto
                        {
                            Id = l.Id,
                            Title = l.Title,
                            Description = l.Description,
                            Category = l.Category.ToString(),
                            PricingModel = cheapestPkg?.PricingModel != null ? cheapestPkg.PricingModel.ToString() : "Fixed",
                            StartingPrice = cheapestPkg?.Price ?? 0,
                            Currency = cheapestPkg?.Currency ?? "EUR",
                            PrimaryImageUrl = l.GalleryImages?.FirstOrDefault()?.PublicUrl,
                            Status = "Published"
                        };
                    }).ToList();
                }

                var portfolioItems = (spRecord?.PortfolioItems ?? new()).Select(p => new PublicPortfolioItemDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Url = p.Url,
                    ImagePath = p.ImagePath,
                    PrimaryImage = p.PrimaryImage is not null ? new MediaAssetDto
                    {
                        PublicUrl = p.PrimaryImage.PublicUrl,
                        StoragePath = p.PrimaryImage.StorageKey,
                        FileSizeBytes = p.PrimaryImage.Bytes,
                        Width = p.PrimaryImage.Width,
                        Height = p.PrimaryImage.Height
                    } : null,
                    ImageCaption = p.ImageCaption
                }).ToList();

                publicDto.ServiceProviderExtension = new ServiceProviderPublicExtensionDto
                {
                    VerificationStatus = spRecord?.VerificationStatus.ToString() ?? "Pending",
                    ProviderTier = (int)(spRecord?.ProviderTier ?? ProviderTier.Tier1),
                    TrustScore = spRecord?.TrustScore ?? 0,
                    HasEnoughTrustData = spRecord?.HasEnoughTrustData ?? false,
                    PublishedServices = publishedListings,
                    PortfolioItems = portfolioItems,
                    VerifiedCredentials = verifiedCreds,
                    RatingSummary = new PublicRatingSummaryDto
                    {
                        Rating = spRecord != null && spRecord.HasEnoughTrustData ? Math.Round(spRecord.TrustScore / 20.0, 1) : 0,
                        ReviewCount = 0,
                        HasEnoughData = spRecord?.HasEnoughTrustData ?? false
                    }
                };
            }
            catch
            {
                publicDto.ServiceProviderExtension = new ServiceProviderPublicExtensionDto();
            }
        }

        if (roles.Contains("Creator", StringComparer.OrdinalIgnoreCase) && _context is not null)
        {
            try
            {
                var projectsCount = await _context.BusinessIdeas.CountDocumentsAsync(
                    Builders<BusinessIdeas>.Filter.Eq(p => p.CreatorId, user.Id.ToString()) &
                    Builders<BusinessIdeas>.Filter.Eq(p => p.IsPublished, true),
                    cancellationToken: ct);

                publicDto.CreatorExtension = new CreatorPublicExtensionDto
                {
                    PublishedProjectsCount = (int)projectsCount,
                    FocusCategories = professional.Industries ?? new List<string>()
                };
            }
            catch
            {
                publicDto.CreatorExtension = new CreatorPublicExtensionDto();
            }
        }

        if (roles.Contains("Entrepreneur", StringComparer.OrdinalIgnoreCase) && _context is not null)
        {
            try
            {
                var companies = await _context.Companies.Find(
                    Builders<Companies>.Filter.Eq(c => c.OwnerId, user.Id.ToString())
                ).ToListAsync(ct);

                publicDto.EntrepreneurExtension = new EntrepreneurPublicExtensionDto
                {
                    Companies = companies.Select(c => new PublicCompanyAssociationDto
                    {
                        CompanyId = c.Id,
                        Name = c.CompanyName,
                        Logo = string.Empty,
                        Industry = c.Industry ?? string.Empty,
                        Role = "Founder"
                    }).ToList()
                };
            }
            catch
            {
                publicDto.EntrepreneurExtension = new EntrepreneurPublicExtensionDto();
            }
        }

        if (roles.Contains("Investor", StringComparer.OrdinalIgnoreCase) && _context is not null)
        {
            try
            {
                var investor = await _context.Investors.Find(
                    Builders<Investor>.Filter.Eq(i => i.LinkedUserId, user.Id.ToString()) &
                    Builders<Investor>.Filter.Eq(i => i.IsActive, true)
                ).FirstOrDefaultAsync(ct);

                if (investor is not null)
                {
                    publicDto.InvestorExtension = new InvestorPublicExtensionDto
                    {
                        InvestmentGeography = investor.PreferredGeographies?.FirstOrDefault() ?? string.Empty,
                        TargetStages = investor.PreferredStages ?? new List<string>(),
                        Thesis = investor.ThesisStatement ?? investor.Bio ?? string.Empty
                    };
                }
            }
            catch
            {
                publicDto.InvestorExtension = new InvestorPublicExtensionDto();
            }
        }

        return Ok(new { success = true, data = publicDto });
    }

    private static UniversalProfileResponseDto MapToUniversalDto(
        ProfessionalProfileRecord record,
        ApplicationUser user,
        IList<string> roles)
    {
        ProfessionalOverviewContentDto? overviewDto = null;
        if (record.ProfessionalOverview is not null)
        {
            JsonElement? overviewElement = null;
            if (record.ProfessionalOverview.Document is not null)
            {
                try
                {
                    overviewElement = JsonDocument.Parse(record.ProfessionalOverview.Document.ToJson()).RootElement.Clone();
                }
                catch
                {
                    overviewElement = null;
                }
            }

            overviewDto = new ProfessionalOverviewContentDto
            {
                SchemaVersion = record.ProfessionalOverview.SchemaVersion,
                Document = overviewElement,
                PlainText = record.ProfessionalOverview.PlainText ?? string.Empty
            };
        }

        return new UniversalProfileResponseDto
        {
            UserId = record.UserId,
            Name = user.Name ?? user.UserName ?? "Mondial Member",
            Slug = !string.IsNullOrWhiteSpace(record.PublicSlug) ? record.PublicSlug : (user.UserName ?? record.UserId),
            Headline = record.Headline ?? string.Empty,
            Bio = record.Bio ?? string.Empty,
            Country = string.Empty,
            City = string.Empty,
            ProfessionalOverview = overviewDto,
            ProfileImage = record.ProfileImage is not null ? new MediaAssetDto
            {
                PublicUrl = record.ProfileImage.PublicUrl,
                StoragePath = record.ProfileImage.StorageKey,
                FileSizeBytes = record.ProfileImage.Bytes,
                Width = record.ProfileImage.Width,
                Height = record.ProfileImage.Height
            } : null,
            CoverImage = record.CoverImage is not null ? new MediaAssetDto
            {
                PublicUrl = record.CoverImage.PublicUrl,
                StoragePath = record.CoverImage.StorageKey,
                FileSizeBytes = record.CoverImage.Bytes,
                Width = record.CoverImage.Width,
                Height = record.CoverImage.Height
            } : null,
            Experiences = (record.Experiences ?? new()).Select(e => new ProfessionalExperienceDto
            {
                Id = e.Id,
                JobTitle = e.JobTitle,
                CompanyName = e.CompanyName,
                StartDate = e.StartDate.ToString("yyyy-MM"),
                EndDate = e.EndDate?.ToString("yyyy-MM"),
                IsCurrent = e.IsCurrent,
                Description = e.Description
            }).ToList(),
            Education = (record.Education ?? new()).Select(e => new ProfessionalEducationDto
            {
                Id = e.Id,
                Institution = e.Institution,
                Degree = e.Degree,
                FieldOfStudy = e.FieldOfStudy,
                StartYear = e.StartYear,
                EndYear = e.EndYear,
                Description = e.Description
            }).ToList(),
            Skills = record.Skills ?? new(),
            LanguageProficiencies = (record.LanguageProficiencies ?? new()).Select(l => new ProfessionalLanguageDto
            {
                Id = l.Id,
                Language = l.Language,
                Proficiency = l.Proficiency.ToString()
            }).ToList(),
            Languages = record.Languages ?? new(),
            Industries = record.Industries ?? new(),
            SocialLinks = (record.SocialLinks ?? new()).Select(s => new ProfessionalSocialLinkDto
            {
                Id = s.Id,
                Platform = s.Platform,
                Url = s.Url
            }).ToList(),
            AvailabilityDisplay = record.AvailabilityDisplay,
            Roles = roles.ToList(),
            CompletionPercentage = CalculateCompletion(record),
            CreatedAt = record.CreatedAt,
            UpdatedAt = record.UpdatedAt
        };
    }

    private static int CalculateCompletion(ProfessionalProfileRecord p)
    {
        var score = 0;
        if (!string.IsNullOrWhiteSpace(p.Headline)) score += 15;
        if (!string.IsNullOrWhiteSpace(p.Bio)) score += 15;
        if (p.ProfileImage is not null && !string.IsNullOrWhiteSpace(p.ProfileImage.PublicUrl)) score += 15;
        if (p.CoverImage is not null && !string.IsNullOrWhiteSpace(p.CoverImage.PublicUrl)) score += 15;
        if ((p.Experiences ?? new()).Count > 0) score += 10;
        if ((p.Education ?? new()).Count > 0) score += 10;
        if ((p.Skills ?? new()).Count > 0) score += 10;
        if ((p.LanguageProficiencies ?? new()).Count > 0) score += 10;
        return Math.Min(100, score);
    }

    private static DateTime ParseDate(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr)) return DateTime.UtcNow;
        if (DateTime.TryParse(dateStr, out var d)) return d;
        return DateTime.UtcNow;
    }

    private static DateTime? ParseNullableDate(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr)) return null;
        if (DateTime.TryParse(dateStr, out var d)) return d;
        return null;
    }

    private static LanguageProficiency ParseProficiency(string? p)
    {
        if (string.IsNullOrWhiteSpace(p)) return LanguageProficiency.Conversational;
        if (Enum.TryParse<LanguageProficiency>(p, true, out var result)) return result;
        return LanguageProficiency.Conversational;
    }
}

