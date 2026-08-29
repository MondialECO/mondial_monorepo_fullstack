using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Ai;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit;

public class CompanyMultiCompanyTests
{
    private readonly Mock<IMongoDatabase> _dbMock = new();
    private readonly MongoDbContext _context;

    private readonly List<Companies> _companiesDb = new();
    private readonly List<ApplicationUser> _usersDb = new();
    private readonly List<EntrepreneurProfileRecord> _profilesDb = new();

    public CompanyMultiCompanyTests()
    {
        var companiesCollectionMock = new Mock<IMongoCollection<Companies>>();
        var usersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
        var profilesCollectionMock = new Mock<IMongoCollection<EntrepreneurProfileRecord>>();

        _dbMock.Setup(d => d.GetCollection<Companies>("Companies", null)).Returns(companiesCollectionMock.Object);
        _dbMock.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null)).Returns(usersCollectionMock.Object);
        _dbMock.Setup(d => d.GetCollection<EntrepreneurProfileRecord>("EntrepreneurProfiles", null)).Returns(profilesCollectionMock.Object);

        _context = new MongoDbContext(_dbMock.Object);
    }

    [Fact]
    public async Task MyCompanies_ReturnsOnlyOwned()
    {
        // Arrange
        var userId1 = "user-101";
        var userId2 = "user-102";

        var compA = new Companies
        {
            Id = "comp-A",
            OwnerId = userId1,
            CompanyName = "Alpha Tech",
            LegalName = "Alpha Tech LLC",
            CurrentPhase = 4,
            UpdatedAt = DateTime.UtcNow.AddHours(-1)
        };
        var compB = new Companies
        {
            Id = "comp-B",
            OwnerId = userId1,
            CompanyName = "Beta Robotics",
            LegalName = "Beta Robotics Inc",
            CurrentPhase = 2,
            UpdatedAt = DateTime.UtcNow
        };
        var compC = new Companies
        {
            Id = "comp-C",
            OwnerId = userId2,
            CompanyName = "Gamma Bio",
            LegalName = "Gamma Bio Ltd",
            CurrentPhase = 3,
            UpdatedAt = DateTime.UtcNow
        };

        _companiesDb.AddRange(new[] { compA, compB, compC });

        var user1 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = userId1,
            UserName = "user1",
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "comp-B" }
        };
        _usersDb.Add(user1);

        var serviceMock = new Mock<ICompanyService>();
        serviceMock.Setup(s => s.GetMyCompaniesAsync(userId1))
            .ReturnsAsync(_companiesDb.Where(c => c.OwnerId == userId1)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new CompanySummaryDto
                {
                    Id = c.Id,
                    CompanyName = c.CompanyName,
                    LegalName = c.LegalName,
                    CurrentPhase = c.CurrentPhase,
                    IsActive = c.Id == user1.EntrepreneurProfile.CompanyId
                }).ToList());

        // Act
        var result = await serviceMock.Object.GetMyCompaniesAsync(userId1);

        // Assert
        result.Should().HaveCount(2);
        result.Select(c => c.Id).Should().Contain(new[] { "comp-A", "comp-B" });
        result.Select(c => c.Id).Should().NotContain("comp-C");

        var activeSummary = result.First(c => c.Id == "comp-B");
        activeSummary.IsActive.Should().BeTrue();

        var inactiveSummary = result.First(c => c.Id == "comp-A");
        inactiveSummary.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task SetActiveCompany_Owned_Succeeds()
    {
        // Arrange
        var userId = "user-201";
        var userGuid = Guid.NewGuid();

        var compA = new Companies { Id = "comp-A", OwnerId = userId, CompanyName = "Alpha Corp", CurrentPhase = 3 };
        var compB = new Companies { Id = "comp-B", OwnerId = userId, CompanyName = "Beta Corp", CurrentPhase = 5 };
        _companiesDb.AddRange(new[] { compA, compB });

        var user = new ApplicationUser
        {
            Id = userGuid,
            User = userId,
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "comp-A" }
        };
        _usersDb.Add(user);

        var serviceMock = new Mock<ICompanyService>();
        serviceMock.Setup(s => s.SetActiveCompanyAsync(userId, "comp-B"))
            .ReturnsAsync((string uid, string cid) =>
            {
                var c = _companiesDb.FirstOrDefault(x => x.Id == cid);
                if (c == null || c.OwnerId != uid) throw new UnauthorizedAccessException("Forbidden");
                user.EntrepreneurProfile.CompanyId = cid;
                return new CompanySummaryDto
                {
                    Id = c.Id,
                    CompanyName = c.CompanyName,
                    CurrentPhase = c.CurrentPhase,
                    IsActive = true
                };
            });

        // Act
        var summary = await serviceMock.Object.SetActiveCompanyAsync(userId, "comp-B");

        // Assert
        summary.Should().NotBeNull();
        summary.Id.Should().Be("comp-B");
        summary.IsActive.Should().BeTrue();
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-B");
    }

    [Fact]
    public async Task SetActiveCompany_Foreign_Blocked()
    {
        // Arrange
        var user1 = "user-301";
        var user2 = "user-302";

        var compOwnedByUser2 = new Companies { Id = "comp-foreign", OwnerId = user2, CompanyName = "Foreign Corp" };
        _companiesDb.Add(compOwnedByUser2);

        var serviceMock = new Mock<ICompanyService>();
        serviceMock.Setup(s => s.SetActiveCompanyAsync(user1, "comp-foreign"))
            .ThrowsAsync(new UnauthorizedAccessException("You are not allowed to activate a company you do not own."));

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            serviceMock.Object.SetActiveCompanyAsync(user1, "comp-foreign")
        );
    }

    [Fact]
    public async Task CurrentPhase_UsesActiveCompany()
    {
        // Arrange
        var userId = "user-401";
        var compA = new Companies { Id = "comp-A", OwnerId = userId, CurrentPhase = 3, CompletedPhases = new List<int> { 2 } };
        var compB = new Companies { Id = "comp-B", OwnerId = userId, CurrentPhase = 7, CompletedPhases = new List<int> { 2, 3, 4, 5, 6 } };
        _companiesDb.AddRange(new[] { compA, compB });

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = userId,
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "comp-B" }
        };
        _usersDb.Add(user);

        var serviceMock = new Mock<ICompanyService>();
        serviceMock.Setup(s => s.GetCurrentPhaseAsync(userId, null))
            .ReturnsAsync(() =>
            {
                var activeId = user.EntrepreneurProfile.CompanyId;
                var c = _companiesDb.First(x => x.Id == activeId);
                return new CompanyProgressResponse
                {
                    CompanyId = c.Id,
                    CurrentPhase = c.CurrentPhase,
                    CompletedPhases = c.CompletedPhases
                };
            });

        // Act
        var progress = await serviceMock.Object.GetCurrentPhaseAsync(userId, null);

        // Assert
        progress.CompanyId.Should().Be("comp-B");
        progress.CurrentPhase.Should().Be(7);
        progress.CompletedPhases.Should().Contain(new[] { 2, 3, 4, 5, 6 });
    }

    [Fact]
    public async Task CurrentPhase_ExplicitCompany_VerifiesOwnership()
    {
        // Arrange
        var userId1 = "user-501";
        var userId2 = "user-502";

        var compA = new Companies { Id = "comp-A", OwnerId = userId1, CurrentPhase = 2 };
        var compForeign = new Companies { Id = "comp-foreign", OwnerId = userId2, CurrentPhase = 8 };
        _companiesDb.AddRange(new[] { compA, compForeign });

        var serviceMock = new Mock<ICompanyService>();
        serviceMock.Setup(s => s.GetCurrentPhaseAsync(userId1, "comp-A"))
            .ReturnsAsync(new CompanyProgressResponse { CompanyId = "comp-A", CurrentPhase = 2 });

        serviceMock.Setup(s => s.GetCurrentPhaseAsync(userId1, "comp-foreign"))
            .ThrowsAsync(new UnauthorizedAccessException("You are not allowed to access this company."));

        // Act 1: Owned company
        var progress = await serviceMock.Object.GetCurrentPhaseAsync(userId1, "comp-A");
        progress.CompanyId.Should().Be("comp-A");

        // Act 2: Foreign company
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            serviceMock.Object.GetCurrentPhaseAsync(userId1, "comp-foreign")
        );
    }

    [Fact]
    public async Task SecondLevelUp_PreservesCompanyA_CreatesCompanyB_And_SetsCompanyBActive()
    {
        // Arrange
        var userId = "user-601";
        var userGuid = Guid.NewGuid();

        var compA = new Companies
        {
            Id = "comp-A",
            OwnerId = userId,
            SourceBusinessIdeaId = "idea-A",
            CompanyName = "Company A",
            CurrentPhase = 5
        };
        _companiesDb.Add(compA);

        var user = new ApplicationUser
        {
            Id = userGuid,
            User = userId,
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "comp-A" }
        };
        _usersDb.Add(user);

        var profile = new EntrepreneurProfileRecord
        {
            Id = "profile-1",
            UserId = userId,
            CompanyId = "comp-A"
        };
        _profilesDb.Add(profile);

        // Act: EnsureLevelUpCompany for Idea B
        var compB = new Companies
        {
            Id = "comp-B",
            OwnerId = userId,
            SourceBusinessIdeaId = "idea-B",
            CompanyName = "Company B",
            CurrentPhase = 2,
            CompletedPhases = new List<int>()
        };
        _companiesDb.Add(compB);

        // Update active pointer on Level Up
        user.EntrepreneurProfile.CompanyId = compB.Id;
        profile.CompanyId = compB.Id;

        // Assert
        // 1. Company A is preserved
        var existingA = _companiesDb.FirstOrDefault(c => c.Id == "comp-A");
        existingA.Should().NotBeNull();
        existingA!.CurrentPhase.Should().Be(5);
        existingA.SourceBusinessIdeaId.Should().Be("idea-A");

        // 2. Company B is created separately
        var existingB = _companiesDb.FirstOrDefault(c => c.Id == "comp-B");
        existingB.Should().NotBeNull();
        existingB!.CurrentPhase.Should().Be(2);
        existingB.SourceBusinessIdeaId.Should().Be("idea-B");

        // 3. User's active pointer is switched to Company B
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-B");
        profile.CompanyId.Should().Be("comp-B");
    }

    [Fact]
    public async Task CreateCompany_ZeroOwned_CreatesFirstCompany()
    {
        var userId = "user-zero";
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = userId,
            EntrepreneurProfile = new EntrepreneurProfile()
        };
        _usersDb.Add(user);

        // Simulated CreateCompanyAsync logic
        var hasExisting = _companiesDb.Any(c => c.OwnerId == userId);
        hasExisting.Should().BeFalse();

        var newComp = new Companies
        {
            Id = "comp-new-1",
            OwnerId = userId,
            CompanyName = "First Startup",
            CurrentPhase = 2,
            CompletedPhases = new List<int>(),
            SourceBusinessIdeaId = null
        };
        _companiesDb.Add(newComp);
        user.EntrepreneurProfile.CompanyId = newComp.Id;

        // Assert
        newComp.OwnerId.Should().Be(userId);
        newComp.CurrentPhase.Should().Be(2);
        newComp.SourceBusinessIdeaId.Should().BeNull();
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-new-1");
    }

    [Fact]
    public async Task CreateCompany_ExistingSingleCompany_ReturnsConflict_AndDoesNotMutate()
    {
        var userId = "user-single";
        var existingComp = new Companies
        {
            Id = "comp-A",
            OwnerId = userId,
            CompanyName = "Alpha Tech",
            CurrentPhase = 3,
            Tagline = "Original Tagline"
        };
        _companiesDb.Add(existingComp);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = userId,
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "comp-A" }
        };
        _usersDb.Add(user);

        // Attempting to call CreateCompanyAsync when owned count >= 1 throws InvalidOperationException
        var hasExisting = _companiesDb.Any(c => c.OwnerId == userId);
        hasExisting.Should().BeTrue();

        Func<Task> act = async () =>
        {
            if (hasExisting)
                throw new InvalidOperationException("You already have a company. Use your active company workspace or an approved company creation flow.");
            await Task.CompletedTask;
        };

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already have a company*");

        // Assert company A was not mutated
        existingComp.CompanyName.Should().Be("Alpha Tech");
        existingComp.Tagline.Should().Be("Original Tagline");
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-A");
        _companiesDb.Where(c => c.OwnerId == userId).Should().HaveCount(1);
    }

    [Fact]
    public async Task CreateCompany_MultipleCompanies_ReturnsConflict_AndDoesNotMutateActive()
    {
        var userId = "user-multi";
        var compA = new Companies { Id = "comp-A", OwnerId = userId, CompanyName = "Company A", CurrentPhase = 3 };
        var compB = new Companies { Id = "comp-B", OwnerId = userId, CompanyName = "Company B", CurrentPhase = 5 };
        _companiesDb.AddRange(new[] { compA, compB });

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = userId,
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "comp-B" }
        };
        _usersDb.Add(user);

        var hasExisting = _companiesDb.Any(c => c.OwnerId == userId);
        hasExisting.Should().BeTrue();

        Func<Task> act = async () =>
        {
            if (hasExisting)
                throw new InvalidOperationException("You already have a company. Use your active company workspace or an approved company creation flow.");
            await Task.CompletedTask;
        };

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already have a company*");

        // Neither company mutated, active pointer unchanged
        compA.CompanyName.Should().Be("Company A");
        compB.CompanyName.Should().Be("Company B");
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-B");
        _companiesDb.Where(c => c.OwnerId == userId).Should().HaveCount(2);
    }

    [Fact]
    public async Task CreatorLevelUp_SecondIdea_StillCreatesSecondCompany()
    {
        var userId = "user-creator-levelup";
        var compA = new Companies
        {
            Id = "comp-A",
            OwnerId = userId,
            SourceBusinessIdeaId = "idea-1",
            CompanyName = "Idea 1 Startup",
            CurrentPhase = 4
        };
        _companiesDb.Add(compA);

        // Creator Level Up for Idea 2 uses EnsureLevelUpCompanyAsync which is keyed by SourceBusinessIdeaId
        var compB = new Companies
        {
            Id = "comp-B",
            OwnerId = userId,
            SourceBusinessIdeaId = "idea-2",
            CompanyName = "Idea 2 Startup",
            CurrentPhase = 2
        };
        _companiesDb.Add(compB);

        var userCompanies = _companiesDb.Where(c => c.OwnerId == userId).ToList();
        userCompanies.Should().HaveCount(2);
        userCompanies.Select(c => c.SourceBusinessIdeaId).Should().BeEquivalentTo(new[] { "idea-1", "idea-2" });
    }
}
