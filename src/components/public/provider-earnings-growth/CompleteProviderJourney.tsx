'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Briefcase, TrendingUp } from 'lucide-react';

export default function CompleteProviderJourney() {
  const stages = [
    { num: '01', title: 'VERIFY & PROFILE', desc: 'Establish identity.', icon: ShieldCheck, isCurrent: false },
    { num: '02', title: 'SERVICES & OPPORTUNITIES', desc: 'Structure offerings.', icon: Sparkles, isCurrent: false },
    { num: '03', title: 'PROJECTS & DELIVERY', desc: 'Execute work securely.', icon: Briefcase, isCurrent: false },
    { num: '04', title: 'EARNINGS & GROWTH', desc: 'Compound reputation.', icon: TrendingUp, isCurrent: true },
  ];

  const equation = [
    'PROFESSIONAL IDENTITY',
    'STRUCTURED SERVICES',
    'ECOSYSTEM DEMAND',
    'TRUSTED DELIVERY',
    'PAYMENT',
    'REPUTATION',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F1F2]/60 border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 max-w-[840px] mx-auto">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            THE SERVICE PROVIDER PATH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            From professional expertise
            <br />
            to trusted business growth.
          </h2>
        </div>

        {/* 4 Public Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className={`p-6 rounded-[24px] border flex flex-col justify-between gap-4 transition-all ${
                  st.isCurrent
                    ? 'bg-[#F3F2FD] border-2 border-[#3C61DD] shadow-md relative'
                    : 'bg-white border-[#E2E1EC] shadow-2xs'
                }`}
              >
                {st.isCurrent && (
                  <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-[#3C61DD] text-white text-[9px] font-extrabold uppercase">
                    JOURNEY COMPLETE
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                    STAGE {st.num}
                  </span>
                  <Icon size={18} className="text-[#3C61DD]" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">{st.title}</h4>
                  <p className="text-[12px] text-[#747685] mt-1">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mondial Provider Equation */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-6 text-center">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            CONTINUOUS PROVIDER GROWTH EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equation.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equation.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              CONTINUOUS PROVIDER GROWTH
            </span>
          </div>

          <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] text-[#444654] max-w-[720px]">
            Creators, Entrepreneurs, Investors generate needs ➔ <strong>SERVICE PROVIDERS</strong> bring expertise ➔ <strong>COMPLETED WORK</strong> strengthens ecosystem
          </div>
        </div>

        {/* Final Statement & Action CTAs */}
        <div className="p-8 sm:p-12 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-6">
          <h3 className="font-heading font-extrabold text-[16px] sm:text-[20px] text-[#070707] uppercase tracking-wide">
            VERIFY YOUR EXPERTISE. STRUCTURE YOUR VALUE.
            <br />
            DELIVER WITH TRUST. GROW THROUGH THE WORK.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
            >
              <span>START AS A SERVICE PROVIDER</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/for-service-providers"
              className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A47C3] font-semibold text-[14px] rounded-[10px] transition-colors"
            >
              EXPLORE VERIFY &amp; PROFILE
            </Link>
          </div>

          {/* Bottom Journey Metadata */}
          <div className="w-full flex flex-wrap items-center justify-between text-[12px] text-[#747685] pt-6 border-t border-[rgba(0,0,0,0.06)] mt-2">
            <span>Service Provider Page 04 — Earnings &amp; Growth</span>
            <span className="font-bold text-[#157A55]">
              SERVICE PROVIDER JOURNEY: 01 ➔ 02 ➔ 03 ➔ 04 COMPLETE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
