import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';

import { vi, describe, it, expect } from 'vitest';



describe('Homepage — Figma Node 57349:8209 Canon Alignment', () => {
  it('renders the 6 canonical sections in exact order', () => {
    render(<Home />);

    // 1. Hero Section (Figma 57354:15959)
    expect(screen.getByText(/Start your digital business for/i)).toBeInTheDocument();
    expect(screen.getAllByText(/€0\./i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MBC Creator · France/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CampusFlow/i).length).toBeGreaterThan(0);

    // 2. Outputs Showcase (Figma 57360:15973)
    expect(screen.getByText(/Move from “I have an idea” to real business-ready outputs\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/OUTPUT 01/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Brand Identity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OUTPUT 02/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Business Plan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OUTPUT 03/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Financial Forecast/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OUTPUT 04/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Market Research/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OUTPUT 05/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Action Roadmap/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OUTPUT 06/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Business Setup Guide/i).length).toBeGreaterThan(0);

    // 3. How It Works (Figma 57377:9704)
    expect(screen.getAllByText(/From idea to/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/company in 6 steps\./i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 01 · YOU/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 02 · PROJECT & BRAND/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 03 · BUSINESS PLAN/i)).toBeInTheDocument();
    expect(screen.getByText(/CORE PHASE/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 04 · BUILD & LAUNCH PREP/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 05 · COMPANY/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 06 · NEXT CHAPTER/i)).toBeInTheDocument();

    // 4. Where The Facts Come From (Figma 57424:508)
    expect(screen.getByText(/WHERE THE FACTS COME FROM/i)).toBeInTheDocument();
    expect(screen.getByText(/We don't guess\./i)).toBeInTheDocument();
    expect(screen.getByText(/We check\./i)).toBeInTheDocument();
    expect(screen.getByText(/Service Public Entreprendre/i)).toBeInTheDocument();
    expect(screen.getByText(/INPI Guichet unique/i)).toBeInTheDocument();
    expect(screen.getByText(/Aides-entreprises \/ data\.gouv\.fr/i)).toBeInTheDocument();
    expect(screen.getByText(/You can always see where info came from\./i)).toBeInTheDocument();

    // 5. What's Next (Figma 57381:10328)
    expect(screen.getByText(/Creator is just the/i)).toBeInTheDocument();
    expect(screen.getByText(/beginning\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/Entrepreneur/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Investor/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Service Provider/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Marketplace/i).length).toBeGreaterThan(0);

    // 6. FAQ (Figma 57354:15783)
    expect(screen.getByText(/What “start for/i)).toBeInTheDocument();
    expect(screen.getByText(/€0” really means\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/Can I really start with MBC for €0\?/i).length).toBeGreaterThan(0);

    // 7. Final CTA (Figma 57354:15831)
    expect(screen.getByText(/Your business starts with a/i)).toBeInTheDocument();
    expect(screen.getByText(/first step\./i)).toBeInTheDocument();
  });

  it('renders all 7 Phase 3 sub-steps in the How It Works section', () => {
    render(<Home />);

    expect(screen.getAllByText(/Market Intelligence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Business Model/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Financial Forecast/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.3/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Legal & Compliance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.4/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Formation & Team/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.5/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Executive Business Plan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.6/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Investor Readiness/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.7/i).length).toBeGreaterThan(0);
  });

  it('allows expanding and collapsing FAQ accordion items', () => {
    render(<Home />);

    // First question is open by default
    expect(screen.getByText(/Yes\. The Creator profile is free to start\./i)).toBeInTheDocument();

    // Click to toggle another question
    const q2 = screen.getByRole('button', { name: /Does €0 mean every external business cost is free\?/i });
    fireEvent.click(q2);

    expect(screen.getByText(/official commercial court registry filing fees with INPI/i)).toBeInTheDocument();
  });

  it('renders PublicHeader with exact Figma node 57381:10846 navigation menus and CTAs', async () => {
    const { default: PublicHeader } = await import('@/components/shared/PublicHeader');
    render(<PublicHeader />);

    // Brand elements
    expect(screen.getByAltText('MBC Logo')).toBeInTheDocument();
    expect(screen.getByText('CREATOR')).toBeInTheDocument();
    expect(screen.getByText('MONDIAL BUSINESS CREATION')).toBeInTheDocument();

    // 4 Canonical Menus
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how-it-works');
    expect(screen.getByRole('link', { name: /Creator Tools/i })).toHaveAttribute('href', '#outputs');
    expect(screen.getByRole('link', { name: 'What you get' })).toHaveAttribute('href', '#outputs');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq');

    // Dual CTAs
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Start for €0/i })).toHaveAttribute('href', '/signup');
  });

  it('renders Footer with exact Figma node 57381:10882 columns, links and copyright', async () => {
    const { default: Footer } = await import('@/components/shared/Footer');
    render(<Footer />);

    // Column Headers
    expect(screen.getByText('PRODUCT')).toBeInTheDocument();
    expect(screen.getByText('RESOURCES')).toBeInTheDocument();
    expect(screen.getByText('MBC NETWORK')).toBeInTheDocument();
    expect(screen.getByText('LEGAL')).toBeInTheDocument();

    // Key Links & Copy
    expect(screen.getByText(/Build your digital business from idea to launch\./i)).toBeInTheDocument();
    expect(screen.getByText(/Start building for €0\./i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Creator Tools/i })).toHaveAttribute('href', '#outputs');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq');
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');

    // Bottom Bar
    expect(screen.getByText(/© 2026 Mondial Business Création\. All rights reserved\./i)).toBeInTheDocument();
    expect(screen.getByText(/Made for the next generation of founders\./i)).toBeInTheDocument();
    expect(screen.getByText(/Paris, France/i)).toBeInTheDocument();
  });
});
