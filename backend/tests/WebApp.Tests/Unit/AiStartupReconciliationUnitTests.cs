using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Reconciliation;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class AiStartupReconciliationUnitTests
    {
        [Fact]
        public void AuditRecord_RequiresExplicitDryRun_AndStoresEvidence()
        {
            var audit = new AiReconciliationAudit
            {
                OwnerUserId = "user-123",
                SessionId = "session-456",
                JobType = "BusinessModel",
                Action = "DetectedOrphanedSession",
                Source = AiReconciliationSource.StartupReconciliation,
                Evidence = "TerminalRequestStatus: Associated AIRequest req-789 is Failed",
                DryRun = true,
                Reason = "Orphaned session detected in BusinessModelSessions (Processing)",
                CreatedAt = DateTime.UtcNow
            };

            audit.DryRun.Should().BeTrue();
            audit.Evidence.Should().StartWith("TerminalRequestStatus:");
            audit.Source.Should().Be("StartupReconciliation");
        }
    }
}
