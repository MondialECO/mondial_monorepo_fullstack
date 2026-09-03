'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export default function RolePricingGrid() {
  const creatorFeatures = [
    'Project Identity',
    'Project Intelligence',
    'Business Planning',
    'Resource Needs',
    'Marketplace Preparation',
    'Full Buyout',
    'Co-founder / Equity',
    'Build Yourself',
  ];

  const entrepreneurFeatures = [
    'Company Context',
    'Build & Execute',
    'Provider Discovery',
    'Ownership Context',
    'Funding Readiness',
    'Investor Discovery',
  ];

  const providerFeatures = [
    'Professional Profile',
    'Service Publishing',
    'Marketplace Visibility',
    'Qualified Opportunities',
    'Proposals',
    'Projects',
    'Earnings',
    'Reputation',
  ];

  const investorFeatures = [
    'Investor Profile',
    'Investment Thesis',
    'Discover & Match',
    'Controlled Diligence',
    'Pipeline',
    'Portfolio Context',
  ];

  return (
    <section className="w-full pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* 2 Primary Columns: BUILDING vs PROFESSIONAL ECOSYSTEM ACCESS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Column 1: BUILDING */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.08)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3C61DD]" />
              <h2 className="font-heading font-extrabold text-[14px] text-[#1A1B23] uppercase tracking-wider">
                BUILDING
              </h2>
            </div>

            <div className="flex flex-col gap-6 flex-1">
              {/* Creator Card */}
              <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-[24px] text-[#1A1B23]">
                        Creator
                      </h3>
                      <p className="text-[13px] text-[#444654] mt-1">
                        Turn an idea into a structured project.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-[32px] sm:text-[36px] text-[#1A1B23] leading-none">
                        €0
                      </span>
                      <span className="text-[12px] font-bold text-[#747685] block mt-0.5">
                        / month
                      </span>
                    </div>
                  </div>

                  {/* Access Includes */}
                  <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
                    <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block mb-3">
                      ACCESS INCLUDES
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#1A1B23] font-medium">
                      {creatorFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check size={14} className="text-[#3C61DD] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="w-full py-3 px-4 rounded-[10px] bg-white hover:bg-[#F3F2FD] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[13px] text-center transition-colors shadow-2xs"
                >
                  START AS CREATOR
                </Link>
              </div>

              {/* Entrepreneur Card */}
              <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-[24px] text-[#1A1B23]">
                        Entrepreneur
                      </h3>
                      <p className="text-[13px] text-[#444654] mt-1">
                        Structure, build and prepare your company.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-[32px] sm:text-[36px] text-[#1A1B23] leading-none">
                        €0
                      </span>
                      <span className="text-[12px] font-bold text-[#747685] block mt-0.5">
                        / month
                      </span>
                    </div>
                  </div>

                  {/* Access Includes */}
                  <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
                    <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block mb-3">
                      ACCESS INCLUDES
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#1A1B23] font-medium">
                      {entrepreneurFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check size={14} className="text-[#157A55] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="w-full py-3 px-4 rounded-[10px] bg-white hover:bg-[#F3F2FD] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[13px] text-center transition-colors shadow-2xs"
                >
                  START AS ENTREPRENEUR
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: PROFESSIONAL ECOSYSTEM ACCESS */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.08)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#965F11]" />
              <h2 className="font-heading font-extrabold text-[14px] text-[#1A1B23] uppercase tracking-wider">
                PROFESSIONAL ECOSYSTEM ACCESS
              </h2>
            </div>

            <div className="flex flex-col gap-6 flex-1">
              {/* Service Provider Card (Warm/Brown Accent #965F11) */}
              <div className="p-6 sm:p-8 rounded-[28px] bg-white border-2 border-[#965F11]/30 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-6 relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-extrabold text-[24px] text-[#1A1B23]">
                          Service Provider
                        </h3>
                      </div>
                      <p className="text-[13px] text-[#444654] mt-1">
                        Turn professional expertise into opportunities.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-[32px] sm:text-[36px] text-[#965F11] leading-none">
                        €9.99
                      </span>
                      <span className="text-[12px] font-bold text-[#747685] block mt-0.5">
                        / month
                      </span>
                    </div>
                  </div>

                  {/* Important Badge */}
                  <div className="p-2.5 rounded-[10px] bg-[#FEF3E2] border border-[#965F11]/20 text-center">
                    <span className="text-[11px] font-extrabold text-[#965F11] tracking-wide uppercase">
                      TIER-BASED COMMISSION ON ELIGIBLE PAID WORK
                    </span>
                  </div>

                  {/* Access Includes */}
                  <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
                    <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block mb-3">
                      ACCESS INCLUDES
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#1A1B23] font-medium">
                      {providerFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check size={14} className="text-[#965F11] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="w-full py-3 px-4 rounded-[10px] bg-[#965F11] hover:bg-[#7D4F0E] text-white font-semibold text-[13px] text-center transition-colors shadow-2xs"
                >
                  JOIN AS PROVIDER
                </Link>
              </div>

              {/* Investor Card (Dark Top Accent #070707 / #1A1B23) */}
              <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#1A1B23]/20 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-6 relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-[24px] text-[#1A1B23]">
                        Investor
                      </h3>
                      <p className="text-[13px] text-[#444654] mt-1">
                        Discover and review structured investment opportunities.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-[32px] sm:text-[36px] text-[#1A1B23] leading-none">
                        €9.99
                      </span>
                      <span className="text-[12px] font-bold text-[#747685] block mt-0.5">
                        / month
                      </span>
                    </div>
                  </div>

                  {/* Access Includes */}
                  <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
                    <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block mb-3">
                      ACCESS INCLUDES
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#1A1B23] font-medium">
                      {investorFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check size={14} className="text-[#1A1B23] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="w-full py-3 px-4 rounded-[10px] bg-[#1A1B23] hover:bg-[#070707] text-white font-semibold text-[13px] text-center transition-colors shadow-2xs"
                >
                  JOIN AS INVESTOR
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Closing Note */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col items-center text-center gap-2">
          <h3 className="font-heading font-extrabold text-[16px] sm:text-[18px] text-[#1A1B23]">
            Four roles. One simple pricing logic.
          </h3>
          <p className="text-[12px] sm:text-[13px] text-[#747685] max-w-[780px]">
            Small note: Applicable taxes, transaction costs or external professional costs may apply depending on the activity and jurisdiction.
          </p>
        </div>
      </div>
    </section>
  );
}
