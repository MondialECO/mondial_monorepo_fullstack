# Phase 7 Backend — Complete Code Review

## 1. AI Review Engine (AiReviewEngine.cs)

### Entry Point: RunReviewAsync()
```csharp
public async Task<AiReviewResponse> RunReviewAsync(Companies company)
{
    return await Task.Run(() =>
    {
        var scores = CalculateScores(company);
        var overallScore = (scores.VerificationScore + scores.FinancialScore + 
                           scores.EquityScore + scores.FundingScore + 
                           scores.DataRoomScore) / 5;

        var recommendations = GenerateRecommendations(company, scores);

        return new AiReviewResponse
        {
            OverallScore = overallScore,
            ScoreBreakdown = new ScoreBreakdownDto
            {
                VerificationScore = scores.VerificationScore,
                FinancialScore = scores.FinancialScore,
                EquityScore = scores.EquityScore,
                FundingScore = scores.FundingScore,
                DataRoomScore = scores.DataRoomScore,
                OverallScore = overallScore
            },
            InvestorReadyBadge = Phase7Requirements.MeetsBadgeThreshold(overallScore),
            Recommendations = recommendations,
            ReviewedAt = DateTime.UtcNow
        };
    });
}
```

**✓ MATCHES DESIGN:**
- Calls CalculateScores()
- Averages 5 dimensions
- Auto-awards badge if score >= 70
- Returns full response DTO with timestamp

---

### Scoring Logic: CalculateScores()

```csharp
private (int V, int F, int E, int Fu, int D) CalculateScores(Companies company)
{
    // VERIFICATION (Base 50, max 100)
    int verificationScore = 50;
    if (!string.IsNullOrEmpty(company.LegalName)) verificationScore += 10;
    if (!string.IsNullOrEmpty(company.RegistrationNumber)) verificationScore += 15;
    if (company.BeneficialOwnersDto?.Count > 0) verificationScore += 15;
    if (company.DocumentStatuses?.Count > 0) verificationScore += 10;

    // FINANCIAL (Base 30, max 100)
    int financialScore = 30;
    var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + 
                       (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
    if (totalRevenue > 0) financialScore += 20;
    if (totalRevenue > 100000) financialScore += 20;
    if (company.Valuation > 0) financialScore += 15;
    if (company.CurrentFunds > 0) financialScore += 15;

    // EQUITY (Base 40, max 100)
    int equityScore = 40;
    if (company.EquityStructure?.Count > 0) equityScore += 20;
    if (company.TotalShares > 0) equityScore += 20;
    if (company.EsopPoolPercent > 0) equityScore += 20;

    // FUNDING (Base 30, max 100)
    int fundingScore = 30;
    if (company.FundingAskAmount > 0) fundingScore += 25;
    if (!string.IsNullOrEmpty(company.FundingRoundType)) fundingScore += 20;
    if (company.CapitalAllocation?.Count > 0) fundingScore += 15;
    if (company.ResourceMap?.HiringPlan?.Count > 0) fundingScore += 10;

    // DATA ROOM (Base 20, max 100)
    int dataRoomScore = 20;
    if (company.DataRoomDocuments?.Count > 0) dataRoomScore += 30;
    if (company.IsDataRoomLive) dataRoomScore += 20;
    if (company.IsDataRoomNdaRequired) dataRoomScore += 15;
    if (company.DataRoomAccessRecords?.Count > 0) dataRoomScore += 15;

    return (
        Math.Min(verificationScore, 100),
        Math.Min(financialScore, 100),
        Math.Min(equityScore, 100),
        Math.Min(fundingScore, 100),
        Math.Min(dataRoomScore, 100)
    );
}
```

**✓ MATCHES DESIGN:**
- 5 dimensions with exact base scores
- Feature-based additions per design table
- Each capped at 100
- Uses correct company fields

**VERIFICATION AGAINST DESIGN:**
| Dimension | Base | Design Points | Code Points | ✓ Match |
|-----------|------|---|---|---|
| Verification | 50 | +50 max | +50 max | ✓ |
| Financial | 30 | +70 max | +70 max | ✓ |
| Equity | 40 | +60 max | +60 max | ✓ |
| Funding | 30 | +70 max | +70 max | ✓ |
| Data Room | 20 | +80 max | +80 max | ✓ |

