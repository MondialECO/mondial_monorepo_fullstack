'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Filter, ArrowRight, Building2, Sparkles, HelpCircle, Bookmark } from 'lucide-react';

export default function OpportunityDiscoverySection() {
  const [selectedOpportunity, setSelectedOpportunity] = useState('FLEXDESK');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const opportunities = [
    {
      id: 'FLEXDESK',
      name: 'FLEXDESK',
      fit: 'HIGH FIT',
      tag: 'FULL BUYOUT / DISCUSSION',
      category: 'Workspace Technology',
      stage: 'Structured Project',
      location: 'France',
      context: ['Business Plan', 'Market Context', 'Resource Needs'],
      access: 'ACCESS AVAILABLE',
      cta: 'Review Opportunity',
    },
    {
      id: 'LOCALHUB',
      name: 'LOCALHUB',
      fit: 'HIGH FIT',
      tag: 'CO-FOUNDER / PARTNERSHIP',
      category: 'Local Services Marketplace',
      stage: 'Validated Concept',
      location: 'Belgium',
      context: ['Project Profile', 'Evidence', 'Founder Need'],
      access: 'ACCESS AVAILABLE',
      cta: 'View Project',
    },
    {
      id: 'WORKNODE',
      name: 'WORKNODE',
      fit: 'MODERATE FIT',
      tag: 'PROJECT REVIEW',
      category: 'Future of Work',
      stage: 'Early Project',
      location: 'Netherlands',
      context: ['Concept', 'Target Customer', 'Resource Need'],
      access: 'REVIEW AVAILABLE',
      cta: 'View Summary',
    },
  ];

  return (
    <section
      id="section-02-opportunity-discovery"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            STEP 01 — DISCOVER
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#1A1B23] leading-[1.15] tracking-tight">
            Build what you have.
            <br />
            Or discover what fits next.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Continue with an existing company project or explore structured Creator opportunities based on strategic fit, readiness and company needs.
          </p>
        </div>

        {/* Discovery Workspace */}
        <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] overflow-hidden shadow-lg flex flex-col">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#E2E1EC] flex flex-wrap items-center justify-between gap-4 text-[12px]">
            <div className="flex items-center gap-3">
              <span className="font-heading font-extrabold text-[16px] text-[#1A47C3]">MONDIAL</span>
              <div className="h-4 w-[1px] bg-[#C4C5D6]" />
              <div className="flex items-center gap-1.5 text-[#444654] font-medium">
                <Building2 size={14} className="text-[#747685]" />
                <span>NOVA SPACE SAS</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[#444654]">
                Strategy: <strong>Flexible Workspace / Marketplace</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-[#E8E7F2] text-[#1A1B23] text-[10px] font-bold uppercase">
                PROJECT OPPORTUNITIES
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3.5 sm:p-4 bg-[#FAF8FF] border-b border-[#E2E1EC] flex flex-wrap items-center gap-2 sm:gap-3 text-[12px]">
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-[#747685]" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
                <span>Sector</span>
                <ChevronDown size={12} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
                <span>Stage</span>
                <ChevronDown size={12} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
                <span>Geography</span>
                <ChevronDown size={12} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
                <span>Project Type</span>
                <ChevronDown size={12} />
              </div>
            </div>

            <div className="h-5 w-[1px] bg-[#C4C5D6] hidden sm:block" />

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilter('Resource Need')}
                className={`px-3 py-1.5 rounded-[8px] font-medium transition-all ${
                  activeFilter === 'Resource Need'
                    ? 'bg-[#3C61DD] text-white'
                    : 'bg-[#EEEDF8] text-[#1A1B23] hover:bg-white'
                }`}
              >
                Resource Need
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('Full Buyout')}
                className={`px-3 py-1.5 rounded-[8px] font-medium transition-all ${
                  activeFilter === 'Full Buyout'
                    ? 'bg-[#3C61DD] text-white'
                    : 'bg-[#EEEDF8] text-[#1A1B23] hover:bg-white'
                }`}
              >
                Full Buyout
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('Co-founder / Equity')}
                className={`px-3 py-1.5 rounded-[8px] font-medium transition-all ${
                  activeFilter === 'Co-founder / Equity'
                    ? 'bg-[#3C61DD] text-white'
                    : 'bg-[#EEEDF8] text-[#1A1B23] hover:bg-white'
                }`}
              >
                Co-founder / Equity
              </button>
            </div>
          </div>

          {/* Main Layout Grid: Left List + Right Detail */}
          <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols): Existing Project + Opportunity List */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Existing Project Card */}
              <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                  <div>
                    <span className="text-[10px] font-bold text-[#747685] uppercase block">
                      MY EXISTING PROJECT
                    </span>
                    <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">NOVA SPACE</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-[6px] bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold uppercase inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#157A55]" />
                    ACTIVE COMPANY PROJECT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="flex items-center gap-1.5 text-[#444654]">
                    <CheckCircle2 size={13} className="text-[#157A55]" />
                    <span>Project Identity</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#444654]">
                    <CheckCircle2 size={13} className="text-[#157A55]" />
                    <span>Business Plan</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#444654]">
                    <CheckCircle2 size={13} className="text-[#157A55]" />
                    <span>Market Intelligence</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#444654]">
                    <CheckCircle2 size={13} className="text-[#157A55]" />
                    <span>Resource Needs</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-fit px-4 py-2 bg-[#1A1B23] hover:bg-[#3C61DD] text-white font-medium text-[12px] rounded-[8px] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Continue Execution</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Opportunities List */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-[#444654] uppercase tracking-wider text-[11px]">
                    OPPORTUNITIES FOR NOVA SPACE SAS
                  </span>
                  <span className="text-[#747685]">3 items</span>
                </div>

                {opportunities.map((opp) => {
                  const isSelected = selectedOpportunity === opp.id;
                  return (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpportunity(opp.id)}
                      className={`p-4 sm:p-5 rounded-[18px] transition-all cursor-pointer flex flex-col gap-3 ${
                        isSelected
                          ? 'bg-white border-2 border-[#3C61DD] shadow-md'
                          : 'bg-white border border-[#E2E1EC] hover:border-[#3C61DD]/40 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                            {opp.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[9px] font-bold uppercase">
                            {opp.fit}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold">
                          {opp.tag}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#444654]">
                        <span>Category: <strong>{opp.category}</strong></span>
                        <span>•</span>
                        <span>Stage: <strong>{opp.stage}</strong></span>
                        <span>•</span>
                        <span>Location: <strong>{opp.location}</strong></span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,0,0,0.04)] text-[12px]">
                        <span className="text-[10px] text-[#157A55] font-bold uppercase">
                          {opp.access}
                        </span>
                        <span className="text-[#3C61DD] font-bold text-[11px] hover:underline">
                          {opp.cta} →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (5 cols): Active Opportunity Detail Panel */}
            <div className="lg:col-span-5 bg-white border-2 border-[#3C61DD]/30 rounded-[20px] p-6 flex flex-col justify-between gap-6 shadow-md text-[13px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                  <div>
                    <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                      ACTIVE OPPORTUNITY DETAIL
                    </span>
                    <h4 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                      FLEXDESK — WHY IT MAY FIT
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold">
                    HIGH FIT
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-[12px]">
                  <div>
                    <span className="text-[10px] font-bold text-[#747685] uppercase block">
                      ADJACENT MARKET
                    </span>
                    <p className="font-semibold text-[#1A1B23]">Flexible workspace</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#747685] uppercase block">
                      CAPABILITY OVERLAP
                    </span>
                    <p className="font-semibold text-[#1A1B23]">Marketplace Operations</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#747685] uppercase block">
                      POTENTIAL VALUE
                    </span>
                    <p className="text-[#444654]">
                      Expand workspace supply or technology capability for NOVA SPACE SAS ecosystem.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#747685] uppercase">
                      OPEN QUESTIONS:
                    </span>
                    <ul className="list-disc pl-4 text-[11px] text-[#444654] space-y-1">
                      <li>Geographic overlap analysis</li>
                      <li>Technology duplication vs augmentation</li>
                      <li>Structuring acquisition value</li>
                      <li>Aligning Creator expectations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-[8px] bg-[#3C61DD] hover:bg-[#3252BF] text-white text-[12px] font-bold transition-all shadow-xs"
                >
                  Open Structured Review
                </button>
                <button
                  type="button"
                  className="w-full py-2 px-4 rounded-[8px] bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] text-[12px] font-medium transition-colors"
                >
                  Save Opportunity
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Discovery Principle Banner */}
        <div className="w-full py-5 px-6 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-bold text-[14px] sm:text-[16px] text-[#1A1B23] uppercase tracking-wide">
            DISCOVERY SURFACES POSSIBILITIES. THE ENTREPRENEUR DECIDES WHAT DESERVES REVIEW.
          </span>
        </div>
      </div>
    </section>
  );
}
