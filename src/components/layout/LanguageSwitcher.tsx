'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation, type Locale } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'topbar' | 'header';
}

const LANGUAGES: { code: Locale; label: string; fullLabel: string }[] = [
  { code: 'en', label: 'EN', fullLabel: 'English' },
  { code: 'fr', label: 'FR', fullLabel: 'Français' },
];

export function LanguageSwitcher({ className, variant = 'topbar' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Select language, current: ${currentLang.fullLabel}`}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wider font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          variant === 'topbar'
            ? 'text-muted-foreground hover:text-foreground hover:bg-accent border border-border/80 bg-card/60'
            : 'text-foreground/80 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 border border-border/60 bg-transparent'
        )}
      >
        <Globe className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
        <span className="font-bold">{currentLang.label}</span>
        <ChevronDown
          className={cn('w-3 h-3 text-muted-foreground transition-transform duration-150', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className="absolute right-0 z-50 mt-1.5 w-36 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 font-mono">
            Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                aria-checked={isSelected}
                onClick={() => handleSelect(lang.code)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left font-sans',
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold opacity-75">{lang.label}</span>
                  <span>{lang.fullLabel}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
