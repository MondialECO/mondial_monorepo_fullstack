import api from "@/lib/axios";
import { BrandKit } from "@/types/creator/brand-kit";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  traceId?: string;
}

export const brandKitApi = {
  /**
   * Fetch complete BrandKit record for the active or queried idea.
   */
  async getBrandKit(ideaId?: string): Promise<BrandKit> {
    const res = await api.get<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit",
      {
        params: ideaId ? { ideaId } : {},
      }
    );
    return res.data.data!;
  },

  /**
   * Reset all section regenerate counters across the kit to 0 upon entering studio.
   */
  async openStudio(ideaId?: string): Promise<BrandKit> {
    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/open-studio",
      null,
      {
        params: ideaId ? { ideaId } : {},
      }
    );
    return res.data.data!;
  },

  /**
   * Generate 6 logo concepts across 6 mark families.
   */
  async generateLogoConcepts(
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/logo/generate-concepts",
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Regenerate a single logo concept by key.
   */
  async regenerateSingleLogoConcept(
    conceptKey: string,
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      `/creator/journey/phase2/brand-kit/logo/regenerate-concept/${encodeURIComponent(
        conceptKey
      )}`,
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Partially update Logo section (e.g. set selectedConceptKey).
   */
  async patchLogo(
    payload: {
      selectedConceptKey?: string;
      logoType?: string;
      approvedAt?: string | null;
      refinementSettings?: {
        symbolSize?: string | null;
        spacing?: string | null;
        arrangement?: string | null;
      };
      variations?: Record<string, any>;
    },
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.patch<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/logo",
      payload,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Partially update Strategy section and optionally set ConfirmedAt.
   */
  async patchStrategy(
    payload: {
      businessName?: string;
      nameDisplayForm?: string;
      concept?: string;
      targetAudience?: string;
      industry?: string;
      positioning?: string;
      personalityTraits?: string[];
      avoidList?: string[];
      tonePosition?: string;
      firstAppearance?: string;
      symbolFeeling?: string | null;
      confirmedAt?: string | null;
    },
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.patch<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/strategy",
      payload,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Derive 7 canonical variations from approved concept.
   */
  async deriveVariations(
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/logo/derive-variations",
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Generate 4 visual direction candidates (costs 7 credits).
   */
  async generateDirections(
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/direction/generate",
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Partially update Direction section (e.g. select candidate, tune adjustment settings, confirm selection).
   */
  async patchDirection(
    payload: {
      selectedDirectionKey?: string;
      selectedAt?: string | null;
      candidates?: any[];
      adjustmentSettings?: {
        paletteVariant?: string;
        contrastPosition?: string;
        typeWeight?: string;
      };
    },
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.patch<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/direction",
      payload,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Generate initial 5-role colour system (free, deterministic derivation from mark & direction).
   */
  async generateColors(
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/colors/generate",
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Regenerate entire 5-role colour system (model call, costs credits, 3-cap, respects isLocked).
   */
  async regenerateColors(
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/colors/regenerate",
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Partially update Colors section (per-role hex edits, lock toggles, or confirmation).
   */
  async patchColors(
    payload: {
      roles?: Array<{
        roleName: string;
        hex?: string;
        rgb?: string;
        usageNote?: string;
        contrastRatio?: number | null;
        contrastVerdict?: string | null;
        isLocked?: boolean;
        provenance?: string;
      }>;
      confirmedAt?: string | null;
    },
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.patch<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/colors",
      payload,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Generate initial 4-role typography system (free, deterministic derivation from logo & visual direction).
   */
  async generateTypography(
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/typography/generate",
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Regenerate typography pairing for Heading, Body, Button (model call, costs credits, 3-cap, Logo type permanently locked).
   */
  async regenerateTypography(
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/typography/regenerate",
      null,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Partially update Typography section (per-role weight/size/line-height tuning, or confirmation).
   */
  async patchTypography(
    payload: {
      roles?: Array<{
        roleName: string;
        family?: string;
        weight?: string;
        size?: string;
        lineHeight?: string;
        specimenText?: string;
        isLocked?: boolean;
        provenance?: string;
      }>;
      families?: {
        displayFamily?: {
          name: string;
          license: string;
          availableWeights: string[];
          webWeightKb: number;
        };
        textFamily?: {
          name: string;
          license: string;
          availableWeights: string[];
          webWeightKb: number;
        };
      };
      confirmedAt?: string | null;
    },
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.patch<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/typography",
      payload,
      { params }
    );
    return res.data.data!;
  },

  /**
   * Advance step and update kit Status to complete when advancing past step 6.
   */
  async advanceStep(
    targetStep: number,
    ideaId?: string,
    expectedVersion?: number
  ): Promise<BrandKit> {
    const params: Record<string, string | number> = {};
    if (ideaId) params.ideaId = ideaId;
    if (expectedVersion !== undefined) params.expectedVersion = expectedVersion;

    const res = await api.post<ApiResponse<BrandKit>>(
      "/creator/journey/phase2/brand-kit/advance",
      { targetStep },
      { params }
    );
    return res.data.data!;
  },
};

export const apiCreatorBrandKit = brandKitApi;




