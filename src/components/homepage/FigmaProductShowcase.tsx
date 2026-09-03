'use client';

import { useState } from 'react';
import { ArrowRight, Check, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';

type RoleKey = 'Creator' | 'Investor' | 'Entrepreneur' | 'Service Provider';

export default function FigmaProductShowcase() {
  const [activeRole, setActiveRole] = useState<RoleKey>('Creator');

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#070707] text-white flex justify-center border-t border-white/10 overflow-hidden" id="product">
      <div className="w-full max-w-[1280px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 max-w-[860px]">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#6F8BFF] tracking-wide uppercase">
            Inside the product
          </span>
          <h2 className="text-[28px] sm:text-[38px] md:text-[48px] font-heading font-bold text-white leading-[1.15] sm:leading-[1.12] tracking-tight">
            Connecting creators, founders, providers and investors to take an idea from first sentence
            to signed term sheet.
          </h2>
          <p className="text-[14px] sm:text-[16px] md:text-[17px] text-white/70 leading-[1.6]">
            Not a mockup of a mockup — this is the same dashboard shape you&apos;ll actually use, for
            whichever profile you are.
          </p>
        </div>

        {/* Interactive Role Tabs */}
        <div className="flex items-center p-1.5 gap-1 bg-white/10 rounded-full border border-white/15 w-fit overflow-x-auto max-w-full no-scrollbar">
          {(['Creator', 'Investor', 'Entrepreneur', 'Service Provider'] as RoleKey[]).map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-4 sm:px-5 py-2 rounded-full text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap ${
                activeRole === role
                  ? 'bg-white text-[#070707] font-semibold shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Dynamic Showcase Grid */}
        {activeRole === 'Creator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: Turn an idea into a real business plan */}
            <div className="lg:col-span-2 bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[20px] sm:text-[22px] font-heading font-bold text-white">
                  Turn an idea into a real business plan
                </h3>
                <p className="text-[13px] sm:text-[14px] text-white/70 leading-[1.6]">
                  The AI clarifier sharpens the idea, then builds the plan and the forecast — before
                  you even touch a spreadsheet.
                </p>
                <div className="flex flex-col gap-2 text-[12px] sm:text-[13px] text-white/80 pt-2">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Guided Discovery or direct AI clarification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Zero-manual spreadsheet work</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Business plan, forecast and GTM in one flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Landing page generated from your own plan</span>
                  </div>
                </div>
              </div>

              {/* AI Snapshot Widget */}
              <div className="bg-[#1A1D26] border border-white/10 rounded-[14px] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#3C61DD]/20 border border-[#3C61DD]/40 flex items-center justify-center text-[#6F8BFF] shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] text-white/60 uppercase tracking-wider font-semibold">
                      AI Snapshot
                    </span>
                    <h4 className="text-[13px] sm:text-[14px] font-semibold text-white">Autoinvoice · FinTech SaaS</h4>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:flex items-center gap-4 sm:gap-6 text-[11px] sm:text-[12px] w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <div>
                    <span className="text-white/50 block">Market size</span>
                    <span className="font-semibold text-white">€3.4B</span>
                  </div>
                  <div>
                    <span className="text-white/50 block">Break-even</span>
                    <span className="font-semibold text-white">Month 14</span>
                  </div>
                  <div>
                    <span className="text-white/50 block">Confidence</span>
                    <span className="font-semibold text-[#00C896]">74%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Track your idea's progress sidebar */}
            <div className="bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-white/60">
                    Idea Progress
                  </span>
                  <span className="text-[12px] sm:text-[13px] font-bold text-[#6F8BFF]">4/6 phases</span>
                </div>
                <h3 className="text-[18px] sm:text-[20px] font-heading font-bold text-white">
                  Track your idea&apos;s progress
                </h3>
                <p className="text-[13px] text-white/70 leading-[1.6]">
                  One dashboard for business plan status, forecast confidence and GTM readiness —
                  updated as you complete each phase.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 bg-[#1A1D26] border border-white/10 rounded-[14px] p-4 text-[12px]">
                <div className="flex items-center justify-between text-white">
                  <span>Business plan</span>
                  <span className="text-[#00C896] font-semibold">✓</span>
                </div>
                <div className="flex items-center justify-between text-white">
                  <span>Forecast</span>
                  <span className="text-[#00C896] font-semibold">✓</span>
                </div>
                <div className="flex items-center justify-between text-white">
                  <span>Landing page</span>
                  <span className="text-[#00C896] font-semibold">✓</span>
                </div>
                <div className="flex items-center justify-between text-white/60">
                  <span>Crossroads (P5)</span>
                  <span className="text-white/40">In Progress</span>
                </div>
              </div>

              <Link
                href="/for-creators"
                className="text-[13px] font-medium text-[#6F8BFF] hover:underline inline-flex items-center gap-1.5"
              >
                Learn more <ArrowRight size={14} />
              </Link>
            </div>

            {/* Card 3: Level Up, automatically */}
            <div className="bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#00C896]/10 text-[#00C896] text-[11px] font-semibold w-fit">
                  <Zap size={13} />
                  Phase 6 · Level Up
                </div>
                <h3 className="text-[17px] sm:text-[18px] font-heading font-bold text-white">
                  Level Up, automatically
                </h3>
                <p className="text-[13px] text-white/70 leading-[1.6]">
                  Phase 6 flips your profile from Creator to Entrepreneur the moment you&apos;re ready —
                  no re-onboarding.
                </p>
              </div>
              <div className="bg-[#1A1D26] border border-white/10 rounded-[10px] p-3 text-[12px] flex items-center justify-between">
                <span className="text-white/60">Role Evolution</span>
                <span className="text-[#00C896] font-semibold">Creator → Entrepreneur</span>
              </div>
            </div>

            {/* Card 4: License it, or build it */}
            <div className="lg:col-span-2 bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6F8BFF]/10 text-[#6F8BFF] text-[11px] font-semibold w-fit">
                  Phase 5 · Crossroads
                </div>
                <h3 className="text-[17px] sm:text-[18px] font-heading font-bold text-white">
                  License it, or build it
                </h3>
                <p className="text-[13px] text-white/70 leading-[1.6]">
                  Phase 5 is the Crossroads — license the idea into the marketplace for cash, or take
                  the leap into a real company.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                <div className="bg-[#1A1D26] border border-white/10 rounded-[10px] p-3 flex items-center justify-between">
                  <span>Marketplace Push</span>
                  <span className="text-[#6F8BFF] font-semibold">AI-valued</span>
                </div>
                <div className="bg-[#1A1D26] border border-white/10 rounded-[10px] p-3 flex items-center justify-between">
                  <span>The Big Leap</span>
                  <span className="text-[#00C896] font-semibold">Legal formation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeRole === 'Entrepreneur' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[20px] sm:text-[22px] font-heading font-bold text-white">
                  Cap Table authority &amp; investor diligence ready
                </h3>
                <p className="text-[13px] sm:text-[14px] text-white/70 leading-[1.6]">
                  Every share, SAFE, convertible, and milestone grant is legally recorded. When terms
                  are agreed, the Cap Table updates automatically on close.
                </p>
                <div className="flex flex-col gap-2 text-[12px] sm:text-[13px] text-white/80 pt-2">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Single economic source of truth for equity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Phase 6 NDA-gated data rooms with instant access logs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Counter-proposals sync directly to Cap Table</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A1D26] border border-white/10 rounded-[14px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-white/50 uppercase">Company Readiness</span>
                  <div className="text-[15px] sm:text-[16px] font-bold text-white">88/100 · Diligence Passed</div>
                </div>
                <Link
                  href="/for-entrepreneurs"
                  className="text-[13px] font-medium text-[#6F8BFF] hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>

            <div className="bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-4">
              <h3 className="text-[18px] font-heading font-bold text-white">Live Deal Room</h3>
              <p className="text-[13px] text-white/70 leading-[1.6]">
                Track investor views, document downloads, NDA executions, and term sheets in real time.
              </p>
              <div className="bg-[#1A1D26] border border-white/10 rounded-[12px] p-3 text-[12px] flex flex-col gap-2">
                <div className="flex justify-between"><span>NDAs Executed</span><span className="font-semibold text-white">4</span></div>
                <div className="flex justify-between"><span>Data Room Views</span><span className="font-semibold text-white">19</span></div>
                <div className="flex justify-between"><span>Term Sheets</span><span className="font-semibold text-[#00C896]">1 Active</span></div>
              </div>
            </div>
          </div>
        )}

        {activeRole === 'Investor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[20px] sm:text-[22px] font-heading font-bold text-white">
                  Homework done before you open the deal
                </h3>
                <p className="text-[13px] sm:text-[14px] text-white/70 leading-[1.6]">
                  Every company arrives with audited phases, verified entity filings, standardized
                  forecast models, and an encrypted data room.
                </p>
                <div className="flex flex-col gap-2 text-[12px] sm:text-[13px] text-white/80 pt-2">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Instant 1-click mutual NDA execution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Side-by-side term sheet counter negotiations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Post-close portfolio tracking and cap table visibility</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A1D26] border border-white/10 rounded-[14px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-white/50 uppercase">Vetted Pipeline</span>
                  <div className="text-[15px] sm:text-[16px] font-bold text-white">12 Qualified Startups</div>
                </div>
                <Link
                  href="/for-investors"
                  className="text-[13px] font-medium text-[#6F8BFF] hover:underline"
                >
                  Explore Deals →
                </Link>
              </div>
            </div>

            <div className="bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-4">
              <h3 className="text-[18px] font-heading font-bold text-white">Deal Execution</h3>
              <p className="text-[13px] text-white/70 leading-[1.6]">
                Execute investments without off-platform email chaos. Counter terms, sign, and fund.
              </p>
              <div className="bg-[#1A1D26] border border-white/10 rounded-[12px] p-3 text-[12px] flex flex-col gap-2">
                <div className="flex justify-between"><span>Valuation Cap</span><span className="font-semibold text-white">€1.5M</span></div>
                <div className="flex justify-between"><span>Equity Stake</span><span className="font-semibold text-white">5.0%</span></div>
                <div className="flex justify-between"><span>Status</span><span className="font-semibold text-[#00C896]">Ready to Sign</span></div>
              </div>
            </div>
          </div>
        )}

        {activeRole === 'Service Provider' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[20px] sm:text-[22px] font-heading font-bold text-white">
                  Scope locked, brief verified, escrow funded
                </h3>
                <p className="text-[13px] sm:text-[14px] text-white/70 leading-[1.6]">
                  Deliver legal formation, design, MVP development, and fundraising support to
                  founders with structured budgets and verified phase milestones.
                </p>
                <div className="flex flex-col gap-2 text-[12px] sm:text-[13px] text-white/80 pt-2">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Clients arrive with defined phase requirements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Fixed milestone payments held in platform escrow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" />
                    <span>Public verified portfolio and star review badges</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A1D26] border border-white/10 rounded-[14px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-white/50 uppercase">Active Engagements</span>
                  <div className="text-[15px] sm:text-[16px] font-bold text-white">€6,400 in Escrow</div>
                </div>
                <Link
                  href="/for-service-providers"
                  className="text-[13px] font-medium text-[#6F8BFF] hover:underline"
                >
                  Apply as Provider →
                </Link>
              </div>
            </div>

            <div className="bg-[#12141A] border border-white/10 rounded-[20px] p-5 sm:p-8 flex flex-col justify-between gap-4">
              <h3 className="text-[18px] font-heading font-bold text-white">Workroom Pipeline</h3>
              <p className="text-[13px] text-white/70 leading-[1.6]">
                Direct package orders and custom proposals tracked from brief to completion.
              </p>
              <div className="bg-[#1A1D26] border border-white/10 rounded-[12px] p-3 text-[12px] flex flex-col gap-2">
                <div className="flex justify-between"><span>Active Briefs</span><span className="font-semibold text-white">3</span></div>
                <div className="flex justify-between"><span>Completed</span><span className="font-semibold text-white">14</span></div>
                <div className="flex justify-between"><span>Rating</span><span className="font-semibold text-[#00C896]">5.0 ★</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