---

### Recommendation Logic: GenerateRecommendations()

```csharp
private List<RecommendationDto> GenerateRecommendations(
    Companies company, 
    (int V, int F, int E, int Fu, int D) scores)
{
    var recommendations = new List<RecommendationDto>();

    if (scores.V < 60)
        recommendations.Add(new RecommendationDto
        {
            Title = "Complete Legal Verification",
            Description = "Upload company registration documents and beneficial owner details to verify company legitimacy.",
            Priority = "high",
            PotentialPointGain = 20
        });

    if (scores.F < 70)
        recommendations.Add(new RecommendationDto
        {
            Title = "Improve Financial Documentation",
            Description = "Provide detailed quarterly revenue data and financial statements for investor confidence.",
            Priority = "high",
            PotentialPointGain = 25
        });

    if (scores.E < 70)
        recommendations.Add(new RecommendationDto
        {
            Title = "Finalize Cap Table",
            Description = "Define complete equity structure including founder stakes, investor allocations, and ESOP pool.",
            Priority = "high",
            PotentialPointGain = 20
        });

    if (scores.Fu < 70)
        recommendations.Add(new RecommendationDto
        {
            Title = "Clarify Use of Funds",
            Description = "Provide detailed breakdown of how capital will be allocated across operations, hiring, and growth.",
            Priority = "medium",
            PotentialPointGain = 25
        });

    if (scores.D < 70)
        recommendations.Add(new RecommendationDto
        {
            Title = "Set Up Investor Data Room",
            Description = "Upload key documents (pitch deck, financial models, term sheets) to demonstrate transparency.",
            Priority = "medium",
            PotentialPointGain = 30
        });

    if (scores.V + scores.F + scores.E + scores.Fu + scores.D < 350)
        recommendations.Add(new RecommendationDto
        {
            Title = "Strengthen Overall Profile",
            Description = "Continue completing profile sections to increase investor confidence and match quality.",
            Priority = "medium",
            PotentialPointGain = 15
        });

    return recommendations;
}
```

**✓ MATCHES DESIGN:**
- All 6 rules present
- Exact thresholds (V<60, F<70, E<70, Fu<70, D<70, sum<350)
- Correct priorities (high/medium)
- Correct point gains

---

## 2. Phase 7 Requirements (Phase7Requirements.cs)

```csharp
public static class Phase7Requirements
{
    public const int ScoreThresholdForBadge = 70;
    public const int ScoreThresholdForAdvance = 70;
    public static readonly TimeSpan MaxReviewAgeForAdvance = TimeSpan.FromDays(30);

    public static bool MeetsBadgeThreshold(int overallScore) 
        => overallScore >= ScoreThresholdForBadge;

    public static bool MeetsAdvanceThreshold(int overallScore) 
        => overallScore >= ScoreThresholdForAdvance;

    public static bool IsFreshEnough(DateTime reviewedAt, DateTime? now = null)
    {
        var ts = (now ?? DateTime.UtcNow) - reviewedAt;
        return ts <= MaxReviewAgeForAdvance;
    }
}
```

**✓ MATCHES DESIGN:**
- Both thresholds = 70
- Freshness window = 30 days
- Utility methods for gates

---

## 3. Phase 7 Validator (PhaseValidator.cs ValidatePhase7Async)

```csharp
public async Task<(bool IsValid, List<string> Errors)> ValidatePhase7Async(Companies company)
{
    return await Task.Run(() =>
    {
        var errors = new List<string>();

        // Gate 1: Review must exist
        if (company.AiReview == null)
        {
            errors.Add("Automated readiness review must be completed");
            return (false, errors);
        }

        // Gate 2: Score >= 70
        if (!Phase7Requirements.MeetsAdvanceThreshold(company.AiReview.OverallScore))
            errors.Add($"Review score must be at least {Phase7Requirements.ScoreThresholdForAdvance} " +
                      $"(currently {company.AiReview.OverallScore})");

        // Gate 3: Badge must be true
        if (!company.AiReview.InvestorReadyBadge)
            errors.Add("Latest review did not award the investor-ready badge");

        // Gate 4: Review must be fresh (<30 days)
        var reviewedAt = company.LastAiReviewAt ?? company.AiReview.ReviewedAt;
        if (!Phase7Requirements.IsFreshEnough(reviewedAt))
            errors.Add(
                $"Review is stale (run at {reviewedAt:o}, max age {Phase7Requirements.MaxReviewAgeForAdvance.TotalDays:F0} days) " +
                "— rerun before advancing");

        return (errors.Count == 0, errors);
    });
}
```

