import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WireframeDeliverables from '@/components/homepage/wireframe/WireframeDeliverables';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('Action Roadmap Deliverable Section (Figma 57559:14241)', () => {
  it('renders section 5 container, exact copy hierarchy, and WireframeVideoPlayer', () => {
    render(
      <LanguageProvider>
        <WireframeDeliverables />
      </LanguageProvider>
    );

    // Section 5 container
    const section5 = screen.getByTestId('deliverable-action-roadmap');
    expect(section5).toBeInTheDocument();
    expect(section5.className).toContain('lg:px-[45px]');
    expect(section5.className).toContain('bg-white');

    // Eyebrow
    expect(screen.getByText('Action roadmap')).toBeInTheDocument();

    // Two-tone Headline: "Know what to" + "do this week" (#3c61dd)
    expect(screen.getByRole('heading', { name: /Know what to do this week/i })).toBeInTheDocument();
    const highlight = screen.getByText('do this week');
    expect(highlight).toBeInTheDocument();
    expect(highlight).toHaveClass('text-[#3c61dd]');

    // Pill
    expect(screen.getByText('One step at a time')).toBeInTheDocument();

    // Body text
    expect(
      screen.getByText(
        /Your plan becomes a simple roadmap: what to do now, in the next 30 days and over the next 3 months/
      )
    ).toBeInTheDocument();

    // WireframeVideoPlayer in Section 5
    expect(screen.getByText('CampusFlow_90Day_Action_Roadmap.pdf')).toBeInTheDocument();
    expect(screen.getByText('Roadmap Walkthrough Video')).toBeInTheDocument();

    // Video poster check
    const video = document.querySelector('video[poster*="deliverable_05_action_roadmap"]');
    expect(video).toBeInTheDocument();
  });
});
