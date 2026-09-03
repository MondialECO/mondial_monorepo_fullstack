'use client';

import { Eye, Lock, ShieldCheck, Database, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function InformationJourneySection() {
  const layer3Steps = [
    { step: 'STEP 1', title: 'Access Request' },
    { step: 'STEP 2', title: 'Founder Approval' },
    { step: 'STEP 3', title: 'Execute NDA' },
  ];

  const dataRoomFiles = [
    'Business Plan (Detailed)',
    'Financial Projections',
    'Corporate Documents',
    'Cap Table',
    'Supporting Evidence',
  ];

  const processSteps = [
    { num: '01 / INITIATE', desc: 'Investor requests Data Room access.' },
    { num: '02 / REVIEW', desc: 'Entrepreneur reviews request.' },
    { num: '03 / COMPLIANCE', desc: 'NDA completed where relevant.' },
    { num: '04 / GRANT', desc: 'Specific Data Room access granted.' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CONTROL THE INFORMATION JOURNEY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Not every investor needs
            <br />
            everything on day one.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can help structure how company information becomes available as an investor relationship progresses.
          </p>
        </div>

        {/* 2-Column Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 4 Layers (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Layer 01: Discovery */}
            <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-[#E8E7F2] flex items-center justify-center text-[#444654]">
                    <Eye size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[17px] text-[#1A1B23]">
                      01. Discovery
                    </h3>
                    <span className="text-[10px] font-bold text-[#747685] uppercase">
                      PUBLIC / HIGH VISIBILITY
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#EEEDF8] text-[#444654] text-[10px] font-bold uppercase">
                  UNRESTRICTED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[12px]">
                <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC]">
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">COMPANY</span>
                  <span className="font-semibold text-[#1A1B23]">Nova Space SAS</span>
                </div>
                <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC]">
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">SECTOR</span>
                  <span className="font-semibold text-[#1A1B23]">Aerospace</span>
                </div>
                <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC]">
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">STAGE</span>
                  <span className="font-semibold text-[#1A1B23]">Series A</span>
                </div>
                <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC]">
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">ASK</span>
                  <span className="font-semibold text-[#3C61DD]">€5.2M</span>
                </div>
              </div>

              <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E1EC] text-[13px] text-[#444654] leading-relaxed">
                <span className="text-[10px] font-bold text-[#747685] uppercase block mb-0.5">STORY</span>
                Pioneering modular orbital infrastructure for sustainable satellite deployment and maintenance. Building the next generation of space logistics.
              </div>
            </div>

            {/* Layer 02: Investor Interest */}
            <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-[#E8E7F2] flex items-center justify-center text-[#444654]">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[17px] text-[#1A1B23]">
                      02. Investor Interest
                    </h3>
                    <span className="text-[10px] font-bold text-[#747685] uppercase">
                      REGISTERED USERS ONLY
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#EEEDF8] text-[#444654] text-[10px] font-bold uppercase">
                  PARTIAL GATE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">BUSINESS MODEL</span>
                  <p className="text-[#1A1B23] mt-0.5">B2B Hardware-as-a-Service, long-term government contracts.</p>
                </div>
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">TRACTION</span>
                  <p className="text-[#1A1B23] mt-0.5">3 LOIs signed. Prototype validated in LEO environment.</p>
                </div>
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">TEAM CONTEXT</span>
                  <p className="text-[#1A1B23] mt-0.5">Ex-ESA engineering leads, YC alumni founders.</p>
                </div>
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">FUNDING PURPOSE</span>
                  <p className="text-[#1A1B23] mt-0.5">Scale manufacturing facility, finalize regulatory compliance.</p>
                </div>
              </div>
            </div>

            {/* Layer 03: Controlled Access */}
            <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-[#DCE1FF] flex items-center justify-center text-[#1A47C3]">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[17px] text-[#1A1B23]">
                      03. Controlled Access
                    </h3>
                    <span className="text-[10px] font-bold text-[#747685] uppercase">
                      EXPLICIT PERMISSION REQUIRED
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#DCE1FF] text-[#1A47C3] text-[10px] font-bold uppercase">
                  GATED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {layer3Steps.map((st, i) => (
                  <div
                    key={st.step}
                    className="p-3.5 rounded-[12px] bg-white border border-[#E2E1EC] flex flex-col gap-1 text-[13px]"
                  >
                    <span className="text-[10px] font-bold text-[#3C61DD] uppercase">{st.step}</span>
                    <span className="font-bold text-[#1A1B23]">{st.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer 04: Data Room */}
            <div className="p-6 rounded-[24px] bg-[#FAF8FF] border-2 border-[#005F40]/30 flex flex-col gap-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-[#E8F8EE] flex items-center justify-center text-[#005F40]">
                    <Database size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[17px] text-[#1A1B23]">
                      04. Data Room
                    </h3>
                    <span className="text-[10px] font-bold text-[#747685] uppercase">
                      DEEP DILIGENCE
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#005F40] text-[10px] font-bold uppercase">
                  SECURE VAULT
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {dataRoomFiles.map((file) => (
                  <span
                    key={file}
                    className="px-3 py-1.5 rounded-[10px] bg-white border border-[#E2E1EC] text-[12px] font-medium text-[#1A1B23]"
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Process Logic (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs text-[13px]">
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider block">
                  ACCESS PHILOSOPHY
                </span>
                <h4 className="font-heading font-extrabold text-[17px] text-[#1A1B23] mt-1">
                  MORE INTEREST DOES NOT AUTOMATICALLY MEAN MORE ACCESS.
                </h4>
              </div>

              <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[11px] text-[#444654] font-bold uppercase">
                STAGE ➔ PERMISSION ➔ PURPOSE
              </div>

              <div className="flex flex-col gap-3 pl-3 border-l-2 border-[#E2E1EC]">
                {processSteps.map((p) => (
                  <div key={p.num} className="flex flex-col gap-0.5">
                    <span className="font-mono text-[11px] font-bold text-[#3C61DD]">{p.num}</span>
                    <span className="text-[#444654]">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#8A8B8F] italic">
              Access is systematically controlled by the founder.
            </span>
          </div>
        </div>

        {/* Closing Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            VISIBILITY IS A STRATEGY. NOT AN ALL-OR-NOTHING SWITCH.
          </span>
        </div>
      </div>
    </section>
  );
}
