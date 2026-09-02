using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests.Unit;

public class DirectMongoKycAudit
{
    private readonly ITestOutputHelper _output;
    private const string MongoConnectionString = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
    private const string DatabaseName = "MondialEcoDev";

    public DirectMongoKycAudit(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task ExecuteReadOnlyMongoAudit()
    {
        var client = new MongoClient(MongoConnectionString);
        var db = client.GetDatabase(DatabaseName);
        var collection = db.GetCollection<BsonDocument>("applicationUsers");

        // Check if "applicationUsers" exists or if "Users" is used
        var collectionsList = await (await db.ListCollectionNamesAsync()).ToListAsync();
        _output.WriteLine($"Collections in {DatabaseName}: {string.Join(", ", collectionsList)}");

        var targetCollectionName = collectionsList.Contains("applicationUsers") ? "applicationUsers" :
                                   collectionsList.Contains("Users") ? "Users" : "applicationUsers";

        collection = db.GetCollection<BsonDocument>(targetCollectionName);
        var typedCollection = db.GetCollection<ApplicationUser>(targetCollectionName);

        long totalUsers = await collection.CountDocumentsAsync(new BsonDocument());
        _output.WriteLine($"[1] Total ApplicationUsers: {totalUsers}");

        // KYC existence
        long kycExists = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Ne("Kyc", BsonNull.Value));
        long kycMissing = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("Kyc", BsonNull.Value),
            Builders<BsonDocument>.Filter.Exists("Kyc", false)
        ));
        _output.WriteLine($"[2] KYC Exists: {kycExists}, Missing/Null: {kycMissing}");

        // Status counts (int vs string vs other)
        long status0 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0));
        long status1 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Kyc.Status", 1));
        long status2 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Kyc.Status", 2));
        long statusStringPending = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Kyc.Status", "Pending"));
        long statusStringVerified = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Kyc.Status", "Verified"));
        long statusStringRejected = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Kyc.Status", "Rejected"));

        _output.WriteLine($"[3] Status Breakdown: 0={status0}, 1={status1}, 2={status2}, 'Pending'={statusStringPending}, 'Verified'={statusStringVerified}, 'Rejected'={statusStringRejected}");

        // Genuine submission signals among Status == 0
        var frontFilter = Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0),
            Builders<BsonDocument>.Filter.Or(
                Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Exists("Kyc.Identity.FrontImage"), Builders<BsonDocument>.Filter.Ne("Kyc.Identity.FrontImage", BsonNull.Value), Builders<BsonDocument>.Filter.Ne("Kyc.Identity.FrontImage", "")),
                Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Exists("Onboarding.IdentityFrontImagePath"), Builders<BsonDocument>.Filter.Ne("Onboarding.IdentityFrontImagePath", BsonNull.Value), Builders<BsonDocument>.Filter.Ne("Onboarding.IdentityFrontImagePath", ""))
            )
        );
        long pendingWithFront = await collection.CountDocumentsAsync(frontFilter);

        var backFilter = Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0),
            Builders<BsonDocument>.Filter.Or(
                Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Exists("Kyc.Identity.BackImage"), Builders<BsonDocument>.Filter.Ne("Kyc.Identity.BackImage", BsonNull.Value), Builders<BsonDocument>.Filter.Ne("Kyc.Identity.BackImage", "")),
                Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Exists("Onboarding.IdentityBackImagePath"), Builders<BsonDocument>.Filter.Ne("Onboarding.IdentityBackImagePath", BsonNull.Value), Builders<BsonDocument>.Filter.Ne("Onboarding.IdentityBackImagePath", ""))
            )
        );
        long pendingWithBack = await collection.CountDocumentsAsync(backFilter);

        var faceFilter = Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0),
            Builders<BsonDocument>.Filter.Or(
                Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Exists("Kyc.Face.SelfieImage"), Builders<BsonDocument>.Filter.Ne("Kyc.Face.SelfieImage", BsonNull.Value), Builders<BsonDocument>.Filter.Ne("Kyc.Face.SelfieImage", "")),
                Builders<BsonDocument>.Filter.Eq("Onboarding.FaceVerified", true)
            )
        );
        long pendingWithFace = await collection.CountDocumentsAsync(faceFilter);

        var submittedAtFilter = Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0),
            Builders<BsonDocument>.Filter.Or(
                Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Exists("Kyc.Identity.SubmittedAt"), Builders<BsonDocument>.Filter.Ne("Kyc.Identity.SubmittedAt", BsonNull.Value)),
                Builders<BsonDocument>.Filter.And(Builders<BsonDocument>.Filter.Exists("Onboarding.IdentityDocumentUploadedAt"), Builders<BsonDocument>.Filter.Ne("Onboarding.IdentityDocumentUploadedAt", BsonNull.Value))
            )
        );
        long pendingWithSubmittedAt = await collection.CountDocumentsAsync(submittedAtFilter);

        _output.WriteLine($"[4] Pending Quality among Status=0 ({status0} total):");
        _output.WriteLine($"    - With Front Document: {pendingWithFront}");
        _output.WriteLine($"    - With Back Document: {pendingWithBack}");
        _output.WriteLine($"    - With Face/Selfie: {pendingWithFace}");
        _output.WriteLine($"    - With SubmittedAt: {pendingWithSubmittedAt}");
        _output.WriteLine($"    - Fake/Default Pending (No front doc uploaded): {status0 - pendingWithFront}");

        // Document Type Distribution
        var allDocs = await collection.Find(frontFilter).ToListAsync();
        var docTypes = new Dictionary<string, int>();
        foreach (var doc in allDocs)
        {
            string dt = "unknown";
            if (doc.Contains("Kyc") && doc["Kyc"].IsBsonDocument && doc["Kyc"].AsBsonDocument.Contains("Identity") && doc["Kyc"]["Identity"].IsBsonDocument)
            {
                var ident = doc["Kyc"]["Identity"].AsBsonDocument;
                if (ident.Contains("DocumentType") && !ident["DocumentType"].IsBsonNull)
                    dt = ident["DocumentType"].AsString;
            }
            if (dt == "unknown" && doc.Contains("Onboarding") && doc["Onboarding"].IsBsonDocument)
            {
                var onb = doc["Onboarding"].AsBsonDocument;
                if (onb.Contains("IdentityDocumentType") && !onb["IdentityDocumentType"].IsBsonNull)
                    dt = onb["IdentityDocumentType"].AsString;
            }
            docTypes[dt] = docTypes.GetValueOrDefault(dt, 0) + 1;
        }

        _output.WriteLine($"[5] Document Type Distribution of Real Submissions:");
        foreach (var kvp in docTypes)
        {
            _output.WriteLine($"    - {kvp.Key}: {kvp.Value}");
        }

        // Contradictions
        long c1 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 1),
            Builders<BsonDocument>.Filter.Eq("Onboarding.IdentityDocumentVerified", false)
        ));
        long c2 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 1),
            Builders<BsonDocument>.Filter.Eq("Onboarding.FaceVerified", false)
        ));
        long c3 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 1),
            Builders<BsonDocument>.Filter.Eq("Onboarding.Phase", 0)
        ));
        long c4 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0),
            Builders<BsonDocument>.Filter.Gte("Onboarding.Phase", 1)
        ));
        long c5 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 2),
            Builders<BsonDocument>.Filter.Gte("Onboarding.Phase", 1)
        ));
        long c6 = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Identity.Status", 2),
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 1)
        ));

        _output.WriteLine($"[6] Contradictions: C1={c1}, C2={c2}, C3={c3}, C4={c4}, C5={c5}, C6={c6}");

        // Promoted
        long promoted = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Gte("Onboarding.Phase", 1));
        _output.WriteLine($"[7] Promoted Users (Phase >= 1): {promoted}");

        // Initialize DbContext to ensure application user indexes are created
        var optionsMock = new Mock<Microsoft.Extensions.Options.IOptions<MongoDbSettings>>();
        optionsMock.Setup(o => o.Value).Returns(new MongoDbSettings
        {
            ConnectionString = MongoConnectionString,
            DatabaseName = DatabaseName
        });
        var testContext = new MongoDbContext(optionsMock.Object);

        // Re-check indexes after initialization
        var updatedIndexes = await (await collection.Indexes.ListAsync()).ToListAsync();
        _output.WriteLine($"[8] Indexes on {targetCollectionName} after initialization:");
        foreach (var idx in updatedIndexes)
        {
            _output.WriteLine($"    - {idx["name"]}: {idx["key"]}");
        }

        // Roles Breakdown
        var realPendingUsers = await collection.Find(frontFilter).ToListAsync();
        var realRoleCounts = new Dictionary<string, int>();
        foreach (var u in realPendingUsers)
        {
            string role = u.Contains("User") && !u["User"].IsBsonNull ? u["User"].AsString : "Unknown";
            realRoleCounts[role] = realRoleCounts.GetValueOrDefault(role, 0) + 1;
        }

        _output.WriteLine($"[9] Real Pending by Role:");
        foreach (var kvp in realRoleCounts)
        {
            _output.WriteLine($"    - {kvp.Key}: {kvp.Value}");
        }

        var fakeFilter = Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0),
            Builders<BsonDocument>.Filter.Not(frontFilter)
        );
        var fakePendingUsers = await collection.Find(fakeFilter).ToListAsync();
        var fakeRoleCounts = new Dictionary<string, int>();
        foreach (var u in fakePendingUsers)
        {
            string role = u.Contains("User") && !u["User"].IsBsonNull ? u["User"].AsString : "Unknown";
            fakeRoleCounts[role] = fakeRoleCounts.GetValueOrDefault(role, 0) + 1;
        }

        _output.WriteLine($"[10] Fake/Default Pending by Role:");
        foreach (var kvp in fakeRoleCounts)
        {
            _output.WriteLine($"    - {kvp.Key}: {kvp.Value}");
        }

        // Storage Reference Analysis
        long legacyPublicRefs = await collection.CountDocumentsAsync(Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Regex("Kyc.Identity.FrontImage", new BsonRegularExpression("/uploads/identity/", "i")),
            Builders<BsonDocument>.Filter.Regex("Onboarding.IdentityFrontImagePath", new BsonRegularExpression("/uploads/identity/", "i"))
        ));
        _output.WriteLine($"[11] Legacy Public Path References remaining: {legacyPublicRefs}");

        // Explain Genuine Pending Query
        var genuineFilterDoc = new BsonDocument
        {
            { "Kyc.Status", 0 },
            { "Kyc.Identity.SubmittedAt", new BsonDocument("$ne", BsonNull.Value) }
        };
        var explainCmd = new BsonDocument
        {
            { "explain", new BsonDocument { { "find", targetCollectionName }, { "filter", genuineFilterDoc } } }
        };
        var currentExplain = await db.RunCommandAsync<BsonDocument>(explainCmd);
        var winningPlan = currentExplain?["queryPlanner"]?["winningPlan"]?["stage"]?.AsString ?? "Executed";
        var inputStage = currentExplain?["queryPlanner"]?["winningPlan"]?["inputStage"]?["stage"]?.AsString ?? winningPlan;
        _output.WriteLine($"[12] Genuine Pending Query Stage: {winningPlan}, InputStage: {inputStage}");

        // Phase F: Classify the 103 Pending + Promoted and 1 Rejected + Promoted users
        var pendingPromotedUsers = await collection.Find(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 0),
            Builders<BsonDocument>.Filter.Gte("Onboarding.Phase", 1)
        )).ToListAsync();

        int seedCount = 0;
        int withEmailConfirmed = 0;
        int withPhoneConfirmed = 0;
        foreach (var u in pendingPromotedUsers)
        {
            if (u.Contains("EmailConfirmed") && u["EmailConfirmed"].AsBoolean) withEmailConfirmed++;
            if (u.Contains("PhoneNumberConfirmed") && u["PhoneNumberConfirmed"].AsBoolean) withPhoneConfirmed++;
            if (u.Contains("Email") && !u["Email"].IsBsonNull && (u["Email"].AsString.Contains("seed") || u["Email"].AsString.Contains("test") || u["Email"].AsString.Contains("creator") || u["Email"].AsString.Contains("sp") || u["Email"].AsString.Contains("investor")))
                seedCount++;
        }
        _output.WriteLine($"[13] Pending+Promoted (Total {pendingPromotedUsers.Count}): Seed/Test={seedCount}, EmailConfirmed={withEmailConfirmed}, PhoneConfirmed={withPhoneConfirmed}");

        var rejectedPromotedUsers = await collection.Find(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Eq("Kyc.Status", 2),
            Builders<BsonDocument>.Filter.Gte("Onboarding.Phase", 1)
        )).ToListAsync();
        _output.WriteLine($"[14] Rejected+Promoted count: {rejectedPromotedUsers.Count}");
        foreach (var ru in rejectedPromotedUsers)
        {
            string email = ru.Contains("Email") && !ru["Email"].IsBsonNull ? ru["Email"].AsString : "unknown";
            string role = ru.Contains("User") && !ru["User"].IsBsonNull ? ru["User"].AsString : "unknown";
            string phase = ru.Contains("Onboarding") && ru["Onboarding"].IsBsonDocument && ru["Onboarding"]["Phase"].IsInt32 ? ru["Onboarding"]["Phase"].AsInt32.ToString() : "unknown";
            _output.WriteLine($"    - User: Role={role}, Phase={phase}, EmailDomain={email.Split('@').LastOrDefault()}");
        }

        totalUsers.Should().BeGreaterThan(0);
    }
}
