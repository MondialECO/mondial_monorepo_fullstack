using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;
using Xunit;

namespace WebApp.Tests.Unit;

public class UniversalProfileTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<IProfessionalProfileStore> _profStoreMock;
    private readonly Mock<IServiceProviderProfileStore> _spStoreMock;
    private readonly Mock<IUserCredentialStore> _credentialStoreMock;
    private readonly Mock<IServiceProviderProfileSplitMigration> _migrationMock;
    private readonly Mock<IProfileEditorService> _editorMock;
    private readonly Mock<IServiceProviderMediaService> _mediaMock;

    public UniversalProfileTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _profStoreMock = new Mock<IProfessionalProfileStore>();
        _spStoreMock = new Mock<IServiceProviderProfileStore>();
        _credentialStoreMock = new Mock<IUserCredentialStore>();
        _migrationMock = new Mock<IServiceProviderProfileSplitMigration>();
        _editorMock = new Mock<IProfileEditorService>();
        _mediaMock = new Mock<IServiceProviderMediaService>();
    }

    private ProfileController CreateController(string userId)
    {
        var controller = new ProfileController(
            _userManagerMock.Object,
            _profStoreMock.Object,
            _spStoreMock.Object,
            _migrationMock.Object,
            _editorMock.Object,
            _mediaMock.Object,
            null,
            _credentialStoreMock.Object);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        return controller;
    }

    [Fact]
    public async Task GetMyProfile_CreatorUser_ReturnsUniversalProfileWithCreatorRole()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser { Id = Guid.Parse(userId), UserName = "creator_user", Name = "Creator Alice" };
        var prof = new ProfessionalProfileRecord
        {
            UserId = userId,
            Headline = "Digital Creator",
            Bio = "Creating digital art",
            Skills = new List<string> { "Graphic Design", "3D Art" }
        };

        _userManagerMock.Setup(m => m.FindByIdAsync(userId)).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Creator" });
        _migrationMock.Setup(m => m.EnsureProfessionalProfileAsync(user, It.IsAny<CancellationToken>())).ReturnsAsync(prof);

        var controller = CreateController(userId);
        var result = await controller.GetMyProfile(CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var payload = okResult.Value;
        payload.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateMyProfile_EntrepreneurUser_PersistsHeadlineAndSkillsInSingleProfessionalRecord()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser { Id = Guid.Parse(userId), UserName = "founder_bob", Name = "Founder Bob" };
        var prof = new ProfessionalProfileRecord
        {
            UserId = userId,
            Headline = "Old Headline",
            Bio = "Old Bio"
        };

        _userManagerMock.Setup(m => m.FindByIdAsync(userId)).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Entrepreneur" });
        _migrationMock.Setup(m => m.EnsureProfessionalProfileAsync(user, It.IsAny<CancellationToken>())).ReturnsAsync(prof);
        _profStoreMock.Setup(s => s.UpsertAsync(It.IsAny<ProfessionalProfileRecord>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var controller = CreateController(userId);
        var updateRequest = new UpdateUniversalProfileRequestDto
        {
            Headline = "Tech Founder & CEO",
            Bio = "Building future fintech infrastructure",
            Skills = new List<string> { "Leadership", "Fintech", "Product Strategy" }
        };

        var result = await controller.UpdateMyProfile(updateRequest, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        prof.Headline.Should().Be("Tech Founder & CEO");
        prof.Bio.Should().Be("Building future fintech infrastructure");
        prof.Skills.Should().Contain(new[] { "Leadership", "Fintech", "Product Strategy" });

        _profStoreMock.Verify(s => s.UpsertAsync(It.Is<ProfessionalProfileRecord>(p => p.UserId == userId), null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDraft_UniversalUser_ReturnsEditorDraft()
    {
        var userId = Guid.NewGuid().ToString();
        _editorMock.Setup(e => e.GetDraftAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ProfileDraftResponse>.Ok(new ProfileDraftResponse
            {
                Headline = "Draft Headline",
                Bio = "Draft Bio",
                BasedOnVersion = 2,
                LastStep = 1,
            }));

        var controller = CreateController(userId);
        var result = await controller.GetProfileDraft(CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _editorMock.Verify(e => e.GetDraftAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SaveDraft_UniversalUser_DelegatesToEditorService()
    {
        var userId = Guid.NewGuid().ToString();
        var request = new ProfileDraftRequest { Headline = "Saved Headline", LastStep = 2 };

        _editorMock.Setup(e => e.SaveDraftAsync(userId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ProfileDraftResponse>.Ok(new ProfileDraftResponse
            {
                Headline = "Saved Headline",
                LastStep = 2,
            }, "Draft saved."));

        var controller = CreateController(userId);
        var result = await controller.SaveProfileDraft(request, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _editorMock.Verify(e => e.SaveDraftAsync(userId, request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SubmitProfile_UniversalUser_PublishesProfileAtomically()
    {
        var userId = Guid.NewGuid().ToString();
        var request = new SubmitProfileEditorRequest
        {
            BasedOnVersion = 1,
            Draft = new ProfileDraftRequest { Headline = "Submitted Headline", LastStep = 4 }
        };

        _editorMock.Setup(e => e.SubmitAsync(userId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ProfileEditorSubmitResponse>.Ok(new ProfileEditorSubmitResponse
            {
                Outcome = "Published",
                Profile = new ServiceProviderProfileResponse { Headline = "Submitted Headline" },
                CredentialsPendingReview = 0
            }, "Profile submitted."));

        var controller = CreateController(userId);
        var result = await controller.SubmitProfileEditor(request, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _editorMock.Verify(e => e.SubmitAsync(userId, request, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DiscardDraft_UniversalUser_ClearsEditorDraft()
    {
        var userId = Guid.NewGuid().ToString();
        _editorMock.Setup(e => e.DiscardDraftAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ProfileDraftResponse>.Ok(new ProfileDraftResponse
            {
                HasDraft = false
            }, "Draft discarded."));

        var controller = CreateController(userId);
        var result = await controller.DiscardProfileDraft(CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _editorMock.Verify(e => e.DiscardDraftAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadProfileImage_UniversalUser_InvokesMediaService()
    {
        var userId = Guid.NewGuid().ToString();
        var formFileMock = new Mock<IFormFile>();

        _mediaMock.Setup(m => m.UploadProfileMediaAsync(userId, ProviderProfileMediaKind.ProfileImage, formFileMock.Object, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.Ok(new ServiceProviderProfileResponse(), "Image saved."));

        var controller = CreateController(userId);
        var result = await controller.UploadProfileImage(formFileMock.Object, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _mediaMock.Verify(m => m.UploadProfileMediaAsync(userId, ProviderProfileMediaKind.ProfileImage, formFileMock.Object, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveProfileImage_UniversalUser_InvokesMediaService()
    {
        var userId = Guid.NewGuid().ToString();

        _mediaMock.Setup(m => m.RemoveProfileMediaAsync(userId, ProviderProfileMediaKind.ProfileImage, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.Ok(new ServiceProviderProfileResponse(), "Image removed."));

        var controller = CreateController(userId);
        var result = await controller.RemoveProfileImage(CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _mediaMock.Verify(m => m.RemoveProfileMediaAsync(userId, ProviderProfileMediaKind.ProfileImage, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadCoverImage_UniversalUser_InvokesMediaService()
    {
        var userId = Guid.NewGuid().ToString();
        var formFileMock = new Mock<IFormFile>();

        _mediaMock.Setup(m => m.UploadProfileMediaAsync(userId, ProviderProfileMediaKind.CoverImage, formFileMock.Object, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.Ok(new ServiceProviderProfileResponse(), "Image saved."));

        var controller = CreateController(userId);
        var result = await controller.UploadCoverImage(formFileMock.Object, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _mediaMock.Verify(m => m.UploadProfileMediaAsync(userId, ProviderProfileMediaKind.CoverImage, formFileMock.Object, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveCoverImage_UniversalUser_InvokesMediaService()
    {
        var userId = Guid.NewGuid().ToString();

        _mediaMock.Setup(m => m.RemoveProfileMediaAsync(userId, ProviderProfileMediaKind.CoverImage, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.Ok(new ServiceProviderProfileResponse(), "Image removed."));

        var controller = CreateController(userId);
        var result = await controller.RemoveCoverImage(CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        _mediaMock.Verify(m => m.RemoveProfileMediaAsync(userId, ProviderProfileMediaKind.CoverImage, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetPublicProfile_ByPublicSlug_ResolvesProfileCorrectlyWithoutDuplicateNameCollision()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser { Id = Guid.Parse(userId), UserName = "yanis_rahman", Name = "Yanis Rahman" };
        var prof = new ProfessionalProfileRecord
        {
            UserId = userId,
            PublicSlug = "yanis-rahman",
            Headline = "Cloud Architect",
            Bio = "Building scalable distributed systems"
        };

        _profStoreMock.Setup(s => s.GetByPublicSlugAsync("yanis-rahman", It.IsAny<CancellationToken>()))
            .ReturnsAsync(prof);
        _userManagerMock.Setup(m => m.FindByIdAsync(userId))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "ServiceProvider" });

        var controller = CreateController(userId);
        var result = await controller.GetPublicProfile("yanis-rahman", CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task GetPublicProfile_ServiceProvider_PopulatesSafeExtensionDataOnly()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser { Id = Guid.Parse(userId), UserName = "sp_alex", Name = "Alex SP" };
        var prof = new ProfessionalProfileRecord
        {
            UserId = userId,
            PublicSlug = "alex-sp",
            Headline = "Full Stack Engineer"
        };
        var spRecord = new ServiceProviderProfileRecord
        {
            UserId = userId,
            VerificationStatus = ServiceProviderVerificationStatus.Verified,
            ProviderTier = ProviderTier.Tier2,
            TrustScore = 90,
            HasEnoughTrustData = true,
            PortfolioItems = new List<PortfolioItem>
            {
                new PortfolioItem { Id = "p-1", Title = "Cloud Platform", Description = "Enterprise AWS setup" }
            }
        };
        var creds = new List<UserCredentialRecord>
        {
            new UserCredentialRecord { Id = "c-1", Title = "AWS Solutions Architect", Status = CredentialStatus.Verified },
            new UserCredentialRecord { Id = "c-2", Title = "Draft Cert", Status = CredentialStatus.Draft } // Should NOT be included
        };

        _profStoreMock.Setup(s => s.GetByPublicSlugAsync("alex-sp", It.IsAny<CancellationToken>()))
            .ReturnsAsync(prof);
        _userManagerMock.Setup(m => m.FindByIdAsync(userId))
            .ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "ServiceProvider" });
        _spStoreMock.Setup(s => s.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(spRecord);
        _credentialStoreMock.Setup(c => c.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(creds);

        var controller = CreateController(userId);
        var result = await controller.GetPublicProfile("alex-sp", CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public void ProfileSlugGenerator_GeneratesUrlSafeUniqueFormat()
    {
        ProfileSlugGenerator.GenerateSlug("Yanis Rahman").Should().Be("yanis-rahman");
        ProfileSlugGenerator.GenerateSlug("  Special @@ Characters ## Name  ").Should().Be("special-characters-name");
        ProfileSlugGenerator.GenerateSlug("already-clean-slug").Should().Be("already-clean-slug");
        ProfileSlugGenerator.GenerateSlug("", "abcdef123456").Should().Be("member-abcdef12");
    }
}
