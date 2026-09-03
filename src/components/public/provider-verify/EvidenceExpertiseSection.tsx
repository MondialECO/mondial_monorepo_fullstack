'use client';

import { Github, Globe, FileText, Award, Clock, Scale, ArrowRight, ShieldCheck } from 'lucide-react';

export default function EvidenceExpertiseSection() {
  const backendEvidence = [
    { title: 'GITHUB', desc: 'Public technical work', icon: Github },
    { title: 'LIVE PROJECTS', desc: 'Products that can be reviewed', icon: Globe },
    { title: 'CASE STUDIES', desc: 'Context and contribution', icon: FileText },
    { title: 'CERTIFICATIONS', desc: 'Where relevant', icon: Award },
    { title: 'EXPERIENCE', desc: 'Years & context', icon: Clock },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            EVIDENCE BEHIND THE CLAIM
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Trust gets stronger when
            <br />
            expertise has evidence.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Professional claims can be supported by licences, certifications, work samples, public portfolios, project history or other category-relevant proof.
          </p>
        </div>

        {/* Visual Equation */}
        <div className="p-4 sm:p-5 rounded-[18px] bg-[#F3F2FD] border border-[#E2E1EC] flex flex-wrap items-center justify-center gap-3 text-[13px] font-bold text-[#1A1B23]">
          <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">CLAIM</span>
          <span className="text-[#3C61DD]">+</span>
          <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
            EVIDENCE
          </span>
          <span className="text-[#3C61DD]">➔</span>
          <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
            REVIEWABLE PROFESSIONAL CONTEXT
          </span>
        </div>

        {/* Backend Engineer Evidence Architecture */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-8">
          {/* Central Claim */}
          <div className="p-5 rounded-[20px] bg-white border-2 border-[#3C61DD]/30 text-center flex flex-col items-center gap-1 shadow-sm max-w-[340px]">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              PROFESSIONAL CLAIM
            </span>
            <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23]">
              Backend Engineer
            </h3>
          </div>

          {/* Evidence Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {backendEvidence.map((ev) => {
              const Icon = ev.icon;
              return (
                <div
                  key={ev.title}
                  className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-[8px] bg-[#FAF8FF] flex items-center justify-center text-[#1A47C3]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">{ev.title}</h4>
                    <p className="text-[11px] text-[#747685] mt-0.5">{ev.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alternative Application: Legal Professional */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-4">
          <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
            ALTERNATIVE APPLICATION
          </span>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1">
              <span className="text-[9px] font-bold text-[#747685] uppercase">
                PROFESSIONAL CLAIM
              </span>
              <h4 className="font-heading font-extrabold text-[18px] text-[#1A1B23]">
                Legal Professional
              </h4>
            </div>

            <div className="md:col-span-4 space-y-1.5 text-[13px] text-[#444654]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3]" />
                <span>Bar Number</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3]" />
                <span>Jurisdiction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3]" />
                <span>Firm Information</span>
              </div>
            </div>

            <div className="md:col-span-4 p-4 rounded-[16px] bg-[#E8F8EE] border border-[#157A55]/30 flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#157A55]" />
              <span className="font-heading font-bold text-[14px] text-[#157A55]">
                Professional Verification Context
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Statement */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            NOT EVERY PIECE OF EVIDENCE HAS THE SAME MEANING.
          </h3>
          <p className="text-[13px] text-[#444654] font-medium">
            MONDIAL SHOULD ASK FOR WHAT MATTERS TO THE CATEGORY.
          </p>
        </div>
      </div>
    </section>
  );
}
