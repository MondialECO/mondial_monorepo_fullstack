'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import commonEn from '@/locales/en/common.json';
import commonFr from '@/locales/fr/common.json';
import creatorEn from '@/locales/en/creator.json';
import creatorFr from '@/locales/fr/creator.json';

export type Locale = 'en' | 'fr';

export interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (value: number) => string;
}

const STORAGE_KEY = 'mondial_locale';

// Aggregated dictionaries
const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: {
    common: commonEn.common,
    languages: commonEn.languages,
    status: commonEn.status,
    priority: commonEn.priority,
    creator: creatorEn,
  },
  fr: {
    common: commonFr.common,
    languages: commonFr.languages,
    status: commonFr.status,
    priority: commonFr.priority,
    creator: creatorFr,
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, variables?: Record<string, string | number>): string {
  if (!variables) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Hydrate locale from localStorage or cookie safely after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === 'en' || saved === 'fr') {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // localStorage may fail in restricted browser modes
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore storage write issues
    }
  }, []);

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      // First try current locale
      let val = getNestedValue(dictionaries[locale], key);
      // Fallback to English if missing in current locale
      if (val === undefined && locale !== 'en') {
        val = getNestedValue(dictionaries.en, key);
      }
      if (val === undefined) {
        return key;
      }
      return interpolate(val, variables);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const localeString = locale === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.DateTimeFormat(localeString, options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d);
      } catch {
        return '';
      }
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number, currency = 'EUR'): string => {
      try {
        const localeString = locale === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.NumberFormat(localeString, {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `€${amount}`;
      }
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number): string => {
      try {
        const localeString = locale === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.NumberFormat(localeString).format(value);
      } catch {
        return String(value);
      }
    },
    [locale]
  );

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatDate,
      formatCurrency,
      formatNumber,
    }),
    [locale, setLocale, t, formatDate, formatCurrency, formatNumber]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider (e.g. isolated test environments)
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: (key: string, variables?: Record<string, string | number>) => {
        let val = getNestedValue(dictionaries.en, key);
        if (val === undefined) return key;
        return interpolate(val, variables);
      },
      formatDate: (d: Date | string | number) => new Date(d).toLocaleDateString('en-US'),
      formatCurrency: (a: number) => `€${a}`,
      formatNumber: (n: number) => String(n),
    };
  }
  return context;
}
