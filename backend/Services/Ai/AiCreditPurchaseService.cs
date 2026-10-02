using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Stripe.Checkout;
using WebApp.Configuration;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai
{
    public interface IAiCreditPurchaseService
    {
        List<CreditPackageDto> GetAvailablePackages();
        Task<CheckoutSessionResponseDto> CreateCheckoutAsync(string userId, string packageId, string? baseUrl = null, CancellationToken ct = default);
        Task<List<CreditPurchaseHistoryDto>> GetPurchasesForUserAsync(string userId, CancellationToken ct = default);
        Task<bool> ProcessWebhookAsync(string rawBody, string signatureHeader, CancellationToken ct = default);
    }

    public class AiCreditPurchaseService : IAiCreditPurchaseService
    {
        private readonly StripeSettings _stripeSettings;
        private readonly ICreditPurchaseRepository _purchasesRepo;
        private readonly AiCreditLedgerRepository _creditsRepo;
        private readonly IStripeCreditCheckoutService _stripeCheckout;
        private readonly IMongoClient _mongoClient;
        private readonly ILogger<AiCreditPurchaseService> _logger;
        private readonly bool _transactionsEnabled;

        public AiCreditPurchaseService(
            IOptions<StripeSettings> stripeSettings,
            ICreditPurchaseRepository purchasesRepo,
            AiCreditLedgerRepository creditsRepo,
            IStripeCreditCheckoutService stripeCheckout,
            IMongoClient mongoClient,
            IConfiguration config,
            ILogger<AiCreditPurchaseService> logger)
        {
            _stripeSettings = stripeSettings.Value;
            _purchasesRepo = purchasesRepo;
            _creditsRepo = creditsRepo;
            _stripeCheckout = stripeCheckout;
            _mongoClient = mongoClient;
            _logger = logger;
            _transactionsEnabled = config.GetValue("Mongo:TransactionsEnabled", true);

            if (_stripeSettings.Enabled && !_transactionsEnabled)
            {
                _logger.LogCritical("CRITICAL CONFIGURATION ERROR: Stripe credit purchasing is enabled (Stripe:Enabled=true), but MongoDB transactions are disabled (Mongo:TransactionsEnabled=false). Credit purchasing will fail closed to prevent non-transactional payment fulfillment.");
            }
        }

        public List<CreditPackageDto> GetAvailablePackages()
        {
            if (!_stripeSettings.Enabled || !_transactionsEnabled)
                return new List<CreditPackageDto>();

            var list = new List<CreditPackageDto>();
            foreach (var kvp in _stripeSettings.Packages)
            {
                var pkg = kvp.Value;
                // Package must have a valid positive amount configured to be purchasable
                if (pkg.AmountInCents.HasValue && pkg.AmountInCents.Value > 0 && pkg.Credits > 0)
                {
                    list.Add(new CreditPackageDto
                    {
                        PackageId = kvp.Key,
                        Credits = pkg.Credits,
                        AmountInCents = pkg.AmountInCents.Value,
                        Currency = pkg.Currency.ToLowerInvariant(),
                        DisplayName = !string.IsNullOrWhiteSpace(pkg.DisplayName) ? pkg.DisplayName : $"{pkg.Credits} AI Credits"
                    });
                }
            }

            return list.OrderBy(p => p.Credits).ToList();
        }

        public async Task<CheckoutSessionResponseDto> CreateCheckoutAsync(
            string userId,
            string packageId,
            string? baseUrl = null,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID is required.", nameof(userId));

            if (string.IsNullOrWhiteSpace(packageId))
                throw new ArgumentException("Package ID is required.", nameof(packageId));

            if (!_stripeSettings.Enabled)
                throw new InvalidOperationException("AI Credit purchasing is currently disabled.");

            if (!_transactionsEnabled)
                throw new InvalidOperationException("AI Credit purchasing cannot initialize checkouts because MongoDB transactions are disabled (Mongo:TransactionsEnabled is false).");

            if (string.IsNullOrWhiteSpace(_stripeSettings.SecretKey))
                throw new InvalidOperationException("Stripe SecretKey is not configured.");

            if (!_stripeSettings.Packages.TryGetValue(packageId, out var packageConfig))
                throw new ArgumentException($"Unknown credit package '{packageId}'.", nameof(packageId));

            if (!packageConfig.AmountInCents.HasValue || packageConfig.AmountInCents.Value <= 0)
                throw new InvalidOperationException($"Package '{packageId}' price is not configured or disabled.");

            var purchase = new CreditPurchase
            {
                UserId = userId,
                PackageId = packageId,
                Credits = packageConfig.Credits,
                AmountInCents = packageConfig.AmountInCents.Value,
                Currency = packageConfig.Currency.ToLowerInvariant(),
                Provider = "stripe",
                Status = CreditPurchaseStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _purchasesRepo.CreateAsync(purchase, ct);

            string successUrl = _stripeSettings.SuccessUrl;
            string cancelUrl = _stripeSettings.CancelUrl;

            try
            {
                var session = await _stripeCheckout.CreateCheckoutSessionAsync(
                    purchase,
                    packageConfig,
                    successUrl,
                    cancelUrl,
                    ct);

                await _purchasesRepo.UpdateSessionIdAsync(purchase.Id, session.Id, ct);

                return new CheckoutSessionResponseDto
                {
                    CheckoutUrl = session.Url,
                    SessionId = session.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create Stripe Checkout Session for purchase {PurchaseId}.", purchase.Id);
                await _purchasesRepo.MarkFailedAsync(purchase.Id, ex.Message, ct);
                throw;
            }
        }

        public async Task<List<CreditPurchaseHistoryDto>> GetPurchasesForUserAsync(string userId, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return new List<CreditPurchaseHistoryDto>();

            var purchases = await _purchasesRepo.GetByUserIdAsync(userId, 50, ct);
            return purchases.Select(p => new CreditPurchaseHistoryDto
            {
                PurchaseId = p.Id,
                PackageId = p.PackageId,
                Credits = p.Credits,
                AmountInCents = p.AmountInCents,
                Currency = p.Currency,
                Status = p.Status.ToString().ToLowerInvariant(),
                CreatedAt = p.CreatedAt,
                CompletedAt = p.CompletedAt
            }).ToList();
        }

        public async Task<bool> ProcessWebhookAsync(string rawBody, string signatureHeader, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(rawBody) || string.IsNullOrWhiteSpace(signatureHeader))
            {
                _logger.LogWarning("Stripe webhook received with empty body or signature.");
                return false;
            }

            Stripe.Event stripeEvent;
            try
            {
                stripeEvent = _stripeCheckout.ConstructWebhookEvent(rawBody, signatureHeader);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Stripe webhook signature validation failed.");
                return false;
            }

            _logger.LogInformation("Processing Stripe webhook event: {EventType} ({EventId})", stripeEvent.Type, stripeEvent.Id);

            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                case "checkout.session.async_payment_succeeded":
                {
                    if (stripeEvent.Data.Object is Session session)
                    {
                        if (session.Mode != "payment")
                        {
                            _logger.LogInformation("Ignoring non-payment session {SessionId}.", session.Id);
                            return true;
                        }

                        // Only fulfill if payment has actually been paid
                        if (string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
                        {
                            return await FulfillPurchaseAsync(session, stripeEvent.Id, ct);
                        }
                        else
                        {
                            _logger.LogInformation("Session {SessionId} completed but payment status is '{PaymentStatus}'. Awaiting async settlement.", session.Id, session.PaymentStatus);
                            return true;
                        }
                    }
                    break;
                }

                case "checkout.session.async_payment_failed":
                {
                    if (stripeEvent.Data.Object is Session session)
                    {
                        var purchase = await FindPurchaseForSessionAsync(session, ct);
                        if (purchase != null)
                        {
                            await _purchasesRepo.MarkFailedAsync(purchase.Id, "async_payment_failed", ct);
                            _logger.LogWarning("Marked purchase {PurchaseId} failed due to async payment failure.", purchase.Id);
                        }
                        return true;
                    }
                    break;
                }

                case "checkout.session.expired":
                {
                    if (stripeEvent.Data.Object is Session session)
                    {
                        var purchase = await FindPurchaseForSessionAsync(session, ct);
                        if (purchase != null)
                        {
                            await _purchasesRepo.MarkExpiredAsync(purchase.Id, "checkout.session.expired", ct);
                            _logger.LogInformation("Marked purchase {PurchaseId} expired.", purchase.Id);
                        }
                        return true;
                    }
                    break;
                }
            }

            return true;
        }

        private async Task<CreditPurchase?> FindPurchaseForSessionAsync(Session session, CancellationToken ct)
        {
            if (!string.IsNullOrWhiteSpace(session.Id))
            {
                var purchase = await _purchasesRepo.GetByProviderSessionIdAsync(session.Id, ct);
                if (purchase != null) return purchase;
            }

            if (!string.IsNullOrWhiteSpace(session.ClientReferenceId))
            {
                var purchase = await _purchasesRepo.GetByIdAsync(session.ClientReferenceId, ct);
                if (purchase != null) return purchase;
            }

            if (session.Metadata != null && session.Metadata.TryGetValue("purchaseId", out var purchaseId) && !string.IsNullOrWhiteSpace(purchaseId))
            {
                return await _purchasesRepo.GetByIdAsync(purchaseId, ct);
            }

            return null;
        }

        private async Task<bool> FulfillPurchaseAsync(Session session, string eventId, CancellationToken ct)
        {
            var purchase = await FindPurchaseForSessionAsync(session, ct);
            if (purchase == null)
            {
                _logger.LogWarning("Received paid session {SessionId} with no matching internal purchase record.", session.Id);
                return false;
            }

            // Verify session details against internal purchase record (Never trust metadata alone)
            if (session.AmountTotal.HasValue && session.AmountTotal.Value != purchase.AmountInCents)
            {
                _logger.LogError("Payment amount mismatch for purchase {PurchaseId}: expected {Expected}, got {Actual}.",
                    purchase.Id, purchase.AmountInCents, session.AmountTotal.Value);
                await _purchasesRepo.MarkFailedAsync(purchase.Id, "Amount mismatch", ct);
                return false;
            }

            if (!string.IsNullOrWhiteSpace(session.Currency) &&
                !string.Equals(session.Currency, purchase.Currency, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogError("Payment currency mismatch for purchase {PurchaseId}: expected {Expected}, got {Actual}.",
                    purchase.Id, purchase.Currency, session.Currency);
                await _purchasesRepo.MarkFailedAsync(purchase.Id, "Currency mismatch", ct);
                return false;
            }

            // Ensure starter ledger exists prior to transaction
            await _creditsRepo.TryGrantInitialAsync(purchase.UserId, 200);

            var paymentIntentId = session.PaymentIntentId ?? session.Id;

            // Crash-Safe Fulfillment via MongoDB Transaction (MANDATORY FOR PRODUCTION PAYMENT FULFILLMENT)
            if (!_transactionsEnabled)
            {
                _logger.LogError("Atomic fulfillment cannot proceed for purchase {PurchaseId}: Mongo transactions are disabled (Mongo:TransactionsEnabled is false). Failing closed to prevent non-transactional execution.", purchase.Id);
                throw new InvalidOperationException("Payment fulfillment requires Mongo transactions to be enabled. Purchase remains pending for webhook retry.");
            }

            using var mongoSession = await _mongoClient.StartSessionAsync(cancellationToken: ct);
            mongoSession.StartTransaction();
            try
            {
                // 1. Compare-and-swap purchase: Status == Pending -> Succeeded
                var filter = Builders<CreditPurchase>.Filter.And(
                    Builders<CreditPurchase>.Filter.Eq(x => x.Id, purchase.Id),
                    Builders<CreditPurchase>.Filter.Eq(x => x.Status, CreditPurchaseStatus.Pending)
                );

                var update = Builders<CreditPurchase>.Update
                    .Set(x => x.Status, CreditPurchaseStatus.Succeeded)
                    .Set(x => x.ProviderSessionId, session.Id)
                    .Set(x => x.ProviderPaymentIntentId, paymentIntentId)
                    .Set(x => x.ProviderEventId, eventId)
                    .Set(x => x.CompletedAt, DateTime.UtcNow);

                var updateResult = await _purchasesRepo.Collection.UpdateOneAsync(mongoSession, filter, update, cancellationToken: ct);

                if (updateResult.ModifiedCount != 1)
                {
                    // Duplicate webhook or race won by another worker
                    _logger.LogInformation("Purchase {PurchaseId} was already fulfilled or modified. Skipping credit grant.", purchase.Id);
                    await mongoSession.AbortTransactionAsync(ct);
                    return true;
                }

                // 2. Increment AICredits balance within the exact same transaction
                var creditAdded = await _creditsRepo.AddPurchasedCreditsAsync(mongoSession, purchase.UserId, purchase.Credits, ct);
                if (!creditAdded)
                {
                    throw new InvalidOperationException($"Failed to increment balance for user {purchase.UserId} in transaction.");
                }

                await mongoSession.CommitTransactionAsync(ct);
                _logger.LogInformation("Successfully fulfilled credit purchase {PurchaseId}: +{Credits} credits for user {UserId}.",
                    purchase.Id, purchase.Credits, purchase.UserId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transaction aborted during credit fulfillment for purchase {PurchaseId}.", purchase.Id);
                try { await mongoSession.AbortTransactionAsync(CancellationToken.None); } catch { }
                throw; // Re-throw to allow Stripe webhook retry
            }
        }
    }
}
