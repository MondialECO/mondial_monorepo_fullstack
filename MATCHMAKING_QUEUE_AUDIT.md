# MatchmakingQueue Collection Audit

**Date:** 2026-06-16  
**Scope:** Infrastructure, schema, enqueue logic, consumer status  
**Status:** ⚠️ **PARTIAL** — Producer implemented, consumer NOT YET BUILT

---

## Executive Summary

**MatchmakingQueue** is an **outbox collection** for Phase 3 completion events:
- ✅ **Schema:** Fully defined (MatchmakingQueueItem model)
- ✅ **Registration:** Configured in MongoDbContext
- ✅ **Producer:** Phase3CompletionEvents enqueues items when Phase 3 completes
- ⚠️ **Consumer:** NOT YET BUILT — items sit in queue unprocessed

**Current state:** Queue grows indefinitely. No scheduled job or endpoint consumes items.

---

## 1. Collection Definition

### Model (Phase3Models.cs, lines 84–101)

```csharp
public class MatchmakingQueueItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }

    /// <summary>The "matchmaking.entrepreneur.update" payload.</summary>
    public BsonDocument Payload { get; set; }

    public string Status { get; set; } = "pending";  // pending | processed | failed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### Fields

| Field | Type | Purpose | Set By |
|-------|------|---------|--------|
| `Id` | string (ObjectId) | Primary key | MongoDB (auto-generated) |
| `CompanyId` | string | Reference to Companies collection | Phase3CompletionEvents |
| `Payload` | BsonDocument | Matchmaking data (financials, KPIs, concept, scores) | Phase3CompletionEvents |
| `Status` | string | "pending" \| "processed" \| "failed" | Phase3CompletionEvents (pending) \| **Consumer (unimplemented)** |
| `CreatedAt` | DateTime | When item was enqueued | Phase3CompletionEvents (DateTime.UtcNow) |

### Payload Structure

**Built by Phase3CompletionEvents.cs lines 56–96:**

```csharp
var payload = new BsonDocument
{
  { "entrepreneur_id", company.Id },
  { "phase3_complete", true },
  
  { "financials", new BsonDocument
    {
      { "TTM_revenue", ttm },                           // Sum of Q1–Q4
      { "avg_quarterly_growth", growthPct },           // Avg of 3 QoQ rates
      { "final_valuation", company.Valuation ?? 0 },
      { "valuation_currency", "EUR" },
      { "sector_multiplier", company.ValuationRevenueMultiple ?? 0 },
      { "risk_discount_rate", company.ValuationRiskDiscountRate ?? 0 },
    }
  },
  
  { "kpis", new BsonDocument
    {
      { "MRR", kpi?.Mrr ?? 0 },
      { "ARR", kpi?.Arr ?? 0 },
      { "LTV_CAC_ratio", ltvCac },                     // Or BsonNull if CAC ≤ 0
      { "burn_multiple", burnMultiple },               // Or BsonNull if no burn/ARR
      { "churn_rate", kpi?.ChurnPercent ?? 0 },
      { "NPS", company.Nps.HasValue ? new BsonInt32(company.Nps.Value) : BsonNull.Value },
      { "data_source", "manual" },
    }
  },
  
  { "concept", new BsonDocument
    {
      { "stage", Str(concept?.Stage) },               // idea | mvp | beta | revenue | growth
      { "business_model", Str(concept?.BusinessModel) },
      { "sector_tags", new BsonArray(concept?.SectorTags ?? new List<string>()) },
      { "keyword_tags", new BsonArray(concept?.KeywordTags ?? new List<string>()) },
    }
  },
  
  { "scores", new BsonDocument
    {
      { "investor_ready_score", newInvestorReady },   // Clamped 0–100
      { "trust_score", newTrust },                     // Clamped 0–100
      { "phase3_overall_score", 100 },                // Always 100 on completion
    }
  },
};
```

**Total size:** ~500 bytes per item (rough estimate)

---

## 2. Enqueue Logic (Producer)

### When Items Are Enqueued

**Trigger:** Phase3CompletionEvents.RunAsync (CompanyService.cs line 99)

```csharp
if (phaseToComplete == 3)
    await Phase3CompletionEvents.RunAsync(_dbContext, company);
