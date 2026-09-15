using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 2 Brand Visual Identity Studio HTTP surface.
    /// Manages BrandKit retrieval, idempotent creation, targeted partial updates
    /// per section, server-side sequencing enforcement, step advancement, and concurrency-guarded snapshots.
    /// </summary>
    [Route("api/creator/journey/phase2/brand-kit")]
    [ApiController]
    [Authorize]
    public class CreatorBrandKitController : ControllerBase
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IBrandKitStore _brandKitStore;

        public CreatorBrandKitController(
            ICreatorJourneyService journeys,
            IBrandKitStore brandKitStore)
        {
            _journeys = journeys;
            _brandKitStore = brandKitStore;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");

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
                    return Ok(ApiResponse.Ok("Brand kit retrieved", existing));

                var now = DateTime.UtcNow;
                var kit = new BrandKit
                {
                    IdeaId = idea.Id,
                    UserId = userId,
                    Status = "draft",
                    CurrentStep = 1,
                    Version = 1,
                    CreatedAt = now,
                    UpdatedAt = now,
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
                        MotifKey = c.MotifKey
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
                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
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
                        AssetUri = c.AssetUri
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

                if (updates.Count == 0)
                    return BadRequest(ApiResponse.Error("At least one field must be provided for update."));

                var combinedUpdate = updateBuilder.Combine(updates);
                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
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
        // 6. PATCH COLORS (BY ROLENAME VIA ARRAY FILTERS)
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
        // 7. PATCH TYPOGRAPHY (BY ROLENAME VIA ARRAY FILTERS)
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

                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion, session: null, options: options);
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
                var updated = await _brandKitStore.UpdateAsync(idea.Id, userId, combinedUpdate, expectedVersion);
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
