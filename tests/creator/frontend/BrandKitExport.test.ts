import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportBrandKitZip } from '@/lib/brand-kit-export';
import type { BrandKit } from '@/types/creator/brand-kit';
import JSZip from 'jszip';

// Mock document.createElement('a') and URL methods for blob download
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
      } as any;
    }
    return document.createElement(tagName);
  });
  vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
  vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
});

describe('exportBrandKitZip', () => {
  const sampleSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';

  const sampleBrandKitWithVariations: BrandKit = {
    ideaId: 'idea_apex',
    userId: 'user_1',
    status: 'complete',
    currentStep: 6,
    version: 2,
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
    strategy: {
      businessName: 'Apex Logistics',
      nameDisplayForm: 'Apex Logistics',
      industry: { value: 'Supply Chain', provenance: 'stated' },
      positioning: { value: 'High-speed freight', provenance: 'stated' },
      tonePosition: 'Precision & Speed',
    },
    colors: {
      roles: [
        { roleName: 'Primary', hex: '#0052FF', rgb: '0, 82, 255', contrastVerdict: 'AAA', usageNote: 'Primary brand color', isLocked: false, provenance: 'generated' },
        { roleName: 'Secondary', hex: '#1E293B', rgb: '30, 41, 59', contrastVerdict: 'AAA', usageNote: 'Secondary tone', isLocked: false, provenance: 'generated' },
        { roleName: 'Accent', hex: '#10B981', rgb: '16, 185, 129', contrastVerdict: 'AA', usageNote: 'Accent highlight', isLocked: false, provenance: 'generated' },
        { roleName: 'Background', hex: '#FFFFFF', rgb: '255, 255, 255', contrastVerdict: 'Ground', usageNote: 'Canvas background', isLocked: false, provenance: 'generated' },
        { roleName: 'Text', hex: '#0F172A', rgb: '15, 23, 42', contrastVerdict: 'AAA', usageNote: 'Primary text', isLocked: false, provenance: 'generated' },
      ],
      regenerateCount: 0,
    },
    typography: {
      families: {
        displayFamily: { name: 'Syne', license: 'OFL', availableWeights: ['700'], webWeightKb: 40 },
        textFamily: { name: 'DM Sans', license: 'OFL', availableWeights: ['400', '500'], webWeightKb: 45 },
      },
      roles: [
        { roleName: 'Display / H1', family: 'Syne', weight: '700', size: '36px', lineHeight: '44px', specimenText: 'Aa', isLocked: false, provenance: 'generated' },
      ],
      regenerateCount: 0,
    },
    logo: {
      selectedConceptKey: 'concept-1',
      variations: {
        horizontal: { svgUri: '/brand-assets/logos/apex-horizontal.svg', usageNote: 'Horizontal lockup' },
        stacked: { svgUri: '/brand-assets/logos/apex-stacked.svg', usageNote: 'Stacked lockup' },
        icon_only: { svgUri: '/brand-assets/logos/apex-icon.svg', usageNote: 'Icon only' },
        black: { svgUri: '/brand-assets/logos/apex-black.svg', usageNote: 'Single color black' },
        white: { svgUri: '/brand-assets/logos/apex-white.svg', usageNote: 'Single color white' },
        transparent: { svgUri: '/brand-assets/logos/apex-trans.svg', usageNote: 'Transparent background' },
      },
    },
  };

  it('resolves asset URLs canonically and downloads ZIP with SVG logos and tokens', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      // Must use canonical resolver: relative paths prefixed with API origin
      expect(String(url)).toMatch(/^http:\/\/localhost:5093\/brand-assets\/logos\//);
      return {
        ok: true,
        status: 200,
        text: async () => sampleSvg,
      } as Response;
    });

    await exportBrandKitZip(sampleBrandKitWithVariations);

    expect(fetchSpy).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('falls back to approved concept when variations have not been derived yet', async () => {
    const kitWithOnlyConcept: BrandKit = {
      ideaId: 'concept_idea',
      userId: 'user_1',
      status: 'draft',
      currentStep: 1,
      version: 1,
      createdAt: '2026-09-15T00:00:00Z',
      updatedAt: '2026-09-15T00:00:00Z',
      strategy: { businessName: 'ConceptOnly' },
      logo: {
        selectedConceptKey: 'concept-alpha',
        concepts: [
          {
            key: 'concept-alpha',
            descriptorLine: 'Geometric Mark',
            markAssetUri: '/brand-assets/logos/concept-mark.svg',
            lockupAssetUri: '/brand-assets/logos/concept-lockup.svg',
            regenerateCount: 0,
          },
        ],
        variations: {},
      },
    };

    const requestedUrls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      requestedUrls.push(String(url));
      return {
        ok: true,
        status: 200,
        text: async () => sampleSvg,
      } as Response;
    });

    await exportBrandKitZip(kitWithOnlyConcept);

    // Verified that concept lockup & mark assets are fetched as fallback
    expect(requestedUrls.some((u) => u.includes('concept-lockup.svg'))).toBe(true);
    expect(requestedUrls.some((u) => u.includes('concept-mark.svg'))).toBe(true);
    expect(mockClick).toHaveBeenCalled();
  });

  it('fails loudly with an explicit error when any logo fetch fails (404 / network)', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('apex-black')) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        text: async () => sampleSvg,
      } as Response;
    });

    await expect(exportBrandKitZip(sampleBrandKitWithVariations)).rejects.toThrow(
      /Failed to export brand kit: could not retrieve logo assets for black \(HTTP 404 Not Found\)/
    );

    // Download must not trigger on failure
    expect(mockClick).not.toHaveBeenCalled();
  });
});
