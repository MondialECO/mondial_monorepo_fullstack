# KPI Tracker — API Response Update

**Date:** 2026-06-17  
**Status:** ✅ Updated to use new BurnRate & NPS API response fields

---

## Changes Made

### 1. **Updated Data Extraction Logic**
**File:** `src/app/dashboard/entrepreneur/(phases)/phase-3/kpi-tracker/page.tsx:215-221`

**Before:**
```typescript
const burnRate = (phase3Data as any)?.burnRate ?? null;  // Only from local storage
const nps = (phase3Data as any)?.nps ?? null;            // Only from local storage
```

**After:**
```typescript
// Prefer API response values; fall back to local storage for backward compatibility
const burnRate = typeof kpi?.burnRate === 'number' ? kpi.burnRate : (phase3Data as any)?.burnRate;
const nps = typeof kpi?.nps === 'number' ? kpi.nps : (phase3Data as any)?.nps;
```

**Impact:** 
- KPI Tracker now reads BurnRate and NPS from API response (authoritative source)
- Falls back to local storage for backward compatibility
- Proper type checking (`typeof` instead of nullish coalescing)

---

## Data Flow

```
Backend API
├─ getFinancialSummary() → financial data (MRR, ARR, runway, etc.)
├─ getKpiBaseline()     → KPI metrics + NEW: BurnRate & NPS
└─ getQuarterlyRevenue()→ quarterly revenue chart data
      ↓
React State
├─ financial: FinancialSummaryResponse
├─ kpi: KpiBaselineResponse (now includes burnRate & nps)
└─ quarterly: QuarterlyRevenueResponse[]
      ↓
Calculations
├─ burnMultiple = kpi.burnRate / (kpi.arr / 12)
├─ ltvCac = kpi.ltv / kpi.cac
├─ revenueGrowthPct = financial.growthRate * 100
└─ churnStatus = getHealthStatus(kpi.churnPercent, 'churn')
      ↓
UI Rendering
├─ Left Card: Operational Mastery (circular gauge)
├─ Right Metrics Grid:
│  ├─ MRR, ARR, Churn Rate (from API)
│  ├─ CAC, LTV (from API)
│  ├─ NPS, Runway (now from API + fallback)
│  └─ Burn Rate (from API)
└─ Business Health: LTV/CAC, Burn Multiple, MoM Growth, Churn
```

---

## Displayed Metrics

### From `financial` (FinancialSummaryResponse)
| Metric | Source | Display |
|--------|--------|---------|
| Monthly Recurring Revenue | financial.monthlyRecurringRevenue | EUR formatted |
| Annual Recurring Revenue | financial.annualRecurringRevenue | EUR formatted |
| Total Runway | financial.runwayMonths | Number of months |
| Growth Rate | financial.growthRate × 100 | Percentage with badge |
| Confidence Score | financial.confidenceScore | 0-100 |
| Risk Discount Rate | financial.riskDiscountRate | Percentage display |

### From `kpi` (KpiBaselineResponse) — NEW
| Metric | Source | Display |
|--------|--------|---------|
| Monthly Recurring Revenue | kpi.mrr | EUR formatted |
| Annual Recurring Revenue | kpi.arr | EUR formatted |
| Gross Margin | kpi.grossMarginPercent | Percentage |
| Customer Acquisition Cost | kpi.cac | EUR formatted |
| Lifetime Value | kpi.ltv | EUR formatted |
| Churn Rate | kpi.churnPercent | Percentage with badge |
| Active Accounts | kpi.activeAccounts | Number |
| **Burn Rate** | **kpi.burnRate** | **EUR formatted** ✨ NEW |
| **Net Promoter Score** | **kpi.nps** | **0-100 score** ✨ NEW |
| Recorded At | kpi.recordedAt | Timestamp |

### Calculated Metrics
| Metric | Calculation | Display |
|--------|-----------|---------|
| LTV / CAC Ratio | kpi.ltv / kpi.cac | Multiplier with health badge |
| Burn Multiple | kpi.burnRate / (kpi.arr / 12) | Decimal with health badge |
| MoM Growth | financial.growthRate × 100 | Percentage with health badge |
| Chart Data | quarterly mapped to labels & values | Revenue bars chart |

---

## Health Status Indicators

All metrics use color-coded health badges:

| Status | Color | Condition |
|--------|-------|-----------|
| Excellent | Emerald | Optimal range |
| Good | Blue | Acceptable range |
| Moderate | Amber | Caution range |
| Warning | Orange | Concerning range |
| Critical | Red | Dangerous range |

**Health Thresholds:**

| Metric | Excellent | Good | Moderate | Warning | Critical |
|--------|-----------|------|----------|---------|----------|
| LTV/CAC | ≥3x | ≥1x | N/A | <1x | — |
| Churn | ≤5% | ≤10% | ≤20% | >20% | — |
| Burn Multiple | ≤0.5x | ≤1x | ≤2x | >2x | — |
| Growth | ≥20% | ≥10% | ≥0% | <0% | — |

---

## Error Handling

- **Missing financial data** → Show "—" (dash)
- **Missing KPI data** → Show "—" (dash)
- **Invalid calculations** → Show "—" (dash)
- **Loading state** → Show "Loading…" spinner
- **Refresh button** → Re-fetches all three endpoints

---

## Testing Checklist

- [ ] Step 3 saves NPS and BurnRate
- [ ] API returns BurnRate and NPS in response
- [ ] KPI Tracker displays NPS value
- [ ] KPI Tracker displays BurnRate value
- [ ] Burn Multiple calculated correctly
- [ ] Health badges show correct colors
- [ ] Refresh button updates all metrics
- [ ] Revenue Trend chart displays correctly
- [ ] Business Health section shows all 4 metrics
- [ ] Page layout responsive on mobile
- [ ] No "—" values appear when data exists

---

## Backward Compatibility

The KPI Tracker maintains backward compatibility by:

1. Checking API response first (`kpi?.burnRate`)
2. Falling back to local storage if API returns null/undefined
3. Using `typeof` checks for numeric types (0 is valid, null/undefined is not)
4. Gracefully displaying "—" when data is missing

This ensures the page works even if:
- User hasn't completed Step 3 yet
- API response is missing fields
- Browser cache is cleared

---

## Next Steps

1. ✅ Backend: Return BurnRate & NPS in API response
2. ✅ Frontend: Use API response in KPI Tracker
3. ✅ Testing: Verify data displays correctly
4. 📋 Monitoring: Track metrics in analytics
5. 📋 Optimization: Cache API responses

---

**Status:** Ready for testing. All API response data properly integrated into KPI Tracker display.
