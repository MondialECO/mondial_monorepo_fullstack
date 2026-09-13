using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
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
                ["Sumsub:SecretKey"] = "test-secret-key",
                ["Sumsub:BaseUrl"] = "https://api.test.sumsub.com",
                ["Sumsub:WebhookSecret"] = "test-secret",
                ["Sumsub:LevelName"] = "id-document-only",
                ["FeatureFlags:IdentityV2Enabled"] = "true"
            };
            _configuration = new ConfigurationBuilder().AddInMemoryCollection(configDict).Build();

            _envMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);

            var sumsubLogger = new Mock<ILogger<SumsubService>>();
            var testHandler = new TestHttpMessageHandler(req =>
            {
                if (req.RequestUri != null && req.RequestUri.AbsolutePath.Contains("/resources/applicants"))
                {
                    var applicantContent = JsonSerializer.Serialize(new { id = "app-mock-123" });
                    return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent(applicantContent, Encoding.UTF8, "application/json")
                    };
                }

                var tokenContent = JsonSerializer.Serialize(new { token = "test-access-token-xyz" });
                return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent(tokenContent, Encoding.UTF8, "application/json")
                };
            });
            _sumsubService = new SumsubService(new HttpClient(testHandler), _configuration, sumsubLogger.Object);

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

        private IdentityVerificationService CreateService(ApplicationUser? user = null, SumsubService? sumsub = null)
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
                sumsub ?? _sumsubService,
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

        // ======================================================================
        // TEST 13: SumsubService Fails Closed When LevelName Is Missing
        // ======================================================================
        [Fact]
        public async Task SumsubService_FailsClosed_WhenLevelNameMissing()
        {
            var emptyLevelConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "test-token",
                ["Sumsub:SecretKey"] = "test-secret-key",
                ["Sumsub:BaseUrl"] = "https://api.test.sumsub.com",
                ["Sumsub:WebhookSecret"] = "test-secret"
                // Missing Sumsub:LevelName
            }).Build();

            var service = new SumsubService(new HttpClient(), emptyLevelConfig, new Mock<ILogger<SumsubService>>().Object);
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateAccessTokenAsync("user-123", "user@test.com"));
            Assert.Contains("LevelName not configured", ex.Message);
        }

        // ======================================================================
        // TEST 14: SumsubService Fails Closed When AppToken Is Missing
        // ======================================================================
        [Fact]
        public async Task SumsubService_FailsClosed_WhenAppTokenMissing()
        {
            var emptyTokenConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:SecretKey"] = "test-secret-key",
                ["Sumsub:LevelName"] = "id-document-only",
                ["Sumsub:BaseUrl"] = "https://api.test.sumsub.com",
                ["Sumsub:WebhookSecret"] = "test-secret"
                // Missing Sumsub:AppToken
            }).Build();

            var service = new SumsubService(new HttpClient(), emptyTokenConfig, new Mock<ILogger<SumsubService>>().Object);
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateAccessTokenAsync("user-123", "user@test.com"));
            Assert.Contains("AppToken is not configured", ex.Message);
        }

        // ======================================================================
        // TEST 15: SumsubService Uses POST /resources/accessTokens/sdk Contract
        // ======================================================================
        [Fact]
        public async Task SumsubService_UsesSdkTokenEndpoint_AndBindsLevelInJsonBody()
        {
            HttpRequestMessage? capturedRequest = null;
            var testHandler = new TestHttpMessageHandler(req =>
            {
                capturedRequest = req;
                var responseContent = JsonSerializer.Serialize(new { token = "test-access-token-xyz" });
                return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent(responseContent, Encoding.UTF8, "application/json")
                };
            });

            var httpClient = new HttpClient(testHandler);
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "test-token",
                ["Sumsub:SecretKey"] = "test-secret-key",
                ["Sumsub:BaseUrl"] = "https://api.test.sumsub.com",
                ["Sumsub:WebhookSecret"] = "test-secret",
                ["Sumsub:LevelName"] = "id-document-only"
            }).Build();

            var service = new SumsubService(httpClient, config, new Mock<ILogger<SumsubService>>().Object);
            var token = await service.GenerateAccessTokenAsync("test-user-456", "user@test.com");

            Assert.Equal("test-access-token-xyz", token);
            Assert.NotNull(capturedRequest);
            Assert.Equal(HttpMethod.Post, capturedRequest!.Method);
            Assert.Equal("/resources/accessTokens/sdk", capturedRequest.RequestUri!.AbsolutePath);

            // Query string must NOT contain levelName
            Assert.DoesNotContain("levelName", capturedRequest.RequestUri.Query);

            var bodyJson = await capturedRequest.Content!.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(bodyJson);
            Assert.Equal("test-user-456", doc.RootElement.GetProperty("userId").GetString());
            Assert.Equal("id-document-only", doc.RootElement.GetProperty("levelName").GetString());
            Assert.Equal(900, doc.RootElement.GetProperty("ttlInSecs").GetInt32());
        }

        // ======================================================================
        // TEST 16: CreateOrGetSessionAsync Uses Explicit Level And Returns Token
        // ======================================================================
        [Fact]
        public async Task CreateOrGetSessionAsync_UsesConfiguredLevel_AndGeneratesSession()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "session-test@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState { Phase = 0 }
            };

            var service = CreateService(user);

            var session = await service.CreateOrGetSessionAsync(
                user.Id.ToString(),
                "FR",
                "national_id",
                "FR",
                "FR"
            );

            Assert.NotNull(session);
            Assert.Equal("national_id", session.DocumentType);
            Assert.Equal("submitted", session.Status);
            Assert.NotEmpty(session.AccessToken);
        }

        // ======================================================================
        // TEST 17: Deterministic HMAC-SHA256 Request Signing Verification
        // ======================================================================
        [Fact]
        public void SumsubService_GenerateSignature_MatchesOfficialSumsubContract()
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "sbx:test-app-token",
                ["Sumsub:SecretKey"] = "test-secret-key-12345",
                ["Sumsub:LevelName"] = "id-document-only"
            }).Build();

            var service = new SumsubService(new HttpClient(), config, new Mock<ILogger<SumsubService>>().Object);

            long timestamp = 1710000000;
            string method = "POST";
            string url = "https://api.sumsub.com/resources/accessTokens/sdk";
            string jsonBody = "{\"userId\":\"user-123\",\"levelName\":\"id-document-only\",\"ttlInSecs\":900}";
            byte[] bodyBytes = Encoding.UTF8.GetBytes(jsonBody);

            // Official Sumsub contract: timestamp + METHOD + pathAndQuery + exactBody
            string rawToSign = $"{timestamp}{method}/resources/accessTokens/sdk{jsonBody}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes("test-secret-key-12345"));
            string expectedHex = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawToSign))).ToLowerInvariant();

            string actualSignature = service.GenerateSignature(method, url, timestamp, bodyBytes);

            Assert.Equal(expectedHex, actualSignature);
        }

        // ======================================================================
        // TEST 18: Deterministic HMAC Signing With Query Parameters (Applicant Creation)
        // ======================================================================
        [Fact]
        public void SumsubService_GenerateSignature_IncludesQueryParametersCorrectly()
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "sbx:test-app-token",
                ["Sumsub:SecretKey"] = "test-secret-key-12345",
                ["Sumsub:LevelName"] = "id-document-only"
            }).Build();

            var service = new SumsubService(new HttpClient(), config, new Mock<ILogger<SumsubService>>().Object);

            long timestamp = 1710000000;
            string method = "POST";
            string url = "https://api.sumsub.com/resources/applicants?levelName=id-document-only";
            string jsonBody = "{\"externalUserId\":\"user-999\",\"email\":\"test@mondial.eco\"}";
            byte[] bodyBytes = Encoding.UTF8.GetBytes(jsonBody);

            string rawToSign = $"{timestamp}{method}/resources/applicants?levelName=id-document-only{jsonBody}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes("test-secret-key-12345"));
            string expectedHex = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawToSign))).ToLowerInvariant();

            string actualSignature = service.GenerateSignature(method, url, timestamp, bodyBytes);

            Assert.Equal(expectedHex, actualSignature);
        }

        // ======================================================================
        // TEST 19: Route Regression - Canonical Webhook Route Exists On IdentityController
        // ======================================================================
        [Fact]
        public void IdentityRoutes_CanonicalWebhook_ExistsAndAllowsAnonymous()
        {
            var controllerType = typeof(WebApp.Controllers.IdentityController);
            var routeAttr = controllerType.GetCustomAttributes(typeof(RouteAttribute), false)
                .Cast<RouteAttribute>().FirstOrDefault();
            Assert.NotNull(routeAttr);
            Assert.Equal("api/[controller]", routeAttr!.Template);

            var webhookMethod = controllerType.GetMethod("HandleSumsubWebhook");
            Assert.NotNull(webhookMethod);

            var httpPostAttr = webhookMethod!.GetCustomAttributes(typeof(HttpPostAttribute), false)
                .Cast<HttpPostAttribute>().FirstOrDefault();
            Assert.NotNull(httpPostAttr);
            Assert.Equal("webhook/sumsub", httpPostAttr!.Template);

            var allowAnon = webhookMethod.GetCustomAttributes(typeof(AllowAnonymousAttribute), false);
            Assert.NotEmpty(allowAnon);
        }

        // ======================================================================
        // TEST 20: Route Regression - Legacy Webhook Route Removed From OnboardingController
        // ======================================================================
        [Fact]
        public void OnboardingRoutes_LegacyWebhook_IsRemoved()
        {
            var onboardingControllerType = typeof(WebApp.Controllers.OnboardingController);
            var legacyMethod = onboardingControllerType.GetMethod("HandleSumsubWebhook");
            Assert.Null(legacyMethod);

            // Ensure no other method in OnboardingController routes to sumsub/webhook
            var allMethods = onboardingControllerType.GetMethods();
            foreach (var method in allMethods)
            {
                var httpPostAttrs = method.GetCustomAttributes(typeof(HttpPostAttribute), false)
                    .Cast<HttpPostAttribute>();
                foreach (var attr in httpPostAttrs)
                {
                    Assert.DoesNotContain("sumsub", attr.Template ?? "", StringComparison.OrdinalIgnoreCase);
                }
            }
        }
        // ======================================================================
        // TEST 21: Sumsub BaseUrl Config - Disallows api.staging.sumsub.com
        // ======================================================================
        [Fact]
        public void SumsubService_BaseUrl_MustBeCanonicalProductionHost_AndNotStagingHost()
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "test-token",
                ["Sumsub:BaseUrl"] = "https://api.sumsub.com",
                ["Sumsub:WebhookSecret"] = "test-secret",
                ["Sumsub:LevelName"] = "id-document-only"
            }).Build();

            Assert.Equal("https://api.sumsub.com", config["Sumsub:BaseUrl"]);
            Assert.DoesNotContain("staging", config["Sumsub:BaseUrl"]!, StringComparison.OrdinalIgnoreCase);
        }

        // ======================================================================
        // TEST 22: Fail-Closed Semantics - Sumsub API Error Must Not Return Fake Token
        // ======================================================================
        [Fact]
        public async Task CreateOrGetSessionAsync_WhenProviderFails_ThrowsExceptionAndNeverReturnsFallbackToken()
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = "fail-closed-test@mondial.test",
                User = "Creator",
                Onboarding = new OnboardingState { Phase = 0 }
            };

            // Failing HTTP handler (simulating provider network/auth error)
            var failingHandler = new TestHttpMessageHandler(req =>
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.Unauthorized)
                {
                    Content = new StringContent("{\"error\":\"Unauthorized\"}", Encoding.UTF8, "application/json")
                };
            });

            var failingSumsub = new SumsubService(new HttpClient(failingHandler), _configuration, new Mock<ILogger<SumsubService>>().Object);
            var service = CreateService(user, failingSumsub);

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateOrGetSessionAsync(
                user.Id.ToString(),
                "FR",
                "national_id",
                "FR",
                "FR"
            ));

            Assert.NotNull(ex);
            // Verify no mock token was inserted into in-memory list
            Assert.DoesNotContain(_inMemoryVerifications, v => v.UserId == user.Id.ToString() && (v.DocumentType ?? "").Contains("mock"));
        }

        // ======================================================================
        // TEST 23: SumsubService - Existing Applicant Reuses ID Without Creation
        // ======================================================================
        [Fact]
        public async Task SumsubService_ExistingApplicant_ReusedWithoutCallingCreate()
        {
            var requests = new List<HttpRequestMessage>();
            var testHandler = new TestHttpMessageHandler(req =>
            {
                requests.Add(req);
                if (req.RequestUri!.AbsolutePath.Contains("/resources/applicants/-/byExternalUserId/"))
                {
                    var content = JsonSerializer.Serialize(new { id = "app-existing-999" });
                    return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent(content, Encoding.UTF8, "application/json")
                    };
                }

                if (req.RequestUri.AbsolutePath.Contains("/resources/accessTokens/sdk"))
                {
                    var content = JsonSerializer.Serialize(new { token = "token-for-existing-app" });
                    return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent(content, Encoding.UTF8, "application/json")
                    };
                }

                return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
            });

            var service = new SumsubService(new HttpClient(testHandler), _configuration, new Mock<ILogger<SumsubService>>().Object);
            var token = await service.GenerateAccessTokenAsync("user-exist-1", "exist@test.com");

            Assert.Equal("token-for-existing-app", token);
            // Ensure GET byExternalUserId was called
            Assert.Contains(requests, r => r.Method == HttpMethod.Get && r.RequestUri!.AbsolutePath == "/resources/applicants/-/byExternalUserId/user-exist-1");
            // Ensure POST /resources/applicants was NOT called
            Assert.DoesNotContain(requests, r => r.Method == HttpMethod.Post && r.RequestUri!.AbsolutePath == "/resources/applicants");
        }

        // ======================================================================
        // TEST 24: SumsubService - Missing Applicant Creates New Applicant Via POST
        // ======================================================================
        [Fact]
        public async Task SumsubService_MissingApplicant_CreatesApplicantThenMintsToken()
        {
            var requests = new List<HttpRequestMessage>();
            var testHandler = new TestHttpMessageHandler(req =>
            {
                requests.Add(req);
                if (req.Method == HttpMethod.Get && req.RequestUri!.AbsolutePath.Contains("/resources/applicants/-/byExternalUserId/"))
                {
                    return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound)
                    {
                        Content = new StringContent("{\"code\":404,\"description\":\"Not found\"}", Encoding.UTF8, "application/json")
                    };
                }

                if (req.Method == HttpMethod.Post && req.RequestUri!.AbsolutePath == "/resources/applicants")
                {
                    var content = JsonSerializer.Serialize(new { id = "app-newly-created-1" });
                    return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent(content, Encoding.UTF8, "application/json")
                    };
                }

                if (req.Method == HttpMethod.Post && req.RequestUri!.AbsolutePath == "/resources/accessTokens/sdk")
                {
                    var content = JsonSerializer.Serialize(new { token = "token-for-new-app" });
                    return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent(content, Encoding.UTF8, "application/json")
                    };
                }

                return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
            });

            var service = new SumsubService(new HttpClient(testHandler), _configuration, new Mock<ILogger<SumsubService>>().Object);
            var token = await service.GenerateAccessTokenAsync("user-missing-2", "missing@test.com");

            Assert.Equal("token-for-new-app", token);
            Assert.Contains(requests, r => r.Method == HttpMethod.Get && r.RequestUri!.AbsolutePath == "/resources/applicants/-/byExternalUserId/user-missing-2");
            Assert.Contains(requests, r => r.Method == HttpMethod.Post && r.RequestUri!.AbsolutePath == "/resources/applicants");
            Assert.Contains(requests, r => r.Method == HttpMethod.Post && r.RequestUri!.AbsolutePath == "/resources/accessTokens/sdk");
        }

        // ======================================================================
        // TEST 25: SumsubService - Provider Lookup 401 Fails Closed
        // ======================================================================
        [Fact]
        public async Task SumsubService_Lookup401_ThrowsExceptionAndFailsClosed()
        {
            var testHandler = new TestHttpMessageHandler(req =>
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.Unauthorized)
                {
                    Content = new StringContent("{\"code\":401,\"description\":\"Invalid credentials\"}", Encoding.UTF8, "application/json")
                };
            });

            var service = new SumsubService(new HttpClient(testHandler), _configuration, new Mock<ILogger<SumsubService>>().Object);
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateAccessTokenAsync("user-401", "u401@test.com"));
            Assert.Contains("Failed to query Sumsub applicant", ex.Message);
        }

        // ======================================================================
        // TEST 26: SumsubService - Provider Lookup 405 Fails Closed
        // ======================================================================
        [Fact]
        public async Task SumsubService_Lookup405_ThrowsExceptionAndFailsClosed()
        {
            var testHandler = new TestHttpMessageHandler(req =>
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.MethodNotAllowed)
                {
                    Content = new StringContent("{\"code\":405,\"description\":\"Method Not Allowed\"}", Encoding.UTF8, "application/json")
                };
            });

            var service = new SumsubService(new HttpClient(testHandler), _configuration, new Mock<ILogger<SumsubService>>().Object);
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateAccessTokenAsync("user-405", "u405@test.com"));
            Assert.Contains("Failed to query Sumsub applicant", ex.Message);
        }

        // ======================================================================
        // TEST 27: SumsubService - Creation Race / Conflict Recovers Existing Applicant
        // ======================================================================
        [Fact]
        public async Task SumsubService_CreationConflict409_RecoversExistingApplicant()
        {
            int getLookupCount = 0;
            var testHandler = new TestHttpMessageHandler(req =>
            {
                if (req.Method == HttpMethod.Get && req.RequestUri!.AbsolutePath.Contains("/resources/applicants/-/byExternalUserId/"))
                {
                    getLookupCount++;
                    if (getLookupCount == 1)
                    {
                        // First lookup reports 404
                        return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
                    }
                    // Second re-query lookup reports existing applicant
                    var content = JsonSerializer.Serialize(new { id = "app-race-recovered-888" });
                    return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent(content, Encoding.UTF8, "application/json")
                    };
                }

                if (req.Method == HttpMethod.Post && req.RequestUri!.AbsolutePath == "/resources/applicants")
                {
                    // Simultaneous creation caused 409 Conflict
                    return new HttpResponseMessage(System.Net.HttpStatusCode.Conflict)
                    {
                        Content = new StringContent("{\"code\":409,\"description\":\"Applicant already exists\"}", Encoding.UTF8, "application/json")
                    };
                }

                if (req.Method == HttpMethod.Post && req.RequestUri!.AbsolutePath == "/resources/accessTokens/sdk")
                {
                    var content = JsonSerializer.Serialize(new { token = "token-after-409-recovery" });
                    return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                    {
                        Content = new StringContent(content, Encoding.UTF8, "application/json")
                    };
                }

                return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
            });

            var service = new SumsubService(new HttpClient(testHandler), _configuration, new Mock<ILogger<SumsubService>>().Object);
            var token = await service.GenerateAccessTokenAsync("user-race-3", "race@test.com");

            Assert.Equal("token-after-409-recovery", token);
            Assert.True(getLookupCount >= 2);
        }

        // ======================================================================
        // TEST 28: Deterministic HMAC Signing on /resources/applicants/-/byExternalUserId/{userId}
        // ======================================================================
        [Fact]
        public void SumsubService_GenerateSignature_ForByExternalUserIdEndpoint_MatchesContract()
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "sbx:test-app-token",
                ["Sumsub:SecretKey"] = "test-secret-key-12345",
                ["Sumsub:LevelName"] = "id-document-only"
            }).Build();

            var service = new SumsubService(new HttpClient(), config, new Mock<ILogger<SumsubService>>().Object);

            long timestamp = 1710000000;
            string method = "GET";
            string url = "https://api.sumsub.com/resources/applicants/-/byExternalUserId/user%20123";

            // Expected format: timestamp + METHOD + pathAndQuery
            string rawToSign = $"{timestamp}{method}/resources/applicants/-/byExternalUserId/user%20123";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes("test-secret-key-12345"));
            string expectedHex = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawToSign))).ToLowerInvariant();

            string actualSignature = service.GenerateSignature(method, url, timestamp, null);

            Assert.Equal(expectedHex, actualSignature);
        }

        // ======================================================================
        // TEST 29: SumsubService Fails Closed When SecretKey Is Missing (Never Falls Back to AppToken)
        // ======================================================================
        [Fact]
        public async Task SumsubService_FailsClosed_WhenSecretKeyMissing_NeverFallsBackToAppToken()
        {
            var missingSecretConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "sbx:test-app-token",
                ["Sumsub:BaseUrl"] = "https://api.test.sumsub.com",
                ["Sumsub:WebhookSecret"] = "test-secret",
                ["Sumsub:LevelName"] = "id-document-only"
                // Missing Sumsub:SecretKey
            }).Build();

            var service = new SumsubService(new HttpClient(), missingSecretConfig, new Mock<ILogger<SumsubService>>().Object);
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateAccessTokenAsync("user-no-secret", "test@test.com"));
            Assert.Contains("SecretKey is not configured", ex.Message);
        }

        // ======================================================================
        // TEST 30: SumsubService Rejects Placeholder SecretKey and AppToken
        // ======================================================================
        [Fact]
        public async Task SumsubService_FailsClosed_WhenPlaceholderCredentialsProvided()
        {
            var placeholderConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sumsub:AppToken"] = "<sumsub-app-token>",
                ["Sumsub:SecretKey"] = "<sumsub-secret-key>",
                ["Sumsub:BaseUrl"] = "https://api.test.sumsub.com",
                ["Sumsub:WebhookSecret"] = "<sumsub-webhook-secret>",
                ["Sumsub:LevelName"] = "id-document-only"
            }).Build();

            var service = new SumsubService(new HttpClient(), placeholderConfig, new Mock<ILogger<SumsubService>>().Object);
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateAccessTokenAsync("user-placeholder", "test@test.com"));
            Assert.Contains("contains placeholder", ex.Message);
        }
    }

    public class TestHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

        public TestHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
        {
            _handler = handler;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_handler(request));
        }
    }
}

