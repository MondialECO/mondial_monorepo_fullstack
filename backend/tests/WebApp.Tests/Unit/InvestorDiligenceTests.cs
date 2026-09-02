using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class InvestorDiligenceTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoDatabase> _mongoDbMock = new();
    private readonly Mock<IPhaseNotificationService> _mockNotificationService;
    private readonly Mock<IServiceProvider> _mockServiceProvider;

    private readonly List<Companies> _companiesDb = new();
    private readonly List<InvestorMatch> _matchesDb = new();
    private readonly List<Phase6NdaAcceptance> _ndasDb = new();
    private readonly List<Investor> _investorsDb = new();
    private readonly List<InvestorDiligenceSession> _sessionsDb = new();
    private readonly List<InvestorDiligenceReview> _reviewsDb = new();
    private readonly List<InvestorDiligenceNote> _notesDb = new();
    private readonly List<InvestorDiligenceQuestion> _questionsDb = new();

    public InvestorDiligenceTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(_mongoDbMock.Object);
        _mockNotificationService = new Mock<IPhaseNotificationService>();
        _mockServiceProvider = new Mock<IServiceProvider>();

        _mockServiceProvider
            .Setup(sp => sp.GetService(typeof(IPhaseNotificationService)))
            .Returns(_mockNotificationService.Object);

        SetupMockCollection(_companiesDb, mock => _mockDbContext.Setup(db => db.Companies).Returns(mock.Object));
        SetupMockCollection(_matchesDb, mock => _mockDbContext.Setup(db => db.InvestorMatches).Returns(mock.Object));
        SetupMockCollection(_ndasDb, mock => _mockDbContext.Setup(db => db.Phase6NdaAcceptances).Returns(mock.Object));
        SetupMockCollection(_investorsDb, mock => _mockDbContext.Setup(db => db.Investors).Returns(mock.Object));
        SetupMockCollection(_sessionsDb, mock => _mockDbContext.Setup(db => db.InvestorDiligenceSessions).Returns(mock.Object));
        SetupMockCollection(_reviewsDb, mock => _mockDbContext.Setup(db => db.InvestorDiligenceReviews).Returns(mock.Object));
        SetupMockCollection(_notesDb, mock => _mockDbContext.Setup(db => db.InvestorDiligenceNotes).Returns(mock.Object));
        SetupMockCollection(_questionsDb, mock => _mockDbContext.Setup(db => db.InvestorDiligenceQuestions).Returns(mock.Object));
    }

    private void SetupMockCollection<T>(List<T> dataStore, Action<Mock<IMongoCollection<T>>> register) where T : class
    {
        var mockCollection = new Mock<IMongoCollection<T>>();

        mockCollection.Setup(c => c.InsertOneAsync(
            It.IsAny<T>(),
            It.IsAny<InsertOneOptions>(),
            It.IsAny<CancellationToken>()))
            .Callback<T, InsertOneOptions, CancellationToken>((item, _, _) => dataStore.Add(item))
            .Returns(Task.CompletedTask);

        mockCollection.Setup(c => c.ReplaceOneAsync(
            It.IsAny<FilterDefinition<T>>(),
            It.IsAny<T>(),
            It.IsAny<ReplaceOptions>(),
            It.IsAny<CancellationToken>()))
            .Callback<FilterDefinition<T>, T, ReplaceOptions, CancellationToken>((filter, item, _, _) =>
            {
                var docId = GetEntityId(item);
                var idx = dataStore.FindIndex(x => GetEntityId(x) == docId);
                if (idx >= 0) dataStore[idx] = item;
                else dataStore.Add(item);
            })
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

        mockCollection.Setup(c => c.DeleteOneAsync(
            It.IsAny<FilterDefinition<T>>(),
            It.IsAny<CancellationToken>()))
            .Callback<FilterDefinition<T>, CancellationToken>((filter, _) =>
            {
                var b = filter.Render(
                    MongoDB.Bson.Serialization.BsonSerializer.SerializerRegistry.GetSerializer<T>(),
                    MongoDB.Bson.Serialization.BsonSerializer.SerializerRegistry);
                if (b.Contains("_id"))
                {
                    var idVal = b["_id"].ToString();
                    dataStore.RemoveAll(x => GetEntityId(x) == idVal);
                }
            })
            .ReturnsAsync(new DeleteResult.Acknowledged(1));

        mockCollection.Setup(c => c.CountDocumentsAsync(
            It.IsAny<FilterDefinition<T>>(),
            It.IsAny<CountOptions>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((FilterDefinition<T> filter, CountOptions _, CancellationToken _) =>
            {
                return (long)dataStore.Count;
            });

        mockCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<T>>(),
            It.IsAny<FindOptions<T, T>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((FilterDefinition<T> filter, FindOptions<T, T> _, CancellationToken _) =>
            {
                return CreateAsyncCursor(FilterList(dataStore, filter));
            });

        mockCollection.Setup(c => c.FindAsync(
            It.IsAny<IClientSessionHandle>(),
            It.IsAny<FilterDefinition<T>>(),
            It.IsAny<FindOptions<T, T>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((IClientSessionHandle _, FilterDefinition<T> filter, FindOptions<T, T> _2, CancellationToken _3) =>
            {
                return CreateAsyncCursor(FilterList(dataStore, filter));
            });

        register(mockCollection);
    }

    private static string GetEntityId<T>(T item)
    {
        var prop = typeof(T).GetProperty("Id");
        return prop?.GetValue(item)?.ToString() ?? string.Empty;
    }

    private static List<T> FilterList<T>(List<T> store, FilterDefinition<T> filter)
    {
        var serializer = MongoDB.Bson.Serialization.BsonSerializer.SerializerRegistry.GetSerializer<T>();
        var bson = filter.Render(serializer, MongoDB.Bson.Serialization.BsonSerializer.SerializerRegistry);

        if (bson.ElementCount == 0) return store.ToList();

        return store.Where(item =>
        {
            var itemBson = item.ToBsonDocument();
            foreach (var elem in bson.Elements)
            {
                if (elem.Name == "$and" && elem.Value.IsBsonArray)
                {
                    foreach (var sub in elem.Value.AsBsonArray)
                    {
                        foreach (var subElem in sub.AsBsonDocument.Elements)
                        {
                            if (!itemBson.Contains(subElem.Name) || itemBson[subElem.Name] != subElem.Value)
                                return false;
                        }
                    }
                    continue;
                }

                if (!itemBson.Contains(elem.Name) || itemBson[elem.Name] != elem.Value)
                    return false;
            }
            return true;
        }).ToList();
    }

    private static IAsyncCursor<T> CreateAsyncCursor<T>(List<T> items)
    {
        var mockCursor = new Mock<IAsyncCursor<T>>();
        var enumerated = false;
        mockCursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                if (!enumerated)
                {
                    enumerated = true;
                    return true;
                }
                return false;
            });
        mockCursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                if (!enumerated)
                {
                    enumerated = true;
                    return true;
                }
                return false;
            });
        mockCursor.Setup(c => c.Current).Returns(items);
        return mockCursor.Object;
    }

    private DiligenceService CreateService()
    {
        return new DiligenceService(_mockDbContext.Object, null, _mockServiceProvider.Object);
    }

    private (Companies company, string doc1Id, string doc2Id) SetupCompanyWithDocs(bool requireNda = false)
    {
        var doc1 = new DataRoomDocumentResponse
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            Title = "Pitch Deck 2026",
            Category = "pitch_deck",
            FileName = "pitch_deck.pdf"
        };
        var doc2 = new DataRoomDocumentResponse
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            Title = "Financial Model 2026-2028",
            Category = "financials",
            FileName = "financials.xlsx"
        };

        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyName = "Acme Robotics",
            OwnerId = ObjectId.GenerateNewId().ToString(),
            IsDataRoomNdaRequired = requireNda,
            DataRoomDocuments = new List<DataRoomDocumentResponse> { doc1, doc2 }
        };
        _companiesDb.Add(company);

        return (company, doc1.DocumentId, doc2.DocumentId);
    }

    [Fact]
    public async Task DiligenceReview_InvestorSpecific()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();
        var invB = ObjectId.GenerateNewId().ToString();

        // Investor A reviews doc-1
        await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc1Id, "reviewed", "user-A");

        // Investor B summary should show doc-1 not_reviewed
        var summaryB = await service.GetDiligenceSummaryAsync(invB, company.Id, "user-B");
        var reviewB = summaryB.Reviews.First(r => r.DocumentId == doc1Id);
        Assert.Equal("not_reviewed", reviewB.Status);

        // Investor A summary should show doc-1 reviewed
        var summaryA = await service.GetDiligenceSummaryAsync(invA, company.Id, "user-A");
        var reviewA = summaryA.Reviews.First(r => r.DocumentId == doc1Id);
        Assert.Equal("reviewed", reviewA.Status);
    }

    [Fact]
    public async Task DiligenceReview_MarkReviewedPersists()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        var res = await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc1Id, "reviewed", "user-A");
        Assert.Equal("reviewed", res.Status);

        var summary = await service.GetDiligenceSummaryAsync(invA, company.Id, "user-A");
        Assert.Equal(1, summary.ReviewedDocuments);
        Assert.Equal("reviewed", summary.Reviews.First(r => r.DocumentId == doc1Id).Status);
    }

    [Fact]
    public async Task DiligenceReview_NeedsAttentionPersists()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        var res = await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc1Id, "needs_attention", "user-A");
        Assert.Equal("needs_attention", res.Status);

        var summary = await service.GetDiligenceSummaryAsync(invA, company.Id, "user-A");
        Assert.Equal(1, summary.NeedsAttentionCount);
        Assert.False(summary.CanComplete);
        Assert.Contains("flagged as 'Needs Attention'", summary.BlockedReason);
    }

    [Fact]
    public async Task DiligenceNote_PrivateToInvestor()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();
        var invB = ObjectId.GenerateNewId().ToString();

        var noteA = await service.AddPrivateNoteAsync(invA, company.Id, doc1Id, "Check revenue forecast assumptions.", "user-A");
        Assert.NotNull(noteA.Id);

        // Investor A can see their note
        var notesA = await service.GetPrivateNotesAsync(invA, company.Id, doc1Id, "user-A");
        Assert.Single(notesA);
        Assert.Equal("Check revenue forecast assumptions.", notesA[0].Content);

        // Investor B cannot see Investor A note
        var notesB = await service.GetPrivateNotesAsync(invB, company.Id, doc1Id, "user-B");
        Assert.Empty(notesB);
    }

    [Fact]
    public async Task DiligenceNote_FounderCannotRead()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        await service.AddPrivateNoteAsync(invA, company.Id, doc1Id, "Valuation looks aggressive.", "user-A");

        // Public diligence summary does not expose note contents
        var summary = await service.GetDiligenceSummaryAsync(invA, company.Id, "user-A");
        Assert.Equal(1, summary.Reviews.First(r => r.DocumentId == doc1Id).NotesCount);

        // Founder querying questions does not return notes
        var questions = await service.GetDiligenceQuestionsAsync(company.OwnerId, company.Id, isFounder: true);
        Assert.Empty(questions);
    }

    [Fact]
    public async Task DiligenceQuestion_CreatesOpenQuestion()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        var q = await service.AskFounderQuestionAsync(invA, company.Id, doc1Id, "Pitch Deck", "What is the ARR target for 2027?", "user-A");
        Assert.NotNull(q.Id);
        Assert.Equal("open", q.Status);
        Assert.Equal("What is the ARR target for 2027?", q.Question);

        _mockNotificationService.Verify(n => n.NotifyDiligenceQuestionAskedAsync(
            company.Id, It.IsAny<string>(), "Pitch Deck", "What is the ARR target for 2027?"), Times.Once);
    }

    [Fact]
    public async Task DiligenceQuestion_FounderCanAnswer()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        var q = await service.AskFounderQuestionAsync(invA, company.Id, doc1Id, "Pitch Deck", "What is the ARR target for 2027?", "user-A");

        var answered = await service.AnswerFounderQuestionAsync(company.Id, q.Id, "We project 5M EUR ARR in 2027.", company.OwnerId);
        Assert.Equal("answered", answered.Status);
        Assert.Equal("We project 5M EUR ARR in 2027.", answered.FounderResponse);

        _mockNotificationService.Verify(n => n.NotifyDiligenceQuestionAnsweredAsync(
            invA, company.CompanyName, "Pitch Deck", "We project 5M EUR ARR in 2027.", company.Id), Times.Once);
    }

    [Fact]
    public async Task DiligenceQuestion_ForeignFounderBlocked()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        var q = await service.AskFounderQuestionAsync(invA, company.Id, doc1Id, "Pitch Deck", "Q1?", "user-A");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AnswerFounderQuestionAsync(company.Id, q.Id, "Hacked answer", ObjectId.GenerateNewId().ToString()));
    }

    [Fact]
    public async Task DiligenceQuestion_InvestorReceivesAnswer()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        var q = await service.AskFounderQuestionAsync(invA, company.Id, doc1Id, "Pitch Deck", "Question?", "user-A");
        await service.AnswerFounderQuestionAsync(company.Id, q.Id, "Answer!", company.OwnerId);

        var questionsA = await service.GetDiligenceQuestionsAsync(invA, company.Id, isFounder: false);
        Assert.Single(questionsA);
        Assert.Equal("answered", questionsA[0].Status);
        Assert.Equal("Answer!", questionsA[0].FounderResponse);
    }

    [Fact]
    public async Task DiligenceQuestion_OpenQuestionBlocksCompletion()
    {
        var (company, doc1Id, doc2Id) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc1Id, "reviewed", "user-A");
        await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc2Id, "reviewed", "user-A");

        await service.AskFounderQuestionAsync(invA, company.Id, doc1Id, "Pitch Deck", "Unanswered question", "user-A");

        var summary = await service.GetDiligenceSummaryAsync(invA, company.Id, "user-A");
        Assert.False(summary.CanComplete);
        Assert.Contains("unresolved open questions", summary.BlockedReason);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CompleteDiligenceAsync(invA, company.Id, "user-A"));
    }

    [Fact]
    public async Task DiligenceComplete_RequiresChecklist()
    {
        var (company, doc1Id, doc2Id) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        // Only 1 doc reviewed; 1 doc still not_reviewed
        await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc1Id, "reviewed", "user-A");

        var summary = await service.GetDiligenceSummaryAsync(invA, company.Id, "user-A");
        Assert.False(summary.CanComplete);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CompleteDiligenceAsync(invA, company.Id, "user-A"));
    }

    [Fact]
    public async Task DiligenceComplete_Persists()
    {
        var (company, doc1Id, doc2Id) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc1Id, "reviewed", "user-A");
        await service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc2Id, "reviewed", "user-A");

        var completed = await service.CompleteDiligenceAsync(invA, company.Id, "user-A");
        Assert.Equal("completed", completed.Status);
        Assert.NotNull(completed.CompletedAt);

        var summary = await service.GetDiligenceSummaryAsync(invA, company.Id, "user-A");
        Assert.Equal("completed", summary.Status);
    }

    [Fact]
    public async Task Diligence_NoNdaCannotReviewSensitiveDocument()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs(requireNda: true);
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        // No NDA signed yet
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateDocumentReviewStatusAsync(invA, company.Id, doc1Id, "reviewed", "user-A"));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AddPrivateNoteAsync(invA, company.Id, doc1Id, "Secret note", "user-A"));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AskFounderQuestionAsync(invA, company.Id, doc1Id, "Pitch", "Question", "user-A"));
    }

    [Fact]
    public async Task Diligence_InvestorACannotAccessInvestorBSession()
    {
        var (company, doc1Id, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();
        var invB = ObjectId.GenerateNewId().ToString();

        await service.AddPrivateNoteAsync(invB, company.Id, doc1Id, "Confidential note B", "user-B");
        await service.AskFounderQuestionAsync(invB, company.Id, doc1Id, "Pitch", "Investor B question", "user-B");

        var notesA = await service.GetPrivateNotesAsync(invA, company.Id, null, "user-A");
        var questionsA = await service.GetDiligenceQuestionsAsync(invA, company.Id, isFounder: false);

        Assert.Empty(notesA);
        Assert.Empty(questionsA);
    }

    [Fact]
    public async Task Diligence_ForeignDocumentBlocked()
    {
        var (company, _, _) = SetupCompanyWithDocs();
        var service = CreateService();
        var invA = ObjectId.GenerateNewId().ToString();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateDocumentReviewStatusAsync(invA, company.Id, "non-existent-doc-999", "reviewed", "user-A"));

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.AddPrivateNoteAsync(invA, company.Id, "non-existent-doc-999", "Note", "user-A"));
    }
}
