'use client';

import { MessageSquare, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MatchConversationSection() {
  const investorQuestions = [
    'Why now?',
    'What evidence supports demand?',
    'What makes the company defensible?',
    'How will the capital be used?',
    'What is the next major milestone?',
    'What are the biggest unresolved risks?',
  ];

  const founderQuestions = [
    'What does the Investor typically support?',
    'Does the Investor lead or follow?',
    'What is their decision process?',
    'What value can they bring beyond capital?',
    'What information do they need next?',
    'What does their timeline look like?',
  ];

  const outcomes = [
    { title: 'NO FIT', desc: 'Close the conversation cleanly without friction.' },
    { title: 'MORE CONTEXT NEEDED', desc: 'Continue discussion and request specific context.' },
    { title: 'MUTUAL INTEREST', desc: 'Proceed toward deeper controlled diligence access.' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FROM MATCH TO CONVERSATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Data creates interest.
            <br />
            Conversation tests understanding.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A Founder–Investor meeting gives both sides the chance to challenge assumptions, clarify strategy and decide whether a deeper review makes sense.
          </p>
        </div>

        {/* 2 Question Columns Grid (Investor Questions vs Founder Questions) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Investor Questions */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              INVESTOR QUESTIONS
            </span>
            <div className="space-y-2">
              {investorQuestions.map((q) => (
                <div
                  key={q}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-medium text-[#1A1B23]"
                >
                  ❓ {q}
                </div>
              ))}
            </div>
          </div>

          {/* Founder Questions */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <span className="text-[11px] font-bold text-[#157A55] uppercase tracking-wider">
              FOUNDER QUESTIONS
            </span>
            <div className="space-y-2">
              {founderQuestions.map((q) => (
                <div
                  key={q}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-medium text-[#1A1B23]"
                >
                  ❓ {q}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Meeting Outcomes (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {outcomes.map((out) => (
            <div
              key={out.title}
              className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs text-center flex flex-col justify-between gap-2"
            >
              <strong className="text-[#1A1B23] text-[13px]">{out.title}</strong>
              <p className="text-[11px] text-[#747685]">{out.desc}</p>
            </div>
          ))}
        </div>

        {/* Core Statement & Progression Flow */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A GOOD MATCH DOES NOT NEED TO BECOME A DEAL.
            <br />
            IT SHOULD BECOME A CLEARER DECISION.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-[#1A1B23] pt-2">
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">MATCH</span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">MEETING</span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              DECIDE WHAT HAPPENS NEXT
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
