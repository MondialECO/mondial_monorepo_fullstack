'use client';

import { Building2, Briefcase, DollarSign, Users, Activity, Scale, ArrowRight } from 'lucide-react';

export default function EvidenceArchitectureSection() {
  const chapters = [
    {
      num: 'CHAPTER 01',
      title: 'COMPANY',
      items: ['Registration Context', 'Corporate Identity', 'Governance Context'],
      icon: Building2,
    },
    {
      num: 'CHAPTER 02',
      title: 'BUSINESS',
      items: ['Pitch Deck', 'Business Plan', 'Business Model', 'Market Context'],
      icon: Briefcase,
    },
    {
      num: 'CHAPTER 03',
      title: 'FINANCIAL',
      items: ['Historical Figures', 'Forecast', 'Cash Context', 'Funding Need', 'Assumptions'],
      icon: DollarSign,
    },
    {
      num: 'CHAPTER 04',
      title: 'OWNERSHIP',
      items: ['Cap Table', 'Founder Equity', 'Existing Investors', 'Securities Context'],
      icon: Users,
    },
    {
      num: 'CHAPTER 05',
      title: 'EXECUTION',
      items: ['Product', 'Traction', 'Milestones', 'Operating Evidence'],
      icon: Activity,
    },
    {
      num: 'CHAPTER 06',
      title: 'LEGAL & COMMERCIAL',
      items: ['Material Contracts', 'Relevant Legal Docs', 'Key Agreements'],
      icon: Scale,
    },
  ];

  const questionsFlow = [
    'WHO IS THE COMPANY?',
    'WHAT DOES IT DO?',
    'WHAT EVIDENCE EXISTS?',
    'WHO OWNS IT?',
    'WHAT OBLIGATIONS EXIST?',
    'WHAT CAPITAL IS NEEDED?',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STRUCTURED EVIDENCE ARCHITECTURE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Six structured chapters of
            <br />
            company evidence.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial organizes company records into clean, standardized chapters so Investors can evaluate every dimension with confidence.
          </p>
        </div>

        {/* Central Company Anchor */}
        <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
              ILLUSTRATIVE COMPANY:
            </span>
            <strong className="text-[#1A1B23]">NOVA SPACE SAS</strong>
            <span className="text-[#747685]">— DATA ROOM STORY</span>
          </div>
          <span className="text-[10px] font-bold text-[#747685] uppercase">
            STRUCTURED REPOSITORY
          </span>
        </div>

        {/* 6 Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.num}
                className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                      {ch.num}
                    </span>
                    <Icon size={16} className="text-[#747685]" />
                  </div>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    {ch.title}
                  </h3>

                  <div className="space-y-1.5 pt-3">
                    {ch.items.map((it) => (
                      <div key={it} className="text-[12px] text-[#444654] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-[#747685] border-t border-[rgba(0,0,0,0.04)] pt-2">
                  Verified Data Chapter
                </div>
              </div>
            );
          })}
        </div>

        {/* Diligence Questions Flow Banner */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {questionsFlow.map((q, idx) => (
            <span key={q} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                {q}
              </span>
              {idx < questionsFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A GOOD DATA ROOM REDUCES THE DISTANCE BETWEEN DOCUMENTS AND UNDERSTANDING.
          </h3>
          <p className="text-[12px] text-[#747685]">
            Access to individual documents can depend on permissions and the diligence stage.
          </p>
        </div>
      </div>
    </section>
  );
}
