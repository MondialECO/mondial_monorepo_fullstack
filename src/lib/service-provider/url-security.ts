export const HTTP_URL_ERROR = 'Enter a complete URL beginning with http:// or https://.';

export function safeHttpUrl(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
    return candidate;
  } catch {
    return null;
  }
}

export function validateOptionalHttpUrl(value: string | null | undefined) {
  return !value?.trim() || safeHttpUrl(value) ? null : HTTP_URL_ERROR;
}

export function validateHttpUrlList(values: string[]) {
  const invalid = values.find((value) => !safeHttpUrl(value));
  return invalid ? `“${invalid}” is not a safe HTTP(S) URL.` : null;
}

export function looksLikeUrlReference(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value.trim()) || value.trim().startsWith('//');
}
