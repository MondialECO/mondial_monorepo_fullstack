namespace WebApp.Configuration
{
    public class StripeSettings
    {
        public const string SectionName = "Stripe";

        public bool Enabled { get; set; } = false;
        public string? SecretKey { get; set; }
        public string? WebhookSecret { get; set; }
        public string SuccessUrl { get; set; } = "https://mondialbusiness.eu/dashboard/creator?creditPurchase=success&session_id={CHECKOUT_SESSION_ID}";
        public string CancelUrl { get; set; } = "https://mondialbusiness.eu/dashboard/creator?creditPurchase=cancelled";

        public Dictionary<string, StripePackageConfig> Packages { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    public class StripePackageConfig
    {
        public int Credits { get; set; }
        public int? AmountInCents { get; set; }
        public string Currency { get; set; } = "eur";
        public string DisplayName { get; set; } = string.Empty;
    }
}
