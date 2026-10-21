import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FigmaTrustSources from '@/components/homepage/FigmaTrustSources';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('FigmaTrustSources Section (Figma Node 57554:13262)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders section container with 45px padding, 1350px max width, and English copy hierarchy', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <FigmaTrustSources />
      </LanguageProvider>
    );

    const section = document.getElementById('trust-sources');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('lg:px-[45px]');

    const container = section?.querySelector('.max-w-\\[1350px\\]');
    expect(container).toBeInTheDocument();

    // Eyebrow
    expect(screen.getByText('WHERE THE FACTS COME FROM')).toBeInTheDocument();

    // Two-tone Headline: "We don't guess." + "We check." (#3c61dd)
    expect(screen.getByText("We don't guess.")).toBeInTheDocument();
    const checkHighlight = screen.getByText('We check.');
    expect(checkHighlight).toBeInTheDocument();
    expect(checkHighlight).toHaveClass('text-[#3c61dd]');

    // Subline
    expect(
      screen.getByText(/AI helps explain things in plain words/i)
    ).toBeInTheDocument();

    // Proof Card
    expect(screen.getByText('YOUR LEGAL CHECKLIST')).toBeInTheDocument();
    expect(screen.getByText('Declare who owns your company')).toBeInTheDocument();
    expect(screen.getByText(/You'll do this when you register/i)).toBeInTheDocument();
    expect(screen.getByText('Source: service-public.fr')).toBeInTheDocument();
    expect(screen.getByText('Standard template')).toBeInTheDocument();
    expect(screen.getByText('See? It tells you where it got that.')).toBeInTheDocument();

    // Right Panels
    expect(screen.getByText('Setting up your company')).toBeInTheDocument();
    expect(screen.getByText('Service Public Entreprendre')).toBeInTheDocument();
    expect(screen.getByText('INPI Guichet unique')).toBeInTheDocument();

    expect(screen.getByText('Money and help you can apply for')).toBeInTheDocument();
    expect(screen.getByText('Aides-entreprises / data.gouv.fr')).toBeInTheDocument();
    expect(screen.getByText('Bpifrance Création')).toBeInTheDocument();
    expect(screen.getByText('France Travail')).toBeInTheDocument();

    expect(screen.getByText('Checking other companies')).toBeInTheDocument();
    expect(screen.getByText("API Recherche d'entreprises")).toBeInTheDocument();
    expect(screen.getByText('SIRENE')).toBeInTheDocument();

    // Trust Strip 3 Items
    expect(screen.getByText('You can always see where info came from.')).toBeInTheDocument();
    expect(screen.getByText(/Grants say 'you can apply', never 'you'll get it'\./i)).toBeInTheDocument();
    expect(screen.getByText(/Your changes stay yours\. Nothing gets overwritten\./i)).toBeInTheDocument();
  });

  it('supports full French localization for eyebrow, headline, proof card, panels, and trust strip', () => {
    localStorage.setItem('mondial_locale', 'fr');
    render(
      <LanguageProvider defaultLocale="fr">
        <FigmaTrustSources />
      </LanguageProvider>
    );

    // French Eyebrow
    expect(screen.getByText("D'OÙ VIENNENT LES INFORMATIONS")).toBeInTheDocument();

    // French Headline
    expect(screen.getByText('Nous ne devinons pas.')).toBeInTheDocument();
    const checkHighlightFr = screen.getByText('Nous vérifions.');
    expect(checkHighlightFr).toBeInTheDocument();
    expect(checkHighlightFr).toHaveClass('text-[#3c61dd]');

    // French Subline
    expect(
      screen.getByText(/L'IA aide à expliquer les choses simplement/i)
    ).toBeInTheDocument();

    // French Proof Card
    expect(screen.getByText('VOTRE CHECKLIST JURIDIQUE')).toBeInTheDocument();
    expect(screen.getByText('Déclarez qui possède votre société')).toBeInTheDocument();
    expect(screen.getByText(/Vous le ferez lors de l'immatriculation/i)).toBeInTheDocument();
    expect(screen.getByText(/service-public\.fr/i)).toBeInTheDocument();
    expect(screen.getByText('Modèle standard')).toBeInTheDocument();
    expect(screen.getByText(/Ça vous dit d'où vient l'information/i)).toBeInTheDocument();

    // French Panels
    expect(screen.getByText('Créer votre société')).toBeInTheDocument();
    expect(screen.getByText('Aides et financements accessibles')).toBeInTheDocument();
    expect(screen.getByText("Vérifier d'autres sociétés")).toBeInTheDocument();
    expect(screen.getAllByText('OFFICIEL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('DONNÉES OUVERTES').length).toBeGreaterThanOrEqual(1);

    // French Trust Strip
    expect(screen.getByText(/Vous pouvez toujours voir d'où vient l'information\./i)).toBeInTheDocument();
    expect(screen.getByText(/Les aides indiquent 'vous pouvez postuler'/i)).toBeInTheDocument();
    expect(screen.getByText(/Vos modifications vous appartiennent/i)).toBeInTheDocument();
  });
});
