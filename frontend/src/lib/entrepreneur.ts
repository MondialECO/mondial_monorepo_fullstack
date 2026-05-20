import {
  PhaseNumber,
  StepNumber,
  PhaseStatus,
  EntrepreneurProgress,
  PhaseConfig,
} from '@/types/entrepreneur';

const PHASE_CONFIG: Record<PhaseNumber, PhaseConfig> = {
  1: {
    phase: 1,
    title: 'Identity & Onboarding',
    description: 'KYC verified, Tier 2 access',
    trustScore: 44,
    hasSteps: false,
  },
  2: {
    phase: 2,
    title: 'Company Verification',
    description: 'Verified Company badge',
    trustScore: 18,
    hasSteps: true,
    stepCount: 4,
  },
  3: {
    phase: 3,
    title: 'Financial Valuation & KPI',
    description: 'Valuation €3.78M, KPI baseline',
    trustScore: 22,
    hasSteps: true,
    stepCount: 4,
  },
  4: {
    phase: 4,
    title: 'Equity Structure & Ownership',
    description: 'Cap table, ESOP, Dilution sim',
    trustScore: 12,
    hasSteps: false,
  },
  5: {
    phase: 5,
    title: 'Needs & Funding Analysis',
    description: 'Funding ask €450K live',
    trustScore: 8,
    hasSteps: false,
  },
  6: {
    phase: 6,
    title: 'Data Room',
    description: 'Secure document vault',
    trustScore: 3,
    hasSteps: false,
  },
  7: {
    phase: 7,
    title: 'AI Expert Review',
    description: 'Investor-Ready Badge',
    trustScore: 5,
    hasSteps: false,
  },
  8: {
    phase: 8,
    title: 'Investor Matching',
    description: 'AI matches, handshakes',
    trustScore: 5,
    hasSteps: false,
  },
  9: {
    phase: 9,
    title: 'Deal Execution',
    description: 'Term sheets, round close',
    trustScore: 0, // Finalize
    hasSteps: false,
  },
};

export function getPhaseConfig(phase: PhaseNumber): PhaseConfig {
  return PHASE_CONFIG[phase];
}

export function getPhaseStatus(
  phase: PhaseNumber,
  completedPhases: Set<PhaseNumber>,
  currentPhase: PhaseNumber
): PhaseStatus {
  if (completedPhases.has(phase)) return 'completed';
  if (phase === currentPhase) return 'active';
  return 'locked';
}

export function isStepComplete(
  phase: PhaseNumber,
  step: StepNumber,
  completedSteps: Set<string>
): boolean {
  return completedSteps.has(`${phase}-${step}`);
}

export function getAllCompletedSteps(
  phase: PhaseNumber,
  completedSteps: Set<string>
): number {
  const config = getPhaseConfig(phase);
  if (!config.hasSteps) return 0;

  let count = 0;
  for (let i = 1; i <= (config.stepCount || 4); i++) {
    if (completedSteps.has(`${phase}-${i}`)) count++;
  }
  return count;
}

export function getPhaseProgress(
  phase: PhaseNumber,
  completedSteps: Set<string>
): number {
  const config = getPhaseConfig(phase);
  if (!config.hasSteps || !config.stepCount) return 0;

  const completed = getAllCompletedSteps(phase, completedSteps);
  return Math.round((completed / config.stepCount) * 100);
}

export function calculateTotalTrustScore(
  completedPhases: Set<PhaseNumber>
): number {
  let total = 0;
  for (const phase of completedPhases) {
    total += getPhaseConfig(phase as PhaseNumber).trustScore;
  }
  return total;
}

export function canMoveToNextStep(
  phase: PhaseNumber,
  step: StepNumber,
  completedSteps: Set<string>
): boolean {
  // Block only when `step` is already past the last step. Allowing
  // `step === stepCount` is required so completing the LAST step in a phase
  // can advance the user into the next phase (handled in moveToNextStep).
  const config = getPhaseConfig(phase);
  if (config.hasSteps && step > (config.stepCount || 4)) {
    return false;
  }

  // Can move to next step if previous step is completed
  if (step === 1) return true;
  return isStepComplete(phase, (step - 1) as StepNumber, completedSteps);
}

export function getNextPhase(currentPhase: PhaseNumber): PhaseNumber | null {
  if (currentPhase >= 9) return null;
  return (currentPhase + 1) as PhaseNumber;
}

export function getProgressStorageKey(): string {
  return 'entrepreneur-progress';
}

export function serializeProgress(progress: EntrepreneurProgress): string {
  return JSON.stringify({
    ...progress,
    completedPhases: Array.from(progress.completedPhases),
    completedSteps: Array.from(progress.completedSteps),
    lastUpdated: Date.now(),
  });
}

export function deserializeProgress(data: string): EntrepreneurProgress {
  const parsed = JSON.parse(data);

  // Validate and sanitize deserialized data
  if (typeof parsed.currentPhase !== 'number' || parsed.currentPhase < 1 || parsed.currentPhase > 9) {
    throw new Error('Invalid currentPhase');
  }
  if (typeof parsed.currentStep !== 'number' || parsed.currentStep < 1 || parsed.currentStep > 4) {
    throw new Error('Invalid currentStep');
  }
  if (!Array.isArray(parsed.completedPhases) || !parsed.completedPhases.every((p: unknown) => typeof p === 'number')) {
    throw new Error('Invalid completedPhases');
  }
  if (!Array.isArray(parsed.completedSteps) || !parsed.completedSteps.every((s: unknown) => typeof s === 'string')) {
    throw new Error('Invalid completedSteps');
  }

  // Validate phase/step sequence
  const completedPhases = new Set<PhaseNumber>(parsed.completedPhases);
  const completedSteps = new Set<string>(parsed.completedSteps);

  // Can't have future phases completed
  for (const phase of completedPhases) {
    if (phase >= parsed.currentPhase) {
      throw new Error('Invalid phase sequence: completed phase >= current phase');
    }
  }

  return {
    currentPhase: parsed.currentPhase as PhaseNumber,
    currentStep: parsed.currentStep as StepNumber,
    completedPhases,
    completedSteps,
    phaseData: parsed.phaseData || {},
    trustScore: typeof parsed.trustScore === 'number' ? Math.max(0, parsed.trustScore) : 0,
    lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now(),
  };
}

export const INITIAL_PROGRESS: EntrepreneurProgress = {
  currentPhase: 2,
  currentStep: 1,
  completedPhases: new Set([1]),
  completedSteps: new Set(['1', '2-1', '2-2']),
  phaseData: {},
  trustScore: 44, // Phase 1 completed
  lastUpdated: 0, // Set at runtime, not during module init
};
