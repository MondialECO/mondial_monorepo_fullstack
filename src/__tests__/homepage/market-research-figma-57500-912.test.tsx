import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WireframeDeliverables from '@/components/homepage/wireframe/WireframeDeliverables';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('Market Research Deliverable Section (Figma 57500:912)', () => {
  it('renders section 4 with exact 45px padding, copy hierarchy, tablet canvas, and 4 satellite cards', () => {
    render(
      <LanguageProvider>
        <WireframeDeliverables />
      </LanguageProvider>
    );

    // Section 4 Container
    const section4 = screen.getByTestId('deliverable-market-research');
    expect(section4).toBeInTheDocument();
    expect(section4.className).toContain('lg:px-[45px]');
    expect(section4.className).toContain('bg-[#f7f9fc]');

    // Copy Content
    expect(screen.getByText('Market research')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Know your market first/i })).toBeInTheDocument();
    const highlightSpan = screen.getByText('market first');
    expect(highlightSpan).toBeInTheDocument();
    expect(highlightSpan).toHaveClass('text-[#3c61dd]');
    expect(screen.getByText('Real numbers, not guesses')).toBeInTheDocument();
    expect(
      screen.getByText(
        "See how big your market really is, who to sell to first and who you're up against. We work out your TAM, SAM and SOM, then point out the gaps your idea can fill."
      )
    ).toBeInTheDocument();

    // Visual Canvas
    const visual = screen.getByTestId('market-research-visual');
    expect(visual).toBeInTheDocument();
    expect(visual.className).toContain('h-[340px]');
    expect(visual.className).toContain('xl:h-[640px]');

    // Satellite Card 1: Market size
    expect(screen.getByText('Market size')).toBeInTheDocument();
    expect(screen.getByText('€1.2B')).toBeInTheDocument();
    expect(screen.getByText('addressable market')).toBeInTheDocument();
    expect(screen.getByText('SAM €180M · SOM €4.5M')).toBeInTheDocument();

    // Satellite Card 2: Target users
    expect(screen.getByText('Target users')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Retailers')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('Café owners')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('Market traders')).toBeInTheDocument();

    // Satellite Card 3: Competitors
    expect(screen.getByText('Competitors')).toBeInTheDocument();
    expect(screen.getByText('Zettle / Square')).toBeInTheDocument();
    expect(screen.getByText('Sage / Cegid')).toBeInTheDocument();
    expect(screen.getByText('Excel & paper')).toBeInTheDocument();
    expect(screen.getAllByText('vs you')).toHaveLength(3);

    // Satellite Card 4: Demand
    expect(screen.getByText('Demand')).toBeInTheDocument();
    expect(screen.getByText('Gap found')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(
      screen.getByText('of independent retailers in France still track stock by hand.')
    ).toBeInTheDocument();
  });
});
