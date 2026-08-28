/**
 * Creator journey client — backend source of truth for Phases 2–6.
 *
 * Replaces the old localStorage-only model. Like api-creator-ai.ts (and per audit
 * R11), this client unwraps the shared `ApiResponse` envelope (`res.data.data`)
 * and PROPAGATES errors — it does NOT swallow failures into empty fallbacks.
 * Callers (the progress hook) decide how to degrade (e.g. fall back to the local
 * cache) and surface errors to the UI.
 */

import api from '@/lib/axios';
import type {
  JourneyResponse,
  JourneyOutputKey,
} from '@/types/creator/journey-api';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  traceId?: string | null;
}

const unwrap = <T>(body: ApiEnvelope<T> | T): T => {
  if (body && typeof body === 'object' && 'data' in (body as ApiEnvelope<T>)) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

// Workspace identity is tab-local. The provider sets it once when an idea is
// opened; it is not recomputed from the mutable global ActiveIdeaId.
let workspaceIdeaId: string | null = null;
const ideaVersions = new Map<string, number>();

export const setCreatorWorkspaceIdea = (ideaId: string | null) => {
  workspaceIdeaId = ideaId;
};

export const getCreatorWorkspaceIdea = () => workspaceIdeaId;

const resolveIdeaId = (ideaId?: string | null): string => {
  const resolved = ideaId ?? workspaceIdeaId;
  if (!resolved) throw new Error('An idea workspace must be selected before saving Creator data.');
  return resolved;
};

const withIdeaRead = (ideaId?: string | null) => ({ params: { ideaId: resolveIdeaId(ideaId) } });

const withIdeaWrite = (ideaId?: string | null) => {
  const resolved = resolveIdeaId(ideaId);
  const expectedVersion = ideaVersions.get(resolved);
  if (!expectedVersion) throw new Error('Idea version is not loaded yet. Refresh and try again.');
  return { params: { ideaId: resolved, expectedVersion } };
};

type IdeaVersionHeaders = Record<string, unknown> & {
  get?: (name: string) => unknown;
};

const readIdeaVersionHeader = (headers?: IdeaVersionHeaders): unknown => {
  const fromGetter = headers?.get?.('x-creator-idea-version');
  if (fromGetter !== undefined) return fromGetter;

  return Object.entries(headers ?? {}).find(
    ([name]) => name.toLowerCase() === 'x-creator-idea-version',
  )?.[1];
};

const rememberIdeaVersion = (response: { headers?: IdeaVersionHeaders }, ideaId?: string | null) => {
  const version = Number(readIdeaVersionHeader(response.headers));
  const resolved = ideaId ?? workspaceIdeaId;
  if (resolved && Number.isSafeInteger(version) && version > 0) ideaVersions.set(resolved, version);
};

export interface UpdateProjectPayload {
  name?: string;
  tagline?: string;
  concept?: string;
  targetUser?: string;
  problem?: string;
  solution?: string;
  marketGap?: string;
  creatorEdge?: string;
  existingAlternatives?: string;
  whyNow?: string;
  riskiestAssumption?: string;
  targetMarket?: string;
  geography?: string;
  category?: string;
  sector?: string;
  tags?: string[];
  clarityScore?: number;
}

export const creatorJourneyApi = {
  get: async (ideaId?: string | null): Promise<JourneyResponse> => {
    const resolved = ideaId ?? workspaceIdeaId;
    const res = await api.get('/creator/journey', resolved ? { params: { ideaId: resolved } } : undefined);
    const data = unwrap<JourneyResponse>(res.data);
    const loadedIdeaId = resolved ?? data.journey.activeIdeaId;
    if (loadedIdeaId && data.journey.ideaVersion > 0) ideaVersions.set(loadedIdeaId, data.journey.ideaVersion);
    return data;
  },

  // Optional ideaId: a debounced write captures its target idea at QUEUE time so a
  // pending patch can never land on a different idea after a switch (backend falls
  // back to the active idea when absent — unchanged for all other callers).
  updateProject: async (payload: UpdateProjectPayload, ideaId?: string): Promise<JourneyResponse> => {
    const res = await api.patch('/creator/journey/project', payload, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<JourneyResponse>(res.data);
  },

  setEntryPath: async (path: 'already_have_idea', ideaId?: string | null): Promise<JourneyResponse> => {
    const res = await api.patch('/creator/journey/phase2/entry-path', { path }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<JourneyResponse>(res.data);
  },

  setCrossroadsPath: async (path: 'sell' | 'build', ideaId?: string | null): Promise<JourneyResponse> => {
    const res = await api.patch('/creator/journey/phase5/path', { path }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<JourneyResponse>(res.data);
  },

  appendOutput: async (
    outputKey: JourneyOutputKey,
    phase: number,
    payload: Record<string, unknown>,
    sessionId?: string,
    ideaId?: string | null,
  ): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/output', {
      outputKey,
      phase,
      sessionId: sessionId ?? null,
      payload,
    }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<JourneyResponse>(res.data);
  },

  // ---- Phase 2 ----

  chatMessage: async (message: string, ideaId?: string | null): Promise<ChatMessageResult> => {
    const res = await api.post('/creator/journey/phase2/chat-message', { message }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<ChatMessageResult>(res.data);
  },

  finalizeClarifier: async (sessionId: string, ideaId?: string | null): Promise<FinalizeClarifierResult> => {
    const res = await api.post('/creator/journey/phase2/finalize-clarifier', { sessionId }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<FinalizeClarifierResult>(res.data);
  },

  // Discovery convergence: seed a completed clarifier session from the confirmed
  // concept (satisfies the Phase 3 prerequisite) and map it onto the project.
  // conceptId is optional — the backend defaults to the persisted SelectedConceptId.
  finalizeDiscovery: async (conceptId?: string, ideaId?: string | null): Promise<FinalizeDiscoveryResult> => {
    const res = await api.post('/creator/journey/phase2/finalize-discovery', { conceptId }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<FinalizeDiscoveryResult>(res.data);
  },

  nameSuggestions: async (concept: string): Promise<{ names: string[] }> => {
    const res = await api.post('/creator/journey/phase2/name-suggestions', { concept });
    return unwrap<{ names: string[] }>(res.data);
  },

  uploadLogo: async (file: File | Blob, source: 'ai_logo' | 'm50_designer', ideaId?: string | null): Promise<{ logoAsset: string }> => {
    const form = new FormData();
    form.append('logo', file, file instanceof File ? file.name : 'logo.png');
    form.append('source', source);
    const res = await api.post('/creator/journey/phase2/branding/upload-logo', form, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ logoAsset: string }>(res.data);
  },

  m50Designers: async (): Promise<Designer[]> => {
    const res = await api.get('/creator/journey/phase2/m50-designers');
    return unwrap<Designer[]>(res.data);
  },

  bookDesigner: async (spId: string, ideaId?: string | null): Promise<{ workroomId: string; conversationId: string }> => {
    const res = await api.post('/creator/journey/phase2/m50-designers/book', { spId }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ workroomId: string; conversationId: string }>(res.data);
  },

  uploadAiLogo: async (
    blob: Blob,
    opts: { paletteName?: string; typographyPairing?: string; colorPalette?: string[] }, ideaId?: string | null,
  ): Promise<{ logoAsset: string }> => {
    const form = new FormData();
    form.append('logo', blob, 'logo.png');
    form.append('source', 'ai_logo');
    if (opts.paletteName) form.append('paletteName', opts.paletteName);
    if (opts.typographyPairing) form.append('typographyPairing', opts.typographyPairing);
    if (opts.colorPalette?.length) form.append('colorPalette', opts.colorPalette.join(','));
    const res = await api.post('/creator/journey/phase2/branding/upload-logo', form, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ logoAsset: string }>(res.data);
  },

  skipBranding: async (ideaId?: string | null): Promise<void> => {
    const res = await api.post('/creator/journey/phase2/branding/skip', {}, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
  },

  // ---- Discovery path working state ----

  // Discovery-flow writes carry the idea captured at INITIATION time (never live
  // state at completion) so an in-flight generation can't write onto a different
  // idea after a switch. Omitted when unknown (zero-idea user) — never an empty id.
  saveDiscoveryInputs: async (inputs: { sectors: string[]; observedProblem: string; strengths: string[] }, ideaId?: string): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/phase2/discovery-inputs', { inputs }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<JourneyResponse>(res.data);
  },

  saveGeneratedConcepts: async (concepts: any[], ideaId?: string): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/phase2/generated-concepts', { concepts }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<JourneyResponse>(res.data);
  },

  saveSelectedConceptId: async (conceptId: string, ideaId?: string): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/phase2/selected-concept', { conceptId }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<JourneyResponse>(res.data);
  },

  // ---- Phase 3 (deterministic modules) ----

  generateLegalChecklist: async (ideaId?: string | null): Promise<LegalChecklist> => {
    const res = await api.post('/creator/ai/legal-checklist/generate', {}, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<LegalChecklist>(res.data);
  },

  updateLegalItem: async (itemId: string, status: ChecklistStatus, ideaId?: string | null): Promise<LegalChecklist> => {
    const res = await api.patch(`/creator/legal-checklist/item/${itemId}`, { status }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<LegalChecklist>(res.data);
  },

  generateFormation: async (ideaId?: string | null): Promise<FormationGenerator> => {
    const res = await api.post('/creator/ai/formation-generator/start', {}, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<FormationGenerator>(res.data);
  },

  selectFormationType: async (selectedType: FormationTypeCode, ideaId?: string | null): Promise<{ formation: FormationGenerator; legalChecklist: LegalChecklist }> => {
    const res = await api.patch('/creator/formation/select-type', { selectedType }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ formation: FormationGenerator; legalChecklist: LegalChecklist }>(res.data);
  },

  // 3.5b: persist self-declared skills (+ optional co-founder draft). Backend derives the
  // SP-backed gaps + matches; returns the updated formation.
  declareFormationSkills: async (youHave: string[], cofounder?: CofounderDraft, ideaId?: string | null): Promise<FormationGenerator> => {
    const res = await api.patch('/creator/formation/skills', { youHave, cofounder: cofounder ?? null }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<FormationGenerator>(res.data);
  },

  spMatches: async (specialty: string, ideaId?: string | null): Promise<SpMatchDto[]> => {
    const res = await api.get('/creator/sp-matches', { params: { ...withIdeaRead(ideaId).params, specialty } });
    return unwrap<SpMatchDto[]>(res.data);
  },

  openWorkroom: async (spId: string, context?: string, ideaId?: string | null): Promise<{ workroomId: string; conversationId: string }> => {
    const res = await api.post('/creator/workroom/open', { spId, context }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ workroomId: string; conversationId: string }>(res.data);
  },

  // Link a Phase-3 AI session (forecast | businessPlan) onto the journey.
  setPhase3Session: async (kind: 'forecast' | 'businessPlan', sessionId: string, ideaId?: string | null): Promise<void> => {
    const res = await api.post('/creator/journey/phase3/session', { kind, sessionId }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
  },

  completeMasterplan: async (ideaId?: string | null): Promise<{ investorReadinessScore: InvestorReadinessScore }> => {
    const res = await api.patch('/creator/masterplan/complete', {}, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ investorReadinessScore: InvestorReadinessScore }>(res.data);
  },

  // ---- Phase 4 (deterministic) ----

  marketBenchmark: async (sector?: string): Promise<MarketBenchmark> => {
    const res = await api.get('/creator/offer/benchmark', {
      params: sector?.trim() ? { sector: sector.trim() } : undefined,
    });
    return unwrap<MarketBenchmark>(res.data);
  },

  pricingInsights: async (ideaId?: string | null): Promise<PricingInsights> => {
    const res = await api.get('/creator/offer/pricing-insights', withIdeaRead(ideaId));
    return unwrap<PricingInsights>(res.data);
  },

  setPricing: async (pricingModel: string, tiers: PricingTier[], ideaId?: string | null): Promise<{ phase4: unknown; forecastPricingOutdated: boolean; forecastArpu?: number | null }> => {
    const res = await api.post('/creator/offer/pricing', { pricingModel, tiers }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ phase4: unknown; forecastPricingOutdated: boolean; forecastArpu?: number | null }>(res.data);
  },

  resourceCalculator: async (teamRequirements: TeamRequirement[], saasStack: SaasItem[], ideaId?: string | null): Promise<ResourceCalculation> => {
    const res = await api.post('/creator/offer/resource-calculator', { teamRequirements, saasStack }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<ResourceCalculation>(res.data);
  },

  gtmSetup: async (payload: { webPresence: WebPresenceItem[]; targetAudiences: string[]; channelMix: ChannelMix[] }, ideaId?: string | null): Promise<GtmSetup> => {
    const res = await api.post('/creator/offer/gtm-setup', payload, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<GtmSetup>(res.data);
  },

  completeOffer: async (ideaId?: string | null): Promise<void> => {
    const res = await api.patch('/creator/offer/complete', {}, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
  },

  // ---- Phase 5 (Crossroads) ----

  ipValuation: async (ideaId?: string | null): Promise<IpValuation> => {
    const res = await api.post('/creator/ip-valuation', {}, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<IpValuation>(res.data);
  },

  creatorReadiness: async (ideaId?: string | null): Promise<CreatorReadiness> => {
    const res = await api.get('/creator/readiness', withIdeaRead(ideaId));
    return unwrap<CreatorReadiness>(res.data);
  },

  publishMarketplace: async (payload: { ndaRequired: boolean; askingPrice?: number; audience: string; dealModes?: string[]; status?: string }, ideaId?: string | null): Promise<{ listing: unknown; matches: string[]; hasMatches: boolean; isEmpty: boolean }> => {
    const res = await api.post('/creator/marketplace/publish', payload, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ listing: unknown; matches: string[]; hasMatches: boolean; isEmpty: boolean }>(res.data);
  },

  setMarketplaceStatus: async (status: 'available' | 'paused', ideaId?: string | null): Promise<{ listing: unknown }> => {
    const res = await api.post('/creator/marketplace/status', { status }, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ listing: unknown }>(res.data);
  },

  getInterests: async (ideaId?: string | null): Promise<ProjectInterest[]> => {
    const res = await api.get('/creator/marketplace/interests', withIdeaRead(ideaId));
    return unwrap<ProjectInterest[]>(res.data);
  },

  acceptInterest: async (interestId: string): Promise<ProjectInterest> => {
    const res = await api.post(`/creator/marketplace/interests/${interestId}/accept`);
    return unwrap<ProjectInterest>(res.data);
  },

  declineInterest: async (interestId: string): Promise<ProjectInterest> => {
    const res = await api.post(`/creator/marketplace/interests/${interestId}/decline`);
    return unwrap<ProjectInterest>(res.data);
  },

  companyFormation: async (payload: { selectedType: string; ownership: OwnershipEntry[]; formationSpId?: string }, ideaId?: string | null): Promise<{ formation: unknown; warnings: string[] }> => {
    const res = await api.post('/creator/company-formation', payload, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ formation: unknown; warnings: string[] }>(res.data);
  },

  seedFunding: async (payload: { totalAsk: number; useOfFunds: UseOfFunds[]; investorTypesTargeted: string[] }, ideaId?: string | null): Promise<{ seedFunding: unknown; companyId: string | null; matchedInvestorCount: number; investorPoolEmpty: boolean }> => {
    const res = await api.post('/creator/seed-funding', payload, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ seedFunding: unknown; companyId: string | null; matchedInvestorCount: number; investorPoolEmpty: boolean }>(res.data);
  },

  // ---- Phase 6 (Matchmaking + Level Up) ----

  getInvestors: async (ideaId?: string | null): Promise<{ featured: SmartMatch | null; qualified: SmartMatch[]; matchingTip: string; isEmpty: boolean }> => {
    const res = await api.get('/creator/investors', withIdeaRead(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<{ featured: SmartMatch | null; qualified: SmartMatch[]; matchingTip: string; isEmpty: boolean }>(res.data);
  },

  // Optional ideaId (step 6ii): Level Up a SPECIFIC idea (my-ideas card, later).
  // Existing callers pass nothing — the backend falls back to the active idea.
  levelUp: async (ideaId?: string): Promise<LevelUpResult> => {
    const res = await api.post('/creator/level-up', {}, withIdeaWrite(ideaId));
    rememberIdeaVersion(res, ideaId);
    return unwrap<LevelUpResult>(res.data);
  },

  // ---- Idea management (step 6ii — unused until the my-ideas UI lands) ----

  /** All the user's ideas, most-recently-active first. Empty array is valid (fresh user). */
  listIdeas: async (): Promise<IdeaCard[]> => {
    const res = await api.get('/creator/ideas');
    return unwrap<{ ideas: IdeaCard[] }>(res.data).ideas ?? [];
  },

  /** Mint a blank idea and make it active. The caller re-hydrates and routes to Phase 2. */
  createIdea: async (): Promise<{ ideaId: string }> => {
    const res = await api.post('/creator/ideas', {});
    return unwrap<{ ideaId: string }>(res.data);
  },

  /** Switch the active idea (owned-check 404 server-side, never a fallback). */
  setActiveIdea: async (ideaId: string): Promise<{ activeIdeaId: string }> => {
    const res = await api.patch('/creator/ideas/active', { ideaId });
    return unwrap<{ activeIdeaId: string }>(res.data);
  },
};

/**
 * COARSE display hint only (artifact presence, not the derived engine status).
 * Never gate logic on it — "Continue" routes into the app, where the authoritative
 * per-idea derivation runs.
 */
export type IdeaPhaseReached = 2 | 3 | 4 | 5 | 6;

/** Lightweight card DTO from GET /creator/ideas. */
export interface IdeaCard {
  ideaId: string;
  name: string;
  concept: string;
  /** Fallback snippet for legacy Path-B ideas whose Concept was never populated. */
  problem: string;
  status: 'active' | 'archived';
  createdAt: string;
  lastActiveAt: string;
  isActive: boolean;
  isLeveledUp: boolean;
  phaseReached: IdeaPhaseReached;
  projectOutcome?: string;
  activeBuyoutDealId?: string | null;
  activePartnershipDealId?: string | null;
  salePrice?: number | null;
  soldAt?: string | null;
  acquiredByUserId?: string | null;
}

export interface SmartMatch {
  candidateId: string;
  // The chat-addressable ApplicationUser behind this investor. Null for demo/admin
  // catalog investors → "Start Conversation" is disabled with a "not reachable" hint.
  linkedUserId: string | null;
  name: string;
  type: string;
  finalScore: number;
  isFeatured: boolean;
  breakdown: { sectorMatch: number; stageMatch: number; geographyMatch: number; ticketMatch: number };
}
export interface LevelUpResult {
  levelUpComplete: boolean;
  entrepreneurProfileId: string;
  redirectTo: string;
  qualificationPath?: string;
  companyId?: string;
  companyName?: string;
  creatorRole?: string;
  creatorEquityPercent?: number | null;
}

export interface IpValuation {
  estimatedMin: number;
  estimatedMax: number;
  confidence: 'low' | 'medium' | 'high';
  method: string;
  disclaimer: string;
  marketOpportunityContext?: number | null;
  breakdown: { conceptClarity: number; marketPotential: number; techFeasibility: number; founderCredibility: number; businessPlanQuality: number };
}
export interface OwnershipEntry { holder: string; percent: number; isFounder: boolean; isEsop: boolean; }
export interface UseOfFunds { category: string; percent: number; }

export interface PricingTier { id?: string; name: string; price: number; billingCycle?: string; features: string[]; isHighlighted: boolean; }
export interface PricingForecastContext {
  sessionId: string;
  arpu: number;
  updatedAt: string;
}
export interface CreatorReadinessRequirement {
  id?: string;
  key: string;
  label: string;
  route: string;
  complete: boolean;
  required: boolean;
  blocking?: boolean;
  status?: string;
  details?: string;
}
export interface CreatorReadiness {
  overallProgress: number;
  levelUpEligible: boolean;
  selectedPath: string;
  qualificationPath?: 'BUILD' | 'CO_FOUNDED' | 'SELL' | string;
  companyName?: string;
  creatorRole?: string;
  creatorEquityPercent?: number | null;
  partnerName?: string;
  companyId?: string;
  dealId?: string;
  outcomeBadge?: string;
  requirements: CreatorReadinessRequirement[];
  missingRequired: string[];
  nextBestAction?: CreatorReadinessRequirement | null;
}
export interface PricingInsights {
  selectedEntryPrice?: number | null;
  forecastContext?: PricingForecastContext | null;
  recommendation?: { suggestedEntryPrice: number; source: 'forecast_assumption'; message: string } | null;
  competitorPricing: { available: false; message: string };
  marketBenchmark: { available: false; message: string };
}
export interface TeamRequirement { role: string; cost: number; durationMonths: number; oneTime: boolean; }
export interface SaasItem { name: string; monthlyCost: number; }
export interface ResourceCalculation {
  totalLaunchBudgetMin: number; totalLaunchBudgetMax: number; monthlyRunningCost: number;
  timeToLaunchWeeksMin: number; timeToLaunchWeeksMax: number;
  budgetBreakdown: { teamPct: number; toolsPct: number; legalPct: number; miscPct: number };
}
export interface WebPresenceItem { id: string; label: string; done: boolean; }
export interface ChannelMix { channel: string; percent: number; }
export interface GtmWeek { week: number; title: string; tasks: string[]; completed: boolean; }
export interface GtmSetup {
  webPresence: WebPresenceItem[];
  targetAudiences: string[];
  channelMix: ChannelMix[];
  benchmarkGtmWeeks: GtmWeek[];
}

export interface MarketBenchmark {
  requestedSector: string;
  resolvedBenchmarkSector: string;
  matchType: 'sector' | 'general';
  displayLabel: string;
  region: string;
  currency: string;
  resourceDefaults: {
    developerCostPerMonth: number;
    developerDurationMonths: number;
    hostingCostPerMonth: number;
    legalCost: number;
    miscPercentage: number;
    launchDurationWeeksMin: number;
    launchDurationWeeksMax: number;
    launchVarianceMinPercentage: number;
    launchVarianceMaxPercentage: number;
  };
  gtmDefaults: {
    channelSplit: ChannelMix[];
    benchmarkGtmWeeks: GtmWeek[];
  };
  source: {
    label: string;
    url?: string | null;
    provenance: string;
  };
  effectiveDate: string;
  version: number;
  lastUpdatedAt: string;
}

export interface InvestorReadinessScore {
  total: number;
  label: string;
  breakdown: {
    conceptClarity: number;
    marketEvidence: number;
    financialModel: number;
    legalReadiness: number;
    teamCredibility: number;
  };
}

export interface ProjectInterest {
  id: string;
  ideaId: string;
  projectName?: string;
  creatorId: string;
  entrepreneurId: string;
  entrepreneurName: string;
  entrepreneurEmail?: string;
  note?: string;
  status: 'pending' | 'accepted' | 'declined';
  dealModes?: string[];
  dealMode?: string;
  conversationId?: string;
  ndaRequired?: boolean;
  ndaSigned?: boolean;
  accessGranted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ChecklistStatus = 'pending' | 'in_progress' | 'done';

export interface LegalChecklistItem {
  id: string;
  label: string;
  category: 'mandatory' | 'optional';
  status: ChecklistStatus;
  badge: 'urgent' | 'fintech' | null;
  showFindSp: boolean;
  spSpecialty: string | null;
  aiGenerable: boolean;
}

export interface LegalChecklist {
  items: LegalChecklistItem[];
  completedCount: number;
  totalCount: number;
}

export interface SkillGap {
  label: string;
  spSpecialty: string;
}

export interface CofounderDraft {
  roleNeeded?: string;
  equityRange?: string;
  locationPreference?: string;
}

export type FormationTypeCode = 'SAS' | 'SARL' | 'SAS-U';

export interface FormationOption {
  code: FormationTypeCode;
  description: string;
  capital: string;
  formationTime: string;
  estimatedCost: string;
}

export interface FormationGenerator {
  recommendedType: FormationTypeCode;
  recommendationReason?: string | null;
  forecastBasis?: {
    forecastSessionId: string;
    monthlyGrowthPct?: number | null;
    tam?: number | null;
    opex?: number | null;
    breakEvenMonth?: number | null;
    currency?: string | null;
    forecastUpdatedAt: string;
  } | null;
  options: FormationOption[];
  youHave: string[];
  youNeed: SkillGap[];
  matchedSpIds: string[];
  selectedType: FormationTypeCode | null;
  skillsDeclared?: boolean;
  cofounderDraft?: CofounderDraft | null;
}

export interface SpMatchDto {
  spId: string;
  name: string;
  title: string;
  tier: number;
  location: string;
}

export interface Designer {
  spId: string;
  name: string;
  title: string;
  tier: number;
  rating: number;
  projectCount: number;
  location: string;
  sectors: string[];
  estimatedPriceRange: string;
  estimatedDays: string;
  isBestMatch: boolean;
}

export interface ChatMessageResult {
  messages: Array<{ id: string; sender: 'ai' | 'user'; text: string; timestamp: string }>;
  questionIndex: number;
  totalQuestions: number;
  summaryReady: boolean;
}

export interface FinalizeClarifierResult {
  aiParseFailed: boolean;
  // True when the AI request itself failed (unreachable / rate-limited / timeout):
  // distinct from aiParseFailed (AI replied but the output couldn't be interpreted).
  aiRequestFailed?: boolean;
  clarityScore: number;
  project: Record<string, unknown>;
}

export interface FinalizeDiscoveryResult {
  clarifierSessionId: string;
  clarityScore: number;
  project: Record<string, unknown>;
}

export default creatorJourneyApi;
