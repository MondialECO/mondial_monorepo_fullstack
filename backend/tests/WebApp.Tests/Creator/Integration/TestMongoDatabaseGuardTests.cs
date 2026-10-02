using System;
using System.Threading.Tasks;
using FluentAssertions;
using MongoDB.Driver;
using Moq;
using Xunit;

namespace WebApp.Tests.Creator.Integration
{
    public class TestMongoDatabaseGuardTests
    {
        [Theory]
        [InlineData("MondialEco")]
        [InlineData("mondialeco")]
        [InlineData("MondialEcoDev")]
        [InlineData("mondialecodev")]
        [InlineData("MondialEcoInvestorVerify")]
        [InlineData("admin")]
        [InlineData("local")]
        [InlineData("config")]
        [InlineData("test")]
        public void IsProtectedDatabase_Identifies_All_Protected_Databases(string dbName)
        {
            TestMongoDatabaseGuard.IsProtectedDatabase(dbName).Should().BeTrue();
        }

        [Theory]
        [InlineData("bk_1234567890abcdef")]
        [InlineData("bk_logo_1234567890abcdef")]
        [InlineData("test_stage10_1234567890abcdef")]
        [InlineData("verify_opt_a_1234567890abcdef")]
        [InlineData("mbc_test_1234567890abcdef")]
        public void IsSafeEphemeralDatabaseName_Accepts_Valid_Ephemeral_Names(string dbName)
        {
            TestMongoDatabaseGuard.IsSafeEphemeralDatabaseName(dbName).Should().BeTrue();
        }

        [Theory]
        [InlineData("MondialEco")]
        [InlineData("MondialEcoDev")]
        [InlineData("production_backup")]
        [InlineData("users_db")]
        [InlineData("custom_database")]
        [InlineData("")]
        [InlineData(null)]
        public void IsSafeEphemeralDatabaseName_Rejects_Non_Ephemeral_Names(string? dbName)
        {
            TestMongoDatabaseGuard.IsSafeEphemeralDatabaseName(dbName).Should().BeFalse();
        }

        [Fact]
        public void AssertSafeEphemeralDatabaseName_Throws_On_Protected_Database()
        {
            var act = () => TestMongoDatabaseGuard.AssertSafeEphemeralDatabaseName("MondialEcoDev", "bk_");
            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*protected database*");
        }

        [Fact]
        public void AssertSafeEphemeralDatabaseName_Throws_On_Mismatched_Prefix()
        {
            var act = () => TestMongoDatabaseGuard.AssertSafeEphemeralDatabaseName("bk_logo_123", "test_stage10_");
            act.Should().Throw<InvalidOperationException>()
                .WithMessage("*does not start with expected prefix*");
        }

        [Fact]
        public async Task SafeDropDatabaseAsync_Refuses_To_Drop_Protected_Database()
        {
            var mockClient = new Mock<IMongoClient>();

            await TestMongoDatabaseGuard.SafeDropDatabaseAsync(mockClient.Object, "MondialEcoDev", "bk_");

            mockClient.Verify(c => c.DropDatabaseAsync(It.IsAny<string>(), default), Times.Never);
        }

        [Fact]
        public async Task SafeDropDatabaseAsync_Drops_Valid_Ephemeral_Database()
        {
            var mockClient = new Mock<IMongoClient>();
            mockClient.Setup(c => c.DropDatabaseAsync("bk_1234567890abcdef", default))
                .Returns(Task.CompletedTask);

            await TestMongoDatabaseGuard.SafeDropDatabaseAsync(mockClient.Object, "bk_1234567890abcdef", "bk_");

            mockClient.Verify(c => c.DropDatabaseAsync("bk_1234567890abcdef", default), Times.Once);
        }

        [Fact]
        public void IsLiveTestExplicitlyOptedIn_Returns_False_When_Env_Not_Set()
        {
            var original = Environment.GetEnvironmentVariable(TestMongoDatabaseGuard.LiveTestOptInEnvVar);
            try
            {
                Environment.SetEnvironmentVariable(TestMongoDatabaseGuard.LiveTestOptInEnvVar, null);
                TestMongoDatabaseGuard.IsLiveTestExplicitlyOptedIn().Should().BeFalse();
            }
            finally
            {
                Environment.SetEnvironmentVariable(TestMongoDatabaseGuard.LiveTestOptInEnvVar, original);
            }
        }

        [Fact]
        public void IsLiveTestExplicitlyOptedIn_Returns_True_When_Env_Is_True()
        {
            var original = Environment.GetEnvironmentVariable(TestMongoDatabaseGuard.LiveTestOptInEnvVar);
            try
            {
                Environment.SetEnvironmentVariable(TestMongoDatabaseGuard.LiveTestOptInEnvVar, "true");
                TestMongoDatabaseGuard.IsLiveTestExplicitlyOptedIn().Should().BeTrue();
            }
            finally
            {
                Environment.SetEnvironmentVariable(TestMongoDatabaseGuard.LiveTestOptInEnvVar, original);
            }
        }
    }
}
