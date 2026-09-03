'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

type RoleKey = 'Creator' | 'Investor' | 'Entrepreneur' | 'Service Provider';

interface RoleComparison {
  withoutList: string[];
  withList: string[];
  withoutNodes: string[];
  withNodes: string[];
}

const COMPARISONS: Record<RoleKey, RoleComparison> = {
  Investor: {
    withoutList: [
      'Decks that never open beyond page three',
      "No way to verify a founder's claims",
      'Cold intros through your own network only',
      'Data shared over email, no access control',
      "Weeks of back-and-forth before you know if it's worth it",
    ],
    withList: [
      'Every profile arrives with a plan, forecast and score',
      'Documents verified before you ever see them',
      'NDA-gated data room, every access logged',
      'Curated introductions, not a cold inbox',
      'You start at diligence, not at triage',
    ],
    withoutNodes: ['generic intro', 'Cold_deck-v9.pdf', '0% Verified', '6 weeks', 'LinkedIn DM', 'Unverified claims', 'e-mail data room'],
    withNodes: ['Readiness Score', 'Verified Profile', 'Data Room NDA', 'Curated Intro', 'Deal Pipeline'],
  },
  Creator: {
    withoutList: [
      'Ideas trapped in scattered notes and random docs',
      'No structured business plan or market forecast',
      'Legal paperwork postponed until problems arise',
      'No clear signal of when an idea is ready',
      'Vulnerability of sharing uncredited concept IP',
    ],
    withList: [
      '6 structured phases transforming ideas into proof',
      'AI-generated business plan & financial forecast',
      'Built-in NDA generation and IP assignment',
      'Objective 100-point readiness progression score',
      'Sell IP in marketplace or auto-level up to Founder',
    ],
    withoutNodes: ['random notes', 'unclear valuation', '0% protected', 'no structure', 'unanswered emails'],
    withNodes: ['Phase 1-6 Plan', 'AI Financial Model', 'IP Protection', 'Marketplace Listing', 'Level Up'],
  },
  Entrepreneur: {
    withoutList: [
      'Juggling multiple fragmented tools and spreadsheets',
      'Cap table mess created during early informal grants',
      'Scrambling to assemble data rooms during funding',
      'Unvetted contractors slowing down critical phases',
      'Re-explaining startup context to every new lawyer or designer',
    ],
    withList: [
      'Single unified company authority from Day 1',
      'Automated equity grants & canonical Cap Table',
      'Phase 6 NDA-gated data rooms with audit logs',
      'Vetted service providers auto-briefed from current phase',
      'Deal counter-proposals bind directly to Cap Table on close',
    ],
    withoutNodes: ['messy cap table', 'broken spreadsheets', 'unvetted freelancers', 'email data rooms'],
    withNodes: ['Canonical Cap Table', 'NDA Data Room', 'Deal Negotiation', 'Verified Providers', 'Investor Match'],
  },
  'Service Provider': {
    withoutList: [
      'Vague project scopes and shifting founder goals',
      'Chasing unpaid invoices and delayed milestone approvals',
      'Unqualified leads without budgets or clear plans',
      'Endless discovery calls before establishing price',
      'No formal escrow protections on deliverables',
    ],
    withList: [
      'Auto-scoped briefs matching the founder’s exact phase',
      'Guaranteed milestone payment locked before work begins',
      'Pre-qualified founders with structured business plans',
      'Tiered package catalog and custom counter-offers',
      'Automated workroom delivery, reviews, and verified badges',
    ],
    withoutNodes: ['scope creep', 'unpaid invoices', 'vague briefs', 'unfunded clients'],
    withNodes: ['Locked Scope', 'Escrow Workroom', 'Verified Reviews', 'Direct Order Flow', 'Phase Matching'],
  },
};

