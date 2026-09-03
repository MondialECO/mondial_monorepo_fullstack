'use client';

import { Shield, Eye, Lock, FileKey, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SensitiveAccessSection() {
  const trustSteps = [
    { title: 'INVESTOR INTEREST' },
    { title: 'ACCESS REQUEST' },
    { title: 'ENTREPRENEUR REVIEW' },
    { title: 'NDA', badge: 'If Req.' },
    { title: 'CONTROLLED ACCESS', highlight: true },
    { title: 'DILIGENCE' },
  ];

  const level1 = ['Company Overview', 'Stage', 'Sector', 'High-Level Funding Ask'];
  const level2 = ['Business Plan', 'Traction Detail', 'Financial Summary'];
  const level3 = [
    'Detailed Financial Records',
    'Corporate Documents',
    'Cap Table Detail',
    'Legal / Transaction Material',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            TRUST BEFORE SENSITIVE ACCESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Some conversations need a
            <br />
            clearer boundary.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            When sensitive company information is involved, access may be structured around permissions, confidentiality and the purpose of the investor review.
          </p>
        </div>

        {/* Trust Flow Journey */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-5">
          <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CONFIDENTIALITY &amp; TRUST PROTOCOL
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {trustSteps.map((st, i) => (
              <div
                key={st.title}
                className={`p-4 rounded-[16px] flex flex-col justify-between gap-2 border transition-colors ${
                  st.highlight
                    ? 'bg-[#F3F2FD] border-[#3C61DD]/40 text-[#3C61DD]'
                    : 'bg-[#FAF8FF] border-[#E2E1EC] text-[#1A1B23]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] opacity-70">0{i + 1}</span>
                  {st.badge && (
                    <span className="px-1.5 py-0.5 rounded bg-white text-[9px] font-bold text-[#747685] border border-[#E2E1EC]">
                      {st.badge}
                    </span>
                  )}
                </div>
                <span className="font-heading font-bold text-[12px] leading-tight">{st.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Information Levels Bento Grid (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Level 1: Public */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-[#E8E7F2] text-[#444654] text-[10px] font-bold uppercase">
                  LEVEL 1
                </span>
                <Eye size={16} className="text-[#747685]" />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23]">PUBLIC</h3>
                <span className="text-[11px] text-[#747685]">Open to all verified visitors</span>
              </div>

              <ul className="space-y-2 text-[13px] text-[#444654] pt-2 border-t border-[rgba(0,0,0,0.06)]">
                {level1.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#3C61DD]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Level 2: Controlled */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-[#EEEDF8] text-[#444654] text-[10px] font-bold uppercase">
                  LEVEL 2
                </span>
                <Lock size={16} className="text-[#3C61DD]" />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23]">
                  CONTROLLED
                </h3>
                <span className="text-[11px] text-[#747685]">Requires initial investor match</span>
              </div>

              <ul className="space-y-2 text-[13px] text-[#444654] pt-2 border-t border-[rgba(0,0,0,0.06)]">
                {level2.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#3C61DD]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Level 3: Sensitive (Hero Blue) */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#3C61DD] text-white flex flex-col justify-between gap-6 shadow-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold uppercase">
                  LEVEL 3
                </span>
                <FileKey size={16} className="text-white" />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-[22px] text-white">SENSITIVE</h3>
                <span className="text-[11px] text-white/80">
                  Full NDA + explicit founder permission
                </span>
              </div>

              <ul className="space-y-2 text-[13px] text-white/90 pt-2 border-t border-white/20">
                {level3.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-white" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Statement */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            AN NDA IS NOT A DEAL. IT IS ONE TOOL FOR STRUCTURING CONFIDENTIALITY.
          </span>
          <p className="text-[13px] text-[#747685]">
            Whether an NDA is appropriate depends on the situation and parties involved.
          </p>
        </div>
      </div>
    </section>
  );
}
