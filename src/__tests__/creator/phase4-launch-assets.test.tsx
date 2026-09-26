import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LaunchAssetsView } from '@/components/creator/phase4/LaunchAssetsView';
import type { LaunchAssetsPlan } from '@/types/creator/launch-assets';

const mockAssets: LaunchAssetsPlan = {
  assetType: 'ONE-PAGE WEBSITE',
  version: 1,
  status: 'Draft',
  releaseTag: 'v1.0-rc',
  publishedStatus: 'Available to view in MBC. Not published.',
  lastGeneratedAt: '2026-09-26T12:00:00Z',
  activeSectionKey: 'hero',
  brandName: 'ClairDesk',
  conceptBadge: 'PREVIEWING CONCEPT',
  headline: 'A clearer way to manage enquiries and quotations.',
  description:
    'ClairDesk is being built to help independent service businesses keep enquiries, quotations, and follow-ups together.',
  buttonLabel: 'Express interest',
  buttonDestinationType: 'NotSet',
  buttonDestinationValue: '',
  buttonDestinationConfigured: false,
  heroHelpText: 'Help shape the project by sharing how you work today.',
  plannedWorkflowTitle: 'PLANNED WORKFLOW',
  plannedWorkflowSubtitle: 'High-level interface structure',
  workflowSteps: [
    {
      stepNumber: 1,
      title: '1. Enquiry',
      description: 'Capture context, channels, and client requirements in one dedicated intake card.',
      tag: 'Unified intake',
    },
    {
      stepNumber: 2,
      title: '2. Quotation',
      description: 'Draft estimated scopes, convert directly into clear client proposals without duplicate entry.',
      tag: 'Context continuity',
    },
    {
      stepNumber: 3,
      title: '3. Follow-up',
      description: 'Clear reminders and stage updates so no client is left waiting or dropped.',
      tag: 'Next step clarity',
    },
  ],
  problemEyebrow: 'KEEP TRACK OF THE NEXT STEP',
  problemStatement:
    'When enquiries and quotations are spread across different places, it can be harder to see what needs a reply or follow-up.',
  operationalMomentumStatement:
    'ClairDesk focuses squarely on maintaining single-view operational momentum for solo consultants and niche service providers.',
  solutionHeader: 'What’s being planned',
  solutionSubheader: 'Straightforward tools designed strictly around routine project administration.',
  plannedSolutions: [
    {
      title: 'Enquiries together',
      description: 'A clearer place to organise incoming customer requests.',
      icon: 'mail',
    },
    {
      title: 'Quotations in view',
      description: 'A way to keep track of quotations and their next steps.',
      icon: 'file-text',
    },
    {
      title: 'Follow-ups to remember',
      description: 'A way to see which conversations need attention.',
      icon: 'bell',
    },
  ],
  howItWorksHeader: 'A simpler flow for your work',
  howItWorksSubheader: 'This describes the planned workflow.',
  workflowDetails: [
    {
      stepNumber: 1,
      title: 'Organise the enquiry',
      description: 'Collect client briefs, deadlines, and key requirements without sorting through scattered inbox threads.',
    },
    {
      stepNumber: 2,
      title: 'Prepare and track the quotation',
      description: 'Generate clean, professional estimates linked directly to the original client request.',
    },
    {
      stepNumber: 3,
      title: 'Follow up on the next action',
      description: 'Receive clear prompts when responses are due, making timely follow-through second nature.',
    },
  ],
  faqHeader: 'Frequently Asked Questions',
  faqSubheader: 'Honest answers about development status and availability.',
  faqs: [
    {
      question: 'Can I use ClairDesk today?',
      answer: 'The product is currently in preparation.',
    },
    {
      question: 'Who is it being designed for?',
      answer: 'Independent service businesses that manage customer enquiries and quotations.',
    },
    {
      question: 'When will it launch?',
      answer: 'A launch date has not been confirmed.',
    },
  ],
  finalCtaHeader: 'Share how you work today',
  finalCtaSubheader: 'Your experience can help shape what ClairDesk focuses on.',
  footerNotice: 'Project in preparation',
  sections: [
    { key: 'hero', title: 'Hero', statusBadge: 'Included · Required', isIncluded: true, isRequired: true },
    { key: 'problem', title: 'Problem', statusBadge: 'Included', isIncluded: true, isRequired: false },
    { key: 'solution', title: 'Planned solution', statusBadge: 'Included', isIncluded: true, isRequired: false },
    { key: 'how-it-works', title: 'How it works', statusBadge: 'Included', isIncluded: true, isRequired: false },
    { key: 'faq', title: 'FAQ', statusBadge: 'Included', isIncluded: true, isRequired: false },
    { key: 'final-cta', title: 'Final call to action', statusBadge: 'Included', isIncluded: true, isRequired: false },
    { key: 'footer', title: 'Footer', statusBadge: 'Included · Required', isIncluded: true, isRequired: true },
  ],
  pricingExclusion: {
    excluded: true,
    chosenPrice: 15,
    billingPeriod: 'month',
    unit: 'business',
    currency: '€',
    reason: 'Your chosen price is €15 per business / month. Confirm the offer details before adding pricing to the website.',
    actionLabel: 'Review pricing details →',
    actionRoute: '/dashboard/creator/phase-4/pricing',
  },
  proofExclusion: {
    excluded: true,
    proofNeeded: true,
    reason: 'No supporting evidence has been added, so this section is not included.',
    actionLabel: 'Review proof →',
    actionRoute: '/dashboard/creator/phase-3/evidence',
  },
};

