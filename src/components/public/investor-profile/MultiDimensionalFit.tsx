'use client';

import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

export default function MultiDimensionalFit() {
  const opportunities = [
    {
      name: 'NOVA SPACE',
      sector: 'B2B SaaS',
      stage: 'Seed',
      geo: 'France',
      round: '€700K',
      signals: ['Sector ✓', 'Stage ✓', 'Geography ✓', 'Ticket ✓'],
      result: 'STRONG FIT',
      tagColor: 'bg-[#E8F8EE] text-[#157A55] border-[#157A55]/30',
    },
    {
      name: 'PAYFLOW',
      sector: 'FinTech',
      stage: 'Seed',
      geo: 'France',
      round: '€800K',
      reason: 'Sector outside primary focus',
      result: 'PARTIAL FIT',
      tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      name: 'WORKOS',
      sector: 'B2B SaaS',
      stage: 'Series C',
      geo: 'USA',
      round: '€20M',
      reason: 'Stage, Geography, Ticket mismatch',
      result: 'LOW FIT',
      tagColor: 'bg-red-50 text-[#BA1A1A] border-red-200',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FIT IS MULTI-DIMENSIONAL
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            One match signal
            <br />
            is rarely enough.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A company may fit the sector but not the stage, geography or ticket range. Mondial should help make those differences visible.
          </p>
        </div>

        {/* Anchor Thesis + 3 Illustrative Opportunities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
          {/* Thesis Anchor */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-[#3C61DD] shadow-md flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                THESIS ANCHOR
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Horizon Capital
              </h3>

              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                <div><strong>Sector:</strong> B2B SaaS</div>
                <div><strong>Stage:</strong> Seed / Early Rev</div>
                <div><strong>Geo:</strong> France / EU</div>
                <div><strong>Ticket:</strong> €250K — €1M</div>
              </div>
            </div>
            <div className="text-[10px] text-[#747685]">Benchmark Strategy</div>
          </div>

          {/* 3 Opportunities */}
          {opportunities.map((opp) => (
            <div
              key={opp.name}
              className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-[17px] text-[#1A1B23]">{opp.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${opp.tagColor}`}>
                    {opp.result}
                  </span>
                </div>

                <div className="space-y-1 pt-2 text-[12px] text-[#444654]">
                  <div>{opp.sector} • {opp.stage}</div>
                  <div>{opp.geo} • Round: {opp.round}</div>
                  {opp.reason && <p className="text-[11px] text-[#747685] mt-1">{opp.reason}</p>}
                </div>
              </div>

              {opp.signals ? (
                <div className="flex flex-wrap gap-1 text-[10px] text-[#157A55] font-bold">
                  {opp.signals.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-[#E8F8EE]">{s}</span>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-[#747685]">Evaluated Criteria</div>
              )}
            </div>
          ))}
        </div>

        {/* Matching Principle & Formula */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <p className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            MATCHING SHOULD EXPLAIN WHY SOMETHING FITS AND WHY SOMETHING DOES NOT.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">SECTOR</span>
            <span className="text-[#3C61DD]">×</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">STAGE</span>
            <span className="text-[#3C61DD]">×</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">GEOGRAPHY</span>
            <span className="text-[#3C61DD]">×</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">TICKET</span>
            <span className="text-[#3C61DD]">=</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              DISCOVERY RELEVANCE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
