'use client';

import { Lock, Sliders, Eye, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CompanyPrivacyControlSection() {
  const privateItems = [
    'Registration Documents',
    'Bank Documents',
    'Identity Records',
    'Verification Evidence',
    'Financial Verification',
  ];

  const controlItems = [
    'Public Profile',
    'Marketplace Visibility',
    'Team Permissions',
    'Data Room Access',
    'Investor Access',
    'Document Sharing',
  ];

  const sharedItems = [
    'Company Name',
    'Business Activity',
    'Verification Status',
    'Public Company Profile',
    'Selected Project Information',
    'Investor Materials',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            TRUST WITHOUT OVEREXPOSURE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Verified does not mean everything becomes public.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Company verification, public company information and investor-access information should remain clearly separated.
          </p>
        </div>

        {/* 3-Column Privacy Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: Private Verification Data */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <Lock size={18} className="text-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  PRIVATE VERIFICATION DATA
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {privateItems.map((item) => (
                  <div
                    key={item}
                    className="p-3 rounded-[10px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.04)] flex items-center justify-between"
                  >
                    <span className="text-[#1A1B23] font-medium">{item}</span>
                    <Lock size={13} className="text-[#8A8B8F]" />
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#8A8B8F]">Only accessed for compliance &amp; verification</span>
          </div>

          {/* Column 2: Company Controls */}
          <div className="bg-[#FAF8FF] border-2 border-[#3C61DD]/30 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <Sliders size={18} className="text-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  COMPANY CONTROLS
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {controlItems.map((item) => (
                  <div
                    key={item}
                    className="p-3 rounded-[10px] bg-white border border-[#3C61DD]/20 flex items-center justify-between shadow-2xs"
                  >
                    <span className="text-[#1A1B23] font-medium">{item}</span>
                    <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#3C61DD] font-medium">
              Granular visibility &amp; access permissions
            </span>
          </div>

          {/* Column 3: Visible / Shared Context */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-[#00A854]" />
                  <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                    VISIBLE / SHARED CONTEXT
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#E8F8EE] text-[#00A854] text-[9px] font-bold uppercase">
                  ONLY WHEN PERMITTED
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {sharedItems.map((item) => (
                  <div
                    key={item}
                    className="p-3 rounded-[10px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.04)] flex items-center justify-between"
                  >
                    <span className="text-[#1A1B23] font-medium">{item}</span>
                    <CheckCircle2 size={13} className="text-[#00A854]" />
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#8A8B8F]">Shared only upon explicit approval</span>
          </div>
        </div>

        {/* Privacy Transformation Example Card */}
        <div className="p-6 rounded-[20px] bg-white border border-[#E2E1EC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs text-[13px]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">
              TRANSFORMATION EXAMPLE
            </span>
            <div className="flex flex-wrap items-center gap-2 font-medium text-[#1A1B23]">
              <span className="px-2.5 py-1 rounded-[6px] bg-[#FAF8FF] border border-[#E2E1EC]">
                Private: KBIS Document (Not Automatically Public)
              </span>
              <span className="text-[#3C61DD]">➔ Controls ➔</span>
              <span className="px-2.5 py-1 rounded-[6px] bg-[#E8F8EE] text-[#00A854] font-bold border border-[#00A854]/20">
                Public Signal: Company Verified Badge
              </span>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="w-full py-5 px-6 rounded-[18px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-bold text-[15px] sm:text-[17px] text-[#070707] uppercase tracking-wide">
            VERIFICATION CREATES TRUST. PERMISSIONS CONTROL ACCESS.
          </span>
        </div>
      </div>
    </section>
  );
}
