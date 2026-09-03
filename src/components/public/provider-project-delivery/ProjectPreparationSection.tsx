'use client';

import { Calendar, CheckSquare, FileCheck, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ProjectPreparationSection() {
  const checklist = [
    {
      num: '01',
      title: 'WHEN DOES THE PROJECT START?',
      desc: 'Example: June 20',
      icon: Calendar,
      status: 'Scheduled',
    },
    {
      num: '02',
      title: 'WHAT DOES THE CLIENT NEED TO PROVIDE?',
      desc: 'Access, Files, Requirements, Approver',
      icon: CheckSquare,
      status: 'Collected',
    },
    {
      num: '03',
      title: 'HAS THE AGREEMENT BEEN SIGNED?',
      desc: 'Status: Contract Active',
      icon: FileCheck,
      status: 'Contract Active',
    },
    {
      num: '04',
      title: 'HAS THE PROJECT BEEN FUNDED?',
      desc: 'Status: Escrow Secured',
      icon: ShieldCheck,
      status: 'Escrow Secured',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            AFTER THE PROPOSAL IS ACCEPTED
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            &ldquo;Let’s do it&rdquo; is not the same as
            <br />
            &ldquo;we’re ready to start.&rdquo;
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Booking turns an accepted proposal into practical project preparation — start date, requirements, contract and funding status.
          </p>
        </div>

        {/* Accepted Proposal -> Ready Project Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left State: Accepted Proposal (4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                INITIAL STATE
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                ACCEPTED PROPOSAL
              </h3>
              <p className="font-serif italic text-[14px] text-[#444654] mt-3">
                &ldquo;Commercial intent exists.&rdquo;
              </p>
            </div>
            <div className="text-[11px] text-[#747685]">Terms agreed in principle</div>
          </div>

          {/* Right State: Ready Project (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-[24px] bg-white border-2 border-[#157A55] shadow-md flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#157A55] uppercase block">
                TARGET STATE
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                READY PROJECT
              </h3>
              <p className="font-serif italic text-[14px] text-[#157A55] mt-3">
                &ldquo;Scope agreed, Requirements ready, Contract signed, Funding secured.&rdquo;
              </p>
            </div>
            <div className="text-[11px] font-bold text-[#157A55]">
              ✔ Clear starting conditions established
            </div>
          </div>
        </div>

        {/* Central 4-Item Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {checklist.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.num}
                className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                      {c.num}
                    </span>
                    <Icon size={16} className="text-[#3C61DD]" />
                  </div>
                  <h4 className="font-heading font-bold text-[13px] text-[#1A1B23] leading-snug">
                    {c.title}
                  </h4>
                  <p className="text-[12px] text-[#444654]">{c.desc}</p>
                </div>
                <div className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[10px] font-bold text-[#1A47C3] text-center">
                  {c.status}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            ACCEPTANCE CREATES INTENT. BOOKING CREATES STARTING CONDITIONS.
          </h3>
        </div>
      </div>
    </section>
  );
}
