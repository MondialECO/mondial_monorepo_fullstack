using System.Text;

namespace WebApp.Configuration
{
    /// <summary>
    /// Fail-fast configuration validation. A replica must never boot with
    /// missing/placeholder secrets and then fail at runtime on the first
    /// request — it must refuse to start so the orchestrator does not route
    /// traffic to a broken instance.
    /// </summary>
    public static class StartupConfigValidation
    {
        // HMAC-SHA256 signing key must be at least 256 bits (32 bytes).
        private const int MinJwtKeyBytes = 32;

        public static void ValidateRequiredConfiguration(this WebApplicationBuilder builder)
        {
            var cfg = builder.Configuration;
            var errors = new List<string>();

            void Require(string key)
            {
                if (string.IsNullOrWhiteSpace(cfg[key]))
                    errors.Add($"  - Missing required configuration: '{key}'");
            }

            Require("MongoDbSettings:ConnectionString");
            Require("MongoDbSettings:DatabaseName");

            var transactionsSetting = cfg["Mongo:TransactionsEnabled"];
            if (!bool.TryParse(transactionsSetting, out var transactionsEnabled) || !transactionsEnabled)
            {
                errors.Add("  - 'Mongo:TransactionsEnabled' must be explicitly set to 'true' " +
                           "because Module 4 requires replica-set transactions.");
            }

            Require("JwtSettings:Issuer");
            Require("JwtSettings:Audience");
            Require("EmailSettings:SmtpServer");
            Require("EmailSettings:Email");
            Require("EmailSettings:Password");
            Require("OpenRouter:ApiKey");

            var jwtKey = cfg["JwtSettings:Key"];
            if (string.IsNullOrWhiteSpace(jwtKey))
            {
                errors.Add("  - Missing required configuration: 'JwtSettings:Key'");
            }
            else if (Encoding.UTF8.GetByteCount(jwtKey) < MinJwtKeyBytes)
            {
                errors.Add($"  - 'JwtSettings:Key' must be at least {MinJwtKeyBytes} bytes " +
                           "(256-bit) for HMAC-SHA256.");
            }

            // Stripe payment subsystem fail-closed startup validation
            var stripeEnabledSetting = cfg["Stripe:Enabled"];
            if (bool.TryParse(stripeEnabledSetting, out var stripeEnabled) && stripeEnabled)
            {
                var secretKey = cfg["Stripe:SecretKey"];
                var webhookSecret = cfg["Stripe:WebhookSecret"];
                var dbName = cfg["MongoDbSettings:DatabaseName"];
                var isProd = builder.Environment.IsProduction();

                if (string.IsNullOrWhiteSpace(secretKey))
                {
                    errors.Add("  - 'Stripe:SecretKey' is required when Stripe is enabled.");
                }
                else if (isProd && !secretKey.StartsWith("sk_live_", StringComparison.Ordinal))
                {
                    errors.Add("  - Production environment with Stripe enabled requires a live secret key starting with 'sk_live_'. Found test or invalid key.");
                }
                else if (!isProd && secretKey.StartsWith("sk_live_", StringComparison.Ordinal))
                {
                    errors.Add("  - Non-production environment cannot use live Stripe secret key ('sk_live_'). Use a test key ('sk_test_').");
                }

                if (isProd && (string.IsNullOrWhiteSpace(webhookSecret) || webhookSecret.StartsWith("<")))
                {
                    errors.Add("  - 'Stripe:WebhookSecret' is required and cannot be a placeholder in production when Stripe is enabled.");
                }

                if (isProd && string.Equals(dbName, "MondialEcoDev", StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add("  - Production Stripe live payments cannot run against development database 'MondialEcoDev'. Production database must be configured.");
                }
            }

            if (errors.Count > 0)
            {
                throw new InvalidOperationException(
                    "Application configuration is invalid. Supply these via user-secrets " +
                    "(development) or environment variables (production):" +
                    Environment.NewLine + string.Join(Environment.NewLine, errors));
            }
        }
    }
}
