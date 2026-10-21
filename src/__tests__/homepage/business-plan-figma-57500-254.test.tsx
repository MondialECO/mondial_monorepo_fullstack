import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WireframeDeliverables from '@/components/homepage/wireframe/WireframeDeliverables';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('Business Plan Deliverable Section (Figma 57500:254)', () => {
  it('renders section 2 with 45px padding, exact copy, and video player', () => {
    render(
      <LanguageProvider>
        <WireframeDeliverables />
      </LanguageProvider>
    );

    // Section 2 container
    const section2 = screen.getByTestId('deliverable-business-plan');
    expect(section2).toBeInTheDocument();
    expect(section2.className).toContain('lg:px-[45px]');
    expect(section2.className).toContain('bg-[#f7f9fc]');

    // Copy texts
    expect(screen.getByText('Business plan')).toBeInTheDocument();
    expect(screen.getByText('Turn your idea into a real plan')).toBeInTheDocument();
    expect(screen.getByText('Ready for investors')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your answers become a clear business plan: summary, market, business model and more. Read it, edit it, and download it as a PDF in one click.'
      )
    ).toBeInTheDocument();

    // Video Player
    expect(screen.getByText('CampusFlow_Business_Plan_v1.pdf')).toBeInTheDocument();
    expect(screen.getByText('Interactive Plan Video')).toBeInTheDocument();
  });
});
