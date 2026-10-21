import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FigmaFaq from '@/components/homepage/FigmaFaq';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('FigmaFaq Section (Figma Node 57554:13570)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders section container with 45px padding, 1350px max width, and English copy hierarchy with accordion functionality', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <FigmaFaq />
      </LanguageProvider>
    );

    const section = document.getElementById('faq');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('lg:px-[45px]');

    const container = section?.querySelector('.max-w-\\[1350px\\]');
    expect(container).toBeInTheDocument();

    // Eyebrow
    expect(screen.getByText('FAQ')).toBeInTheDocument();

    // Headline
    expect(
      screen.getByText(/What "start for €0" really means\./i)
    ).toBeInTheDocument();

    // Subline
    expect(
      screen.getByText(/Keep the promise simple, but be clear about what is free inside MBC/i)
    ).toBeInTheDocument();

    // All 7 Questions exist
    expect(screen.getByText('Can I really start with MBC for €0?')).toBeInTheDocument();
    expect(screen.getByText('Does €0 mean every external business cost is free?')).toBeInTheDocument();
    expect(screen.getByText('What happens when I reach my AI usage limit?')).toBeInTheDocument();
    expect(screen.getByText('Can I download what I create?')).toBeInTheDocument();
    expect(screen.getByText('Will MBC register my company for me?')).toBeInTheDocument();
    expect(screen.getByText('What happens to my project information?')).toBeInTheDocument();
    expect(screen.getByText('What is the future MBC network?')).toBeInTheDocument();

    // Question 1 is open by default (per Figma design)
    expect(screen.getByTestId('faq-answer-0')).toBeInTheDocument();
    expect(
      screen.getByText(/Yes\. The Creator profile is free to start\./i)
    ).toBeInTheDocument();

    // Question 2 answer is closed initially
    expect(screen.queryByTestId('faq-answer-1')).not.toBeInTheDocument();

    // Click Question 2 to toggle open
    fireEvent.click(screen.getByTestId('faq-toggle-1'));
    expect(screen.getByTestId('faq-answer-1')).toBeInTheDocument();
    expect(
      screen.getByText(/Starting on MBC is €0\. However, third-party administrative or government costs/i)
    ).toBeInTheDocument();
    // Question 1 should now be closed
    expect(screen.queryByTestId('faq-answer-0')).not.toBeInTheDocument();
  });

  it('renders French localization accurately for all FAQ items', () => {
    render(
      <LanguageProvider defaultLocale="fr">
        <FigmaFaq />
      </LanguageProvider>
    );

    // Eyebrow
    expect(screen.getByText('FAQ')).toBeInTheDocument();

    // Headline
    expect(
      screen.getByText(/Ce que "démarrer pour 0 €" signifie vraiment\./i)
    ).toBeInTheDocument();

    // Subline
    expect(
      screen.getByText(/ce qui est gratuit dans MBC, et ce qui peut coûter de l'argent en dehors de la plateforme/i)
    ).toBeInTheDocument();

    // French Questions
    expect(screen.getByText(/Puis-je vraiment commencer avec MBC pour 0 €/i)).toBeInTheDocument();
    expect(screen.getByText(/0 € signifie-t-il que tous les frais externes sont gratuits/i)).toBeInTheDocument();
    expect(screen.getByText(/Que se passe-t-il quand j'atteins ma limite d'utilisation de l'IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Puis-je télécharger ce que je crée/i)).toBeInTheDocument();
    expect(screen.getByText(/MBC va-t-il immatriculer mon entreprise pour moi/i)).toBeInTheDocument();
    expect(screen.getByText(/Que se passe-t-il avec les informations de mon projet/i)).toBeInTheDocument();
    expect(screen.getByText(/Qu'est-ce que le futur réseau MBC/i)).toBeInTheDocument();

    // Answer 1 in French is open by default
    expect(
      screen.getByText(/Oui\. Le profil Créateur est gratuit\./i)
    ).toBeInTheDocument();
  });
});
