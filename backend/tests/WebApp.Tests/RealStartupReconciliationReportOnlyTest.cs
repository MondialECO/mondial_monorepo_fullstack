using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Reconciliation;
using WebApp.Services.Repository.Ai;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests
{
    public class RealStartupReconciliationReportOnlyTest
    {
        private readonly ITestOutputHelper _output;

        public RealStartupReconciliationReportOnlyTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task RealMongo_RunStartupReconciliation_ReportOnly_DetectsAndLogsFindings()
        {
            var connStr = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/?retryWrites=true&w=majority";
            var client = new MongoClient(connStr);
            var db = client.GetDatabase("MondialEcoDev");

            var requestsRepo = new AiRequestRepository(db);
            var creditLedgerRepo = new AiCreditLedgerRepository(db);
            var auditRepo = new AiReconciliationAuditRepository(db);

            // Clean audit collection for fresh report
            await db.GetCollection<AiReconciliationAudit>("AiReconciliationAudits")
                .DeleteManyAsync(Builders<AiReconciliationAudit>.Filter.Empty);

            var reconciliationService = new AiStartupReconciliationService(
                db,
                requestsRepo,
                creditLedgerRepo,
                auditRepo,
                NullLogger<AiStartupReconciliationService>.Instance);

            _output.WriteLine("==================================================================");
            _output.WriteLine("STARTING CLEAN TIER 2 STARTUP RECONCILIATION SWEEP (REPORT-ONLY)");
            _output.WriteLine("==================================================================");

            // Execute the sweep
            await reconciliationService.RunSweepAsync(CancellationToken.None);

            var audits = await auditRepo.GetRecentAsync(100);

            _output.WriteLine("\n==================================================================");
            _output.WriteLine($"CLEAN REPORT-ONLY AUDIT FINDINGS: {audits.Count}");
            _output.WriteLine("==================================================================");

            int index = 1;
            foreach (var audit in audits)
            {
                _output.WriteLine($"[{index++}] Action: {audit.Action}");
                _output.WriteLine($"    Source: {audit.Source}");
                _output.WriteLine($"    DryRun: {audit.DryRun}");
                _output.WriteLine($"    Evidence: {audit.Evidence}");
                _output.WriteLine($"    OwnerUserId: {audit.OwnerUserId}");
                _output.WriteLine($"    JobType: {audit.JobType ?? "N/A"}");
                _output.WriteLine($"    SessionId: {audit.SessionId ?? "N/A"}");
                _output.WriteLine($"    RequestId: {audit.RequestId ?? "N/A"}");
                _output.WriteLine($"    OperationId: {audit.OperationId ?? "N/A"}");
                _output.WriteLine($"    Amount: {audit.Amount?.ToString() ?? "N/A"} credits");
                _output.WriteLine($"    Reason: {audit.Reason}");
                _output.WriteLine($"    CreatedAt: {audit.CreatedAt:O}");
                _output.WriteLine("------------------------------------------------------------------");
            }

            // Contract assertions
            foreach (var audit in audits)
            {
                audit.DryRun.Should().BeTrue("Tier 2 MUST run in DryRun / report-only mode");
                audit.Source.Should().Be(AiReconciliationSource.StartupReconciliation);
                audit.Evidence.Should().NotBeNullOrWhiteSpace();
            }
        }
    }
}
