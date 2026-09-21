import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SupportPlanView } from '@/components/creator/phase4/SupportPlanView';
import type {
  SupportPlan,
  SupportMatch,
  MissingEligibilityFact,
  SupportApplicationChecklist,
} from '@/types/creator/support';

const mockMatches: SupportMatch[] = [
  {
    key: 'support.bpifrance.bft',
    opportunityId: 'bft',
    name: 'Bourse French Tech',
    description: 'Subvention jusqu à 30 000 € pour financer les dépenses de démarrage innovant.',
    supportType: 'Grant',
    selectionMode: 'Competitive',
    programmeOwner: 'French Tech / Bpifrance',
    managingAuthority: 'Bpifrance',
    applicationAuthority: 'Plateforme Bpifrance En Ligne',
    catalogueSource: 'BpifranceAdapter',
    sourceAuthority: 'PrimaryOfficial',
    officialReference: 'Bourse French Tech Bpifrance 2026',
    officialUrl: 'https://www.bpifrance.fr/nos-appels-a-projets-concours/bourse-french-tech',
    eligibilityStatus: 'EligibleToApply',
    matchConfidence: 'High',
    whyMatched: [
      'Statut création vérifié.',
      'Projet innovant à forte valeur ajoutée.',
    ],
    conditionsMet: ['Moins de 1 an d existence', 'Projet de création numérique'],
    conditionsMissing: [],
    conditionsFailed: [],
    reasonCodes: ['ELIGIBLE_CONDITIONS_MET'],
    relatedNeedKeys: ['need.dev-team', 'need.equipment'],
    relatedRoadmapTaskKeys: ['task.mvp'],
    estimatedSupportValue: 30000,
    supportValueDescription: 'Subvention jusqu à 30 000 € (70% des dépenses éligibles)',
    supportValueType: 'GrantAmount',
    timing: {
      mustApplyBeforeExpense: true,
      mustApplyBeforeCreation: false,
      mustApplyAfterCreation: false,
      rolling: true,
    },
    applicationReadiness: 'ReadyToApply',
    recommendedNextStep: 'Eligible to Apply: Préparer le dossier de candidature et le prévisionnel.',
    sourceReferences: ['Bpifrance official portal 2026'],
    evaluatedAt: '2026-09-21T00:00:00Z',
    ruleVersion: '1.0',
    founderApplicationState: 'NotStarted',
    founderEdited: false,
    opportunityLastVerifiedAt: '2026-09-21T00:00:00Z',
  },
  {
    key: 'support.urssaf.acre',
    opportunityId: 'acre',
    name: 'Exonération de Cotisations Sociales ACRE',
    description: 'Exonération partielle de cotisations sociales pendant la première année d activité.',
    supportType: 'SocialContributionExemption',
    selectionMode: 'Entitlement',
    programmeOwner: 'URSSAF / État Français',
    managingAuthority: 'URSSAF',
    applicationAuthority: 'Portail URSSAF Déclaration CFE',
    catalogueSource: 'ServicePublicAdapter',
    sourceAuthority: 'PrimaryOfficial',
    officialReference: 'Code de la sécurité sociale art. L131-6-4',
    officialUrl: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F11677',
    eligibilityStatus: 'Eligible',
    matchConfidence: 'High',
    whyMatched: ['Demandeur d emploi créateur d entreprise.'],
    conditionsMet: ['Forme SAS avec statut de dirigeant éligible'],
    conditionsMissing: [],
    conditionsFailed: [],
    reasonCodes: ['ELIGIBLE_CONDITIONS_MET'],
    relatedNeedKeys: ['need.statutory-legal'],
    relatedRoadmapTaskKeys: [],
    estimatedSupportValue: 3500,
    supportValueDescription: 'Exonération de 50% des cotisations sur les 12 premiers mois',
    supportValueType: 'ExemptionPercentage',
    timing: {
      mustApplyBeforeExpense: false,
      mustApplyBeforeCreation: false,
      mustApplyAfterCreation: true,
      rolling: true,
    },
    applicationReadiness: 'ReadyToApply',
    recommendedNextStep: 'Demande à transmettre à l URSSAF dans les 45 jours suivant la création.',
    sourceReferences: ['Service-Public.fr 2026'],
    evaluatedAt: '2026-09-21T00:00:00Z',
    ruleVersion: '1.0',
    founderApplicationState: 'NotStarted',
    founderEdited: false,
    opportunityLastVerifiedAt: '2026-09-21T00:00:00Z',
  },
  {
    key: 'support.bpifrance.pret-honneur',
    opportunityId: 'pret-honneur',
    name: 'Prêt d Honneur Création Initiative / Réseau Entreprendre',
    description: 'Prêt à taux 0 sans caution personnelle pour renforcer les fonds propres.',
    supportType: 'HonorLoan',
    selectionMode: 'CreditAssessment',
    programmeOwner: 'Initiative France / Réseau Entreprendre',
    managingAuthority: 'Comités locaux d agrément',
    applicationAuthority: 'Plateforme Initiative France',
    catalogueSource: 'BpifranceAdapter',
    sourceAuthority: 'PrimaryOfficial',
    officialReference: 'Initiative France Charte d Engagement',
    officialUrl: 'https://www.initiative-france.fr',
    eligibilityStatus: 'EligibleToApply',
    matchConfidence: 'High',
    whyMatched: ['Fonds propres à renforcer avant effet de levier bancaire.'],
    conditionsMet: ['Porteur de projet en création'],
    conditionsMissing: [],
    conditionsFailed: [],
    reasonCodes: ['ELIGIBLE_CONDITIONS_MET'],
    relatedNeedKeys: ['need.working-capital'],
    relatedRoadmapTaskKeys: [],
    estimatedSupportValue: 15000,
    supportValueDescription: 'Prêt à 0% de 5 000 € à 25 000 €',
    supportValueType: 'LoanLimit',
    timing: {
      mustApplyBeforeExpense: false,
      mustApplyBeforeCreation: true,
      mustApplyAfterCreation: false,
      rolling: true,
    },
    applicationReadiness: 'AlmostReady',
    recommendedNextStep: 'Eligible to Apply: Présentation devant le comité d agrément local.',
    sourceReferences: ['Initiative France 2026'],
    evaluatedAt: '2026-09-21T00:00:00Z',
    ruleVersion: '1.0',
    founderApplicationState: 'NotStarted',
    founderEdited: false,
    opportunityLastVerifiedAt: '2026-09-21T00:00:00Z',
  },
];

