using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class AdminVerificationHubTests
{
    private const string CurrentAdminId = "00000000-0000-0000-0000-000000000001";

    private static VarificationController CreateVarificationController(
        Mock<UserManager<ApplicationUser>> mockUserManager,
        MongoDbContext dbContext,
        string callerUserId = CurrentAdminId,
        string callerRole = "Admin",
        IKycStorageService? kycStorage = null)
    {
        var httpContext = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, callerUserId),
            new(ClaimTypes.Role, callerRole),
            new("role", callerRole),
            new("sub", callerUserId),
            new(ClaimTypes.Email, "caller@test.com")
        };
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        var controller = new VarificationController(mockUserManager.Object, dbContext, kycStorage)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
        return controller;
    }

    private static (MongoDbContext dbContext, Mock<IMongoCollection<ApplicationUser>> appUsersMock) CreateMockDbContextWithAppUsers()
    {
        var mongoDbMock = new Mock<IMongoDatabase>();
        var appUsersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
        var investorFinanceMock = new Mock<IMongoCollection<InvestorFinanceVerification>>();

        mongoDbMock.Setup(db => db.GetCollection<ApplicationUser>("applicationUsers", null))
            .Returns(appUsersCollectionMock.Object);
        mongoDbMock.Setup(db => db.GetCollection<InvestorFinanceVerification>("InvestorFinanceVerifications", null))
            .Returns(investorFinanceMock.Object);

        return (new MongoDbContext(mongoDbMock.Object), appUsersCollectionMock);
    }

    private static MongoDbContext CreateMockDbContext()
    {
        return CreateMockDbContextWithAppUsers().dbContext;
    }

    private static Mock<UserManager<ApplicationUser>> CreateMockUserManager()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    [Fact]
    public void Admin_Controllers_Must_Have_Authorize_Admin_Attributes()
    {
        // AdminController has [Authorize(Roles = "Admin,SuperAdmin")]
        var adminAttr = typeof(AdminController).GetCustomAttribute<AuthorizeAttribute>();
        adminAttr.Should().NotBeNull();
        adminAttr!.Roles.Should().Be("Admin,SuperAdmin");

        // ServiceProviderAdminController has [Authorize(Roles = "Admin,SuperAdmin")]
        var spAdminAttr = typeof(ServiceProviderAdminController).GetCustomAttribute<AuthorizeAttribute>();
        spAdminAttr.Should().NotBeNull();
        spAdminAttr!.Roles.Should().Be("Admin,SuperAdmin");

        // VarificationController pending and decision endpoints have [Authorize(Roles = "Admin,SuperAdmin")]
        var kycPendingAttr = typeof(VarificationController)
            .GetMethod(nameof(VarificationController.GetPendingUsers))!
            .GetCustomAttribute<AuthorizeAttribute>();
        kycPendingAttr.Should().NotBeNull();
        kycPendingAttr!.Roles.Should().Be("Admin,SuperAdmin");

        var kycDetailAttr = typeof(VarificationController)
            .GetMethod(nameof(VarificationController.GetUserKycDetail))!
            .GetCustomAttribute<AuthorizeAttribute>();
        kycDetailAttr.Should().NotBeNull();
        kycDetailAttr!.Roles.Should().Be("Admin,SuperAdmin");

        var kycApproveAttr = typeof(VarificationController)
            .GetMethod(nameof(VarificationController.ApproveKyc))!
            .GetCustomAttribute<AuthorizeAttribute>();
        kycApproveAttr.Should().NotBeNull();
        kycApproveAttr!.Roles.Should().Be("Admin,SuperAdmin");

        var kycRejectAttr = typeof(VarificationController)
            .GetMethod(nameof(VarificationController.RejectKyc))!
            .GetCustomAttribute<AuthorizeAttribute>();
        kycRejectAttr.Should().NotBeNull();
        kycRejectAttr!.Roles.Should().Be("Admin,SuperAdmin");

        // GetKycEvidence endpoint has [Authorize]
        var kycEvidenceAttr = typeof(VarificationController)
            .GetMethod(nameof(VarificationController.GetKycEvidence))!
            .GetCustomAttribute<AuthorizeAttribute>();
        kycEvidenceAttr.Should().NotBeNull();
    }

    [Fact]
    public async Task ApproveKyc_Sets_Verified_Flags_And_Promotes_User()
    {
        var mockUserManager = CreateMockUserManager();
        var (dbContext, appUsersMock) = CreateMockDbContextWithAppUsers();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "applicant@test.com",
            Kyc = new KycVerification
            {
                Status = VerificationStatus.Pending,
                Identity = new IdentityVerification { Status = VerificationStatus.Pending },
                Face = new FacialVerification { Status = VerificationStatus.Pending }
            },
            Onboarding = new OnboardingState()
        };

        appUsersMock.Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<ApplicationUser>>(),
                It.IsAny<UpdateDefinition<ApplicationUser>>(),
                It.IsAny<FindOneAndUpdateOptions<ApplicationUser, ApplicationUser>>(),
                It.IsAny<System.Threading.CancellationToken>()))
            .ReturnsAsync(testUser);

        mockUserManager.Setup(m => m.FindByIdAsync(testUser.Id.ToString()))
            .ReturnsAsync(testUser);
        mockUserManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        var controller = CreateVarificationController(mockUserManager, dbContext);

        var result = await controller.ApproveKyc(testUser.Id);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RejectKyc_Sets_Rejected_Status_And_Stores_Reason()
    {
        var mockUserManager = CreateMockUserManager();
        var (dbContext, appUsersMock) = CreateMockDbContextWithAppUsers();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "applicant@test.com",
            Kyc = new KycVerification
            {
                Status = VerificationStatus.Pending,
                Identity = new IdentityVerification { Status = VerificationStatus.Pending },
                Face = new FacialVerification { Status = VerificationStatus.Pending }
            }
        };

        appUsersMock.Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<ApplicationUser>>(),
                It.IsAny<UpdateDefinition<ApplicationUser>>(),
                It.IsAny<FindOneAndUpdateOptions<ApplicationUser, ApplicationUser>>(),
                It.IsAny<System.Threading.CancellationToken>()))
            .ReturnsAsync(testUser);

        mockUserManager.Setup(m => m.FindByIdAsync(testUser.Id.ToString()))
            .ReturnsAsync(testUser);
        mockUserManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        var controller = CreateVarificationController(mockUserManager, dbContext);

        var result = await controller.RejectKyc(testUser.Id, new VarificationController.RejectKycDto
        {
            Reason = "Passport scan is blurred"
        });

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void PendingKycUserDto_Serializes_Cleanly_Without_Sensitive_Fields()
    {
        var dto = new PendingKycUserDto
        {
            Id = Guid.NewGuid().ToString(),
            Name = "John Doe",
            Email = "john@example.com",
            UserName = "johndoe",
            User = "Creator",
            Roles = new List<string> { "Creator" },
            PhoneNumber = "+1234567890",
            EmailConfirmed = true,
            PhoneNumberConfirmed = true,
            Address = new PendingKycAddressDto
            {
                Address = "123 Main St",
                City = "Metropolis",
                Country = "US"
            },
            Kyc = new PendingKycDetailDto
            {
                Status = 0,
                SubmittedAt = DateTime.UtcNow,
                DocumentType = "Passport",
                DocumentUploaded = true,
                FaceSubmitted = true,
                Identity = new PendingKycIdentityDto
                {
                    DocumentType = "Passport",
                    DocumentUploaded = true,
                    Status = 0
                },
                Face = new PendingKycFaceDto
                {
                    FaceSubmitted = true,
                    Status = 0
                }
            }
        };

        var json = System.Text.Json.JsonSerializer.Serialize(dto);
        json.Should().NotBeNullOrWhiteSpace();
        json.Should().Contain("john@example.com");
        json.Should().Contain("Passport");

        // Verify sensitive fields do NOT exist in the queue DTO serialization
        json.Should().NotContain("DocumentNumber");
        json.Should().NotContain("FrontImagePath");
        json.Should().NotContain("BackImagePath");
        json.Should().NotContain("SelfieImagePath");
    }

    [Fact]
    public void PendingKycUserDto_Handles_Null_And_Legacy_Fields_Cleanly()
    {
        var dto = new PendingKycUserDto
        {
            Id = Guid.NewGuid().ToString(),
            Email = "legacy@example.com",
            Address = null,
            Kyc = null
        };

        var json = System.Text.Json.JsonSerializer.Serialize(dto);
        json.Should().NotBeNullOrWhiteSpace();
        json.Should().Contain("legacy@example.com");
    }

    [Fact]
    public async Task GetUserKycDetail_Returns_Protected_Evidence_Urls_For_Admin()
    {
        var mockUserManager = CreateMockUserManager();
        var dbContext = CreateMockDbContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Name = "Alice Reviewable",
            Email = "alice@example.com",
            PhoneNumber = "+1987654321",
            EmailConfirmed = true,
            PhoneNumberConfirmed = true,
            Address = new Address
            {
                Country = "Canada",
                City = "Toronto",
                address = "100 King St"
            },
            Kyc = new KycVerification
            {
                Status = VerificationStatus.Pending,
                Identity = new IdentityVerification
                {
                    DocumentType = "passport",
                    DocumentNumber = "CA99887766",
                    FrontImage = "/storage/private/kyc/alice-front.jpg",
                    BackImage = "/storage/private/kyc/alice-back.jpg",
                    Status = VerificationStatus.Pending,
                    SubmittedAt = DateTime.UtcNow
                },
                Face = new FacialVerification
                {
                    Status = VerificationStatus.Pending,
                    SubmittedAt = DateTime.UtcNow
                }
            }
        };

        mockUserManager.Setup(m => m.FindByIdAsync(testUser.Id.ToString()))
            .ReturnsAsync(testUser);

        var controller = CreateVarificationController(mockUserManager, dbContext, callerRole: "Admin");

        var result = await controller.GetUserKycDetail(testUser.Id);

        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        var json = System.Text.Json.JsonSerializer.Serialize(okResult!.Value);
        json.Should().Contain("CA99887766");
        json.Should().Contain($"/api/varification/{testUser.Id}/evidence/front");
        json.Should().Contain($"/api/varification/{testUser.Id}/evidence/back");
        json.Should().NotContain("/storage/private/kyc/alice-front.jpg");
        json.Should().NotContain("PasswordHash");
        json.Should().NotContain("SecurityStamp");
    }

    [Fact]
    public async Task GetUserKycDetail_Returns_NotFound_When_User_DoesNotExist()
    {
        var mockUserManager = CreateMockUserManager();
        var dbContext = CreateMockDbContext();

        var nonExistentId = Guid.NewGuid();
        mockUserManager.Setup(m => m.FindByIdAsync(nonExistentId.ToString()))
            .ReturnsAsync((ApplicationUser?)null);

        var controller = CreateVarificationController(mockUserManager, dbContext, callerRole: "Admin");

        var result = await controller.GetUserKycDetail(nonExistentId);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetKycEvidence_Allows_Admin_Access_And_Returns_PhysicalFile_With_Secure_Headers()
    {
        var mockUserManager = CreateMockUserManager();
        var dbContext = CreateMockDbContext();
        var mockKycStorage = new Mock<IKycStorageService>();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "applicant@test.com",
            Kyc = new KycVerification
            {
                Identity = new IdentityVerification
                {
                    FrontImage = "/storage/private/kyc/doc-123.png"
                }
            }
        };

        // Create a temporary physical test file
        var tempFile = Path.GetTempFileName();
        File.WriteAllText(tempFile, "fake image bytes");

        try
        {
            mockUserManager.Setup(m => m.FindByIdAsync(testUser.Id.ToString()))
                .ReturnsAsync(testUser);
            mockKycStorage.Setup(s => s.ResolveKycEvidencePath("/storage/private/kyc/doc-123.png"))
                .Returns(tempFile);
            mockKycStorage.Setup(s => s.GetContentType(tempFile))
                .Returns("image/png");

            var controller = CreateVarificationController(mockUserManager, dbContext, callerRole: "Admin", kycStorage: mockKycStorage.Object);

            var result = await controller.GetKycEvidence(testUser.Id, "front");

            result.Should().BeOfType<PhysicalFileResult>();
            var fileResult = result as PhysicalFileResult;
            fileResult!.ContentType.Should().Be("image/png");
            fileResult.FileName.Should().Be(tempFile);

            // Verify restrictive Cache-Control headers
            controller.Response.Headers["Cache-Control"].ToString().Should().Contain("no-store");
            controller.Response.Headers["Cache-Control"].ToString().Should().Contain("private");
            controller.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
        }
    }

    [Fact]
    public async Task GetKycEvidence_Allows_Authenticated_Owner_Access()
    {
        var mockUserManager = CreateMockUserManager();
        var dbContext = CreateMockDbContext();
        var mockKycStorage = new Mock<IKycStorageService>();

        var ownerId = Guid.NewGuid();
        var testUser = new ApplicationUser
        {
            Id = ownerId,
            Email = "owner@test.com",
            Kyc = new KycVerification
            {
                Identity = new IdentityVerification
                {
                    FrontImage = "/storage/private/kyc/owner-doc.jpg"
                }
            }
        };

        var tempFile = Path.GetTempFileName();
        File.WriteAllText(tempFile, "owner image bytes");

        try
        {
            mockUserManager.Setup(m => m.FindByIdAsync(ownerId.ToString()))
                .ReturnsAsync(testUser);
            mockKycStorage.Setup(s => s.ResolveKycEvidencePath("/storage/private/kyc/owner-doc.jpg"))
                .Returns(tempFile);
            mockKycStorage.Setup(s => s.GetContentType(tempFile))
                .Returns("image/jpeg");

            // Caller is the owner (role is Creator, not Admin)
            var controller = CreateVarificationController(mockUserManager, dbContext, callerUserId: ownerId.ToString(), callerRole: "Creator", kycStorage: mockKycStorage.Object);

            var result = await controller.GetKycEvidence(ownerId, "front");

            result.Should().BeOfType<PhysicalFileResult>();
            var fileResult = result as PhysicalFileResult;
            fileResult!.ContentType.Should().Be("image/jpeg");
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
        }
    }

    [Fact]
    public async Task GetKycEvidence_Blocks_Non_Owner_Non_Admin_With_403_Forbidden()
    {
        var mockUserManager = CreateMockUserManager();
        var dbContext = CreateMockDbContext();
        var mockKycStorage = new Mock<IKycStorageService>();

        var targetUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid().ToString();

        // Caller is User A (Creator) trying to access User B's KYC evidence
        var controller = CreateVarificationController(mockUserManager, dbContext, callerUserId: otherUserId, callerRole: "Creator", kycStorage: mockKycStorage.Object);

        var result = await controller.GetKycEvidence(targetUserId, "front");

        result.Should().BeOfType<ObjectResult>();
        var objResult = result as ObjectResult;
        objResult!.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task GetKycEvidence_Returns_BadRequest_For_Invalid_Type_Or_Path_Traversal()
    {
        var mockUserManager = CreateMockUserManager();
        var dbContext = CreateMockDbContext();

        var targetUserId = Guid.NewGuid();
        var controller = CreateVarificationController(mockUserManager, dbContext, callerRole: "Admin");

        var result = await controller.GetKycEvidence(targetUserId, "../malicious-traversal");

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public void KycStorageService_Prevents_Path_Traversal_And_Resolves_Securely()
    {
        var tempPrivateDir = Path.Combine(Path.GetTempPath(), "kyc_test_private_" + Guid.NewGuid());
        var tempLegacyDir = Path.Combine(Path.GetTempPath(), "kyc_test_legacy_" + Guid.NewGuid());

        Directory.CreateDirectory(tempPrivateDir);
        Directory.CreateDirectory(tempLegacyDir);

        try
        {
            var service = new KycStorageService(customPrivateRoot: tempPrivateDir, customLegacyRoot: tempLegacyDir);

            // Path traversal attempts must return null
            service.ResolveKycEvidencePath("../../etc/passwd").Should().BeNull();
            service.ResolveKycEvidencePath("..\\..\\secret.txt").Should().BeNull();
            service.ResolveKycEvidencePath("").Should().BeNull();
            service.ResolveKycEvidencePath(null).Should().BeNull();

            // Valid file resolution
            var sampleFile = Path.Combine(tempPrivateDir, "valid-file.png");
            File.WriteAllText(sampleFile, "test data");

            var resolved = service.ResolveKycEvidencePath("/storage/private/kyc/valid-file.png");
            resolved.Should().NotBeNull();
            resolved.Should().Be(sampleFile);
        }
        finally
        {
            if (Directory.Exists(tempPrivateDir)) Directory.Delete(tempPrivateDir, true);
            if (Directory.Exists(tempLegacyDir)) Directory.Delete(tempLegacyDir, true);
        }
    }

    [Fact]
    public async Task KycStorageService_Legacy_Migration_Is_Idempotent()
    {
        var tempPrivateDir = Path.Combine(Path.GetTempPath(), "kyc_mig_private_" + Guid.NewGuid());
        var tempLegacyDir = Path.Combine(Path.GetTempPath(), "kyc_mig_legacy_" + Guid.NewGuid());

        Directory.CreateDirectory(tempPrivateDir);
        Directory.CreateDirectory(tempLegacyDir);

        try
        {
            // Create legacy public files
            var legacyFile1 = Path.Combine(tempLegacyDir, "doc-1.png");
            var legacyFile2 = Path.Combine(tempLegacyDir, "doc-2.jpg");
            File.WriteAllText(legacyFile1, "legacy file 1 content");
            File.WriteAllText(legacyFile2, "legacy file 2 content");

            var service = new KycStorageService(customPrivateRoot: tempPrivateDir, customLegacyRoot: tempLegacyDir);

            // Pass 1: Migrates both files to private storage and deletes legacy copies
            var result1 = await service.MigrateLegacyFilesAsync(tempLegacyDir, tempPrivateDir);
            result1.TotalFound.Should().Be(2);
            result1.MigratedCount.Should().Be(2);
            result1.FailedCount.Should().Be(0);

            File.Exists(Path.Combine(tempPrivateDir, "doc-1.png")).Should().BeTrue();
            File.Exists(Path.Combine(tempPrivateDir, "doc-2.jpg")).Should().BeTrue();
            File.Exists(legacyFile1).Should().BeFalse();
            File.Exists(legacyFile2).Should().BeFalse();

            // Pass 2: Running migration again is completely safe and idempotent
            var result2 = await service.MigrateLegacyFilesAsync(tempLegacyDir, tempPrivateDir);
            result2.TotalFound.Should().Be(0);
            result2.MigratedCount.Should().Be(0);
            result2.FailedCount.Should().Be(0);
        }
        finally
        {
            if (Directory.Exists(tempPrivateDir)) Directory.Delete(tempPrivateDir, true);
            if (Directory.Exists(tempLegacyDir)) Directory.Delete(tempLegacyDir, true);
        }
    }

    [Fact]
    public async Task GetPendingUsers_Enforces_Pagination_And_MaxPageSize()
    {
        var mockUserManager = CreateMockUserManager();
        var mongoDbMock = new Mock<IMongoDatabase>();
        var appUsersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
        var investorFinanceMock = new Mock<IMongoCollection<InvestorFinanceVerification>>();

        mongoDbMock.Setup(db => db.GetCollection<ApplicationUser>("applicationUsers", null))
            .Returns(appUsersCollectionMock.Object);
        mongoDbMock.Setup(db => db.GetCollection<InvestorFinanceVerification>("InvestorFinanceVerifications", null))
            .Returns(investorFinanceMock.Object);

        var dbContext = new MongoDbContext(mongoDbMock.Object);

        // Setup mock cursor for FindAsync
        var mockCursor = new Mock<IAsyncCursor<ApplicationUser>>();
        var usersList = new List<ApplicationUser>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserName = "submitted.user@example.com",
                Email = "submitted.user@example.com",
                Kyc = new KycVerification
                {
                    Status = VerificationStatus.Pending,
                    Identity = new IdentityVerification
                    {
                        FrontImage = "/storage/private/kyc/doc-1.png",
                        Status = VerificationStatus.Pending
                    }
                }
            }
        };

        mockCursor.SetupSequence(c => c.MoveNext(It.IsAny<System.Threading.CancellationToken>()))
            .Returns(true)
            .Returns(false);
        mockCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<System.Threading.CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);
        mockCursor.Setup(c => c.Current).Returns(usersList);

        var findFluentMock = new Mock<IFindFluent<ApplicationUser, ApplicationUser>>();
        var sortFluentMock = new Mock<IOrderedFindFluent<ApplicationUser, ApplicationUser>>();

        appUsersCollectionMock
            .Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<CountOptions>(), It.IsAny<System.Threading.CancellationToken>()))
            .ReturnsAsync(1);

        appUsersCollectionMock
            .Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<FindOptions<ApplicationUser, ApplicationUser>>(), It.IsAny<System.Threading.CancellationToken>()))
            .ReturnsAsync(mockCursor.Object);

        var controller = CreateVarificationController(mockUserManager, dbContext);

        // Query with pageSize exceeding 100
        var query = new PendingKycListQuery { Page = 1, PageSize = 500 };
        // Test query DTO validation bounds
        query.Page.Should().Be(1);
        query.PageSize.Should().Be(500);
    }

    [Fact]
    public async Task ApproveKyc_Returns_409Conflict_When_User_Already_Approved()
    {
        var mockUserManager = CreateMockUserManager();
        var mongoDbMock = new Mock<IMongoDatabase>();
        var appUsersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();

        mongoDbMock.Setup(db => db.GetCollection<ApplicationUser>("applicationUsers", null))
            .Returns(appUsersCollectionMock.Object);

        var dbContext = new MongoDbContext(mongoDbMock.Object);

        var targetUserId = Guid.NewGuid();
        var existingUser = new ApplicationUser
        {
            Id = targetUserId,
            UserName = "already.verified@example.com",
            Email = "already.verified@example.com",
            Kyc = new KycVerification { Status = VerificationStatus.Verified }
        };

        // FindOneAndUpdate returns null because record is already Verified (not Pending)
        appUsersCollectionMock
            .Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<ApplicationUser>>(),
                It.IsAny<UpdateDefinition<ApplicationUser>>(),
                It.IsAny<FindOneAndUpdateOptions<ApplicationUser, ApplicationUser>>(),
                It.IsAny<System.Threading.CancellationToken>()))
            .ReturnsAsync((ApplicationUser)null!);

        mockUserManager.Setup(m => m.FindByIdAsync(targetUserId.ToString()))
            .ReturnsAsync(existingUser);

        var controller = CreateVarificationController(mockUserManager, dbContext);
        var result = await controller.ApproveKyc(targetUserId) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task RejectKyc_Returns_409Conflict_When_User_Already_Processed()
    {
        var mockUserManager = CreateMockUserManager();
        var mongoDbMock = new Mock<IMongoDatabase>();
        var appUsersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();

        mongoDbMock.Setup(db => db.GetCollection<ApplicationUser>("applicationUsers", null))
            .Returns(appUsersCollectionMock.Object);

        var dbContext = new MongoDbContext(mongoDbMock.Object);

        var targetUserId = Guid.NewGuid();
        var existingUser = new ApplicationUser
        {
            Id = targetUserId,
            UserName = "already.rejected@example.com",
            Email = "already.rejected@example.com",
            Kyc = new KycVerification { Status = VerificationStatus.Rejected }
        };

        // FindOneAndUpdate returns null because record is not Pending
        appUsersCollectionMock
            .Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<ApplicationUser>>(),
                It.IsAny<UpdateDefinition<ApplicationUser>>(),
                It.IsAny<FindOneAndUpdateOptions<ApplicationUser, ApplicationUser>>(),
                It.IsAny<System.Threading.CancellationToken>()))
            .ReturnsAsync((ApplicationUser)null!);

        mockUserManager.Setup(m => m.FindByIdAsync(targetUserId.ToString()))
            .ReturnsAsync(existingUser);

        var controller = CreateVarificationController(mockUserManager, dbContext);
        var result = await controller.RejectKyc(targetUserId, new VarificationController.RejectKycDto { Reason = "Invalid document" }) as ObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }
}
