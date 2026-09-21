# MONDIAL BUSINESS CREATION (MBC) — Phase 4.6 Mathematical & Financial Model

## 1. Price Floor Formulas (Correction #2)

Let:
- $V$ = Variable cost per unit (e.g. cloud compute, API token consumption, packaging)
- $D$ = Delivery / fulfillment cost per unit (e.g. customer success onboarding, support hours)
- $VC = V + D$ = Total Variable Cost per unit

### Case A: Percentage Contribution Margin Target ($m \in [0, 1)$)
When the target is defined as a minimum gross margin percentage $m$:
$$\text{Contribution Margin Rate} = \frac{P - VC}{P} \ge m$$
$$P (1 - m) \ge VC$$
$$P_{\min} = \frac{VC}{1 - m}$$

*Example*: If $VC = €12$ and target margin rate $m = 60\%$ ($0.60$):
$$P_{\min} = \frac{12}{1 - 0.60} = \frac{12}{0.40} = €30.00$$

### Case B: Absolute Euro Markup Target ($A > 0$)
When the target is defined as a fixed euro contribution amount $A$:
$$P - VC \ge A$$
$$P_{\min} = VC + A$$

*Example*: If $VC = €12$ and required markup $A = €25$:
$$P_{\min} = 12 + 25 = €37.00$$

---

## 2. Economic Basis Normalization for Forecast Alignment (Correction #3)

A one-time project fee cannot be directly compared against monthly ARPU.
The pricing engine normalizes both sides into identical dimensions:

| Revenue Model | Billing Period | Target Dimension | Normalization Formula |
|---|---|---|---|
| **Subscription** | Monthly | `MonthlyRevenuePerCustomer` | $P_{\text{norm}} = P$ |
| **Subscription** | Annual | `MonthlyRevenuePerCustomer` | $P_{\text{norm}} = \frac{P}{12}$ |
| **One-Time / Project Fee** | One-Off | `AverageOrderValue` | Converted via customer order frequency assumption |
| **Marketplace Commission** | Per Transaction | `RevenuePerTransaction` | $P_{\text{norm}} = \text{GMV} \times \text{TakeRate}$ |
| **Retainer** | Monthly | `MonthlyRevenuePerCustomer` | $P_{\text{norm}} = P_{\text{retainer}}$ |

---

## 3. Configurable Materiality Policy (Correction #4)

Rather than embedding a fixed 20% variance threshold, the engine evaluates variance against `PricingMaterialityPolicy`:
$$\text{Relative Variance} = \frac{|P_{\text{norm}} - \text{Benchmark}|}{\text{Benchmark}}$$
A `ForecastMismatch` status is flagged if and only if:
$$\text{Relative Variance} > \text{Policy.RelativeVarianceThreshold}$$
$$\text{OR } |P_{\text{norm}} - \text{Benchmark}| > \text{Policy.AbsoluteVarianceThreshold}$$

Default policy sets `RelativeVarianceThreshold = 0.25` (25%) and `AbsoluteVarianceThreshold = €20`, adjustable per project and industry.

---

## 4. Market Price Evidence & Validation Model

The engine formalizes external pricing inputs into two distinct tiers:

1. **Market Reference Price ($P_{\text{ref}}$)**:
   - External price anchor derived from competitor observation, customer surveys, or desk-research estimates.
   - Evidence types: `CompetitorObserved`, `CustomerInterview`, `CustomerSurvey`, `MarketStudyEstimate`, `ModelEstimate`.
   - Validation levels: `Supported`, `Indicative`, `Unvalidated`.
   - Invariant: Populates `MarketReferencePrice`. Never populates `ValidatedMarketPrice`. Never elevates pricing confidence to `Validated`.

2. **Validated Market Price ($P_{\text{val}}$)**:
   - Empirically validated price point derived solely from real economic transactions.
   - Evidence types: `HistoricalSale`, `PaidPilot`, `PreOrder`, `QuoteAccepted`.
   - Validation level: `EmpiricallyValidated`.
   - Condition: If and only if an empirical transaction exists with evidence, set $P_{\text{val}} = P_{\text{empirical}}$ and elevate offer confidence to `Validated`. Otherwise, $P_{\text{val}} = \text{null}$.

### 4.1 Four-Price Separation Invariant
The four price dimensions ($P_{\text{rec}}, P_{\text{founder}}, P_{\text{ref}}, P_{\text{val}}$) represent distinct concepts and provenance:
- $P_{\text{rec}}$ = MBC algorithmic recommendation
- $P_{\text{founder}}$ = Founder commercial choice
- $P_{\text{ref}}$ = Observed external market reference
- $P_{\text{val}}$ = Empirically validated price

They may assume identical numeric values (e.g., $P_{\text{rec}} = P_{\text{founder}} = P_{\text{ref}} = P_{\text{val}} = €49$) without violating the invariant. Equal numeric values never collapse or merge the underlying fields.


