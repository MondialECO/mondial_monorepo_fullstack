using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using WebApp.Configuration;
using Xunit;

namespace WebApp.Tests.Unit;

public class StartupConfigValidationTests
{
    /// <summary>
    /// ContentRootPath is pinned because the default is Directory.GetCurrentDirectory(),
    /// which is process-wide mutable state that another test class writes.
    /// ServiceProviderProfileMediaTests does SetCurrentDirectory into a temp folder and
    /// then deletes it; xUnit runs the two classes in parallel, so this one intermittently
    /// built a host whose content root had just been removed and threw
    /// "The content root '...\sp-test-{guid}' does not exist" before any assertion ran.
    /// Roughly 1 run in 5, scaling with total suite parallelism — adding an unrelated
    /// test class was enough to surface it. AppContext.BaseDirectory is the test output
    /// directory: fixed for the life of the process and never chdir'd away.
    ///
    /// CreateEmptyBuilder rather than CreateBuilder for a second reason:
    /// ValidateRequiredConfiguration reads nothing but builder.Configuration, and the
    /// default pipeline would layer the real appsettings.json underneath. The cases that
    /// assert on a REMOVED key were passing only because that file happens not to supply
    /// it — a value added there later would have silently made them vacuous. In-memory is
    /// now the only configuration source.
    /// </summary>
    private static WebApplicationBuilder BuilderWith(Dictionary<string, string?> settings, string environmentName = "Development")
    {
        var builder = WebApplication.CreateEmptyBuilder(new WebApplicationOptions
        {
            ContentRootPath = AppContext.BaseDirectory,
            EnvironmentName = environmentName,
        });
        builder.Configuration.AddInMemoryCollection(settings);
        return builder;
    }

    private static Dictionary<string, string?> ValidConfig() => new()
    {
        ["MongoDbSettings:ConnectionString"] = "mongodb://localhost:27017",
        ["MongoDbSettings:DatabaseName"] = "Test",
        ["Mongo:TransactionsEnabled"] = "true",
        ["JwtSettings:Issuer"] = "issuer",
        ["JwtSettings:Audience"] = "aud",
        ["JwtSettings:Key"] = new string('k', 32),
        ["EmailSettings:SmtpServer"] = "smtp.test",
        ["EmailSettings:Email"] = "a@b.com",
        ["EmailSettings:Password"] = "pw",
        ["OpenRouter:ApiKey"] = "sk-or-test-key",
    };

    [Fact]
    public void Passes_with_complete_config()
    {
        var builder = BuilderWith(ValidConfig());
        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().NotThrow();
    }

    [Fact]
    public void Throws_when_secret_missing()
    {
        var cfg = ValidConfig();
        cfg["MongoDbSettings:ConnectionString"] = "";
        var builder = BuilderWith(cfg);

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*MongoDbSettings:ConnectionString*");
    }

    [Fact]
    public void Throws_when_transactions_flag_missing()
    {
        var cfg = ValidConfig();
        cfg.Remove("Mongo:TransactionsEnabled");
        var builder = BuilderWith(cfg);

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*Mongo:TransactionsEnabled*true*");
    }

    [Fact]
    public void Throws_when_transactions_flag_false()
    {
        var cfg = ValidConfig();
        cfg["Mongo:TransactionsEnabled"] = "false";
        var builder = BuilderWith(cfg);

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*Mongo:TransactionsEnabled*true*");
    }

    // Replaces the obsolete Anthropic test: the app consolidated to a single OpenRouter
    // provider, so the fail-fast now guards OpenRouter:ApiKey (the only remaining AI key).
    [Fact]
    public void Throws_when_openrouter_api_key_missing()
    {
        var cfg = ValidConfig();
        cfg["OpenRouter:ApiKey"] = "";
        var builder = BuilderWith(cfg);

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*OpenRouter:ApiKey*");
    }

    [Fact]
    public void Throws_when_jwt_key_too_weak()
    {
        var cfg = ValidConfig();
        cfg["JwtSettings:Key"] = "tooshort";
        var builder = BuilderWith(cfg);

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*256-bit*");
    }

