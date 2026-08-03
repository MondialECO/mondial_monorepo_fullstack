using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// A workroom has exactly two people in it, so a task assignee outside that pair is
/// meaningless. Any string was stored unchecked, including another user's id.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class TaskAssigneeIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public TaskAssigneeIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedUserAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"u{Guid.NewGuid():N}@test.com",
            Email = $"u{Guid.NewGuid():N}@test.com",
            Name = "Assignee Test",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile
            {
                ProviderId = Guid.NewGuid().ToString(),
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                NewOrderAvailability = true,
                MaximumConcurrentOrders = 10,
            },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    private async Task<WorkroomEngagement> SeedEngagementAsync(string providerId, string clientId)
    {
        var e = new WorkroomEngagement
        {
            ProposalId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            ProviderId = providerId,
            ClientId = clientId,
            Title = "Engagement",
            ContractValue = 1000m,
            Currency = "EUR",
        };
        await Db.WorkroomEngagements.InsertOneAsync(e);
        return e;
    }

    private static CreateTaskRequest Task(string? assigneeId) => new()
    {
        Title = "Do the thing",
        Description = "",
        AssigneeId = assigneeId ?? "",
        Visibility = nameof(WorkroomTaskVisibility.ClientVisible),
    };

    [SkippableFact]
    public async Task A_task_can_be_assigned_to_either_participant()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var clientId = await SeedUserAsync();
        var e = await SeedEngagementAsync(providerId, clientId);
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        (await workroom.CreateTaskAsync(providerId, e.Id, Task(clientId))).Outcome
            .Should().Be(ServiceProviderOutcome.Ok);
        (await workroom.CreateTaskAsync(providerId, e.Id, Task(providerId))).Outcome
            .Should().Be(ServiceProviderOutcome.Ok);
    }

    [SkippableFact]
    public async Task A_task_assigned_to_a_non_participant_is_rejected()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var clientId = await SeedUserAsync();
        var strangerId = await SeedUserAsync();
        var e = await SeedEngagementAsync(providerId, clientId);
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        (await workroom.CreateTaskAsync(providerId, e.Id, Task(strangerId))).Outcome
            .Should().Be(ServiceProviderOutcome.Conflict);
        (await workroom.CreateTaskAsync(providerId, e.Id, Task("not-even-an-id"))).Outcome
            .Should().Be(ServiceProviderOutcome.Conflict);
        (await Db.WorkroomTasks.CountDocumentsAsync(x => x.EngagementId == e.Id)).Should().Be(0);
    }

    [SkippableFact]
    public async Task A_blank_assignee_still_defaults_to_the_caller()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var clientId = await SeedUserAsync();
        var e = await SeedEngagementAsync(providerId, clientId);
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        var result = await workroom.CreateTaskAsync(providerId, e.Id, Task(null));

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.AssigneeId.Should().Be(providerId);
    }
}
