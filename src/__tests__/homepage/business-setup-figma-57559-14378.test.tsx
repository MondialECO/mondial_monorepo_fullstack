import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WireframeDeliverables from '@/components/homepage/wireframe/WireframeDeliverables';
import { LanguageProvider } from '@/providers/LanguageProvider';

describe('Business Setup Deliverable Section (Figma 57559:14378)', () => {
  it('renders section 6 container with 45px padding, exact copy hierarchy, and WireframeVideoPlayer', () => {
    render(
      <LanguageProvider>
        <WireframeDeliverables />
      </LanguageProvider>
    );

    // Section 6 container
    const section6 = screen.getByTestId('deliverable-business-setup');
    expect(section6).toBeInTheDocument();
    expect(section6.className).toContain('lg:px-[45px]');
    expect(section6.className).toContain('bg-[#f7f9fc]');

    // Eyebrow
    expect(screen.getByText('Business setup')).toBeInTheDocument();

    // Two-tone Headline: "Set up your" + "company" (#3c61dd)
    expect(screen.getByRole('heading', { name: /Set up your company/i })).toBeInTheDocument();
    const highlight = screen.getByText('company');
    expect(highlight).toBeInTheDocument();
    expect(highlight).toHaveClass('text-[#3c61dd]');

    // Pill
    expect(screen.getByText('No legal jargon')).toBeInTheDocument();

    // Body text
    expect(
      screen.getByText(
        /Pick the right company type, see which documents to prepare and register step by step/
      )
    ).toBeInTheDocument();

    // WireframeVideoPlayer in Section 6
    expect(screen.getByText('INPI_Guichet_Unique_Formation_Blueprint.pdf')).toBeInTheDocument();
    expect(screen.getByText('Company Registration Video')).toBeInTheDocument();

    // Video poster check
    const video = document.querySelector('video[poster*="deliverable_06_business_setup"]');
    expect(video).toBeInTheDocument();
  });

  it('triggers autoplay when Section 6 enters the viewport', () => {
    let observerCallback: (entries: IntersectionObserverEntry[]) => void = () => {};
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();

    class MockIntersectionObserver {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observerCallback = callback;
      }
      observe = observeMock;
      disconnect = disconnectMock;
      unobserve = vi.fn();
    }

    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(
      <LanguageProvider>
        <WireframeDeliverables />
      </LanguageProvider>
    );

    expect(observeMock).toHaveBeenCalled();
  });
});
