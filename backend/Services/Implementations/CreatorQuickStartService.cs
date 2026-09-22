using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;

namespace WebApp.Services.Implementations;

/// <summary>
/// Authoritative domain service managing the Creator HumainX Quick Start onboarding lifecycle.
/// Employs atomic nested MongoDB updates, idempotent confirmations, and role isolation.
/// </summary>
public class CreatorQuickStartService : ICreatorQuickStartService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IProfessionalProfileStore _professionalStore;
    private readonly IServiceProviderProfileSplitMigration _migration;
    private readonly MongoDbContext? _context;

    public CreatorQuickStartService(
        UserManager<ApplicationUser> userManager,
        IProfessionalProfileStore professionalStore,
        IServiceProviderProfileSplitMigration migration,
        MongoDbContext? context = null)
    {
        _userManager = userManager;
        _professionalStore = professionalStore;
        _migration = migration;
        _context = context;
    }

    public HumainXQuickStartStatusDto ResolveStatus(HumainXQuickStartState? state)
    {
        var version = state?.Version ?? 1;
        var step1 = state?.Step1ConfirmedAt;
        var step2 = state?.Step2ConfirmedAt;
        var step3 = state?.Step3ConfirmedAt;
        var completedAt = state?.CompletedAt;
        var completed = completedAt.HasValue;

        int? nextRequiredStep = null;
        if (!completed)
        {
            if (!step1.HasValue) nextRequiredStep = 1;
            else if (!step2.HasValue) nextRequiredStep = 2;
            else nextRequiredStep = 3;
        }

        return new HumainXQuickStartStatusDto
        {
            Version = version,
            Step1ConfirmedAt = step1,
            Step2ConfirmedAt = step2,
            Step3ConfirmedAt = step3,
            CompletedAt = completedAt,
            Completed = completed,
            NextRequiredStep = nextRequiredStep
        };
    }

    private async Task<(ApplicationUser User, ProfessionalProfileRecord Profile)> EnsureCreatorAndProfileAsync(
        string userId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("User is not authenticated.");

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains("Creator", StringComparer.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Forbidden: Only Creators can access HumainX Quick Start.");
        }

        var profile = await _migration.EnsureProfessionalProfileAsync(user, ct);
        return (user, profile);
    }

    public async Task<HumainXQuickStartStatusDto> GetStatusAsync(string userId, CancellationToken ct = default)
    {
        var (_, profile) = await EnsureCreatorAndProfileAsync(userId, ct);
        return ResolveStatus(profile.QuickStart);
    }

    public async Task<HumainXQuickStartStatusDto> ConfirmStep1Async(
        string userId, QuickStartStep1RequestDto dto, CancellationToken ct = default)
    {
        var (_, record) = await EnsureCreatorAndProfileAsync(userId, ct);

        var reg = !string.IsNullOrWhiteSpace(dto?.Region)
            ? dto.Region.Trim()
            : (record.VentureContext?.Region ?? string.Empty).Trim();

        var sit = !string.IsNullOrWhiteSpace(dto?.CurrentSituation)
            ? dto.CurrentSituation.Trim()
            : (record.VentureContext?.CurrentSituation ?? string.Empty).Trim();

        var avail = !string.IsNullOrWhiteSpace(dto?.WeeklyAvailability)
            ? dto.WeeklyAvailability.Trim()
            : (record.VentureContext?.WeeklyAvailability ?? string.Empty).Trim();

        if (string.IsNullOrEmpty(reg) || string.IsNullOrEmpty(sit) || string.IsNullOrEmpty(avail))
        {
            throw new ArgumentException("Region, current situation, and weekly availability are required to complete Step 1.");
        }

        var now = DateTime.UtcNow;
        var step1ConfirmedAt = record.QuickStart?.Step1ConfirmedAt ?? now;

        if (_context is not null)
        {
            var filter = Builders<ProfessionalProfileRecord>.Filter.Eq(x => x.UserId, userId);
            var updateBuilder = Builders<ProfessionalProfileRecord>.Update;
            var updates = new List<UpdateDefinition<ProfessionalProfileRecord>>();

            if (record.VentureContext == null)
            {
                updates.Add(updateBuilder.Set(x => x.VentureContext, new ProfileVentureContext
                {
                    Region = reg,
                    CurrentSituation = sit,
                    WeeklyAvailability = avail
                }));
            }
            else
            {
                updates.Add(updateBuilder.Set(x => x.VentureContext.Region, reg));
                updates.Add(updateBuilder.Set(x => x.VentureContext.CurrentSituation, sit));
                updates.Add(updateBuilder.Set(x => x.VentureContext.WeeklyAvailability, avail));
            }

            if (record.QuickStart == null)
            {
                updates.Add(updateBuilder.Set(x => x.QuickStart, new HumainXQuickStartState
                {
                    Version = 1,
                    Step1ConfirmedAt = step1ConfirmedAt
                }));
            }
            else
            {
                updates.Add(updateBuilder.Set(x => x.QuickStart.Step1ConfirmedAt, step1ConfirmedAt));
            }
            updates.Add(updateBuilder.Set(x => x.UpdatedAt, now));

            await _context.ProfessionalProfiles.UpdateOneAsync(filter, updateBuilder.Combine(updates), cancellationToken: ct);
        }

        record.VentureContext ??= new ProfileVentureContext();
        record.VentureContext.Region = reg;
        record.VentureContext.CurrentSituation = sit;
        record.VentureContext.WeeklyAvailability = avail;
        record.QuickStart ??= new HumainXQuickStartState();
        record.QuickStart.Step1ConfirmedAt = step1ConfirmedAt;
        record.UpdatedAt = now;

        if (_context is null)
        {
            await _professionalStore.UpsertAsync(record, cancellationToken: ct);
        }

        return ResolveStatus(record.QuickStart);
    }

    public async Task<HumainXQuickStartStatusDto> ConfirmStep2Async(
        string userId, QuickStartStep2RequestDto dto, CancellationToken ct = default)
    {
        var (_, record) = await EnsureCreatorAndProfileAsync(userId, ct);

        if (record.QuickStart?.Step1ConfirmedAt == null)
        {
            throw new InvalidOperationException("Step 1 must be confirmed before proceeding to Step 2.");
        }

        var candidateSkills = dto?.Skills != null
            ? dto.Skills
            : (record.Skills ?? new()).Select(s => new ProfileSkillDto
            {
                Name = s.Name,
                Level = s.Level,
                Source = s.Source,
                Verification = s.Verification
            }).ToList();

        var validSkills = candidateSkills.Where(s => !string.IsNullOrWhiteSpace(s.Name)).ToList();
        if (validSkills.Count == 0)
        {
            throw new ArgumentException("At least one skill is required to complete Step 2.");
        }

        if (!validSkills.All(s => IsValidSkillLevel(s.Level)))
        {
            throw new ArgumentException("All skills must have a valid proficiency level (Beginner, Comfortable, or Advanced).");
        }

        var now = DateTime.UtcNow;
        var step2ConfirmedAt = record.QuickStart?.Step2ConfirmedAt ?? now;

        var mappedSkills = validSkills.Select(s => new ProfileSkill
        {
            Name = s.Name.Trim(),
            Level = NormalizeSkillLevel(s.Level),
            Source = !string.IsNullOrWhiteSpace(s.Source) ? s.Source : "self_declared",
            Verification = s.Verification
        }).ToList();

        if (_context is not null)
        {
            var filter = Builders<ProfessionalProfileRecord>.Filter.And(
                Builders<ProfessionalProfileRecord>.Filter.Eq(x => x.UserId, userId),
                Builders<ProfessionalProfileRecord>.Filter.Ne(x => x.QuickStart.Step1ConfirmedAt, null)
            );

            var update = Builders<ProfessionalProfileRecord>.Update
                .Set(x => x.Skills, mappedSkills)
                .Set(x => x.QuickStart.Step2ConfirmedAt, step2ConfirmedAt)
                .Set(x => x.UpdatedAt, now);

            var res = await _context.ProfessionalProfiles.UpdateOneAsync(filter, update, cancellationToken: ct);
            if (res.MatchedCount == 0)
            {
                throw new InvalidOperationException("Step 1 must be confirmed before proceeding to Step 2.");
            }
        }

        record.Skills = mappedSkills;
        record.QuickStart.Step2ConfirmedAt = step2ConfirmedAt;
        record.UpdatedAt = now;

        if (_context is null)
        {
            await _professionalStore.UpsertAsync(record, cancellationToken: ct);
        }

        return ResolveStatus(record.QuickStart);
    }

    public async Task<HumainXQuickStartStatusDto> CompleteAsync(
        string userId, QuickStartStep3RequestDto dto, CancellationToken ct = default)
    {
        var (_, record) = await EnsureCreatorAndProfileAsync(userId, ct);

        // Idempotent shortcut: once completed, preserve original CompletedAt and return immediately
        if (record.QuickStart?.CompletedAt != null)
        {
            return ResolveStatus(record.QuickStart);
        }

        if (record.QuickStart?.Step1ConfirmedAt == null)
        {
            throw new InvalidOperationException("Step 1 must be confirmed before completing Quick Start.");
        }

        if (record.QuickStart?.Step2ConfirmedAt == null)
        {
            throw new InvalidOperationException("Step 2 must be confirmed before completing Quick Start.");
        }

        var exp = !string.IsNullOrWhiteSpace(dto?.PreviousEntrepreneurialExperience)
            ? dto.PreviousEntrepreneurialExperience.Trim()
            : (record.VentureContext?.PreviousEntrepreneurialExperience ?? string.Empty).Trim();

        string learning = string.Empty;
        string delegation = string.Empty;

        if (!string.IsNullOrWhiteSpace(dto?.ProgressPreference))
        {
            var canonical = MapProgressPreferenceToCanonical(dto.ProgressPreference);
            learning = canonical.Learning;
            delegation = canonical.Delegation;
        }
        else
        {
            learning = !string.IsNullOrWhiteSpace(dto?.LearningPreference)
                ? dto.LearningPreference.Trim()
                : (record.VentureContext?.LearningPreference ?? string.Empty).Trim();

            delegation = !string.IsNullOrWhiteSpace(dto?.DelegationPreference)
                ? dto.DelegationPreference.Trim()
                : (record.VentureContext?.DelegationPreference ?? string.Empty).Trim();
        }

        if (string.IsNullOrEmpty(exp))
        {
            throw new ArgumentException("Previous entrepreneurial experience is required.");
        }

        var derivedPref = DeriveProgressPreference(learning, delegation);
        if (string.IsNullOrEmpty(derivedPref))
        {
            throw new ArgumentException("Progress preference is required.");
        }

        var now = DateTime.UtcNow;
        var step3ConfirmedAt = record.QuickStart?.Step3ConfirmedAt ?? now;
        var completedAt = now;

        if (_context is not null)
        {
            var filter = Builders<ProfessionalProfileRecord>.Filter.And(
                Builders<ProfessionalProfileRecord>.Filter.Eq(x => x.UserId, userId),
                Builders<ProfessionalProfileRecord>.Filter.Ne(x => x.QuickStart.Step1ConfirmedAt, null),
                Builders<ProfessionalProfileRecord>.Filter.Ne(x => x.QuickStart.Step2ConfirmedAt, null)
            );

            var updateBuilder = Builders<ProfessionalProfileRecord>.Update;
            var updates = new List<UpdateDefinition<ProfessionalProfileRecord>>();

            if (record.VentureContext == null)
            {
                updates.Add(updateBuilder.Set(x => x.VentureContext, new ProfileVentureContext
                {
                    PreviousEntrepreneurialExperience = exp,
                    LearningPreference = learning,
                    DelegationPreference = delegation
                }));
            }
            else
            {
                updates.Add(updateBuilder.Set(x => x.VentureContext.PreviousEntrepreneurialExperience, exp));
                updates.Add(updateBuilder.Set(x => x.VentureContext.LearningPreference, learning));
                updates.Add(updateBuilder.Set(x => x.VentureContext.DelegationPreference, delegation));
            }

            updates.Add(updateBuilder.Set(x => x.QuickStart.Step3ConfirmedAt, step3ConfirmedAt));
            updates.Add(updateBuilder.Set(x => x.QuickStart.CompletedAt, completedAt));
            updates.Add(updateBuilder.Set(x => x.UpdatedAt, now));

            var res = await _context.ProfessionalProfiles.UpdateOneAsync(filter, updateBuilder.Combine(updates), cancellationToken: ct);
            if (res.MatchedCount == 0)
            {
                throw new InvalidOperationException("Previous steps must be confirmed before completing Quick Start.");
            }
        }

        record.VentureContext ??= new ProfileVentureContext();
        record.VentureContext.PreviousEntrepreneurialExperience = exp;
        record.VentureContext.LearningPreference = learning;
        record.VentureContext.DelegationPreference = delegation;
        record.QuickStart.Step3ConfirmedAt = step3ConfirmedAt;
        record.QuickStart.CompletedAt = completedAt;
        record.UpdatedAt = now;

        if (_context is null)
        {
            await _professionalStore.UpsertAsync(record, cancellationToken: ct);
        }

        return ResolveStatus(record.QuickStart);
    }

    public static bool IsValidSkillLevel(string? level)
    {
        if (string.IsNullOrWhiteSpace(level)) return false;
        var clean = level.Trim().ToLowerInvariant();
        return clean is "beginner" or "comfortable" or "advanced";
    }

    public static string NormalizeSkillLevel(string? level)
    {
        if (string.IsNullOrWhiteSpace(level)) return "Comfortable";
        var clean = level.Trim().ToLowerInvariant();
        return clean switch
        {
            "beginner" => "Beginner",
            "advanced" => "Advanced",
            _ => "Comfortable"
        };
    }

    public static (string Learning, string Delegation) MapProgressPreferenceToCanonical(string? choice)
    {
        var clean = (choice ?? string.Empty).Trim().ToLowerInvariant();
        if (clean.Contains("learn it") || clean.Contains("myself") || clean == "learn")
        {
            return ("I want to learn them myself", "Minimal delegation — self-reliant learning");
        }
        if (clean.Contains("hand it off") || clean.Contains("delegate") || clean.Contains("strengths"))
        {
            return ("Focus on core strengths only", "I prefer to delegate when possible");
        }
        if (clean.Contains("both") || clean.Contains("mixed") || clean.Contains("mix"))
        {
            return ("A mix of learning and delegation", "A mix of learning and delegation");
        }
        if (clean.Contains("help me decide") || clean.Contains("not sure") || clean.Contains("recommend"))
        {
            return ("I'm not sure — recommend the best option", "I'm not sure — recommend the best option");
        }
        return ("I'm not sure — recommend the best option", "I'm not sure — recommend the best option");
    }

    public static string DeriveProgressPreference(string? learning, string? delegation)
    {
        var lp = (learning ?? string.Empty).ToLowerInvariant();
        var dp = (delegation ?? string.Empty).ToLowerInvariant();

        if (lp.Contains("myself") || dp.Contains("minimal delegation") || lp.Contains("learn it"))
            return "I'd rather learn it";
        if (lp.Contains("strengths") || dp.Contains("prefer to delegate") || lp.Contains("hand it off"))
            return "I'd rather hand it off";
        if (lp.Contains("mix") || dp.Contains("mix") || lp.Contains("bit of both"))
            return "A bit of both";
        if (lp.Contains("not sure") || dp.Contains("not sure") || lp.Contains("recommend") || lp.Contains("help me decide"))
            return "Help me decide";

        if (!string.IsNullOrWhiteSpace(learning)) return learning.Trim();
        if (!string.IsNullOrWhiteSpace(delegation)) return delegation.Trim();
        return string.Empty;
    }
}
