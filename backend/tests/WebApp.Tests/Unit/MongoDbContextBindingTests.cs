using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Pins the collection names MongoDbContext binds to, for collections it does not own.
///
/// ApplicationUsers is written by ASP.NET Identity, not by us: AddMongoDbStores resolves
/// the name through MongoDbGenericRepository's Pluralize -> Camelize convention, giving
/// "applicationUsers". MongoDbContext asked for "ApplicationUsers" instead. MongoDB is
/// case-sensitive and IMongoDatabase.GetCollection returns an empty collection for a name
/// that does not exist rather than throwing, so the mismatch was silent: seven read paths
/// returned nothing and two write paths matched nothing, for as long as the binding
/// existed.
///
/// The absence of exactly this assertion is what let that survive. It is deliberately a
/// unit test rather than an integration one — the round trip through Identity needs Docker
/// and a live Mongo, and skips without them, which is no guard at all on a dev machine.
/// Asserting the requested name needs neither and fails the moment the string drifts.
/// </summary>
public class MongoDbContextBindingTests
{
    private static (MongoDbContext Context, Func<string?> LastRequestedUserCollection) Build()
    {
        var database = new Mock<IMongoDatabase>();
        string? requested = null;

        database
            .Setup(d => d.GetCollection<ApplicationUser>(
                It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
            .Callback<string, MongoCollectionSettings>((name, _) => requested = name)
            .Returns((IMongoCollection<ApplicationUser>)null!);

        // Every Ensure*Indexes() call in the constructor is individually try/caught, so an
        // unstubbed mock database is tolerated and no real connection is opened.
        var context = new MongoDbContext(database.Object);
        return (context, () => requested);
    }

    [Fact]
    public void ApplicationUsers_binds_to_the_collection_Identity_actually_writes()
    {
        var (context, lastRequested) = Build();

        _ = context.ApplicationUsers;

        lastRequested().Should().Be(
            "applicationUsers",
            "Identity resolves this collection via Pluralize -> Camelize, and MongoDB "
            + "collection names are case-sensitive");
    }

    [Fact]
    public void ApplicationUsers_does_not_bind_to_the_PascalCase_name_that_never_existed()
    {
        var (context, lastRequested) = Build();

        _ = context.ApplicationUsers;

        lastRequested().Should().NotBe(
            "ApplicationUsers",
            "no collection by that name has ever existed; GetCollection would silently "
            + "return an empty one");
    }
}
