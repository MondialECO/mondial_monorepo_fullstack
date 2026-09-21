# Phase 4.7 — GTM Empirical Experiments & Baseline Tracking

## 1. Experimentation Philosophy

No speculative targets are invented. An early-stage venture lacks historical conversion data; asserting arbitrary targets (e.g. "5% conversion rate" or "CAC < €30") is dishonest and misleads the founder.

When benchmark data is ungrounded:
- Metric targets default to `ExperimentThresholdStatus.NeedsBaseline`.
- The primary purpose is explicitly framed as establishing an empirical response baseline.
- Success and stop conditions use discrete observable event counts (e.g. "Secure 3 paid pilot commitments" / "5 consecutive prospects reject price floor").

---

## 2. Immutable Evidence Contract (`ExperimentRun`)

When a founder conducts a test and calls `POST /api/creator/phase4/gtm/experiments/{key}/runs`, an immutable `ExperimentRun` record is committed:

```csharp
public class ExperimentRun
{
    public string RunId { get; set; } = Guid.NewGuid().ToString();
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal ActualSpend { get; set; }
    public string ActualEffort { get; set; }
    public string Observations { get; set; }
    public List<GtmMetricObserved> MetricsObserved { get; set; }
    public ExperimentRunOutcome Outcome { get; set; }
    public DateTime RecordedAt { get; set; }
}
```

### Invariant:
On `/refresh`, the GTM strategy recomputes channel priorities and segment recommendations based on latest inputs, but **all historical `ExperimentRun` records are strictly carried forward and preserved**. Historical empirical data is never deleted or overwritten.