export default function FigmaBeforeAfter() {
  const [activeRole, setActiveRole] = useState<RoleKey>('Investor');
  const current = COMPARISONS[activeRole];

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)] overflow-hidden">
      <div className="w-full max-w-[1280px] flex flex-col items-center gap-10 sm:gap-12">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 max-w-[760px]">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            Before &amp; After
          </span>
          <h2 className="text-[30px] sm:text-[40px] lg:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            Without Mondial &amp; With Mondial
          </h2>
          <p className="text-[14px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            Same idea, same ambition — just without a dozen disconnected tools standing between you
            and a signed deal. Same story for all profiles.
          </p>
        </div>

        {/* Interactive Role Tabs */}
        <div className="flex items-center p-1.5 gap-1 bg-[#F1F1F2] rounded-full border border-[rgba(0,0,0,0.06)] overflow-x-auto max-w-full no-scrollbar">
          {(['Creator', 'Investor', 'Entrepreneur', 'Service Provider'] as RoleKey[]).map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-4 sm:px-5 py-2 rounded-full text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap ${
                activeRole === role
                  ? 'bg-[#3C61DD] text-white shadow-sm'
                  : 'text-[#5E5E5E] hover:text-[#070707]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Dual Radar / Visual Graphic Comparison */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Card Left: Without Mondial */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-6 sm:gap-8 min-h-[420px] sm:min-h-[440px]">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-[rgba(0,0,0,0.08)] text-[12px] font-medium text-[#5E5E5E]">
                Without Mondial
              </span>
            </div>

            {/* Scattered Graphic Simulation with responsive scale */}
            <div className="relative w-full h-[200px] sm:h-[220px] flex items-center justify-center overflow-hidden">
              <div className="relative w-[300px] h-[200px] sm:w-[340px] sm:h-[220px] flex items-center justify-center scale-[0.85] sm:scale-100 origin-center">
                <div className="absolute inset-0 border border-dashed border-red-200 rounded-full scale-90" />
                <div className="absolute inset-0 border border-dashed border-red-100 rounded-full scale-60" />
                <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[11px] font-bold text-red-600 shadow-sm z-10">
                  Fragmented
                </div>
                {current.withoutNodes.map((node, i) => {
                  const angle = (i / current.withoutNodes.length) * 2 * Math.PI;
                  const x = Math.cos(angle) * 85;
                  const y = Math.sin(angle) * 65;
                  return (
                    <div
                      key={node}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-white border border-red-200 text-[9px] sm:text-[10px] font-medium text-red-600 shadow-sm whitespace-nowrap"
                    >
                      {node}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <span className="text-[12px] font-semibold text-red-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Without Mondial
              </span>
              <ul className="flex flex-col gap-2">
                {current.withoutList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[12px] sm:text-[13px] text-[#5E5E5E]">
                    <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <X size={10} strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Card Right: With Mondial */}
          <div className="bg-[#F9F9FA] border border-[#3C61DD]/20 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-6 sm:gap-8 min-h-[420px] sm:min-h-[440px] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#3C61DD] text-white text-[12px] font-medium">
                With Mondial
              </span>
            </div>

            {/* Cohesive Graphic Simulation with responsive scale */}
            <div className="relative w-full h-[200px] sm:h-[220px] flex items-center justify-center overflow-hidden">
              <div className="relative w-[300px] h-[200px] sm:w-[340px] sm:h-[220px] flex items-center justify-center scale-[0.85] sm:scale-100 origin-center">
                <div className="absolute inset-0 border border-[#3C61DD]/20 rounded-full scale-90" />
                <div className="absolute inset-0 border border-[#3C61DD]/10 rounded-full scale-60" />
                <div className="w-16 h-16 rounded-full bg-[#3C61DD] flex items-center justify-center shadow-md z-10">
                  <span className="font-heading font-bold text-white text-[13px] sm:text-[14px]">Mondial</span>
                </div>
                {current.withNodes.map((node, i) => {
                  const angle = (i / current.withNodes.length) * 2 * Math.PI;
                  const x = Math.cos(angle) * 95;
                  const y = Math.sin(angle) * 75;
                  return (
                    <div
                      key={node}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-white border border-[#3C61DD]/30 text-[9px] sm:text-[10px] font-semibold text-[#3C61DD] shadow-sm whitespace-nowrap"
                    >
                      {node}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <span className="text-[12px] font-semibold text-[#00C896] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00C896]" />
                With Mondial
              </span>
              <ul className="flex flex-col gap-2">
                {current.withList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[12px] sm:text-[13px] text-[#070707]">
                    <div className="w-4 h-4 rounded-full bg-[#00C896]/15 text-[#00A854] flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