**✓ MATCHES DESIGN:**
- All 4 gates present
- Correct order & error messages
- Freshness check uses IsFreshEnough()

---

## 4. Company Service Methods (CompanyService.cs)

### RunAiReviewAsync()

```csharp
public async Task<AiReviewResponse> RunAiReviewAsync(string companyId)
{
    var company = await GetCompanyAsync(companyId);

    var review = await _aiReviewEngine.RunReviewAsync(company);

    // Mirror latest to company for cheap read path
    company.AiReview = review;
    company.LastAiReviewAt = review.ReviewedAt;
    company.UpdatedAt = DateTime.UtcNow;

    var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
    await _dbContext.Companies.ReplaceOneAsync(filter, company);

    // Persist immutable history snapshot
    var snapshot = new Phase7ReviewSnapshot
    {
        Id = ObjectId.GenerateNewId().ToString(),
        CompanyId = companyId,
        OverallScore = review.OverallScore,
        ScoreBreakdown = review.ScoreBreakdown,
        InvestorReadyBadge = review.InvestorReadyBadge,
        Recommendations = review.Recommendations ?? new List<RecommendationDto>(),
        ReviewedAt = review.ReviewedAt,
        EngineVersion = "rule_based_v1",
    };
    await _dbContext.Phase7ReviewSnapshots.InsertOneAsync(snapshot);

    return review;
}
```

**✓ MATCHES DESIGN:**
- Calls engine
- Denormalizes to Companies.AiReview
- Persists immutable Phase7ReviewSnapshot
- Sets EngineVersion = "rule_based_v1"

### GetAiReviewScoreAsync()

```csharp
public async Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId)
{
    var company = await GetCompanyAsync(companyId);
    return company.AiReview 
        ?? throw new InvalidOperationException("No automated review found for this company");
}
```

**✓ MATCHES DESIGN:**
- Fast path via denormalized Companies.AiReview
- Throws if no review exists

### GetAiReviewHistoryAsync()

```csharp
public async Task<List<Phase7ReviewSnapshot>> GetAiReviewHistoryAsync(string companyId)
{
    await GetCompanyAsync(companyId);
    return await _dbContext.Phase7ReviewSnapshots
        .Find(s => s.CompanyId == companyId)
        .SortByDescending(s => s.ReviewedAt)
        .ToListAsync();
}
```

**✓ MATCHES DESIGN:**
- Queries Phase7ReviewSnapshots
- Sorted by ReviewedAt DESC (newest first)

---

## 5. Controller Endpoints (CompanyController.cs)

### POST /companies/{companyId}/ai-review

```csharp
[HttpPost("{companyId}/ai-review")]
public async Task<ActionResult<AiReviewResponse>> RunAiReview(string companyId)
{
    try
    {
        var userId = GetUserId();
        await EnsureUniversalPhase1CompleteAsync(userId);
        await EnsureCompanyOwnershipAsync(companyId);
        var result = await _companyService.RunAiReviewAsync(companyId);
        return Ok(result);
    }
    catch (UnauthorizedAccessException ex)
    {
        _logger.LogWarning("Authorization failed: {Message}", ex.Message);
        return StatusCode(403, new { error = ex.Message });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error running AI review");
        return BadRequest(new { error = ex.Message });
    }
}
```

**✓ MATCHES DESIGN:**
- Auth: Phase 1 complete + company ownership
- Calls RunAiReviewAsync()
- Returns AiReviewResponse

### GET /companies/{companyId}/ai-review

