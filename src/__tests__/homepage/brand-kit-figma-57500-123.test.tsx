import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WireframeDeliverables from '@/components/homepage/wireframe/WireframeDeliverables';
import BrandKitVisual from '@/components/homepage/wireframe/BrandKitVisual';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('Brand Kit Deliverable Section (Figma 57500:123)', () => {
  it('renders section 1 container and BrandKitVisual with all cards and badges', () => {
    render(
      <LanguageProvider>
        <WireframeDeliverables />
      </LanguageProvider>
    );

    // Section 1 container
    const section1 = screen.getByTestId('deliverable-brand-kit');
    expect(section1).toBeInTheDocument();

    // Section 1 Copy texts
    expect(screen.getAllByText('Brand kit')).toHaveLength(2);
    expect(screen.getByText('Build your brand identity')).toBeInTheDocument();
    expect(screen.getByText('Simple, fast, pro')).toBeInTheDocument();
    expect(
      screen.getByText(/Answer a few questions and get your logo, colours and fonts/)
    ).toBeInTheDocument();

    // Brand Kit Visual
    const visual = screen.getByTestId('brand-kit-visual');
    expect(visual).toBeInTheDocument();

    // Cards and labels
    expect(screen.getAllByText('AutoInvoice')).toHaveLength(2);
    expect(screen.getByText('All six steps complete')).toBeInTheDocument();
    expect(screen.getByText('↓ Download Brand Kit')).toBeInTheDocument();
    expect(screen.getAllByText('MBC')).toHaveLength(2);
    expect(screen.getByText('Colours')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Kit ready')).toBeInTheDocument();
  });

  it('renders isolated BrandKitVisual with exact cards and studio preview', () => {
    render(
      <LanguageProvider>
        <BrandKitVisual />
      </LanguageProvider>
    );

    expect(screen.getByTestId('brand-kit-visual')).toBeInTheDocument();
    expect(screen.getByText('7 VARIATIONS · Open in Studio')).toBeInTheDocument();
    expect(screen.getByText('✓ Contrast checked')).toBeInTheDocument();
  });
});
