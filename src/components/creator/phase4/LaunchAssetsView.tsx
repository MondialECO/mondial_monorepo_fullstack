'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Layers,
  FileText,
  Bell,
  Mail,
  Link as LinkIcon,
  Monitor,
  Smartphone,
  Check,
  ExternalLink,
  Edit3,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Clock,
  ShieldCheck,
  Eye,
  Info,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  LaunchAssetsPlan,
  LaunchAssetSection,
  LaunchWorkflowStep,
  LaunchSolutionCard,
  LaunchWorkflowDetailedItem,
  LaunchFaqItem,
  UpdateLaunchAssetsRequest,
} from '@/types/creator/launch-assets';
import { resolveMediaUrl } from '@/lib/brand-kit-media';

interface LaunchAssetsViewProps {
  ideaId: string;
  projectName: string;
  assets: LaunchAssetsPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
  isLoading: boolean;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateAssets: (req: UpdateLaunchAssetsRequest) => Promise<void>;
  onNewVersion: () => Promise<void>;
  onDownloadSource: () => Promise<void>;
}

export function LaunchAssetsView({
  ideaId,
  projectName,
  assets,
  updateAvailable,
  changedSources,
  isLoading,
  onGenerate,
  onRefresh,
  onUpdateAssets,
  onNewVersion,
  onDownloadSource,
}: LaunchAssetsViewProps) {
  const router = useRouter();

  // Viewport mode for website preview
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

  // Active section selected in editor
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('hero');

  // Section A: Hero state
  const [headline, setHeadline] = useState(assets?.headline || 'A clearer way to manage enquiries and quotations.');
  const [description, setDescription] = useState(
    assets?.description ||
      `${projectName} is being built to help independent service businesses keep enquiries, quotations, and follow-ups together.`
  );
  const [buttonLabel, setButtonLabel] = useState(assets?.buttonLabel || 'Express interest');
  const [destType, setDestType] = useState<'Email' | 'Link'>(
    assets?.buttonDestinationType === 'Link' ? 'Link' : 'Email'
  );
  const [destValue, setDestValue] = useState(assets?.buttonDestinationValue || '');

  // Section B: Problem state
  const [problemEyebrow, setProblemEyebrow] = useState(assets?.problemEyebrow || 'KEEP TRACK OF THE NEXT STEP');
  const [problemStatement, setProblemStatement] = useState(
    assets?.problemStatement ||
      'When enquiries and quotations are spread across different places, it can be harder to see what needs a reply or follow-up.'
  );
  const [operationalMomentumStatement, setOperationalMomentumStatement] = useState(
    assets?.operationalMomentumStatement ||
      `${assets?.brandName || projectName} focuses squarely on maintaining single-view operational momentum for solo consultants and niche service providers.`
  );

  // Section C: Solution state
  const [solutionHeader, setSolutionHeader] = useState(assets?.solutionHeader || 'What’s being planned');
  const [solutionSubheader, setSolutionSubheader] = useState(
    assets?.solutionSubheader || 'Straightforward tools designed strictly around routine project administration.'
  );
  const [plannedSolutions, setPlannedSolutions] = useState<LaunchSolutionCard[]>(
    assets?.plannedSolutions || [
      { title: 'Enquiries together', description: 'A clearer place to organise incoming customer requests.', icon: 'mail' },
      { title: 'Quotations in view', description: 'A way to keep track of quotations and their next steps.', icon: 'file-text' },
      { title: 'Follow-ups to remember', description: 'A way to see which conversations need attention.', icon: 'bell' },
    ]
  );

  // Section D: How It Works state
  const [howItWorksHeader, setHowItWorksHeader] = useState(assets?.howItWorksHeader || 'A simpler flow for your work');
  const [howItWorksSubheader, setHowItWorksSubheader] = useState(
    assets?.howItWorksSubheader || 'This describes the planned workflow.'
  );
  const [workflowDetails, setWorkflowDetails] = useState<LaunchWorkflowDetailedItem[]>(
    assets?.workflowDetails || [
      { stepNumber: 1, title: 'Organise the enquiry', description: 'Collect client briefs, deadlines, and key requirements without sorting through scattered inbox threads.' },
      { stepNumber: 2, title: 'Prepare and track the quotation', description: 'Generate clean, professional estimates linked directly to the original client request.' },
      { stepNumber: 3, title: 'Follow up on the next action', description: 'Receive clear prompts when responses are due, making timely follow-through second nature.' },
    ]
  );

  // Section E: FAQ state
  const [faqHeader, setFaqHeader] = useState(assets?.faqHeader || 'Frequently Asked Questions');
  const [faqSubheader, setFaqSubheader] = useState(
    assets?.faqSubheader || 'Honest answers about development status and availability.'
  );
  const [faqs, setFaqs] = useState<LaunchFaqItem[]>(
    assets?.faqs || [
      { question: `Can I use ${assets?.brandName || projectName} today?`, answer: 'The product is currently in preparation.' },
      { question: 'Who is it being designed for?', answer: 'Independent service businesses that manage customer enquiries and quotations.' },
      { question: 'When will it launch?', answer: 'A launch date has not been confirmed.' },
    ]
  );

  // Section F: Final CTA state
  const [finalCtaHeader, setFinalCtaHeader] = useState(assets?.finalCtaHeader || 'Share how you work today');
  const [finalCtaSubheader, setFinalCtaSubheader] = useState(
    assets?.finalCtaSubheader || `Your experience can help shape what ${assets?.brandName || projectName} focuses on.`
  );

  // Section G: Footer state
  const [brandName, setBrandName] = useState(assets?.brandName || projectName);
  const [footerNotice, setFooterNotice] = useState(assets?.footerNotice || 'Project in preparation');

  // Sections inclusion list
  const [sectionsList, setSectionsList] = useState<LaunchAssetSection[]>(assets?.sections || []);

  // Live save / feedback state
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionSuccess, setVersionSuccess] = useState(false);

  // Fullscreen Preview Modal
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);

  // Suggest wording modal / dropdown
  const [isSuggestWordingOpen, setIsSuggestWordingOpen] = useState(false);

  // Synchronize initial state when assets update from server
  useEffect(() => {
    if (assets) {
      setHeadline(assets.headline || '');
      setDescription(assets.description || '');
      setButtonLabel(assets.buttonLabel || 'Express interest');
      setDestType(assets.buttonDestinationType === 'Link' ? 'Link' : 'Email');
      setDestValue(assets.buttonDestinationValue || '');

      setProblemEyebrow(assets.problemEyebrow || 'KEEP TRACK OF THE NEXT STEP');
      setProblemStatement(assets.problemStatement || '');
      setOperationalMomentumStatement(assets.operationalMomentumStatement || '');

      setSolutionHeader(assets.solutionHeader || 'What’s being planned');
      setSolutionSubheader(assets.solutionSubheader || '');
      if (assets.plannedSolutions && assets.plannedSolutions.length > 0) {
        setPlannedSolutions(assets.plannedSolutions);
      }

      setHowItWorksHeader(assets.howItWorksHeader || 'A simpler flow for your work');
      setHowItWorksSubheader(assets.howItWorksSubheader || '');
      if (assets.workflowDetails && assets.workflowDetails.length > 0) {
        setWorkflowDetails(assets.workflowDetails);
      }

      setFaqHeader(assets.faqHeader || 'Frequently Asked Questions');
      setFaqSubheader(assets.faqSubheader || '');
      if (assets.faqs && assets.faqs.length > 0) {
        setFaqs(assets.faqs);
      }

      setFinalCtaHeader(assets.finalCtaHeader || 'Share how you work today');
      setFinalCtaSubheader(assets.finalCtaSubheader || '');

      setBrandName(assets.brandName || projectName);
      setFooterNotice(assets.footerNotice || 'Project in preparation');

      if (assets.sections && assets.sections.length > 0) {
        setSectionsList(assets.sections);
      }
    }
  }, [assets, projectName]);

  const handleApplyChanges = async () => {
    try {
      setIsApplying(true);
      await onUpdateAssets({
        activeSectionKey: selectedSectionKey,
        headline,
        description,
        buttonLabel,
        buttonDestinationType: destValue.trim() ? destType : 'NotSet',
        buttonDestinationValue: destValue.trim(),
        problemEyebrow,
        problemStatement,
        operationalMomentumStatement,
        solutionHeader,
        solutionSubheader,
        plannedSolutions,
        howItWorksHeader,
        howItWorksSubheader,
        workflowDetails,
        faqHeader,
        faqSubheader,
        faqs,
        finalCtaHeader,
        finalCtaSubheader,
        brandName,
        footerNotice,
        sections: sectionsList,
      });
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCreateNewVersion = async () => {
    try {
      setIsCreatingVersion(true);
      await onNewVersion();
      setVersionSuccess(true);
      setTimeout(() => setVersionSuccess(false), 3000);
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleSelectSectionToEdit = (key: string) => {
    setSelectedSectionKey(key);
    const editorElem = document.getElementById('simple-content-editor');
    if (editorElem) {
      editorElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleSectionInclusion = (key: string) => {
    setSectionsList((prev) =>
      prev.map((s) => {
        if (s.key === key && !s.isRequired) {
          const nextIncluded = !s.isIncluded;
          return {
            ...s,
            isIncluded: nextIncluded,
            statusBadge: nextIncluded ? 'Included' : 'Excluded',
          };
        }
        return s;
      })
    );
  };

  const handleScrollToDestination = () => {
    setSelectedSectionKey('hero');
    const destInput = document.getElementById('button-destination-input');
    if (destInput) {
      destInput.scrollIntoView({ behavior: 'smooth' });
      destInput.focus();
    }
  };

  const brandStudio = assets?.brandStudio;
  const brandPrimary = brandStudio?.primaryColorHex || '#3B82F6';
  const brandSecondary = brandStudio?.secondaryColorHex || '#10B981';
  const brandAccent = brandStudio?.accentColorHex || '#F59E0B';
  const brandBackground = brandStudio?.backgroundColorHex || '#090A0C';
  const brandText = brandStudio?.textColorHex || '#F3F4F6';
  const displayFont = brandStudio?.displayFontFamily || 'Inter';
  const textFont = brandStudio?.textFontFamily || 'DM Sans';
  const headingWeight = brandStudio?.headingWeight || '700';
  const bodyWeight = brandStudio?.bodyWeight || '400';

  const logoUri = brandStudio?.logoLockupUri || brandStudio?.logoMarkUri;
  const resolvedLogoUrl = logoUri ? resolveMediaUrl(logoUri) : '';
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    textFont
  ).replace(/%20/g, '+')}:wght@300;400;500;600;700;800&family=${encodeURIComponent(
    displayFont
  ).replace(/%20/g, '+')}:wght@400;500;600;700;800;900&display=swap`;

  // AI copy suggestions synthesized directly from Brand Studio
  const wordingSuggestions = [
    {
      label: brandStudio?.positioning ? `Strategic: ${brandStudio.positioning.slice(0, 24)}...` : 'Positioning Aligned',
      headline: brandStudio?.positioning || 'A clearer way to manage enquiries and quotations.',
      desc: brandStudio?.concept && brandStudio?.targetAudience
        ? `${brandName} is being built for ${brandStudio.targetAudience.replace(/\.+$/, '')}. ${brandStudio.concept}`
        : `${brandName} is being built to help independent service businesses keep enquiries, quotations, and follow-ups together.`,
      btn: 'Express interest',
    },
    {
      label: 'Target Audience Focus',
      headline: brandStudio?.targetAudience ? `Designed for ${brandStudio.targetAudience.toLowerCase().replace(/\.+$/, '')}.` : 'Simple, unified enquiry and quotation management.',
      desc: `${brandName} keeps your incoming inquiries, proposals, and client follow-ups in a clean single-flow workspace.`,
      btn: 'Join Early Access',
    },
    {
      label: 'Outcome & Speed Centric',
      headline: 'Never lose track of a client enquiry or pending quotation again.',
      desc: `Built specifically to eliminate scattered inboxes and lost quotation follow-ups for independent businesses.`,
      btn: 'Express interest',
    },
  ];

  const applyWordingSuggestion = (s: typeof wordingSuggestions[0]) => {
    setHeadline(s.headline);
    setDescription(s.desc);
    setButtonLabel(s.btn);
    setIsSuggestWordingOpen(false);
  };

  if (!assets) {
    return (
      <div className="max-w-[1120px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <Globe className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-heading font-semibold text-foreground">
              Launch Assets · One-Page Launch Website
            </h2>
            <p className="text-sm font-sans text-muted-foreground leading-relaxed">
              Generate an honest, branded one-page website synthesized directly from your Brand Kit, Value Proposition, Pricing Strategy, and GTM Plan.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-sans font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Generating Launch Website...' : 'Generate Launch Website'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDestinationConfigured = Boolean(
    destValue && destValue.trim() !== ''
  );

  const isSectionIncluded = (key: string) => {
    const sec = sectionsList.find((s) => s.key === key);
    return sec ? sec.isIncluded : true;
  };

  const sectionsNavTabs = [
    { key: 'hero', label: 'Hero', required: true },
    { key: 'problem', label: 'Problem', required: false },
    { key: 'solution', label: 'Solution', required: false },
    { key: 'how-it-works', label: 'How It Works', required: false },
    { key: 'faq', label: 'FAQ', required: false },
    { key: 'final-cta', label: 'Final CTA', required: false },
    { key: 'footer', label: 'Footer', required: true },
  ];

  const includedCount = sectionsList.filter((s) => s.isIncluded).length || 7;
  const excludedCount = (sectionsList.length || 7) - includedCount + 2; // + 2 for pricing and proof

  return (
    <div className="max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 pb-24">
      {/* Inject Brand Studio Google Fonts */}
      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 1: COMPACT ASSET SUMMARY CARD */}
      {/* ------------------------------------------------------------------------- */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xl font-heading font-bold text-foreground">
                {brandName || projectName}
              </span>
              <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                / {assets.assetType || 'ONE-PAGE WEBSITE'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                {assets.status || 'Draft'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-muted-foreground border border-border">
                {assets.releaseTag || `v1.${assets.version}-rc`}
              </span>
            </div>

            <p className="text-sm font-sans text-muted-foreground leading-relaxed">
              Review your website, adjust the content, and choose the version you want to keep.
            </p>

            <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
              <Globe className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
              <span>{assets.publishedStatus || 'Available to view in MBC. Not published.'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsFullscreenPreviewOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              <span>View website</span>
            </button>

            <button
              onClick={onDownloadSource}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Download source</span>
            </button>

            <button
              onClick={() => {
                setAppliedSuccess(true);
                setTimeout(() => setAppliedSuccess(false), 2500);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use this version</span>
            </button>
          </div>
        </div>

        {/* Version Meta Footer */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground">Current draft: Version {assets.version || 1}</span>
            <span>•</span>
            <span>Generated recently</span>
          </div>

          <button
            onClick={handleCreateNewVersion}
            disabled={isCreatingVersion}
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCreatingVersion ? 'animate-spin' : ''}`} />
            <span>{versionSuccess ? 'Version Created!' : 'Create a new version'}</span>
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 2: BRAND STUDIO SOURCE STRIP & BUTTON DESTINATION NOTICE */}
      {/* ------------------------------------------------------------------------- */}
      <section className="space-y-3">
        {/* Built From Strip & Brand Studio Intelligence Summary */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-muted-foreground text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                BUILT FROM:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/80 font-sans text-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Your Brand Kit
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/80 font-sans text-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Chosen offer
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/80 font-sans text-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Launch strategy
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-sans text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                {assets?.brandStudio?.brandName || brandName || projectName}
              </span>
            </div>
            <Link
              href={`/dashboard/creator/brand-kit${ideaId ? `?ideaId=${ideaId}` : ''}`}
              className="inline-flex items-center gap-1 text-xs font-sans text-primary hover:underline font-medium"
            >
              <span>Edit Brand Studio</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Detailed Brand Studio Tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Color Palette */}
            <div className="bg-muted/30 border border-border/80 rounded-lg p-2.5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Brand Palette
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: assets?.brandStudio?.primaryColorHex || '#3B82F6' }}
                    title={`Primary: ${assets?.brandStudio?.primaryColorHex || '#3B82F6'}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: assets?.brandStudio?.secondaryColorHex || '#10B981' }}
                    title={`Secondary: ${assets?.brandStudio?.secondaryColorHex || '#10B981'}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: assets?.brandStudio?.accentColorHex || '#F59E0B' }}
                    title={`Accent: ${assets?.brandStudio?.accentColorHex || '#F59E0B'}`}
                  />
                </div>
                <span className="font-mono text-[11px] text-foreground font-medium">
                  {assets?.brandStudio?.primaryColorHex || '#3B82F6'}
                </span>
              </div>
            </div>

            {/* Typography */}
            <div className="bg-muted/30 border border-border/80 rounded-lg p-2.5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Typography
              </span>
              <div className="flex items-center gap-1.5 text-foreground font-medium truncate">
                <span className="truncate">{assets?.brandStudio?.displayFontFamily || 'Inter'}</span>
                <span className="text-muted-foreground">/</span>
                <span className="truncate text-muted-foreground">{assets?.brandStudio?.textFontFamily || 'DM Sans'}</span>
              </div>
            </div>

            {/* Target Audience */}
            <div className="bg-muted/30 border border-border/80 rounded-lg p-2.5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Target Audience
              </span>
              <p className="text-foreground text-[11px] font-sans truncate" title={assets?.brandStudio?.targetAudience || 'Independent businesses'}>
                {assets?.brandStudio?.targetAudience || 'Independent service businesses'}
              </p>
            </div>

            {/* Personality Traits */}
            <div className="bg-muted/30 border border-border/80 rounded-lg p-2.5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Brand Personality
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {assets?.brandStudio?.personalityTraits && assets.brandStudio.personalityTraits.length > 0 ? (
                  assets.brandStudio.personalityTraits.slice(0, 2).map((t, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] font-sans text-foreground">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-[11px]">Clear, Straightforward</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Amber / Success Attention Notice Card */}
        {!isDestinationConfigured ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-heading font-semibold text-foreground">
                  Add a destination for your main button
                </h3>
                <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                  ‘{buttonLabel || 'Express interest'}’ needs a confirmed email address or existing link before visitors can interact.
                </p>
              </div>
            </div>
            <button
              onClick={handleScrollToDestination}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-sans font-medium text-xs hover:bg-amber-400 transition-colors shrink-0 shadow-sm"
            >
              Set button destination
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-heading font-semibold text-foreground">
                  Main button destination configured
                </h3>
                <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                  Destination: <span className="font-mono text-foreground font-medium">{destType === 'Email' ? `mailto:${destValue}` : destValue}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleScrollToDestination}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors shrink-0"
            >
              Edit destination
            </button>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 3: WEBSITE PREVIEW CONTROLS & DEVICE FRAME */}
      {/* ------------------------------------------------------------------------- */}
      <section className="space-y-4">
        {/* Controls Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-heading font-semibold text-foreground">Website preview</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-sans text-muted-foreground border border-border bg-muted/40">
              Draft preview
            </span>
          </div>

          {/* Viewport Selector */}
          <div className="inline-flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewportMode === 'desktop'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewportMode === 'mobile'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Device Frame Envelope */}
        <div className="bg-muted/20 border border-border rounded-2xl p-4 sm:p-8 flex justify-center">
          <div
            className={`w-full transition-all duration-300 ${
              viewportMode === 'mobile'
                ? 'max-w-[390px] border-4 border-muted-foreground/20 rounded-[32px] overflow-hidden shadow-2xl bg-card'
                : 'max-w-full rounded-xl border border-border shadow-xl bg-card'
            }`}
          >
            {/* Simulated Browser Bar for Desktop */}
            {viewportMode === 'desktop' && (
              <div className="border-b border-border bg-muted/40 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="bg-background/80 border border-border/80 px-4 py-0.5 rounded-md font-mono text-[11px] text-muted-foreground/90">
                  preview.{brandName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'clairdesk'}.mondial.eco
                </div>
                <div className="w-10" />
              </div>
            )}

            {/* Simulated Notch for Mobile */}
            {viewportMode === 'mobile' && (
              <div className="pt-2 pb-1 bg-card flex justify-center border-b border-border/40">
                <div className="w-20 h-3 rounded-full bg-muted" />
              </div>
            )}

            {/* Inner Website Content */}
            <div className="divide-y divide-border/60 text-foreground font-sans">
              {/* SECTION A: PREVIEW TOP BAR & HERO */}
              {isSectionIncluded('hero') && (
                <div className="p-6 sm:p-10 space-y-8">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      {resolvedLogoUrl ? (
                        <img
                          src={resolvedLogoUrl}
                          alt={brandName || projectName}
                          className="h-8 w-auto max-w-[150px] object-contain"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs"
                          style={{ backgroundColor: brandPrimary }}
                        >
                          {(brandName || projectName || 'M').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span
                        className="font-bold text-base sm:text-lg text-foreground tracking-tight"
                        style={{ fontFamily: `'${displayFont}', sans-serif`, fontWeight: headingWeight }}
                      >
                        {brandName || projectName}
                      </span>
                    </div>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                      style={{
                        borderColor: `${brandPrimary}40`,
                        color: brandPrimary,
                        backgroundColor: `${brandPrimary}15`,
                      }}
                    >
                      In preparation
                    </span>
                  </div>

                  {/* Hero Center */}
                  <div className="text-center max-w-2xl mx-auto space-y-4 pt-4">
                    <span
                      className="inline-block text-[11px] font-mono uppercase tracking-widest font-semibold"
                      style={{ color: brandPrimary }}
                    >
                      {assets.conceptBadge || 'PREVIEWING CONCEPT'}
                    </span>
                    <h1
                      className="text-2xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight"
                      style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                    >
                      {headline}
                    </h1>
                    <p
                      className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto"
                      style={{ fontFamily: textFont !== 'inherit' ? textFont : undefined }}
                    >
                      {description}
                    </p>

                    {/* Hero CTA & Disabled Link Notice */}
                    <div className="pt-2 space-y-3">
                      <div className="inline-flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative group">
                          <button
                            disabled
                            className="px-6 py-2.5 rounded-lg text-white font-medium text-sm inline-flex items-center gap-2 cursor-not-allowed opacity-95 shadow-sm transition-transform"
                            style={{ backgroundColor: brandPrimary }}
                          >
                            <span>{buttonLabel}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-sans text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          Interactive link disabled in preview
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {assets.heroHelpText || 'Help shape the project by sharing how you work today.'}
                      </p>
                    </div>
                  </div>

                  {/* Planned Workflow Visual Container */}
                  <div className="bg-muted/30 border border-border/80 rounded-xl p-5 sm:p-6 space-y-4 mt-8">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandPrimary }} />
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                          {assets.plannedWorkflowTitle || 'PLANNED WORKFLOW'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {assets.plannedWorkflowSubtitle || 'High-level interface structure'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {assets.workflowSteps && assets.workflowSteps.length > 0 ? (
                        assets.workflowSteps.map((step) => (
                          <div
                            key={step.stepNumber}
                            className="bg-card border border-border rounded-lg p-4 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div
                                className="w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center"
                                style={{ backgroundColor: `${brandPrimary}15`, color: brandPrimary }}
                              >
                                {step.stepNumber}
                              </div>
                              <h4
                                className="text-sm font-semibold text-foreground"
                                style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                              >
                                {step.title}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                            </div>
                            <div
                              className="pt-2 border-t border-border/60 flex items-center gap-1.5 text-[11px] font-medium"
                              style={{ color: brandPrimary }}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{step.tag}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-semibold">1. Enquiry</h4>
                            <p className="text-xs text-muted-foreground">Capture context and client requirements in one dedicated intake card.</p>
                          </div>
                          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-semibold">2. Quotation</h4>
                            <p className="text-xs text-muted-foreground">Draft estimated scopes and convert directly into clear client proposals.</p>
                          </div>
                          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-semibold">3. Follow-up</h4>
                            <p className="text-xs text-muted-foreground">Clear reminders and stage updates so no client is left waiting.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: PROBLEM STATEMENT */}
              {isSectionIncluded('problem') && (
                <div className="p-6 sm:p-10 space-y-4 bg-muted/10">
                  <span
                    className="text-[11px] font-mono uppercase tracking-widest font-semibold"
                    style={{ color: brandPrimary }}
                  >
                    {problemEyebrow}
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-semibold text-foreground max-w-2xl leading-snug"
                    style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                  >
                    {problemStatement}
                  </h3>
                  <div className="w-12 h-0.5 my-2" style={{ backgroundColor: `${brandPrimary}70` }} />
                  <p
                    className="text-sm text-muted-foreground max-w-2xl leading-relaxed"
                    style={{ fontFamily: textFont !== 'inherit' ? textFont : undefined }}
                  >
                    {operationalMomentumStatement}
                  </p>
                </div>
              )}

              {/* SECTION C: PLANNED SOLUTION */}
              {isSectionIncluded('solution') && (
                <div className="p-6 sm:p-10 space-y-6">
                  <div className="space-y-1">
                    <h3
                      className="text-lg sm:text-xl font-semibold text-foreground"
                      style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                    >
                      {solutionHeader}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {solutionSubheader}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plannedSolutions.map((sol, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-xl p-5 space-y-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${brandPrimary}15`, color: brandPrimary }}
                        >
                          {idx === 0 ? (
                            <Mail className="w-4 h-4" />
                          ) : idx === 1 ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <h4
                          className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                        >
                          {sol.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{sol.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION D: HOW IT IS INTENDED TO WORK */}
              {isSectionIncluded('how-it-works') && (
                <div className="p-6 sm:p-10 space-y-6 bg-muted/10">
                  <div className="space-y-1">
                    <h3
                      className="text-lg sm:text-xl font-semibold text-foreground"
                      style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                    >
                      {howItWorksHeader}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {howItWorksSubheader}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {workflowDetails.map((item) => (
                      <div
                        key={item.stepNumber}
                        className="bg-card border border-border rounded-xl p-4 sm:p-5 flex items-start gap-4"
                      >
                        <div
                          className="w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${brandPrimary}15`, color: brandPrimary }}
                        >
                          {item.stepNumber}
                        </div>
                        <div className="space-y-1">
                          <h4
                            className="text-sm font-semibold text-foreground"
                            style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                          >
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION E: FAQ */}
              {isSectionIncluded('faq') && (
                <div className="p-6 sm:p-10 space-y-6">
                  <div className="space-y-1">
                    <h3
                      className="text-lg sm:text-xl font-semibold text-foreground"
                      style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                    >
                      {faqHeader}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {faqSubheader}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-1.5">
                        <h4
                          className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                        >
                          {faq.question}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION F: FINAL CALL TO ACTION */}
              {isSectionIncluded('final-cta') && (
                <div className="p-8 sm:p-12 text-center space-y-4 bg-muted/20">
                  <h3
                    className="text-xl sm:text-2xl font-bold text-foreground"
                    style={{ fontFamily: displayFont !== 'inherit' ? displayFont : undefined }}
                  >
                    {finalCtaHeader}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                    {finalCtaSubheader}
                  </p>
                  <div className="pt-2">
                    <button
                      disabled
                      className="px-6 py-2.5 rounded-lg text-white font-medium text-sm inline-flex items-center gap-2 cursor-not-allowed opacity-95 shadow-sm"
                      style={{ backgroundColor: brandPrimary }}
                    >
                      <span>{buttonLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {!isDestinationConfigured && (
                      <p className="text-[11px] text-amber-500 dark:text-amber-400 mt-2 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Button requires destination configuration
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION G: FOOTER (INSIDE PREVIEW) */}
              {isSectionIncluded('footer') && (
                <div className="p-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {resolvedLogoUrl ? (
                      <img
                        src={resolvedLogoUrl}
                        alt={brandName || projectName}
                        className="h-5 w-auto max-w-[100px] object-contain opacity-80"
                      />
                    ) : (
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] text-white"
                        style={{ backgroundColor: brandPrimary }}
                      >
                        {(brandName || projectName || 'M').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span
                      className="font-semibold text-foreground"
                      style={{ fontFamily: `'${displayFont}', sans-serif` }}
                    >
                      {brandName || projectName}
                    </span>
                  </div>
                  <span>{footerNotice}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 4: SIMPLE CONTENT EDITING CARD */}
      {/* ------------------------------------------------------------------------- */}
      <section
        id="simple-content-editor"
        className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm scroll-mt-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-heading font-semibold text-foreground">Edit content</h2>
            <p className="text-xs font-sans text-muted-foreground">
              Change the wording without starting again. Choose a section below to customize.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>
              Section:{' '}
              {selectedSectionKey === 'hero'
                ? 'Hero (Headline, Description, Button)'
                : selectedSectionKey === 'problem'
                ? 'Problem Statement'
                : selectedSectionKey === 'solution'
                ? 'Planned Solution'
                : selectedSectionKey === 'how-it-works'
                ? 'How It Works'
                : selectedSectionKey === 'faq'
                ? 'FAQ'
                : selectedSectionKey === 'final-cta'
                ? 'Final Call to Action'
                : 'Footer'}
            </span>
          </div>
        </div>

        {/* Section Selector Tab Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border text-xs">
          {sectionsNavTabs.map((tab) => {
            const isCurrent = selectedSectionKey === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedSectionKey(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isCurrent
                    ? 'bg-background text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Editing Form Elements for selected section */}
        <div className="space-y-5">
          {/* SECTION: HERO */}
          {selectedSectionKey === 'hero' && (
            <>
              {/* Brand Studio Alignment Guidance */}
              {brandStudio?.positioning && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">Brand Studio Alignment:</span>
                    <p className="text-[11px] leading-relaxed">
                      Positioning: <span className="text-foreground font-medium">{brandStudio.positioning}</span>
                      {brandStudio.targetAudience && (
                        <> · Audience: <span className="text-foreground font-medium">{brandStudio.targetAudience}</span></>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Headline */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  HEADLINE
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                  placeholder="Enter headline..."
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-y"
                  placeholder="Enter project description..."
                />
              </div>

              {/* 2-Column Row: Button Label + Button Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Button Label */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    BUTTON LABEL
                  </label>
                  <input
                    type="text"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="Express interest"
                  />
                </div>

                {/* Button Destination */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      BUTTON DESTINATION
                    </label>
                    {destValue.trim() ? (
                      <span className="text-[11px] font-sans font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Configured
                      </span>
                    ) : (
                      <span className="text-[11px] font-sans font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Not set
                      </span>
                    )}
                  </div>

                  <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-3">
                    {/* Radio Selector */}
                    <div className="flex items-center gap-4 text-xs">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-foreground">
                        <input
                          type="radio"
                          name="destType"
                          checked={destType === 'Email'}
                          onChange={() => setDestType('Email')}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Email address</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-foreground">
                        <input
                          type="radio"
                          name="destType"
                          checked={destType === 'Link'}
                          onChange={() => setDestType('Link')}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Existing link</span>
                      </label>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Choose where visitors should go when they click.
                    </p>

                    <input
                      id="button-destination-input"
                      type="text"
                      value={destValue}
                      onChange={(e) => setDestValue(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      placeholder={destType === 'Email' ? 'e.g. hello@clairdesk.com' : 'e.g. https://tally.so/r/your-form'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION: PROBLEM */}
          {selectedSectionKey === 'problem' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  PROBLEM EYEBROW
                </label>
                <input
                  type="text"
                  value={problemEyebrow}
                  onChange={(e) => setProblemEyebrow(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                  placeholder="KEEP TRACK OF THE NEXT STEP"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  PROBLEM STATEMENT
                </label>
                <textarea
                  rows={3}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-y"
                  placeholder="Describe the primary friction..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  OPERATIONAL MOMENTUM STATEMENT
                </label>
                <textarea
                  rows={2}
                  value={operationalMomentumStatement}
                  onChange={(e) => setOperationalMomentumStatement(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-y"
                  placeholder="How your product maintains momentum..."
                />
              </div>
            </>
          )}

          {/* SECTION: SOLUTION */}
          {selectedSectionKey === 'solution' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    SOLUTION HEADER
                  </label>
                  <input
                    type="text"
                    value={solutionHeader}
                    onChange={(e) => setSolutionHeader(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="What’s being planned"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    SOLUTION SUBHEADER
                  </label>
                  <input
                    type="text"
                    value={solutionSubheader}
                    onChange={(e) => setSolutionSubheader(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="Short summary of planned tools..."
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  SOLUTION CARDS (3 ITEMS)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {plannedSolutions.map((sol, index) => (
                    <div key={index} className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                      <input
                        type="text"
                        value={sol.title}
                        onChange={(e) => {
                          const updated = [...plannedSolutions];
                          updated[index] = { ...updated[index], title: e.target.value };
                          setPlannedSolutions(updated);
                        }}
                        className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs font-semibold text-foreground"
                        placeholder="Card title"
                      />
                      <textarea
                        rows={2}
                        value={sol.description}
                        onChange={(e) => {
                          const updated = [...plannedSolutions];
                          updated[index] = { ...updated[index], description: e.target.value };
                          setPlannedSolutions(updated);
                        }}
                        className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-muted-foreground"
                        placeholder="Card description"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SECTION: HOW IT WORKS */}
          {selectedSectionKey === 'how-it-works' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    HEADER
                  </label>
                  <input
                    type="text"
                    value={howItWorksHeader}
                    onChange={(e) => setHowItWorksHeader(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="A simpler flow for your work"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    SUBHEADER
                  </label>
                  <input
                    type="text"
                    value={howItWorksSubheader}
                    onChange={(e) => setHowItWorksSubheader(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="This describes the planned workflow."
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  WORKFLOW STEPS
                </label>
                <div className="space-y-2">
                  {workflowDetails.map((item, index) => (
                    <div key={index} className="bg-muted/30 border border-border rounded-lg p-3 flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                        {item.stepNumber}
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...workflowDetails];
                            updated[index] = { ...updated[index], title: e.target.value };
                            setWorkflowDetails(updated);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs font-semibold text-foreground"
                          placeholder="Step title"
                        />
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...workflowDetails];
                            updated[index] = { ...updated[index], description: e.target.value };
                            setWorkflowDetails(updated);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-muted-foreground"
                          placeholder="Step description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SECTION: FAQ */}
          {selectedSectionKey === 'faq' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    FAQ HEADER
                  </label>
                  <input
                    type="text"
                    value={faqHeader}
                    onChange={(e) => setFaqHeader(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="Frequently Asked Questions"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    FAQ SUBHEADER
                  </label>
                  <input
                    type="text"
                    value={faqSubheader}
                    onChange={(e) => setFaqSubheader(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="Honest answers about development status..."
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  FAQ QUESTIONS & ANSWERS
                </label>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={index} className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[index] = { ...updated[index], question: e.target.value };
                          setFaqs(updated);
                        }}
                        className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs font-semibold text-foreground"
                        placeholder="Question"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[index] = { ...updated[index], answer: e.target.value };
                          setFaqs(updated);
                        }}
                        className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-muted-foreground"
                        placeholder="Answer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SECTION: FINAL CTA */}
          {selectedSectionKey === 'final-cta' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  FINAL CTA HEADER
                </label>
                <input
                  type="text"
                  value={finalCtaHeader}
                  onChange={(e) => setFinalCtaHeader(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                  placeholder="Share how you work today"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  FINAL CTA SUBHEADER
                </label>
                <textarea
                  rows={2}
                  value={finalCtaSubheader}
                  onChange={(e) => setFinalCtaSubheader(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-y"
                  placeholder="Your experience can help shape..."
                />
              </div>
            </>
          )}

          {/* SECTION: FOOTER */}
          {selectedSectionKey === 'footer' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    BRAND NAME
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="ClairDesk"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    FOOTER NOTICE
                  </label>
                  <input
                    type="text"
                    value={footerNotice}
                    onChange={(e) => setFooterNotice(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                    placeholder="Project in preparation"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Form Action Controls */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleApplyChanges}
              disabled={isApplying}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans font-medium text-xs hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {appliedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Changes Applied!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'Applying...' : 'Apply changes'}</span>
                </>
              )}
            </button>
          </div>

          {selectedSectionKey === 'hero' && (
            <button
              onClick={() => setIsSuggestWordingOpen(!isSuggestWordingOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Suggest new wording</span>
            </button>
          )}
        </div>

        {/* AI Wording Suggestion Box (for Hero) */}
        {isSuggestWordingOpen && selectedSectionKey === 'hero' && (
          <div className="bg-muted/40 border border-primary/20 rounded-xl p-4 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI Generated Copy Variations
              </span>
              <button
                onClick={() => setIsSuggestWordingOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {wordingSuggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => applyWordingSuggestion(s)}
                  className="bg-card border border-border hover:border-primary/50 p-3.5 rounded-lg cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span>{s.label}</span>
                    <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                      Use &rarr;
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{s.headline}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 5: WEBSITE SECTIONS CARD */}
      {/* ------------------------------------------------------------------------- */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-heading font-semibold text-foreground">Website sections</h2>
            <p className="text-xs font-sans text-muted-foreground">
              Keep the sections that help explain your project. Click <strong>Edit</strong> to customize any section.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-muted/60 border border-border text-xs font-mono text-muted-foreground">
            {includedCount} Included · {excludedCount} Excluded
          </span>
        </div>

        {/* Included Sections List */}
        <div className="space-y-2">
          {sectionsList && sectionsList.length > 0 ? (
            sectionsList.map((sec) => {
              const isActiveInEditor = selectedSectionKey === sec.key;
              return (
                <div
                  key={sec.key}
                  className={`bg-background border rounded-lg px-4 py-3 flex items-center justify-between gap-4 transition-colors ${
                    isActiveInEditor ? 'border-primary/60 bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {sec.isRequired ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleSectionInclusion(sec.key)}
                        title={sec.isIncluded ? 'Click to exclude' : 'Click to include'}
                        className="cursor-pointer"
                      >
                        {sec.isIncluded ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 hover:opacity-80" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-muted-foreground/40 shrink-0 hover:border-primary" />
                        )}
                      </button>
                    )}
                    <span className="text-sm font-heading font-medium text-foreground">{sec.title}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium border ${
                        sec.isIncluded
                          ? 'bg-muted text-muted-foreground border-border/80'
                          : 'bg-muted/40 text-muted-foreground/60 border-border/40'
                      }`}
                    >
                      {sec.isIncluded ? sec.statusBadge || 'Included' : 'Excluded'}
                    </span>
                    {isActiveInEditor && (
                      <span className="text-[11px] font-medium text-primary font-mono">
                        (Editing now)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSectionToEdit(sec.key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                        isActiveInEditor
                          ? 'bg-primary text-primary-foreground'
                          : 'text-primary hover:text-primary/80 hover:bg-muted bg-primary/10'
                      }`}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground">Sections list</div>
          )}
        </div>

        {/* Excluded & Pending Verification Block */}
        <div className="pt-4 border-t border-border space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            EXCLUDED & PENDING VERIFICATION
          </span>

          {/* Pricing Exclusion Card */}
          <div className="bg-muted/20 border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading font-semibold text-foreground">Pricing</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                  Not included
                </span>
              </div>
              <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                {assets.pricingExclusion?.reason ||
                  `Your chosen price is €${assets.pricingExclusion?.chosenPrice || 15} per ${assets.pricingExclusion?.unit || 'business'} / ${assets.pricingExclusion?.billingPeriod || 'month'}. Confirm the offer details before adding pricing to the website.`}
              </p>
            </div>
            <Link
              href={assets.pricingExclusion?.actionRoute || '/dashboard/creator/phase-4/pricing'}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0 flex items-center gap-1"
            >
              <span>{assets.pricingExclusion?.actionLabel || 'Review pricing details →'}</span>
            </Link>
          </div>

          {/* Proof Exclusion Card */}
          <div className="bg-muted/20 border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading font-semibold text-foreground">
                  Testimonials and customer proof
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                  Proof Needed
                </span>
              </div>
              <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                {assets.proofExclusion?.reason ||
                  'No supporting evidence has been added, so this section is not included.'}
              </p>
            </div>
            <Link
              href={assets.proofExclusion?.actionRoute || '/dashboard/creator/phase-3/evidence'}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0 flex items-center gap-1"
            >
              <span>{assets.proofExclusion?.actionLabel || 'Review proof →'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION 6: FOOTER ACTIONS & PROGRESSION */}
      {/* ------------------------------------------------------------------------- */}
      <footer className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <Link
          href={`/dashboard/creator/phase-4/gtm${ideaId ? `?ideaId=${ideaId}` : ''}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Launch Strategy</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-xs font-sans text-muted-foreground">
            Any unfinished items will be included in your readiness review.
          </span>
          <Link
            href={`/dashboard/creator/phase-4${ideaId ? `?ideaId=${ideaId}` : ''}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans font-medium text-xs hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span>Continue to Construction Readiness</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </footer>

      {/* ------------------------------------------------------------------------- */}
      {/* FULLSCREEN PREVIEW MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {isFullscreenPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm font-heading font-semibold text-foreground">
                {brandName || projectName} · Launch Preview
              </span>
            </div>
            <button
              onClick={() => setIsFullscreenPreviewOpen(false)}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full bg-card border border-border rounded-xl p-8 space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-border">
              <div className="flex items-center gap-2.5">
                {resolvedLogoUrl ? (
                  <img
                    src={resolvedLogoUrl}
                    alt={brandName || projectName}
                    className="h-8 w-auto max-w-[150px] object-contain"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs"
                    style={{ backgroundColor: brandPrimary }}
                  >
                    {(brandName || projectName || 'M').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span
                  className="font-bold text-lg text-foreground tracking-tight"
                  style={{ fontFamily: `'${displayFont}', sans-serif`, fontWeight: headingWeight }}
                >
                  {brandName || projectName}
                </span>
              </div>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                style={{
                  borderColor: `${brandPrimary}40`,
                  color: brandPrimary,
                  backgroundColor: `${brandPrimary}15`,
                }}
              >
                In preparation
              </span>
            </div>

            <div className="text-center space-y-4 max-w-2xl mx-auto pt-6">
              <span
                className="text-xs font-mono uppercase tracking-widest font-semibold"
                style={{ color: brandPrimary }}
              >
                {assets.conceptBadge}
              </span>
              <h1
                className="text-3xl sm:text-4xl font-bold text-foreground"
                style={{ fontFamily: `'${displayFont}', sans-serif`, fontWeight: headingWeight }}
              >
                {headline}
              </h1>
              <p
                className="text-sm sm:text-base text-muted-foreground leading-relaxed"
                style={{ fontFamily: `'${textFont}', sans-serif`, fontWeight: bodyWeight }}
              >
                {description}
              </p>
              <div className="pt-2">
                <button
                  disabled
                  className="px-6 py-2.5 rounded-lg text-white font-medium text-sm inline-flex items-center gap-2 cursor-not-allowed opacity-95 shadow-sm"
                  style={{ backgroundColor: brandPrimary }}
                >
                  <span>{buttonLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-8 space-y-4">
              <h3
                className="text-lg font-semibold text-foreground"
                style={{ fontFamily: `'${displayFont}', sans-serif` }}
              >
                {problemEyebrow}
              </h3>
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                style={{ fontFamily: `'${textFont}', sans-serif` }}
              >
                {problemStatement}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
