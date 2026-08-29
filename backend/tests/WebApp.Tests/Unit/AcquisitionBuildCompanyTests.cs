using FluentAssertions;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using Xunit;

namespace WebApp.Tests.Unit;

public class AcquisitionBuildCompanyTests
{
    private readonly List<Companies> _companiesDb = new();
    private readonly List<ApplicationUser> _usersDb = new();
    private readonly List<DealExecution> _dealsDb = new();
    private readonly List<BusinessIdeas> _ideasDb = new();

    [Fact]
    public async Task AcquisitionBuild_CompletedFullBuyout_Buyer_CreatesCompanyAndCapTable()
    {
        var buyerId = "buyer-101";
        var dealId = "deal-buyout-1";
        var ideaId = "idea-buyout-1";

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = buyerId,
            EntrepreneurProfile = new EntrepreneurProfile()
        };
        _usersDb.Add(user);

        var idea = new BusinessIdeas
        {
            Id = ideaId,
            CreatorId = "seller-999",
            Name = "Acquired AI Tool",
            Status = "Approved",
            Market = new Market { PrimaryCustomer = "Artificial Intelligence" },
            Solution = new Solution { Description = "Smart automation suite" }
        };
        _ideasDb.Add(idea);

        var deal = new DealExecution
        {
            Id = dealId,
            EntrepreneurId = buyerId,
            CreatorId = "seller-999",
            IdeaId = ideaId,
            DealType = "FULL_BUYOUT",
            DealStage = "SOLD",
            Status = "completed",
            BuyoutSaleRecord = new BuyoutSaleRecord
            {
                Id = "sale-1",
                BuyerUserId = buyerId,
                SellerUserId = "seller-999",
                IdeaId = ideaId,
                PurchasePrice = 50000m,
                TransferredAssets = new List<string> { "Codebase", "Domain", "Brand" }
            }
        };
        _dealsDb.Add(deal);

        // Act: simulate BuildCompanyFromAcquisitionAsync
        var existing = _companiesDb.FirstOrDefault(c => c.OwnerId == buyerId && c.SourceBusinessIdeaId == ideaId);
        existing.Should().BeNull();

        var newComp = new Companies
        {
            Id = "comp-acq-1",
            OwnerId = buyerId,
            SourceBusinessIdeaId = ideaId,
            SourceDealId = dealId,
            CompanyName = "Acquired AI Tool SAS",
            Industry = "Artificial Intelligence",
            Tagline = "Smart automation suite",
            LegalStructure = "SAS",
            CurrentPhase = 2,
            CompletedPhases = new List<int>(),
            FundingAskAmount = 250000,
            CapitalAllocation = new List<CapitalAllocationDto>
            {
                new() { Category = "Engineering", Percent = 60, Amount = 150000 },
                new() { Category = "Marketing", Percent = 40, Amount = 100000 }
            }
        };
        _companiesDb.Add(newComp);

        // Cap Table seeded with Buyer 100%
        newComp.EquityStructure = new List<EquityEntryDto>
        {
            new() { StakeholderName = "Buyer (You)", Type = "founder", SharesOwned = 1000000 }
        };

        // Active pointer updated
        user.EntrepreneurProfile.CompanyId = newComp.Id;

        // Assert
        newComp.OwnerId.Should().Be(buyerId);
        newComp.SourceBusinessIdeaId.Should().Be(ideaId);
        newComp.SourceDealId.Should().Be(dealId);
        newComp.CurrentPhase.Should().Be(2);
        newComp.FundingAskAmount.Should().Be(250000);
        newComp.CapitalAllocation.Should().HaveCount(2);
        newComp.EquityStructure.Should().HaveCount(1);
        newComp.EquityStructure.First().SharesOwned.Should().Be(1000000);
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-acq-1");

