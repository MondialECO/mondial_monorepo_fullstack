'use client';

import Link from 'next/link';
import { CheckCircle2, FileText, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function IdentityCompletionSection() {
  const checklist = [
    'Email Verification',
    'Phone Verification',
    'Identity Verification',
    'Liveness Check',
    'Creator Profile Created',
  ];

  const questions = [
    {
      num: '1',
      q: 'What is the project called?',
      desc: 'Working title or finalized name.',
    },
    {
      num: '2',
      q: 'What problem are you solving?',
      desc: 'Define the specific pain point.',
    },
    {
      num: '3',
      q: 'What is the proposed solution?',
      desc: 'Your unique approach or technology.',
    },
    {
      num: '4',
      q: 'Who is the target customer?',
      desc: 'Primary user demographics or profiles.',
    },
    {
      num: '5',
      q: 'What is the one-line concept?',
      desc: 'A concise, impactful elevator pitch for the project.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-12 sm:gap-16">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 08</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">PHASE 01 COMPLETE</span>
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            You are verified. Now define what you are building.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Identity verification is complete. Start structuring your project.
          </p>
        </div>

        {/* Verification Success Main Box */}
        <div className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-8 shadow-sm">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#3C61DD] text-white flex items-center justify-center font-heading font-bold text-[18px]">
                H
              </div>
              <div>
                <h3 className="font-heading font-bold text-[18px] text-[#070707]">Henry</h3>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#00A854]">
                  <CheckCircle2 size={15} />
                  <span>VERIFIED CREATOR</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#5E5E5E]">Phase 01 Progress:</span>
                <span className="font-bold text-[#00A854]">100%</span>
              </div>
              <div className="w-36 sm:w-44 h-2 rounded-full bg-[#EDEDED] overflow-hidden">
                <div className="w-full h-full bg-[#00A854]" />
              </div>
            </div>
          </div>

          {/* Split Checklist & Output */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Checklist (6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                VERIFICATION CHECKLIST
              </span>
              <div className="flex flex-col gap-2.5 text-[13px]">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-[#070707] font-medium">
                    <CheckCircle2 size={16} className="text-[#00A854]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Output Box (6 cols) */}
            <div className="lg:col-span-6 p-6 rounded-[20px] bg-[#F1F5FF] border border-[#3C61DD]/30 flex flex-col items-start gap-4">
              <div className="flex items-center gap-2 text-[#3C61DD]">
                <ShieldCheck size={20} />
                <span className="font-heading font-bold text-[14px] uppercase tracking-wider text-[#070707]">
                  PRIMARY OUTPUT GENERATED
                </span>
              </div>
              <div className="w-full p-3.5 rounded-[12px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center gap-2.5 text-[14px] font-semibold text-[#3C61DD] shadow-xs">
                <FileText size={18} />
                <span>Verified Creator Profile, PHASE 01</span>
              </div>
            </div>
          </div>
        </div>

        {/* What Comes Next Preview Card */}
        <div className="w-full bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-10 flex flex-col gap-8 shadow-xs">
          {/* Card Header */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
              NEXT PAGE | CREATOR PAGE 03
            </span>
            <h3 className="text-[28px] sm:text-[36px] font-heading font-bold text-[#070707]">
              Project Identity &amp; Concept
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#5E5E5E] max-w-[720px]">
              Now that your identity is verified, Phase 02 begins. You will structure the foundational concept of your project.
            </p>
          </div>

          {/* Key Questions to Prepare */}
          <div className="bg-white rounded-[18px] p-6 border border-[rgba(0,0,0,0.06)] flex flex-col gap-4 shadow-xs">
            <span className="text-[12px] font-bold text-[#070707] uppercase tracking-wider">
              Key Questions to Prepare:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div key={q.num} className="p-3.5 rounded-[12px] bg-[#F9F9FA] flex items-start gap-3 text-[13px]">
                  <span className="w-6 h-6 rounded-full bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center font-bold text-[11px] shrink-0">
                    {q.num}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#070707]">{q.q}</span>
                    <span className="text-[12px] text-[#5E5E5E]">{q.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <Link
              href="/for-creators"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#F1F1F2] border border-[rgba(0,0,0,0.08)] text-[#070707] font-medium text-[14px] rounded-[10px] transition-colors shadow-xs"
            >
              <ArrowLeft size={16} />
              <span>Back to Creator Path</span>
            </Link>

            <Link
              href="/for-creators/project-identity-concept"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[14px] rounded-[10px] transition-all shadow-sm group"
            >
              <span>Next: Project Identity &amp; Concept</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
