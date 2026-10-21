import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FigmaWhatsNext from '@/components/homepage/FigmaWhatsNext';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('FigmaWhatsNext Section (Figma Node 57554:13448 / 57554:13451)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders section container with 45px padding, 1350px max width, and English copy hierarchy', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <FigmaWhatsNext />
      </LanguageProvider>
    );

    const section = document.getElementById('whats-next');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('lg:px-[45px]');

    const container = section?.querySelector('.max-w-\\[1350px\\]');
    expect(container).toBeInTheDocument();

    // Eyebrow
    expect(screen.getByText("WHAT'S NEXT")).toBeInTheDocument();

    // Headline with highlight word
    expect(screen.getByText('Creator is just the')).toBeInTheDocument();
    const highlight = screen.getByText('beginning.');
    expect(highlight).toBeInTheDocument();
    expect(highlight).toHaveClass('text-[#3c61dd]');

    // Subline
    expect(
      screen.getByText(/Build your project today. Soon, MBC connects you to the people who help it grow./i)
    ).toBeInTheDocument();

    // Satellite Cards
    expect(screen.getByText('Entrepreneur')).toBeInTheDocument();
    expect(screen.getByText("Run your company once it's registered.")).toBeInTheDocument();

    expect(screen.getByText('Investor')).toBeInTheDocument();
    expect(screen.getByText('Show your project to people who fund.')).toBeInTheDocument();

    expect(screen.getByText('Service Provider')).toBeInTheDocument();
    expect(screen.getByText('Hire experts when you need help.')).toBeInTheDocument();

    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Projects, people and services in one place.')).toBeInTheDocument();

    // SOON Badges
    const soonBadges = screen.getAllByText('SOON');
    expect(soonBadges.length).toBe(4);

    // Center Hub
    expect(screen.getByText('CREATOR')).toBeInTheDocument();
    expect(screen.getByText('Available now')).toBeInTheDocument();
    expect(screen.getByText('Your project starts here')).toBeInTheDocument();
    expect(screen.getByText('CampusFlow')).toBeInTheDocument();
    expect(screen.getByText('Student teams app')).toBeInTheDocument();
    expect(screen.getByText('Phase 3 of 6')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Free to start')).toBeInTheDocument();

    // CTA
    const ctaButton = screen.getByRole('link', { name: /^Start free$/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/signup');
    expect(ctaButton.className).toContain('whitespace-nowrap');
    expect(ctaButton.className).toContain('min-w-[200px]');
    expect(
      screen.getByText('No card needed. New profiles roll out one by one.')
    ).toBeInTheDocument();

    // SVG Connectors
    const svg = section?.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 1152 470');
  });

  it('renders French localization completely and accurately', () => {
    render(
      <LanguageProvider defaultLocale="fr">
        <FigmaWhatsNext />
      </LanguageProvider>
    );

    // Eyebrow
    expect(screen.getByText('ET ENSUITE')).toBeInTheDocument();

    // Headline
    expect(screen.getByText("Créateur, c'est juste le")).toBeInTheDocument();
    const highlightFr = screen.getByText('début.');
    expect(highlightFr).toBeInTheDocument();
    expect(highlightFr).toHaveClass('text-[#3c61dd]');

    // Subline
    expect(
      screen.getByText(/Construisez votre projet aujourd'hui. Bientôt, MBC vous connecte aux personnes qui vous aident à grandir./i)
    ).toBeInTheDocument();

    // Satellite Cards
    expect(screen.getByText('Entrepreneur')).toBeInTheDocument();
    expect(screen.getByText('Gérez votre société une fois immatriculée.')).toBeInTheDocument();

    expect(screen.getByText('Investisseur')).toBeInTheDocument();
    expect(screen.getByText('Présentez votre projet à des personnes qui financent.')).toBeInTheDocument();

    expect(screen.getByText('Prestataire')).toBeInTheDocument();
    expect(screen.getByText('Faites appel à des experts quand vous en avez besoin.')).toBeInTheDocument();

    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Projets, personnes et services au même endroit.')).toBeInTheDocument();

    // Badges
    const soonBadgesFr = screen.getAllByText('BIENTÔT');
    expect(soonBadgesFr.length).toBe(4);

    // Center Hub
    expect(screen.getByText('CRÉATEUR')).toBeInTheDocument();
    expect(screen.getByText('Disponible maintenant')).toBeInTheDocument();
    expect(screen.getByText('Votre projet commence ici')).toBeInTheDocument();
    expect(screen.getByText('App pour équipes étudiantes')).toBeInTheDocument();
    expect(screen.getByText('Phase 3 sur 6')).toBeInTheDocument();
    expect(screen.getByText('Gratuit pour commencer')).toBeInTheDocument();

    // CTA
    const ctaButtonFr = screen.getByRole('link', { name: /^Démarrer gratuitement$/i });
    expect(ctaButtonFr).toBeInTheDocument();
    expect(
      screen.getByText('Sans carte requise. Les nouveaux profils sont ouverts progressivement.')
    ).toBeInTheDocument();
  });
});
