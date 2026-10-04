import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PricingPage from '@/app/pricing/page';
import FigmaPricingView from '@/components/pricing/FigmaPricingView';

describe('FigmaPricingView — Node 57424:108', () => {
  it('renders hero title and 200 free credits badge', () => {
    render(<FigmaPricingView />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Create your digital');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('company for €0.');
    expect(screen.getByText(/Pricing/i)).toBeDefined();
    expect(screen.getAllByText(/200/i).length).toBeGreaterThan(0);
  });

  it('renders credit packs with pricing cards', () => {
    render(<FigmaPricingView />);
    expect(screen.getByText(/Starter top-up/i)).toBeDefined();
    expect(screen.getByText(/€4.90/i)).toBeDefined();
    expect(screen.getByText(/Main pack/i)).toBeDefined();
    expect(screen.getByText(/€9.90/i)).toBeDefined();
    expect(screen.getByText(/Most popular/i)).toBeDefined();
    expect(screen.getByText(/Save 19%/i)).toBeDefined();
    expect(screen.getByText(/Heavy use/i)).toBeDefined();
    expect(screen.getByText(/€16.90/i)).toBeDefined();
    expect(screen.getByText(/Save 31%/i)).toBeDefined();
  });

  it('renders credit usage table with Brand, Business, and 138 credits total', () => {
    render(<FigmaPricingView />);
    expect(screen.getByText(/Brand direction/i)).toBeDefined();
    expect(screen.getByText(/Financial forecast/i)).toBeDefined();
    expect(screen.getByText(/A full journey, start to finish/i)).toBeDefined();
    expect(screen.getByText(/138 credits/i)).toBeDefined();
  });

  it('toggles FAQ accordion questions', () => {
    render(<FigmaPricingView />);
    const faqQuestion = screen.getByText(/Do I need a subscription\?/i);
    expect(faqQuestion).toBeDefined();

    // Click to open/toggle
    fireEvent.click(faqQuestion);
    expect(screen.getByText(/MBC operates on a transparent pay-as-you-go credit model/i)).toBeDefined();
  });

  it('renders full PricingPage with Navbar, FigmaPricingView, and Footer with navigation links', () => {
    render(<PricingPage />);
    expect(screen.getByTestId('public-pricing-page')).toBeDefined();
    expect(screen.getByTestId('public-header-bar')).toBeDefined();
    expect(screen.getByTestId('public-footer')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Create your digital');

    // Verify header navigation has Pricing link pointing to /pricing
    const pricingLinks = screen.getAllByRole('link', { name: /pricing/i });
    expect(pricingLinks.length).toBeGreaterThan(0);
    expect(pricingLinks[0].getAttribute('href')).toBe('/pricing');
  });
});
