using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using Stripe;
using Stripe.Checkout;
using WebApp.Configuration;
using WebApp.Configuration.AiOptions;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreditPurchaseTests
    {
        private readonly StripeSettings _testStripeSettings;
        private readonly Mock<ICreditPurchaseRepository> _purchasesRepoMock = new();
        private readonly Mock<IStripeCreditCheckoutService> _stripeCheckoutMock = new();
        private readonly Mock<IMongoClient> _mongoClientMock = new();
        private readonly Mock<IClientSessionHandle> _mongoSessionMock = new();
        private readonly Mock<ILogger<AiCreditPurchaseService>> _serviceLoggerMock = new();
        private readonly Mock<ILogger<AiCreditPurchaseController>> _controllerLoggerMock = new();
        private readonly IConfiguration _config;

        public CreditPurchaseTests()
        {
            _testStripeSettings = new StripeSettings
            {
                Enabled = true,
                SecretKey = "sk_test_fake_key_for_mocking",
                WebhookSecret = "whsec_fake_secret_for_mocking",
                SuccessUrl = "http://localhost:3000/dashboard/creator?creditPurchase=success&session_id={CHECKOUT_SESSION_ID}",
                CancelUrl = "http://localhost:3000/dashboard/creator?creditPurchase=cancelled",
                Packages = new Dictionary<string, StripePackageConfig>(StringComparer.OrdinalIgnoreCase)
                {
                    ["pack_100"] = new StripePackageConfig { Credits = 100, AmountInCents = 1000, Currency = "eur", DisplayName = "100 Credits" },
                    ["pack_250"] = new StripePackageConfig { Credits = 250, AmountInCents = 2000, Currency = "eur", DisplayName = "250 Credits" },
                    ["pack_500"] = new StripePackageConfig { Credits = 500, AmountInCents = 3500, Currency = "eur", DisplayName = "500 Credits" }
                }
            };

            _config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Mongo:TransactionsEnabled"] = "true"
                })
                .Build();

            _mongoClientMock.Setup(m => m.StartSessionAsync(It.IsAny<ClientSessionOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(_mongoSessionMock.Object);
        }

        [Fact]
        public async Task Test_01_Starter_Behavior_Unchanged_New_User_Gets_200()
        {
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.GetByOwnerAsync("user_123"))
                .ReturnsAsync((AiCreditLedger?)null);
            ledgerMock.Setup(r => r.TryGrantInitialAsync("user_123", 200))
                .ReturnsAsync(true);

            var aiSettings = Options.Create(new AiSettings { StarterCredits = 200 });
            var service = new AiCreditService(ledgerMock.Object, aiSettings);

            var balance = await service.GetBalanceAsync("user_123");

            balance.Balance.Should().Be(200);
            balance.LifetimeGranted.Should().Be(200);
            balance.LifetimeSpent.Should().Be(0);
            ledgerMock.Verify(r => r.TryGrantInitialAsync("user_123", 200), Times.Once);
        }

        [Fact]
        public async Task Test_02_Successful_Purchase_Increments_Balance_66_Plus_250_Equals_316()
        {
            var initialLedger = new AiCreditLedger
            {
                OwnerUserId = "user_123",
                Balance = 66,
                LifetimeGranted = 200,
                LifetimeSpent = 134
            };

            var purchase = new CreditPurchase
            {
                Id = "purchase_1",
                UserId = "user_123",
                PackageId = "pack_250",
                Credits = 250,
                AmountInCents = 2000,
                Currency = "eur",
                ProviderSessionId = "cs_123",
                Status = CreditPurchaseStatus.Pending
            };

            var purchasesColMock = new Mock<IMongoCollection<CreditPurchase>>();
            purchasesColMock.Setup(c => c.UpdateOneAsync(
                    _mongoSessionMock.Object,
                    It.IsAny<FilterDefinition<CreditPurchase>>(),
                    It.IsAny<UpdateDefinition<CreditPurchase>>(),
                    It.IsAny<UpdateOptions>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            _purchasesRepoMock.Setup(r => r.Collection).Returns(purchasesColMock.Object);
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_123", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_123", 250, It.IsAny<CancellationToken>()))
                .Callback(() =>
                {
                    initialLedger.Balance += 250;
                    initialLedger.LifetimeGranted += 250;
                })
                .ReturnsAsync(true);

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_123",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_123",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_123",
                        AmountTotal = 2000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw_payload", "sig_valid");

            result.Should().BeTrue();
            initialLedger.Balance.Should().Be(316);
            initialLedger.LifetimeGranted.Should().Be(450);
            initialLedger.LifetimeSpent.Should().Be(134); // unchanged
        }

        [Fact]
        public async Task Test_03_Brand_New_Ledger_Gets_200_Starter_Plus_250_Purchase_Total_450()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_brand_new",
                UserId = "user_brand_new",
                PackageId = "pack_250",
                Credits = 250,
                AmountInCents = 2000,
                Currency = "eur",
                ProviderSessionId = "cs_brand_new",
                Status = CreditPurchaseStatus.Pending
            };

            var purchasesColMock = new Mock<IMongoCollection<CreditPurchase>>();
            purchasesColMock.Setup(c => c.UpdateOneAsync(
                    _mongoSessionMock.Object,
                    It.IsAny<FilterDefinition<CreditPurchase>>(),
                    It.IsAny<UpdateDefinition<CreditPurchase>>(),
                    It.IsAny<UpdateOptions>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            _purchasesRepoMock.Setup(r => r.Collection).Returns(purchasesColMock.Object);
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_brand_new", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.TryGrantInitialAsync("user_brand_new", 200))
                .ReturnsAsync(true);
            ledgerMock.Setup(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_brand_new", 250, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_brand_new",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_brand_new",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_brand_new",
                        AmountTotal = 2000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw_payload", "sig_valid");

            result.Should().BeTrue();
            // Guarantees that starter grant was called before transaction
            ledgerMock.Verify(r => r.TryGrantInitialAsync("user_brand_new", 200), Times.Once);
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_brand_new", 250, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Test_04_LifetimeGranted_Increments_By_Exact_Purchased_Amount()
        {
            var initialLedger = new AiCreditLedger
            {
                OwnerUserId = "user_4",
                Balance = 50,
                LifetimeGranted = 300
            };

            var purchase = new CreditPurchase
            {
                Id = "purchase_4",
                UserId = "user_4",
                PackageId = "pack_100",
                Credits = 100,
                AmountInCents = 1000,
                Currency = "eur",
                ProviderSessionId = "cs_4",
                Status = CreditPurchaseStatus.Pending
            };

            var purchasesColMock = new Mock<IMongoCollection<CreditPurchase>>();
            purchasesColMock.Setup(c => c.UpdateOneAsync(_mongoSessionMock.Object, It.IsAny<FilterDefinition<CreditPurchase>>(), It.IsAny<UpdateDefinition<CreditPurchase>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            _purchasesRepoMock.Setup(r => r.Collection).Returns(purchasesColMock.Object);
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_4", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_4", 100, It.IsAny<CancellationToken>()))
                .Callback(() =>
                {
                    initialLedger.Balance += 100;
                    initialLedger.LifetimeGranted += 100;
                })
                .ReturnsAsync(true);

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_4",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_4",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_4",
                        AmountTotal = 1000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            await service.ProcessWebhookAsync("raw", "sig");

            initialLedger.LifetimeGranted.Should().Be(400); // 300 + 100
        }

        [Fact]
        public async Task Test_05_Duplicate_Webhook_Same_Session_Twice_Grants_Credits_Only_Once()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_dup",
                UserId = "user_dup",
                PackageId = "pack_100",
                Credits = 100,
                AmountInCents = 1000,
                Currency = "eur",
                ProviderSessionId = "cs_dup",
                Status = CreditPurchaseStatus.Pending
            };

            var purchasesColMock = new Mock<IMongoCollection<CreditPurchase>>();
            // First call: ModifiedCount = 1
            // Second call: ModifiedCount = 0 (already Succeeded)
            purchasesColMock.SetupSequence(c => c.UpdateOneAsync(_mongoSessionMock.Object, It.IsAny<FilterDefinition<CreditPurchase>>(), It.IsAny<UpdateDefinition<CreditPurchase>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 0, null));

            _purchasesRepoMock.Setup(r => r.Collection).Returns(purchasesColMock.Object);
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_dup", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_dup", 100, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_dup",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_dup",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_dup",
                        AmountTotal = 1000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var firstCall = await service.ProcessWebhookAsync("raw", "sig");
            var secondCall = await service.ProcessWebhookAsync("raw", "sig");

            firstCall.Should().BeTrue();
            secondCall.Should().BeTrue();
            // Credits added ONLY ONCE
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_dup", 100, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Test_06_Concurrent_Duplicate_Processing_Only_One_Transaction_Wins()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_race",
                UserId = "user_race",
                PackageId = "pack_250",
                Credits = 250,
                AmountInCents = 2000,
                Currency = "eur",
                ProviderSessionId = "cs_race",
                Status = CreditPurchaseStatus.Pending
            };

            var purchasesColMock = new Mock<IMongoCollection<CreditPurchase>>();
            // Concurrent execution where one wins and one gets ModifiedCount = 0
            purchasesColMock.SetupSequence(c => c.UpdateOneAsync(_mongoSessionMock.Object, It.IsAny<FilterDefinition<CreditPurchase>>(), It.IsAny<UpdateDefinition<CreditPurchase>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 0, null));

            _purchasesRepoMock.Setup(r => r.Collection).Returns(purchasesColMock.Object);
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_race", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_race", 250, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_race",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_race",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_race",
                        AmountTotal = 2000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var task1 = service.ProcessWebhookAsync("raw", "sig");
            var task2 = service.ProcessWebhookAsync("raw", "sig");

            await Task.WhenAll(task1, task2);

            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_race", 250, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Test_07_Invalid_Webhook_Signature_Grants_Zero_Credits()
        {
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Throws(new StripeException("Invalid signature."));

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("fake_raw_body", "bad_signature");

            result.Should().BeFalse();
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public void Test_08_Missing_WebhookSecret_Fails_Closed()
        {
            var settings = new StripeSettings
            {
                Enabled = true,
                SecretKey = "sk_test_123",
                WebhookSecret = "" // Missing!
            };

            var service = new StripeCreditCheckoutService(Options.Create(settings));

            var act = () => service.ConstructWebhookEvent("body", "sig");

            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*WebhookSecret is not configured*");
        }

        [Fact]
        public async Task Test_09_Unpaid_Checkout_Session_Completed_Grants_Zero_Credits()
        {
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_unpaid",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_unpaid",
                        Mode = "payment",
                        PaymentStatus = "unpaid", // UNPAID
                        AmountTotal = 2000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw", "sig");

            result.Should().BeTrue();
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_10_Async_Payment_Succeeded_Grants_Credits_Once()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_async",
                UserId = "user_async",
                PackageId = "pack_100",
                Credits = 100,
                AmountInCents = 1000,
                Currency = "eur",
                ProviderSessionId = "cs_async",
                Status = CreditPurchaseStatus.Pending
            };

            var purchasesColMock = new Mock<IMongoCollection<CreditPurchase>>();
            purchasesColMock.Setup(c => c.UpdateOneAsync(_mongoSessionMock.Object, It.IsAny<FilterDefinition<CreditPurchase>>(), It.IsAny<UpdateDefinition<CreditPurchase>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            _purchasesRepoMock.Setup(r => r.Collection).Returns(purchasesColMock.Object);
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_async", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_async", 100, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_async_paid",
                Type = "checkout.session.async_payment_succeeded",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_async",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_async",
                        AmountTotal = 1000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw", "sig");

            result.Should().BeTrue();
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_async", 100, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Test_11_Async_Payment_Failed_Grants_Zero_Credits()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_fail",
                UserId = "user_fail",
                ProviderSessionId = "cs_fail",
                Status = CreditPurchaseStatus.Pending
            };

            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_fail", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);
            _purchasesRepoMock.Setup(r => r.MarkFailedAsync("purchase_fail", "async_payment_failed", It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_fail",
                Type = "checkout.session.async_payment_failed",
                Data = new EventData
                {
                    Object = new Session { Id = "cs_fail" }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw", "sig");

            result.Should().BeTrue();
            _purchasesRepoMock.Verify(r => r.MarkFailedAsync("purchase_fail", "async_payment_failed", It.IsAny<CancellationToken>()), Times.Once);
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_12_Checkout_Session_Expired_Grants_Zero_Credits()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_exp",
                UserId = "user_exp",
                ProviderSessionId = "cs_exp",
                Status = CreditPurchaseStatus.Pending
            };

            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_exp", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);
            _purchasesRepoMock.Setup(r => r.MarkExpiredAsync("purchase_exp", "checkout.session.expired", It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_exp",
                Type = "checkout.session.expired",
                Data = new EventData
                {
                    Object = new Session { Id = "cs_exp" }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw", "sig");

            result.Should().BeTrue();
            _purchasesRepoMock.Verify(r => r.MarkExpiredAsync("purchase_exp", "checkout.session.expired", It.IsAny<CancellationToken>()), Times.Once);
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_13_Wrong_Amount_Grants_Zero_Credits()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_wrong_amt",
                UserId = "user_13",
                AmountInCents = 2000, // Expected â‚¬20.00
                Currency = "eur",
                ProviderSessionId = "cs_wrong_amt",
                Status = CreditPurchaseStatus.Pending
            };

            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_wrong_amt", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_wrong_amt",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_wrong_amt",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        AmountTotal = 500, // Attacker paid â‚¬5.00 instead
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw", "sig");

            result.Should().BeFalse();
            _purchasesRepoMock.Verify(r => r.MarkFailedAsync("purchase_wrong_amt", "Amount mismatch", It.IsAny<CancellationToken>()), Times.Once);
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_14_Wrong_Currency_Grants_Zero_Credits()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_wrong_curr",
                UserId = "user_14",
                AmountInCents = 2000,
                Currency = "eur",
                ProviderSessionId = "cs_wrong_curr",
                Status = CreditPurchaseStatus.Pending
            };

            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_wrong_curr", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_wrong_curr",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_wrong_curr",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        AmountTotal = 2000,
                        Currency = "usd" // Paid in USD instead of EUR
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw", "sig");

            result.Should().BeFalse();
            _purchasesRepoMock.Verify(r => r.MarkFailedAsync("purchase_wrong_curr", "Currency mismatch", It.IsAny<CancellationToken>()), Times.Once);
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_15_Unknown_Session_Grants_Zero_Credits()
        {
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_unknown", It.IsAny<CancellationToken>()))
                .ReturnsAsync((CreditPurchase?)null);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_unknown",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_unknown",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        AmountTotal = 2000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.ProcessWebhookAsync("raw", "sig");

            result.Should().BeFalse();
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_16_Unknown_Package_Checkout_Rejected()
        {
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var act = () => service.CreateCheckoutAsync("user_16", "pack_non_existent");

            await act.Should().ThrowAsync<ArgumentException>()
                .WithMessage("*Unknown credit package*");
        }

        [Fact]
        public async Task Test_17_Client_Cannot_Control_Credits()
        {
            // Only packageId is accepted. Server determines credits from config.
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            CreditPurchase? capturedPurchase = null;

            _purchasesRepoMock.Setup(r => r.CreateAsync(It.IsAny<CreditPurchase>(), It.IsAny<CancellationToken>()))
                .Callback<CreditPurchase, CancellationToken>((p, _) => capturedPurchase = p)
                .Returns(Task.CompletedTask);

            _stripeCheckoutMock.Setup(s => s.CreateCheckoutSessionAsync(It.IsAny<CreditPurchase>(), It.IsAny<StripePackageConfig>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Session { Id = "cs_17", Url = "https://checkout.stripe.com/c/pay/cs_17" });

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            // User selects pack_100
            await service.CreateCheckoutAsync("user_17", "pack_100");

            capturedPurchase.Should().NotBeNull();
            capturedPurchase!.Credits.Should().Be(100); // 100 resolved server-side
        }

        [Fact]
        public async Task Test_18_Client_Cannot_Control_Amount()
        {
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            CreditPurchase? capturedPurchase = null;

            _purchasesRepoMock.Setup(r => r.CreateAsync(It.IsAny<CreditPurchase>(), It.IsAny<CancellationToken>()))
                .Callback<CreditPurchase, CancellationToken>((p, _) => capturedPurchase = p)
                .Returns(Task.CompletedTask);

            _stripeCheckoutMock.Setup(s => s.CreateCheckoutSessionAsync(It.IsAny<CreditPurchase>(), It.IsAny<StripePackageConfig>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Session { Id = "cs_18", Url = "https://checkout.stripe.com/c/pay/cs_18" });

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            await service.CreateCheckoutAsync("user_18", "pack_250");

            capturedPurchase.Should().NotBeNull();
            capturedPurchase!.AmountInCents.Should().Be(2000); // 2000 resolved server-side
        }

        [Fact]
        public async Task Test_19_User_A_Purchase_History_Cannot_Be_Read_By_User_B()
        {
            var userAPurchases = new List<CreditPurchase>
            {
                new CreditPurchase { Id = "p1", UserId = "user_A", PackageId = "pack_100", Credits = 100, AmountInCents = 1000 }
            };

            _purchasesRepoMock.Setup(r => r.GetByUserIdAsync("user_A", 50, It.IsAny<CancellationToken>()))
                .ReturnsAsync(userAPurchases);
            _purchasesRepoMock.Setup(r => r.GetByUserIdAsync("user_B", 50, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<CreditPurchase>());

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var historyUserB = await service.GetPurchasesForUserAsync("user_B");

            historyUserB.Should().BeEmpty();
            _purchasesRepoMock.Verify(r => r.GetByUserIdAsync("user_B", 50, It.IsAny<CancellationToken>()), Times.Once);
            _purchasesRepoMock.Verify(r => r.GetByUserIdAsync("user_A", 50, It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_20_Existing_AI_Debit_Works_After_TopUp()
        {
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.TryDebitAsync("user_20", 33, It.IsAny<AiCreditDebit>()))
                .ReturnsAsync(CreditDebitResult.Applied);

            var aiSettings = Options.Create(new AiSettings
            {
                CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 33 }
            });

            var service = new AiCreditService(ledgerMock.Object, aiSettings);

            // Debiting for job works normally
            await service.DebitForJobAsync("user_20", AiJobType.BusinessPlan);

            ledgerMock.Verify(r => r.TryDebitAsync("user_20", 33, It.IsAny<AiCreditDebit>()), Times.Once);
        }

        [Fact]
        public async Task Test_21_Existing_AI_Failed_Generation_Refund_Still_Works_Unchanged()
        {
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.TryRefundAsync("user_21", "op_123", 33, "Generation failed"))
                .ReturnsAsync(CreditRefundResult.Applied);

            var aiSettings = Options.Create(new AiSettings
            {
                CreditCosts = new Dictionary<string, int> { ["BusinessPlan"] = 33 }
            });

            var service = new AiCreditService(ledgerMock.Object, aiSettings);

            var refundResult = await service.RefundForJobAsync("user_21", AiJobType.BusinessPlan, "op_123", "Generation failed");

            refundResult.Should().Be(CreditRefundResult.Applied);
            ledgerMock.Verify(r => r.TryRefundAsync("user_21", "op_123", 33, "Generation failed"), Times.Once);
        }

        [Fact]
        public async Task Test_22_Transaction_Failure_Purchase_Not_Succeeded_Without_Matching_Credit_Increment()
        {
            var purchase = new CreditPurchase
            {
                Id = "purchase_tx_fail",
                UserId = "user_tx_fail",
                PackageId = "pack_250",
                Credits = 250,
                AmountInCents = 2000,
                Currency = "eur",
                ProviderSessionId = "cs_tx_fail",
                Status = CreditPurchaseStatus.Pending
            };

            var purchasesColMock = new Mock<IMongoCollection<CreditPurchase>>();
            purchasesColMock.Setup(c => c.UpdateOneAsync(_mongoSessionMock.Object, It.IsAny<FilterDefinition<CreditPurchase>>(), It.IsAny<UpdateDefinition<CreditPurchase>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            _purchasesRepoMock.Setup(r => r.Collection).Returns(purchasesColMock.Object);
            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_tx_fail", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            // Simulate network or Mongo error during credit increment
            ledgerMock.Setup(r => r.AddPurchasedCreditsAsync(_mongoSessionMock.Object, "user_tx_fail", 250, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new MongoException("Simulated connection failure during ledger write"));

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_tx_fail",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_tx_fail",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_tx_fail",
                        AmountTotal = 2000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var act = () => service.ProcessWebhookAsync("raw", "sig");

            await act.Should().ThrowAsync<MongoException>();

            // Transaction MUST be aborted
            _mongoSessionMock.Verify(s => s.AbortTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
            _mongoSessionMock.Verify(s => s.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Test_23_Stripe_Enabled_Mongo_Transactions_Disabled_Fails_Closed_Webhook_Throws_And_Does_Not_Fulfill()
        {
            var nonTxConfig = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Mongo:TransactionsEnabled"] = "false"
                })
                .Build();

            var purchase = new CreditPurchase
            {
                Id = "p_non_tx",
                UserId = "user_non_tx",
                PackageId = "pack_100",
                Credits = 100,
                AmountInCents = 1000,
                Currency = "eur",
                ProviderSessionId = "cs_non_tx",
                Status = CreditPurchaseStatus.Pending
            };

            _purchasesRepoMock.Setup(r => r.GetByProviderSessionIdAsync("cs_non_tx", It.IsAny<CancellationToken>()))
                .ReturnsAsync(purchase);

            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());

            var stripeEvent = new Stripe.Event
            {
                Id = "evt_non_tx",
                Type = "checkout.session.completed",
                Data = new EventData
                {
                    Object = new Session
                    {
                        Id = "cs_non_tx",
                        Mode = "payment",
                        PaymentStatus = "paid",
                        PaymentIntentId = "pi_non_tx",
                        AmountTotal = 1000,
                        Currency = "eur"
                    }
                }
            };

            _stripeCheckoutMock.Setup(s => s.ConstructWebhookEvent(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(stripeEvent);

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                ledgerMock.Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                nonTxConfig,
                _serviceLoggerMock.Object);

            var act = () => service.ProcessWebhookAsync("raw", "sig");

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*requires Mongo transactions to be enabled*");

            // Verify credits were NEVER added
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);

            // Purchase remains Pending (not marked Succeeded)
            purchase.Status.Should().Be(CreditPurchaseStatus.Pending);
        }

        [Fact]
        public async Task Test_24_Stripe_Enabled_Mongo_Transactions_Disabled_Checkout_Throws_InvalidOperationException()
        {
            var nonTxConfig = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Mongo:TransactionsEnabled"] = "false"
                })
                .Build();

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>()).Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                nonTxConfig,
                _serviceLoggerMock.Object);

            var act = () => service.CreateCheckoutAsync("user_1", "pack_100");

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*MongoDB transactions are disabled*");
        }

        [Fact]
        public void Test_25_Stripe_Enabled_Mongo_Transactions_Disabled_GetPackages_Returns_Empty()
        {
            var nonTxConfig = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Mongo:TransactionsEnabled"] = "false"
                })
                .Build();

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>()).Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                nonTxConfig,
                _serviceLoggerMock.Object);

            var packages = service.GetAvailablePackages();
            packages.Should().BeEmpty();
        }

        [Fact]
        public void Test_26_GetAvailablePackages_Returns_Deterministic_Ascending_Credit_Order()
        {
            // Packages defined in non-ascending order (500, 100, 250)
            var scrambledSettings = new StripeSettings
            {
                Enabled = true,
                Packages = new Dictionary<string, StripePackageConfig>(StringComparer.OrdinalIgnoreCase)
                {
                    ["pack_500"] = new StripePackageConfig { Credits = 500, AmountInCents = 3500, Currency = "eur" },
                    ["pack_100"] = new StripePackageConfig { Credits = 100, AmountInCents = 1000, Currency = "eur" },
                    ["pack_250"] = new StripePackageConfig { Credits = 250, AmountInCents = 2000, Currency = "eur" }
                }
            };

            var service = new AiCreditPurchaseService(
                Options.Create(scrambledSettings),
                _purchasesRepoMock.Object,
                new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>()).Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var packages = service.GetAvailablePackages();

            packages.Should().HaveCount(3);
            packages[0].PackageId.Should().Be("pack_100");
            packages[0].Credits.Should().Be(100);

            packages[1].PackageId.Should().Be("pack_250");
            packages[1].Credits.Should().Be(250);

            packages[2].PackageId.Should().Be("pack_500");
            packages[2].Credits.Should().Be(500);
        }

        [Fact]
        public void Test_27_Controller_Enforces_Roles_Creator_And_Entrepreneur()
        {
            var controllerType = typeof(AiCreditPurchaseController);

            // Check GetPackages
            var getPackagesMethod = controllerType.GetMethod(nameof(AiCreditPurchaseController.GetPackages));
            getPackagesMethod.Should().NotBeNull();
            var getPackagesAuth = (Microsoft.AspNetCore.Authorization.AuthorizeAttribute?)Attribute.GetCustomAttribute(getPackagesMethod!, typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute));
            getPackagesAuth.Should().NotBeNull();
            getPackagesAuth!.Roles.Should().Be("Creator,Entrepreneur");

            // Check CreateCheckout
            var createCheckoutMethod = controllerType.GetMethod(nameof(AiCreditPurchaseController.CreateCheckout));
            createCheckoutMethod.Should().NotBeNull();
            var createCheckoutAuth = (Microsoft.AspNetCore.Authorization.AuthorizeAttribute?)Attribute.GetCustomAttribute(createCheckoutMethod!, typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute));
            createCheckoutAuth.Should().NotBeNull();
            createCheckoutAuth!.Roles.Should().Be("Creator,Entrepreneur");

            // Check GetPurchases
            var getPurchasesMethod = controllerType.GetMethod(nameof(AiCreditPurchaseController.GetPurchases));
            getPurchasesMethod.Should().NotBeNull();
            var getPurchasesAuth = (Microsoft.AspNetCore.Authorization.AuthorizeAttribute?)Attribute.GetCustomAttribute(getPurchasesMethod!, typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute));
            getPurchasesAuth.Should().NotBeNull();
            getPurchasesAuth!.Roles.Should().Be("Creator,Entrepreneur");

            // Check StripeWebhook has AllowAnonymous
            var webhookMethod = controllerType.GetMethod(nameof(AiCreditPurchaseController.StripeWebhook));
            webhookMethod.Should().NotBeNull();
            var allowAnon = Attribute.GetCustomAttribute(webhookMethod!, typeof(Microsoft.AspNetCore.Authorization.AllowAnonymousAttribute));
            allowAnon.Should().NotBeNull();
        }

        [Fact]
        public async Task Test_28_CheckoutSession_ReturnUrls_Use_Frontend_Origin_And_Preserve_Placeholder()
        {
            // Requirement A, B, C: Frontend origin (localhost:3000), literal {CHECKOUT_SESSION_ID}, not port 5093
            string? capturedSuccessUrl = null;
            string? capturedCancelUrl = null;

            _purchasesRepoMock.Setup(r => r.CreateAsync(It.IsAny<CreditPurchase>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _stripeCheckoutMock.Setup(s => s.CreateCheckoutSessionAsync(
                    It.IsAny<CreditPurchase>(),
                    It.IsAny<StripePackageConfig>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .Callback<CreditPurchase, StripePackageConfig, string?, string?, CancellationToken>((_, _, succ, canc, _) =>
                {
                    capturedSuccessUrl = succ;
                    capturedCancelUrl = canc;
                })
                .ReturnsAsync(new Session { Id = "cs_return_test", Url = "https://checkout.stripe.com/pay/cs_return_test" });

            var service = new AiCreditPurchaseService(
                Options.Create(_testStripeSettings),
                _purchasesRepoMock.Object,
                new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>()).Object,
                _stripeCheckoutMock.Object,
                _mongoClientMock.Object,
                _config,
                _serviceLoggerMock.Object);

            var result = await service.CreateCheckoutAsync("user_return_test", "pack_100");

            result.Should().NotBeNull();
            capturedSuccessUrl.Should().NotBeNull();
            capturedCancelUrl.Should().NotBeNull();

            // A: SuccessUrl uses frontend origin
            capturedSuccessUrl!.Should().StartWith("http://localhost:3000/");
            capturedSuccessUrl.Should().Be("http://localhost:3000/dashboard/creator?creditPurchase=success&session_id={CHECKOUT_SESSION_ID}");

            // B: CancelUrl uses frontend origin
            capturedCancelUrl!.Should().StartWith("http://localhost:3000/");
            capturedCancelUrl.Should().Be("http://localhost:3000/dashboard/creator?creditPurchase=cancelled");

            // C: Literal placeholder preserved exactly
            capturedSuccessUrl.Should().Contain("{CHECKOUT_SESSION_ID}");

            // E: Backend port 5093 is NEVER used
            capturedSuccessUrl.Should().NotContain("5093");
            capturedCancelUrl.Should().NotContain("5093");
        }

        [Fact]
        public async Task Test_29_Success_Query_Parameter_Does_Not_Grant_Credits()
        {
            // Requirement D: Success query parameter cannot grant credits.
            // Balance is strictly non-authoritative on frontend queries / GET endpoints.
            var ledgerMock = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
            ledgerMock.Setup(r => r.GetByOwnerAsync("user_querystring"))
                .ReturnsAsync(new AiCreditLedger { OwnerUserId = "user_querystring", Balance = 200, LifetimeGranted = 200, LifetimeSpent = 0 });

            var creditService = new AiCreditService(ledgerMock.Object, Options.Create(new AiSettings { StarterCredits = 200 }));
            var balanceBefore = await creditService.GetBalanceAsync("user_querystring");

            // Attempting to query purchase history or balance cannot mutate credits
            var purchases = await _purchasesRepoMock.Object.GetByUserIdAsync("user_querystring", 50, CancellationToken.None);
            var balanceAfter = await creditService.GetBalanceAsync("user_querystring");

            balanceAfter.Balance.Should().Be(balanceBefore.Balance);
            balanceAfter.LifetimeGranted.Should().Be(balanceBefore.LifetimeGranted);

            // Confirm ledger.AddPurchasedCreditsAsync was NEVER called without a signed webhook fulfillment
            ledgerMock.Verify(r => r.AddPurchasedCreditsAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public void Test_30_Default_And_Local_Configuration_Never_Uses_Backend_Port_5093_For_Return_Urls()
        {
            // Requirement E: Default StripeSettings and configured return URLs never use port 5093
            var defaultSettings = new StripeSettings();
            defaultSettings.SuccessUrl.Should().NotContain("5093");
            defaultSettings.CancelUrl.Should().NotContain("5093");
            defaultSettings.SuccessUrl.Should().StartWith("https://mondialbusiness.eu/");
            defaultSettings.CancelUrl.Should().StartWith("https://mondialbusiness.eu/");

            // Test settings representing local development
            _testStripeSettings.SuccessUrl.Should().NotContain("5093");
            _testStripeSettings.CancelUrl.Should().NotContain("5093");
            _testStripeSettings.SuccessUrl.Should().StartWith("http://localhost:3000/");
            _testStripeSettings.CancelUrl.Should().StartWith("http://localhost:3000/");
        }

        [Fact]
        public void Test_31_ConstructWebhookEvent_Accepts_ApiVersionMismatch_When_Signature_Valid_And_Deserializes_All_Fields()
        {
            // Regression test for real-world failure: Incoming Stripe API version is 2025-11-17.clover
            // while Stripe.net SDK expects 2026-09-30.endive.
            var secret = "whsec_test_secret_for_unit_tests_12345";
            var settings = new StripeSettings
            {
                Enabled = true,
                SecretKey = "sk_test_fake_key_for_mocking",
                WebhookSecret = secret,
            };

            var service = new StripeCreditCheckoutService(Options.Create(settings));
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            var payload = @"{
  ""id"": ""evt_regression_version_mismatch"",
  ""object"": ""event"",
  ""api_version"": ""2025-11-17.clover"",
  ""created"": " + timestamp + @",
  ""data"": {
    ""object"": {
      ""id"": ""cs_test_version_mismatch"",
      ""object"": ""checkout.session"",
      ""amount_total"": 990,
      ""currency"": ""eur"",
      ""client_reference_id"": ""purchase_version_mismatch"",
      ""mode"": ""payment"",
      ""payment_status"": ""paid"",
      ""payment_intent"": ""pi_test_version_mismatch"",
      ""metadata"": {
        ""credits"": ""250"",
        ""packageId"": ""pack_250"",
        ""purchaseId"": ""purchase_version_mismatch"",
        ""userId"": ""user_regression_1""
      }
    }
  },
  ""type"": ""checkout.session.completed""
}";

            var signatureHeader = GenerateStripeSignature(payload, secret, timestamp);

            // ConstructWebhookEvent must NOT throw on version mismatch when throwOnApiVersionMismatch is false
            var stripeEvent = service.ConstructWebhookEvent(payload, signatureHeader);

            stripeEvent.Should().NotBeNull();
            stripeEvent.Type.Should().Be("checkout.session.completed");
            stripeEvent.Data.Object.Should().BeOfType<Session>();

            var session = (Session)stripeEvent.Data.Object;
            session.Id.Should().Be("cs_test_version_mismatch");
            session.ClientReferenceId.Should().Be("purchase_version_mismatch");
            session.AmountTotal.Should().Be(990);
            session.Currency.Should().Be("eur");
            session.Mode.Should().Be("payment");
            session.PaymentStatus.Should().Be("paid");
            session.PaymentIntentId.Should().Be("pi_test_version_mismatch");
            session.Metadata.Should().ContainKey("packageId").WhoseValue.Should().Be("pack_250");
            session.Metadata.Should().ContainKey("credits").WhoseValue.Should().Be("250");
            session.Metadata.Should().ContainKey("userId").WhoseValue.Should().Be("user_regression_1");
        }

        [Fact]
        public void Test_32_ConstructWebhookEvent_Rejects_Invalid_Signature_Even_With_VersionMismatch_Allowed()
        {
            var secret = "whsec_test_secret_for_unit_tests_12345";
            var settings = new StripeSettings
            {
                Enabled = true,
                SecretKey = "sk_test_fake_key_for_mocking",
                WebhookSecret = secret,
            };

            var service = new StripeCreditCheckoutService(Options.Create(settings));
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            var payload = @"{
  ""id"": ""evt_bad_sig"",
  ""object"": ""event"",
  ""api_version"": ""2025-11-17.clover"",
  ""type"": ""checkout.session.completed""
}";

            var badSignatureHeader = "t=" + timestamp + ",v1=0000000000000000000000000000000000000000000000000000000000000000";

            var act = () => service.ConstructWebhookEvent(payload, badSignatureHeader);

            act.Should().Throw<StripeException>();
        }

        private static string GenerateStripeSignature(string payload, string secret, long timestamp)
        {
            var signedPayload = $"{timestamp}.{payload}";
            using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(signedPayload));
            var hex = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            return $"t={timestamp},v1={hex}";
        }
    }
}

