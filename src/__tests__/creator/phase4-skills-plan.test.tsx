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
  weeklyAvailability: '4-8 hours/week',
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
      estimatedBudgetTier: 'Moderate freelance tier',
      timing: 'Immediate',
      urgency: 'Critical',
      delegationScope: 'Build backend API',
      expectedOutcome: 'Robust RESTful API with automated tests',
      targetTiming: 'Before launch (Weeks 3–6)',
      workingLanguage: 'French or English',
      estimatedWeeklyTime: '5–8 hours/week',
      expectedDeliverable: 'Working authenticated core workflow',
    },
  },
  {
    key: 'resolve.marketing.seo',
    needKey: 'need.seo',
    capability: 'Customer outreach & sales',
    needCategory: 'Marketing',
    priority: 'Medium',
    timing: 'Next 30 Days',
    blocking: false,
    relatedRoadmapTaskKeys: [],
    resolutionMode: 'LEARN',
    confidence: 'HIGH',
    reasonCode: 'FEASIBLE_LEARNING_PATH',
    why: 'A focused learning plan can help you prepare and test your first outreach.',
    isMandatoryVerification: false,
    founderEdited: false,
    source: ['GrowthStrategy'],
    sourceReference: [],
    generatedAt: '2026-09-21T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
    learningAction: {
      topic: 'Customer outreach & sales',
      objective: 'Learn how to explain your offer and start useful conversations.',
      currentLevel: 'Beginner',
      targetLevel: 'Comfortable',
      estimatedHours: 8,
      recommendedFormat: 'SelfGuided',
      timing: 'Next 30 Days',
      suggestedTopics: ['Keyword Research & Target Search Intent', 'On-Page SEO & Metadata Optimization'],
      priority: 'Medium',
      feasibility: 'Feasible',
      whatYoullBeAbleToDo: 'Prepare and run a small outreach test.',
      whatYoullCreate: 'A short first message, a follow-up checklist and a simple response log.',
      suggestedEffortText: '1 hour / week for 4 weeks',
    },
  },
  {
    key: 'resolve.legal.escrow',
    needKey: 'legal.statutory-capital',
    capability: 'Check your testing experience',
    needCategory: 'Legal & Administration',
    priority: 'Critical',
    timing: 'Now',
    blocking: true,
    relatedRoadmapTaskKeys: [],
    resolutionMode: 'VERIFY',
    confidence: 'HIGH',
    reasonCode: 'MANDATORY_PROFESSIONAL_VERIFICATION',
    why: 'This work is important for launch, so more information is needed before it can be considered covered.',
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
      whatNeedsChecking: 'Whether you can test the required workflows and identify problems consistently.',
      whatYouCanShare: 'Relevant previous work or a practical example of similar testing.',
      whatIsStillUnclear: 'Your experience with the project’s launch-critical workflows.',
    },
  },
];

const mockPlan: SkillsPlan = {
  version: 1,
  generatedAt: '2026-09-21T00:00:00Z',
  updatedAt: '2026-09-21T00:00:00Z',
  status: 'Completed',
  founderEdited: false,
  sourceVersions: {
    weeklyAvailability: '4-8 hours/week',
  },
  resolutions: mockResolutions,
  coveredCapabilities: [
    {
      key: 'cov.brand-design',
      capability: 'Brand design',
      category: 'Design',
      evidence: '8 years design management experience',
      source: 'Phase4.3Covered',
      currentLevel: 'Advanced',
      resolvedAt: '2026-09-21T00:00:00Z',
    },
    {
      key: 'cov.interviews',
      capability: 'Customer interviews',
      category: 'Research',
      evidence: 'Proven user research background',
      source: 'Phase4.3Covered',
      currentLevel: 'Comfortable',
      resolvedAt: '2026-09-21T00:00:00Z',
    },
  ],
  founderProfileSummary: mockProfileSummary,
  summary: {
    totalRequirements: 5,
    learnCount: 1,
    delegateCount: 1,
    verifyCount: 1,
    coveredCount: 2,
    needsReviewCount: 0,
    mandatoryVerificationCount: 1,
    totalEstimatedLearningHours: 8,
    immediateActionCount: 2,
  },
};

