'use client';

import { AlertCircle, CheckCircle2, Clock, Play, Pause, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ClientRequirementsSection() {
  const requirements = [
    'Upload existing brand assets',
    'Provide API documentation',
    'Confirm legal entity information',
    'Share project references',
    'Name the final approver',
  ];

  const benefits = [
    'Scope confusion',
    'Missing assets',
    'Repeated clarification',
    'Delivery delays',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            CLEAR INPUTS. CLEARER DELIVERY.
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The project should not start
            <br />
            before the Provider has what they need.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial lets Providers define client requirements in advance so scope, files, access and essential information are collected before delivery begins.
          </p>
        </div>

        {/* Core Logic Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between text-[13px] font-bold text-[#BA1A1A]">
            <span>BOOKING</span>
            <span>≠</span>
            <span>READY TO START</span>
          </div>

          <div className="p-4 rounded-[16px] bg-[#E8F8EE] border border-[#157A55]/30 flex items-center justify-between text-[13px] font-bold text-[#157A55]">
            <span>BOOKING + REQUIRED INPUTS</span>
            <span>=</span>
            <span>READY TO START</span>
          </div>
        </div>

        {/* Before vs Solution vs After Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Before: Missing Info */}
          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#BA1A1A] uppercase">
                  BEFORE — UNSTRUCTURED
                </span>
                <Pause size={16} className="text-[#BA1A1A]" />
              </div>

              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                Order Confirmed
              </h3>
              <p className="text-[12px] text-[#747685]">
                Information is missing or ambiguous. Delivery cannot proceed.
              </p>

              <div className="space-y-1.5 pt-2 text-[11px] text-[#BA1A1A]">
                <div>✗ Missing brand assets</div>
                <div>✗ Incomplete technical access</div>
                <div>✗ Unconfirmed legal entity</div>
                <div>✗ No final approver identified</div>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-red-50 text-[#BA1A1A] text-[11px] font-bold flex items-center gap-2">
              <Clock size={14} /> Project Clock Paused
            </div>
          </div>

          {/* Solution: Client Requirements */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-[#3C61DD] shadow-md flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                SOLUTION — STRUCTURED ONBOARDING
              </span>

              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                Client Requirements Checklist
              </h3>

              <div className="space-y-2 pt-2 text-[12px]">
                {requirements.map((req) => (
                  <div key={req} className="flex items-center gap-2 text-[#1A1B23]">
                    <CheckCircle2 size={14} className="text-[#3C61DD] shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F3F2FD] text-[#1A47C3] text-[11px] font-bold text-center">
              Clear Inputs Before Work Commences
            </div>
          </div>

          {/* After: Delivery Starts */}
          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#157A55] uppercase">
                  AFTER — READY TO DELIVER
                </span>
                <Play size={16} className="text-[#157A55]" />
              </div>

              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                Scope Confirmed
              </h3>
              <p className="text-[12px] text-[#747685]">
                All assets and access validated. Production begins with confidence.
              </p>

              <div className="space-y-1.5 pt-2 text-[11px] text-[#157A55]">
                <div>✔ Requirements Complete</div>
                <div>✔ Scope Validated</div>
                <div>✔ Approver Connected</div>
                <div>✔ Milestones Scheduled</div>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#E8F8EE] text-[#157A55] text-[11px] font-bold flex items-center gap-2">
              <Play size={14} /> Delivery Clock Starts
            </div>
          </div>
        </div>

        {/* Reduces & Section Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-5">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            CLEAR REQUIREMENTS REDUCE:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {benefits.map((b) => (
              <div
                key={b}
                className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-center font-bold text-[12px] text-[#BA1A1A]"
              >
                ↓ {b}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] text-center">
            <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
              STARTING FASTER IS NOT ALWAYS STARTING BETTER.
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
