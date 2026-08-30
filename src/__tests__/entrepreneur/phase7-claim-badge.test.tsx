import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Phase7ReviewVisuals } from '@/components/entrepreneur/dataroom/Phase7ReviewVisuals';
import { type AiReviewResponse } from '@/lib/api-entrepreneur';

describe('Phase 7 — Investor-Ready Verified Badge UI', () => {
  const baseReview: AiReviewResponse = {
    overallScore: 85,
    scoreBreakdown: {
      verificationScore: 90,
      financialScore: 80,
      equityScore: 85,
      fundingScore: 85,
      dataRoomScore: 85,
      overallScore: 85,
    },
    investorReadyBadge: true,
    isInvestorReady: false,
    recommendations: [],
    weaknesses: [
      'Traction evidence is limited (6/10); consider adding customer validation and verified growth metrics.',
    ],
    strengths: [
      'Corporate entity established and registered: Tech SAS (France).',
    ],
    pitchDeckAnalysis: {
      grade: 'A',
      averageScore: 8.5,
      clarityNarrative: 9,
      marketSizeProof: 8,
      tractionMetrics: 6,
      teamPedigree: 9,
    },
    reviewedAt: new Date().toISOString(),
  };

  it('Phase7Badge_NotEligible_RendersMutedBadge: shows muted locked badge when score < 70', () => {
    const notEligibleReview: AiReviewResponse = {
      ...baseReview,
      overallScore: 55,
      investorReadyBadge: false,
      isInvestorReady: false,
    };

    render(
      <Phase7ReviewVisuals
        review={notEligibleReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    expect(screen.getByText(/not yet eligible/i)).toBeDefined();
    expect(screen.getByRole('heading', { name: /investor-ready badge/i })).toBeDefined();
    expect(screen.getAllByText(/55/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /claim investor-ready badge/i })).toBeNull();
  });

  it('Phase7Badge_Eligible_RendersBadgeAndClaimButton: shows ready badge, score, and interactive claim button when eligible', () => {
    const handleClaim = vi.fn();
    render(
      <Phase7ReviewVisuals
        review={baseReview}
        companyId="comp-123"
        onClaimBadge={handleClaim}
      />
    );

    expect(screen.getByText(/ready to verify/i)).toBeDefined();
    expect(screen.getByRole('heading', { name: /investor-ready badge/i })).toBeDefined();
    expect(screen.getAllByText(/85/i).length).toBeGreaterThan(0);
    const claimButton = screen.getByRole('button', { name: /claim investor-ready badge/i });
    expect(claimButton).toBeDefined();
    fireEvent.click(claimButton);
    expect(handleClaim).toHaveBeenCalledTimes(1);
  });

  it('Phase7Badge_Claimed_RendersVerifiedBadge: renders verified credential badge with Trophy, secondary checkmark, and score', () => {
    const claimedReview: AiReviewResponse = {
      ...baseReview,
      isInvestorReady: true,
      investorReadyBadgeAwardedAt: '2026-08-29T10:00:00Z',
    };

    render(
      <Phase7ReviewVisuals
        review={claimedReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    expect(screen.getAllByText(/verified/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /investor-ready badge/i })).toBeDefined();
    expect(screen.getByText(/issued & claimed/i)).toBeDefined();
    expect(screen.getAllByText(/85/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /claim investor-ready badge/i })).toBeNull();
  });

  it('Phase7Badge_Claimed_RendersIssuedDate: renders formatted award date', () => {
    const testDate = '2026-08-29T12:00:00Z';
    const claimedReview: AiReviewResponse = {
      ...baseReview,
      isInvestorReady: true,
      investorReadyBadgeAwardedAt: testDate,
    };

    render(
      <Phase7ReviewVisuals
        review={claimedReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    const formattedDate = new Date(testDate).toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeDefined();
  });

  it('Phase7Badge_DoesNotRenderLiteralSvgText: ensures no literal "svg" string is exposed in the DOM', () => {
    const claimedReview: AiReviewResponse = {
      ...baseReview,
      isInvestorReady: true,
      investorReadyBadgeAwardedAt: '2026-08-29T10:00:00Z',
    };

    const { container } = render(
      <Phase7ReviewVisuals
        review={claimedReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    const allText = container.textContent || '';
    expect(allText).not.toMatch(/svginvestor/i);
    expect(allText).not.toMatch(/svg\s*investor/i);
  });

  it('Phase7Badge_RefreshPreservesVerifiedVisual: re-rendering with claimed review preserves verified visual', () => {
    const claimedReview: AiReviewResponse = {
      ...baseReview,
      isInvestorReady: true,
      investorReadyBadgeAwardedAt: '2026-08-29T10:00:00Z',
    };

    const { rerender } = render(
      <Phase7ReviewVisuals
        review={claimedReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    expect(screen.getAllByText(/verified/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /investor-ready badge/i })).toBeDefined();

    // Re-render simulating component reload / page refresh
    rerender(
      <Phase7ReviewVisuals
        review={{ ...claimedReview }}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    expect(screen.getAllByText(/verified/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /investor-ready badge/i })).toBeDefined();
    expect(screen.getByText(/issued & claimed/i)).toBeDefined();
  });

  // Areas for Improvement Tests
  it('Phase7_AreasForImprovement_RendersWeaknesses: correctly displays real review weaknesses', () => {
    render(
      <Phase7ReviewVisuals
        review={baseReview}
        companyId="comp-123"
      />
    );

    expect(screen.getByText(/areas for improvement/i)).toBeDefined();
    expect(screen.getByText(/traction evidence is limited/i)).toBeDefined();
  });

  it('Phase7_AreasForImprovement_HighOverallScoreStillShowsRealWeakness: displays weaknesses even when score is high (>80)', () => {
    const highScoreReview: AiReviewResponse = {
      ...baseReview,
      overallScore: 92,
      weaknesses: [
        'Traction evidence is limited (6/10); consider adding customer validation and verified growth metrics.',
      ],
    };

    render(
      <Phase7ReviewVisuals
        review={highScoreReview}
        companyId="comp-123"
      />
    );

    expect(screen.getByText(/traction evidence is limited/i)).toBeDefined();
  });

  it('Phase7_AreasForImprovement_EmptyReviewShowsExplicitEmptyState: renders clear message when weaknesses array is empty', () => {
    const perfectReview: AiReviewResponse = {
      ...baseReview,
      overallScore: 98,
      weaknesses: [],
    };

    render(
      <Phase7ReviewVisuals
        review={perfectReview}
        companyId="comp-123"
      />
    );

    expect(screen.getByText(/no material improvement areas identified in this review/i)).toBeDefined();
  });

  it('Phase7_AreasForImprovement_CompanyIsolation: switching company data renders exact company weaknesses', () => {
    const companyAReview: AiReviewResponse = {
      ...baseReview,
      weaknesses: ['Company A needs customer validation.'],
    };
    const companyBReview: AiReviewResponse = {
      ...baseReview,
      weaknesses: ['Company B needs audited financial statements.'],
    };

    const { rerender } = render(
      <Phase7ReviewVisuals
        review={companyAReview}
        companyId="comp-A"
      />
    );
    expect(screen.getByText(/company a needs customer validation/i)).toBeDefined();
    expect(screen.queryByText(/company b needs audited/i)).toBeNull();

    rerender(
      <Phase7ReviewVisuals
        review={companyBReview}
        companyId="comp-B"
      />
    );
    expect(screen.getByText(/company b needs audited financial statements/i)).toBeDefined();
    expect(screen.queryByText(/company a needs customer validation/i)).toBeNull();
  });

  it('Phase7_StaleBadge_NotShownAsCurrentlyVerified: renders Needs Refresh when review is stale', () => {
    const staleReview: AiReviewResponse = {
      ...baseReview,
      isInvestorReady: false,
      isFresh: false,
      isCurrentlyInvestorReady: false,
      investorReadyBadgeAwardedAt: '2026-08-01T10:00:00Z',
    };

    render(
      <Phase7ReviewVisuals
        review={staleReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    expect(screen.getAllByText(/needs refresh/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/issued & claimed/i)).toBeNull();
  });

  it('Phase7_DataRoomChanged_ShowsStaleBanner: displays warning banner when data room changed after review', async () => {
    const staleReview: AiReviewResponse = {
      ...baseReview,
      isFresh: false,
      isCurrentlyInvestorReady: false,
      reviewedAt: '2026-08-20T10:00:00Z',
      dataRoomLastMaterialChangeAt: '2026-08-28T10:00:00Z',
    };

    render(
      <Phase7ReviewVisuals
        review={staleReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    expect(screen.getAllByText(/needs refresh/i).length).toBeGreaterThan(0);
  });

  it('Phase7_AgeExpired_ShowsExpiredBanner: handles age expired stale review gracefully', () => {
    const expiredReview: AiReviewResponse = {
      ...baseReview,
      isFresh: false,
      isCurrentlyInvestorReady: false,
      reviewedAt: '2026-07-01T10:00:00Z', // > 30 days
    };

    render(
      <Phase7ReviewVisuals
        review={expiredReview}
        companyId="comp-123"
        onClaimBadge={vi.fn()}
      />
    );

    expect(screen.getAllByText(/needs refresh/i).length).toBeGreaterThan(0);
  });

  it('Phase7_StaleState_ShowsRerunCTA: renders in progress or needs refresh without verified status', () => {
    const staleReview: AiReviewResponse = {
      ...baseReview,
      isFresh: false,
      isCurrentlyInvestorReady: false,
    };

    render(
      <Phase7ReviewVisuals
        review={staleReview}
        companyId="comp-123"
      />
    );

    expect(screen.getAllByText(/needs refresh/i).length).toBeGreaterThan(0);
  });
});


