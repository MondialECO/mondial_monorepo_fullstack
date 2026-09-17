using Microsoft.Extensions.Logging;

namespace WebApp.Services.Ai
{
    /// <summary>
    /// Dedicated EventIds for AI observability, financial reconciliation, and anomaly alerts.
    /// Distinguishable in logs, alerting rules, and telemetry.
    /// </summary>
    public static class AiLogEvents
    {
        public static readonly EventId UnrefundedDebit = new(9101, "AI_UNREFUNDED_DEBIT");
        public static readonly EventId UnmappableSession = new(9102, "AI_UNMAPPABLE_SESSION");
        public static readonly EventId ReconciliationAudit = new(9103, "AI_RECONCILIATION_AUDIT");
    }

    /// <summary>
    /// Identifies the authoritative source that initiated an AI credit or session reconciliation action.
    /// </summary>
    public static class AiReconciliationSource
    {
        public const string RunnerAutomatic = "RunnerAutomatic";
        public const string StartupReconciliation = "StartupReconciliation";
        public const string ScheduledSweep = "ScheduledSweep";
        public const string ManualReconciliation = "ManualReconciliation";
    }
}
