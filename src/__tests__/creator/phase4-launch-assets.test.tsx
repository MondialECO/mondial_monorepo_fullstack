import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LaunchAssetsView } from '@/components/creator/phase4/LaunchAssetsView';
import type { LaunchAssetsPlan } from '@/types/creator/launch-assets';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({ token: 'test-token-456' }),
  usePathname: () => '/p/launch/test-token-456',
}));

const mockAssets: LaunchAssetsPlan = {
  assetType: 'ONE-PAGE WEBSITE',
  version: 1,
  status: 'Draft',
  releaseTag: 'v1.0-rc',
  publishedStatus: 'Anyone with the link can view this website.',
  shareToken: 'share-tok-123',
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
    onUpdateAssets: vi.fn().mockResolvedValue(undefined),
    onNewVersion: vi.fn().mockResolvedValue(undefined),
    onSelectVersion: vi.fn().mockResolvedValue(undefined),
    onDownloadSource: vi.fn().mockResolvedValue(undefined),
    onShareWebsite: vi.fn().mockResolvedValue('test-share-token-123'),
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
    expect(screen.getByText('Anyone with the link can view this website.')).toBeInTheDocument();
    expect(screen.getByText('View website')).toBeInTheDocument();
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    expect(screen.getByText('Download source')).toBeInTheDocument();
    
    const useVersionBtn = screen.getByText('Use this version');
    expect(useVersionBtn).toBeInTheDocument();
    fireEvent.click(useVersionBtn);
    expect(defaultProps.onSelectVersion).toHaveBeenCalled();
  });

  it('handles View website by saving editor state and opening public URL in a new tab when dirty', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<LaunchAssetsView {...defaultProps} />);

    // Modify a field to make the editor dirty
    const headlineInput = screen.getByDisplayValue('A clearer way to manage enquiries and quotations.');
    fireEvent.change(headlineInput, { target: { value: 'New dirty headline' } });

    const viewWebsiteBtn = screen.getByText('View website');
    fireEvent.click(viewWebsiteBtn);

    await waitFor(() => {
      expect(defaultProps.onUpdateAssets).toHaveBeenCalled();
      expect(defaultProps.onShareWebsite).toHaveBeenCalledWith(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('/p/launch/test-share-token-123'),
        '_blank',
        'noopener,noreferrer'
      );
    });
    windowOpenSpy.mockRestore();
  });

  it('reopens existing public URL directly without saving or re-sharing when clean on repeat clicks', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const onUpdateMock = vi.fn().mockResolvedValue(undefined);
    const onShareMock = vi.fn().mockResolvedValue('share-tok-123');
    render(<LaunchAssetsView {...defaultProps} onUpdateAssets={onUpdateMock} onShareWebsite={onShareMock} />);

    const viewWebsiteBtn = screen.getByText('View website');
    // First click
    fireEvent.click(viewWebsiteBtn);
    // Second click (repeated click without changes)
    fireEvent.click(viewWebsiteBtn);

    await waitFor(() => {
      expect(onUpdateMock).not.toHaveBeenCalled();
      expect(onShareMock).not.toHaveBeenCalled();
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('/p/launch/share-tok-123'),
        '_blank',
        'noopener,noreferrer'
      );
    });
    windowOpenSpy.mockRestore();
  });

  it('handles Copy link by copying durable public URL to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
      writable: true,
    });

    render(<LaunchAssetsView {...defaultProps} />);
    const copyLinkBtn = screen.getByText('Copy link');
    fireEvent.click(copyLinkBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('/p/launch/share-tok-123')
      );
      expect(screen.getByText('Link copied!')).toBeInTheDocument();
    });
  });

  it('renders Section 2: Button Destination Attention Notice and does not render removed Brand Studio strip', () => {
    render(<LaunchAssetsView {...defaultProps} />);
    expect(screen.queryByText('BUILT FROM:')).not.toBeInTheDocument();
    expect(screen.queryByText('Brand Palette')).not.toBeInTheDocument();
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
    expect(screen.getByText(/Continue to Construction Readiness/i)).toBeInTheDocument();
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
    expect(defaultProps.onDownloadSource).toHaveBeenCalledWith(1);
  });
});

