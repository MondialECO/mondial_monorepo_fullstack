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
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
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
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/steps/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/minutes/i)).toBeInTheDocument();
    expect(screen.getByText('Editable later')).toBeInTheDocument();

    // Verify 6 deliverables are listed per Figma frame 56999:8076
    expect(screen.getByText(/Brand strategy confirmed from your idea/i)).toBeInTheDocument();
    expect(screen.getByText(/A visual direction you choose/i)).toBeInTheDocument();
    expect(screen.getByText(/Logo concepts in the style you pick/i)).toBeInTheDocument();
    expect(screen.getByText(/Seven logo variations — SVG and PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Five-role colour system, contrast checked/i)).toBeInTheDocument();
    expect(screen.getByText(/Four-role typography system, open licence/i)).toBeInTheDocument();

    // Verify old card is NOT present
    expect(screen.queryByText('Hire Verified Designer')).not.toBeInTheDocument();
    expect(screen.queryByText('Use AI Logo Tool')).not.toBeInTheDocument();

    // Verify informational text lines
    expect(
      screen.getByText(/Work with an M50 Verified Designer/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Neutral placeholders will be used; you can brand your venture anytime\./i)
    ).toBeInTheDocument();
  });

  it('routes to /dashboard/creator/phase-2/brand-studio when Open Brand Studio is clicked', () => {
    render(<BrandingOptionsPage />);

    const openStudioButton = screen.getByRole('button', { name: /Open Brand Studio/i });
    fireEvent.click(openStudioButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/brand-studio');
    expect(mockSetState).toHaveBeenCalled();
  });

  it('calls skipBranding and routes to /dashboard/creator/phase-2/complete when Skip Branding for Now is clicked', async () => {
    vi.spyOn(creatorJourneyApi, 'skipBranding').mockResolvedValue({} as any);

    render(<BrandingOptionsPage />);

    const skipButton = screen.getByRole('button', { name: /Skip Branding for Now/i });
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(creatorJourneyApi.skipBranding).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/complete');
    });
  });
});
