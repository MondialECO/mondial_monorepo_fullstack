'use client';

import Image from 'next/image';
import { UserCheck, Code, CheckCircle2, ArrowRight, ShieldCheck, Scale, Palette } from 'lucide-react';

export default function ProfileToOfferSection() {
  const serviceIncludes = [
    'Architecture Review',
    'Booking API Implementation',
    'Database Structure Optimization',
    'Payment Gateway Integration',
    'Technical Documentation Handover',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STRUCTURE WHAT YOU ACTUALLY SELL
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            &ldquo;Developer&rdquo; is a profile.
            <br />
            &ldquo;Backend Integration&rdquo; is an offer.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Clients need to understand what they are buying, what it includes, how it will be delivered and what happens next.
          </p>
        </div>

        {/* 3-Stage Transformation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Stage 01: Identity */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase block">
                  STAGE 01 — IDENTITY
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  WHO IS THE PROVIDER?
                </h3>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC]">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white shadow-xs">
                  <Image
                    src="/provider-public/maya_rahman_portrait.png"
                    alt="Maya Rahman"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">Maya Rahman</h4>
                  <p className="text-[11px] text-[#747685]">Backend Engineer • 6 Yrs Exp</p>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#157A55] flex items-center gap-1.5">
              <ShieldCheck size={14} /> Tier 3 Verified Identity
            </div>
          </div>

          {/* Stage 02: Capability */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase block">
                  STAGE 02 — CAPABILITY
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  WHAT CAN THEY DO?
                </h3>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] font-semibold text-[#1A1B23]">
                  • Backend Architecture
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] font-semibold text-[#1A1B23]">
                  • REST &amp; GraphQL APIs
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] font-semibold text-[#1A1B23]">
                  • Database Design &amp; Optimization
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] font-semibold text-[#1A1B23]">
                  • Payment Integration &amp; Webhooks
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#3C61DD]">Unstructured Skills List</div>
          </div>

          {/* Stage 03: Structured Service */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-[#3C61DD] shadow-md flex flex-col justify-between gap-6 relative">
            <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-[#3C61DD] text-white text-[9px] font-extrabold uppercase">
              STRUCTURED SERVICE
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                  STAGE 03 — STRUCTURED SERVICE
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  Backend Integration for Startup MVPs
                </h3>
                <p className="text-[12px] text-[#444654] mt-1">
                  A fixed-scope engagement to establish your technical foundation.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] text-[#1A1B23]">
                {serviceIncludes.map((inc) => (
                  <div key={inc} className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={12} className="text-[#157A55]" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#F3F2FD] text-[#1A47C3] text-[11px] font-bold text-center">
              Clear Result Ready to Purchase
            </div>
          </div>
        </div>

        {/* Secondary Examples Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                LEGAL PRO EXAMPLE
              </span>
              <h4 className="font-heading font-bold text-[14px] text-[#1A1B23] mt-0.5">
                France Company Formation Review
              </h4>
              <p className="text-[11px] text-[#747685]">
                Structured delivery of company formation expertise.
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-center text-[#1A47C3] shrink-0">
              <Scale size={16} />
            </div>
          </div>

          <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                BRAND DESIGNER EXAMPLE
              </span>
              <h4 className="font-heading font-bold text-[14px] text-[#1A1B23] mt-0.5">
                Startup Brand Identity Package
              </h4>
              <p className="text-[11px] text-[#747685]">
                Structured delivery of brand identity expertise.
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-center text-[#1A47C3] shrink-0">
              <Palette size={16} />
            </div>
          </div>
        </div>

        {/* Section Strategic Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            CLIENTS DO NOT BUY A LIST OF SKILLS. THEY BUY A CLEAR RESULT.
          </h3>
        </div>
      </div>
    </section>
  );
}
