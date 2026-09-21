import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillsPlanView } from '@/components/creator/phase4/SkillsPlanView';
import type {
  SkillsPlan,
  CapabilityResolution,
  FounderProfileSummaryDto,
} from '@/types/creator/skills';

const mockProfileSummary: FounderProfileSummaryDto = {
  headline: 'Experienced Product Strategist',
  weeklyAvailability: '15-25 hours/week',
  learningPreference: 'Self-Guided & Hands-On',
  delegationPreference: 'Selective',
  topSkills: ['Product Strategy', 'UX Design'],
  yearsOfExperienceTotal: 8,
  isProfileComplete: true,
};

const mockResolutions: CapabilityResolution[] = [
  {
    key: 'resolve.team.software-dev',
    needKey: 'need.software-dev',
    capability: 'Software Development',
    needCategory: 'Team',
    priority: 'Critical',
    timing: 'Now',
    blocking: true,
    relatedRoadmapTaskKeys: ['task.backend'],
    resolutionMode: 'DELEGATE',
    confidence: 'HIGH',
    reasonCode: 'LOW_AVAILABLE_TIME',
    why: 'Your current weekly availability is insufficient to learn this complex capability before upcoming milestones.',
    isMandatoryVerification: false,
    founderEdited: false,
    source: ['Roadmap:task.backend'],
    sourceReference: [],
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
    delegationRequirement: {
      roleTitle: 'Software Engineer',
      suggestedResourceType: 'Specialist Freelancer',
      estimatedBudgetTier: 'Medium',
      timing: 'Immediate',
      urgency: 'Critical',
      delegationScope: 'Build backend API',
      expectedOutcome: 'Robust RESTful API with automated tests',
    },
  },
  {
    key: 'resolve.marketing.seo',
    needKey: 'need.seo',
    capability: 'SEO & Inbound Content',
    needCategory: 'Marketing',
    priority: 'Medium',
    timing: 'Next 30 Days',
    blocking: false,
    relatedRoadmapTaskKeys: [],
    resolutionMode: 'LEARN',
    confidence: 'HIGH',
    reasonCode: 'FEASIBLE_LEARNING_PATH',
    why: 'Developing practical operational knowledge in this area directly strengthens your founder autonomy.',
    isMandatoryVerification: false,
    founderEdited: false,
    source: ['GrowthStrategy'],
    sourceReference: [],
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
    learningAction: {
      topic: 'SEO & Inbound Content',
      objective: 'Acquire practical working knowledge in technical SEO and content mapping',
      currentLevel: 'Beginner',
      targetLevel: 'Comfortable',
      estimatedHours: 8,
      recommendedFormat: 'SelfGuided',
      timing: 'Next 30 Days',
      suggestedTopics: ['Keyword Research & Target Search Intent', 'On-Page SEO & Metadata Optimization'],
      priority: 'Medium',
      feasibility: 'Feasible',
    },
  },
  {
    key: 'resolve.legal.escrow',
    needKey: 'legal.statutory-capital',
    capability: 'Share Capital Escrow Deposit',
    needCategory: 'Legal & Administration',
    priority: 'Critical',
    timing: 'Now',
    blocking: true,
    relatedRoadmapTaskKeys: [],
    resolutionMode: 'VERIFY',
    confidence: 'HIGH',
    reasonCode: 'MANDATORY_PROFESSIONAL_VERIFICATION',
    why: 'Mandatory statutory requirement under French commercial code.',
    isMandatoryVerification: true,
    founderEdited: false,
    source: ['Phase3.LegalAssessment'],
    sourceReference: [],
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
    verificationRequirement: {
      verificationType: 'LegalValidation',
      authoritySource: 'French Commercial Registry / Notary',
      requiredEvidence: 'Attestation de dépôt des fonds',
      isMandatory: true,
      optionalLearningSupplement: {
        topic: 'Capital Deposit Basics',
        objective: 'Understand procedural flow for share capital escrow',
        targetLevel: 'Foundational',
        estimatedHours: 2,
        recommendedFormat: 'SelfGuided',
        timing: 'Now',
        suggestedTopics: ['Capital Deposit Basics'],
        priority: 'Low',
        feasibility: 'Feasible',
      },
    },
  },
  {
    key: 'resolve.team.product-strategy',
    needKey: 'need.product-strategy',
    capability: 'Product Strategy',
    needCategory: 'Team',
    priority: 'Medium',
    timing: 'Now',
    blocking: false,
    relatedRoadmapTaskKeys: [],
    resolutionMode: 'COVERED',
    confidence: 'HIGH',
    reasonCode: 'EXISTING_CAPABILITY_SUFFICIENT',
    why: 'Practical capability verified through HumainX profile.',
    isMandatoryVerification: false,
    founderEdited: false,
    source: ['Phase4.3Covered'],
    sourceReference: [],
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
];

const mockPlan: SkillsPlan = {
  version: 1,
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  status: 'Completed',
  founderEdited: false,
  sourceVersions: {
    weeklyAvailability: '15-25 hours/week',
  },
  resolutions: mockResolutions,
  coveredCapabilities: [
    {
      key: 'cov.product-strategy',
      capability: 'Product Strategy',
      category: 'Team',
      evidence: '8 years product management experience',
      source: 'Phase4.3Covered',
      resolvedAt: '2026-09-21T00:00:00Z',
    },
  ],
  founderProfileSummary: mockProfileSummary,
  summary: {
    totalRequirements: 4,
    learnCount: 1,
    delegateCount: 1,
    verifyCount: 1,
    coveredCount: 1,
    needsReviewCount: 0,
    mandatoryVerificationCount: 1,
    totalEstimatedLearningHours: 10,
    immediateActionCount: 2,
  },
};

describe('SkillsPlanView Component', () => {
  it('renders ungenerated state with Build My Skills Plan button when plan is null', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={null}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    expect(screen.getByText(/Ready to Build Your Skills Plan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build My Skills Plan/i })).toBeInTheDocument();
  });

  it('renders gate error banner when gateError is provided', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={null}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        gateError={{
          code: 'NEEDS_REFRESH_REQUIRED',
          message: 'Your Needs Analysis is stale. Please refresh Needs Analysis first.',
        }}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    expect(screen.getByText(/Skills Plan Unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Needs Analysis is stale/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Step 4.3 Needs Analysis/i })).toBeInTheDocument();
  });

  it('renders resolution metrics without percentage completion', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    // Assert counts are rendered
    expect(screen.getAllByText('Learn').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Delegate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Verify').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Covered').length).toBeGreaterThan(0);

    // Verify there is NO percentage sign like "100%" or "50%"
    const percentageRegex = /\b\d+%/;
    expect(screen.queryByText(percentageRegex)).toBeNull();
  });

  it('renders Learn card with objective, target level, and curated topics', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    expect(screen.getByText('SEO & Inbound Content')).toBeInTheDocument();
    expect(screen.getByText('Keyword Research & Target Search Intent')).toBeInTheDocument();
    expect(screen.getByText('On-Page SEO & Metadata Optimization')).toBeInTheDocument();
    expect(screen.getByText(/Target: Comfortable/i)).toBeInTheDocument();
  });

  it('renders Delegate card with suggested partner type and expected outcome', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    expect(screen.getByText('Software Development')).toBeInTheDocument();
    expect(screen.getByText('Specialist Freelancer')).toBeInTheDocument();
    expect(screen.getByText('Robust RESTful API with automated tests')).toBeInTheDocument();
  });

  it('renders Verify card with statutory badge and optional learning supplement', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    expect(screen.getByText('Share Capital Escrow Deposit')).toBeInTheDocument();
    expect(screen.getByText('Statutory Requirement', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/Attestation de dépôt des fonds/i)).toBeInTheDocument();
    expect(screen.getByText(/Optional Supporting Knowledge for Founder/i)).toBeInTheDocument();
  });

  it('filters resolutions when selecting a tab', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    // Switch to Learn tab
    const learnTab = screen.getByRole('button', { name: /Learn 1/i });
    fireEvent.click(learnTab);

    // Should show SEO and NOT Software Development
    expect(screen.getByText('SEO & Inbound Content')).toBeInTheDocument();
    expect(screen.queryByText('Software Development')).toBeNull();
  });

  it('renders staleness warning banner when updateAvailable is true', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={mockPlan}
        updateAvailable={true}
        changedSources={['WeeklyAvailability', 'Roadmap']}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    expect(screen.getByText(/Upstream Context Changed/i)).toBeInTheDocument();
    expect(screen.getByText(/WeeklyAvailability, Roadmap/i)).toBeInTheDocument();
  });

  it('renders Phase 4.5 boundary banner with disabled Explore Support & Funding button', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="Test Project"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
      />
    );

    expect(screen.getByText(/NEXT STEP · PHASE 4.5/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Explore Support & Funding/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('/dashboard/creator/phase-4/support'));
  });
});
