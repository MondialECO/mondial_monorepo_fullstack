'use client';

import { CheckCircle2, User, FileText, ArrowDown, Zap } from 'lucide-react';

export default function CreatorDualPathSection() {
  const structuredItems = [
    'Identity',
    'Project Definition',
    'Business Plan',
    'Market Intelligence',
    'Financial Context',
    'Resource Needs',
  ];

  const entrepreneurModules = [
    'Company Verification',
    'Company Identity',
    'Cap Table & Equity',
    'Team & Execution',
    'Service Provider Matching',
    'Investor Readiness',
    'Data Room & Funding',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1280px] flex flex-col gap-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* ================= LEFT COLUMN: CO-FOUNDER / EQUITY ================= */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
                BUILD TOGETHER
              </span>
              <h3 className="text-[28px] sm:text-[34px] font-heading font-bold text-[#070707] leading-tight">
                Find someone to build with.
              </h3>
              <p className="text-[14px] text-[#5E5E5E]">Path 02 — CO-FOUNDER / EQUITY</p>
            </div>

            {/* Vertical Matching Flow */}
            <div className="flex flex-col gap-4">
              {/* Step 1: Project Need */}
              <div className="bg-white rounded-[16px] p-4 border border-[rgba(0,0,0,0.06)] flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">PROJECT NEED</span>
                <span className="text-[15px] font-bold text-[#070707]">Backend + Commercial Execution</span>
              </div>

              <div className="flex justify-center text-[#8A8B8F]">
                <ArrowDown size={18} />
              </div>

              {/* Step 2: Co-founder Match */}
              <div className="bg-white rounded-[16px] p-5 border-l-4 border-l-[#3C61DD] border-[rgba(0,0,0,0.06)] flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center font-bold">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">CO-FOUNDER MATCH</span>
                      <h4 className="font-heading font-bold text-[16px] text-[#070707]">Alex Martin</h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#D4FFE5] text-[#00A854] text-[11px] font-bold">
                    Active Builder
                  </span>
                </div>
                <div className="text-[12px] text-[#5E5E5E]">
                  <span className="font-semibold text-[#070707]">Skills: </span>
                  Backend Engineering, Marketplace Operations
                </div>
              </div>

              <div className="flex justify-center text-[#8A8B8F]">
                <ArrowDown size={18} />
              </div>

              {/* Step 3: Role Alignment */}
              <div className="bg-[#F1F5FF] rounded-[16px] p-4 border border-[#3C61DD]/20 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3C61DD] uppercase">
                  <Zap size={14} />
                  <span>ROLE ALIGNMENT</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="bg-white rounded-[10px] p-2.5 border border-[rgba(0,0,0,0.04)]">
                    <span className="text-[#8A8B8F] block text-[10px]">Creator</span>
                    <span className="font-bold text-[#070707]">Product &amp; Vision</span>
                  </div>
                  <div className="bg-white rounded-[10px] p-2.5 border border-[rgba(0,0,0,0.04)]">
                    <span className="text-[#8A8B8F] block text-[10px]">Co-founder</span>
                    <span className="font-bold text-[#070707]">Tech &amp; Ops</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-[#8A8B8F]">
                <ArrowDown size={18} />
              </div>

              {/* Step 4: Equity Discussion & Agreement */}
              <div className="bg-white rounded-[16px] p-4 border border-[rgba(0,0,0,0.06)] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#070707]">
                  <FileText size={16} className="text-[#3C61DD]" />
                  <span>FOUNDER AGREEMENT</span>
                </div>
                <span className="text-[11px] font-bold text-[#3C61DD] bg-[#F1F5FF] px-2.5 py-1 rounded-[6px]">
                  EQUITY: TO BE AGREED
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-[#8A8B8F] italic leading-relaxed pt-2 border-t border-[rgba(0,0,0,0.06)]">
              Matching starts the conversation. It does not automatically create an equity relationship.
            </p>
          </div>

          {/* ================= RIGHT COLUMN: BUILD YOURSELF ================= */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wider">
                BECOME THE ENTREPRENEUR
              </span>
              <h3 className="text-[28px] sm:text-[34px] font-heading font-bold text-[#070707] leading-tight">
                Keep the project and build.
              </h3>
              <p className="text-[14px] text-[#5E5E5E]">Path 03 — BUILD YOURSELF</p>
            </div>

            {/* Checklist: Structured Project */}
            <div className="bg-white rounded-[16px] p-5 border border-[rgba(0,0,0,0.06)] flex flex-col gap-3 shadow-sm">
              <span className="text-[11px] font-bold text-[#070707] uppercase tracking-wider">
                NOVA SPACE STRUCTURED PROJECT
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                {structuredItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[#3E3E3E]">
                    <CheckCircle2 size={14} className="text-[#00A854] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Up Banner */}
            <div className="w-full py-3 px-4 rounded-[12px] bg-[#3C61DD] text-white text-center font-heading font-bold text-[13px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-2">
              <Zap size={16} />
              <span>VERIFIED ENTREPRENEUR LEVEL UP</span>
            </div>

            {/* Unlocked Modules */}
            <div className="bg-white rounded-[16px] p-5 border border-[rgba(0,0,0,0.06)] flex flex-col gap-3 shadow-sm">
              <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                UNLOCKED ENTREPRENEUR ROADMAP
              </span>
              <div className="flex flex-col gap-1.5 text-[12px] text-[#5E5E5E]">
                {entrepreneurModules.map((mod) => (
                  <div key={mod} className="flex items-center gap-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
                    <span>{mod}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Tag */}
            <div className="pt-2 border-t border-[rgba(0,0,0,0.06)] text-center">
              <span className="font-heading font-bold text-[13px] text-[#070707] uppercase tracking-wider">
                SAME PROJECT. DIFFERENT PATH.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
