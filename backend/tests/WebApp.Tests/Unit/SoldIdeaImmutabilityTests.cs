using System;
using System.Reflection;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class SoldIdeaImmutabilityTests
    {
        private readonly Mock<ICreatorIdeaStore> _ideaStoreMock;
        private readonly Mock<IHttpContextAccessor> _httpMock;

        public SoldIdeaImmutabilityTests()
        {
            _ideaStoreMock = new Mock<ICreatorIdeaStore>();
            _httpMock = new Mock<IHttpContextAccessor>();

            var context = new DefaultHttpContext();
            context.Request.QueryString = new QueryString("?ideaId=sold-idea-1&expectedVersion=1");
            _httpMock.Setup(h => h.HttpContext).Returns(context);
        }

        private CreatorJourneyService CreateService()
        {
            var database = new Mock<IMongoDatabase>();
            var context = new MongoDbContext(database.Object);
            return new CreatorJourneyService(
                context,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                _ideaStoreMock.Object,
                Mock.Of<IClarifierSessionStore>(),
                _httpMock.Object
            );
        }

        private static async Task InvokeWriteIdeaAsync(
            CreatorJourneyService service,
            CreatorIdea idea,
            UpdateDefinition<CreatorIdea> update)
        {
            var method = typeof(CreatorJourneyService).GetMethod(
                "WriteIdeaAsync",
                BindingFlags.Instance | BindingFlags.NonPublic);

            method.Should().NotBeNull();
            var task = (Task)method!.Invoke(service, new object?[] { idea, update })!;
            await task;
        }

        [Fact]
        public async Task SoldIdea_WriteIdea_Throws_422_Immutability_Exception()
        {
            var userId = "user-creator-1";
            var ideaId = "sold-idea-1";

            var soldIdea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                ProjectOutcome = "SOLD",
                AcquiredByUserId = "user-buyer-1",
                SoldAt = DateTime.UtcNow,
                Version = 1,
                Project = new CreatorJourneyProject { Name = "Original Name" }
            };

            var service = CreateService();
            var update = Builders<CreatorIdea>.Update.Set(x => x.Project.Name, "Hacked Name");

            var act = async () => await InvokeWriteIdeaAsync(service, soldIdea, update);

            var ex = await act.Should().ThrowAsync<CreatorJourneyException>();
            ex.Which.StatusCode.Should().Be(422);
            ex.Which.Message.Should().Contain("sold and is permanently read-only");
        }

        [Fact]
        public async Task SoldIdea_With_ExpectedVersion_Still_Blocked_By_Sold_Guard()
        {
            var userId = "user-creator-1";
            var ideaId = "sold-idea-1";

            var soldIdea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                ProjectOutcome = "SOLD",
                AcquiredByUserId = "user-buyer-1",
                SoldAt = DateTime.UtcNow,
                Version = 5,
            };

            var context = new DefaultHttpContext();
            context.Request.QueryString = new QueryString("?ideaId=sold-idea-1&expectedVersion=5");
            _httpMock.Setup(h => h.HttpContext).Returns(context);

            var service = CreateService();
            var update = Builders<CreatorIdea>.Update.Set(x => x.Phase2Data.SelectedConceptId, "concept-123");

            var act = async () => await InvokeWriteIdeaAsync(service, soldIdea, update);

            var ex = await act.Should().ThrowAsync<CreatorJourneyException>();
            ex.Which.StatusCode.Should().Be(422);
            ex.Which.Message.Should().Contain("sold and is permanently read-only");
        }

        [Fact]
        public async Task ActiveIdea_Not_Sold_Passes_Sold_Guard()
        {
            var userId = "user-creator-1";
            var ideaId = "active-idea-1";

            var activeIdea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                ProjectOutcome = null,
                Version = 1,
                Project = new CreatorJourneyProject { Name = "Active Name" }
            };

            var context = new DefaultHttpContext();
            context.Request.QueryString = new QueryString($"?ideaId={ideaId}&expectedVersion=1");
            _httpMock.Setup(h => h.HttpContext).Returns(context);

            _ideaStoreMock.Setup(s => s.UpdateAsync(ideaId, userId, It.IsAny<UpdateDefinition<CreatorIdea>>(), 1L, null))
                .ReturnsAsync(true);

            var service = CreateService();
            var update = Builders<CreatorIdea>.Update.Set(x => x.Project.Name, "Updated Valid Name");

            var act = async () => await InvokeWriteIdeaAsync(service, activeIdea, update);

            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task Creators_Other_Active_Idea_Is_Not_Blocked_By_Sold_Idea()
        {
            var userId = "user-creator-1";
            var otherIdeaId = "other-active-idea-2";

            var otherIdea = new CreatorIdea
            {
                Id = otherIdeaId,
                UserId = userId,
                ProjectOutcome = null,
                Version = 1,
                Project = new CreatorJourneyProject { Name = "Other Venture" }
            };

            var context = new DefaultHttpContext();
            context.Request.QueryString = new QueryString($"?ideaId={otherIdeaId}&expectedVersion=1");
            _httpMock.Setup(h => h.HttpContext).Returns(context);

            _ideaStoreMock.Setup(s => s.UpdateAsync(otherIdeaId, userId, It.IsAny<UpdateDefinition<CreatorIdea>>(), 1L, null))
                .ReturnsAsync(true);

            var service = CreateService();
            var update = Builders<CreatorIdea>.Update.Set(x => x.Project.Name, "Updated Other Venture");

            var act = async () => await InvokeWriteIdeaAsync(service, otherIdea, update);

            await act.Should().NotThrowAsync();
        }
    }
}
