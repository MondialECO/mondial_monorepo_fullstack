import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from '@/app/page';
import PublicHeader from '@/components/shared/PublicHeader';
import { LanguageProvider, useLanguage } from '@/providers/LanguageProvider';

function LanguageToggleHelper() {
  const { locale, setLocale } = useLanguage();
  return (
    <button
      data-testid="lang-toggle-btn"
      onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
    >
      Current: {locale}
    </button>
  );
}

describe('Homepage Buttons — Responsive & i18n Wrap-Prevention', () => {
  it('ensures all buttons have whitespace-nowrap and responsive sizing without rigid fixed widths', () => {
    const { container } = render(
      <LanguageProvider>
        <PublicHeader />
        <Home />
      </LanguageProvider>
    );

    // 1. FigmaHero Primary CTA (Start for €0 →)
    const heroSection = container.querySelector('section'); // first section is FigmaHero
    const heroLinks = heroSection ? Array.from(heroSection.querySelectorAll('a')) : [];
    const heroPrimaryCta = heroLinks.find(a => a.textContent?.includes('Start for €0'));
    expect(heroPrimaryCta).toBeDefined();
    expect(heroPrimaryCta?.className).toContain('whitespace-nowrap');
    expect(heroPrimaryCta?.className).toContain('min-w-[153px]');
    expect(heroPrimaryCta?.className).toContain('px-6');
    expect(heroPrimaryCta?.className).not.toMatch(/\b(sm:)?w-\[153px\]\b/);

    // 2. FigmaHero Secondary CTA (See how it works)
    const heroSecondaryCta = heroLinks.find(a => a.textContent?.includes('See how it works'));
    expect(heroSecondaryCta).toBeDefined();
    expect(heroSecondaryCta?.className).toContain('whitespace-nowrap');
    expect(heroSecondaryCta?.className).toContain('min-w-[176px]');
    expect(heroSecondaryCta?.className).toContain('px-6');
    expect(heroSecondaryCta?.className).not.toMatch(/\b(sm:)?w-\[176px\]\b/);

    // 3. WireframeHero CTA (Start for €0 →)
    const wireframeSection = screen.getByTestId('wireframe-hero');
    const wireframeCta = wireframeSection.querySelector('a');
    expect(wireframeCta).toBeDefined();
    expect(wireframeCta?.className).toContain('whitespace-nowrap');
    expect(wireframeCta?.className).toContain('min-w-[153px]');
    expect(wireframeCta?.className).toContain('px-6');
    expect(wireframeCta?.className).not.toMatch(/\bw-\[153px\]\b/);

    // 4. FigmaFinalCta (Start for €0 →)
    const allSections = container.querySelectorAll('section');
    const finalSection = allSections[allSections.length - 1]; // last section is FigmaFinalCta
    const finalCta = finalSection.querySelector('a');
    expect(finalCta).toBeDefined();
    expect(finalCta?.className).toContain('whitespace-nowrap');
    expect(finalCta?.className).toContain('min-w-[175px]');
    expect(finalCta?.className).toContain('px-6');
    expect(finalCta?.className).not.toMatch(/\b(sm:)?w-\[175px\]\b/);

    // 5. FigmaWhatsNext CTA (Start free)
    const whatsNextCta = screen.getByRole('link', { name: /^Start free$/i });
    expect(whatsNextCta).toBeInTheDocument();
    expect(whatsNextCta.className).toContain('whitespace-nowrap');
    expect(whatsNextCta.className).toContain('min-w-[200px]');
  });

  it('updates all button labels smoothly when switching between English and French without double lines', () => {
    render(
      <LanguageProvider>
        <LanguageToggleHelper />
        <PublicHeader />
        <Home />
      </LanguageProvider>
    );

    // Verify English labels first
    expect(screen.getAllByText(/Start for €0/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/See how it works/i)).toBeInTheDocument();

    // Switch to French
    const toggleBtn = screen.getByTestId('lang-toggle-btn');
    act(() => {
      fireEvent.click(toggleBtn);
    });

    // Verify French labels update
    expect(screen.getAllByText(/Démarrer pour 0 €/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Voir comment ça marche/i)).toBeInTheDocument();
    expect(screen.getByText(/Démarrer gratuitement/i)).toBeInTheDocument();

    // All French buttons preserve whitespace-nowrap
    const frenchHeroCta = screen.getByText(/Voir comment ça marche/i).closest('a');
    expect(frenchHeroCta?.className).toContain('whitespace-nowrap');

    const frenchFinalCta = screen.getAllByText(/Démarrer pour 0 €/i)[0].closest('a');
    expect(frenchFinalCta?.className).toContain('whitespace-nowrap');
  });
});
