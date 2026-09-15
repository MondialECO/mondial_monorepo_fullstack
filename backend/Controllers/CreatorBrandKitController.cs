using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Creator.BrandKit.ColorEngine;
using WebApp.Services.Creator.BrandKit.DirectionEngine;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using WebApp.Services.Creator.BrandKit.TypographyEngine;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 2 Brand Visual Identity Studio HTTP surface.
    /// Manages BrandKit retrieval, idempotent creation, targeted partial updates
    /// per section, server-side sequencing enforcement, step advancement, concurrency-guarded snapshots,
    /// and atomic Project.Branding summary synchronization.
    /// </summary>
    [Route("api/creator/journey/phase2/brand-kit")]
    [ApiController]
    [Authorize]
    public class CreatorBrandKitController : ControllerBase
    {
        private const int MaxRegenerations = 3;

        private readonly ICreatorJourneyService _journeys;
        private readonly IBrandKitStore _brandKitStore;
        private readonly ICreatorIdeaStore? _creatorIdeas;
        private readonly ILogoGenerationService? _logoGenerationService;
        private readonly ILogoVariationService? _logoVariationService;
        private readonly IDirectionGenerationService? _directionGenerationService;
        private readonly IColorGenerationService? _colorGenerationService;
        private readonly ITypographyGenerationService? _typographyGenerationService;
        private readonly IAiCreditService? _aiCreditService;
        private readonly IMongoClient? _mongoClient;
        private readonly ILogger<CreatorBrandKitController>? _logger;
        private readonly bool _transactionsEnabled;

        public CreatorBrandKitController(
            ICreatorJourneyService journeys,
            IBrandKitStore brandKitStore,
            ICreatorIdeaStore? creatorIdeas = null,
            ILogoGenerationService? logoGenerationService = null,
            IMongoClient? mongoClient = null,
            IConfiguration? config = null,
            ILogger<CreatorBrandKitController>? logger = null,
            ILogoVariationService? logoVariationService = null,
            IDirectionGenerationService? directionGenerationService = null,
            IColorGenerationService? colorGenerationService = null,
            ITypographyGenerationService? typographyGenerationService = null,
            IAiCreditService? aiCreditService = null)
        {
            _journeys = journeys;
            _brandKitStore = brandKitStore;
            _creatorIdeas = creatorIdeas;
            _logoGenerationService = logoGenerationService;
            _mongoClient = mongoClient;
            _logger = logger;
            _logoVariationService = logoVariationService;
            _directionGenerationService = directionGenerationService;
            _colorGenerationService = colorGenerationService;
            _typographyGenerationService = typographyGenerationService;
            _aiCreditService = aiCreditService;
            _transactionsEnabled = config?.GetValue("Mongo:TransactionsEnabled", true) ?? true;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        /// <summary>
        /// Atomically updates the BrandKit and conditionally syncs the 4 summary fields to CreatorIdea.Project.Branding.
        /// If the 4 summary fields are unchanged, the write to CreatorIdea is skipped entirely, preserving CreatorIdea.Version.
        /// When both collections must be written, wraps both in a client session transaction if enabled,
        /// or executes clearly ordered writes (BrandKit authoritative write first) if transactions are disabled.
        /// </summary>
        private async Task<bool> CommitBrandKitAndSyncAsync(
            string ideaId,
            string userId,
            UpdateDefinition<BrandKit> kitUpdate,
            long? expectedVersion,
            UpdateOptions? options,
            CreatorIdea idea,
            string? newBrandingMethod,
            string? newLogoAsset,
            string? newPaletteName,
            string? newTypographyPairing)
        {
            var currentBranding = idea.Project?.Branding;

            bool requiresIdeaSync = false;
            string? methodToSync = null;
            string? assetToSync = null;
            string? paletteToSync = null;
            string? typeToSync = null;

            if (newBrandingMethod != null || newLogoAsset != null || newPaletteName != null || newTypographyPairing != null)
            {
                methodToSync = newBrandingMethod ?? currentBranding?.BrandingMethod ?? "ai_studio";
                assetToSync = newLogoAsset ?? currentBranding?.LogoAsset ?? string.Empty;
                paletteToSync = newPaletteName ?? currentBranding?.PaletteName ?? string.Empty;
                typeToSync = newTypographyPairing ?? currentBranding?.TypographyPairing ?? string.Empty;

                bool methodChanged = newBrandingMethod != null && currentBranding?.BrandingMethod != newBrandingMethod;
                bool assetChanged = newLogoAsset != null && currentBranding?.LogoAsset != newLogoAsset;
                bool paletteChanged = newPaletteName != null && currentBranding?.PaletteName != newPaletteName;
                bool typeChanged = newTypographyPairing != null && currentBranding?.TypographyPairing != newTypographyPairing;

                requiresIdeaSync = methodChanged || assetChanged || paletteChanged || typeChanged;
            }

            if (!requiresIdeaSync || _creatorIdeas == null)
            {
                return await _brandKitStore.UpdateAsync(ideaId, userId, kitUpdate, expectedVersion, session: null, options: options);
            }

            if (_transactionsEnabled && _mongoClient != null)
            {
                using var session = await _mongoClient.StartSessionAsync();
                session.StartTransaction();
                try
                {
                    var kitUpdated = await _brandKitStore.UpdateAsync(ideaId, userId, kitUpdate, expectedVersion, session, options);
                    if (!kitUpdated)
                    {
                        await session.AbortTransactionAsync();
                        return false;
                    }

                    var ideaUpdated = await _creatorIdeas.SyncBrandKitSummaryAsync(
                        ideaId, userId, methodToSync!, assetToSync!, paletteToSync!, typeToSync!, session);
                    if (!ideaUpdated)
                    {
                        await session.AbortTransactionAsync();
                        return false;
                    }

                    await session.CommitTransactionAsync();
                    return true;
                }
                catch
                {
                    await session.AbortTransactionAsync();
                    throw;
                }
            }
            else
            {
                if (!_transactionsEnabled && _logger != null)
                {
                    _logger.LogWarning("MongoDB transactions disabled; executing fallback sequential writes for BrandKit and CreatorIdea summary sync.");
                }

                // Clearly ordered fallback: BrandKit (authoritative) first
                var kitUpdated = await _brandKitStore.UpdateAsync(ideaId, userId, kitUpdate, expectedVersion, session: null, options: options);
                if (!kitUpdated)
                {
                    return false;
                }

                // CreatorIdea (derived echo) second
                await _creatorIdeas.SyncBrandKitSummaryAsync(
                    ideaId, userId, methodToSync!, assetToSync!, paletteToSync!, typeToSync!, session: null);

                return true;
            }
        }

        /// <summary>
        /// Resolves the {Heading} + {Body} typography pairing string following product specifications:
        /// Uses Typography.Roles where RoleName is 'Heading' and 'Body' (or from Direction candidate
        /// typography if Typography roles are not yet customized with Provenance == "user").
        /// </summary>
        private static string ResolveTypographyPairing(
            BrandKit kit,
            BrandDirectionCandidate? selectedCand = null,
            string? overrideHeadingFamily = null,
            string? overrideBodyFamily = null)
        {
            if (selectedCand == null && kit.Direction?.Candidates != null && !string.IsNullOrEmpty(kit.Direction.SelectedDirectionKey))
            {
                selectedCand = kit.Direction.Candidates.FirstOrDefault(c => c.Key == kit.Direction.SelectedDirectionKey);
            }

            var headingRole = kit.Typography?.Roles?.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Heading);
            var bodyRole = kit.Typography?.Roles?.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Body);

            string? headingFont = overrideHeadingFamily;
            if (string.IsNullOrWhiteSpace(headingFont))
            {
                if (headingRole != null && string.Equals(headingRole.Provenance, "user", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(headingRole.Family))
                {
                    headingFont = headingRole.Family;
                }
                else if (!string.IsNullOrWhiteSpace(selectedCand?.DisplayTypeface))
                {
                    headingFont = selectedCand.DisplayTypeface;
                }
                else if (!string.IsNullOrWhiteSpace(headingRole?.Family))
                {
                    headingFont = headingRole.Family;
                }
                else if (!string.IsNullOrWhiteSpace(kit.Typography?.Families?.DisplayFamily?.Name))
                {
                    headingFont = kit.Typography.Families.DisplayFamily.Name;
                }
                else
                {
                    headingFont = "Syne";
                }
            }

            string? bodyFont = overrideBodyFamily;
            if (string.IsNullOrWhiteSpace(bodyFont))
            {
                if (bodyRole != null && string.Equals(bodyRole.Provenance, "user", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(bodyRole.Family))
                {
                    bodyFont = bodyRole.Family;
                }
                else if (!string.IsNullOrWhiteSpace(selectedCand?.TextTypeface))
                {
                    bodyFont = selectedCand.TextTypeface;
                }
                else if (!string.IsNullOrWhiteSpace(bodyRole?.Family))
                {
                    bodyFont = bodyRole.Family;
                }
                else if (!string.IsNullOrWhiteSpace(kit.Typography?.Families?.TextFamily?.Name))
                {
                    bodyFont = kit.Typography.Families.TextFamily.Name;
                }
                else
                {
                    bodyFont = "DM Sans";
                }
            }

            return $"{headingFont} + {bodyFont}";
        }

        // =========================================================================
        // 1. GET BRAND KIT
        // =========================================================================
        [HttpGet]
        public async Task<IActionResult> GetKit([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return Ok(ApiResponse.Ok("No brand kit found for this idea.", null));

                // Backfill Strategy if unpopulated and idea.Project has a name
                if (string.IsNullOrWhiteSpace(kit.Strategy?.BusinessName) && !string.IsNullOrWhiteSpace(idea.Project?.Name))
                {
                    var derivedStrategy = DeriveInitialStrategy(idea.Project);
                    var backfillUpdate = Builders<BrandKit>.Update.Set(x => x.Strategy, derivedStrategy);
                    await _brandKitStore.UpdateAsync(idea.Id, userId, backfillUpdate);
                    kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId) ?? kit;
                }

                return Ok(ApiResponse.Ok("Brand kit retrieved", kit));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 2. CREATE BRAND KIT (IDEMPOTENT)
        // =========================================================================
        [HttpPost]
        public async Task<IActionResult> CreateKit([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var existing = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (existing != null)
                {
                    if (string.IsNullOrWhiteSpace(existing.Strategy?.BusinessName) && !string.IsNullOrWhiteSpace(idea.Project?.Name))
                    {
                        var derivedStrategy = DeriveInitialStrategy(idea.Project);
                        var backfillUpdate = Builders<BrandKit>.Update.Set(x => x.Strategy, derivedStrategy);
                        await _brandKitStore.UpdateAsync(idea.Id, userId, backfillUpdate);
                        existing = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId) ?? existing;
                    }
                    return Ok(ApiResponse.Ok("Brand kit retrieved", existing));
                }

                var now = DateTime.UtcNow;
                var initialStrategy = DeriveInitialStrategy(idea.Project ?? new CreatorJourneyProject());

                var kit = new BrandKit
                {
                    IdeaId = idea.Id,
                    UserId = userId,
                    Status = "draft",
                    CurrentStep = 1,
                    Version = 1,
                    CreatedAt = now,
                    UpdatedAt = now,
                    Strategy = initialStrategy,
                    Colors = new BrandColors
                    {
                        Roles = new List<BrandColorRole>
                        {
                            new() { RoleName = BrandColorRoleNames.Primary, Hex = "#1A1A24", Rgb = "26,26,36", ContrastRatio = 12.4, ContrastVerdict = "AAA", IsLocked = false, Provenance = "stated" },
                            new() { RoleName = BrandColorRoleNames.Secondary, Hex = "#3C61DD", Rgb = "60,97,221", ContrastRatio = 4.8, ContrastVerdict = "AA", IsLocked = false, Provenance = "derived" },
                            new() { RoleName = BrandColorRoleNames.Accent, Hex = "#00D084", Rgb = "0,208,132", ContrastRatio = 3.5, ContrastVerdict = "AA_Large", IsLocked = false, Provenance = "derived" },
                            new() { RoleName = BrandColorRoleNames.Background, Hex = "#FFFFFF", Rgb = "255,255,255", ContrastRatio = null, ContrastVerdict = null, IsLocked = true, Provenance = "stated" },
                            new() { RoleName = BrandColorRoleNames.Text, Hex = "#0F172A", Rgb = "15,23,42", ContrastRatio = 14.2, ContrastVerdict = "AAA", IsLocked = false, Provenance = "derived" }
                        }
                    },
                    Typography = new BrandTypography
                    {
                        Roles = new List<BrandTypographyRole>
                        {
                            new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Cabinet Grotesk", Weight = "800", IsLocked = true, Provenance = "stated" },
                            new() { RoleName = BrandTypographyRoleNames.Heading, Family = "Clash Display", Weight = "700", IsLocked = false, Provenance = "derived" },
                            new() { RoleName = BrandTypographyRoleNames.Body, Family = "Inter", Weight = "400", IsLocked = false, Provenance = "derived" },
                            new() { RoleName = BrandTypographyRoleNames.ButtonAndLabel, Family = "Inter", Weight = "600", IsLocked = false, Provenance = "derived" }
                        }
                    }
                };

                try
                {
                    await _brandKitStore.AddAsync(kit);
                    return Ok(ApiResponse.Ok("Brand kit created", kit));
                }
                catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
                {
                    var winner = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                    return Ok(ApiResponse.Ok("Brand kit retrieved", winner));
                }
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        private static BrandStrategy DeriveInitialStrategy(CreatorJourneyProject project)
        {
            var businessName = !string.IsNullOrWhiteSpace(project.Name) ? project.Name.Trim() : string.Empty;
            var nameDisplayForm = businessName;

            var conceptValue = !string.IsNullOrWhiteSpace(project.Concept)
                ? project.Concept.Trim()
                : (!string.IsNullOrWhiteSpace(project.Solution) ? project.Solution.Trim() : string.Empty);
            var conceptProvenance = !string.IsNullOrWhiteSpace(project.Concept) || !string.IsNullOrWhiteSpace(project.Solution) ? "stated" : "derived";

            var audienceValue = !string.IsNullOrWhiteSpace(project.TargetUser) ? project.TargetUser.Trim() : string.Empty;
            var audienceProvenance = !string.IsNullOrWhiteSpace(project.TargetUser) ? "stated" : "derived";

            var industryValue = !string.IsNullOrWhiteSpace(project.Category)
                ? project.Category.Trim()
                : (project.Tags != null && project.Tags.Count > 0 ? project.Tags[0].Trim() : string.Empty);
            var industryProvenance = !string.IsNullOrWhiteSpace(project.Category) ? "stated" : "derived";

            var positioningValue = !string.IsNullOrWhiteSpace(project.MarketGap)
                ? project.MarketGap.Trim()
                : (!string.IsNullOrWhiteSpace(project.Solution) ? project.Solution.Trim() : string.Empty);
            var positioningProvenance = !string.IsNullOrWhiteSpace(project.MarketGap) || !string.IsNullOrWhiteSpace(project.Solution) ? "stated" : "derived";

            var personalityTraits = new List<string>();
            if (project.Tags != null && project.Tags.Count > 0)
            {
                personalityTraits.AddRange(project.Tags.Where(t => !string.IsNullOrWhiteSpace(t)).Take(3));
            }
            if (!string.IsNullOrWhiteSpace(project.CreatorEdge) && personalityTraits.Count < 4)
            {
                personalityTraits.Add(project.CreatorEdge.Trim());
            }
            if (personalityTraits.Count == 0)
            {
                personalityTraits.AddRange(new[] { "Precise", "Resilient", "Autonomous" });
            }

            var avoidList = new List<string>();
            if (!string.IsNullOrWhiteSpace(project.Category))
            {
                var cat = project.Category.ToLowerInvariant();
                if (cat.Contains("security") || cat.Contains("cyber"))
                {
                    avoidList.AddRange(new[] { "Cliché padlocks", "Generic shields" });
                }
                else if (cat.Contains("agri") || cat.Contains("farm") || cat.Contains("food"))
                {
                    avoidList.AddRange(new[] { "Generic leaves", "Literal wheat ears" });
                }
                else if (cat.Contains("lux") || cat.Contains("real") || cat.Contains("arch"))
                {
                    avoidList.AddRange(new[] { "Gaudy gold bevels", "Roof outlines" });
                }
                else if (cat.Contains("health") || cat.Contains("med"))
                {
                    avoidList.AddRange(new[] { "Generic red crosses", "Stethoscope rings" });
                }
                else if (cat.Contains("fin") || cat.Contains("money") || cat.Contains("pay"))
                {
                    avoidList.AddRange(new[] { "Literal dollar signs", "Generic bar charts" });
                }
            }

            var derivedConstraints = ComputeDerivedConstraints(businessName);

            return new BrandStrategy
            {
                BusinessName = businessName,
                NameDisplayForm = nameDisplayForm,
                Concept = new BrandProvenancedText { Value = conceptValue, Provenance = conceptProvenance },
                TargetAudience = new BrandProvenancedText { Value = audienceValue, Provenance = audienceProvenance },
                Industry = new BrandProvenancedText { Value = industryValue, Provenance = industryProvenance },
                Positioning = new BrandProvenancedText { Value = positioningValue, Provenance = positioningProvenance },
                PersonalityTraits = personalityTraits.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
                AvoidList = avoidList,
                TonePosition = "balanced",
                FirstAppearance = "website",
                SymbolFeeling = "The Guardian",
                DerivedConstraints = derivedConstraints,
                ConfirmedAt = null
            };
        }

        private static BrandDerivedConstraints ComputeDerivedConstraints(string businessName)
        {
            if (string.IsNullOrWhiteSpace(businessName))
            {
                return new BrandDerivedConstraints();
            }

            var clean = businessName.Trim();
            var words = clean.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            var charLen = clean.Length;
            var wordCount = words.Length;

            var initials = words.Length switch
            {
                0 => "",
                1 => clean.Length > 0 ? clean.Substring(0, 1).ToUpperInvariant() : "",
                2 => $"{char.ToUpperInvariant(words[0][0])}{char.ToUpperInvariant(words[1][0])}",
                _ => $"{char.ToUpperInvariant(words[0][0])}{char.ToUpperInvariant(words[1][0])}{char.ToUpperInvariant(words[2][0])}"
            };

            return new BrandDerivedConstraints
            {
                CharacterLength = charLen,
                WordCount = wordCount,
                Script = "Latin",
                MonogramInitials = initials,
                IsIconOnlyViable = charLen <= 12
            };
        }

        // =========================================================================
        // 3. PATCH STRATEGY
        // =========================================================================
        [HttpPatch("strategy")]
        public async Task<IActionResult> PatchStrategy(
            [FromBody] BrandStrategyPatchDto dto,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("strategy", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                var updateBuilder = Builders<BrandKit>.Update;
                var updates = new List<UpdateDefinition<BrandKit>>();

                if (dto.BusinessName != null) updates.Add(updateBuilder.Set(x => x.Strategy.BusinessName, dto.BusinessName));
                if (dto.NameDisplayForm != null) updates.Add(updateBuilder.Set(x => x.Strategy.NameDisplayForm, dto.NameDisplayForm));
                if (dto.Concept != null) updates.Add(updateBuilder.Set(x => x.Strategy.Concept.Value, dto.Concept));
                if (dto.TargetAudience != null) updates.Add(updateBuilder.Set(x => x.Strategy.TargetAudience.Value, dto.TargetAudience));
                if (dto.Industry != null) updates.Add(updateBuilder.Set(x => x.Strategy.Industry.Value, dto.Industry));
                if (dto.Positioning != null) updates.Add(updateBuilder.Set(x => x.Strategy.Positioning.Value, dto.Positioning));
                if (dto.TonePosition != null) updates.Add(updateBuilder.Set(x => x.Strategy.TonePosition, dto.TonePosition));
                if (dto.FirstAppearance != null) updates.Add(updateBuilder.Set(x => x.Strategy.FirstAppearance, dto.FirstAppearance));
                if (dto.SymbolFeeling != null) updates.Add(updateBuilder.Set(x => x.Strategy.SymbolFeeling, dto.SymbolFeeling));
                if (dto.ConfirmedAt != null) updates.Add(updateBuilder.Set(x => x.Strategy.ConfirmedAt, dto.ConfirmedAt));

                // Empty array semantics: [] clears the list; null leaves untouched
                if (dto.PersonalityTraits != null) updates.Add(updateBuilder.Set(x => x.Strategy.PersonalityTraits, dto.PersonalityTraits));
                if (dto.AvoidList != null) updates.Add(updateBuilder.Set(x => x.Strategy.AvoidList, dto.AvoidList));

                if (updates.Count == 0)
                    return BadRequest(ApiResponse.Error("At least one field must be provided for update."));

                var combinedUpdate = updateBuilder.Combine(updates);
                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Strategy updated", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 4. PATCH DIRECTION
        // =========================================================================
        [HttpPatch("direction")]
        public async Task<IActionResult> PatchDirection(
            [FromBody] BrandDirectionPatchDto dto,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("direction", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                var updateBuilder = Builders<BrandKit>.Update;
                var updates = new List<UpdateDefinition<BrandKit>>();

                if (dto.SelectedDirectionKey != null) updates.Add(updateBuilder.Set(x => x.Direction.SelectedDirectionKey, dto.SelectedDirectionKey));
                if (dto.SelectedAt != null) updates.Add(updateBuilder.Set(x => x.Direction.SelectedAt, dto.SelectedAt));

                if (dto.Candidates != null)
                {
                    var candidates = dto.Candidates.Select(c => new BrandDirectionCandidate
                    {
                        Key = c.Key,
                        Name = c.Name,
                        FeelLine = c.FeelLine,
                        Rationale = c.Rationale,
                        ColorPalette = c.ColorPalette ?? new List<string>(),
                        DisplayTypeface = c.DisplayTypeface,
                        TextTypeface = c.TextTypeface,
                        MotifKey = c.MotifKey,
                        Provenance = c.Provenance ?? "ai",
                        AvoidListSubstituted = c.AvoidListSubstituted.GetValueOrDefault()
                    }).ToList();
                    updates.Add(updateBuilder.Set(x => x.Direction.Candidates, candidates));
                }

                if (dto.AdjustmentSettings != null)
                {
                    if (dto.AdjustmentSettings.PaletteVariant != null)
                        updates.Add(updateBuilder.Set(x => x.Direction.AdjustmentSettings.PaletteVariant, dto.AdjustmentSettings.PaletteVariant));
                    if (dto.AdjustmentSettings.ContrastPosition != null)
                        updates.Add(updateBuilder.Set(x => x.Direction.AdjustmentSettings.ContrastPosition, dto.AdjustmentSettings.ContrastPosition));
                    if (dto.AdjustmentSettings.TypeWeight != null)
                        updates.Add(updateBuilder.Set(x => x.Direction.AdjustmentSettings.TypeWeight, dto.AdjustmentSettings.TypeWeight));
                }

                if (updates.Count == 0)
                    return BadRequest(ApiResponse.Error("At least one field must be provided for update."));

                var combinedUpdate = updateBuilder.Combine(updates);
                bool updated;

                bool isApproved = kit.Logo?.ApprovedAt != null || string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase);
                if (isApproved && (dto.SelectedDirectionKey != null || dto.Candidates != null))
                {
                    var chosenKey = dto.SelectedDirectionKey ?? kit.Direction?.SelectedDirectionKey;
                    string? newPaletteName = null;
                    BrandDirectionCandidate? chosenCand = null;

                    if (dto.Candidates != null && chosenKey != null)
                    {
                        var candDto = dto.Candidates.FirstOrDefault(c => c.Key == chosenKey);
                        if (candDto != null)
                        {
                            newPaletteName = candDto.Name;
                            chosenCand = new BrandDirectionCandidate
                            {
                                Key = candDto.Key,
                                Name = candDto.Name,
                                DisplayTypeface = candDto.DisplayTypeface,
                                TextTypeface = candDto.TextTypeface
                            };
                        }
                    }
                    if (newPaletteName == null && chosenKey != null)
                    {
                        chosenCand = kit.Direction?.Candidates?.FirstOrDefault(c => c.Key == chosenKey);
                        if (chosenCand != null)
                        {
                            newPaletteName = chosenCand.Name;
                        }
                    }

                    string? newTypographyPairing = null;
                    if (newPaletteName != null)
                    {
                        newTypographyPairing = ResolveTypographyPairing(kit, chosenCand);
                    }

                    updated = await CommitBrandKitAndSyncAsync(
                        idea.Id, userId, combinedUpdate, expectedVersion, options: null,
                        idea, newBrandingMethod: null, newLogoAsset: null, newPaletteName, newTypographyPairing);
                }
                else
                {
                    updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
                }

                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Direction updated", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 4b. GENERATE DIRECTION CANDIDATES
        // =========================================================================
        [HttpPost("direction/generate")]
        public async Task<IActionResult> GenerateDirections(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null,
            CancellationToken cancellationToken = default)
        {
            string? creditOpId = null;
            string? currentUserId = null;
            try
            {
                var userId = GetUserId();
                currentUserId = userId;
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                if (kit.Strategy?.ConfirmedAt == null)
                {
                    return BadRequest(ApiResponse.Error("Strategy must be confirmed before visual directions can be generated."));
                }

                bool isRegeneration = kit.Direction?.Candidates != null && kit.Direction.Candidates.Count > 0;
                if (isRegeneration && (kit.Direction?.RegenerateCount ?? 0) >= MaxRegenerations)
                {
                    return BadRequest(ApiResponse.Error($"Visual direction candidates have reached the maximum regeneration limit ({MaxRegenerations}/{MaxRegenerations})."));
                }

                if (_directionGenerationService == null)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Direction generation service is not available."));
                }

                if (_aiCreditService != null)
                {
                    creditOpId = Guid.NewGuid().ToString("N");
                    await _aiCreditService.DebitForJobAsync(userId, AiJobType.DirectionGeneration, creditOpId);
                }

                List<BrandDirectionCandidate>? candidates;
                try
                {
                    candidates = await _directionGenerationService.GenerateCandidatesAsync(idea, kit, cancellationToken);
                }
                catch
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.DirectionGeneration, creditOpId, "Direction candidate generation failed before persistence");
                    }
                    throw;
                }

                if (candidates == null || candidates.Count == 0)
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.DirectionGeneration, creditOpId, "Empty direction candidates generated");
                    }
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Failed to generate visual direction candidates."));
                }

                var nextRegenCount = isRegeneration ? (kit.Direction?.RegenerateCount ?? 0) + 1 : 0;
                var update = Builders<BrandKit>.Update
                    .Set(x => x.Direction.Candidates, candidates)
                    .Set(x => x.Direction.RegenerateCount, nextRegenCount);

                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion);
                if (!updated)
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.DirectionGeneration, creditOpId, "Optimistic concurrency conflict on direction save");
                    }
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error(
                        "This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Visual directions generated", reloaded));
            }
            catch (InsufficientCreditsException ex) { return StatusCode(StatusCodes.Status402PaymentRequired, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 5. PATCH LOGO
        // =========================================================================
        [HttpPatch("logo")]
        public async Task<IActionResult> PatchLogo(
            [FromBody] BrandLogoPatchDto dto,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("logo", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                var updateBuilder = Builders<BrandKit>.Update;
                var updates = new List<UpdateDefinition<BrandKit>>();

                if (dto.LogoType != null) updates.Add(updateBuilder.Set(x => x.Logo.LogoType, dto.LogoType));
                if (dto.SelectedConceptKey != null) updates.Add(updateBuilder.Set(x => x.Logo.SelectedConceptKey, dto.SelectedConceptKey));
                if (dto.ApprovedAt != null) updates.Add(updateBuilder.Set(x => x.Logo.ApprovedAt, dto.ApprovedAt));

                if (dto.Concepts != null)
                {
                    var concepts = dto.Concepts.Select(c => new BrandLogoConcept
                    {
                        Key = c.Key,
                        DescriptorLine = c.DescriptorLine,
                        MarkAssetUri = c.MarkAssetUri,
                        LockupAssetUri = c.LockupAssetUri,
                        Parameters = c.Parameters
                    }).ToList();
                    updates.Add(updateBuilder.Set(x => x.Logo.Concepts, concepts));
                }

                if (dto.RefinementSettings != null)
                {
                    if (dto.RefinementSettings.SymbolSize != null)
                        updates.Add(updateBuilder.Set(x => x.Logo.RefinementSettings.SymbolSize, dto.RefinementSettings.SymbolSize));
                    if (dto.RefinementSettings.Spacing != null)
                        updates.Add(updateBuilder.Set(x => x.Logo.RefinementSettings.Spacing, dto.RefinementSettings.Spacing));
                    if (dto.RefinementSettings.Arrangement != null)
                        updates.Add(updateBuilder.Set(x => x.Logo.RefinementSettings.Arrangement, dto.RefinementSettings.Arrangement));
                }

                if (dto.Variations != null)
                {
                    foreach (var (key, variation) in dto.Variations)
                    {
                        if (BrandLogoVariationKeys.All.Contains(key))
                        {
                            updates.Add(updateBuilder.Set(
                                $"Logo.Variations.{key}",
                                new BrandLogoVariation
                                {
                                    SvgUri = variation.SvgUri,
                                    PngUri = variation.PngUri,
                                    UsageNote = variation.UsageNote
                                }));
                        }
                    }
                }

                var targetConceptKey = dto.SelectedConceptKey ?? kit.Logo?.SelectedConceptKey;
                BrandLogoConcept? targetConcept = null;
                if (dto.Concepts != null)
                {
                    var foundDto = dto.Concepts.FirstOrDefault(c => c.Key == targetConceptKey);
                    if (foundDto != null)
                    {
                        targetConcept = new BrandLogoConcept
                        {
                            Key = foundDto.Key,
                            DescriptorLine = foundDto.DescriptorLine,
                            MarkAssetUri = foundDto.MarkAssetUri,
                            LockupAssetUri = foundDto.LockupAssetUri,
                            Parameters = foundDto.Parameters
                        };
                    }
                }
                if (targetConcept == null && kit.Logo?.Concepts != null)
                {
                    targetConcept = kit.Logo.Concepts.FirstOrDefault(c => c.Key == targetConceptKey);
                }
                Dictionary<string, BrandLogoVariation>? autoDerivedVariations = null;

                if (dto.Variations == null && targetConcept != null && _logoVariationService != null && (dto.ApprovedAt != null || dto.SelectedConceptKey != null))
                {
                    var brandName = !string.IsNullOrWhiteSpace(kit.Strategy?.NameDisplayForm)
                        ? kit.Strategy.NameDisplayForm
                        : (!string.IsNullOrWhiteSpace(kit.Strategy?.BusinessName) ? kit.Strategy.BusinessName : (idea.Project?.Name ?? "Brand"));
                    autoDerivedVariations = await _logoVariationService.DeriveVariationsAsync(
                        idea.Id, brandName, targetConcept, kit, HttpContext.RequestAborted);
                    updates.Add(updateBuilder.Set(x => x.Logo.Variations, autoDerivedVariations));
                }

                if (updates.Count == 0)
                    return BadRequest(ApiResponse.Error("At least one field must be provided for update."));

                var combinedUpdate = updateBuilder.Combine(updates);
                bool updated;

                bool isApproved = dto.ApprovedAt != null || kit.Logo?.ApprovedAt != null;
                if (isApproved)
                {
                    var newBrandingMethod = "ai_studio";
                    string? newLogoAsset = null;
                    if (dto.Variations != null && dto.Variations.TryGetValue(BrandLogoVariationKeys.Primary, out var primVar))
                    {
                        newLogoAsset = primVar.PngUri ?? primVar.SvgUri;
                    }
                    else if (autoDerivedVariations != null && autoDerivedVariations.TryGetValue(BrandLogoVariationKeys.Primary, out var autoPrim))
                    {
                        newLogoAsset = autoPrim.PngUri ?? autoPrim.SvgUri;
                    }
                    else if (kit.Logo?.Variations != null && kit.Logo.Variations.TryGetValue(BrandLogoVariationKeys.Primary, out var existPrim))
                    {
                        newLogoAsset = existPrim.PngUri ?? existPrim.SvgUri;
                    }
                    else if (!string.IsNullOrEmpty(dto.SelectedConceptKey))
                    {
                        var dtoConcept = dto.Concepts?.FirstOrDefault(c => c.Key == dto.SelectedConceptKey);
                        newLogoAsset = dtoConcept?.LockupAssetUri
                            ?? kit.Logo?.Concepts?.FirstOrDefault(c => c.Key == dto.SelectedConceptKey)?.LockupAssetUri;
                    }
                    else if (!string.IsNullOrEmpty(kit.Logo?.SelectedConceptKey))
                    {
                        newLogoAsset = kit.Logo.Concepts.FirstOrDefault(c => c.Key == kit.Logo.SelectedConceptKey)?.LockupAssetUri;
                    }

                    var selectedCand = kit.Direction?.Candidates?.FirstOrDefault(c => c.Key == kit.Direction.SelectedDirectionKey);
                    var newPaletteName = selectedCand?.Name ?? string.Empty;
                    var newTypographyPairing = ResolveTypographyPairing(kit, selectedCand);

                    updated = await CommitBrandKitAndSyncAsync(
                        idea.Id, userId, combinedUpdate, expectedVersion, options: null,
                        idea, newBrandingMethod, newLogoAsset, newPaletteName, newTypographyPairing);
                }
                else
                {
                    updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
                }

                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Logo updated", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 5. DERIVE LOGO VARIATIONS
        // =========================================================================
        [HttpPost("logo/derive-variations")]
        public async Task<IActionResult> DeriveLogoVariations(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("logo", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                if (string.IsNullOrEmpty(kit.Logo?.SelectedConceptKey))
                    return BadRequest(ApiResponse.Error("A logo concept must be selected/approved before deriving variations."));

                var approvedConcept = kit.Logo.Concepts.FirstOrDefault(c => c.Key == kit.Logo.SelectedConceptKey);
                if (approvedConcept == null)
                    return NotFound(ApiResponse.Error($"Selected logo concept '{kit.Logo.SelectedConceptKey}' not found."));

                if (_logoVariationService == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Logo variation service is unavailable."));

                var brandName = !string.IsNullOrWhiteSpace(kit.Strategy?.NameDisplayForm)
                    ? kit.Strategy.NameDisplayForm
                    : (!string.IsNullOrWhiteSpace(kit.Strategy?.BusinessName) ? kit.Strategy.BusinessName : (idea.Project?.Name ?? "Brand"));
                var variations = await _logoVariationService.DeriveVariationsAsync(idea.Id, brandName, approvedConcept, kit, cancellationToken);

                var updateBuilder = Builders<BrandKit>.Update;
                var update = updateBuilder.Set(x => x.Logo.Variations, variations);

                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion);
                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Logo variations derived successfully", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 5a. GENERATE LOGO CONCEPTS
        // =========================================================================
        [HttpPost("logo/generate-concepts")]
        public async Task<IActionResult> GenerateLogoConcepts(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null,
            CancellationToken cancellationToken = default)
        {
            string? creditOpId = null;
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("logo", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                if (_logoGenerationService == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Logo generation service is unavailable."));

                if (_aiCreditService != null)
                {
                    creditOpId = Guid.NewGuid().ToString("N");
                    await _aiCreditService.DebitForJobAsync(userId, AiJobType.LogoParameterSelection, creditOpId);
                }

                List<BrandLogoConcept>? concepts;
                try
                {
                    concepts = await _logoGenerationService.GenerateConceptsAsync(idea, kit, cancellationToken);
                }
                catch
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.LogoParameterSelection, creditOpId, "Logo concept generation failed before persistence");
                    }
                    throw;
                }

                if (concepts == null || concepts.Count == 0)
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.LogoParameterSelection, creditOpId, "Empty logo concepts generated");
                    }
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Failed to generate logo concepts."));
                }

                var updateBuilder = Builders<BrandKit>.Update;
                var update = updateBuilder
                    .Set(x => x.Logo.Concepts, concepts)
                    .Set(x => x.Logo.RegenerateCount, 0);

                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion);
                if (!updated)
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.LogoParameterSelection, creditOpId, "Optimistic concurrency conflict on logo generation save");
                    }
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Logo concepts generated successfully", reloaded));
            }
            catch (InsufficientCreditsException ex) { return StatusCode(StatusCodes.Status402PaymentRequired, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 5b. REGENERATE SINGLE LOGO CONCEPT
        // =========================================================================
        [HttpPost("logo/regenerate-concept/{conceptKey}")]
        public async Task<IActionResult> RegenerateSingleLogoConcept(
            [FromRoute] string conceptKey,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null,
            CancellationToken cancellationToken = default)
        {
            string? creditOpId = null;
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("logo", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                var existingConcept = kit.Logo?.Concepts?.FirstOrDefault(c => c.Key == conceptKey);
                if (existingConcept == null)
                    return NotFound(ApiResponse.Error($"Logo concept '{conceptKey}' not found."));

                if (existingConcept.RegenerateCount >= MaxRegenerations)
                {
                    return BadRequest(ApiResponse.Error($"Logo concept '{conceptKey}' has reached the maximum regeneration limit ({MaxRegenerations}/{MaxRegenerations})."));
                }

                if (_logoGenerationService == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Logo generation service is unavailable."));

                if (_aiCreditService != null)
                {
                    creditOpId = Guid.NewGuid().ToString("N");
                    await _aiCreditService.DebitForJobAsync(userId, AiJobType.LogoConceptRegenerate, creditOpId);
                }

                BrandLogoConcept? regeneratedConcept;
                try
                {
                    regeneratedConcept = await _logoGenerationService.RegenerateSingleConceptAsync(idea, kit, conceptKey, cancellationToken);
                }
                catch
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.LogoConceptRegenerate, creditOpId, "Single logo concept regeneration failed before persistence");
                    }
                    throw;
                }

                var updateBuilder = Builders<BrandKit>.Update;
                var arrayFilters = new List<ArrayFilterDefinition>
                {
                    new BsonDocumentArrayFilterDefinition<BsonDocument>(new BsonDocument("c.Key", conceptKey))
                };

                var update = updateBuilder
                    .Set("Logo.Concepts.$[c].DescriptorLine", regeneratedConcept.DescriptorLine)
                    .Set("Logo.Concepts.$[c].MarkAssetUri", regeneratedConcept.MarkAssetUri)
                    .Set("Logo.Concepts.$[c].LockupAssetUri", regeneratedConcept.LockupAssetUri)
                    .Set("Logo.Concepts.$[c].RegenerateCount", regeneratedConcept.RegenerateCount)
                    .Set("Logo.Concepts.$[c].Parameters", regeneratedConcept.Parameters)
                    .Inc(x => x.Logo.RegenerateCount, 1);

                var options = new UpdateOptions { ArrayFilters = arrayFilters };
                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion, session: null, options: options);
                if (!updated)
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.LogoConceptRegenerate, creditOpId, "Optimistic concurrency conflict on logo single concept regeneration");
                    }
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok($"Concept '{conceptKey}' regenerated successfully", reloaded));
            }
            catch (InsufficientCreditsException ex) { return StatusCode(StatusCodes.Status402PaymentRequired, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 6a. GENERATE INITIAL COLORS (DETERMINISTIC DERIVATION)
        // =========================================================================
        [HttpPost("colors/generate")]
        public async Task<IActionResult> GenerateColors(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("colors", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                if (_colorGenerationService == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Color generation service is unavailable."));

                var colors = _colorGenerationService.DeriveInitialColors(kit, idea);

                var updateBuilder = Builders<BrandKit>.Update;
                var update = updateBuilder.Set(x => x.Colors, colors);

                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion);
                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Colors generated successfully", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 6b. REGENERATE COLORS (MODEL CALL VIA COLORGENERATION)
        // =========================================================================
        [HttpPost("colors/regenerate")]
        public async Task<IActionResult> RegenerateColors(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null,
            CancellationToken cancellationToken = default)
        {
            string? creditOpId = null;
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("colors", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                if ((kit.Colors?.RegenerateCount ?? 0) >= MaxRegenerations)
                {
                    return BadRequest(ApiResponse.Error($"Colour palette has reached the maximum regeneration limit ({MaxRegenerations}/{MaxRegenerations})."));
                }

                if (_colorGenerationService == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Color generation service is unavailable."));

                if (_aiCreditService != null)
                {
                    creditOpId = Guid.NewGuid().ToString("N");
                    await _aiCreditService.DebitForJobAsync(userId, AiJobType.ColorGeneration, creditOpId);
                }

                BrandColors? colors;
                try
                {
                    colors = await _colorGenerationService.RegenerateColorsAsync(kit, idea, cancellationToken);
                }
                catch
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.ColorGeneration, creditOpId, "Color regeneration failed before persistence");
                    }
                    throw;
                }

                var updateBuilder = Builders<BrandKit>.Update;
                var update = updateBuilder.Set(x => x.Colors, colors);

                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion);
                if (!updated)
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.ColorGeneration, creditOpId, "Optimistic concurrency conflict on color regeneration save");
                    }
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Colors regenerated successfully", reloaded));
            }
            catch (InsufficientCreditsException ex) { return StatusCode(StatusCodes.Status402PaymentRequired, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 6c. PATCH COLORS (BY ROLENAME VIA ARRAY FILTERS)
        // =========================================================================
        [HttpPatch("colors")]
        public async Task<IActionResult> PatchColors(
            [FromBody] BrandColorsPatchDto dto,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("colors", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                if (dto.Roles == null || dto.Roles.Count == 0)
                    return BadRequest(ApiResponse.Error("At least one role update must be provided."));

                // Reject invalid role names immediately (no creation of nonexistent roles, no silent ignores)
                foreach (var role in dto.Roles)
                {
                    if (!BrandColorRoleNames.All.Contains(role.RoleName))
                    {
                        return BadRequest(ApiResponse.Error(
                            $"Invalid colour role name: '{role.RoleName}'. Must be one of: {string.Join(", ", BrandColorRoleNames.All)}"));
                    }
                }

                var updateBuilder = Builders<BrandKit>.Update;
                var updates = new List<UpdateDefinition<BrandKit>>();
                var arrayFilters = new List<ArrayFilterDefinition>();

                for (int i = 0; i < dto.Roles.Count; i++)
                {
                    var role = dto.Roles[i];
                    var identifier = $"r{i}";
                    arrayFilters.Add(new BsonDocumentArrayFilterDefinition<BsonDocument>(
                        new BsonDocument($"{identifier}.RoleName", role.RoleName)));

                    if (role.Hex != null)
                        updates.Add(updateBuilder.Set($"Colors.Roles.$[{identifier}].Hex", role.Hex));
                    if (role.Rgb != null)
                        updates.Add(updateBuilder.Set($"Colors.Roles.$[{identifier}].Rgb", role.Rgb));
                    if (role.ContrastRatio.HasValue)
                        updates.Add(updateBuilder.Set($"Colors.Roles.$[{identifier}].ContrastRatio", role.ContrastRatio.Value));
                    if (role.ContrastVerdict != null)
                        updates.Add(updateBuilder.Set($"Colors.Roles.$[{identifier}].ContrastVerdict", role.ContrastVerdict));
                    if (role.UsageNote != null)
                        updates.Add(updateBuilder.Set($"Colors.Roles.$[{identifier}].UsageNote", role.UsageNote));
                    if (role.IsLocked.HasValue)
                        updates.Add(updateBuilder.Set($"Colors.Roles.$[{identifier}].IsLocked", role.IsLocked.Value));
                    if (role.Provenance != null)
                        updates.Add(updateBuilder.Set($"Colors.Roles.$[{identifier}].Provenance", role.Provenance));
                }

                if (updates.Count == 0)
                    return BadRequest(ApiResponse.Error("No valid fields provided to update."));

                var combinedUpdate = updateBuilder.Combine(updates);
                var options = new UpdateOptions { ArrayFilters = arrayFilters };

                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion, session: null, options: options);
                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Colors updated", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 7a. GENERATE INITIAL TYPOGRAPHY (DETERMINISTIC DERIVATION & LOCKED LOGO TYPE)
        // =========================================================================
        [HttpPost("typography/generate")]
        public async Task<IActionResult> GenerateTypography(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("typography", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                if (kit.Colors?.Roles == null || kit.Colors.Roles.Count != 5)
                    return BadRequest(ApiResponse.Error("All 5 colour roles must be defined before generating typography."));

                if (_typographyGenerationService == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Typography generation service is unavailable."));

                var typography = _typographyGenerationService.DeriveInitialTypography(kit, idea);

                var updateBuilder = Builders<BrandKit>.Update;
                var update = updateBuilder.Set(x => x.Typography, typography);

                bool updated;
                bool isApproved = kit.Logo?.ApprovedAt != null || string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase);
                if (isApproved)
                {
                    var headingOverride = typography.Roles.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Heading)?.Family;
                    var bodyOverride = typography.Roles.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Body)?.Family;
                    var newTypographyPairing = ResolveTypographyPairing(kit, selectedCand: null, headingOverride, bodyOverride);

                    updated = await CommitBrandKitAndSyncAsync(
                        idea.Id, userId, update, expectedVersion, options: null,
                        idea, newBrandingMethod: null, newLogoAsset: null, newPaletteName: null, newTypographyPairing);
                }
                else
                {
                    updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion);
                }

                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Typography generated successfully", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 7b. REGENERATE TYPOGRAPHY (MODEL CALL VIA TYPOGRAPHYGENERATION)
        // =========================================================================
        [HttpPost("typography/regenerate")]
        public async Task<IActionResult> RegenerateTypography(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null,
            CancellationToken cancellationToken = default)
        {
            string? creditOpId = null;
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("typography", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                if (kit.Colors?.Roles == null || kit.Colors.Roles.Count != 5)
                    return BadRequest(ApiResponse.Error("All 5 colour roles must be defined before regenerating typography."));

                if ((kit.Typography?.RegenerateCount ?? 0) >= MaxRegenerations)
                {
                    return BadRequest(ApiResponse.Error($"Typography system has reached the maximum regeneration limit ({MaxRegenerations}/{MaxRegenerations})."));
                }

                if (_typographyGenerationService == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error("Typography generation service is unavailable."));

                if (_aiCreditService != null)
                {
                    creditOpId = Guid.NewGuid().ToString("N");
                    await _aiCreditService.DebitForJobAsync(userId, AiJobType.TypographyGeneration, creditOpId);
                }

                BrandTypography? typography;
                try
                {
                    typography = await _typographyGenerationService.RegenerateTypographyAsync(kit, idea, cancellationToken);
                }
                catch
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.TypographyGeneration, creditOpId, "Typography regeneration failed before persistence");
                    }
                    throw;
                }

                var updateBuilder = Builders<BrandKit>.Update;
                var update = updateBuilder.Set(x => x.Typography, typography);

                bool updated;
                bool isApproved = kit.Logo?.ApprovedAt != null || string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase);
                if (isApproved)
                {
                    var headingOverride = typography.Roles.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Heading)?.Family;
                    var bodyOverride = typography.Roles.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Body)?.Family;
                    var newTypographyPairing = ResolveTypographyPairing(kit, selectedCand: null, headingOverride, bodyOverride);

                    updated = await CommitBrandKitAndSyncAsync(
                        idea.Id, userId, update, expectedVersion, options: null,
                        idea, newBrandingMethod: null, newLogoAsset: null, newPaletteName: null, newTypographyPairing);
                }
                else
                {
                    updated = await _brandKitStore.UpdateAsync(idea.Id, userId, update, expectedVersion);
                }

                if (!updated)
                {
                    if (_aiCreditService != null && creditOpId != null)
                    {
                        await _aiCreditService.RefundForJobAsync(userId, AiJobType.TypographyGeneration, creditOpId, "Optimistic concurrency conflict on typography regeneration save");
                    }
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Typography regenerated successfully", reloaded));
            }
            catch (InsufficientCreditsException ex) { return StatusCode(StatusCodes.Status402PaymentRequired, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 7c. PATCH TYPOGRAPHY (BY ROLENAME VIA ARRAY FILTERS)
        // =========================================================================
        [HttpPatch("typography")]
        public async Task<IActionResult> PatchTypography(
            [FromBody] BrandTypographyPatchDto dto,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var (allowed, prerequisiteErr) = CheckPatchPrerequisite("typography", kit);
                if (!allowed)
                    return BadRequest(ApiResponse.Error(prerequisiteErr!));

                var updateBuilder = Builders<BrandKit>.Update;
                var updates = new List<UpdateDefinition<BrandKit>>();
                var arrayFilters = new List<ArrayFilterDefinition>();

                if (dto.Roles != null && dto.Roles.Count > 0)
                {
                    // Reject invalid role names immediately
                    foreach (var role in dto.Roles)
                    {
                        if (!BrandTypographyRoleNames.All.Contains(role.RoleName))
                        {
                            return BadRequest(ApiResponse.Error(
                                $"Invalid typography role name: '{role.RoleName}'. Must be one of: {string.Join(", ", BrandTypographyRoleNames.All)}"));
                        }
                    }

                    for (int i = 0; i < dto.Roles.Count; i++)
                    {
                        var role = dto.Roles[i];
                        var identifier = $"t{i}";
                        arrayFilters.Add(new BsonDocumentArrayFilterDefinition<BsonDocument>(
                            new BsonDocument($"{identifier}.RoleName", role.RoleName)));

                        if (role.Family != null)
                            updates.Add(updateBuilder.Set($"Typography.Roles.$[{identifier}].Family", role.Family));
                        if (role.Weight != null)
                            updates.Add(updateBuilder.Set($"Typography.Roles.$[{identifier}].Weight", role.Weight));
                        if (role.Size != null)
                            updates.Add(updateBuilder.Set($"Typography.Roles.$[{identifier}].Size", role.Size));
                        if (role.LineHeight != null)
                            updates.Add(updateBuilder.Set($"Typography.Roles.$[{identifier}].LineHeight", role.LineHeight));
                        if (role.SpecimenText != null)
                            updates.Add(updateBuilder.Set($"Typography.Roles.$[{identifier}].SpecimenText", role.SpecimenText));
                        if (role.IsLocked.HasValue)
                            updates.Add(updateBuilder.Set($"Typography.Roles.$[{identifier}].IsLocked", role.IsLocked.Value));
                        if (role.Provenance != null)
                            updates.Add(updateBuilder.Set($"Typography.Roles.$[{identifier}].Provenance", role.Provenance));
                    }
                }

                if (dto.Families != null)
                {
                    if (dto.Families.DisplayFamily != null)
                    {
                        var df = dto.Families.DisplayFamily;
                        updates.Add(updateBuilder.Set(x => x.Typography.Families.DisplayFamily, new BrandFontFamily
                        {
                            Name = df.Name,
                            License = df.License,
                            AvailableWeights = df.AvailableWeights,
                            WebWeightKb = df.WebWeightKb
                        }));
                    }
                    if (dto.Families.TextFamily != null)
                    {
                        var tf = dto.Families.TextFamily;
                        updates.Add(updateBuilder.Set(x => x.Typography.Families.TextFamily, new BrandFontFamily
                        {
                            Name = tf.Name,
                            License = tf.License,
                            AvailableWeights = tf.AvailableWeights,
                            WebWeightKb = tf.WebWeightKb
                        }));
                    }
                }

                if (updates.Count == 0)
                    return BadRequest(ApiResponse.Error("At least one field must be provided for update."));

                var combinedUpdate = updateBuilder.Combine(updates);
                var options = arrayFilters.Count > 0 ? new UpdateOptions { ArrayFilters = arrayFilters } : null;
                bool updated;

                bool hasFamilyChange =
                    (dto.Roles != null && dto.Roles.Any(r => !string.IsNullOrWhiteSpace(r.Family))) ||
                    !string.IsNullOrWhiteSpace(dto.Families?.DisplayFamily?.Name) ||
                    !string.IsNullOrWhiteSpace(dto.Families?.TextFamily?.Name);

                bool isApproved = kit.Logo?.ApprovedAt != null || string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase);
                if (isApproved && hasFamilyChange)
                {
                    var headingOverride = dto.Roles?.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Heading && !string.IsNullOrWhiteSpace(r.Family))?.Family
                        ?? dto.Families?.DisplayFamily?.Name;
                    var bodyOverride = dto.Roles?.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Body && !string.IsNullOrWhiteSpace(r.Family))?.Family
                        ?? dto.Families?.TextFamily?.Name;

                    var newTypographyPairing = ResolveTypographyPairing(kit, selectedCand: null, headingOverride, bodyOverride);

                    updated = await CommitBrandKitAndSyncAsync(
                        idea.Id, userId, combinedUpdate, expectedVersion, options,
                        idea, newBrandingMethod: null, newLogoAsset: null, newPaletteName: null, newTypographyPairing);
                }
                else
                {
                    updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion, session: null, options: options);
                }

                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Typography updated", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 8. STEP ADVANCE & COMPLETION
        // =========================================================================
        [HttpPost("advance")]
        public async Task<IActionResult> AdvanceStep(
            [FromBody] AdvanceStepRequestDto? dto,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var targetStep = dto?.TargetStep ?? (kit.CurrentStep + 1);

                // Cannot move backwards
                if (targetStep <= kit.CurrentStep)
                    return BadRequest(ApiResponse.Error("CurrentStep cannot move backwards."));

                // Cannot skip steps with unmet prerequisites
                for (int step = 2; step <= targetStep; step++)
                {
                    var (allowed, missingPrerequisite) = CheckStepPrerequisite(step, kit);
                    if (!allowed)
                        return BadRequest(ApiResponse.Error(missingPrerequisite!));
                }

                var updateBuilder = Builders<BrandKit>.Update;
                var updates = new List<UpdateDefinition<BrandKit>>();

                // Complete kit when advancing past step 6 (or target step is 6)
                if (targetStep >= 6)
                {
                    updates.Add(updateBuilder.Set(x => x.CurrentStep, 6));
                    updates.Add(updateBuilder.Set(x => x.Status, "complete"));
                }
                else
                {
                    updates.Add(updateBuilder.Set(x => x.CurrentStep, targetStep));
                    // Completion is a one-way door: if already complete, never demote to draft
                    if (string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase))
                    {
                        updates.Add(updateBuilder.Set(x => x.Status, "complete"));
                    }
                }

                var combinedUpdate = updateBuilder.Combine(updates);
                bool updated;

                bool isApproved = kit.Logo?.ApprovedAt != null || targetStep >= 5 || string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase);
                if (isApproved)
                {
                    var newBrandingMethod = "ai_studio";
                    string? newLogoAsset = null;
                    if (kit.Logo?.Variations != null && kit.Logo.Variations.TryGetValue(BrandLogoVariationKeys.Primary, out var existPrim))
                    {
                        newLogoAsset = existPrim.PngUri ?? existPrim.SvgUri;
                    }
                    else if (!string.IsNullOrEmpty(kit.Logo?.SelectedConceptKey))
                    {
                        newLogoAsset = kit.Logo.Concepts.FirstOrDefault(c => c.Key == kit.Logo.SelectedConceptKey)?.LockupAssetUri;
                    }

                    var selectedCand = kit.Direction?.Candidates?.FirstOrDefault(c => c.Key == kit.Direction.SelectedDirectionKey);
                    var newPaletteName = selectedCand?.Name ?? string.Empty;
                    var newTypographyPairing = ResolveTypographyPairing(kit, selectedCand);

                    updated = await CommitBrandKitAndSyncAsync(
                        idea.Id, userId, combinedUpdate, expectedVersion, options: null,
                        idea, newBrandingMethod, newLogoAsset, newPaletteName, newTypographyPairing);
                }
                else
                {
                    updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
                }

                if (!updated)
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Step advanced", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 9. SNAPSHOT CAPTURE (CONCURRENCY-GUARDED READ-THEN-PUSH)
        // =========================================================================
        [HttpPost("snapshot")]
        public async Task<IActionResult> CreateSnapshot(
            [FromBody] CreateSnapshotRequestDto dto,
            [FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                if (dto == null || string.IsNullOrWhiteSpace(dto.Description) || dto.ExpectedVersion <= 0)
                    return BadRequest(ApiResponse.Error("description and a positive expectedVersion are required."));

                // Read live kit to build frozen snapshot
                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                // Guard against interleaved writes
                if (kit.Version != dto.ExpectedVersion)
                {
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error(
                        "This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var snapshot = new BrandKitSnapshot
                {
                    Description = dto.Description.Trim(),
                    Timestamp = DateTime.UtcNow,
                    Strategy = kit.Strategy,
                    Direction = kit.Direction,
                    Logo = kit.Logo,
                    Colors = kit.Colors,
                    Typography = kit.Typography
                };

                var pushed = await _brandKitStore.PushSnapshotAsync(idea.Id, userId, snapshot, dto.ExpectedVersion);
                if (!pushed)
                {
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error(
                        "This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Snapshot created", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // 10. OPEN STUDIO / RESET REGENERATE CAPS (HUB RE-EDIT RESET)
        // =========================================================================
        [HttpPost("open-studio")]
        public async Task<IActionResult> OpenStudio(
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);

                var kit = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                if (kit == null)
                    return NotFound(ApiResponse.Error("Brand kit not found for this idea."));

                var updateBuilder = Builders<BrandKit>.Update;
                var updates = new List<UpdateDefinition<BrandKit>>
                {
                    updateBuilder.Set(x => x.Direction.RegenerateCount, 0),
                    updateBuilder.Set(x => x.Logo.RegenerateCount, 0),
                    updateBuilder.Set(x => x.Colors.RegenerateCount, 0),
                    updateBuilder.Set(x => x.Typography.RegenerateCount, 0)
                };

                if (kit.Logo?.Concepts != null && kit.Logo.Concepts.Count > 0)
                {
                    for (int i = 0; i < kit.Logo.Concepts.Count; i++)
                    {
                        updates.Add(updateBuilder.Set($"Logo.Concepts.{i}.RegenerateCount", 0));
                    }
                }

                var combinedUpdate = updateBuilder.Combine(updates);
                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
                if (!updated)
                {
                    return StatusCode(StatusCodes.Status409Conflict, ApiResponse.Error("This brand kit was updated in another tab. Refresh to load the latest version before continuing."));
                }

                var reloaded = await _brandKitStore.GetByIdeaIdAsync(idea.Id, userId);
                return Ok(ApiResponse.Ok("Studio opened and regenerate caps reset", reloaded));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // PRECONDITION EVALUATORS
        // =========================================================================
        private static (bool IsAllowed, string? MissingPrerequisite) CheckPatchPrerequisite(string section, BrandKit kit)
        {
            // Completed kits bypass sequencing rejections
            if (string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase))
                return (true, null);

            return section.ToLowerInvariant() switch
            {
                "strategy" => (true, null),
                "direction" => kit.Strategy.ConfirmedAt != null
                    ? (true, null)
                    : (false, "Strategy must be confirmed before visual direction can be edited."),
                "logo" => !string.IsNullOrEmpty(kit.Direction.SelectedDirectionKey) || kit.Direction.SelectedAt != null
                    ? (true, null)
                    : (false, "A visual direction must be selected before logo concepts can be edited."),
                "colors" => !string.IsNullOrEmpty(kit.Logo.SelectedConceptKey) || kit.Logo.ApprovedAt != null
                    ? (true, null)
                    : (false, "A logo concept must be approved before color palette can be edited."),
                "typography" => !string.IsNullOrEmpty(kit.Logo.SelectedConceptKey) || kit.Logo.ApprovedAt != null
                    ? (true, null)
                    : (false, "A logo concept must be approved before typography can be edited."),
                _ => (true, null)
            };
        }

        private static (bool IsAllowed, string? MissingPrerequisite) CheckStepPrerequisite(int step, BrandKit kit)
        {
            return step switch
            {
                2 => kit.Strategy.ConfirmedAt != null
                    ? (true, null)
                    : (false, "Strategy must be confirmed before advancing to direction."),
                3 => !string.IsNullOrEmpty(kit.Direction.SelectedDirectionKey) || kit.Direction.SelectedAt != null
                    ? (true, null)
                    : (false, "A visual direction must be selected before advancing to logo."),
                4 => !string.IsNullOrEmpty(kit.Logo.SelectedConceptKey)
                    ? (true, null)
                    : (false, "A logo concept must be selected before advancing to logo refinements and variations."),
                5 => kit.Logo.ApprovedAt != null
                    ? (true, null)
                    : (false, "Logo must be approved before advancing to colours."),
                6 => kit.Colors.Roles != null && kit.Colors.Roles.Count == 5
                    ? (true, null)
                    : (false, "All colour roles must be defined before advancing to typography."),
                _ => (true, null)
            };
        }
    }
}
