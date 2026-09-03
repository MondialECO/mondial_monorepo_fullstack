'use client';

import { AlertTriangle, Clock, ShieldCheck, Scale, ArrowRight, FileText } from 'lucide-react';

export default function DisputeResolutionSection() {
  const steps = [
    { num: '01', title: 'START: DISAGREEMENT', desc: 'Deliverable contested against scope.' },
    { num: '02', title: 'DISPUTE OPENED', desc: 'Formal mediation initiated on-platform.' },
    { num: '03', title: 'EVIDENCE SUBMITTED', desc: 'Contract, briefs and files recorded.' },
    { num: '04', title: 'COUNTERPARTY RESPONDS', desc: '48H response and documentation window.' },
    { num: '05', title: 'MONDIAL REVIEW', desc: 'Neutral assessment of agreed deliverables.' },
    { num: '06', title: 'RESOLUTION', desc: 'Binding outcome executed in escrow.' },
  ];

  const resolutionTypes = [
    { title: 'FULL RELEASE', desc: 'Funds released to Provider upon verified scope completion.' },
    { title: 'PARTIAL RELEASE', desc: 'Proportional payment for verified milestone progress.' },
    { title: 'REFUND', desc: 'Full return of escrow to client for unfulfilled agreement.' },
    { title: 'SPLIT', desc: 'Equitable division reflecting partial contributions.' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#BA1A1A] uppercase tracking-wider">
            WHEN THE PROJECT NEEDS REVIEW
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Not every disagreement
            <br />
            should become chaos.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            If a delivery dispute cannot be resolved through normal project review, Mondial provides a structured process for both sides to submit context and evidence.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-[16px] bg-red-50 border border-red-200 text-[#BA1A1A] text-[12px] font-bold flex items-center gap-2.5">
          <AlertTriangle size={16} className="shrink-0" />
          <span>DIRECT PROJECT COMMUNICATION PAUSES DURING FORMAL DISPUTE REVIEW.</span>
        </div>

        {/* 6-Step Dispute Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((st) => (
            <div
              key={st.num}
              className="p-5 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
            >
              <span className="text-[10px] font-bold text-[#BA1A1A] uppercase">{st.num}</span>
              <div>
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">{st.title}</h4>
                <p className="text-[12px] text-[#747685] mt-0.5">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Banner */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-4 text-[12px] text-[#1A1B23]">
          <div className="flex items-center gap-2 font-bold">
            <Clock size={16} className="text-[#3C61DD]" />
            <span>DISPUTE OPEN ➔ 48H EVIDENCE WINDOW ➔ RESPONSE ➔ REVIEW</span>
          </div>
          <span className="px-3 py-1 rounded bg-white border border-[#E2E1EC] font-bold text-[#1A47C3]">
            TARGET RESOLUTION: UP TO 5 BUSINESS DAYS
          </span>
        </div>

        {/* 4 Resolution Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resolutionTypes.map((res) => (
            <div
              key={res.title}
              className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-2"
            >
              <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">{res.title}</h4>
              <p className="text-[12px] text-[#444654]">{res.desc}</p>
            </div>
          ))}
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE GOAL IS NOT TO REMOVE DISAGREEMENT.
            <br />
            IT IS TO GIVE DISAGREEMENT A STRUCTURED PROCESS.
          </h3>
          <p className="text-[13px] text-[#444654] font-medium">
            Outcomes depend on the project agreement, evidence and review context.
          </p>
        </div>
      </div>
    </section>
  );
}
