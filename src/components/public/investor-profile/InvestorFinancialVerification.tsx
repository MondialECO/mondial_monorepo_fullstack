'use client';

import { DollarSign, ShieldCheck, CheckCircle2, AlertCircle, TrendingUp, Landmark } from 'lucide-react';

export default function InvestorFinancialVerification() {
  const dimensions = [
    {
      title: 'INVESTOR TYPE',
      desc: 'Angel Investor, Venture Fund, Family Office, Corporate Investor, Syndicate',
    },
    {
      title: 'CAPITAL CAPACITY',
      desc: 'What range can reasonably be deployed across the platform cycle?',
    },
    {
      title: 'TYPICAL TICKET',
      desc: 'What amount is usually invested per individual company opportunity?',
    },
    {
      title: 'PROOF CONTEXT',
      desc: 'What verified documentation or banking context supports capacity?',
    },
    {
      title: 'SOURCE-OF-FUNDS',
      desc: 'Institutional provenance and compliant capital background where relevant.',
    },
    {
      title: 'RISK CONTEXT',
      desc: 'What stage uncertainty and asset-class exposure is represented?',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FINANCIAL VERIFICATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Capital context should be credible
            <br />
            before it drives matching.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can structure the financial information needed to understand the investor’s capacity, typical ticket and relevant source-of-funds context.
          </p>
        </div>

        {/* 6 Dimensions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensions.map((dim) => (
            <div
              key={dim.title}
              className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
            >
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">{dim.title}</span>
              <p className="text-[12px] text-[#444654] leading-relaxed">{dim.desc}</p>
            </div>
          ))}
        </div>

        {/* Illustrative Horizon Ticket & Inform vs Not-Create Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Illustrative Example (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase">
                ILLUSTRATIVE EXAMPLE
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                HORIZON CAPITAL
              </h3>
              <p className="text-[12px] text-[#747685] mt-0.5">Verified Ticket Capacity</p>

              <div className="text-[32px] font-heading font-extrabold text-[#157A55] mt-3">
                €250K — €1M
              </div>
              <p className="text-[11px] text-[#747685] mt-1">Typical Ticket Range per Deal</p>
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#E8F8EE] text-[#157A55] text-[11px] font-bold text-center">
              ✔ Verified Capital Context
            </div>
          </div>

          {/* Right: Inform vs Not-Create (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Should Inform */}
            <div className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-[#157A55] uppercase tracking-wider">
                FINANCIAL VERIFICATION INFORMS:
              </span>
              <div className="space-y-2 text-[12px] text-[#1A1B23] font-medium">
                <div>✔ Platform Eligibility</div>
                <div>✔ Matching Context</div>
                <div>✔ Deal Expectations</div>
              </div>
            </div>

            {/* Should Not Create */}
            <div className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-[#BA1A1A] uppercase tracking-wider">
                IT DOES NOT CREATE:
              </span>
              <div className="space-y-2 text-[12px] text-[#BA1A1A] font-medium">
                <div>✖ Guaranteed Funding Capacity</div>
                <div>✖ Binding Investment Commitment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A TICKET RANGE IS A DISCOVERY SIGNAL.
            <br />
            NOT A PROMISE TO WRITE THE CHECK.
          </h3>
        </div>
      </div>
    </section>
  );
}
