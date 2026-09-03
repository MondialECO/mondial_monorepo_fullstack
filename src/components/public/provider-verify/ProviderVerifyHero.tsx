'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, UserCheck, Briefcase, FileCode, Award } from 'lucide-react';

export default function ProviderVerifyHero() {
  const equation = [
    'IDENTITY',
    'PROFESSIONAL EVIDENCE',
    'VERIFICATION',
    'DELIVERY CONTEXT',
  ];

  const bottomJourney = [
    'IDENTITY',
    'PROFESSIONAL CONTEXT',
    'EVIDENCE',
    'VERIFICATION',
    'TRUST',
    'OPPORTUNITY',
  ];

  return (
    <section className="w-full pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F3F2FD]/50 via-white to-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] flex flex-col gap-12 sm:gap-16">
        {/* 12-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Narrative (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-5">
              {/* Eyebrow */}
              <div className="flex items-center gap-2">
                <span className="w-6 h-[2px] bg-[#1A47C3]" />
                <span className="text-[12px] font-bold text-[#1A47C3] uppercase tracking-wider">
                  MONDIAL ECO SERVICE PROVIDERS
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[40px] sm:text-[48px] lg:text-[54px] font-heading font-extrabold text-[#1A1B23] leading-[1.1] tracking-[-0.96px]">
                Turn expertise into
                <br />
                <span className="text-[#3C61DD] relative inline-block">
                  trusted identity.
                  <svg
                    className="absolute left-0 -bottom-2 w-full h-[6px] text-[#3C61DD]"
                    viewBox="0 0 300 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 4.5C50 1.5 150 1.5 299 4.5"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Description */}
              <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6]">
                Mondial connects professional identity, credentials, real work evidence and verification into one trusted Provider profile — before services, leads and client work begin.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/signup"
                  className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
                >
                  <span>Start Provider Verification</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>

                <a
                  href="#section-02-contextual-trust"
                  className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#3C61DD] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
                >
                  <span>See How Trust Works</span>
                  <span>➔</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Transformation / Maya Rahman Persona (6 cols) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[480px] p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-md flex flex-col items-center gap-6">
              {/* Top Trust Badge */}
              <div className="px-3.5 py-1.5 rounded-full bg-[#E8F8EE] border border-[#157A55]/30 text-[#157A55] text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck size={14} />
                <span>TIER 3 VERIFIED</span>
              </div>

              {/* Central Portrait Card */}
              <div className="relative w-[220px] sm:w-[250px] h-[280px] sm:h-[310px] rounded-[22px] overflow-hidden border-2 border-white shadow-lg">
                <Image
                  src="/provider-public/maya_rahman_portrait.png"
                  alt="Maya Rahman - Backend Engineer"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                  <h3 className="font-heading font-extrabold text-[16px] leading-tight">
                    Maya Rahman
                  </h3>
                  <span className="text-[11px] text-white/80">Backend Engineer, Bangladesh</span>
                </div>
              </div>

              {/* 4 Floating Context Cards Grid */}
              <div className="w-full grid grid-cols-2 gap-3 text-[12px]">
                {/* 01 Identity */}
                <div className="p-3 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center gap-2.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-[8px] bg-[#DCE1FF] flex items-center justify-center text-[#1A47C3] shrink-0">
                    <UserCheck size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#1A47C3] uppercase">01 IDENTITY</span>
                    <span className="font-bold text-[#1A1B23]">Govt. ID Verified</span>
                  </div>
                </div>

                {/* 02 Context */}
                <div className="p-3 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center gap-2.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-[8px] bg-amber-50 flex items-center justify-center text-[#875301] shrink-0">
                    <Briefcase size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#875301] uppercase">02 CONTEXT</span>
                    <span className="font-bold text-[#1A1B23]">5 Yrs Backend Arch</span>
                  </div>
                </div>

                {/* 03 Evidence */}
                <div className="p-3 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center gap-2.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-[8px] bg-[#E8E7F2] flex items-center justify-center text-[#444654] shrink-0">
                    <FileCode size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#747685] uppercase">03 EVIDENCE</span>
                    <span className="font-bold text-[#1A1B23]">GitHub &amp; Live APIs</span>
                  </div>
                </div>

                {/* 04 Verification */}
                <div className="p-3 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center gap-2.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-[8px] bg-[#DCE1FF] flex items-center justify-center text-[#3C61DD] shrink-0">
                    <Award size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#3C61DD] uppercase">04 VERIFICATION</span>
                    <span className="font-bold text-[#1A1B23]">Credentials Reviewed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Editorial Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <p className="font-serif italic text-[18px] sm:text-[22px] text-[#444654] leading-relaxed max-w-[900px] mx-auto">
            &ldquo;A profile should show more than what someone says they can do. It should show why the ecosystem can trust it.&rdquo;
          </p>
        </div>

        {/* Trust Equation */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border-2 border-[#3C61DD]/30 flex flex-col items-center gap-5 text-center shadow-sm">
          <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PROVIDER TRUST EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            {equation.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equation.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#3C61DD] text-white shadow-xs">
              TRUSTED PROVIDER PROFILE
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] sm:text-[11px] font-bold text-[#747685] uppercase">
            {bottomJourney.map((j, i) => (
              <span key={j} className="flex items-center gap-2">
                <span>{j}</span>
                {i < bottomJourney.length - 1 && <span className="text-[#C4C5D6]">➔</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
