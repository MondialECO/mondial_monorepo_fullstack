import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '@/providers/LanguageProvider';
import Navbar from '@/components/shared/Navbar';
import PublicHeader from '@/components/shared/PublicHeader';

describe('Shared Header Component & i18n Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
  });

  it('renders the public header with default English strings', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <PublicHeader />
      </LanguageProvider>
    );

    // Verify container
    expect(screen.getByTestId('public-header-bar')).toBeDefined();

    // Verify Brand Title & Badge
    expect(screen.getByText('CREATOR')).toBeDefined();
    expect(screen.getByText('MONDIAL BUSINESS CREATION')).toBeDefined();

    // Navigation Links
    expect(screen.getByText('How it works')).toBeDefined();
    expect(screen.getByText('Creator Tools')).toBeDefined();
    expect(screen.getByText('What you get')).toBeDefined();
    expect(screen.getByText('Pricing')).toBeDefined();
    expect(screen.getByText('FAQ')).toBeDefined();

    // CTAs
    expect(screen.getByText('Sign in')).toBeDefined();
    expect(screen.getByText('Start for €0')).toBeDefined();
  });

  it('renders the public header with French strings when locale is fr', () => {
    render(
      <LanguageProvider defaultLocale="fr">
        <PublicHeader />
      </LanguageProvider>
    );

    // Verify Brand Badge
    expect(screen.getByText('CRÉATEUR')).toBeDefined();

    // Navigation Links in French
    expect(screen.getByText('Comment ça fonctionne')).toBeDefined();
    expect(screen.getByText('Outils Créateur')).toBeDefined();
    expect(screen.getByText('Ce que vous obtenez')).toBeDefined();
    expect(screen.getByText('Tarifs')).toBeDefined();
    expect(screen.getByText('FAQ')).toBeDefined();

    // CTAs in French
    expect(screen.getByText('Se connecter')).toBeDefined();
    expect(screen.getByText('Commencer pour 0 €')).toBeDefined();
  });

  it('switches header strings dynamically using the integrated LanguageSwitcher', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <Navbar />
      </LanguageProvider>
    );

    // Initial state: English
    expect(screen.getByText('How it works')).toBeDefined();
    expect(screen.getByText('Sign in')).toBeDefined();
    expect(screen.queryByText('Comment ça fonctionne')).toBeNull();

    // Open first language switcher (desktop)
    const switcherTriggers = screen.getAllByRole('button', { name: /select language/i });
    fireEvent.click(switcherTriggers[0]);

    // Choose French
    const frOptions = screen.getAllByRole('menuitem', { name: /français/i });
    fireEvent.click(frOptions[0]);

    // Header updates to French
    expect(screen.getByText('Comment ça fonctionne')).toBeDefined();
    expect(screen.getByText('Se connecter')).toBeDefined();
    expect(screen.getByText('Commencer pour 0 €')).toBeDefined();
    expect(screen.queryByText('How it works')).toBeNull();
  });

  it('renders and toggles the mobile drawer with translated links', () => {
    render(
      <LanguageProvider defaultLocale="fr">
        <PublicHeader />
      </LanguageProvider>
    );

    // Click mobile hamburger toggle
    const toggleButton = screen.getByRole('button', { name: /basculer le menu de navigation/i });
    fireEvent.click(toggleButton);

    // Drawer opens, links are present in duplicate (desktop + mobile)
    const howItWorks = screen.getAllByText('Comment ça fonctionne');
    expect(howItWorks.length).toBe(2);

    const startButtons = screen.getAllByText('Commencer pour 0 €');
    expect(startButtons.length).toBe(2);
  });
});
