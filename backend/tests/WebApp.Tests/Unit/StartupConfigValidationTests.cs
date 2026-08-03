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
    private static WebApplicationBuilder BuilderWith(Dictionary<string, string?> settings)
    {
        var builder = WebApplication.CreateEmptyBuilder(new WebApplicationOptions
        {
            ContentRootPath = AppContext.BaseDirectory,
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
}