    [Fact]
    public void Passes_when_stripe_disabled_with_empty_keys()
    {
        var cfg = ValidConfig();
        cfg["Stripe:Enabled"] = "false";
        cfg["Stripe:SecretKey"] = "";
        cfg["Stripe:WebhookSecret"] = "";
        var builder = BuilderWith(cfg, "Production");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().NotThrow();
    }

    [Fact]
    public void Passes_in_production_with_valid_live_key_and_production_db()
    {
        var cfg = ValidConfig();
        cfg["MongoDbSettings:DatabaseName"] = "MondialEco";
        cfg["Stripe:Enabled"] = "true";
        cfg["Stripe:SecretKey"] = "sk_live_valid_prod_key_123456789";
        cfg["Stripe:WebhookSecret"] = "whsec_valid_prod_secret_123456789";
        var builder = BuilderWith(cfg, "Production");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().NotThrow();
    }

    [Fact]
    public void Throws_in_production_when_stripe_uses_test_key()
    {
        var cfg = ValidConfig();
        cfg["MongoDbSettings:DatabaseName"] = "MondialEco";
        cfg["Stripe:Enabled"] = "true";
        cfg["Stripe:SecretKey"] = "sk_test_accidental_test_key_123";
        cfg["Stripe:WebhookSecret"] = "whsec_valid_prod_secret_123";
        var builder = BuilderWith(cfg, "Production");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*Production environment with Stripe enabled requires a live secret key starting with 'sk_live_'*");
    }

    [Fact]
    public void Throws_in_production_when_stripe_key_missing()
    {
        var cfg = ValidConfig();
        cfg["MongoDbSettings:DatabaseName"] = "MondialEco";
        cfg["Stripe:Enabled"] = "true";
        cfg["Stripe:SecretKey"] = "";
        cfg["Stripe:WebhookSecret"] = "whsec_valid_prod_secret_123";
        var builder = BuilderWith(cfg, "Production");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*'Stripe:SecretKey' is required*");
    }

    [Fact]
    public void Throws_in_production_when_stripe_webhook_secret_missing_or_placeholder()
    {
        var cfg = ValidConfig();
        cfg["MongoDbSettings:DatabaseName"] = "MondialEco";
        cfg["Stripe:Enabled"] = "true";
        cfg["Stripe:SecretKey"] = "sk_live_valid_key_123";
        cfg["Stripe:WebhookSecret"] = "<placeholder>";
        var builder = BuilderWith(cfg, "Production");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*'Stripe:WebhookSecret' is required and cannot be a placeholder in production*");
    }

    [Fact]
    public void Throws_in_production_when_stripe_live_runs_against_dev_database()
    {
        var cfg = ValidConfig();
        cfg["MongoDbSettings:DatabaseName"] = "MondialEcoDev";
        cfg["Stripe:Enabled"] = "true";
        cfg["Stripe:SecretKey"] = "sk_live_valid_prod_key_123";
        cfg["Stripe:WebhookSecret"] = "whsec_valid_prod_secret_123";
        var builder = BuilderWith(cfg, "Production");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*Production Stripe live payments cannot run against development database 'MondialEcoDev'*");
    }

    [Fact]
    public void Throws_in_development_when_stripe_uses_live_key()
    {
        var cfg = ValidConfig();
        cfg["Stripe:Enabled"] = "true";
        cfg["Stripe:SecretKey"] = "sk_live_accidental_live_key_in_dev";
        var builder = BuilderWith(cfg, "Development");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*Non-production environment cannot use live Stripe secret key ('sk_live_')*");
    }

    [Fact]
    public void Passes_in_development_when_stripe_uses_test_key()
    {
        var cfg = ValidConfig();
        cfg["Stripe:Enabled"] = "true";
        cfg["Stripe:SecretKey"] = "sk_test_valid_test_key";
        var builder = BuilderWith(cfg, "Development");

        var act = () => builder.ValidateRequiredConfiguration();
        act.Should().NotThrow();
    }
}
