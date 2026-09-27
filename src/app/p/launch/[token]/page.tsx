'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Mail,
  ExternalLink,
  Globe,
  FileText,
  Bell,
  Inbox,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { getPublicLaunchAsset } from '@/lib/api-creator-launch-assets';
import type { PublicLaunchAssetResponse } from '@/types/creator/launch-assets';
import { resolveMediaUrl } from '@/lib/brand-kit-media';

function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return { r: 15, g: 23, b: 42 };
}

function getLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isLightColor(hex: string): boolean {
  return getLuminance(hex) >= 140;
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PublicLaunchPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [asset, setAsset] = useState<PublicLaunchAssetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Share token is missing.');
      return;
    }

    async function loadPublicAsset() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicLaunchAsset(token);
        setAsset(data);
      } catch (err: any) {
        setError(err.message || 'This website snapshot could not be loaded or is no longer available.');
      } finally {
        setLoading(false);
      }
    }

    loadPublicAsset();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090A0C] text-zinc-300 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs text-zinc-400">Loading website preview...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-[#090A0C] text-zinc-300 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121316] border border-zinc-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Website Not Found</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {error || 'This public preview link may be expired, invalid, or still in preparation.'}
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
            >
              <span>Return to Mondial</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const brandStudio = asset.brandStudio;
  const rawBg = brandStudio?.backgroundColorHex || '#FFFFFF';
  const rawText = brandStudio?.textColorHex || '#0F172A';
  const rawPrimary = brandStudio?.primaryColorHex || '#1A1A24';
  const rawSecondary = brandStudio?.secondaryColorHex || '#3C61DD';
  const rawAccent = brandStudio?.accentColorHex || '#00D084';

  const isLightMode = isLightColor(rawBg);

  // Derive coherent contrast tokens
  const pageBg = rawBg;
  const headingColor = isLightMode
    ? (isLightColor(rawText) ? '#0F172A' : rawText)
    : (!isLightColor(rawText) ? '#FFFFFF' : rawText);

  const bodyColor = isLightMode ? hexToRgba(headingColor, 0.8) : hexToRgba(headingColor, 0.75);
  const mutedColor = isLightMode ? hexToRgba(headingColor, 0.55) : hexToRgba(headingColor, 0.5);

  const cardBg = isLightMode
    ? (pageBg.toUpperCase() === '#FFFFFF' ? '#F8FAFC' : hexToRgba('#FFFFFF', 0.8))
    : hexToRgba('#FFFFFF', 0.04);

  const cardBorder = isLightMode
    ? hexToRgba(headingColor, 0.1)
    : hexToRgba('#FFFFFF', 0.1);

  const sectionDivider = isLightMode
    ? hexToRgba(headingColor, 0.08)
    : hexToRgba('#FFFFFF', 0.1);

  const brandPrimary = rawPrimary;
  const brandSecondary = rawSecondary;
  const brandAccent = rawAccent;

  const btnText = isLightColor(brandPrimary) ? '#0F172A' : '#FFFFFF';
  const badgeBg = hexToRgba(brandSecondary, isLightMode ? 0.1 : 0.18);
  const badgeBorder = hexToRgba(brandSecondary, isLightMode ? 0.25 : 0.35);
  const badgeText = isLightMode
    ? (isLightColor(brandSecondary) ? '#1E293B' : brandSecondary)
    : brandSecondary;

  const displayFont = brandStudio?.displayFontFamily || 'Inter';
  const textFont = brandStudio?.textFontFamily || 'DM Sans';
  const headingWeight = brandStudio?.headingWeight || '700';
  const bodyWeight = brandStudio?.bodyWeight || '400';

  const logoUri = brandStudio?.logoLockupUri || brandStudio?.logoMarkUri || (brandStudio as any)?.logoAssetUri;
  const resolvedLogoUrl = logoUri ? resolveMediaUrl(logoUri) : '';
  const isLockup = Boolean(brandStudio?.logoLockupUri && (logoUri === brandStudio.logoLockupUri));

  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    textFont
  ).replace(/%20/g, '+')}:ital,wght@0,300..800;1,300..800&family=${encodeURIComponent(
    displayFont
  ).replace(/%20/g, '+')}:wght@300..900&display=swap`;

  const sectionsList = asset.sections || [];
  const isSectionIncluded = (key: string) => {
    const sec = sectionsList.find((s) => s.key === key);
    return sec ? sec.isIncluded : true;
  };

  const pricingSection = sectionsList.find((s) => s.key === 'pricing');
  const isPricingExplicitlyIncluded = pricingSection !== undefined
    ? pricingSection.isIncluded
    : asset.pricingExclusion?.excluded === false;

  const isPricingValidAndConfirmed = Boolean(
    asset.pricingExclusion &&
    (asset.pricingExclusion.priceStatus === 'ConfirmedPositive' || asset.pricingExclusion.priceStatus === 'ConfirmedZero') &&
    asset.pricingExclusion.chosenPrice !== null &&
    asset.pricingExclusion.chosenPrice !== undefined &&
    asset.pricingExclusion.chosenPrice >= 0
  );

  const isPricingRendered = isPricingExplicitlyIncluded && isPricingValidAndConfirmed;

  // CTA destination resolution
  const destType = asset.buttonDestinationType;
  const destVal = asset.buttonDestinationValue;
  const isCtaConfigured = asset.buttonDestinationConfigured && Boolean(destVal && destVal.trim() !== '');

  let ctaHref = '#';
  if (isCtaConfigured) {
    if (destType === 'Email') {
      ctaHref = `mailto:${destVal.trim()}`;
    } else {
      ctaHref = destVal.trim().startsWith('http') ? destVal.trim() : `https://${destVal.trim()}`;
    }
  }

  const renderIcon = (iconName?: string) => {
    const iconClass = 'w-5 h-5';
    switch (iconName?.toLowerCase()) {
      case 'mail':
        return <Mail className={iconClass} />;
      case 'file-text':
        return <FileText className={iconClass} />;
      case 'bell':
        return <Bell className={iconClass} />;
      case 'inbox':
        return <Inbox className={iconClass} />;
      case 'help-circle':
        return <HelpCircle className={iconClass} />;
      case 'sparkles':
        return <Sparkles className={iconClass} />;
      default:
        return <Layers className={iconClass} />;
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-200 antialiased"
      style={{
        backgroundColor: pageBg,
        color: bodyColor,
        fontFamily: `'${textFont}', -apple-system, BlinkMacSystemFont, sans-serif`,
        fontWeight: bodyWeight,
      }}
    >
      {/* Dynamic Google Fonts Link */}
      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}

      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* HEADER / NAVIGATION */}
        {/* ========================================================================= */}
        <header
          className="py-5 sm:py-6 flex items-center justify-between gap-4"
          style={{ borderBottom: `1px solid ${sectionDivider}` }}
        >
          <div className="flex items-center gap-3">
            {resolvedLogoUrl ? (
              <img
                src={resolvedLogoUrl}
                alt={`${asset.brandName} logo`}
                className="h-8 sm:h-9 w-auto max-w-[200px] object-contain shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-xs"
                style={{ backgroundColor: brandPrimary }}
              >
                {(asset.brandName || 'M').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Display text name alongside if not a full lockup image */}
            {!isLockup && (
              <span
                className="text-lg sm:text-xl font-bold tracking-tight"
                style={{
                  color: headingColor,
                  fontFamily: `'${displayFont}', sans-serif`,
                  fontWeight: headingWeight,
                }}
              >
                {asset.brandName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-2xs"
              style={{
                backgroundColor: badgeBg,
                borderColor: badgeBorder,
                color: badgeText,
              }}
            >
              {asset.footerNotice || 'Project in preparation'}
            </span>
          </div>
        </header>

        <main className="space-y-16 sm:space-y-24 py-12 sm:py-20">
          {/* ========================================================================= */}
          {/* SECTION A: HERO */}
          {/* ========================================================================= */}
          <section className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-block">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border"
                style={{
                  backgroundColor: badgeBg,
                  borderColor: badgeBorder,
                  color: badgeText,
                }}
              >
                {asset.conceptBadge || 'PREVIEWING CONCEPT'}
              </span>
            </div>

            <h1
              className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]"
              style={{
                color: headingColor,
                fontFamily: `'${displayFont}', sans-serif`,
                fontWeight: headingWeight,
              }}
            >
              {asset.headline || `Clearer operations for ${asset.brandName}.`}
            </h1>

            <p
              className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: bodyColor }}
            >
              {asset.description ||
                `${asset.brandName} is being prepared to provide clear milestone tracking, intake clarity, and structured client follow-through.`}
            </p>

            <div className="pt-2 flex flex-col items-center gap-3">
              {isCtaConfigured ? (
                <a
                  href={ctaHref}
                  target={destType === 'Link' ? '_blank' : undefined}
                  rel={destType === 'Link' ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 shadow-md hover:opacity-90 active:scale-[0.99]"
                  style={{
                    backgroundColor: brandPrimary,
                    color: btnText,
                  }}
                >
                  <span>{asset.buttonLabel || 'Express interest'}</span>
                  {destType === 'Email' ? <Mail className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm cursor-not-allowed opacity-80 border"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    color: mutedColor,
                  }}
                  title="Contact channel is currently in preparation."
                >
                  <span>{asset.buttonLabel || 'Express interest'}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
              )}

              <p className="text-xs" style={{ color: mutedColor }}>
                {asset.heroHelpText || 'Help shape the project by sharing how you work today.'}
              </p>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PLANNED WORKFLOW */}
          {/* ========================================================================= */}
          <section
            className="pt-10 space-y-6"
            style={{ borderTop: `1px solid ${sectionDivider}` }}
          >
            <div className="space-y-1">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: brandSecondary }}
              >
                {asset.plannedWorkflowTitle || 'PLANNED WORKFLOW'}
              </span>
              <p className="text-sm" style={{ color: mutedColor }}>
                {asset.plannedWorkflowSubtitle || 'High-level interface structure'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(asset.workflowSteps || []).map((step) => (
                <div
                  key={step.stepNumber}
                  className="rounded-xl p-5 space-y-3 transition-colors border shadow-xs"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeText,
                      }}
                    >
                      {step.stepNumber}
                    </span>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: mutedColor }}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <h3
                    className="text-base font-semibold"
                    style={{
                      color: headingColor,
                      fontFamily: `'${displayFont}', sans-serif`,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: bodyColor }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION B: PROBLEM */}
          {/* ========================================================================= */}
          {isSectionIncluded('problem') && (
            <section
              className="pt-10 space-y-4"
              style={{ borderTop: `1px solid ${sectionDivider}` }}
            >
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: brandSecondary }}
              >
                {asset.problemEyebrow || 'KEEP TRACK OF THE NEXT STEP'}
              </span>
              <h2
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{
                  color: headingColor,
                  fontFamily: `'${displayFont}', sans-serif`,
                }}
              >
                {asset.problemStatement ||
                  'When enquiries and quotations are spread across different places, it can be harder to see what needs a reply or follow-up.'}
              </h2>
              <p className="text-sm max-w-3xl leading-relaxed" style={{ color: bodyColor }}>
                {asset.operationalMomentumStatement ||
                  'Maintaining clear visibility over requests and estimates is essential to keeping client trust and timely delivery.'}
              </p>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SECTION C: PLANNED SOLUTION */}
          {/* ========================================================================= */}
          {isSectionIncluded('solution') && (
            <section
              className="pt-10 space-y-6"
              style={{ borderTop: `1px solid ${sectionDivider}` }}
            >
              <div className="space-y-1">
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{
                    color: headingColor,
                    fontFamily: `'${displayFont}', sans-serif`,
                  }}
                >
                  {asset.solutionHeader || 'What’s being planned'}
                </h2>
                <p className="text-sm" style={{ color: mutedColor }}>
                  {asset.solutionSubheader ||
                    'Straightforward tools designed strictly around routine project administration.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(asset.plannedSolutions || []).map((sol, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-5 sm:p-6 space-y-3 border shadow-xs"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeText,
                      }}
                    >
                      {renderIcon(sol.icon)}
                    </div>
                    <h3
                      className="text-base sm:text-lg font-semibold"
                      style={{
                        color: headingColor,
                        fontFamily: `'${displayFont}', sans-serif`,
                      }}
                    >
                      {sol.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: bodyColor }}>
                      {sol.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SECTION D: HOW IT WORKS */}
          {/* ========================================================================= */}
          {isSectionIncluded('how-it-works') && (
            <section
              className="pt-10 space-y-6"
              style={{ borderTop: `1px solid ${sectionDivider}` }}
            >
              <div className="space-y-1">
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{
                    color: headingColor,
                    fontFamily: `'${displayFont}', sans-serif`,
                  }}
                >
                  {asset.howItWorksHeader || 'A simpler flow for your work'}
                </h2>
                <p className="text-sm" style={{ color: mutedColor }}>
                  {asset.howItWorksSubheader || 'This describes the planned workflow.'}
                </p>
              </div>

              <div className="space-y-3">
                {(asset.workflowDetails || []).map((wf) => (
                  <div
                    key={wf.stepNumber}
                    className="rounded-xl p-5 flex items-start gap-4 border shadow-xs"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeText,
                      }}
                    >
                      {wf.stepNumber}
                    </span>
                    <div className="space-y-1">
                      <h3
                        className="text-base font-semibold"
                        style={{
                          color: headingColor,
                          fontFamily: `'${displayFont}', sans-serif`,
                        }}
                      >
                        {wf.title}
                      </h3>
                      <p className="text-xs leading-relaxed" style={{ color: bodyColor }}>
                        {wf.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* TRANSPARENT PRICING */}
          {/* ========================================================================= */}
          {isPricingRendered && asset.pricingExclusion && (
            <section
              className="pt-10 space-y-6 text-center"
              id="pricing-section"
              style={{ borderTop: `1px solid ${sectionDivider}` }}
            >
              <div className="space-y-1 max-w-xl mx-auto">
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{
                    color: headingColor,
                    fontFamily: `'${displayFont}', sans-serif`,
                  }}
                >
                  Transparent Pricing
                </h2>
                <p className="text-sm" style={{ color: mutedColor }}>
                  Clear, straightforward options designed for your workflows.
                </p>
              </div>

              <div
                className="max-w-sm mx-auto rounded-2xl p-6 sm:p-8 space-y-4 border shadow-md"
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: brandSecondary }}
                >
                  {asset.pricingExclusion.selectedOfferName || 'Standard Plan'}
                </span>
                <div
                  className="text-4xl font-extrabold flex items-baseline justify-center gap-1"
                  style={{ color: headingColor }}
                >
                  <span>
                    {asset.pricingExclusion.priceStatus === 'ConfirmedZero'
                      ? 'Free'
                      : `${asset.pricingExclusion.currency}${asset.pricingExclusion.chosenPrice ?? 0}`}
                  </span>
                  {asset.pricingExclusion.priceStatus !== 'ConfirmedZero' && (
                    <span className="text-xs font-normal" style={{ color: mutedColor }}>
                      / {asset.pricingExclusion.billingPeriod}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: bodyColor }}>
                  {asset.pricingExclusion.reason}
                </p>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SECTION E: FAQ */}
          {/* ========================================================================= */}
          {isSectionIncluded('faq') && (
            <section
              className="pt-10 space-y-6"
              style={{ borderTop: `1px solid ${sectionDivider}` }}
            >
              <div className="space-y-1">
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{
                    color: headingColor,
                    fontFamily: `'${displayFont}', sans-serif`,
                  }}
                >
                  {asset.faqHeader || 'Frequently Asked Questions'}
                </h2>
                <p className="text-sm" style={{ color: mutedColor }}>
                  {asset.faqSubheader || 'Honest answers about development status and availability.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(asset.faqs || []).map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-5 space-y-2 border shadow-xs"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                    }}
                  >
                    <h3
                      className="text-sm font-semibold"
                      style={{
                        color: headingColor,
                        fontFamily: `'${displayFont}', sans-serif`,
                      }}
                    >
                      {faq.question}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: bodyColor }}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* SECTION F: FINAL CTA */}
          {/* ========================================================================= */}
          {isSectionIncluded('final-cta') && (
            <section
              className="pt-10 text-center max-w-2xl mx-auto space-y-6"
              style={{ borderTop: `1px solid ${sectionDivider}` }}
            >
              <h2
                className="text-2xl sm:text-4xl font-bold tracking-tight"
                style={{
                  color: headingColor,
                  fontFamily: `'${displayFont}', sans-serif`,
                }}
              >
                {asset.finalCtaHeader || 'Share how you work today'}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: bodyColor }}>
                {asset.finalCtaSubheader ||
                  'Your experience can directly help shape what this project focuses on.'}
              </p>

              <div>
                {isCtaConfigured ? (
                  <a
                    href={ctaHref}
                    target={destType === 'Link' ? '_blank' : undefined}
                    rel={destType === 'Link' ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 shadow-md hover:opacity-90 active:scale-[0.99]"
                    style={{
                      backgroundColor: brandPrimary,
                      color: btnText,
                    }}
                  >
                    <span>{asset.buttonLabel || 'Express interest'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm cursor-not-allowed opacity-80 border"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      color: mutedColor,
                    }}
                  >
                    <span>{asset.buttonLabel || 'Express interest'}</span>
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </button>
                )}
              </div>
            </section>
          )}
        </main>

        {/* ========================================================================= */}
        {/* FOOTER */}
        {/* ========================================================================= */}
        <footer
          className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: `1px solid ${sectionDivider}`,
            color: mutedColor,
          }}
        >
          <div className="flex items-center gap-2.5">
            {resolvedLogoUrl ? (
              <img
                src={resolvedLogoUrl}
                alt={`${asset.brandName} logo`}
                className="h-5 sm:h-6 w-auto max-w-[140px] object-contain opacity-90 shrink-0"
              />
            ) : (
              <div
                className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] text-white"
                style={{ backgroundColor: brandPrimary }}
              >
                {(asset.brandName || 'M').charAt(0).toUpperCase()}
              </div>
            )}
            {!isLockup && (
              <span
                className="font-semibold"
                style={{
                  color: headingColor,
                  fontFamily: `'${displayFont}', sans-serif`,
                }}
              >
                {asset.brandName}
              </span>
            )}
          </div>
          <div>{asset.footerNotice || 'Project in preparation'}</div>
        </footer>
      </div>
    </div>
  );
}
