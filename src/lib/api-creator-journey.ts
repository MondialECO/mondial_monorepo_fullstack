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

export interface UpdateProjectPayload {
  name?: string;
  tagline?: string;
  concept?: string;
  targetUser?: string;
  problem?: string;
  solution?: string;
  marketGap?: string;
  creatorEdge?: string;
  category?: string;
  sector?: string;
  tags?: string[];
  clarityScore?: number;
}

export const creatorJourneyApi = {
  get: async (): Promise<JourneyResponse> => {
    const res = await api.get('/creator/journey');
    return unwrap<JourneyResponse>(res.data);
  },

  updateProject: async (payload: UpdateProjectPayload): Promise<JourneyResponse> => {
    const res = await api.patch('/creator/journey/project', payload);
    return unwrap<JourneyResponse>(res.data);
  },

  setEntryPath: async (path: 'already_have_idea'): Promise<JourneyResponse> => {
    const res = await api.patch('/creator/journey/phase2/entry-path', { path });
    return unwrap<JourneyResponse>(res.data);
  },

  setCrossroadsPath: async (path: 'sell_license' | 'build'): Promise<JourneyResponse> => {
    const res = await api.patch('/creator/journey/phase5/path', { path });
    return unwrap<JourneyResponse>(res.data);
  },

  appendOutput: async (
    outputKey: JourneyOutputKey,
    phase: number,
    payload: Record<string, unknown>,
    sessionId?: string,
  ): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/output', {
      outputKey,
      phase,
      sessionId: sessionId ?? null,
      payload,
    });
    return unwrap<JourneyResponse>(res.data);
  },

  // ---- Phase 2 ----

  chatMessage: async (message: string): Promise<ChatMessageResult> => {
    const res = await api.post('/creator/journey/phase2/chat-message', { message });
    return unwrap<ChatMessageResult>(res.data);
  },

  finalizeClarifier: async (sessionId: string): Promise<FinalizeClarifierResult> => {
    const res = await api.post('/creator/journey/phase2/finalize-clarifier', { sessionId });
    return unwrap<FinalizeClarifierResult>(res.data);
  },

  // Discovery convergence: seed a completed clarifier session from the confirmed
  // concept (satisfies the Phase 3 prerequisite) and map it onto the project.
  // conceptId is optional — the backend defaults to the persisted SelectedConceptId.
  finalizeDiscovery: async (conceptId?: string): Promise<FinalizeDiscoveryResult> => {
    const res = await api.post('/creator/journey/phase2/finalize-discovery', { conceptId });
    return unwrap<FinalizeDiscoveryResult>(res.data);
  },

  nameSuggestions: async (concept: string): Promise<{ names: string[] }> => {
    const res = await api.post('/creator/journey/phase2/name-suggestions', { concept });
    return unwrap<{ names: string[] }>(res.data);
  },

  uploadLogo: async (file: File | Blob, source: 'ai_logo' | 'm50_designer'): Promise<{ logoAsset: string }> => {
    const form = new FormData();
    form.append('logo', file, file instanceof File ? file.name : 'logo.png');
    form.append('source', source);
    const res = await api.post('/creator/journey/phase2/branding/upload-logo', form);
    return unwrap<{ logoAsset: string }>(res.data);
  },

  m50Designers: async (): Promise<Designer[]> => {
    const res = await api.get('/creator/journey/phase2/m50-designers');
    return unwrap<Designer[]>(res.data);
  },

  bookDesigner: async (spId: string): Promise<{ workroomId: string; conversationId: string }> => {
    const res = await api.post('/creator/journey/phase2/m50-designers/book', { spId });
    return unwrap<{ workroomId: string; conversationId: string }>(res.data);
  },

  uploadAiLogo: async (
    blob: Blob,
    opts: { paletteName?: string; typographyPairing?: string; colorPalette?: string[] },
  ): Promise<{ logoAsset: string }> => {
    const form = new FormData();
    form.append('logo', blob, 'logo.png');
    form.append('source', 'ai_logo');
    if (opts.paletteName) form.append('paletteName', opts.paletteName);
    if (opts.typographyPairing) form.append('typographyPairing', opts.typographyPairing);
    if (opts.colorPalette?.length) form.append('colorPalette', opts.colorPalette.join(','));
    const res = await api.post('/creator/journey/phase2/branding/upload-logo', form);
    return unwrap<{ logoAsset: string }>(res.data);
  },

  skipBranding: async (): Promise<void> => {
    await api.post('/creator/journey/phase2/branding/skip', {});
  },

  // ---- Discovery path working state ----

  saveDiscoveryInputs: async (inputs: { sectors: string[]; observedProblem: string; strengths: string[] }): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/phase2/discovery-inputs', { inputs });
    return unwrap<JourneyResponse>(res.data);
  },

  saveGeneratedConcepts: async (concepts: any[]): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/phase2/generated-concepts', { concepts });
    return unwrap<JourneyResponse>(res.data);
  },

  saveSelectedConceptId: async (conceptId: string): Promise<JourneyResponse> => {
    const res = await api.post('/creator/journey/phase2/selected-concept', { conceptId });
    return unwrap<JourneyResponse>(res.data);
  },

  // ---- Phase 3 (deterministic modules) ----

  generateLegalChecklist: async (): Promise<LegalChecklist> => {
    const res = await api.post('/creator/ai/legal-checklist/generate', {});
    return unwrap<LegalChecklist>(res.data);
  },

  updateLegalItem: async (itemId: string, status: ChecklistStatus): Promise<LegalChecklist> => {
    const res = await api.patch(`/creator/legal-checklist/item/${itemId}`, { status });
    return unwrap<LegalChecklist>(res.data);
  },

  generateFormation: async (): Promise<FormationGenerator> => {
    const res = await api.post('/creator/ai/formation-generator/start', {});
    return unwrap<FormationGenerator>(res.data);
  },

  selectFormationType: async (selectedType: 'SAS' | 'SARL' | 'SAS-U'): Promise<{ formation: FormationGenerator; legalChecklist: LegalChecklist }> => {
    const res = await api.patch('/creator/formation/select-type', { selectedType });
    return unwrap<{ formation: FormationGenerator; legalChecklist: LegalChecklist }>(res.data);
  },

  spMatches: async (specialty: string): Promise<SpMatchDto[]> => {
    const res = await api.get('/creator/sp-matches', { params: { specialty } });
    return unwrap<SpMatchDto[]>(res.data);
  },

  openWorkroom: async (spId: string, context?: string): Promise<{ workroomId: string; conversationId: string }> => {
    const res = await api.post('/creator/workroom/open', { spId, context });
    return unwrap<{ workroomId: string; conversationId: string }>(res.data);
  },

  // Link a Phase-3 AI session (forecast | businessPlan) onto the journey.
  setPhase3Session: async (kind: 'forecast' | 'businessPlan', sessionId: string): Promise<void> => {
    await api.post('/creator/journey/phase3/session', { kind, sessionId });
  },

  completeMasterplan: async (): Promise<{ investorReadinessScore: InvestorReadinessScore }> => {
    const res = await api.patch('/creator/masterplan/complete', {});
    return unwrap<{ investorReadinessScore: InvestorReadinessScore }>(res.data);
  },

  // ---- Phase 4 (deterministic) ----

  pricingInsights: async (): Promise<{ competitors: string[]; sectorAveragePrice: number }> => {
    const res = await api.get('/creator/offer/pricing-insights');
    return unwrap<{ competitors: string[]; sectorAveragePrice: number }>(res.data);
  },

  setPricing: async (pricingModel: string, tiers: PricingTier[]): Promise<{ phase4: unknown; suggestion: string | null }> => {
    const res = await api.post('/creator/offer/pricing', { pricingModel, tiers });
    return unwrap<{ phase4: unknown; suggestion: string | null }>(res.data);
  },

  resourceCalculator: async (teamRequirements: TeamRequirement[], saasStack: SaasItem[]): Promise<ResourceCalculation> => {
    const res = await api.post('/creator/offer/resource-calculator', { teamRequirements, saasStack });
    return unwrap<ResourceCalculation>(res.data);
  },

  gtmSetup: async (payload: { webPresence: WebPresenceItem[]; targetAudiences: string[]; channelMix: ChannelMix[] }): Promise<GtmSetup> => {
    const res = await api.post('/creator/offer/gtm-setup', payload);
    return unwrap<GtmSetup>(res.data);
  },

  completeOffer: async (): Promise<void> => {
    await api.patch('/creator/offer/complete', {});
  },

  // ---- Phase 5 (Crossroads) ----

  ipValuation: async (): Promise<IpValuation> => {
    const res = await api.get('/creator/ip-valuation');
    return unwrap<IpValuation>(res.data);
  },

  publishMarketplace: async (payload: { ndaRequired: boolean; openToPurchase: boolean; openToLicense: boolean; audience: string }): Promise<{ listing: unknown; matchedBuyerIds: string[]; matchingStubbed: boolean }> => {
    const res = await api.post('/creator/marketplace/publish', payload);
    return unwrap<{ listing: unknown; matchedBuyerIds: string[]; matchingStubbed: boolean }>(res.data);
  },

  companyFormation: async (payload: { selectedType: string; ownership: OwnershipEntry[]; formationSpId?: string }): Promise<{ formation: unknown; warnings: string[] }> => {
    const res = await api.post('/creator/company-formation', payload);
    return unwrap<{ formation: unknown; warnings: string[] }>(res.data);
  },

  seedFunding: async (payload: { totalAsk: number; useOfFunds: UseOfFunds[]; investorTypesTargeted: string[] }): Promise<{ seedFunding: unknown; companyId: string | null; matchedInvestorCount: number; investorPoolEmpty: boolean }> => {
    const res = await api.post('/creator/seed-funding', payload);
    return unwrap<{ seedFunding: unknown; companyId: string | null; matchedInvestorCount: number; investorPoolEmpty: boolean }>(res.data);
  },

  // ---- Phase 6 (Matchmaking + Level Up) ----

  getInvestors: async (): Promise<{ featured: SmartMatch | null; qualified: SmartMatch[]; matchingTip: string; isEmpty: boolean }> => {
    const res = await api.get('/creator/investors');
    return unwrap<{ featured: SmartMatch | null; qualified: SmartMatch[]; matchingTip: string; isEmpty: boolean }>(res.data);
  },

  levelUp: async (): Promise<LevelUpResult> => {
    const res = await api.post('/creator/level-up', {});
    return unwrap<LevelUpResult>(res.data);
  },
};

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
}

export interface IpValuation {
  estimatedMin: number;
  estimatedMax: number;
  confidence: 'low' | 'medium' | 'high';
  breakdown: { conceptClarity: number; marketPotential: number; techFeasibility: number; founderCredibility: number; businessPlanQuality: number };
}
export interface OwnershipEntry { holder: string; percent: number; isFounder: boolean; isEsop: boolean; }
export interface UseOfFunds { category: string; percent: number; }

export interface PricingTier { id?: string; name: string; price: number; billingCycle?: string; features: string[]; isHighlighted: boolean; }
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
export interface GtmSetup { webPresence: WebPresenceItem[]; targetAudiences: string[]; channelMix: ChannelMix[]; aiGtmWeeks: GtmWeek[]; }

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

export interface FormationGenerator {
  recommendedType: string;
  youHave: string[];
  youNeed: SkillGap[];
  matchedSpIds: string[];
  selectedType: string | null;
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
  clarityScore: number;
  project: Record<string, unknown>;
}

export interface FinalizeDiscoveryResult {
  clarifierSessionId: string;
  clarityScore: number;
  project: Record<string, unknown>;
}

export default creatorJourneyApi;
