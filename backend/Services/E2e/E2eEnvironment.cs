using Microsoft.AspNetCore.Hosting;
namespace WebApp.Services.E2e;

/// <summary>
/// Single hard gate for the disposable browser-test harness.  This deliberately
/// uses a dedicated environment name rather than Development: a developer's
/// normal local API must not acquire a test-account provisioning surface.
/// </summary>
public static class E2eEnvironment
{
    public const string Name = "E2E";

    public static bool IsEnabled(IWebHostEnvironment environment) =>
        string.Equals(environment.EnvironmentName, Name, StringComparison.Ordinal);
}
