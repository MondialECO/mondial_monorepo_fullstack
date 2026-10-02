using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace WebApp.Tests.Creator.Integration
{
    /// <summary>
    /// Guardrails for ephemeral integration-test MongoDB databases.
    /// Prevents test suites from leaking or dropping protected / shared cloud databases.
    /// </summary>
    public static class TestMongoDatabaseGuard
    {
        public const string LiveTestOptInEnvVar = "MBC_RUN_LIVE_MONGO_TESTS";
        public const string MongoTestConnectionEnvVar = "MONGO_TEST_CONNECTION_STRING";

        private static readonly HashSet<string> ProtectedDatabaseNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "MondialEco",
            "MondialEcoDev",
            "MondialEcoInvestorVerify",
            "admin",
            "local",
            "config",
            "test"
        };

        private static readonly HashSet<string> ApprovedEphemeralPrefixes = new(StringComparer.OrdinalIgnoreCase)
        {
            "bk_",
            "bk_logo_",
            "test_stage10_",
            "verify_opt_a_",
            "mbc_test_"
        };

        public static bool IsProtectedDatabase(string? dbName)
        {
            if (string.IsNullOrWhiteSpace(dbName))
                return false;
            return ProtectedDatabaseNames.Contains(dbName.Trim());
        }

        public static bool IsLiveTestExplicitlyOptedIn()
        {
            var flag = Environment.GetEnvironmentVariable(LiveTestOptInEnvVar);
            return string.Equals(flag, "true", StringComparison.OrdinalIgnoreCase)
                || string.Equals(flag, "1", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsSafeEphemeralDatabaseName(string? dbName)
        {
            if (string.IsNullOrWhiteSpace(dbName))
                return false;

            if (IsProtectedDatabase(dbName))
                return false;

            foreach (var prefix in ApprovedEphemeralPrefixes)
            {
                if (dbName.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        public static bool IsSafeEphemeralDatabaseName(string? dbName, string expectedPrefix)
        {
            if (string.IsNullOrWhiteSpace(dbName))
                return false;

            if (IsProtectedDatabase(dbName))
                return false;

            return dbName.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase);
        }

        public static void AssertSafeEphemeralDatabaseName(string? dbName, string expectedPrefix)
        {
            if (!IsSafeEphemeralDatabaseName(dbName, expectedPrefix))
            {
                throw new InvalidOperationException(
                    $"Refusing to operate on database '{dbName}': It does not start with expected prefix '{expectedPrefix}' or is a protected database.");
            }
        }

        public static async Task SafeDropDatabaseAsync(IMongoClient? client, string? dbName, string expectedPrefix, ILogger? logger = null)
        {
            if (client == null || string.IsNullOrWhiteSpace(dbName))
                return;

            if (!IsSafeEphemeralDatabaseName(dbName, expectedPrefix))
            {
                logger?.LogWarning("SafeDropDatabase skipped: Database name '{DatabaseName}' is not a valid ephemeral name with prefix '{ExpectedPrefix}'.", dbName, expectedPrefix);
                return;
            }

            try
            {
                await client.DropDatabaseAsync(dbName);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Failed to drop ephemeral database '{DatabaseName}' during test cleanup.", dbName);
            }
        }
    }
}