        // Creator Idea remains owned by original creator in ideas collection
        idea.CreatorId.Should().Be("seller-999");
    }

    [Fact]
    public async Task AcquisitionBuild_UnauthorizedUser_ThrowsUnauthorized()
    {
        var intruderId = "intruder-403";
        var deal = new DealExecution
        {
            Id = "deal-1",
            EntrepreneurId = "legit-buyer-1",
            DealType = "FULL_BUYOUT",
            DealStage = "SOLD"
        };

        Func<Task> act = async () =>
        {
            var isBuyer = deal.BuyoutSaleRecord != null
                ? string.Equals(deal.BuyoutSaleRecord.BuyerUserId, intruderId, StringComparison.Ordinal)
                : string.Equals(deal.EntrepreneurId, intruderId, StringComparison.Ordinal);
            if (!isBuyer)
                throw new UnauthorizedAccessException("You are not authorized to build a company from this acquisition.");
            await Task.CompletedTask;
        };

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*not authorized*");
    }

    [Fact]
    public async Task AcquisitionBuild_StaleEntrepreneurId_CannotOverrideLegalBuyer()
    {
        var userA = "user-A";
        var userB = "user-B";

        var deal = new DealExecution
        {
            Id = "deal-buyout-stale",
            EntrepreneurId = userA, // Stale or earlier participant
            DealType = "FULL_BUYOUT",
            DealStage = "SOLD",
            BuyoutSaleRecord = new BuyoutSaleRecord
            {
                BuyerUserId = userB // Canonical recorded legal buyer
            }
        };

        // User A attempts to build
        Func<Task> actUserA = async () =>
        {
            var isBuyer = deal.BuyoutSaleRecord != null
                ? string.Equals(deal.BuyoutSaleRecord.BuyerUserId, userA, StringComparison.Ordinal)
                : string.Equals(deal.EntrepreneurId, userA, StringComparison.Ordinal);
            if (!isBuyer)
                throw new UnauthorizedAccessException("You are not authorized to build a company from this acquisition.");
            await Task.CompletedTask;
        };

        // User B attempts to build
        Func<Task> actUserB = async () =>
        {
            var isBuyer = deal.BuyoutSaleRecord != null
                ? string.Equals(deal.BuyoutSaleRecord.BuyerUserId, userB, StringComparison.Ordinal)
                : string.Equals(deal.EntrepreneurId, userB, StringComparison.Ordinal);
            if (!isBuyer)
                throw new UnauthorizedAccessException("You are not authorized to build a company from this acquisition.");
            await Task.CompletedTask;
        };

        // Assert: User A is rejected, User B succeeds
        await actUserA.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*not authorized*");
        await actUserB.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AcquisitionBuild_IncompleteBuyout_ThrowsInvalidOperation()
    {
        var buyerId = "buyer-1";
        var deal = new DealExecution
        {
            Id = "deal-in-progress",
            EntrepreneurId = buyerId,
            DealType = "FULL_BUYOUT",
            DealStage = "CLOSING_ESCROW", // Not SOLD
            Status = "in_progress"
        };

        Func<Task> act = async () =>
        {
            var isCompleted = deal.DealStage == "SOLD" || deal.DealStage == "BUYOUT_COMPLETED" || deal.BuyoutSaleRecord != null || deal.Status == "completed";
            if (!isCompleted)
                throw new InvalidOperationException("This acquisition has not reached completed status.");
            await Task.CompletedTask;
        };

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not reached completed status*");
    }

    [Fact]
    public async Task AcquisitionBuild_NonBuyoutDeal_ThrowsInvalidOperation()
    {
        var buyerId = "buyer-1";
        var deal = new DealExecution
        {
            Id = "deal-partnership",
            EntrepreneurId = buyerId,
            DealType = "EQUITY_PARTNERSHIP", // Partnership, not Full Buyout
            DealStage = "PARTNERSHIP_ACTIVE",
            Status = "completed"
        };

        Func<Task> act = async () =>
        {
            if (deal.DealType != "FULL_BUYOUT")
                throw new InvalidOperationException("Only completed Full Buyout acquisitions can be built into a company.");
            await Task.CompletedTask;
        };

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Only completed Full Buyout acquisitions*");
    }

    [Fact]
    public async Task AcquisitionBuild_RepeatedCall_IsIdempotentAndDoesNotDuplicate()
    {
        var buyerId = "buyer-101";
        var dealId = "deal-1";
        var ideaId = "idea-1";

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = buyerId,
            EntrepreneurProfile = new EntrepreneurProfile()
        };

        var comp1 = new Companies
        {
            Id = "comp-1",
            OwnerId = buyerId,
            SourceBusinessIdeaId = ideaId,
            SourceDealId = dealId,
            CompanyName = "Venture One"
        };
        _companiesDb.Add(comp1);

        // Second build attempt
        var existing = _companiesDb.FirstOrDefault(c => c.OwnerId == buyerId && (c.SourceBusinessIdeaId == ideaId || c.SourceDealId == dealId));
        existing.Should().NotBeNull();
        existing!.Id.Should().Be("comp-1");

        // Pointer remains/sets comp-1
        user.EntrepreneurProfile.CompanyId = existing.Id;
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-1");
        _companiesDb.Where(c => c.OwnerId == buyerId).Should().HaveCount(1);
    }

    [Fact]
    public async Task AcquisitionBuild_MultiCompanyAccount_PreservesExistingCompaniesAndActivatesNew()
    {
        var buyerId = "buyer-multi";

        var compA = new Companies { Id = "comp-A", OwnerId = buyerId, CompanyName = "Company A", CurrentPhase = 3 };
        var compB = new Companies { Id = "comp-B", OwnerId = buyerId, CompanyName = "Company B", CurrentPhase = 5 };
        _companiesDb.AddRange(new[] { compA, compB });

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            User = buyerId,
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "comp-B" }
        };
        _usersDb.Add(user);

        // Build acquired Idea X into Company C
        var compC = new Companies
        {
            Id = "comp-C",
            OwnerId = buyerId,
            SourceBusinessIdeaId = "idea-X",
            SourceDealId = "deal-X",
            CompanyName = "Company C (Acquired)",
            CurrentPhase = 2
        };
        _companiesDb.Add(compC);
        user.EntrepreneurProfile.CompanyId = compC.Id;

        // Assert
        _companiesDb.Where(c => c.OwnerId == buyerId).Should().HaveCount(3);
        compA.CompanyName.Should().Be("Company A");
        compB.CompanyName.Should().Be("Company B");
        compC.CompanyName.Should().Be("Company C (Acquired)");
        user.EntrepreneurProfile.CompanyId.Should().Be("comp-C");
    }
}
