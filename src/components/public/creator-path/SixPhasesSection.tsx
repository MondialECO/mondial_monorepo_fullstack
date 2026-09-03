'use client';

import { CheckCircle2 } from 'lucide-react';

interface PhaseCardData {
  num: string;
  badge: string;
  badgeColor: 'green' | 'blue' | 'neutral';
  title: string;
  subtitle: string;
  bullets: string[];
}

const PHASES: PhaseCardData[] = [
  {
    num: '01',
    badge: 'Verified Creator',
    badgeColor: 'green',
    title: 'IDENTITY & VERIFICATION',
    subtitle: 'Verified Creator Profile',
    bullets: ['KYC/KYB Verification', 'Credential & Profile Review'],
  },
  {
    num: '02',
    badge: 'Structured Project Identity',
    badgeColor: 'blue',
    title: 'PROJECT IDENTITY & BRANDING',
    subtitle: 'Structured Project Identity',
    bullets: ['Project Name & Concept', 'Sector Classification', 'Problem & Solution Fit'],
  },
  {
    num: '03',
    badge: 'Validated Business Logic',
    badgeColor: 'neutral',
    title: 'PROJECT INTELLIGENCE',
    subtitle: 'Validated Business Logic',
    bullets: ['AI Business Plan Generation', 'Market Intelligence & Sources', 'Dynamic Financial Forecast'],
  },
  {
    num: '04',
    badge: 'Defined Resource Map',
    badgeColor: 'green',
    title: 'OFFER & RESOURCE SETUP',
    subtitle: 'Defined Resource Map',
    bullets: ['Resource & Capability Needs', 'Skills Gaps Assessment', 'Offer & Deal Package Setup'],
  },
  {
    num: '05',
    badge: 'Strategic Path Decision',
    badgeColor: 'blue',
    title: 'LICENSE OR BUILD',
    subtitle: 'Strategic Path Decision',
    bullets: ['Full Buyout Exit Path', 'Co-founder / Equity Matching', 'Build Yourself Direct Route'],
  },
  {
    num: '06',
    badge: 'Verified Entrepreneur Status',
    badgeColor: 'green',
    title: 'VERIFIED ENTREPRENEUR LEVEL UP',
    subtitle: 'Verified Entrepreneur Status',
    bullets: ['Cap Table & Ownership Setup', 'Investor Readiness Score', 'Diligence Data Room Unlocked'],
  },
];

export default function SixPhasesSection() {
  return (
    <section
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-12">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[720px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            WHY THE CREATOR PATH EXISTS
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Six phases. One project getting stronger.
          </h2>
        </div>

        {/* 6 Phases Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PHASES.map((p) => (
            <div
              key={p.num}
              className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 flex flex-col justify-between gap-5 transition-all hover:shadow-md hover:border-[#3C61DD]/30 group"
            >
              <div className="flex flex-col gap-4">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-8 rounded-[8px] bg-[#F1F5FF] text-[#3C61DD] font-heading font-extrabold text-[13px] flex items-center justify-center">
                    {p.num}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      p.badgeColor === 'green'
                        ? 'bg-[#00C896]/15 text-[#00A854]'
                        : p.badgeColor === 'blue'
                        ? 'bg-[#F1F5FF] text-[#3C61DD]'
                        : 'bg-white border border-[rgba(0,0,0,0.08)] text-[#3E3E3E]'
                    }`}
                  >
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>{p.badge}</span>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="flex flex-col gap-1 pt-1">
                  <h3 className="font-heading font-bold text-[16px] text-[#070707] tracking-tight group-hover:text-[#3C61DD] transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[13px] text-[#5E5E5E]">{p.subtitle}</p>
                </div>

                {/* Bullet List */}
                <ul className="flex flex-col gap-1.5 pt-2 border-t border-[rgba(0,0,0,0.05)] text-[12px] text-[#5E5E5E]">
                  {p.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]/60 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Phase Summary Bar */}
        <div className="w-full bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-4 sm:p-5 flex items-center justify-around flex-wrap gap-4 text-center">
          <div className="flex items-center gap-2 text-[13px] sm:text-[14px] font-semibold text-[#070707]">
            <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
            <span>One Project</span>
          </div>
          <div className="hidden sm:block w-[1px] h-4 bg-[rgba(0,0,0,0.1)]" />
          <div className="flex items-center gap-2 text-[13px] sm:text-[14px] font-semibold text-[#070707]">
            <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
            <span>Six Phases</span>
          </div>
          <div className="hidden sm:block w-[1px] h-4 bg-[rgba(0,0,0,0.1)]" />
          <div className="flex items-center gap-2 text-[13px] sm:text-[14px] font-semibold text-[#070707]">
            <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
            <span>One Decision</span>
          </div>
          <div className="hidden sm:block w-[1px] h-4 bg-[rgba(0,0,0,0.1)]" />
          <div className="flex items-center gap-2 text-[13px] sm:text-[14px] font-semibold text-[#3C61DD]">
            <span className="w-2 h-2 rounded-full bg-[#00A854]" />
            <span>Next Level</span>
          </div>
        </div>
      </div>
    </section>
  );
}
