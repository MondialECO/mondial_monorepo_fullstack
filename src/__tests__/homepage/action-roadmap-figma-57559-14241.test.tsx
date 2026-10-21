import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WireframeDeliverables from '@/components/homepage/wireframe/WireframeDeliverables';
import ActionRoadmapVisual from '@/components/homepage/wireframe/ActionRoadmapVisual';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('Action Roadmap Deliverable Section (Figma 57559:14241)', () => {
  it('renders section 5 container, exact copy hierarchy, and ActionRoadmapVisual', () => {
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

    // Action Roadmap Visual component
    const visual = screen.getByTestId('action-roadmap-visual');
    expect(visual).toBeInTheDocument();
  });

  it('renders isolated ActionRoadmapVisual with all cards, badges, and stats from Figma', () => {
    render(
      <LanguageProvider>
        <ActionRoadmapVisual />
      </LanguageProvider>
    );

    // Banner
    expect(screen.getByTestId('roadmap-banner')).toBeInTheDocument();
    expect(screen.getByText('Update available')).toBeInTheDocument();
    expect(screen.getByText(/Changes to your project information or availability/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Keep current plan/i })).toBeInTheDocument();

    // Availability card
    expect(screen.getByTestId('roadmap-availability-card')).toBeInTheDocument();
    expect(screen.getByText('YOUR AVAILABILITY')).toBeInTheDocument();
    expect(screen.getByText('4 hours')).toBeInTheDocument();
    expect(screen.getByText('/ week')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adjust availability/i })).toBeInTheDocument();

    expect(screen.getByText('PLANNED NOW')).toBeInTheDocument();
    expect(screen.getAllByText('2 tasks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('· 2.5 hrs')).toBeInTheDocument();
    expect(screen.getByText('Within weekly capacity')).toBeInTheDocument();

    expect(screen.getByText('PLAN STATUS')).toBeInTheDocument();
    expect(screen.getByText('Ready for review')).toBeInTheDocument();
    expect(screen.getByText('Awaiting activation')).toBeInTheDocument();

    expect(
      screen.getByText(/Your immediate workload is based on the time you can commit/)
    ).toBeInTheDocument();

    // START HERE card
    expect(screen.getByTestId('roadmap-start-here-card')).toBeInTheDocument();
    expect(screen.getByText('START HERE')).toBeInTheDocument();
    expect(
      screen.getAllByText('Prepare a technical delivery brief').length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/Describe the first product version so technical specialists can estimate the work/)
    ).toBeInTheDocument();
    expect(screen.getByText('Critical priority')).toBeInTheDocument();
    expect(screen.getByText('Estimated effort: 1.5 hours')).toBeInTheDocument();
    expect(screen.getByText('No prerequisites')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View task/i })).toBeInTheDocument();

    // Now section
    expect(screen.getByTestId('roadmap-now-section')).toBeInTheDocument();
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('Immediate focus')).toBeInTheDocument();
    expect(screen.getAllByText('Critical').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1.5 hours')).toBeInTheDocument();
    expect(screen.getAllByText('Ready to start').length).toBeGreaterThanOrEqual(1);
  });

  it('supports interactive adjustments and task preview expansion', () => {
    render(
      <LanguageProvider>
        <ActionRoadmapVisual />
      </LanguageProvider>
    );

    // Click "Adjust availability"
    const adjustBtn = screen.getByRole('button', { name: /Adjust availability/i });
    fireEvent.click(adjustBtn);

    // Hours buttons appear
    const eightHrsBtn = screen.getByRole('button', { name: /8 hrs/i });
    expect(eightHrsBtn).toBeInTheDocument();

    // Select 8 hours
    fireEvent.click(eightHrsBtn);
    expect(screen.getByText('8 hours')).toBeInTheDocument();

    // Click "View task ↓"
    const viewTaskBtn = screen.getByRole('button', { name: /View task/i });
    fireEvent.click(viewTaskBtn);
    expect(screen.getByText(/Task Brief & Acceptance Criteria/i)).toBeInTheDocument();

    // Dismiss banner
    const keepPlanBtn = screen.getByRole('button', { name: /Keep current plan/i });
    fireEvent.click(keepPlanBtn);
    expect(screen.queryByTestId('roadmap-banner')).not.toBeInTheDocument();
  });
});
