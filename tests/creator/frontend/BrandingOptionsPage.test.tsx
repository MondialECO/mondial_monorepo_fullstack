import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import BrandingOptionsPage from '@/app/dashboard/creator/phase-2/branding/page';
import { creatorJourneyApi } from '@/lib/api-creator-journey';

const mockPush = vi.fn();
const mockSetState = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: {
      project: {
        branding: {},
        exists: true,
      },
    },
    setState: mockSetState,
  }),
}));

describe('BrandingOptionsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders single Brand Visual Identity Studio card with 6 concrete deliverables', () => {
    render(<BrandingOptionsPage />);

    // Header & title
    expect(screen.getByText('Build your brand identity')).toBeInTheDocument();
    expect(screen.getByText('Brand Visual Identity Studio')).toBeInTheDocument();
    expect(screen.getByText(/7-Step Guided Session/i)).toBeInTheDocument();

    // Verify 6 deliverables are listed
    expect(screen.getByText(/Brand strategy confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/Curated visual direction & moodboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Architectural logo concepts in your chosen mark archetype/i)).toBeInTheDocument();
    expect(screen.getByText(/Full set of 7 canonical logo variations/i)).toBeInTheDocument();
    expect(screen.getByText(/5-role colour system with deterministic WCAG contrast/i)).toBeInTheDocument();
    expect(screen.getByText(/4-role typography system with optical role specimens/i)).toBeInTheDocument();

    // Verify old card is NOT present
    expect(screen.queryByText('Hire Verified Designer')).not.toBeInTheDocument();
    expect(screen.queryByText('Use AI Logo Tool')).not.toBeInTheDocument();

    // Verify informational text line
    expect(
      screen.getByText(/Prefer a human designer\? Hiring verified designers arrives when the marketplace opens\./i)
    ).toBeInTheDocument();
  });

  it('routes to /dashboard/creator/phase-2/brand-studio when Open Brand Studio is clicked', () => {
    render(<BrandingOptionsPage />);

    const openStudioButton = screen.getByRole('button', { name: /Open Brand Studio/i });
    fireEvent.click(openStudioButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/brand-studio');
    expect(mockSetState).toHaveBeenCalled();
  });

  it('calls skipBranding and routes to /dashboard/creator/phase-2/complete when Skip for now is clicked', async () => {
    vi.spyOn(creatorJourneyApi, 'skipBranding').mockResolvedValue({} as any);

    render(<BrandingOptionsPage />);

    const skipButton = screen.getByRole('button', { name: /Skip for now/i });
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(creatorJourneyApi.skipBranding).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/complete');
    });
  });
});
