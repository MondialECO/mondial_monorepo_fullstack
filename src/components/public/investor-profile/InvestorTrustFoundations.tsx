'use client';

import { ShieldCheck, DollarSign, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function InvestorTrustFoundations() {
  const identitySteps = [
    'Identity Document',
    'Email / Phone Verification',
    'Face / Identity Check',
    'Address Context (when required)',
  ];

  const financeSteps = [
    'Investor Type',
    'Investment Capacity',
    'Proof of Funds',
    'Source-of-Funds Context',
    'Typical Ticket Range',
  ];

  return (
    <section
      id="section-02-trust-foundations"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            TWO FOUNDATIONS OF INVESTOR TRUST
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Knowing who the investor is
            <br />
            is only the first question.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Investor identity establishes the person or organization behind the account. Financial verification establishes the relevant investment-capacity context.
          </p>
        </div>

        {/* 2 Foundations Grid (Identity vs Financial Context) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: 01 Identity */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                    FOUNDATION 01
                  </span>
                  <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
                    INVESTOR IDENTITY
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#FAF8FF] text-[#747685] text-[10px] font-bold">
                  WHO IS PARTICIPATING?
                </span>
              </div>

              <div className="space-y-2">
                {identitySteps.map((st) => (
                  <div
                    key={st}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center gap-2 text-[12px] font-medium text-[#1A1B23]"
                  >
                    <CheckCircle2 size={14} className="text-[#3C61DD]" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#E8F8EE] text-[#157A55] text-[12px] font-bold text-center">
              ✔ VERIFIED INVESTOR IDENTITY
            </div>
          </div>

          {/* Right: 02 Financial Context */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                    FOUNDATION 02
                  </span>
                  <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
                    FINANCIAL CONTEXT
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#FAF8FF] text-[#747685] text-[10px] font-bold">
                  WHAT INVESTMENT CAPACITY?
                </span>
              </div>

              <div className="space-y-2">
                {financeSteps.map((st) => (
                  <div
                    key={st}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center gap-2 text-[12px] font-medium text-[#1A1B23]"
                  >
                    <CheckCircle2 size={14} className="text-[#3C61DD]" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#E8F8EE] text-[#157A55] text-[12px] font-bold text-center">
              ✔ FINANCE-VERIFIED CONTEXT
            </div>
          </div>
        </div>

        {/* Trust Relationship Equation & Principle */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-bold text-[#BA1A1A] max-w-fit">
            IDENTITY VERIFIED does not automatically mean INVESTMENT CAPACITY VERIFIED.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
              VERIFIED IDENTITY
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
              VERIFIED FINANCIAL CONTEXT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-5 py-2 rounded-[10px] bg-[#1A47C3] text-white shadow-xs">
              INVESTOR TRUST FOUNDATION
            </span>
          </div>

          <p className="text-[12px] font-bold text-[#747685] uppercase tracking-wider pt-2">
            TRUST NEEDS BOTH IDENTITY AND CONTEXT.
          </p>
        </div>

        {/* Mandatory Trust Limitation Disclaimer */}
        <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-center text-[12px] text-[#747685]">
          *Mondial Eco does not guarantee wealth, solvency, or future ability to invest. Submitted documentation represents a specific point in time and is informational verification context only.
        </div>
      </div>
    </section>
  );
}
