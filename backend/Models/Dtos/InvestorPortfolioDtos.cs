using System;
using System.Collections.Generic;

namespace WebApp.Models.Dtos;

public class CompanyPortfolioHoldingDto
{
    public string HoldingId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? LogoUrl { get; set; }
    public double InvestmentAmount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string InstrumentType { get; set; } = "equity";
    public double? EquityPercentage { get; set; }
    public double? EntryValuation { get; set; }
    public double? ValuationCap { get; set; }
    public double? DiscountRate { get; set; }
    public double? InterestRate { get; set; }
    public DateTime? MaturityDate { get; set; }
    public string DealExecutionId { get; set; } = string.Empty;
    public string? MatchId { get; set; }
    public string InvestmentDate { get; set; } = string.Empty;
    public DateTime? ClosedAt { get; set; }
    public string DealStatus { get; set; } = "completed";
    public string Status { get; set; } = "active";
}

public class InvestorPortfolioResponse
{
    public List<CompanyPortfolioHoldingDto> CompanyHoldings { get; set; } = new();
    public List<object> IdeaInvestments { get; set; } = new();
    public double TotalInvested { get; set; }
    public int CompaniesCount { get; set; }
    public int TotalHoldingsCount { get; set; }
}

public class InvestorStatsResponse
{
    public double TotalInvested { get; set; }
    public double? PortfolioValue { get; set; }
    public int CompaniesInvested { get; set; }
    public int NumberOfInvestments { get; set; }
    public int ActiveInvestments { get; set; }
    public double? AverageROI { get; set; }
    public Dictionary<string, int> InstrumentBreakdown { get; set; } = new();
    public List<object> Investments { get; set; } = new();
    public List<CompanyPortfolioHoldingDto> CompanyHoldings { get; set; } = new();
}
