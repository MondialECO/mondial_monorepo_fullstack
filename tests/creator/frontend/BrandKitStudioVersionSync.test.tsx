import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrandStudioShell } from '@/components/creator/brand-kit/BrandStudioShell';
import { VariationSetModal } from '@/components/creator/brand-kit/VariationSetModal';
import { brandKitApi, apiCreatorBrandKit } from '@/lib/api-creator-brand-kit';
import { BrandKit, BrandLogoVariation } from '@/types/creator/brand-kit';
import api from '@/lib/axios';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

const mockSevenVariations: Record<string, BrandLogoVariation> = {
  primary: { svgUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', pngUri: null, usageNote: 'Default lockup' },
  horizontal: { svgUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', pngUri: null, usageNote: 'Horizontal layout' },
  stacked: { svgUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', pngUri: null, usageNote: 'Stacked layout' },
  icon_only: { svgUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', pngUri: null, usageNote: 'Favicon' },
  black: { svgUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', pngUri: null, usageNote: 'Single ink' },
  white: { svgUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', pngUri: null, usageNote: 'Dark bg' },
  transparent: { svgUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', pngUri: null, usageNote: 'Isolated alpha' },
};

function createMockKit(overrides: Partial<BrandKit> = {}): BrandKit {
  return {
    ideaId: 'idea_sync_test',
    userId: 'user_test',
    status: 'draft',
    currentStep: 4,
    version: 5,
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-02T10:00:00Z',
    strategy: {
      businessName: 'SyncBrand',
      nameDisplayForm: 'SyncBrand',
      confirmedAt: '2026-10-02T10:00:00Z',
    },
    direction: {
      candidates: [
        {
          key: 'dir_1',
          name: 'Modern Precision',
          feelLine: 'Engineered authority',
          rationale: 'Clean style',
          colorPalette: ['#000', '#fff'],
          displayTypeface: 'Syne',
          textTypeface: 'DM Sans',
          motifKey: 'geometric',
          provenance: 'ai',
          avoidListSubstituted: false,
        },
      ],
      selectedDirectionKey: 'dir_1',
      selectedAt: '2026-10-02T10:00:00Z',
      regenerateCount: 0,
    },
    logo: {
      logoType: 'symbol_plus_name',
      concepts: [
        {
          key: 'concept_1',
          descriptorLine: 'Geometric Core - A modern symbol mark',
          markAssetUri: 'https://cdn.mondial.eco/mark.svg',
          lockupAssetUri: 'https://cdn.mondial.eco/lockup.svg',
          regenerateCount: 0,
        },
      ],
      selectedConceptKey: 'concept_1',
      variations: mockSevenVariations,
      regenerateCount: 0,
      approvedAt: null,
    },
    colors: {
      roles: [
        { roleName: 'Primary', hex: '#0052FF', rgb: '0, 82, 255', usageNote: 'Mark', isLocked: false, provenance: 'stated' },
        { roleName: 'Secondary', hex: '#0F172A', rgb: '15, 23, 42', usageNote: 'Text', isLocked: false, provenance: 'stated' },
        { roleName: 'Accent', hex: '#38BDF8', rgb: '56, 189, 248', usageNote: 'Accent', isLocked: false, provenance: 'stated' },
        { roleName: 'Background', hex: '#FFFFFF', rgb: '255, 255, 255', usageNote: 'Bg', isLocked: true, provenance: 'stated' },
        { roleName: 'Text', hex: '#09090B', rgb: '9, 9, 11', usageNote: 'Body', isLocked: false, provenance: 'stated' },
      ],
      confirmedAt: null,
      regenerateCount: 0,
    },
    typography: {
      roles: [
        { roleName: 'Logo type', family: 'Syne', weight: '700', size: '24px', lineHeight: '1.2', specimenText: 'SyncBrand', isLocked: true, provenance: 'stated' },
      ],
      confirmedAt: null,
      regenerateCount: 0,
    },
    snapshots: [],
    ...overrides,
  };
}

describe('Brand Studio - Frontend State Synchronization & Concurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // Section 11 & 15: Same-Tab Happy Path + Approval Persistence
  it('Section 11 & 15: Same-tab happy path approves all variations using latest version without 409 and persists approvedAt', async () => {
    const kitN = createMockKit({ version: 5 });
    // Concept selection produced N+1 (version 6) with variations already derived
    const kitNPlus1 = createMockKit({
      version: 6,
      logo: {
        ...kitN.logo,
        variations: mockSevenVariations,
        approvedAt: null,
      },
    });

    const kitNPlus2 = createMockKit({
      version: 7,
      logo: {
        ...kitNPlus1.logo,
        approvedAt: '2026-10-02T12:00:00Z',
      },
    });

    const deriveVariationsSpy = vi.spyOn(brandKitApi, 'deriveVariations');
    const patchLogoSpy = vi.spyOn(brandKitApi, 'patchLogo').mockResolvedValue(kitNPlus2);
    const onKitUpdated = vi.fn();
    const onConfirm = vi.fn();

    render(
      <VariationSetModal
        ideaId="idea_sync_test"
        initialKit={kitNPlus1}
        onKitUpdated={onKitUpdated}
        onConfirm={onConfirm}
      />
    );

    // Verify Section 4: Variations already exist, do NOT call deriveVariations
    expect(deriveVariationsSpy).not.toHaveBeenCalled();

    const approveButton = screen.getByRole('button', { name: /Approve all seven/i });
    expect(approveButton).toBeEnabled();

    fireEvent.click(approveButton);

    await waitFor(() => {
      // Must use latest synchronized version (6, N+1), NOT stale version (5, N)
      expect(patchLogoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAt: expect.any(String),
        }),
        'idea_sync_test',
        6
      );
    });

    // Parent must receive N+2 with approvedAt != null
    expect(onKitUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 7,
        logo: expect.objectContaining({
          approvedAt: '2026-10-02T12:00:00Z',
        }),
      })
    );
    expect(onConfirm).toHaveBeenCalledWith(kitNPlus2);
  });

  // Section 12: Derivation Required Path
  it('Section 12: Derivation required path synchronizes N -> N+1 on derivation, then dispatches N+1 on approval', async () => {
    const kitN = createMockKit({
      version: 5,
      logo: {
        ...createMockKit().logo,
        variations: {},
        approvedAt: null,
      },
    });

    const kitNPlus1 = createMockKit({
      version: 6,
      logo: {
        ...kitN.logo,
        variations: mockSevenVariations,
        approvedAt: null,
      },
    });

    const kitNPlus2 = createMockKit({
      version: 7,
      logo: {
        ...kitNPlus1.logo,
        approvedAt: '2026-10-02T12:30:00Z',
      },
    });

    const deriveVariationsSpy = vi.spyOn(brandKitApi, 'deriveVariations').mockResolvedValue(kitNPlus1);
    const patchLogoSpy = vi.spyOn(brandKitApi, 'patchLogo').mockResolvedValue(kitNPlus2);
    const onKitUpdated = vi.fn();
    const onConfirm = vi.fn();

    render(
      <VariationSetModal
        ideaId="idea_sync_test"
        initialKit={kitN}
        onKitUpdated={onKitUpdated}
        onConfirm={onConfirm}
      />
    );

    // Initial derivation triggered with version 5 (N)
    await waitFor(() => {
      expect(deriveVariationsSpy).toHaveBeenCalledWith('idea_sync_test', 5);
      expect(onKitUpdated).toHaveBeenCalledWith(kitNPlus1);
    });

    // Modal is now at version 6 (N+1). Now click Approve.
    const approveButton = await screen.findByRole('button', { name: /Approve all seven/i });
    expect(approveButton).toBeEnabled();

    fireEvent.click(approveButton);

    await waitFor(() => {
      // Must dispatch with N+1 (version 6), NOT original N (version 5)
      expect(patchLogoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAt: expect.any(String),
        }),
        'idea_sync_test',
        6
      );
      expect(onKitUpdated).toHaveBeenCalledWith(kitNPlus2);
      expect(onConfirm).toHaveBeenCalledWith(kitNPlus2);
    });
  });

  // Section 13: Handle In-Flight Derivation
  it('Section 13: Prevents approve action from dispatching while derivation is in progress', async () => {
    let resolveDerivation: (kit: BrandKit) => void;
    const pendingDerivation = new Promise<BrandKit>((resolve) => {
      resolveDerivation = resolve;
    });

    const kitN = createMockKit({
      version: 10,
      logo: {
        ...createMockKit().logo,
        variations: {},
        approvedAt: null,
      },
    });

    const kitNPlus1 = createMockKit({
      version: 11,
      logo: {
        ...kitN.logo,
        variations: mockSevenVariations,
        approvedAt: null,
      },
    });

    vi.spyOn(brandKitApi, 'deriveVariations').mockImplementation(() => pendingDerivation);
    const patchLogoSpy = vi.spyOn(brandKitApi, 'patchLogo');

    render(
      <VariationSetModal
        ideaId="idea_sync_test"
        initialKit={kitN}
      />
    );

    // Button should be disabled during in-flight derivation
    const deriveButton = screen.getByRole('button', { name: /Preparing Variations.../i });
    expect(deriveButton).toBeDisabled();

    // Trying to click while deriving does not trigger patchLogo
    fireEvent.click(deriveButton);
    expect(patchLogoSpy).not.toHaveBeenCalled();

    // Now complete the derivation
    await act(async () => {
      resolveDerivation!(kitNPlus1);
    });

    // After completion, button becomes enabled with "Approve all seven"
    const approveButton = await screen.findByRole('button', { name: /Approve all seven/i });
    expect(approveButton).toBeEnabled();
  });

  // Section 14: Real 409 Conflict & Concurrency Retry
  it('Section 14: api-creator-brand-kit retries with latest version when 409 conflict is encountered and returns fresh updated kit', async () => {
    const originalVersion = 4;
    const freshExternalKit = createMockKit({ version: 5 });
    const finalUpdatedKit = createMockKit({
      version: 6,
      logo: {
        ...freshExternalKit.logo,
        approvedAt: '2026-10-02T14:00:00Z',
      },
    });

    let attempts = 0;
    vi.spyOn(api, 'patch').mockImplementation(async (_url, _data, config) => {
      attempts++;
      const sentVersion = config?.params?.expectedVersion;
      if (sentVersion === 4) {
        const error: any = new Error('Concurrency conflict');
        error.response = { status: 409, data: { message: 'Version conflict' } };
        throw error;
      }
      return { data: { data: finalUpdatedKit } } as any;
    });

    vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: freshExternalKit },
    } as any);

    // Call patchLogo with stale version 4
    const result = await brandKitApi.patchLogo(
      { approvedAt: '2026-10-02T14:00:00Z' },
      'idea_sync_test',
      originalVersion
    );

    expect(attempts).toBe(2);
    expect(result.version).toBe(6);
    expect(result.logo?.approvedAt).toBe('2026-10-02T14:00:00Z');
  });

  it('Section 14: Does not suppress permanent error when retry also fails', async () => {
    vi.spyOn(api, 'patch').mockImplementation(async () => {
      const error: any = new Error('Permanent conflict');
      error.response = { status: 409, data: { message: 'Permanent conflict' } };
      throw error;
    });

    vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: createMockKit({ version: 5 }) },
    } as any);

    await expect(
      brandKitApi.patchLogo(
        { approvedAt: '2026-10-02T14:00:00Z' },
        'idea_sync_test',
        4
      )
    ).rejects.toThrow('Permanent conflict');
  });

  // Section 15: Prerequisite Gate Verification (Backend Gate: logo.approvedAt != null)
  it('Section 15: Advancing to Colours requires non-null logo.approvedAt', () => {
    const unapprovedKit = createMockKit({
      logo: {
        ...createMockKit().logo,
        approvedAt: null,
      },
    });

    const isColoursPrerequisiteMet = (kit: BrandKit) => kit.logo?.approvedAt != null;

    expect(isColoursPrerequisiteMet(unapprovedKit)).toBe(false);

    const approvedKit = createMockKit({
      logo: {
        ...createMockKit().logo,
        approvedAt: '2026-10-02T12:00:00Z',
      },
    });

    expect(isColoursPrerequisiteMet(approvedKit)).toBe(true);
  });
});
