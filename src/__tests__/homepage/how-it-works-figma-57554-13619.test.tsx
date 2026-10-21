import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FigmaHowItWorks from '@/components/homepage/FigmaHowItWorks';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('FigmaHowItWorks Section (Figma Node 57554:13619)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders section container with 45px padding, gradient background, and intro header', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <FigmaHowItWorks />
      </LanguageProvider>
    );

    const section = document.getElementById('how-it-works');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('lg:px-[45px]');

    const container = section?.querySelector('.max-w-\\[1350px\\]');
    expect(container).toBeInTheDocument();

    // Eyebrow
    expect(screen.getByText(/HOW IT WORKS/i)).toBeInTheDocument();

    // Headline
    expect(screen.getByRole('heading', { level: 2, name: /From idea to/i })).toBeInTheDocument();

    // Subline
    expect(
      screen.getByText(/Go one step at a time\. Everything you make is saved and feeds the next step\./i)
    ).toBeInTheDocument();
  });

  it('renders all 6 phases with spine buttons, preview cards, and bottom breadcrumbs in English', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <FigmaHowItWorks />
      </LanguageProvider>
    );

    // Spine buttons
    expect(screen.getByRole('button', { name: /Go to Phase 01/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Phase 02/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Phase 03/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Phase 04/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Phase 05/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Phase 06/i })).toBeInTheDocument();

    // Phase 01 elements
    expect(screen.getByText('PHASE 01 · YOU')).toBeInTheDocument();
    expect(screen.getByText('Start with you')).toBeInTheDocument();
    expect(screen.getByText('Student · Lyon')).toBeInTheDocument();
    expect(screen.getByText('2 school projects · 1 internship')).toBeInTheDocument();

    // Phase 02 elements
    expect(screen.getByText('PHASE 02 · PROJECT & BRAND')).toBeInTheDocument();
    expect(screen.getByText('Shape your idea and brand')).toBeInTheDocument();
    expect(screen.getByText('Simple project management for student teams.')).toBeInTheDocument();
    expect(screen.getByText('Idea clarity')).toBeInTheDocument();

    // Phase 03 elements (Core phase)
    expect(screen.getByText('CORE PHASE')).toBeInTheDocument();
    expect(screen.getByText('Build the business behind your idea')).toBeInTheDocument();
    expect(screen.getByText('Business Plan Intelligence')).toBeInTheDocument();
    expect(screen.getByText(/3\.1 Market Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.6 Executive Business Plan/i)).toBeInTheDocument();

    // Phase 04 elements
    expect(screen.getByText('PHASE 04 · BUILD & LAUNCH PREP')).toBeInTheDocument();
    expect(screen.getByText('Get ready to build and launch')).toBeInTheDocument();
    expect(screen.getByText('Talk to 5 customers')).toBeInTheDocument();
    expect(screen.getByText('Set your first price')).toBeInTheDocument();
    expect(screen.getByText('Finalize prototype')).toBeInTheDocument();

    // Phase 05 elements
    expect(screen.getByText('PHASE 05 · COMPANY')).toBeInTheDocument();
    expect(screen.getByText('Create your company')).toBeInTheDocument();
    expect(screen.getByText('Your registration guide')).toBeInTheDocument();
    expect(screen.getByText('Only SAS, SAS-U and SARL for now.')).toBeInTheDocument();

    // Phase 06 elements
    expect(screen.getByText('PHASE 06 · NEXT CHAPTER')).toBeInTheDocument();
    expect(screen.getByText('See what you built, and keep going')).toBeInTheDocument();
    expect(screen.getByText("You've built your project plan")).toBeInTheDocument();
    expect(screen.getByText('YOUR NEXT MOVE')).toBeInTheDocument();
    expect(screen.getByText('Continue company preparation')).toBeInTheDocument();

    // Breadcrumbs
    expect(screen.getByRole('button', { name: /Jump to Phase 01: You/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 02: Brand/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 03: Business plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 04: Launch plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 05: Company/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 06: Next chapter/i })).toBeInTheDocument();
    expect(screen.getByText('One project. Everything you build stays connected.')).toBeInTheDocument();
  });

  it('supports full French localization for all phase titles, descriptions, previews, and breadcrumbs', () => {
    localStorage.setItem('mondial_locale', 'fr');
    render(
      <LanguageProvider defaultLocale="fr">
        <FigmaHowItWorks />
      </LanguageProvider>
    );

    // French Phase 01
    expect(screen.getByText('PHASE 01 · VOUS')).toBeInTheDocument();
    expect(screen.getByText('Commencez par vous')).toBeInTheDocument();
    expect(screen.getByText('Étudiant · Lyon')).toBeInTheDocument();
    expect(screen.getByText("2 projets d'école · 1 stage")).toBeInTheDocument();

    // French Phase 02
    expect(screen.getByText('PHASE 02 · PROJET & MARQUE')).toBeInTheDocument();
    expect(screen.getByText('Affinez votre idée et votre marque')).toBeInTheDocument();
    expect(screen.getByText('Gestion de projet simple pour équipes étudiantes.')).toBeInTheDocument();
    expect(screen.getByText("Clarté de l'idée")).toBeInTheDocument();

    // French Phase 03
    expect(screen.getByText('PHASE CLÉ')).toBeInTheDocument();
    expect(screen.getByText('Construisez le business derrière votre idée')).toBeInTheDocument();
    expect(screen.getByText('Intelligence Business Plan')).toBeInTheDocument();

    // French Phase 04
    expect(screen.getByText('PHASE 04 · CONSTRUCTION & LANCEMENT')).toBeInTheDocument();
    expect(screen.getByText('Préparez-vous à construire et lancer')).toBeInTheDocument();
    expect(screen.getByText('Échanger avec 5 clients')).toBeInTheDocument();
    expect(screen.getByText('Fixer votre 1er tarif')).toBeInTheDocument();

    // French Phase 05
    expect(screen.getByText('PHASE 05 · ENTREPRISE')).toBeInTheDocument();
    expect(screen.getByText('Créez votre entreprise')).toBeInTheDocument();
    expect(screen.getByText("Votre guide d'immatriculation")).toBeInTheDocument();

    // French Phase 06
    expect(screen.getByText('PHASE 06 · PROCHAINE ÉTAPE')).toBeInTheDocument();
    expect(screen.getByText('Voyez ce que vous avez construit, et continuez')).toBeInTheDocument();
    expect(screen.getByText('Votre plan de projet est prêt')).toBeInTheDocument();
    expect(screen.getByText('VOTRE PROCHAINE ACTION')).toBeInTheDocument();

    // French Breadcrumbs
    expect(screen.getByRole('button', { name: /Jump to Phase 01: Vous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 02: Marque/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 04: Plan de lancement/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 05: Société/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jump to Phase 06: Prochain chapitre/i })).toBeInTheDocument();
  });
});
