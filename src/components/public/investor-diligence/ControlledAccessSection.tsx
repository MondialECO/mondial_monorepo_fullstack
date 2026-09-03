'use client';

import { Lock, Unlock, ShieldCheck, CheckCircle2, UserCheck, FileText, ArrowRight } from 'lucide-react';

export default function ControlledAccessSection() {
  const staircase = [
    {
      lvl: 'Lvl 01',
      title: 'Discovery',
      desc: 'Company Story, Sector, Stage, Funding Need, High-Level Traction, Founder Context',
    },
    {
      lvl: 'Lvl 02',
      title: 'Mutual Interest',
      desc: 'Deeper Business Context, Founder Conversation, Clarifying Questions',
    },
    {
      lvl: 'Lvl 03',
      title: 'Access Request',
      desc: 'Investor asks to review sensitive company information.',
    },
    {
      lvl: 'GATE',
      title: 'FOUNDER APPROVAL',
      desc: 'Central decision gate: Founder verifies access context before approval.',
      isGate: true,
    },
    {
      lvl: 'Lvl 04',
      title: 'Confidentiality Gate',
      desc: 'NDA where required by the Mondial process or agreed by the parties.',
    },
    {
      lvl: 'Lvl 05',
      title: 'Controlled Data Room Access',
      desc: 'Full review environment with granular permissions.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CONTROLLED ACCESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Going deeper should
            <br />
            not mean opening everything at once.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can move sensitive company information through progressive access so Founders know who is reviewing what and under which confidentiality conditions.
          </p>
        </div>

        {/* Staircase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staircase.map((st) => (
            <div
              key={st.title}
              className={`p-6 rounded-[24px] border shadow-2xs flex flex-col justify-between gap-3 ${
                st.isGate
                  ? 'bg-white border-2 border-[#157A55] shadow-sm'
                  : 'bg-white border-[#E2E1EC]'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded max-w-fit block ${
                    st.isGate
                      ? 'bg-[#E8F8EE] text-[#157A55]'
                      : 'bg-[#FAF8FF] text-[#3C61DD]'
                  }`}
                >
                  {st.lvl}
                </span>
                <h3 className="font-heading font-bold text-[17px] text-[#1A1B23] mt-2">
                  {st.title}
                </h3>
                <p className="text-[12px] text-[#444654] mt-1 leading-relaxed">{st.desc}</p>
              </div>

              {st.isGate ? (
                <div className="text-[10px] text-[#157A55] font-bold">Explicit Gate Enforced</div>
              ) : (
                <div className="text-[10px] text-[#747685]">Progressive Context</div>
              )}
            </div>
          ))}
        </div>

        {/* Access Profile & Disclaimers Dual Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Access Profile Card (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              ACCESS PROFILE
            </span>

            <div className="space-y-3 text-[12px]">
              <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                <strong className="text-[#1A1B23] block">WHO:</strong>
                <span className="text-[#444654]">Investor / Advisor / Team Member</span>
              </div>
              <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                <strong className="text-[#1A1B23] block">CAN ACCESS:</strong>
                <span className="text-[#444654]">Specific Information (Document-Level Permissions)</span>
              </div>
              <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                <strong className="text-[#1A1B23] block">FOR:</strong>
                <span className="text-[#444654]">A Defined Review Purpose</span>
              </div>
            </div>
          </div>

          {/* Access Protocol & Disclaimers (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                ACCESS PROTOCOL
              </span>

              <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px] font-bold text-[#1A1B23]">
                <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC]">
                  Investor Interest
                </span>
                <span className="text-[#3C61DD]">+</span>
                <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC]">
                  Founder Permission
                </span>
                <span className="text-[#3C61DD]">+</span>
                <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC]">
                  Appropriate Confidentiality
                </span>
                <span className="text-[#3C61DD]">=</span>
                <span className="px-3 py-1 rounded bg-[#1A47C3] text-white">
                  Deeper Access
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-[rgba(0,0,0,0.06)] text-[11px] font-bold">
              <span className="text-[#BA1A1A]">NDA ≠ Investment Commitment</span>
              <span className="text-[#BA1A1A]">Data Room Access ≠ Investment Approval</span>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            ACCESS SHOULD EXPAND WITH THE RELATIONSHIP.
            <br />
            NOT WITH CURIOSITY ALONE.
          </h3>
        </div>
      </div>
    </section>
  );
}