const mockChecklists: SupportApplicationChecklist[] = [
  {
    opportunityId: 'bft',
    opportunityKey: 'support.bpifrance.bft',
    opportunityName: 'Bourse French Tech',
    items: [
      {
        key: 'doc-business-plan',
        label: 'Business Plan & Synthèse Stratégique',
        required: true,
        status: 'Ready',
        existingArtifactReference: 'Phase 3 Executive Business Plan (Disponible)',
      },
      {
        key: 'doc-forecast',
        label: 'Plan de Trésorerie & Prévisionnel Financier',
        required: true,
        status: 'Ready',
        existingArtifactReference: 'Phase 3 Financial Forecast (Disponible)',
      },
    ],
    readyCount: 2,
    missingCount: 0,
    readinessStatus: 'ReadyToApply',
  },
];

const mockMissingFacts: MissingEligibilityFact[] = [
  {
    key: 'fact.france-travail-registered',
    question: 'Are you currently registered with France Travail as a job seeker?',
    whyNeeded: 'Unlocks ARCE capital disbursement and maintien de l ARE allocations.',
    relatedOpportunityIds: ['arce', 'maintien-are'],
    dataType: 'boolean',
    required: true,
  },
];

const mockPlan: SupportPlan = {
  status: 'Generated',
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  summary: {
    eligibleCount: 3,
    potentialCount: 0,
    needsInfoCount: 1,
    readyToPrepareCount: 2,
    actionCount: 0,
    topMatchCount: 2,
    totalEvaluatedCount: 3,
  },
  matches: mockMatches,
  topMatches: [mockMatches[0], mockMatches[1]],
  missingEligibilityFacts: mockMissingFacts,
  applicationChecklists: mockChecklists,
  sourceVersions: {
    catalogueRuleVersion: '1.0',
  },
  sourceFreshness: {
    lastCheckedAt: '2026-09-21T00:00:00Z',
    isFresh: true,
    unverifiedSources: [],
  },
  founderEdited: false,
  recordedEligibilityFacts: {},
};

