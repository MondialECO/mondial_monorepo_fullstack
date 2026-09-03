'use client';

import { DollarSign, CheckCircle2, ArrowRight, Lock, HelpCircle } from 'lucide-react';

export default function PaymentJourneySection() {
  const steps = [
    { num: '01', title: 'CLIENT FUNDS PROJECT', amount: '$1,000' },
    { num: '02', title: 'WORK DELIVERED', amount: 'Execution' },
    { num: '03', title: 'CLIENT APPROVES', amount: 'Sign-off' },
    { num: '04', title: 'ESCROW RELEASE', amount: 'Triggered' },
  ];

  const questions = [
    'Is the project funded?',
    'Has the work been approved?',
    'Has the amount been released?',
    'Is it available for payout?',
  ];

  return (
    <section
      id="section-02-payment-journey"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FOLLOW THE MONEY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Know what happens between
            <br />
            approval and payout.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial should make the payment journey understandable so the Provider can see how project value becomes platform fees, released earnings and payout balance.
          </p>
        </div>

        {/* 4-Step Illustrative Tier 3 Flow */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[10px] font-extrabold uppercase text-[#1A1B23]">
              ILLUSTRATIVE TIER 3 EXAMPLE
            </span>
            <span className="text-[11px] text-[#747685]">Escrow to Balance Cycle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((st) => (
              <div
                key={st.num}
                className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3"
              >
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">{st.num}</span>
                <div>
                  <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">{st.title}</h4>
                  <p className="text-[12px] font-semibold text-[#157A55] mt-1">{st.amount}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Value Split Bar */}
          <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase">VALUE SPLIT</span>
            <div className="w-full h-8 rounded-full overflow-hidden flex text-[11px] font-bold text-white text-center leading-8 shadow-xs">
              <div style={{ width: '92%' }} className="bg-[#157A55] px-2">
                Provider Balance $920 (92%)
              </div>
              <div style={{ width: '8%' }} className="bg-[#BA1A1A] px-2">
                -$80 (8%)
              </div>
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-[#444654] px-1">
              <span>8% Platform Fee: -$80</span>
              <span>Provider Balance: $920</span>
            </div>
          </div>
        </div>

        {/* Financial Equations & Status Questions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Equation (6 cols) */}
          <div className="lg:col-span-6 p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              CORE FINANCIAL EQUATION
            </span>

            <div className="space-y-2.5 text-[12px] font-bold">
              <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between text-[#BA1A1A]">
                <span>PROJECT VALUE</span>
                <span>≠</span>
                <span>TAKE-HOME AMOUNT</span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#E8F8EE] border border-[#157A55]/30 flex items-center justify-between text-[#157A55]">
                <span>PROJECT VALUE - PLATFORM FEE</span>
                <span>=</span>
                <span>PROVIDER EARNINGS</span>
              </div>
            </div>
          </div>

          {/* Questions (6 cols) */}
          <div className="lg:col-span-6 p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PAYMENT STATUS CLARITY
            </span>

            <div className="space-y-1.5 text-[12px]">
              {questions.map((q) => (
                <div
                  key={q}
                  className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center gap-2 font-medium text-[#1A1B23]"
                >
                  <CheckCircle2 size={13} className="text-[#3C61DD]" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            FINANCIAL CLARITY SHOULD BEGIN BEFORE THE PROVIDER WITHDRAWS.
          </h3>
        </div>
      </div>
    </section>
  );
}
