// Shared money formatter for the forecast — used by the on-screen ForecastView AND the
// PDF export, so both render the forecast's ACTUAL currency instead of a hardcoded symbol.
// No currency → a bare number (decimal), matching the screen's long-standing behavior.
// null/undefined amount → an em dash (the PDF's prior behavior). One source, no drift.
export function formatMoney(n?: number | null, currency?: string | null): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: currency ? "currency" : "decimal",
      currency: currency || undefined,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    // Unknown currency code → fall back to a plain rounded number, never throw.
    return Math.round(n).toLocaleString();
  }
}
