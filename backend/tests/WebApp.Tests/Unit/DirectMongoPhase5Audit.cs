using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Driver;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests.Unit;

public class DirectMongoPhase5Audit
{
    private readonly ITestOutputHelper _output;
    private const string MongoConnectionString = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
    private const string DatabaseName = "MondialEcoDev";

    public DirectMongoPhase5Audit(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task AuditPhase5MongoCollectionsAndIntegrity()
    {
        var client = new MongoClient(MongoConnectionString);
        var db = client.GetDatabase(DatabaseName);

        _output.WriteLine("=== DIRECT MONGODB PHASE 5 AUDIT ===");

        // 1. ContentReports Collection & Indexes
        var reportsCol = db.GetCollection<BsonDocument>("ContentReports");
        var reportsCount = await reportsCol.CountDocumentsAsync(new BsonDocument());
        _output.WriteLine($"ContentReports total count: {reportsCount}");

        var reportIndexes = await (await reportsCol.Indexes.ListAsync()).ToListAsync();
        _output.WriteLine("ContentReports Indexes:");
        foreach (var idx in reportIndexes)
        {
            _output.WriteLine($"  - {idx.GetValue("name")}: {idx.GetValue("key")}");
        }

        // 2. AdminAuditLogs Collection & Indexes
        var auditCol = db.GetCollection<BsonDocument>("AdminAuditLogs");
        var auditCount = await auditCol.CountDocumentsAsync(new BsonDocument());
        _output.WriteLine($"AdminAuditLogs total count: {auditCount}");

        var auditIndexes = await (await auditCol.Indexes.ListAsync()).ToListAsync();
        _output.WriteLine("AdminAuditLogs Indexes:");
        foreach (var idx in auditIndexes)
        {
            _output.WriteLine($"  - {idx.GetValue("name")}: {idx.GetValue("key")}");
        }

        // 3. Reports Status Counts
        var openCount = await reportsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Status", 0));
        var underReviewCount = await reportsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Status", 1));
        var resolvedCount = await reportsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Status", 2));
        var dismissedCount = await reportsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("Status", 3));

        _output.WriteLine($"Reports Status Breakdown: Open={openCount}, UnderReview={underReviewCount}, Resolved={resolvedCount}, Dismissed={dismissedCount}");

        // 4. Data Integrity Checks
        var nullReporterCount = await reportsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("ReporterUserId", BsonNull.Value),
            Builders<BsonDocument>.Filter.Eq("ReporterUserId", "")
        ));
        var nullTargetCount = await reportsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("TargetId", BsonNull.Value),
            Builders<BsonDocument>.Filter.Eq("TargetId", "")
        ));
        var nullCreatedAtCount = await reportsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("CreatedAt", BsonNull.Value));

        _output.WriteLine($"Integrity stats: NullReporter={nullReporterCount}, NullTarget={nullTargetCount}, NullCreatedAt={nullCreatedAtCount}");

        nullReporterCount.Should().Be(0);
        nullTargetCount.Should().Be(0);
        nullCreatedAtCount.Should().Be(0);

        // 5. Sensitive data check in AdminAuditLogs
        var sensitiveFilter = Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Exists("Details.PasswordHash"),
            Builders<BsonDocument>.Filter.Exists("Details.SecurityStamp"),
            Builders<BsonDocument>.Filter.Exists("Details.Secret"),
            Builders<BsonDocument>.Filter.Exists("Details.Token"),
            Builders<BsonDocument>.Filter.Exists("Details.Jwt"),
            Builders<BsonDocument>.Filter.Exists("Details.RefreshToken")
        );
        var sensitiveCount = await auditCol.CountDocumentsAsync(sensitiveFilter);
        _output.WriteLine($"Sensitive fields found in AdminAuditLogs: {sensitiveCount}");
        sensitiveCount.Should().Be(0);
    }
}
