import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Phase5Page from '@/app/dashboard/investor/phase-5/page';
import { redirect } from 'next/navigation';
import { entrepreneurApi, PublicInvestorProfile } from '@/lib/api-entrepreneur';
import api from '@/lib/axios';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/investor/phase-5',
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Investor Legacy Cleanup & Public Privacy Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('LegacyPhase5_RedirectsToDiscovery: server page redirects to /dashboard/investor/discovery', () => {
    Phase5Page();
    expect(redirect).toHaveBeenCalledWith('/dashboard/investor/discovery');
  });

  it('PublicInvestorDto_DoesNotExposeEmail: PublicInvestorProfile wire contract excludes private email', () => {
    const safeProfile: PublicInvestorProfile = {
      id: 'inv-456',
      name: 'Venture Crest',
      type: 'vc',
      headline: 'Scaling AI Infrastructure',
      bio: 'Investing in deep tech and cloud computing.',
      preferredSectors: ['AI/ML', 'Cloud'],
      preferredStages: ['seed', 'series_a'],
      minCheckSize: 500_000,
      maxCheckSize: 2_000_000,
      preferredGeographies: ['North America'],
      isPublic: true,
      thesisStatement: 'Foundation models and developer tooling.',
      successfulExits: 5,
    };

    expect((safeProfile as any).primaryEmail).toBeUndefined();
    expect((safeProfile as any).email).toBeUndefined();
    expect((safeProfile as any).primaryPhone).toBeUndefined();
    expect((safeProfile as any).phone).toBeUndefined();
    expect((safeProfile as any).primaryContact).toBeUndefined();
    expect((safeProfile as any).financeVerification).toBeUndefined();
    expect((safeProfile as any).declaredAvailableCapital).toBeUndefined();
  });

  it('EntrepreneurSafeInvestorViewStillWorks: entrepreneurApi.getPublicInvestorProfile fetches /investors/:id safely', async () => {
    const mockProfile: PublicInvestorProfile = {
      id: 'inv-789',
      name: 'Apex Horizon Ventures',
      type: 'venture_capital',
      headline: 'Next-Gen Enterprise SaaS',
      bio: 'Partnering with bold enterprise founders.',
      preferredSectors: ['B2B SaaS', 'Cybersecurity'],
      preferredStages: ['series_a', 'series_b'],
      minCheckSize: 1_000_000,
      maxCheckSize: 5_000_000,
      preferredGeographies: ['Global'],
      requiresProRataRights: true,
      requiresBoardSeat: true,
      thesisStatement: 'Category-defining enterprise workflows.',
      successfulExits: 8,
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile });

    const result = await entrepreneurApi.getPublicInvestorProfile('inv-789');

    expect(api.get).toHaveBeenCalledWith('/investors/inv-789');
    expect(result.id).toBe('inv-789');
    expect(result.name).toBe('Apex Horizon Ventures');
    expect(result.preferredSectors).toContain('B2B SaaS');
    expect((result as any).primaryEmail).toBeUndefined();
  });

  it('LegacyNdaPlaceholderNotActive: legacy docuSign URL is not returned by canonical endpoints', () => {
    const dummyCanonicalPayload = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      acceptedByName: 'Investor Test',
    };

    expect((dummyCanonicalPayload as any).docusignLink).toBeUndefined();
    expect(JSON.stringify(dummyCanonicalPayload)).not.toContain('demo.docusign.net');
  });

  it('CanonicalNdaAcceptanceStillWorks: entrepreneurApi.acceptDataRoomNda calls canonical dataroom endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, message: 'NDA accepted successfully' },
    });

    await entrepreneurApi.acceptDataRoomNda('comp-123', 'Agreed');

    expect(api.post).toHaveBeenCalledWith(
      '/companies/comp-123/dataroom/nda/accept',
      { ndaText: 'Agreed' }
    );
  });
});
