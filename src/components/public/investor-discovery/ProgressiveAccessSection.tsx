'use client';

import { Lock, Unlock, FileText, CheckCircle2, ShieldCheck, ArrowRight, ArrowDown } from 'lucide-react';

export default function ProgressiveAccessSection() {
  const levels = [
    {
      num: 'LEVEL 01',
      title: 'DISCOVERY',
      desc: 'Company Story, Sector, Stage, High-Level Traction, Funding Need, Founder Context',
      badge: 'PUBLIC CONTEXT',
    },
    {
      num: 'LEVEL 02',
      title: 'MUTUAL INTEREST',
      desc: 'Deeper Business Context, Meeting, Initial Questions, Funding Discussion',
      badge: 'INTERACTION',
    },
    {
      num: 'LEVEL 03',
      title: 'ACCESS REQUEST',
      desc: 'Investor requests Deeper Company Information ➔ Founder Decision (Approve / Decline)',
      badge: 'PERMISSION GATE',
    },
    {
      num: 'LEVEL 04',
      title: 'CONTROLLED REVIEW',
      desc: 'NDA Execution, Custom Permissions, Virtual Data Room Unlock',
      badge: 'DILIGENCE',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            PROGRESSIVE INFORMATION ACCESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Interest can unlock the next conversation.
            <br />
            Not every document.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            When an Investor wants to go deeper, Mondial can move the relationship through a controlled access request before confidential diligence information is shared.
          </p>
        </div>

        {/* 4 Progressive Access Levels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levels.map((lvl) => (
            <div
              key={lvl.num}
              className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase">{lvl.num}</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#747685] text-[9px] font-bold">
                    {lvl.badge}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-1">{lvl.title}</h4>
                <p className="text-[12px] text-[#444654] mt-2 leading-relaxed">{lvl.desc}</p>
              </div>

              <div className="p-2 rounded-[8px] bg-white border border-[#E2E1EC] text-[10px] text-[#157A55] font-bold text-center">
                Stage Protocol Enforced
              </div>
            </div>
          ))}
        </div>

        {/* Relationship Equations & Statements */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[12px] font-bold text-[#BA1A1A] max-w-fit">
            INVESTOR INTEREST ≠ AUTOMATIC DATA ACCESS
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">INTEREST</span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
              FOUNDER PERMISSION
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
              APPROPRIATE CONFIDENTIALITY
            </span>
            <span className="text-[#3C61DD]">=</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              DEEPER ACCESS
            </span>
          </div>

          <p className="text-[13px] text-[#444654] max-w-[680px] pt-2">
            THE COMPANY SHOULD KNOW WHO IS REQUESTING ACCESS, WHAT THEY WANT TO REVIEW, AND WHY.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#3C61DD] pt-2">
            <span>REQUEST ACCESS</span>
            <span>➔</span>
            <span>NDA WHEN RELEVANT</span>
            <span>➔</span>
            <span>DILIGENCE &amp; INVEST</span>
          </div>
        </div>
      </div>
    </section>
  );
}
