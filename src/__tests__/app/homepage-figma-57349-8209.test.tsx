import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Home from '@/app/page';
import { LanguageProvider, useLanguage } from '@/providers/LanguageProvider';
import { describe, it, expect } from 'vitest';

// Helper component to switch language in tests
function LanguageSwitcherHelper() {
  const { locale, setLocale } = useLanguage();
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
      data-testid="test-language-toggle"
    >
      Toggle {locale}
    </button>
  );
}

describe('Homepage — Figma Node 57480:110 & 57480:109 Wireframe Deliverables Alignment', () => {
  it('renders Wireframe Hero and all 6 business-ready deliverables in exact alternating layout with 3 videos', () => {
    render(
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    );

    // 1. Hero Section (Figma 57480:110)
    expect(screen.getByTestId('wireframe-hero')).toBeInTheDocument();
    expect(screen.getAllByText(/MBC Creator · France/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Move from “I have an idea” to real business-ready outputs\./i)).toBeInTheDocument();
    expect(screen.getByText(/MBC Creator helps you create the documents and structure/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Start for €0/i).length).toBeGreaterThan(0);

    // 2. Deliverable 01: Brand kit (Figma 57500:123) - Visual on Left, Copy on Right
    expect(screen.getAllByText(/Brand kit/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Build your brand identity/i)).toBeInTheDocument();
    expect(screen.getByText(/Simple, fast, pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Answer a few questions and get your logo, colours and fonts/i)).toBeInTheDocument();

    // 3. Deliverable 02: Business plan (Figma 57500:254) [VIDEO 1] - Copy on Left, Video on Right
    expect(screen.getAllByText(/Business plan/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Turn your idea into a real plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready for investors/i)).toBeInTheDocument();
    expect(screen.getByText('CampusFlow_Business_Plan_v1.pdf')).toBeInTheDocument();

    // 4. Deliverable 03: Financial forecast (Figma 57500:373) - Visual on Left, Copy on Right
    expect(screen.getAllByText(/Financial forecast/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Plan your next 3 years/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear and honest/i)).toBeInTheDocument();
    expect(screen.getAllByText(/€554,920/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Month 7/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/€34,680/i).length).toBeGreaterThan(0);

    // 5. Deliverable 04: Market research (Figma 57500:912) - Copy on Left, Visual on Right
    expect(screen.getAllByText(/Market research/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Know your market first/i)).toBeInTheDocument();
    expect(screen.getByText(/Real numbers, not guesses/i)).toBeInTheDocument();
    expect(screen.getAllByText(/€1\.2B/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/68%/i)).toBeInTheDocument();

    // 6. Deliverable 05: Action roadmap (Figma 57501:1033) [VIDEO 2] - Video on Left, Copy on Right
    expect(screen.getAllByText(/Action roadmap/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Know what to do this week/i)).toBeInTheDocument();
    expect(screen.getAllByText(/One step at a time/i).length).toBeGreaterThan(0);
    expect(screen.getByText('CampusFlow_90Day_Action_Roadmap.pdf')).toBeInTheDocument();

    // 7. Deliverable 06: Business setup (Figma 57503:9257) [VIDEO 3] - Copy on Left, Video on Right
    expect(screen.getAllByText(/Business setup/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Set up your company/i)).toBeInTheDocument();
    expect(screen.getByText(/No legal jargon/i)).toBeInTheDocument();
    expect(screen.getByText('INPI_Guichet_Unique_Formation_Blueprint.pdf')).toBeInTheDocument();
  });

  it('renders all 3 interactive video players with playback controls and 4K badges', () => {
    render(
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    );

    // 3 Video Player titles
    expect(screen.getByText('CampusFlow_Business_Plan_v1.pdf')).toBeInTheDocument();
    expect(screen.getByText('CampusFlow_90Day_Action_Roadmap.pdf')).toBeInTheDocument();
    expect(screen.getByText('INPI_Guichet_Unique_Formation_Blueprint.pdf')).toBeInTheDocument();

    // 3 4K badges
    const badges4K = screen.getAllByText('4K');
    expect(badges4K.length).toBe(3);

    // Play buttons for the 3 players
    const playButtons = screen.getAllByRole('button', { name: /^Play$/i });
    expect(playButtons.length).toBe(3);

    // Click play on the first video player
    fireEvent.click(playButtons[0]);
    expect(screen.getByRole('button', { name: /^Pause$/i })).toBeInTheDocument();
  });

  it('dynamically translates all hero and deliverable copy when switching between English and French', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcherHelper />
        <Home />
      </LanguageProvider>
    );

    // Initially in English
    expect(screen.getByText(/Move from “I have an idea” to real business-ready outputs\./i)).toBeInTheDocument();
    expect(screen.getByText(/Build your brand identity/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan your next 3 years/i)).toBeInTheDocument();

    // Switch to French
    const toggleBtn = screen.getByTestId('test-language-toggle');
    act(() => {
      fireEvent.click(toggleBtn);
    });

    // French content should now be rendered
    expect(screen.getByText(/Passez de.*J'ai une idée/i)).toBeInTheDocument();
    expect(screen.getByText(/Bâtissez votre identité de marque/i)).toBeInTheDocument();
    expect(screen.getByText(/Planifiez vos 3 prochaines années/i)).toBeInTheDocument();
    expect(screen.getByText(/Transformez votre idée en un vrai plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Maîtrisez votre marché en premier/i)).toBeInTheDocument();
    expect(screen.getByText(/Sachez exactement quoi faire cette semaine/i)).toBeInTheDocument();
    expect(screen.getByText(/Créez votre société/i)).toBeInTheDocument();
  });
});
