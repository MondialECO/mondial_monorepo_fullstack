'use client';

import { AlertTriangle, TrendingUp, ShieldCheck, Scale, Compass } from 'lucide-react';

export default function InvestorRiskContext() {
  const stages = [
    {
      title: 'EARLIER STAGE',
      points: [
        'More uncertainty',
        'Less operating history',
        'Potentially wider outcome range',
      ],
    },
    {
      title: 'EARLY REVENUE',
      points: [
        'More evidence',
        'Some commercial signal',
        'Still meaningful execution risk',
      ],
    },
    {
      title: 'GROWTH',
      points: [
        'More operating history',
        'Larger capital requirements',
        'Different return and risk profile',
      ],
    },
  ];

  const dimensions = [
    'STAGE',
    'TICKET SIZE',
    'PORTFOLIO STRATEGY',
    'DEAL STRUCTURE',
    'COMPANY EVIDENCE',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            INVESTMENT APPROACH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Risk preference needs context,
            <br />
            not a magic score.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Investor strategy can reflect company maturity, uncertainty, capital exposure and expected return context without pretending that future outcomes are predictable.
          </p>
        </div>

        {/* 3 Stage Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {stages.map((st) => (
            <div
              key={st.title}
              className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">{st.title}</span>
                <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                  {st.points.map((pt) => (
                    <div key={pt}>• {pt}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Dimensions & Illustrative Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Dimensions (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              INVESTOR RISK APPETITE DIMENSIONS
            </span>

            <div className="flex flex-wrap gap-2">
              {dimensions.map((dim) => (
                <span
                  key={dim}
                  className="px-3 py-1.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#1A1B23]"
                >
                  ✔ {dim}
                </span>
              ))}
            </div>
          </div>

          {/* Illustrative Profile (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              ILLUSTRATIVE INVESTOR PROFILE
            </span>

            <div className="space-y-1.5 text-[12px] text-[#444654]">
              <div>• Earlier-stage focus</div>
              <div>• Moderate initial ticket deployment</div>
              <div>• Follow-on capacity reserved</div>
              <div>• High tolerance for execution uncertainty</div>
            </div>
          </div>
        </div>

        {/* Prominent Risk Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            RISK CAN BE STRUCTURED.
            <br />
            FUTURE RETURNS CANNOT BE PROMISED.
          </h3>
          <p className="text-[12px] text-[#747685]">
            *Expected Return Context is evaluated structurally without absolute predictive claims.
          </p>
        </div>
      </div>
    </section>
  );
}
