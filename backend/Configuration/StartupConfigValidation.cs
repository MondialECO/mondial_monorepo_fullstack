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
