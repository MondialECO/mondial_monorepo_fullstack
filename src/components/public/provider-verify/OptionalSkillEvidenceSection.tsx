'use client';

import { Award, Briefcase, CheckCircle2, FileText, ArrowRight, Clock } from 'lucide-react';

export default function OptionalSkillEvidenceSection() {
  const equation = [
    'SKILLS TEST',
    'REAL WORK',
    'PROFESSIONAL EVIDENCE',
    'DELIVERY HISTORY',
  ];

  const testPath = [
    'SELECT TEST',
    'COMPLETE ASSESSMENT',
    'PASS 70%+',
    'PROFILE SIGNAL',
    'POTENTIAL TIER SUPPORT',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            SECTION 06 / OPTIONAL SKILL EVIDENCE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A test can add confidence.
            <br />
            It should not replace real work.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Category-based Skills Tests can strengthen a Provider’s professional evidence and support tier progression alongside experience, portfolio and client outcomes.
          </p>
        </div>

        {/* Central Visual Constellation */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-10">
          {/* Central Score Circle */}
          <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] rounded-full bg-white border-4 border-[#3C61DD]/30 shadow-md flex flex-col items-center justify-center text-center p-4">
            <span className="text-[48px] sm:text-[60px] font-heading font-extrabold text-[#1A1B23] leading-none">
              92%
            </span>
            <span className="text-[11px] font-bold text-[#1A47C3] uppercase tracking-wider mt-1">
              LEGAL KNOWLEDGE
            </span>
            <span className="text-[9px] text-[#747685] uppercase mt-0.5">
              ILLUSTRATIVE TEST RESULT
            </span>
          </div>

          {/* 4 Satellite Cards Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Credentials */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.04)]">
                <Award size={16} className="text-[#3C61DD]" />
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">Credentials</h4>
              </div>
              <div className="space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#747685]">Bar Association ID</span>
                  <span className="font-semibold text-[#1A1B23]">#NY-48291</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#747685]">Juris Doctor (JD)</span>
                  <span className="font-semibold text-[#157A55]">Verified</span>
                </div>
              </div>
            </div>

            {/* Portfolio */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.04)]">
                <FileText size={16} className="text-[#3C61DD]" />
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">Portfolio</h4>
              </div>
              <div className="space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#747685]">Complex Litigation</span>
                  <span className="font-bold text-[#3C61DD]">4 Cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#747685]">IP Strategy</span>
                  <span className="font-bold text-[#3C61DD]">7 Cases</span>
                </div>
              </div>
            </div>

            {/* Project History */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.04)]">
                <Briefcase size={16} className="text-[#3C61DD]" />
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">
                  Project History
                </h4>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-heading font-extrabold text-[#1A1B23]">47</span>
                <span className="text-[12px] text-[#747685]">Successful Closures</span>
              </div>
            </div>

            {/* Client Outcomes */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.04)]">
                <CheckCircle2 size={16} className="text-[#157A55]" />
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">
                  Client Outcomes
                </h4>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-heading font-extrabold text-[#157A55]">98%</span>
                <span className="text-[12px] text-[#747685]">Satisfaction Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* The Trust Equation */}
        <div className="p-5 sm:p-6 rounded-[22px] bg-white border border-[#E2E1EC] shadow-xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
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
          <span className="px-4 py-1.5 rounded-[8px] bg-[#DCE1FF] text-[#1A47C3]">
            STRONGER TRUST CONTEXT
          </span>
        </div>

        {/* Test Path Flow */}
        <div className="p-5 sm:p-6 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {testPath.map((step, idx) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-[6px] bg-white border border-[#E2E1EC]">
                  {step}
                </span>
                {idx < testPath.length - 1 && <span className="text-[#3C61DD]">➔</span>}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-[#747685] pt-2 border-t border-[rgba(0,0,0,0.06)]">
            <span>Skills Test is optional but recommended where available.</span>
            <span>Re-test: after 30 days.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
