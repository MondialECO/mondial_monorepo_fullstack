'use client';

import { CheckCircle2, XCircle, ArrowRight, HelpCircle, GitFork } from 'lucide-react';

export default function DealProcessSection() {
  const mainStages = [
    { title: 'NEW INTEREST' },
    { title: 'INTRODUCTION' },
    { title: 'ACCESS' },
    { title: 'NDA (IF RELEVANT)' },
    { title: 'DATA ROOM', question: 'Does the investor have enough information?' },
    { title: 'DILIGENCE', question: 'What still needs validation?' },
    { title: 'TERM DISCUSSION', question: 'Are the economics and rights acceptable?' },
    { title: 'NEGOTIATION', question: 'Can both sides agree?' },
  ];

  const dealCapabilities = [
    'Move forward',
    'Pause',
    'Return for more information',
    'Change terms',
    'Close without investment',
  ];

  const bottomFlow = [
    'INTEREST',
    'INFORMATION',
    'DECISION',
    'TERMS',
    'AGREEMENT',
    'EXECUTION',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            THE DEAL IS A PROCESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Track the decision.
            <br />
            Not just the status.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Investor discussions can move, pause, require new information or end. Mondial should make the process understandable without pretending every opportunity moves forward.
          </p>
        </div>

        {/* Continuous Deal Timeline Architecture */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-8">
          <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CONTINUOUS DEAL TIMELINE
          </span>

          {/* Horizontal / Wrapped Stages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainStages.map((st, i) => (
              <div
                key={st.title}
                className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-[#747685]">0{i + 1}</span>
                  <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">
                    {st.title}
                  </h4>
                  {st.question && (
                    <div className="p-2 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] text-[#747685] mt-1">
                      <span className="font-bold text-[#3C61DD] block text-[9px] uppercase">
                        QUESTION
                      </span>
                      {st.question}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Branching Outcomes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
            {/* Won */}
            <div className="p-5 rounded-[18px] bg-[#E8F8EE] border border-[#157A55]/30 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#005F40]" />
                <div>
                  <h4 className="font-heading font-bold text-[16px] text-[#005F40]">WON</h4>
                  <span className="text-[12px] text-[#005F40]/80">FUNDED</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#005F40] uppercase">
                Portfolio Created
              </span>
            </div>

            {/* Lost */}
            <div className="p-5 rounded-[18px] bg-white border border-[#E2E1EC] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <XCircle size={20} className="text-[#747685]" />
                <div>
                  <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">LOST</h4>
                  <span className="text-[12px] text-[#747685]">CLOSED</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#747685] uppercase">
                Learnings Logged
              </span>
            </div>
          </div>
        </div>

        {/* Lower Features & Core Principle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* A Deal Can List (5 cols) */}
          <div className="lg:col-span-5 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col gap-4 shadow-xs">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              A DEAL CAN:
            </span>

            <ul className="space-y-2 text-[14px] text-[#1A1B23]">
              {dealCapabilities.map((cap) => (
                <li key={cap} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Principle (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-3">
            <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
              CORE PRINCIPLE
            </span>
            <h3 className="text-[24px] sm:text-[30px] font-heading font-extrabold text-[#1A1B23] leading-snug">
              &ldquo;Lost&rdquo; is still a useful outcome when the company knows why.
            </h3>
          </div>
        </div>

        {/* Bottom Transition Bar */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#1A1B23]">
          {bottomFlow.map((flow, i) => (
            <div key={flow} className="flex items-center gap-2">
              <span>{flow}</span>
              {i < bottomFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
