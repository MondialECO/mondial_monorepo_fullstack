'use client';

import { ShieldCheck, Lock, FileCheck, CheckCircle2, ArrowRight, ArrowDown } from 'lucide-react';

export default function TrustBeforeDeliverySection() {
  const gates = [
    '01 AGREED PROPOSAL',
    '02 CONTRACT GENERATED',
    '03 PROVIDER + CLIENT SIGNS',
    '04 CONTRACT ACTIVE',
    '05 CLIENT FUNDS PROJECT',
    '06 ESCROW FUNDED',
    '07 WORKROOM UNLOCKS',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            TRUST BEFORE DELIVERY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Agree the work.
            <br />
            Secure the project. Then begin.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial connects the agreed commercial scope to contract signing and project funding before the delivery workspace becomes active.
          </p>
        </div>

        {/* 7-Step Gate Sequence */}
        <div className="p-4 sm:p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {gates.map((g, idx) => (
            <span key={g} className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-[8px] border transition-all ${
                  idx === 6
                    ? 'bg-[#E8F8EE] border-[#157A55]/30 text-[#157A55]'
                    : 'bg-white border-[#E2E1EC]'
                }`}
              >
                {g}
              </span>
              {idx < gates.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>

        {/* Escrow Editorial & Example Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Escrow Editorial (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              STRUCTURED ESCROW FLOW
            </span>

            <div className="space-y-3 text-[13px] text-[#1A1B23]">
              <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                1. <strong>Client commits</strong> the agreed funds.
              </div>
              <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                2. <strong>Funds are held</strong> for the project process in escrow.
              </div>
              <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                3. <strong>Provider delivers</strong> according to the agreement.
              </div>
              <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                4. <strong>Approved work</strong> triggers release according to the project model.
              </div>
            </div>
          </div>

          {/* Right: Illustrative Escrow Card (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border-2 border-[#157A55] shadow-md flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#157A55] uppercase">
                  ESCROW STATUS
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[9px] font-extrabold uppercase">
                  ILLUSTRATIVE EXAMPLE
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-[#747685] uppercase block">PROJECT VALUE</span>
                <span className="text-[32px] font-heading font-extrabold text-[#1A1B23]">
                  €2,700
                </span>
              </div>

              <div className="p-3 rounded-[12px] bg-[#E8F8EE] text-[#157A55] text-[12px] font-bold flex items-center justify-between">
                <span>Client funds: €2,700</span>
                <span>SECURED</span>
              </div>
            </div>

            <div className="text-[11px] text-[#747685] text-center">
              Secured for delivery process • Release upon milestone approval
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            SIGNED DOES NOT MEAN STARTED. FUNDED DOES NOT MEAN COMPLETED.
            <br />
            EACH STAGE HAS A DIFFERENT PURPOSE.
          </h3>
        </div>
      </div>
    </section>
  );
}
