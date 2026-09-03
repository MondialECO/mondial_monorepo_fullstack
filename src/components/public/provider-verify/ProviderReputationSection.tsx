'use client';

import { ShieldCheck, History, Award, TrendingUp, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export default function ProviderReputationSection() {
  const transformation = [
    { title: 'VERIFICATION', desc: 'gets you in.' },
    { title: 'DELIVERY', desc: 'creates history.' },
    { title: 'CLIENT OUTCOMES', desc: 'create reputation.' },
    { title: 'REPUTATION', desc: 'can influence future opportunity visibility.' },
  ];

  const scoreInputs = [
    { label: 'CLIENT SATISFACTION', weight: '40%', color: 'text-[#157A55]', bar: 'bg-[#157A55]', width: 'w-2/5' },
    { label: 'ON-TIME DELIVERY', weight: '25%', color: 'text-[#3C61DD]', bar: 'bg-[#3C61DD]', width: 'w-1/4' },
    { label: 'RESPONSE RATE', weight: '15%', color: 'text-[#3C61DD]', bar: 'bg-[#3C61DD]', width: 'w-[15%]' },
    { label: 'REPEAT CLIENT', weight: '10%', color: 'text-[#3C61DD]', bar: 'bg-[#3C61DD]', width: 'w-[10%]' },
    { label: 'SKILLS TEST', weight: '10%', color: 'text-[#3C61DD]', bar: 'bg-[#3C61DD]', width: 'w-[10%]' },
    { label: 'DISPUTE IMPACT', weight: '-10%', color: 'text-[#BA1A1A]', bar: 'bg-[#BA1A1A]', width: 'w-[10%]', isNegative: true },
  ];

  const bottomFlow = ['VERIFY', 'DELIVER', 'EARN TRUST', 'BUILD REPUTATION'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            TRUST CONTINUES AFTER VERIFICATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Credentials open the door.
            <br />
            Delivery builds reputation.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Professional verification helps a Provider enter the ecosystem. Ongoing behavior and client outcomes contribute to the broader Mondial Score over time.
          </p>
        </div>

        {/* 2 Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Transformation Story (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-5">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              REPUTATION ARCHITECTURE
            </span>

            <div className="space-y-4">
              {transformation.map((t, idx) => (
                <div key={t.title} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-white border border-[#3C61DD]/30 text-[#3C61DD] flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">{t.title}</h4>
                    <p className="text-[12px] text-[#444654]">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mondial Score & Inputs (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <span className="text-[11px] font-bold text-[#3C61DD] uppercase">
                CURRENT MONDIAL MODEL
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold uppercase flex items-center gap-1">
                <Sparkles size={12} />
                ECOSYSTEM CONTRIBUTION (BONUS)
              </span>
            </div>

            {/* Central Score Card */}
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-between bg-white p-5 rounded-[20px] border border-[#E2E1EC] shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase block">
                  MONDIAL SCORE
                </span>
                <span className="text-[44px] font-heading font-extrabold text-[#1A1B23] leading-none block my-1">
                  87
                </span>
                <span className="text-[11px] text-[#747685]">Illustrative Platform Signal</span>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto text-[11px]">
                {scoreInputs.map((inp) => (
                  <div
                    key={inp.label}
                    className={`p-2 rounded-[8px] border flex flex-col gap-1 ${
                      inp.isNegative
                        ? 'bg-red-50/50 border-red-200'
                        : 'bg-[#FAF8FF] border-[#E2E1EC]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-[#747685] uppercase">
                        {inp.label}
                      </span>
                      <span className={`font-bold ${inp.color}`}>{inp.weight}</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-[#E2E1EC] overflow-hidden">
                      <div className={`h-full ${inp.bar} ${inp.width}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Score Disclaimer */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <p className="font-heading font-bold text-[14px] text-[#1A1B23]">
            MONDIAL SCORE IS NOT A GUARANTEE OF FUTURE PERFORMANCE.
          </p>
          <p className="text-[12px] text-[#444654] mt-0.5">
            It is a structured platform signal based on defined inputs.
          </p>
        </div>

        {/* Bottom Trust Flow */}
        <div className="p-4 sm:p-5 rounded-[18px] bg-white border border-[#E2E1EC] shadow-xs flex flex-wrap items-center justify-center gap-3 text-[12px] font-bold text-[#1A1B23]">
          {bottomFlow.map((step, idx) => (
            <div key={step} className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                {step}
              </span>
              {idx < bottomFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
