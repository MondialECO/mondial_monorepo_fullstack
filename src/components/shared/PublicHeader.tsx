'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Menu,
  X,
  Lightbulb,
  ShieldCheck,
  FileText,
  Palette,
  Building2,
  Wallet,
  Coins,
  UserCheck,
  Globe,
  Briefcase,
  TrendingUp,
  Compass,
  FileCheck2,
  BarChart3,
  Search,
} from 'lucide-react';

export type RoleKey = 'creators' | 'entrepreneurs' | 'providers' | 'investors';

interface CapabilityCard {
  title: string;
  desc: string;
  ctaText: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface JourneyStep {
  number: string;
  title: string;
  active?: boolean;
}

interface RoleMegaMenuData {
  key: RoleKey;
  label: string;
  navWidth: number; // For pointer alignment
  navOffset: number; // Offset from left of menu container
  publicRoute: string;
  cards: [CapabilityCard, CapabilityCard, CapabilityCard, CapabilityCard];
  journey: {
    tag: string;
    title: string;
    desc: string;
    steps: JourneyStep[];
    ctaText: string;
  };
}

export const ROLE_MEGA_MENUS: Record<RoleKey, RoleMegaMenuData> = {
  creators: {
    key: 'creators',
    label: 'Creators',
    navWidth: 92,
    navOffset: 80,
    publicRoute: '/for-creators',
    cards: [
      {
        title: 'Creator Path',
        desc: 'Explore the journey from idea to project, deciding to sell, find a co-founder, or build.',
        ctaText: '6 Phases Journey',
        href: '/for-creators',
        icon: Lightbulb,
      },
      {
        title: 'Identity & Verification',
        desc: 'Create a trusted Creator identity before your project becomes visible or moves deeper into the ecosystem.',
        ctaText: 'Phase 01',
        href: '/for-creators/identity-verification',
        icon: ShieldCheck,
      },
      {
        title: 'Project Identity & Concept',
        desc: 'Turn a rough idea into a clear project identity, problem, solution, target customer and structured concept.',
        ctaText: 'Project Identity',
        href: '/for-creators/project-identity-concept',
        icon: FileText,
      },
      {
        title: 'Positioning & Branding',
        desc: 'Define how the project should be understood, positioned and presented through a coherent brand direction.',
        ctaText: 'Projection Positioning',
        href: '/for-creators/positioning-branding',
        icon: Palette,
      },
    ],
    journey: {
      tag: 'Creator Journey',
      title: 'From idea to your next move',
      desc: 'Turn professional capability into a structured service, relevant opportunity, completed work and stronger reputation.',
      steps: [
        { number: '01', title: 'Verify' },
        { number: '02', title: 'Define' },
        { number: '03', title: 'Validation' },
        { number: '04', title: 'Proposal' },
        { number: '05', title: 'Prepare' },
        { number: '06', title: 'License or Build', active: true },
        { number: '07', title: 'Level Up' },
      ],
      ctaText: 'Explore Creator Journey',
    },
  },
  entrepreneurs: {
    key: 'entrepreneurs',
    label: 'Entrepreneurs',
    navWidth: 131,
    navOffset: 195,
    publicRoute: '/for-entrepreneurs',
    cards: [
      {
        title: 'Company & Verification',
        desc: 'Establish the company identity, representatives, registration context & trusted business foundation.',
        ctaText: 'Company Foundation',
        href: '/for-entrepreneurs',
        icon: ShieldCheck,
      },
      {
        title: 'Build & Execute',
        desc: 'Turn business priorities into resource needs, people, milestones, execution and evidence of progress.',
        ctaText: 'Execution System',
        href: '/for-entrepreneurs/build-execute',
        icon: Building2,
      },
      {
        title: 'Equity & Readiness',
        desc: 'Understand ownership, cap table context, valuation assumptions, funding needs and readiness gaps.',
        ctaText: 'Ownership & Readiness',
        href: '/for-entrepreneurs/equity-readiness',
        icon: Wallet,
      },
      {
        title: 'Funding & Deals',
        desc: 'Move from Investor discovery into meetings, controlled access, diligence, terms and deal progression.',
        ctaText: 'Capital Journey',
        href: '/for-entrepreneurs/funding-deals',
        icon: Coins,
      },
    ],
    journey: {
      tag: 'Entrepreneur Journey',
      title: 'For company to execution and capital',
      desc: 'Build one company context that connects priorities, people, ownership, evidence and funding relationships.',
      steps: [
        { number: '01', title: 'Verify Company', active: true },
        { number: '02', title: 'Build & Execute' },
        { number: '03', title: 'Equity & Readiness' },
        { number: '04', title: 'Funding & goals' },
      ],
      ctaText: 'Explore Entrepreneur Journey',
    },
  },
  providers: {
    key: 'providers',
    label: 'Providers',
    navWidth: 95,
    navOffset: 350,
    publicRoute: '/for-service-providers',
    cards: [
      {
        title: 'Verify & Profile',
        desc: 'Build a trusted professional identity through verification, credentials, experience and reputation context.',
        ctaText: 'Professional Foundation',
        href: '/for-service-providers',
        icon: UserCheck,
      },
      {
        title: 'Service & Opportunities',
        desc: 'Structure what you offer and connect your expertise with Marketplace demand and relevant business needs.',
        ctaText: 'Discovery & Demand',
        href: '/for-service-providers/service-opportunities',
        icon: Globe,
      },
      {
        title: 'Project & Delivery',
        desc: 'Move from proposal and agreement into milestones, delivery, approval and project completion.',
        ctaText: 'Client Delivery',
        href: '/for-service-providers/project-delivery',
        icon: Briefcase,
      },
      {
        title: 'Earnings & Growth',
        desc: 'Understand payouts, invoices, reviews, reputation and how verified professional trust develops over time.',
        ctaText: 'Reputation & Growth',
        href: '/for-service-providers/earnings-growth',
        icon: TrendingUp,
      },
    ],
    journey: {
      tag: 'Provider Journey',
      title: 'From expertise to trusted delivery.',
      desc: 'Turn professional capability into a structured service, relevant opportunity, completed work and stronger reputation.',
      steps: [
        { number: '01', title: 'Verify', active: true },
        { number: '02', title: 'Publish A Service or Business Need' },
        { number: '03', title: 'Find Opportunity' },
        { number: '04', title: 'Proposal' },
        { number: '05', title: 'Agreement' },
        { number: '06', title: 'Deliver' },
        { number: '07', title: 'Get Paid' },
        { number: '08', title: 'Build Reputation' },
      ],
      ctaText: 'Explore Provider Journey',
    },
  },
  investors: {
    key: 'investors',
    label: 'Investors',
    navWidth: 94,
    navOffset: 470,
    publicRoute: '/for-investors',
    cards: [
      {
        title: 'Investor Profile & Thesis',
        desc: 'Identify investor type, financial context, sectors, stages, geographies, and ticket sizes.',
        ctaText: 'Investment Foundation',
        href: '/for-investors',
        icon: UserCheck,
      },
      {
        title: 'Discover & Match',
        desc: 'Discover structured companies and opportunities aligned with your defined investment thesis.',
        ctaText: 'Phase 01',
        href: '/for-investors/discover-match',
        icon: Compass,
      },
      {
        title: 'Diligence & Invest',
        desc: 'Move from interest into controlled access, Data Room review, diligence, terms and investment execution.',
        ctaText: 'Project Identity',
        href: '/for-investors/diligence-invest',
        icon: Search,
      },
      {
        title: 'Pipeline & Portfolio',
        desc: 'Track opportunities from first review through decision and continue the relationship after investment.',
        ctaText: 'Projection Positioning',
        href: '/for-investors/pipeline-portfolio',
        icon: BarChart3,
      },
    ],
    journey: {
      tag: 'Investor Journey',
      title: 'From thesis to ownership',
      desc: 'Define what fits, discover relevant opportunities, review evidence and continue the relationship beyond the transaction.',
      steps: [
        { number: '01', title: 'Prove Money' },
        { number: '02', title: 'Define Thesis' },
        { number: '03', title: 'Find Deal', active: true },
        { number: '04', title: 'Data Room' },
        { number: '05', title: 'Diligence' },
        { number: '06', title: 'Term Sheet' },
        { number: '07', title: 'Pipeline & Portfolio' },
      ],
      ctaText: 'Explore Investor Journey',
    },
  },
};

export default function PublicHeader() {
  const [activeRole, setActiveRole] = useState<RoleKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedRole, setMobileExpandedRole] = useState<RoleKey | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);

  // Clear timer helper
  const clearTimer = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Open with immediate transition
  const handleRoleMouseEnter = (role: RoleKey) => {
    clearTimer();
    setActiveRole(role);
  };

  // Close with slight delay for smooth hover traversal
  const handleRoleMouseLeave = () => {
    clearTimer();
    closeTimeoutRef.current = setTimeout(() => {
      setActiveRole(null);
    }, 150);
  };

  const handleToggleRoleClick = (role: RoleKey) => {
    setActiveRole((prev) => (prev === role ? null : role));
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveRole(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentMegaData = activeRole ? ROLE_MEGA_MENUS[activeRole] : null;

  return (
    <header
      ref={headerContainerRef}
      className="w-full fixed top-4 sm:top-6 left-0 z-50 flex flex-col items-center px-3 sm:px-4"
      onMouseLeave={handleRoleMouseLeave}
      onMouseEnter={clearTimer}
    >
      {/* ================= MAIN HEADER BAR (1280px Max, 64px Height) ================= */}
      <div
        className="w-full max-w-[1280px] h-[64px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] rounded-[16px] px-3 sm:px-5 flex items-center justify-between shadow-[0_0_44px_rgba(0,0,0,0.06)] relative z-20 backdrop-blur-md"
        data-testid="public-header-bar"
      >
        {/* Left: Logo Mark Container (40x40px, 12px Radius, White BG) */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-[12px] bg-white border border-[rgba(0,0,0,0.06)] shadow-sm flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
            aria-label="Mondial.eco Home"
          >
            <div className="relative w-[27px] h-[27px]">
              <Image
                src="/brand-logo-footer.png"
                alt="Mondial Logo"
                width={27}
                height={27}
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Logo Text for small screens or mobile header */}
          <Link href="/" className="lg:hidden font-heading font-bold text-[17px] text-[#070707] tracking-tight">
            Mondial.eco
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 h-full" aria-label="Main Navigation">
          {/* Role Mega Menu Triggers */}
          {(['creators', 'entrepreneurs', 'providers', 'investors'] as RoleKey[]).map((roleKey) => {
            const roleData = ROLE_MEGA_MENUS[roleKey];
            const isOpen = activeRole === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => handleToggleRoleClick(roleKey)}
                onMouseEnter={() => handleRoleMouseEnter(roleKey)}
                onFocus={() => handleRoleMouseEnter(roleKey)}
                className={`h-full inline-flex items-center gap-1.5 text-[14px] leading-[20px] font-sans transition-colors cursor-pointer focus:outline-none ${isOpen
                  ? 'text-[#3C61DD] font-semibold'
                  : 'text-[#070707] font-medium hover:text-[#3C61DD]'
                  }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                <span>{roleData.label}</span>
                {isOpen ? (
                  <ChevronUp size={14} className="text-[#3C61DD] stroke-[2.5]" />
                ) : (
                  <ChevronDown size={14} className="text-[#5E5E5E] stroke-[2]" />
                )}
              </button>
            );
          })}

          {/* Direct Nav Links */}
          <Link
            href="/mondial-marketplace"
            onMouseEnter={() => setActiveRole(null)}
            className="text-[14px] leading-[20px] font-medium font-sans text-[#070707] hover:text-[#3C61DD] transition-colors"
          >
            Marketplace
          </Link>

          <Link
            href="/pricing"
            onMouseEnter={() => setActiveRole(null)}
            className="text-[14px] leading-[20px] font-medium font-sans text-[#070707] hover:text-[#3C61DD] transition-colors"
          >
            Pricing
          </Link>

          {/* <div
            className="relative inline-flex items-center gap-1 text-[14px] leading-[20px] font-medium font-sans text-[#070707] cursor-pointer hover:text-[#3C61DD] transition-colors"
            onMouseEnter={() => setActiveRole(null)}
          >
            <Link href="/#faq">Resources</Link>
            <ChevronDown size={14} className="text-[#5E5E5E]" />
          </div> */}
        </nav>

        {/* Right: Auth Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-[14px] leading-[20px] font-semibold text-[#070707] hover:text-[#3C61DD] transition-colors"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="h-[40px] px-4 py-2.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[13px] leading-[20px] rounded-[8px] transition-colors shadow-sm inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/40"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="lg:hidden p-2 rounded-[8px] hover:bg-[rgba(0,0,0,0.05)] text-[#070707] transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ================= DESKTOP MEGA MENU DROPDOWN (1024px Max, 8px Below Header) ================= */}
      {activeRole && currentMegaData && (
        <div
          className="hidden lg:block w-[1024px] mt-2 bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] rounded-[20px] p-[28px_32px] shadow-[0_0_22px_rgba(0,0,0,0.06)] animate-in fade-in slide-in-from-top-2 duration-150 relative z-30"
          onMouseEnter={clearTimer}
          onMouseLeave={handleRoleMouseLeave}
          data-testid={`mega-menu-${activeRole}`}
        >
          {/* Polygon Pointer Triangle */}
          <div
            className="absolute -top-[10px] w-5 h-5 bg-[#F9F9FA] border-l border-t border-[rgba(0,0,0,0.06)] rotate-45 transition-all duration-200"
            style={{
              left: `${currentMegaData.navOffset + currentMegaData.navWidth / 2 - 10}px`,
            }}
          />

          <div className="w-full flex justify-between items-start gap-8">
            {/* Left Side: 2x2 Capability Cards Grid (654px) */}
            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6">
              {currentMegaData.cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between gap-3 p-3 rounded-[12px] hover:bg-white/60 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] shadow-sm flex items-center justify-center text-[#3C61DD] shrink-0 mt-0.5">
                        <Icon size={18} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-heading font-semibold text-[17px] sm:text-[18px] text-[#070707] leading-snug group-hover:text-[#3C61DD] transition-colors">
                          {card.title}
                        </h4>
                        <p className="text-[13px] sm:text-[14px] leading-[20px] text-[#5E5E5E]">
                          {card.desc}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={card.href}
                      onClick={() => setActiveRole(null)}
                      className="text-[14px] font-semibold text-[#3C61DD] hover:underline inline-flex items-center gap-1 self-start ml-11"
                    >
                      <span>{card.ctaText}</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Right Side: Featured Journey Card (280px) */}
            <div className="w-[280px] bg-white rounded-[16px] border border-[rgba(0,0,0,0.06)] p-5 flex flex-col justify-between gap-5 shadow-sm">
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#3C61DD] uppercase tracking-wider">
                  {currentMegaData.journey.tag}
                </span>
                <h4 className="font-heading font-semibold text-[17px] text-[#070707] leading-snug">
                  {currentMegaData.journey.title}
                </h4>
                <p className="text-[13px] leading-[18px] text-[#5E5E5E]">
                  {currentMegaData.journey.desc}
                </p>
              </div>

              {/* Step Timeline */}
              <div className="relative flex flex-col gap-2.5 py-1">
                <div className="absolute left-[4px] top-[6px] bottom-[6px] w-[1px] bg-[rgba(0,0,0,0.08)]" />
                {currentMegaData.journey.steps.map((st) => (
                  <div key={st.number} className="flex items-center gap-2.5 relative z-10">
                    <div
                      className={`w-[9px] h-[9px] rounded-full shrink-0 border ${st.active
                        ? 'bg-[#3C61DD] border-[#3C61DD]'
                        : 'bg-[#F9F9FA] border-[#8A8B8F]'
                        }`}
                    />
                    <span
                      className={`text-[12px] ${st.active ? 'font-semibold text-[#3C61DD]' : 'text-[#5E5E5E]'
                        }`}
                    >
                      {st.number} {st.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Journey CTA */}
              <Link
                href={currentMegaData.publicRoute}
                onClick={() => setActiveRole(null)}
                className="text-[13px] font-semibold text-[#3C61DD] hover:underline inline-flex items-center gap-1.5 pt-2 border-t border-[rgba(0,0,0,0.06)]"
              >
                <span>{currentMegaData.journey.ctaText}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE / TABLET ACCORDION DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full max-w-[1280px] mt-2 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 shadow-lg flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
          {/* Role Accordion List */}
          <div className="flex flex-col divide-y divide-[rgba(0,0,0,0.06)]">
            {(['creators', 'entrepreneurs', 'providers', 'investors'] as RoleKey[]).map((roleKey) => {
              const roleData = ROLE_MEGA_MENUS[roleKey];
              const isExpanded = mobileExpandedRole === roleKey;
              return (
                <div key={roleKey} className="py-2.5 flex flex-col">
                  <button
                    onClick={() => setMobileExpandedRole(isExpanded ? null : roleKey)}
                    className="flex items-center justify-between w-full py-1 text-[15px] font-semibold text-[#070707]"
                  >
                    <span>{roleData.label}</span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-[#3C61DD]" />
                    ) : (
                      <ChevronDown size={16} className="text-[#5E5E5E]" />
                    )}
                  </button>

                  {/* Expanded Capability Cards on Mobile */}
                  {isExpanded && (
                    <div className="flex flex-col gap-3 pt-3 pl-2">
                      {roleData.cards.map((card, idx) => (
                        <Link
                          key={idx}
                          href={card.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex flex-col gap-0.5 p-2 rounded-[8px] bg-white border border-[rgba(0,0,0,0.05)]"
                        >
                          <span className="text-[13px] font-semibold text-[#070707]">
                            {card.title}
                          </span>
                          <span className="text-[11px] text-[#5E5E5E]">{card.desc}</span>
                        </Link>
                      ))}

                      <Link
                        href={roleData.publicRoute}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[13px] font-semibold text-[#3C61DD] inline-flex items-center gap-1 pt-1"
                      >
                        <span>{roleData.journey.ctaText}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Standard Navigation Links on Mobile */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.08)]">
            <Link
              href="/marketplace/services"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-[14px] font-medium text-[#070707]"
            >
              Marketplace
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-[14px] font-medium text-[#070707]"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-[14px] font-medium text-[#070707]"
            >
              Resources
            </Link>
          </div>

          {/* Mobile Auth Buttons */}
          <div className="flex flex-col gap-2 pt-3 border-t border-[rgba(0,0,0,0.08)]">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-[40px] rounded-[8px] border border-[rgba(0,0,0,0.1)] text-[#070707] text-[14px] font-semibold hover:bg-[rgba(0,0,0,0.04)] transition-colors flex items-center justify-center bg-white shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-[40px] rounded-[8px] bg-[#3C61DD] hover:bg-[#3252BF] text-white text-[14px] font-semibold transition-colors flex items-center justify-center shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