```

**Called when:** AdvancePhaseAsync succeeds with phaseToComplete=3

### Enqueue Code (Phase3CompletionEvents.cs lines 98–104)

```csharp
await db.MatchmakingQueue.InsertOneAsync(new MatchmakingQueueItem
{
    CompanyId = company.Id,
    Payload = payload,
    Status = "pending",
    CreatedAt = DateTime.UtcNow,
});
```

### Production Guarantee

✅ **Enqueue is atomic:** Single InsertOneAsync call per Phase 3 completion
✅ **One item per company:** CompanyId in payload ensures deduping is possible downstream
✅ **Immutable payload:** No updates after enqueue (only consumer should modify Status)
✅ **Error handling:** Entire block in try/catch (line 106); exceptions swallowed, phase advance continues

### Test Coverage

No unit tests for MatchmakingQueue enqueue logic (Phase3CompletionEvents lacks test suite).

**Risk:** Items enqueued but never verified to be correct shape or size.

---

## 3. Consumer Status

### Current State: ❌ NOT BUILT

| Aspect | Status | Details |
|--------|--------|---------|
| **Scheduled job** | ❌ | No background worker / scheduled task |
| **REST API endpoint** | ❌ | No GET/POST endpoint to fetch/process items |
| **Service implementation** | ❌ | No MatchmakingService or consumer logic |
| **Processing logic** | ❌ | No code to read "pending" items and update Status |
| **Downstream action** | ❌ | No investor matcher, ranking algorithm, or notification system |

### Expected Workflow (Not Implemented)

```
Scheduled Job / Message Handler (MISSING)
    ↓
Query: MatchmakingQueue.Find(x => x.Status == "pending").ToList()
    ↓
For each item:
    ├─ Parse Payload (BsonDocument → structured data)
    ├─ Extract company financials, KPIs, concept
    ├─ Run matching algorithm (MISSING) to find similar investors
    ├─ Update Status → "processed"
    └─ Create notification / InvestorMatch record
```

### Data in Queue (Post-MVP)

```
db.MatchmakingQueue.find().count()
→ Grows by 1 each time a company completes Phase 3
→ Currently: N companies × 1 item each
→ After 1 year with 500 completions: 500 items
→ Query time on "pending" filter: O(N) scan (no index on Status)
```

---

## 4. Schema & Indexing

### Registered in DbContext (MongoDbContext.cs line 43)

```csharp
public virtual IMongoCollection<MatchmakingQueueItem> MatchmakingQueue 
  => _database.GetCollection<MatchmakingQueueItem>("MatchmakingQueue");
```

### Collection Name

`MatchmakingQueue` (database: Mondial, collection: MatchmakingQueue)

### Indexes

**Current:** None explicitly created

**Recommended (if consumer is built):**

```csharp
// In MongoDbContext initialization or migration:
await MatchmakingQueue.Indexes.CreateOneAsync(
    new CreateIndexModel<MatchmakingQueueItem>(
        Builders<MatchmakingQueueItem>.IndexKeys.Ascending(x => x.Status)
    )
);

await MatchmakingQueue.Indexes.CreateOneAsync(
    new CreateIndexModel<MatchmakingQueueItem>(
        Builders<MatchmakingQueueItem>.IndexKeys.Ascending(x => x.CompanyId)
    )
);

