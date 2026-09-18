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
    version: 2,
    strategy: {
      businessName: 'Apex Logistics',
      nameDisplayForm: 'Apex Logistics',
      industry: { value: 'Supply Chain' },
      positioning: { value: 'High-speed freight' },
      tonePosition: 'Precision & Speed',
    },
    colors: {
      selectedPaletteKey: 'p1',
      roles: [
        { roleName: 'Primary', hex: '#0052FF', rgb: '0, 82, 255', contrastVerdict: 'AAA' },
        { roleName: 'Secondary', hex: '#1E293B', rgb: '30, 41, 59', contrastVerdict: 'AAA' },
        { roleName: 'Accent', hex: '#10B981', rgb: '16, 185, 129', contrastVerdict: 'AA' },
        { roleName: 'Background', hex: '#FFFFFF', rgb: '255, 255, 255', contrastVerdict: 'Ground' },
        { roleName: 'Text', hex: '#0F172A', rgb: '15, 23, 42', contrastVerdict: 'AAA' },
      ],
    },
    typography: {
      families: {
        displayFamily: { name: 'Syne', role: 'Display' },
        textFamily: { name: 'DM Sans', role: 'Text' },
      },
      roles: [
        { roleName: 'Display / H1', family: 'Syne', weight: '700', size: '36px', lineHeight: '44px' },
      ],
    },
    logo: {
      selectedConceptKey: 'concept-1',
      variations: {
        horizontal: { svgUri: '/brand-assets/logos/apex-horizontal.svg', aspectRatio: '4:1' },
        stacked: { svgUri: '/brand-assets/logos/apex-stacked.svg', aspectRatio: '1:1' },
        icon_only: { svgUri: '/brand-assets/logos/apex-icon.svg', aspectRatio: '1:1' },
        black: { svgUri: '/brand-assets/logos/apex-black.svg', aspectRatio: '3:1' },
        white: { svgUri: '/brand-assets/logos/apex-white.svg', aspectRatio: '3:1' },
        transparent: { svgUri: '/brand-assets/logos/apex-trans.svg', aspectRatio: '3:1' },
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
      version: 1,
      strategy: { businessName: 'ConceptOnly' },
      logo: {
        selectedConceptKey: 'concept-alpha',
        concepts: [
          {
            key: 'concept-alpha',
            descriptorLine: 'Geometric Mark',
            markAssetUri: '/brand-assets/logos/concept-mark.svg',
            lockupAssetUri: '/brand-assets/logos/concept-lockup.svg',
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
