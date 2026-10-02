using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;
using WebApp.Configuration;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Ai
{
    public interface IStripeCreditCheckoutService
    {
        Task<Session> CreateCheckoutSessionAsync(
            CreditPurchase purchase,
            StripePackageConfig packageConfig,
            string? successUrl = null,
            string? cancelUrl = null,
            CancellationToken ct = default);

        Event ConstructWebhookEvent(string json, string stripeSignature);
    }

    public class StripeCreditCheckoutService : IStripeCreditCheckoutService
    {
        private readonly StripeSettings _settings;

        public StripeCreditCheckoutService(IOptions<StripeSettings> settings)
        {
            _settings = settings.Value;
        }

        public async Task<Session> CreateCheckoutSessionAsync(
            CreditPurchase purchase,
            StripePackageConfig packageConfig,
            string? successUrl = null,
            string? cancelUrl = null,
            CancellationToken ct = default)
        {
            if (!_settings.Enabled)
                throw new InvalidOperationException("Stripe credit purchasing is currently disabled.");

            if (string.IsNullOrWhiteSpace(_settings.SecretKey))
                throw new InvalidOperationException("Stripe SecretKey is not configured.");

            if (!packageConfig.AmountInCents.HasValue || packageConfig.AmountInCents.Value <= 0)
                throw new InvalidOperationException($"Package '{purchase.PackageId}' price is not configured.");

            var resolvedSuccessUrl = !string.IsNullOrWhiteSpace(successUrl) ? successUrl : _settings.SuccessUrl;
            var resolvedCancelUrl = !string.IsNullOrWhiteSpace(cancelUrl) ? cancelUrl : _settings.CancelUrl;

            var client = new StripeClient(_settings.SecretKey);
            var service = new SessionService(client);

            var options = new SessionCreateOptions
            {
                Mode = "payment",
                ClientReferenceId = purchase.Id,
                SuccessUrl = resolvedSuccessUrl,
                CancelUrl = resolvedCancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "purchaseId", purchase.Id },
                    { "userId", purchase.UserId },
                    { "packageId", purchase.PackageId },
                    { "credits", purchase.Credits.ToString() }
                },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Quantity = 1,
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = packageConfig.Currency.ToLowerInvariant(),
                            UnitAmount = packageConfig.AmountInCents.Value,
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = !string.IsNullOrWhiteSpace(packageConfig.DisplayName)
                                    ? packageConfig.DisplayName
                                    : $"{purchase.Credits} AI Credits",
                                Description = $"{purchase.Credits} one-time credits for Mondial AI tools"
                            }
                        }
                    }
                }
            };

            return await service.CreateAsync(options, cancellationToken: ct);
        }

        public Event ConstructWebhookEvent(string json, string stripeSignature)
        {
            if (string.IsNullOrWhiteSpace(_settings.WebhookSecret))
                throw new InvalidOperationException("Stripe WebhookSecret is not configured.");

            if (string.IsNullOrWhiteSpace(stripeSignature))
                throw new ArgumentException("Missing Stripe-Signature header.", nameof(stripeSignature));

            return EventUtility.ConstructEvent(json, stripeSignature, _settings.WebhookSecret, throwOnApiVersionMismatch: false);
        }
    }
}