describe('SkillsPlanView Component', () => {
  it('renders ungenerated state with Build My Skills Plan button when plan is null', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={null}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText(/Ready to Build Your Skills Plan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build My Skills Plan/i })).toBeInTheDocument();
  });

  it('renders gate error banner when gateError is provided', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
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
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText(/Skills Plan Unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Needs Analysis is stale/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Step 4.3 Needs Analysis/i })).toBeInTheDocument();
  });

  it('renders Component 2 compact summary header without percentage completion', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk MVP v1"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('5 project skills')).toBeInTheDocument();
    expect(screen.getByText('2 covered')).toBeInTheDocument();
    expect(screen.getByText('3 need attention')).toBeInTheDocument();
    expect(screen.getByText('PROJECT SCOPE')).toBeInTheDocument();
    expect(screen.getByText('REGION')).toBeInTheDocument();

    // Verify there is NO percentage sign like "100%" or "50%"
    const percentageRegex = /\b\d+%/;
    expect(screen.queryByText(percentageRegex)).toBeNull();
  });

  it('renders Component 3 covered skills card with link to update profile', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('You can already handle')).toBeInTheDocument();
    expect(screen.getByText('Brand design')).toBeInTheDocument();
    expect(screen.getByText('Customer interviews')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Update my experience/i })).toBeInTheDocument();
  });

  it('renders Component 4 approach legend cards (Learn, Delegate, Verify)', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Build the skills to do it yourself.')).toBeInTheDocument();
    expect(screen.getByText('Get help from someone with the right skills.')).toBeInTheDocument();
    expect(screen.getByText('Check whether your experience covers this work.')).toBeInTheDocument();
  });

  it('renders Component 5 Delegate card with delegation brief preview', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Software Development' })).toBeInTheDocument();
    expect(screen.getByText('DELEGATION BRIEF PREVIEW')).toBeInTheDocument();
    expect(screen.getByText('Moderate freelance tier')).toBeInTheDocument();
    expect(screen.getByText('Working authenticated core workflow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View brief/i })).toBeInTheDocument();

  });

  it('renders Component 6 Learn card with 4 practical steps and workload impact preview', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Customer outreach & sales')).toBeInTheDocument();
    expect(screen.getByText('Your learning plan')).toBeInTheDocument();
    expect(screen.getByText('4 PRACTICAL LEARNING STEPS')).toBeInTheDocument();
    expect(screen.getByText('Understand the customer problem')).toBeInTheDocument();
    expect(screen.getByText('Write a clear first message')).toBeInTheDocument();
    expect(screen.getByText('WORKLOAD IMPACT PREVIEW')).toBeInTheDocument();
    expect(screen.getByText('0.5h weekly buffer')).toBeInTheDocument();
  });

  it('renders Component 7 Verify card with 3-column verification details', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    expect(screen.getByText('Check your testing experience')).toBeInTheDocument();
    expect(screen.getByText('What needs checking')).toBeInTheDocument();
    expect(screen.getByText('What you can share')).toBeInTheDocument();
    expect(screen.getByText('What is still unclear')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /See what to share/i })).toBeInTheDocument();
  });

  it('renders Component 1 update banner and calls keep current when dismissed', async () => {
    const keepCurrentMock = vi.fn().mockResolvedValue(undefined);
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={true}
        changedSources={['Creator Profile', 'Needs Analysis']}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={keepCurrentMock}
      />
    );

    expect(screen.getByText(/Update available:/i)).toBeInTheDocument();
    const keepBtn = screen.getByRole('button', { name: /Keep my choices/i });
    fireEvent.click(keepBtn);
    expect(keepCurrentMock).toHaveBeenCalledTimes(1);
  });

  it('renders Component 8 quiet journey footer navigation', () => {
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={vi.fn()}
        onKeepCurrent={vi.fn()}
      />
    );

    const backLink = screen.getByRole('link', { name: /Back to Needs & Requirements/i });
    expect(backLink).toHaveAttribute('href', expect.stringContaining('/dashboard/creator/phase-4/needs'));

    const nextLink = screen.getByRole('link', { name: /Continue to Aids & Support/i });
    expect(nextLink).toHaveAttribute('href', expect.stringContaining('/dashboard/creator/phase-4/support'));
  });

  it('toggles mode selector and triggers onUpdateResolution', async () => {
    const updateResolutionMock = vi.fn().mockResolvedValue(undefined);
    render(
      <SkillsPlanView
        ideaId="idea-1"
        projectName="ClairDesk"
        plan={mockPlan}
        updateAvailable={false}
        changedSources={[]}
        profileSummary={mockProfileSummary}
        isLoading={false}
        onGenerate={vi.fn()}
        onRefresh={vi.fn()}
        onUpdateResolution={updateResolutionMock}
        onKeepCurrent={vi.fn()}
      />
    );

    // Click Delegate button on the Customer outreach & sales card (index 1)
    const delegateBtns = screen.getAllByRole('button', { name: /Delegate/i });
    expect(delegateBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(delegateBtns[1]);

    expect(updateResolutionMock).toHaveBeenCalledWith(
      'resolve.marketing.seo',
      expect.objectContaining({
        founderDecision: 'ChooseDelegate',
      })
    );

  });
});