```csharp
[HttpGet("{companyId}/ai-review")]
public async Task<ActionResult<AiReviewResponse>> GetAiReview(string companyId)
{
    try
    {
        var userId = GetUserId();
        await EnsureUniversalPhase1CompleteAsync(userId);
        await EnsureCompanyOwnershipAsync(companyId);
        var result = await _companyService.GetAiReviewScoreAsync(companyId);
        return Ok(result);
    }
    catch (UnauthorizedAccessException ex)
    {
        _logger.LogWarning("Authorization failed: {Message}", ex.Message);
        return StatusCode(403, new { error = ex.Message });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting AI review");
        return BadRequest(new { error = ex.Message });
    }
}
```

**✓ MATCHES DESIGN:**
- Auth: Phase 1 + ownership
- Calls GetAiReviewScoreAsync()

### GET /companies/{companyId}/ai-review/history

```csharp
[HttpGet("{companyId}/ai-review/history")]
public async Task<ActionResult<List<Phase7ReviewSnapshot>>> GetAiReviewHistory(string companyId)
{
    try
    {
        var userId = GetUserId();
        await EnsureUniversalPhase1CompleteAsync(userId);
        await EnsureCompanyOwnershipAsync(companyId);
        var result = await _companyService.GetAiReviewHistoryAsync(companyId);
        return Ok(result);
    }
    catch (UnauthorizedAccessException ex)
    {
        _logger.LogWarning("Authorization failed: {Message}", ex.Message);
        return StatusCode(403, new { error = ex.Message });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting AI review history");
        return BadRequest(new { error = ex.Message });
    }
}
```

**✓ MATCHES DESIGN:**
- Auth: Phase 1 + ownership
- Calls GetAiReviewHistoryAsync()

---

## 6. Data Models

### Phase7ReviewSnapshot (Phase7Models.cs)

```csharp
public class Phase7ReviewSnapshot
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }
    public int OverallScore { get; set; }
    public ScoreBreakdownDto ScoreBreakdown { get; set; }
    public bool InvestorReadyBadge { get; set; }
    public List<RecommendationDto> Recommendations { get; set; } = new();
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
    public string EngineVersion { get; set; } = "rule_based_v1";
}
```

**✓ MATCHES DESIGN:**
- Immutable snapshot fields
- EngineVersion for traceability

### DTOs (CompanyDtos.cs)

```csharp
public class AiReviewResponse
{
    public int OverallScore { get; set; }
    public ScoreBreakdownDto ScoreBreakdown { get; set; }
    public bool InvestorReadyBadge { get; set; }
    public List<RecommendationDto> Recommendations { get; set; }
    public DateTime ReviewedAt { get; set; }
}

public class ScoreBreakdownDto
{
    public int VerificationScore { get; set; }
    public int FinancialScore { get; set; }
    public int EquityScore { get; set; }
    public int FundingScore { get; set; }
    public int DataRoomScore { get; set; }
    public int OverallScore { get; set; }
}

public class RecommendationDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public string Priority { get; set; }
    public int PotentialPointGain { get; set; }
}
```

**✓ MATCHES DESIGN:**
- All fields as specified

---

## Summary: Design ↔ Implementation Alignment

| Component | Design | Implementation | Status |
|-----------|--------|-----------------|--------|
| Scoring algorithm | 5 dimensions, base+features, capped at 100 | ✓ Exact match | ✓ |
| Badge threshold | Score >= 70 | ✓ Phase7Requirements.MeetsBadgeThreshold(70) | ✓ |
| Advance threshold | Score >= 70 | ✓ Phase7Requirements.MeetsAdvanceThreshold(70) | ✓ |
| Freshness window | 30 days | ✓ TimeSpan.FromDays(30) | ✓ |
| Validator gates | 4 gates (review exists, score, badge, freshness) | ✓ All 4 present in ValidatePhase7Async | ✓ |
| Recommendations | 6 rules with hardcoded templates | ✓ All 6 rules present | ✓ |
| History snapshots | Immutable per run | ✓ Phase7ReviewSnapshots inserted per run | ✓ |
| EngineVersion | Trackable engine identifier | ✓ "rule_based_v1" set | ✓ |
| Denormalization | Companies.AiReview for fast reads | ✓ Mirrored after each run | ✓ |

**OVERALL: 100% ALIGNMENT** — Implementation matches system design precisely.

