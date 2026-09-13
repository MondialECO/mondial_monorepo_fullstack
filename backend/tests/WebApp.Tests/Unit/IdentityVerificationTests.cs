using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Audit;
using WebApp.Services.Email;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class IdentityVerificationTests
    {
        private readonly Mock<IMongoDatabase> _mongoDbMock = new();
        private readonly Mock<MongoDbContext> _dbContextMock;
        private readonly Mock<IMongoCollection<UniversalIdentityVerification>> _verificationColMock = new();
        private readonly Mock<IMongoCollection<IdentityWebhookDeliveryLog>> _webhookLogColMock = new();
        private readonly Mock<IMongoCollection<IdentityDecisionAuditLog>> _auditLogColMock = new();
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<IWebHostEnvironment> _envMock = new();
        private readonly Mock<IAuditLogger> _auditMock = new();
        private readonly Mock<ILogger<IdentityVerificationService>> _serviceLoggerMock = new();
        private readonly IConfiguration _configuration;
        private readonly SumsubService _sumsubService;

        private readonly List<UniversalIdentityVerification> _inMemoryVerifications = new();
        private readonly List<IdentityWebhookDeliveryLog> _inMemoryWebhookLogs = new();
        private readonly List<IdentityDecisionAuditLog> _inMemoryAuditLogs = new();

        public IdentityVerificationTests()
        {
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
            _userManagerMock.Setup(u => u.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var configDict = new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "test-token",
                ["Sumsub:BaseUrl"] = "https://api.test.sumsub.com",
                ["Sumsub:WebhookSecret"] = "test-secret",
                ["FeatureFlags:IdentityV2Enabled"] = "true"
            };
            _configuration = new ConfigurationBuilder().AddInMemoryCollection(configDict).Build();

            _envMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);

            var sumsubLogger = new Mock<ILogger<SumsubService>>();
            _sumsubService = new SumsubService(new HttpClient(), _configuration, sumsubLogger.Object);

            _dbContextMock = new Mock<MongoDbContext>(_mongoDbMock.Object);
            _dbContextMock.Setup(d => d.UniversalIdentityVerifications).Returns(_verificationColMock.Object);
            _dbContextMock.Setup(d => d.IdentityWebhookDeliveryLogs).Returns(_webhookLogColMock.Object);
            _dbContextMock.Setup(d => d.IdentityDecisionAuditLogs).Returns(_auditLogColMock.Object);

            SetupInMemoryCollection();
        }

        private void SetupInMemoryCollection()
        {
            _verificationColMock.Setup(c => c.InsertOneAsync(
                    It.IsAny<UniversalIdentityVerification>(),
                    It.IsAny<InsertOneOptions>(),
                    It.IsAny<CancellationToken>()))
                .Callback<UniversalIdentityVerification, InsertOneOptions, CancellationToken>((doc, _, _) =>
                {
                    _inMemoryVerifications.Add(doc);
                })
                .Returns(Task.CompletedTask);

            _verificationColMock.Setup(c => c.ReplaceOneAsync(
                    It.IsAny<FilterDefinition<UniversalIdentityVerification>>(),
                    It.IsAny<UniversalIdentityVerification>(),
                    It.IsAny<ReplaceOptions>(),
                    It.IsAny<CancellationToken>()))
                .Callback<FilterDefinition<UniversalIdentityVerification>, UniversalIdentityVerification, ReplaceOptions, CancellationToken>((_, doc, _, _) =>
                {
                    var idx = _inMemoryVerifications.FindIndex(x => x.Id == doc.Id);
                    if (idx >= 0) _inMemoryVerifications[idx] = doc;
                    else _inMemoryVerifications.Add(doc);
                })
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            _webhookLogColMock.Setup(c => c.InsertOneAsync(
                    It.IsAny<IdentityWebhookDeliveryLog>(),
                    It.IsAny<InsertOneOptions>(),
                    It.IsAny<CancellationToken>()))
                .Callback<IdentityWebhookDeliveryLog, InsertOneOptions, CancellationToken>((doc, _, _) =>
                {
                    _inMemoryWebhookLogs.Add(doc);
                })
                .Returns(Task.CompletedTask);

            _auditLogColMock.Setup(c => c.InsertOneAsync(
                    It.IsAny<IdentityDecisionAuditLog>(),
                    It.IsAny<InsertOneOptions>(),
                    It.IsAny<CancellationToken>()))
                .Callback<IdentityDecisionAuditLog, InsertOneOptions, CancellationToken>((doc, _, _) =>
                {
                    _inMemoryAuditLogs.Add(doc);
                })
                .Returns(Task.CompletedTask);
        }

        private static string ComputeTestSignature(string body)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes("test-secret"));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private IdentityVerificationService CreateService(ApplicationUser? user = null)
        {
            if (user != null)
            {
                _userManagerMock.Setup(u => u.FindByIdAsync(user.Id.ToString()))
                    .ReturnsAsync(user);

                // Setup FindAsync to return matching user verification from in-memory list
                _verificationColMock.Setup(c => c.FindAsync(
                        It.IsAny<FilterDefinition<UniversalIdentityVerification>>(),
                        It.IsAny<FindOptions<UniversalIdentityVerification, UniversalIdentityVerification>>(),
                        It.IsAny<CancellationToken>()))
                    .ReturnsAsync((FilterDefinition<UniversalIdentityVerification> filter, FindOptions<UniversalIdentityVerification, UniversalIdentityVerification> opts, CancellationToken ct) =>
                    {
                        List<UniversalIdentityVerification> matches;
                        if (filter is ExpressionFilterDefinition<UniversalIdentityVerification> exprFilter)
                        {
                            try
                            {
                                var predicate = exprFilter.Expression.Compile();
                                matches = _inMemoryVerifications.FindAll(new Predicate<UniversalIdentityVerification>(predicate));
                            }
                            catch
                            {
                                matches = _inMemoryVerifications.FindAll(x => x.UserId == user.Id.ToString() && x.IsCurrent);
                            }
                        }
                        else
                        {
                            matches = _inMemoryVerifications.FindAll(x => x.UserId == user.Id.ToString() && x.IsCurrent);
                        }

                        var cursorMock = new Mock<IAsyncCursor<UniversalIdentityVerification>>();
                        cursorMock.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>()))
                            .Returns(matches.Count > 0)
                            .Returns(false);
                        cursorMock.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>()))
                            .ReturnsAsync(matches.Count > 0)
                            .ReturnsAsync(false);
                        cursorMock.Setup(x => x.Current).Returns(matches);
                        return cursorMock.Object;
                    });
            }

            return new IdentityVerificationService(
                _dbContextMock.Object,
                _userManagerMock.Object,
                _sumsubService,
                _configuration,
                _envMock.Object,
                _auditMock.Object,
                _serviceLoggerMock.Object
            );
        }

        // ======================================================================
        // TEST 1: France Document Options (Sections 7 & 9)
        // ======================================================================
        [Fact]
        public void GetIdentityConfig_ForFrance_ReturnsExpectedDocuments_AndExcludesDriversLicense()
        {
            var service = CreateService();
            var config = service.GetIdentityConfig("FR");

            Assert.Equal("FR", config.Country);
            Assert.Equal(3, config.Documents.Count);

            var types = config.Documents.ConvertAll(d => d.Type);
            Assert.Contains("national_id", types);
            Assert.Contains("passport", types);
            Assert.Contains("residence_permit", types);

            // Driver's license MUST NOT be in active France options
            Assert.DoesNotContain("drivers_license", types);
        }

        // ======================================================================
        // TEST 2: Upload Does NOT Verify Identity (Section 27)
        // ======================================================================
        [Fact]
        public async Task ManualUpload_SetsSubmitted_AndDoesNotVerify_PhaseRemainsZero()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "creator@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState
                {
                    Phase = 0,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = false,
                    FaceVerified = false
                }
            };

            var service = CreateService(user);

            var attempt = await service.RecordManualUploadAsync(
                user.Id.ToString(),
                "national_id",
                "uploads/identity/front.jpg",
                "uploads/identity/back.jpg",
                "FR"
            );

            // Assert attempt properties
            Assert.NotNull(attempt);
            Assert.Equal(IdentityVerificationState.Submitted, attempt.Status);
            Assert.True(attempt.IsCurrent);
            Assert.Equal("national_id", attempt.DocumentType);

            // MANDATORY CHECK: IdentityDocumentVerified MUST REMAIN FALSE
            Assert.False(user.Onboarding.IdentityDocumentVerified);
            Assert.Equal(0, user.Onboarding.Phase);
        }

        // ======================================================================
        // TEST 3: Provider Approval Sets Identity Verified and Promotes Phase 1 (Section 28)
        // ======================================================================
        [Fact]
        public async Task Webhook_Approved_SetsIdentityVerified_PromotesPhase1_LeavesFaceFalse()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "entrepreneur@mondial.test",
                User = "Entrepreneur",
                Onboarding = new OnboardingState
                {
                    Phase = 0,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = false,
                    FaceVerified = false // Face is FALSE
                }
            };

            var service = CreateService(user);

            var webhookPayload = new
            {
                applicantId = "app-12345",
                externalUserId = user.Id.ToString(),
                reviewStatus = "completed",
                reviewResult = new
                {
                    reviewAnswer = "GREEN"
                }
            };
            var rawBody = JsonSerializer.Serialize(webhookPayload);

            var result = await service.ProcessProviderWebhookAsync(rawBody, ComputeTestSignature(rawBody), "evt-100");

            Assert.True(result);
            Assert.True(user.Onboarding.IdentityDocumentVerified);

            // MANDATORY: Face MUST REMAIN FALSE
            Assert.False(user.Onboarding.FaceVerified);

            // Gate promotion: Email + Phone + Identity = Phase 1
            Assert.Equal(1, user.Onboarding.Phase);
        }

        // ======================================================================
        // TEST 4: Provider Rejection Sets Failure Reason and Keeps Phase 0 (Section 29)
        // ======================================================================
        [Fact]
        public async Task Webhook_Rejected_SetsIdentityUnverified_AndStoresNormalizedReason()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "investor@mondial.test",
                User = "Investor",
                Onboarding = new OnboardingState
                {
                    Phase = 0,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = false,
                    FaceVerified = false
                }
            };

            var service = CreateService(user);

            var webhookPayload = new
            {
                applicantId = "app-67890",
                externalUserId = user.Id.ToString(),
                reviewStatus = "completed",
                reviewResult = new
                {
                    reviewAnswer = "RED",
                    reviewRejectType = "RETRY",
                    rejectLabels = new[] { "DOCUMENT_PAGE_EXPIRATION_DATE" }
                }
            };
            var rawBody = JsonSerializer.Serialize(webhookPayload);

            var result = await service.ProcessProviderWebhookAsync(rawBody, ComputeTestSignature(rawBody), "evt-200");

            Assert.True(result);
            Assert.False(user.Onboarding.IdentityDocumentVerified);
            Assert.Equal(0, user.Onboarding.Phase);

            var currentAttempt = _inMemoryVerifications.Find(x => x.UserId == user.Id.ToString() && x.IsCurrent);
            Assert.NotNull(currentAttempt);
            Assert.Equal(IdentityVerificationState.RetryRequired, currentAttempt.Status);
            Assert.Equal("DOCUMENT_EXPIRED", currentAttempt.FailureReasonCode);
        }

        // ======================================================================
        // TEST 5: Manual Review Keeps Identity Unverified (Section 30)
        // ======================================================================
        [Fact]
        public async Task Webhook_OnHold_SetsManualReview_NoPrematureDashboardAccess()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "sp@mondial.test",
                User = "ServiceProvider",
                Onboarding = new OnboardingState
                {
                    Phase = 0,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = false
                }
            };

            var service = CreateService(user);

            var webhookPayload = new
            {
                applicantId = "app-hold-1",
                externalUserId = user.Id.ToString(),
                reviewStatus = "onHold"
            };
            var rawBody = JsonSerializer.Serialize(webhookPayload);

            var result = await service.ProcessProviderWebhookAsync(rawBody, ComputeTestSignature(rawBody), "evt-300");

            Assert.True(result);
            Assert.False(user.Onboarding.IdentityDocumentVerified);
            Assert.Equal(0, user.Onboarding.Phase);

            var currentAttempt = _inMemoryVerifications.Find(x => x.UserId == user.Id.ToString() && x.IsCurrent);
            Assert.NotNull(currentAttempt);
            Assert.Equal(IdentityVerificationState.ManualReview, currentAttempt.Status);
        }

        // ======================================================================
        // TEST 6: Duplicate Webhook Idempotency (Section 31)
        // ======================================================================
        [Fact]
        public async Task Webhook_DuplicateEvent_IsIdempotent_NoDuplicateRecords()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "dup@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState { Phase = 0 }
            };

            var service = CreateService(user);

            var webhookPayload = new
            {
                applicantId = "app-dup",
                externalUserId = user.Id.ToString(),
                reviewStatus = "completed",
                reviewResult = new { reviewAnswer = "GREEN" }
            };
            var rawBody = JsonSerializer.Serialize(webhookPayload);

            // First delivery
            var res1 = await service.ProcessProviderWebhookAsync(rawBody, ComputeTestSignature(rawBody), "evt-dup-999");
            Assert.True(res1);

            var initialRecordsCount = _inMemoryVerifications.Count;

            // Second duplicate delivery
            var res2 = await service.ProcessProviderWebhookAsync(rawBody, ComputeTestSignature(rawBody), "evt-dup-999");
            Assert.True(res2);

            // Assert no new duplicate record created
            Assert.Equal(initialRecordsCount, _inMemoryVerifications.Count);
        }

        // ======================================================================
        // TEST 7: Out-of-Order Webhook Protection (Section 32)
        // ======================================================================
        [Fact]
        public async Task Webhook_StalePendingAfterVerified_DoesNotDowngradeAuthoritativeState()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "ordering@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState
                {
                    Phase = 1,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = true
                }
            };

            // Pre-seed an existing verified attempt
            _inMemoryVerifications.Add(new UniversalIdentityVerification
            {
                Id = "ver-verified-1",
                UserId = user.Id.ToString(),
                IsCurrent = true,
                Status = IdentityVerificationState.Verified,
                VerifiedAt = DateTime.UtcNow
            });

            var service = CreateService(user);

            // Stale out-of-order pending event arrives
            var stalePayload = new
            {
                applicantId = "app-ordering",
                externalUserId = user.Id.ToString(),
                reviewStatus = "pending"
            };
            var rawBody = JsonSerializer.Serialize(stalePayload);

            var res = await service.ProcessProviderWebhookAsync(rawBody, ComputeTestSignature(rawBody), "evt-stale-1");
            Assert.True(res);

            // State MUST remain verified
            var current = _inMemoryVerifications.Find(x => x.UserId == user.Id.ToString() && x.IsCurrent);
            Assert.NotNull(current);
            Assert.Equal(IdentityVerificationState.Verified, current.Status);
            Assert.True(user.Onboarding.IdentityDocumentVerified);
            Assert.Equal(1, user.Onboarding.Phase);
        }

        // ======================================================================
        // TEST 8: CompleteOnboarding Blocks Unverified Identity (Section 24)
        // ======================================================================
        [Fact]
        public async Task CompleteOnboarding_FailsWhenIdentityDocumentNotVerified()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "testuser@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState
                {
                    Phase = 0,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = false, // NOT VERIFIED
                    FaceVerified = false
                }
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);

            var queueMock = new Mock<IEmailQueue>();
            var emailService = new EmailService(queueMock.Object, new Mock<ILogger<EmailService>>().Object);
            var controllerLogger = new Mock<ILogger<OnboardingController>>();
            var twilio = new TwilioService(_configuration, new Mock<ILogger<TwilioService>>().Object);
            var saveFile = new SaveFile();

            var controller = new OnboardingController(
                _userManagerMock.Object,
                twilio,
                emailService,
                _configuration,
                _envMock.Object,
                _sumsubService,
                controllerLogger.Object,
                saveFile,
                _auditMock.Object,
                CreateService(user)
            );

            var httpContext = new DefaultHttpContext();
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email!)
            }, "TestAuth"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            var result = await controller.CompleteOnboarding();

            // Result should be 400 Bad Request
            var objResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(400, objResult.StatusCode);
            Assert.Equal(0, user.Onboarding.Phase);
        }
        // ======================================================================
        // TEST 9: Admin Approval Through RecordAdminDecisionAsync (Hardening)
        // ======================================================================
        [Fact]
        public async Task AdminApproval_ThroughRecordAdminDecision_SetsVerified_PromotesPhase1()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "admin-test@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState
                {
                    Phase = 0,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = false,
                    FaceVerified = false
                }
            };

            // Pre-seed an existing submitted attempt
            _inMemoryVerifications.Add(new UniversalIdentityVerification
            {
                Id = "ver-admin-test-1",
                UserId = user.Id.ToString(),
                IsCurrent = true,
                Status = IdentityVerificationState.Submitted
            });

            var service = CreateService(user);

            var result = await service.RecordAdminDecisionAsync(
                user.Id.ToString(),
                "admin@mondial.eco",
                true,
                "Identity verified via manual review"
            );

            Assert.True(result);
            Assert.True(user.Onboarding.IdentityDocumentVerified);
            Assert.Equal(1, user.Onboarding.Phase); // Phase 1 promotion
            Assert.False(user.Onboarding.FaceVerified); // Face MUST remain false
        }

        // ======================================================================
        // TEST 10: Admin Rejection Through RecordAdminDecisionAsync (Hardening)
        // ======================================================================
        [Fact]
        public async Task AdminRejection_ThroughRecordAdminDecision_KeepsUnverified_PhaseZero()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "admin-reject@mondial.test",
                User = "Investor",
                Onboarding = new OnboardingState
                {
                    Phase = 0,
                    EmailOtpVerified = true,
                    PhoneVerified = true,
                    IdentityDocumentVerified = false,
                    FaceVerified = false
                }
            };

            // Pre-seed an existing submitted attempt
            _inMemoryVerifications.Add(new UniversalIdentityVerification
            {
                Id = "ver-admin-reject-1",
                UserId = user.Id.ToString(),
                IsCurrent = true,
                Status = IdentityVerificationState.Submitted
            });

            var service = CreateService(user);

            var result = await service.RecordAdminDecisionAsync(
                user.Id.ToString(),
                "admin@mondial.eco",
                false,
                "Document image too blurry"
            );

            Assert.True(result);
            Assert.False(user.Onboarding.IdentityDocumentVerified);
            Assert.Equal(0, user.Onboarding.Phase);

            var current = _inMemoryVerifications.Find(x => x.UserId == user.Id.ToString() && x.IsCurrent);
            Assert.NotNull(current);
            Assert.Equal(IdentityVerificationState.Rejected, current.Status);
        }

        // ======================================================================
        // TEST 11: Config Endpoint Returns AllowLegacyUpload Flag (Hardening)
        // ======================================================================
        [Fact]
        public void GetIdentityConfig_ReturnsAllowLegacyUploadFromConfiguration()
        {
            // Default config has AllowLegacyIdentityUpload not set → defaults to false
            var service = CreateService();
            var config = service.GetIdentityConfig("FR");

            Assert.False(config.AllowLegacyUpload);
        }

        // ======================================================================
        // TEST 12: Webhook With Invalid Signature Is Rejected (Hardening)
        // ======================================================================
        [Fact]
        public async Task Webhook_InvalidSignature_ReturnsFalse_AndLogsFailure()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "sigtest@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState { Phase = 0 }
            };

            var service = CreateService(user);

            var webhookPayload = new
            {
                applicantId = "app-fake",
                externalUserId = user.Id.ToString(),
                reviewStatus = "completed",
                reviewResult = new { reviewAnswer = "GREEN" }
            };
            var rawBody = JsonSerializer.Serialize(webhookPayload);

            var result = await service.ProcessProviderWebhookAsync(rawBody, "invalid-hmac-signature", "evt-inv-1");

            Assert.False(result);
            Assert.Contains(_inMemoryWebhookLogs, l => l.ProcessingResult == "invalid_signature");
        }
    }
}