describe('PublicLaunchWebsitePage', () => {
  const mockPublicAsset = {
    shareToken: 'test-token-456',
    version: 1,
    releaseTag: 'v1.0-rc',
    sharedAt: '2026-09-27T12:00:00Z',
    publishedStatus: 'Anyone with the link can view this website.',
    brandName: 'AuraCall',
    conceptBadge: 'PREVIEWING CONCEPT',
    headline: 'A clearer way to manage enquiries and quotations.',
    description: 'AuraCall is being built to help independent service businesses.',
    buttonLabel: 'Express interest',
    buttonDestinationType: 'Email',
    buttonDestinationValue: 'hello@auracall.ai',
    buttonDestinationConfigured: true,
    heroHelpText: 'Help shape the project by sharing how you work today.',
    plannedWorkflowTitle: 'PLANNED WORKFLOW',
    plannedWorkflowSubtitle: 'High-level interface structure',
    workflowSteps: [
      { stepNumber: 1, title: '1. Enquiry', description: 'Intake card.', tag: 'Unified intake' },
    ],
    problemEyebrow: 'KEEP TRACK OF THE NEXT STEP',
    problemStatement: 'Problem statement text.',
    operationalMomentumStatement: 'Momentum text.',
    solutionHeader: 'Planned solution',
    solutionSubheader: 'Solution tools.',
    plannedSolutions: [
      { title: 'Enquiries together', description: 'Clear place.', icon: 'mail' },
    ],
    howItWorksHeader: 'How it works',
    howItWorksSubheader: 'Flow description.',
    workflowDetails: [
      { stepNumber: 1, title: 'Organise enquiry', description: 'Collect briefs.' },
    ],
    faqHeader: 'FAQ',
    faqSubheader: 'Honest answers.',
    faqs: [
      { question: 'When will it launch?', answer: 'Soon.' },
    ],
    finalCtaHeader: 'Share how you work today',
    finalCtaSubheader: 'Your experience shapes AuraCall.',
    footerNotice: 'Project in preparation',
    sections: [
      { key: 'hero', isIncluded: true, isRequired: true },
      { key: 'problem', isIncluded: true, isRequired: false },
      { key: 'solution', isIncluded: true, isRequired: false },
      { key: 'how-it-works', isIncluded: true, isRequired: false },
      { key: 'faq', isIncluded: true, isRequired: false },
      { key: 'final-cta', isIncluded: true, isRequired: false },
      { key: 'footer', isIncluded: true, isRequired: true },
    ],
    brandStudio: {
      brandName: 'AuraCall',
      concept: 'AI Voice Receptionist',
      targetAudience: 'Local service businesses',
      primaryColorHex: '#1A1A24',
      secondaryColorHex: '#3C61DD',
      accentColorHex: '#00D084',
      backgroundColorHex: '#FFFFFF',
      textColorHex: '#0F172A',
      displayFontFamily: 'Syne',
      textFontFamily: 'DM Sans',
      headingWeight: '700',
      bodyWeight: '400',
      logoMarkUri: '/brand-assets/logos/auracall/mark.svg',
      logoLockupUri: '/brand-assets/logos/auracall/lockup.svg',
    },
  };

  it('renders the public launch page with logo lockup image without duplicate text', async () => {
    const apiLaunchAssets = await import('@/lib/api-creator-launch-assets');
    vi.spyOn(apiLaunchAssets, 'getPublicLaunchAsset').mockResolvedValue(mockPublicAsset as any);

    const PublicPage = (await import('@/app/p/launch/[token]/page')).default;
    render(<PublicPage />);

    await waitFor(() => {
      expect(screen.getByText('A clearer way to manage enquiries and quotations.')).toBeInTheDocument();
    });

    // Logo image should be present with alt text
    const logoImgs = screen.getAllByAltText(/AuraCall logo/i);
    expect(logoImgs.length).toBeGreaterThan(0);
    expect(logoImgs[0]).toHaveAttribute('src', expect.stringContaining('/brand-assets/logos/auracall/lockup.svg'));

    // Configured CTA link
    const ctaLinks = screen.getAllByRole('link', { name: /Express interest/i });
    expect(ctaLinks.length).toBe(2);
    expect(ctaLinks[0]).toHaveAttribute('href', 'mailto:hello@auracall.ai');
    expect(ctaLinks[1]).toHaveAttribute('href', 'mailto:hello@auracall.ai');
  });
});
