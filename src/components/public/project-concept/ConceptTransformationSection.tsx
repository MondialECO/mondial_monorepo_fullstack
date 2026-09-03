'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ConceptTransformationSection() {
  const rawQuestions = [
    'Who exactly needs this?',
    'What is the real problem?',
    'What makes the solution different?',
    'What does the project actually do?',
    'Who should use it first?',
  ];

  const engineSteps = ['Name', 'Concept', 'Problem', 'Solution', 'Target Customer'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-12 sm:gap-16">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STRUCTURE BEFORE STRATEGY
          </span>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Start rough. Make it clear.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            The Creator does not need a perfect pitch. Mondial helps transform an early idea into a structured project definition.
          </p>
        </div>

        {/* 3-Column Transformation Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Raw Idea (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                RAW IDEA
              </span>
              <blockquote className="font-heading font-semibold text-[20px] sm:text-[22px] text-[#070707] leading-snug border-l-2 border-l-[#3C61DD] pl-3 italic">
                “I want to create something that helps people find unused workspaces.”
              </blockquote>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-[rgba(0,0,0,0.04)]">
              {rawQuestions.map((q) => (
                <div key={q} className="p-2.5 rounded-[10px] bg-[#FAF8FF] text-[12px] text-[#5E5E5E] font-medium">
                  {q}
                </div>
              ))}
            </div>
          </div>

          {/* Center Column: Mondial Engine (3 cols) */}
          <div className="lg:col-span-3 bg-[#FAF8FF] border border-[#3C61DD]/20 rounded-[24px] p-6 flex flex-col items-center justify-between gap-4 shadow-sm">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              MONDIAL ENGINE
            </span>

            <div className="w-full flex flex-col items-center gap-2 py-3">
              {engineSteps.map((step, i) => (
                <div key={step} className="w-full flex flex-col items-center gap-1.5">
                  <div className="w-full max-w-[180px] py-2 px-3 bg-white border border-[rgba(0,0,0,0.06)] rounded-[10px] text-center font-heading font-bold text-[12px] text-[#070707] shadow-xs">
                    {step}
                  </div>
                  {i < engineSteps.length - 1 && <span className="text-[#C4C5D6] text-[12px]">↓</span>}
                </div>
              ))}
            </div>

            <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">Automated Structuring</span>
          </div>

          {/* Right Column: Structured Project (5 cols) */}
          <div className="lg:col-span-5 bg-white border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider block">
                    PROJECT TYPE: MARKETPLACE
                  </span>
                  <h3 className="font-heading font-bold text-[24px] text-[#070707]">NOVA SPACE</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold inline-flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Ready for Definition</span>
                </span>
              </div>

              <div className="flex flex-col gap-3 text-[13px]">
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">ONE-LINE CONCEPT</span>
                  <p className="font-semibold text-[#070707]">Book verified local workspaces by the hour.</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">PROBLEM</span>
                  <p className="text-[#5E5E5E]">
                    Flexible workspaces are difficult to access without subscriptions or long-term commitments.
                  </p>
                </div>
                <div className="p-3 rounded-[12px] bg-[#F1F5FF] border border-[#3C61DD]/20">
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">SOLUTION</span>
                  <p className="text-[#070707] font-medium">
                    A marketplace connecting professionals with verified available workspaces.
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">TARGET CUSTOMER</span>
                  <p className="text-[#5E5E5E]">Independent professionals and small teams.</p>
                </div>
              </div>
            </div>

            <div className="w-full h-1 bg-[#3C61DD] rounded-full" />
          </div>
        </div>

        {/* Statement Banner */}
        <div className="w-full py-6 px-6 sm:px-10 rounded-[18px] bg-white border border-[rgba(0,0,0,0.08)] text-center shadow-xs">
          <span className="font-heading font-bold text-[18px] sm:text-[20px] text-[#070707] uppercase tracking-wide">
            YOU DO NOT NEED A PERFECT IDEA. YOU NEED A CLEARER ONE.
          </span>
        </div>
      </div>
    </section>
  );
}
