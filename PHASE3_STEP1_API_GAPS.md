# Phase 3 Step 1 — API Data Gaps

## Current Data Flow

### ✅ What IS Being Fetched

| Field | API Call | Source | Used For |
|-------|----------|--------|----------|
| `companyId` | `getCurrentPhase()` | Response: `companyId` | Route all other calls |
| `isInvestorReady` | `getCurrentPhase()` | Response: `isInvestorReady` | "Verification Status" card |
| `monthlyRevenue[]` | `getMonthlyRevenue(companyId)` | Response: array of `{yearMonth, revenue}` | Pre-fill monthly breakdown table |
| `growthRate` | `getFinancialSummary(companyId)` | Response: `growthRate` | "Financial Health" card |
| `finalValuation` | `getFinancialSummary(companyId)` | Response: `finalValuation` | "Financial Health" card (estimated valuation) |

---

## ❌ What Is MISSING (Should Be Fetched But Aren't)

### Missing GET Endpoints Needed

```typescript
// These endpoints don't exist in api-entrepreneur.ts
// But the frontend should fetch them on initial load:

❌ getRevenue(companyId): Promise<{
  q1Revenue: number,
  q2Revenue: number,
  q3Revenue: number,
  q4Revenue: number
}>

❌ getCashPosition(companyId): Promise<{
  currentFunds: number,
  monthlyBurn: number
}>
```

### Current Form State (Empty on Load)

```typescript
// Lines 39-44 — Initialized empty, NEVER populated from API
const [q1, setQ1] = useState('');      // ❌ Empty, user must enter
const [q2, setQ2] = useState('');      // ❌ Empty, user must enter
const [q3, setQ3] = useState('');      // ❌ Empty, user must enter
const [q4, setQ4] = useState('');      // ❌ Empty, user must enter
const [currentFunds, setCurrentFunds] = useState('');      // ❌ Empty, user must enter
const [monthlyBurn, setMonthlyBurn] = useState('');        // ❌ Empty, user must enter
```

---

## What SHOULD Happen (Currently Doesn't)

### Ideal Initial Load Flow

```
useEffect on mount:
  ├─ GET /companies/current-phase
  │  └─ companyId, isInvestorReady
  │
  ├─ Promise.allSettled([
  │  ├─ GET /companies/{id}/revenue          ← ❌ MISSING
  │  │  └─ q1, q2, q3, q4 → setQ1, setQ2, setQ3, setQ4
  │  │
  │  ├─ GET /companies/{id}/cash-position    ← ❌ MISSING
  │  │  └─ currentFunds, monthlyBurn → setState
  │  │
  │  ├─ GET /companies/{id}/monthly-revenue
  │  │  └─ monthlyRows → setMonthlyRows()  ✅ Already done
  │  │
  │  └─ GET /companies/{id}/financial-summary
  │     └─ growthRate, finalValuation → setFinancial()  ✅ Already done
  │
  └─ Display all fields pre-filled with saved data
```

---

## Impact on User Experience

### Current Behavior ❌
1. User navigates to Phase 3 Step 1
2. Form is completely empty
3. User has to re-enter Q1-Q4 again (even if previously saved)
4. User has to re-enter current funds & monthly burn again

### Expected Behavior ✅
1. User navigates to Phase 3 Step 1
2. Form is pre-filled with previously saved values
3. User can review, edit, or recalculate
4. Much better UX — no re-entering data

---

## Solution: Add Missing API Endpoints

### Backend (.NET) needs to provide:

```typescript
// Add to api-entrepreneur.ts

getRevenue: async (companyId: string): Promise<SaveRevenueDataRequest> => {
  const response = await api.get<SaveRevenueDataRequest>(
    `/companies/${companyId}/revenue`
  );
  return response.data;
},

getCashPosition: async (companyId: string): Promise<SaveCashPositionRequest> => {
  const response = await api.get<SaveCashPositionRequest>(
    `/companies/${companyId}/cash-position`
  );
  return response.data;
},
```

### Frontend changes needed:

```typescript
// In revenue-input-client.tsx useEffect (lines 55-81)

const [revenue, fin, cashPos] = await Promise.allSettled([
  entrepreneurApi.getRevenue(companyId),
  entrepreneurApi.getFinancialSummary(companyId),
  entrepreneurApi.getCashPosition(companyId),  // NEW
]);

if (revenue.status === 'fulfilled' && revenue.value) {
  setQ1(String(revenue.value.q1Revenue));
  setQ2(String(revenue.value.q2Revenue));
  setQ3(String(revenue.value.q3Revenue));
  setQ4(String(revenue.value.q4Revenue));
}

if (cashPos.status === 'fulfilled' && cashPos.value) {
  setCurrentFunds(String(cashPos.value.currentFunds));
  setMonthlyBurn(String(cashPos.value.monthlyBurn));
}
```

---

## Related Fields That SHOULD Also Be Fetched

From `FinancialSummaryResponse`, additional useful fields:

| Field | Current Status | Should Display |
|-------|----------------|----------------|
| `totalRevenue` | ✅ Fetched but NOT displayed | Summary box? |
| `monthlyRecurringRevenue` | ✅ Fetched but NOT displayed | Card above Monthly breakdown |
| `annualRecurringRevenue` | ✅ Fetched but NOT displayed | Card above Monthly breakdown |
| `runwayMonths` | ✅ Fetched but NOT displayed | Under cash position section |

---

## Priority Order for Implementation

1. **HIGH** — Add `getRevenue()` API call and populate Q1-Q4
2. **HIGH** — Add `getCashPosition()` API call and populate current funds + monthly burn
3. **MEDIUM** — Display additional financial summary fields (MRR, ARR, runway)
4. **LOW** — Add edit confirmation when user changes pre-filled values

---

## Backend API Endpoints Status

### Existing endpoints ✅
- POST `/companies/{id}/revenue` — save Q1-Q4
- POST `/companies/{id}/cash-position` — save cash position
- GET `/companies/{id}/financial-summary` — fetch valuation metrics
- GET `/companies/{id}/monthly-revenue` — fetch monthly breakdown

### Missing endpoints ❌
- **GET `/companies/{id}/revenue`** — retrieve saved Q1-Q4
- **GET `/companies/{id}/cash-position`** — retrieve saved cash position

---

## Summary

The frontend Step 1 form is currently a **write-only** interface:
- Saves data to backend ✅
- Fetches related metrics ✅
- **But does NOT fetch back previously entered data** ❌

This is a **critical UX gap**. When users return to edit their revenue data, they should see their previous entries pre-filled, not a blank form.
