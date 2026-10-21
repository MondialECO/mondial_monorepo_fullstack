import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FigmaFinalCta from '@/components/homepage/FigmaFinalCta';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('FigmaFinalCta Section (Figma Node 57554:13613)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders section container with 45px padding, 1350px max width, and English copy hierarchy', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <FigmaFinalCta />
      </LanguageProvider>
    );

    const section = document.getElementById('final-cta');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('lg:px-[45px]');

    const container = section?.querySelector('.max-w-\\[1350px\\]');
    expect(container).toBeInTheDocument();

    // Headline
    expect(
      screen.getByText('Your business starts with a first step.')
    ).toBeInTheDocument();

    // Description
    expect(
      screen.getByText(/Create your free MBC Creator profile and start turning your idea into a structured digital business\./i)
    ).toBeInTheDocument();

    // Button
    const button = screen.getByRole('link', { name: /^Start for €0 →$/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/signup');
    expect(button.className).toContain('whitespace-nowrap');
    expect(button.className).toContain('min-w-[175px]');
    expect(button.className).toContain('px-6');
  });

  it('renders French localization accurately', () => {
    render(
      <LanguageProvider defaultLocale="fr">
        <FigmaFinalCta />
      </LanguageProvider>
    );

    // Headline
    expect(
      screen.getByText('Votre entreprise commence par un premier pas.')
    ).toBeInTheDocument();

    // Description
    expect(
      screen.getByText(/Créez votre profil MBC Créateur gratuitement et commencez à transformer votre idée/i)
    ).toBeInTheDocument();

    // Button
    const button = screen.getByRole('link', { name: /^Démarrer pour 0 € →$/i });
    expect(button).toBeInTheDocument();
  });
});