describe('LaunchAssetsView (Phase 4.8)', () => {
  const defaultProps = {
    ideaId: 'idea-123',
    projectName: 'ClairDesk',
    assets: mockAssets,
    updateAvailable: false,
    changedSources: [],
    isLoading: false,
    onGenerate: vi.fn(),
    onRefresh: vi.fn(),
    onUpdateAssets: vi.fn(),
    onNewVersion: vi.fn(),
    onSelectVersion: vi.fn(),
    onDownloadSource: vi.fn(),
  };

  it('renders ungenerated empty state when assets is null', () => {
    render(<LaunchAssetsView {...defaultProps} assets={null} />);
    expect(screen.getByText(/Launch Assets · One-Page Launch Website/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Launch Website/i)).toBeInTheDocument();
  });

  it('renders Section 1: Compact Asset Summary Card and handles Use this version', async () => {
    render(<LaunchAssetsView {...defaultProps} />);
    expect(screen.getAllByText('ClairDesk').length).toBeGreaterThan(0);
    expect(screen.getByText('/ ONE-PAGE WEBSITE')).toBeInTheDocument();
    expect(screen.getByText('v1.0-rc')).toBeInTheDocument();
    expect(screen.getByText('Available to view in MBC. Not published.')).toBeInTheDocument();
    expect(screen.getByText('View website')).toBeInTheDocument();
    expect(screen.getByText('Download source')).toBeInTheDocument();
    
    const useVersionBtn = screen.getByText('Use this version');
    expect(useVersionBtn).toBeInTheDocument();
    fireEvent.click(useVersionBtn);
    expect(defaultProps.onSelectVersion).toHaveBeenCalled();
  });

  it('renders Section 2: Source Strip and Attention Notice', () => {
    render(<LaunchAssetsView {...defaultProps} />);
    expect(screen.getByText('BUILT FROM:')).toBeInTheDocument();
    expect(screen.getByText('Your Brand Kit')).toBeInTheDocument();
    expect(screen.getByText('Chosen offer')).toBeInTheDocument();
    expect(screen.getByText('Launch strategy')).toBeInTheDocument();
    expect(screen.getByText(/Add a destination for your main button/i)).toBeInTheDocument();
  });

  it('renders Section 3: Website Preview Controls & Responsive Device Frame', () => {
    render(<LaunchAssetsView {...defaultProps} />);
    expect(screen.getByText('Website preview')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getAllByText('A clearer way to manage enquiries and quotations.').length).toBeGreaterThan(0);
    expect(screen.getByText('Unified intake')).toBeInTheDocument();
    expect(screen.getByText('Context continuity')).toBeInTheDocument();
    expect(screen.getByText('Next step clarity')).toBeInTheDocument();
  });

  it('renders Section 4: Simple Content Editing Card & triggers updates', async () => {
    render(<LaunchAssetsView {...defaultProps} />);
    expect(screen.getByText('Edit content')).toBeInTheDocument();
    expect(screen.getByText('HEADLINE')).toBeInTheDocument();
    expect(screen.getByText('DESCRIPTION')).toBeInTheDocument();
    expect(screen.getByText('BUTTON LABEL')).toBeInTheDocument();
    expect(screen.getByText('BUTTON DESTINATION')).toBeInTheDocument();

    const applyButton = screen.getByText('Apply changes');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(defaultProps.onUpdateAssets).toHaveBeenCalled();
    });
  });

  it('renders Section 5: Website Sections Card with 7 included and 2 excluded items', () => {
    render(<LaunchAssetsView {...defaultProps} />);
    expect(screen.getByText('Website sections')).toBeInTheDocument();
    expect(screen.getByText('7 Included · 2 Excluded')).toBeInTheDocument();
    expect(screen.getByText('Review pricing details →')).toBeInTheDocument();
    expect(screen.getByText('Review proof →')).toBeInTheDocument();
  });

  it('renders Section 5 with confirmed zero price badge and copy', () => {
    const freeAssets: LaunchAssetsPlan = {
      ...mockAssets,
      pricingExclusion: {
        ...mockAssets.pricingExclusion,
        priceStatus: 'ConfirmedZero',
        chosenPrice: 0,
        reason: 'Your chosen plan (Free Tier) is explicitly free. Review and confirm offer details before adding pricing to the website.',
      },
    };
    render(<LaunchAssetsView {...defaultProps} assets={freeAssets} />);
    expect(screen.getByText('Confirmed Free · Not on site')).toBeInTheDocument();
    expect(screen.getByText(/explicitly free/i)).toBeInTheDocument();
  });

  it('renders Section 6: Footer Actions & Navigation Progression accurately', () => {
    render(<LaunchAssetsView {...defaultProps} />);
    expect(screen.getByText(/Back to Launch Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue to Construction Overview/i)).toBeInTheDocument();
  });

  it('toggles viewport from desktop to mobile preview', () => {
    render(<LaunchAssetsView {...defaultProps} />);
    const mobileBtn = screen.getByText('Mobile');
    fireEvent.click(mobileBtn);
    expect(mobileBtn.closest('button')).toHaveClass('bg-background');
  });

  it('handles Create New Version and Download Source clicks', async () => {
    render(<LaunchAssetsView {...defaultProps} />);
    const newVersionBtn = screen.getByText('Create a new version');
    fireEvent.click(newVersionBtn);
    expect(defaultProps.onNewVersion).toHaveBeenCalled();

    const downloadBtn = screen.getByText('Download source');
    fireEvent.click(downloadBtn);
    expect(defaultProps.onDownloadSource).toHaveBeenCalled();
  });
});