describe('SupportPlanView', () => {
  it('renders ungenerated state with Evaluate button', () => {
    const handleGenerate = vi.fn();
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={handleGenerate}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={vi.fn()}
      />
    );

    expect(screen.getByText(/Aids, Grants & Public Support Engine/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Evaluate Support Opportunities/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it('renders gate blocked state when prerequisites fail', () => {
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={null}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        gateError={{
          code: 'SKILLS_PLAN_REFRESH_REQUIRED',
          message: 'Skills & Training Plan must be completed before accessing Support.',
        }}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={vi.fn()}
      />
    );

    expect(screen.getByText(/Support Engine Unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills & Training Plan must be completed/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Step 4.4 Skills & Training/i })).toBeInTheDocument();
  });

  it('renders metrics without fake probabilities or bogus success rates', () => {
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={vi.fn()}
      />
    );

    // Assert counts are rendered
    expect(screen.getByText('Evaluated')).toBeInTheDocument();
    expect(screen.getByText('Eligible / Apply')).toBeInTheDocument();
    expect(screen.getByText('Ready to Apply')).toBeInTheDocument();

    // Verify there are NO fake probability percentages like "87% chance" or "success probability: 60%"
    const probabilityRegex = /\b\d+%\s*(chance|likelihood|probability|succès)/i;
    expect(screen.queryByText(probabilityRegex)).toBeNull();
  });

  it('displays "Eligible to Apply" (not "Eligible for Funding" or "Awarded") for competitive and credit schemes', () => {
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={vi.fn()}
      />
    );

    // Competitive scheme (Bourse French Tech) and Credit scheme (Prêt d'Honneur) must say "Eligible to Apply"
    const eligibleToApplyBadges = screen.getAllByText('Eligible to Apply');
    expect(eligibleToApplyBadges.length).toBeGreaterThanOrEqual(2);

    // Entitlement scheme (ACRE) displays statutory distinction
    expect(screen.getByText('Eligible (Statutory)')).toBeInTheDocument();
  });

  it('distinguishes programme owner from catalogue source in badges', () => {
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={vi.fn()}
      />
    );

    expect(screen.getByText(/French Tech \/ Bpifrance/i)).toBeInTheDocument();
    expect(screen.getAllByText(/via BpifranceAdapter/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/URSSAF \/ État Français/i)).toBeInTheDocument();
    expect(screen.getByText(/via ServicePublicAdapter/i)).toBeInTheDocument();
  });

  it('allows answering missing eligibility facts inline', () => {
    const handleAnswerFact = vi.fn();
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={handleAnswerFact}
      />
    );

    expect(screen.getByText(/Are you currently registered with France Travail/i)).toBeInTheDocument();
    const yesBtn = screen.getByRole('button', { name: /^Yes$/i });
    fireEvent.click(yesBtn);
    expect(handleAnswerFact).toHaveBeenCalledWith('fact.france-travail-registered', 'true');
  });

  it('opens audit details modal with conditions met and MBC artifact reuse', () => {
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={vi.fn()}
      />
    );

    const auditButtons = screen.getAllByRole('button', { name: /Audit Details/i });
    fireEvent.click(auditButtons[0]);

    expect(screen.getByText(/Audit Provenance & Eligibility Trace/i)).toBeInTheDocument();
    expect(screen.getByText(/Conditions Met:/i)).toBeInTheDocument();
    expect(screen.getByText('Moins de 1 an d existence')).toBeInTheDocument();
    expect(screen.getByText(/Reuses: Phase 3 Executive Business Plan/i)).toBeInTheDocument();
  });

  it('renders Phase 4.6 Pricing disabled boundary banner', () => {
    render(
      <SupportPlanView
        ideaId="idea-1"
        projectName="Test Venture"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateState={vi.fn()}
        onAnswerFact={vi.fn()}
      />
    );

    expect(screen.getByText(/PHASE 4.6 READY · NEXT OPERATIONAL MILESTONE/i)).toBeInTheDocument();
    expect(screen.getByText(/Pricing & Revenue Model Engine/i)).toBeInTheDocument();
    const nextLink = screen.getByRole('link', { name: /Build My Pricing Strategy/i });
    expect(nextLink).toHaveAttribute('href', expect.stringContaining('/dashboard/creator/phase-4/pricing'));
  });
});
