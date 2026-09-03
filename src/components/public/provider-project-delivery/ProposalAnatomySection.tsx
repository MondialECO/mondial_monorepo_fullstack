'use client';

import { FileText, Clock, DollarSign, Layers, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ProposalAnatomySection() {
  const anatomy = [
    { num: '01', title: 'SCOPE', desc: 'Booking logic, API architecture, Database structure', icon: FileText },
    { num: '02', title: 'DELIVERABLES', desc: 'Booking API, Payment integration, Technical documentation', icon: CheckCircle2 },
    { num: '03', title: 'TIMELINE', desc: '4 weeks estimated execution', icon: Clock },
    { num: '04', title: 'PRICING', desc: 'Custom project quote with clear terms', icon: DollarSign },
    { num: '05', title: 'MILESTONES', desc: 'Architecture, Backend implementation, Transaction testing', icon: Layers },
    { num: '06', title: 'ADD-ONS', desc: 'Priority support, Extended documentation', icon: Plus },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FROM INTEREST TO SCOPE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A conversation becomes useful
            <br />
            when the work becomes clear.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A proposal gives both sides a structured view of what will be delivered, how long it may take and what the engagement may cost.
          </p>
        </div>

        {/* Illustrative Proposal Box */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgba(0,0,0,0.06)]">
            <div>
              <span className="px-3 py-1 rounded bg-[#F3F2FD] text-[#1A47C3] text-[10px] font-extrabold uppercase">
                ILLUSTRATIVE PROPOSAL
              </span>
              <h3 className="font-heading font-bold text-[18px] sm:text-[22px] text-[#1A1B23] mt-2">
                BACKEND INTEGRATION FOR NOVA SPACE MVP
              </h3>
            </div>
            <span className="text-[11px] text-[#747685]">Structured Engagement View</span>
          </div>

          {/* 6-Part Anatomy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {anatomy.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                      {item.num} {item.title}
                    </span>
                    <Icon size={16} className="text-[#3C61DD]" />
                  </div>
                  <p className="text-[12px] font-medium text-[#1A1B23]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Transformation & Equation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Transformation (6 cols) */}
          <div className="lg:col-span-6 p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              SERVICE TRANSFORMATION
            </span>

            <div className="flex items-center justify-between gap-3 p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px]">
              <div>
                <span className="text-[10px] text-[#747685] block">EXISTING SERVICE</span>
                <span className="font-bold text-[#1A1B23]">Standard Backend Package</span>
              </div>
              <span className="text-[#3C61DD] font-bold">➔</span>
              <div>
                <span className="text-[10px] text-[#3C61DD] block">CUSTOMIZED PROPOSAL</span>
                <span className="font-bold text-[#1A47C3]">Adjusted to client context</span>
              </div>
            </div>
          </div>

          {/* Proposal Equation (6 cols) */}
          <div className="lg:col-span-6 p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PROPOSAL EQUATION
            </span>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-bold text-[#1A1B23]">
              <span>CLIENT NEED</span>
              <span className="text-[#3C61DD]">+</span>
              <span>OFFER</span>
              <span className="text-[#3C61DD]">+</span>
              <span>CONTEXT</span>
              <span className="text-[#3C61DD]">=</span>
              <span className="px-2.5 py-1 rounded bg-[#1A47C3] text-white">PROPOSAL</span>
            </div>
          </div>
        </div>

        {/* Core Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE SERVICE EXPLAINS WHAT YOU OFFER.
            <br />
            THE PROPOSAL EXPLAINS WHAT YOU WILL DO FOR THIS CLIENT.
          </h3>
        </div>
      </div>
    </section>
  );
}
