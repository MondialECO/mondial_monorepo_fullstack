'use client';

import { DollarSign, Clock, CreditCard, Building2, Send, ArrowDown, CheckCircle2 } from 'lucide-react';

export default function PayoutMethodsSection() {
  const methods = [
    { title: 'STRIPE CONNECT', desc: 'Direct merchant connection' },
    { title: 'WISE', desc: 'Global multi-currency transfer' },
    { title: 'BANK', desc: 'Domestic direct bank deposit' },
    { title: 'SWIFT / SEPA', desc: 'International wire transfer' },
    { title: 'PAYPAL', desc: 'Digital wallet payout' },
  ];

  const timings = [
    { title: 'WEEKLY', desc: 'Regular scheduled payout cycle' },
    { title: 'MONTHLY', desc: 'Consolidated end-of-month payout' },
    { title: 'IMMEDIATE', desc: 'Instant transfer where supported' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FROM BALANCE TO BANK
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Earning the money and receiving it
            <br />
            are two different moments.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Once eligible earnings reach the Provider balance, the Provider can use supported payout methods and schedules.
          </p>
        </div>

        {/* Available Balance & Payout Methods Hub */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#747685] uppercase">
              CONNECTED PAYOUT INFRASTRUCTURE
            </span>
            <span className="px-3 py-1 rounded bg-[#E8F8EE] text-[#157A55] text-[11px] font-bold">
              Minimum Payout: $50
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {methods.map((m) => (
              <div
                key={m.title}
                className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2 text-center"
              >
                <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">{m.title}</h4>
                <p className="text-[11px] text-[#747685]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Timing Options & Illustrative Journey Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Timing Options (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PAYOUT TIMING OPTIONS
            </span>

            <div className="space-y-3">
              {timings.map((t) => (
                <div
                  key={t.title}
                  className="p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between text-[12px]"
                >
                  <strong className="text-[#1A1B23]">{t.title}</strong>
                  <span className="text-[#444654]">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Illustrative Journey (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              ILLUSTRATIVE PAYOUT TIMELINE
            </span>

            <div className="space-y-2 text-[12px]">
              <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                <strong>Monday:</strong> Milestone Approved ➔ Processing
              </div>
              <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                <strong>Tuesday:</strong> Payment Released ➔ Provider Balance
              </div>
              <div className="p-2.5 rounded-[10px] bg-[#E8F8EE] border border-[#157A55]/30 text-[#157A55]">
                <strong>Friday:</strong> Scheduled Payout ➔ Wise Account Funds Available
              </div>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            PAYMENT RELEASE IS THE PROJECT EVENT. PAYOUT IS THE TRANSFER EVENT.
          </h3>
        </div>
      </div>
    </section>
  );
}