await MatchmakingQueue.Indexes.CreateOneAsync(
    new CreateIndexModel<MatchmakingQueueItem>(
        Builders<MatchmakingQueueItem>.IndexKeys.Ascending(x => x.CreatedAt)
    )
);
```

**Why:**
- Status index: Fast filtering for "pending" items (consumer's main query)
- CompanyId index: Avoid re-enqueueing the same company twice
- CreatedAt index: Chronological processing (oldest first)

---

## 5. Integration Points

### What Reads from MatchmakingQueue

**Currently:** Nothing

### What Writes to MatchmakingQueue

**Currently:** Only Phase3CompletionEvents.RunAsync (line 98)

---

## 6. Post-MVP Roadmap

### Phase 1: Build Consumer (Estimated 2–4 weeks)

**Requirements:**
1. Scheduled job (e.g., hosted service in .NET) that runs every 5–10 minutes
2. Query pending items: `db.MatchmakingQueue.Find(x => x.Status == "pending")`
3. For each item:
   - Parse Payload → extract company profile (financials, KPIs, concept)
   - Run matching algorithm (investor finder) to score compatibility
   - Create InvestorMatch records (or update existing)
   - Update Status → "processed"
4. Error handling: catch exceptions, log, update Status → "failed"
5. Idempotency: ensure same item isn't processed twice (check Status before starting)

### Phase 2: Investor Matching Algorithm (Estimated 3–6 weeks)

**Inputs:** Company payload
- TTM revenue, growth rate, valuation
- KPIs (MRR, CAC, LTV, churn)
- Concept (stage, business model, sectors)
- Scores (investor readiness, trust)

**Output:** List of investor matches + compatibility scores

**Logic:** (TODO — research investor-founder compatibility models)

### Phase 3: Notifications (Estimated 1–2 weeks)

When a match is made:
1. Send notification to entrepreneur: "You've been matched with Investor X"
2. Create InvestorMatch record (already exists in database)
3. Trigger investor notification: "New opportunity: Company Y"

---

## 7. Risk Assessment

### Data Loss

**Risk:** Items stay in queue indefinitely if consumer never built
- **Mitigation:** Build consumer before launch (Phase 3 completion should unlock matchmaking)

### Queue Backlog

**Risk:** If consumer is slow, queue grows faster than it's processed
- **Example:** 100 Phase 3 completions/day, consumer processes 10/day → backlog grows by 90/day
- **Mitigation:** Monitor queue size; scale consumer job or batch size

### Duplicate Processing

**Risk:** Job restarts, re-processes same items
- **Mitigation:** Check Status before processing; use transactions

### Data Corruption

**Risk:** Payload is BsonDocument (untyped); consumer parses incorrectly
- **Mitigation:** Add validation layer; log malformed payloads

### Missing Indexes

**Risk:** Collection has no indexes; Status query becomes O(N) collection scan
- **Mitigation:** Add indexes before launch (see section 4)

---

## 8. Current vs. Intended State

| Aspect | Current | Intended | Gap |
|--------|---------|----------|-----|
| **Collection schema** | ✅ Defined | ✅ Ready | None |
| **Enqueue logic** | ✅ Working | ✅ Working | None |
| **Consumer job** | ❌ Missing | ✅ Running | 2–4 weeks |
| **Matching algorithm** | ❌ Missing | ✅ Implemented | 3–6 weeks |
| **Notifications** | ❌ Missing | ✅ Sent | 1–2 weeks |
| **Indexes** | ❌ None | ✅ Status/CompanyId/CreatedAt | < 1 hour |
| **Monitoring** | ❌ None | ✅ Queue size alerts | < 1 hour |

---

## 9. Audit Trail Example

### Sample Document in MatchmakingQueue

```json
{
  "_id": ObjectId("6789abcdef012345"),
  "CompanyId": "company-123",
  "Status": "pending",
  "CreatedAt": ISODate("2026-06-16T10:30:00Z"),
  "Payload": {
    "entrepreneur_id": "company-123",
    "phase3_complete": true,
    "financials": {
      "TTM_revenue": 500000,
      "avg_quarterly_growth": 0.12,
      "final_valuation": 4000000,
      "valuation_currency": "EUR",
      "sector_multiplier": 8.0,
      "risk_discount_rate": 0.08
    },
    "kpis": {
      "MRR": 41666.67,
      "ARR": 500000,
      "LTV_CAC_ratio": 3.5,
      "burn_multiple": null,
      "churn_rate": 2.5,
      "NPS": 72,
      "data_source": "manual"
    },
    "concept": {
      "stage": "growth",
      "business_model": "B2B SaaS",
      "sector_tags": ["SaaS", "AI"],
      "keyword_tags": []
    },
    "scores": {
      "investor_ready_score": 68,
      "trust_score": 40,
      "phase3_overall_score": 100
    }
  }
}
```

---

## 10. Verdict

| Category | Status | Details |
|----------|--------|---------|
| **Schema** | ✅ | Well-defined, fields normalized |
| **Producer** | ✅ | Phase3CompletionEvents enqueues correctly |
| **Registration** | ✅ | Configured in MongoDbContext |
| **Consumer** | ⚠️ **MISSING** | Not built; items accumulate |
| **Indexes** | ❌ | Not created; will slow queries at scale |
| **Testing** | ❌ | No unit tests for enqueue logic |
| **Monitoring** | ❌ | No alerts for queue size or failures |
| **Docs** | ⚠️ | Payload structure inferred from code only |

### Summary

**MatchmakingQueue is a well-designed outbox pattern, but POST-MVP.** The producer (Phase 3 completion) works correctly, but the entire consumer pipeline is unbuilt. Queue will grow to store all Phase 3 completions until consumer is implemented.

### Recommendations (Post-MVP Checklist)

- [ ] Add Status/CompanyId/CreatedAt indexes to MatchmakingQueue
- [ ] Build scheduled job to process "pending" items
- [ ] Implement investor matching algorithm
- [ ] Add notifications on match
- [ ] Add unit tests for Phase3CompletionEvents + consumer logic
- [ ] Monitor queue size in production (alert if > 1000 items or age > 1 day)
- [ ] Document payload schema in OpenAPI / Swagger

---

**Audit by:** Claude Code  
**Time:** ~20 minutes  
**Files reviewed:** 3 (Phase3Models, Phase3CompletionEvents, MongoDbContext)  
**Verdict:** Infrastructure ready; implementation deferred to Phase 8+ (investor matching).
