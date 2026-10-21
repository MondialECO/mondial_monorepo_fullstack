import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WireframeDeliverables from '@/components/homepage/wireframe/WireframeDeliverables';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('Financial Forecast Deliverable Section (Figma 57500:373)', () => {
  it('renders section 3 with exact 45px padding, copy hierarchy, tablet canvas, and 4 satellite cards', () => {
    render(
      <LanguageProvider>
        <WireframeDeliverables />
      </LanguageProvider>
    );

    // Section 3 Container
    const section3 = screen.getByTestId('deliverable-financial-forecast');
    expect(section3).toBeInTheDocument();
    expect(section3.className).toContain('lg:px-[45px]');
    expect(section3.className).toContain('bg-white');

    // Copy Content
    expect(screen.getByText('Financial forecast')).toBeInTheDocument();
    expect(screen.getByText('Plan your next 3 years')).toBeInTheDocument();
    expect(screen.getByText('Clear and honest')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Set your price, costs and budget. Get a 36-month forecast with your break-even month, cash position and unit economics, explained in plain words. No spreadsheet skills needed.'
      )
    ).toBeInTheDocument();

    // Visual Canvas
    const visual = screen.getByTestId('financial-forecast-visual');
    expect(visual).toBeInTheDocument();
    expect(visual.className).toContain('h-[340px]');
    expect(visual.className).toContain('xl:h-[640px]');

    // Satellite Card 1: Revenue
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Year 3 · €554,920')).toBeInTheDocument();
    expect(screen.getByText('Y1')).toBeInTheDocument();
    expect(screen.getByText('Y2')).toBeInTheDocument();
    expect(screen.getByText('Y3')).toBeInTheDocument();

    // Satellite Card 2: Break-even
    expect(screen.getByText('Break-even')).toBeInTheDocument();
    expect(screen.getByText('Month 7')).toBeInTheDocument();
    expect(screen.getByText('163 subscribers cover all your costs.')).toBeInTheDocument();
    expect(screen.getByText('Losses back by M12')).toBeInTheDocument();

    // Satellite Card 3: Cash
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('€34,680')).toBeInTheDocument();
    expect(screen.getByText('Lowest point, month 6')).toBeInTheDocument();

    // Satellite Card 4: Unit economics
    expect(screen.getByText('Unit economics')).toBeInTheDocument();
    expect(screen.getByText('LTV / CAC')).toBeInTheDocument();
    expect(screen.getByText('4.0x')).toBeInTheDocument();
    expect(screen.getByText('Margin')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Fully funded')).toBeInTheDocument();
  });
});
