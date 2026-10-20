import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '@/providers/LanguageProvider';
import Footer from '@/components/shared/Footer';

describe('Shared Footer Component & i18n Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
  });

  it('renders the public footer with default English strings', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <Footer />
      </LanguageProvider>
    );

    // Verify container
    expect(screen.getByTestId('public-footer')).toBeDefined();

    // Verify Column 1: Brand & Socials
    expect(screen.getByText('Build your digital business from idea to launch.')).toBeDefined();
    expect(screen.getByText('Start building for €0.')).toBeDefined();
    expect(
      screen.getByText('A simpler way for the next generation of founders to turn an idea into a real business project.')
    ).toBeDefined();

    // Social Links & Accessibility
    expect(screen.getByLabelText('MBC on LinkedIn')).toBeDefined();
    expect(screen.getByLabelText('MBC on Instagram')).toBeDefined();
    expect(screen.getByLabelText('MBC on X')).toBeDefined();

    // Column 2: PRODUCT
    expect(screen.getByText('PRODUCT')).toBeDefined();
    expect(screen.getByText('Creator')).toBeDefined();
    expect(screen.getByText('Creator Tools')).toBeDefined();
    expect(screen.getByText('How it works')).toBeDefined();
    expect(screen.getByText('What you get')).toBeDefined();
    expect(screen.getByText('Pricing')).toBeDefined();

    // Column 3: RESOURCES
    expect(screen.getByText('RESOURCES')).toBeDefined();
    expect(screen.getByText('FAQ')).toBeDefined();
    expect(screen.getByText('Guides')).toBeDefined();
    expect(screen.getByText('Contact')).toBeDefined();

    // Column 4: MBC NETWORK
    expect(screen.getByText('MBC NETWORK')).toBeDefined();
    expect(screen.getByText('Entrepreneur')).toBeDefined();
    expect(screen.getByText('Investor')).toBeDefined();
    expect(screen.getByText('Service Provider')).toBeDefined();
    const comingSoonBadges = screen.getAllByText('Coming soon');
    expect(comingSoonBadges.length).toBe(3);

    // Column 5: LEGAL
    expect(screen.getByText('LEGAL')).toBeDefined();
    expect(screen.getByText('Terms of Use')).toBeDefined();
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText('Cookie Policy')).toBeDefined();

    // Bottom Bar
    expect(screen.getByText('© 2026 Mondial Business Création. All rights reserved.')).toBeDefined();
    expect(screen.getByText('Made for the next generation of founders.')).toBeDefined();
    expect(screen.getByText('Paris, France')).toBeDefined();
  });

  it('renders the public footer with French strings when locale is fr', () => {
    render(
      <LanguageProvider defaultLocale="fr">
        <Footer />
      </LanguageProvider>
    );

    // Verify Column 1 in French
    expect(screen.getByText("Créez votre entreprise numérique, de l'idée au lancement.")).toBeDefined();
    expect(screen.getByText('Commencez à créer pour 0 €.')).toBeDefined();
    expect(
      screen.getByText(
        "Une méthode plus simple pour permettre à la nouvelle génération de fondateurs de transformer une idée en un véritable projet d'entreprise."
      )
    ).toBeDefined();

    // Social aria in French
    expect(screen.getByLabelText('MBC sur LinkedIn')).toBeDefined();
    expect(screen.getByLabelText('MBC sur Instagram')).toBeDefined();
    expect(screen.getByLabelText('MBC sur X')).toBeDefined();

    // Column 2: PRODUIT
    expect(screen.getByText('PRODUIT')).toBeDefined();
    expect(screen.getByText('Créateur')).toBeDefined();
    expect(screen.getByText('Outils Créateur')).toBeDefined();
    expect(screen.getByText('Comment ça fonctionne')).toBeDefined();
    expect(screen.getByText('Ce que vous obtenez')).toBeDefined();
    expect(screen.getByText('Tarifs')).toBeDefined();

    // Column 3: RESSOURCES
    expect(screen.getByText('RESSOURCES')).toBeDefined();
    expect(screen.getByText('FAQ')).toBeDefined();
    expect(screen.getByText('Guides')).toBeDefined();
    expect(screen.getByText('Contact')).toBeDefined();

    // Column 4: RÉSEAU MBC
    expect(screen.getByText('RÉSEAU MBC')).toBeDefined();
    expect(screen.getByText('Entrepreneur')).toBeDefined();
    expect(screen.getByText('Investisseur')).toBeDefined();
    expect(screen.getByText('Prestataire de services')).toBeDefined();
    const comingSoonBadges = screen.getAllByText('Bientôt disponible');
    expect(comingSoonBadges.length).toBe(3);

    // Column 5: JURIDIQUE
    expect(screen.getByText('JURIDIQUE')).toBeDefined();
    expect(screen.getByText("Conditions d'utilisation")).toBeDefined();
    expect(screen.getByText('Politique de confidentialité')).toBeDefined();
    expect(screen.getByText('Politique relative aux cookies')).toBeDefined();

    // Bottom Bar
    expect(screen.getByText('© 2026 Mondial Business Création. Tous droits réservés.')).toBeDefined();
    expect(screen.getByText('Conçu pour la prochaine génération de fondateurs.')).toBeDefined();
    expect(screen.getByText('Paris, France')).toBeDefined();
  });

  it('allows switching languages interactively using the integrated LanguageSwitcher', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <Footer />
      </LanguageProvider>
    );

    // Initial check: English
    expect(screen.getByText('PRODUCT')).toBeDefined();
    expect(screen.queryByText('PRODUIT')).toBeNull();

    // Open language switcher
    const switcherTrigger = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(switcherTrigger);

    // Select Français
    const frOption = screen.getByRole('menuitem', { name: /français/i });
    fireEvent.click(frOption);

    // Now French strings should be displayed
    expect(screen.getByText('PRODUIT')).toBeDefined();
    expect(screen.queryByText('PRODUCT')).toBeNull();
    expect(screen.getByText('© 2026 Mondial Business Création. Tous droits réservés.')).toBeDefined();
  });

  it('verifies essential internal links are configured properly', () => {
    render(
      <LanguageProvider defaultLocale="en">
        <Footer />
      </LanguageProvider>
    );

    expect(screen.getByRole('link', { name: /^creator$/i }).getAttribute('href')).toBe('/for-creators');
    expect(screen.getByRole('link', { name: /^pricing$/i }).getAttribute('href')).toBe('/pricing');
    expect(screen.getByRole('link', { name: /terms of use/i }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('link', { name: /privacy policy/i }).getAttribute('href')).toBe('/privacy');
    expect(screen.getByRole('link', { name: /cookie policy/i }).getAttribute('href')).toBe('/privacy#cookies');
  });
});
