const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

/** Falls back to the raw code (e.g. "SEK 120") when no symbol is known. */
export function currencySymbol(currency?: string | null): string {
  const code = (currency ?? 'EUR').toUpperCase();
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

export function formatPrice(amount: number, currency?: string | null, decimals = 0): string {
  return `${currencySymbol(currency)}${amount.toFixed(decimals)}`;
}
