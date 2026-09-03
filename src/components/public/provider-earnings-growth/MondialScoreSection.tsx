'use client';

import { Award, CheckCircle2, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';

export default function MondialScoreSection() {
  const inputs = [
    { title: 'CLIENT SATISFACTION', weight: '40%', isNegative: false, isBonus: false },
    { title: 'ON-TIME DELIVERY', weight: '25%', isNegative: false, isBonus: false },
    { title: 'RESPONSE RATE', weight: '15%', isNegative: false, isBonus: false },
    { title: 'REPEAT CLIENT', weight: '10%', isNegative: false, isBonus: false },
    { title: 'SKILLS TEST', weight: '10%', isNegative: false, isBonus: false },
    { title: 'DISPUTE IMPACT', weight: '−10%', isNegative: true, isBonus: false },
    { title: 'ECOSYSTEM CONTRIBUTION', weight: 'BONUS', isNegative: false, isBonus: true },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            MORE THAN STAR RATINGS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Reputation is built
            <br />
            from behavior over time.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            The Mondial Score combines multiple platform signals so reputation reflects more than one project or one rating.
          </p>
        </div>

        {/* Score Hub & 7 Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Central Score Card (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border-2 border-[#3C61DD] shadow-md flex flex-col items-center justify-center text-center gap-2">
            <span className="text-[10px] font-bold text-[#747685] uppercase">
              ILLUSTRATIVE EXAMPLE
            </span>
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              MONDIAL SCORE
            </span>
            <div className="text-[64px] font-heading font-extrabold text-[#1A1B23] leading-none my-2">
              87
            </div>
            <p className="text-[12px] text-[#747685]">High platform trust standing</p>
          </div>

          {/* 7 Inputs (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inputs.map((inp) => (
              <div
                key={inp.title}
                className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-1.5"
              >
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  {inp.title}
                </span>
                <span
                  className={`text-[16px] font-heading font-bold ${
                    inp.isNegative
                      ? 'text-[#BA1A1A]'
                      : inp.isBonus
                      ? 'text-[#1A47C3]'
                      : 'text-[#157A55]'
                  }`}
                >
                  {inp.weight}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Evolution of Trust & Relationship Formula */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              EVOLUTION OF TRUST
            </span>
            <div className="space-y-1.5 text-[12px]">
              <div>• <strong>ONE PROJECT</strong> creates a signal.</div>
              <div>• <strong>MULTIPLE PROJECTS</strong> create history.</div>
              <div>• <strong>HISTORY</strong> creates stronger reputation context.</div>
            </div>
          </div>

          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              RELATIONSHIP FORMULA
            </span>
            <div className="space-y-1.5 text-[12px]">
              <div>• <strong>VERIFY:</strong> Gets you into the system.</div>
              <div>• <strong>DELIVER:</strong> Creates evidence.</div>
              <div>• <strong>REPEAT PERFORMANCE:</strong> Builds reputation.</div>
            </div>
          </div>
        </div>

        {/* Disclaimer & Final Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            REPUTATION SHOULD BE EARNED THROUGH BEHAVIOR.
            <br />
            NOT BOUGHT THROUGH VISIBILITY.
          </h3>
          <p className="text-[12px] text-[#747685]">
            *IMPORTANT NOTE: A HIGH MONDIAL SCORE IS NOT A GUARANTEE OF FUTURE PERFORMANCE.
          </p>
        </div>
      </div>
    </section>
  );
}
