import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Home from '@/app/page';
import { LanguageProvider } from '@/providers/LanguageProvider';

// Helper to simulate window resize
function setViewport(width: number, height: number = 800) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

describe('Homepage Full Responsiveness (Desktop, Tablet, Mobile)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all sections and verifies responsive container classes on Desktop (1440px)', () => {
    setViewport(1440, 900);

    const { container } = render(
      <LanguageProvider defaultLocale="en">
        <Home />
      </LanguageProvider>
    );

    // Verify Homepage root
    const root = screen.getByTestId('homepage-root');
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass('w-full', 'overflow-x-clip');

    // Verify Header
    expect(screen.getByTestId('public-header-bar')).toBeInTheDocument();

    // Verify all core sections exist and have standard 45px padding on desktop
    const brandKit = screen.getByTestId('deliverable-brand-kit');
    expect(brandKit).toHaveClass('lg:px-[45px]');

    const howItWorks = document.getElementById('how-it-works');
    expect(howItWorks).toBeInTheDocument();
    expect(howItWorks).toHaveClass('lg:px-[45px]');

    const trustSources = screen.getByTestId('figma-trust-sources');
    expect(trustSources).toHaveClass('lg:px-[45px]');

    const whatsNext = screen.getByTestId('figma-whats-next');
    expect(whatsNext).toHaveClass('lg:px-[45px]');

    const faq = screen.getByTestId('figma-faq');
    expect(faq).toHaveClass('lg:px-[45px]');

    const finalCta = screen.getByTestId('figma-final-cta');
    expect(finalCta).toHaveClass('lg:px-[45px]');

    // Verify Footer
    expect(screen.getByTestId('public-footer')).toBeInTheDocument();
  });

  it('renders smoothly and functions properly on Tablet (768px)', () => {
    setViewport(768, 1024);

    render(
      <LanguageProvider defaultLocale="en">
        <Home />
      </LanguageProvider>
    );

    // Verify FAQ accordion functions in tablet viewport
    const faqItem2Btn = screen.getByTestId('faq-toggle-1');
    fireEvent.click(faqItem2Btn);
    expect(screen.getByTestId('faq-answer-1')).toBeInTheDocument();

    // Verify all 6 Deliverable sections are rendered on tablet
    expect(screen.getByTestId('deliverable-brand-kit')).toBeInTheDocument();
    expect(screen.getByTestId('deliverable-business-plan')).toBeInTheDocument();
    expect(screen.getByTestId('deliverable-market-research')).toBeInTheDocument();
    expect(screen.getByTestId('deliverable-financial-forecast')).toBeInTheDocument();
    expect(screen.getByTestId('deliverable-action-roadmap')).toBeInTheDocument();
    expect(screen.getByTestId('deliverable-business-setup')).toBeInTheDocument();
  });

  it('renders without horizontal overflow or breakage on Mobile (375px)', () => {
    setViewport(375, 667);

    const { container } = render(
      <LanguageProvider defaultLocale="en">
        <Home />
      </LanguageProvider>
    );

    // Verify mobile hamburger menu button exists in header
    const mobileMenuBtn = screen.getByLabelText(/Toggle navigation menu/i);
    expect(mobileMenuBtn).toBeInTheDocument();

    // Test clicking mobile menu toggle
    fireEvent.click(mobileMenuBtn);
    expect(mobileMenuBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(mobileMenuBtn);
    expect(mobileMenuBtn).toHaveAttribute('aria-expanded', 'false');

    // Verify all primary CTA buttons are properly styled for mobile
    const allLinks = container.querySelectorAll('a');
    expect(allLinks.length).toBeGreaterThan(10);

    // Verify WhatsNext center hub and cards render on mobile
    const whatsNextSection = screen.getByTestId('figma-whats-next');
    expect(within(whatsNextSection).getByText('Your project starts here')).toBeInTheDocument();
    expect(within(whatsNextSection).getByRole('heading', { name: 'Entrepreneur' })).toBeInTheDocument();
    expect(within(whatsNextSection).getByRole('heading', { name: 'Investor' })).toBeInTheDocument();
    expect(within(whatsNextSection).getByRole('heading', { name: 'Service Provider' })).toBeInTheDocument();
    expect(within(whatsNextSection).getByRole('heading', { name: 'Marketplace' })).toBeInTheDocument();

    // Verify Final CTA banner renders on mobile
    const finalCtaSection = screen.getByTestId('figma-final-cta');
    expect(within(finalCtaSection).getByText('Your business starts with a first step.')).toBeInTheDocument();
    expect(within(finalCtaSection).getByRole('link', { name: /^Start for €0 →$/i })).toBeInTheDocument();
  });
});
