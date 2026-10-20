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
  t: (
    key: string,
    variablesOrFallback?: Record<string, string | number | null | undefined> | string,
    variablesOrFallback2?: Record<string, string | number | null | undefined> | string
  ) => string;
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
    auth: (commonEn as Record<string, unknown>).auth,
    onboarding: (commonEn as Record<string, unknown>).onboarding,
    footer: (commonEn as Record<string, unknown>).footer,
    creator: creatorEn,
  },
  fr: {
    common: commonFr.common,
    languages: commonFr.languages,
    status: commonFr.status,
    priority: commonFr.priority,
    auth: (commonFr as Record<string, unknown>).auth,
    onboarding: (commonFr as Record<string, unknown>).onboarding,
    footer: (commonFr as Record<string, unknown>).footer,
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

function interpolate(template: string, variables?: Record<string, string | number | null | undefined>): string {
  if (!variables) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : `{{${key}}}`;
  });
}

export function LanguageProvider({
  children,
  defaultLocale = 'en',
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

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
    (
      key: string,
      variablesOrFallback?: Record<string, string | number | null | undefined> | string,
      variablesOrFallback2?: Record<string, string | number | null | undefined> | string
    ): string => {
      let fallback: string | undefined;
      let vars: Record<string, string | number | null | undefined> | undefined;

      if (typeof variablesOrFallback === 'string') {
        fallback = variablesOrFallback;
        if (typeof variablesOrFallback2 === 'object' && variablesOrFallback2 !== null) {
          vars = variablesOrFallback2;
        }
      } else if (typeof variablesOrFallback === 'object' && variablesOrFallback !== null) {
        vars = variablesOrFallback;
        if (typeof variablesOrFallback2 === 'string') {
          fallback = variablesOrFallback2;
        }
      }

      // First try current locale
      let val = getNestedValue(dictionaries[locale], key);
      // Fallback to English if missing in current locale
      if (val === undefined && locale !== 'en') {
        val = getNestedValue(dictionaries.en, key);
      }
      // Check standard sub-namespaces (e.g. creator, brandKit)
      if (val === undefined) {
        const candidatePrefixes = [
          'footer.',
          'onboarding.',
          'auth.',
          'creator.humainx.',
          'creator.phase2.brandKit.',
          'creator.phase2.',
          'creator.',
          'common.',
        ];
        for (const p of candidatePrefixes) {
          val = getNestedValue(dictionaries[locale], p + key);
          if (val === undefined && locale !== 'en') {
            val = getNestedValue(dictionaries.en, p + key);
          }
          if (val !== undefined) break;
        }
      }
      if (val === undefined) {
        return fallback !== undefined ? interpolate(fallback, vars) : key;
      }
      return interpolate(val, vars);
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

export function useTranslation(_namespace?: string) {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider (e.g. isolated test environments)
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: ((
        key: string,
        variablesOrFallback?: Record<string, string | number | null | undefined> | string,
        variablesOrFallback2?: Record<string, string | number | null | undefined> | string
      ) => {
        let fallback: string | undefined;
        let vars: Record<string, string | number | null | undefined> | undefined;

        if (typeof variablesOrFallback === 'string') {
          fallback = variablesOrFallback;
          if (typeof variablesOrFallback2 === 'object' && variablesOrFallback2 !== null) {
            vars = variablesOrFallback2;
          }
        } else if (typeof variablesOrFallback === 'object' && variablesOrFallback !== null) {
          vars = variablesOrFallback;
          if (typeof variablesOrFallback2 === 'string') {
            fallback = variablesOrFallback2;
          }
        }

        let val = getNestedValue(dictionaries.en, key);
        if (val === undefined) {
          const candidatePrefixes = [
            'footer.',
            'onboarding.',
            'auth.',
            'creator.humainx.',
            'creator.phase2.brandKit.',
            'creator.phase2.',
            'creator.',
            'common.',
          ];
          for (const p of candidatePrefixes) {
            val = getNestedValue(dictionaries.en, p + key);
            if (val !== undefined) break;
          }
        }
        if (val === undefined) return fallback !== undefined ? interpolate(fallback, vars) : key;
        return interpolate(val, vars);
      }) as LanguageContextType['t'],
      formatDate: (d: Date | string | number) => new Date(d).toLocaleDateString('en-US'),
      formatCurrency: (a: number) => `€${a}`,
      formatNumber: (n: number) => String(n),
    };
  }
  return context;
}

export const useLanguage = useTranslation;
