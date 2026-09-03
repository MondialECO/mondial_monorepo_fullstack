'use client';

import { Check, Info } from 'lucide-react';

export default function FigmaLegalRoadmap() {
  const phases = [
    {
      badge: 'Id',
      phaseNumber: 'PHASE 01',
      title: 'Idea & IP',
      items: [
        'NDA generation',
        'IP assignment',
        'Licensing agreements',
        'Ownership stays yours',
      ],
    },
    {
      badge: 'Co',
      phaseNumber: 'PHASE 02',
      title: 'Company',
      items: [
        'Entity type guidance',
        'Formation documents',
        'Vetted legal partners',
        'Document verification',
      ],
    },
    {
      badge: 'Eq',
      phaseNumber: 'PHASE 03',
      title: 'Equity',
      items: [
        'Founder agreements',
        'Vesting schedules',
        'ESOP pool',
        'SAFEs & convertibles',
      ],
    },
    {
      badge: 'De',
      phaseNumber: 'PHASE 04',
      title: 'The deal',
      items: [
        'Term sheets',
        'Data-room permissions',
        'Investor NDAs',
        'Deal documents',
      ],
    },
  ];

  return (
    <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]" id="legal">
      <div className="w-full max-w-[1280px] flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2.5 sm:gap-3 max-w-[800px]">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            Legal
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            Legal wired into every phase — not bolted on at the end.
          </h2>
          <p className="text-[14px] sm:text-[16px] md:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Not a referral link to a law firm. Structured document generation and vetted legal
            partners, triggered by the phase you&apos;re actually in.
          </p>
        </div>

        {/* 4 Phase Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {phases.map((p) => (
            <div
              key={p.phaseNumber}
              className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[18px] p-5 sm:p-6 flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[8px] bg-[#E8EEFF] text-[#3C61DD] font-bold text-[12px] flex items-center justify-center">
                  {p.badge}
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#8A8B8F] tracking-wider">
                  {p.phaseNumber}
                </span>
              </div>

              <h3 className="text-[17px] sm:text-[18px] font-heading font-bold text-[#070707]">
                {p.title}
              </h3>

              <ul className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.06)] text-[12px] sm:text-[13px] text-[#5E5E5E]">
                {p.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-[#00C896] shrink-0" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer Notice Banner */}
        <div className="w-full bg-[#F1F5FF] border border-[#3C61DD]/20 rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 text-[12px] sm:text-[13px] text-[#3C61DD] leading-[1.6]">
          <Info size={18} className="shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Mondial generates structured documents and connects you with vetted legal partners. It
            does not provide legal advice.
          </span>
        </div>
      </div>
    </section>
  );
}
