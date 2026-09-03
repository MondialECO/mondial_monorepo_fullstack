'use client';

import { Layers, Clock, DollarSign, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DeliveryWorkflowSection() {
  const sharedItems = [
    'Contract Terms',
    'Project Files',
    'Direct Messages',
    'Deliverable Artifacts',
    'Milestones or Time Tracking',
    'Escrow Payment Status',
  ];

  return (
    <section
      id="section-07-delivery-workflow"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            DELIVERY SHOULD FOLLOW THE AGREEMENT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Different pricing models
            <br />
            need different ways to work.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Once a project is active, the delivery process should reflect how the engagement was originally structured.
          </p>
        </div>

        {/* Shared Context + 4 Workflow Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Shared Context Sidebar (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                ACTIVE WORKROOM CONTEXT
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                Shared Project Artifacts
              </h3>

              <div className="space-y-2 text-[12px]">
                {sharedItems.map((item) => (
                  <div
                    key={item}
                    className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] font-semibold text-[#1A1B23] flex items-center gap-2"
                  >
                    <CheckCircle2 size={13} className="text-[#3C61DD]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#747685]">
              Regardless of the model, these core components remain persistently connected to the workspace.
            </p>
          </div>

          {/* 4 Models (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model 01: Fixed Price */}
            <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">MODEL 01</span>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-0.5">
                  Fixed Price
                </h4>
                <p className="text-[11px] text-[#747685] mt-1">Single outcome engagement</p>
              </div>

              <div className="space-y-1 text-[11px] font-bold text-[#1A1B23]">
                <div className="p-2 rounded bg-[#FAF8FF]">01. Work Execution</div>
                <div className="p-2 rounded bg-[#FAF8FF]">02. Submit Deliverable</div>
                <div className="p-2 rounded bg-[#FAF8FF]">03. Client Review</div>
                <div className="p-2 rounded bg-[#E8F8EE] text-[#157A55]">04. Approval &amp; Release</div>
              </div>
            </div>

            {/* Model 02: Hourly */}
            <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">MODEL 02</span>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-0.5">
                  Hourly Tracking
                </h4>
                <p className="text-[11px] text-[#747685] mt-1">Flexible specialist effort</p>
              </div>

              <div className="space-y-1 text-[11px] font-bold text-[#1A1B23]">
                <div className="p-2 rounded bg-[#FAF8FF]">01. Work Session</div>
                <div className="p-2 rounded bg-[#FAF8FF]">02. Track Activity</div>
                <div className="p-2 rounded bg-[#FAF8FF]">03. Weekly Timesheet</div>
                <div className="p-2 rounded bg-[#E8F8EE] text-[#157A55]">04. Client Review &amp; Approve</div>
              </div>
            </div>

            {/* Model 03: Milestone-Based */}
            <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">MODEL 03</span>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-0.5">
                  Milestone-Based
                </h4>
                <p className="text-[11px] text-[#747685] mt-1">Sequential stage releases</p>
              </div>

              <div className="space-y-1 text-[11px] font-bold text-[#1A1B23]">
                <div className="p-2 rounded bg-[#E8F8EE] text-[#157A55]">M1: Architecture (Approved)</div>
                <div className="p-2 rounded bg-[#FAF8FF]">M2: Booking Backend (Active)</div>
                <div className="p-2 rounded bg-[#FAF8FF] text-[#747685]">M3: Payment &amp; Test (Pending)</div>
              </div>
            </div>

            {/* Model 04: Monthly Retainer */}
            <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">MODEL 04</span>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-0.5">
                  Monthly Retainer
                </h4>
                <p className="text-[11px] text-[#747685] mt-1">Ongoing fractional partnership</p>
              </div>

              <div className="space-y-1 text-[11px] font-bold text-[#1A1B23]">
                <div className="p-2 rounded bg-[#FAF8FF]">01. Ongoing Specialist Support</div>
                <div className="p-2 rounded bg-[#FAF8FF]">02. Month-End Review</div>
                <div className="p-2 rounded bg-[#E8F8EE] text-[#157A55]">03. Continue or Adjust Scope</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE WORKROOM SHOULD ADAPT TO THE COMMERCIAL MODEL.
            <br />
            NOT FORCE EVERY PROJECT INTO THE SAME WORKFLOW.
          </h3>
        </div>
      </div>
    </section>
  );
}
