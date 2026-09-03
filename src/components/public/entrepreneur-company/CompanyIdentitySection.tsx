'use client';

import { Building2, User, Globe, CheckCircle2, Shield, FileText, Link as LinkIcon } from 'lucide-react';

export default function CompanyIdentitySection() {
  const navItems = [
    { name: 'Company Overview', active: true },
    { name: 'Legal Identity' },
    { name: 'Registration' },
    { name: 'Representatives' },
    { name: 'Operating Activity' },
    { name: 'Business Address' },
    { name: 'Bank Information' },
    { name: 'Compliance' },
    { name: 'Verification Status' },
  ];

  const legalFields = [
    { label: 'LEGAL NAME', value: 'Nova Space SAS' },
    { label: 'PROJECT / TRADING NAME', value: 'Nova Space' },
    { label: 'COUNTRY', value: 'France' },
    { label: 'LEGAL FORM', value: 'SAS' },
    { label: 'REGISTERED ADDRESS', value: 'Paris, France' },
    { label: 'REGISTRATION NUMBER', value: '123 456 789' },
    { label: 'BUSINESS ACTIVITY', value: 'Flexible Workspace Marketplace' },
    { label: 'WEBSITE', value: 'novaspace.example' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            ORGANIZATION &amp; IDENTITY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            One company. One structured record.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Company Identity connects legal information, operating context and the Entrepreneur profile in one consistent company record.
          </p>
        </div>

        {/* Company Identity Workspace Mockup */}
        <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-[#F3F2FD]/60 border-b lg:border-b-0 lg:border-r border-[#E2E1EC] p-5 sm:p-6 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider mb-2 block">
              COMPANY NAVIGATION
            </span>
            {navItems.map((item) => (
              <div
                key={item.name}
                className={`p-2.5 rounded-[10px] text-[13px] transition-colors ${
                  item.active
                    ? 'bg-white border border-[#3C61DD]/30 font-bold text-[#3C61DD] shadow-2xs'
                    : 'text-[#444654] hover:bg-white/50'
                }`}
              >
                {item.name}
              </div>
            ))}
          </div>

          {/* Right Main Content (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col gap-6 bg-white">
            {/* Top Identity Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)] gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#3C61DD] text-white flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">Nova Space SAS</h3>
                  <span className="text-[12px] text-[#444654]">Legal Company Record</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-[6px] bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold uppercase">
                  ACTIVE
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-amber-50 text-amber-700 text-[11px] font-bold uppercase border border-amber-200">
                  IN PROGRESS
                </span>
              </div>
            </div>

            {/* Legal Information Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
              {legalFields.map((f) => (
                <div key={f.label} className="p-3 rounded-[10px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.04)] flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">{f.label}</span>
                  <span className="font-semibold text-[#1A1B23]">{f.value}</span>
                </div>
              ))}
            </div>

            {/* Identity Relationship Box */}
            <div className="p-4 rounded-[16px] bg-[#F1F5FF] border border-[#3C61DD]/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[12px] font-bold text-[#3C61DD]">
                <LinkIcon size={14} />
                <span className="uppercase">IDENTITY RELATIONSHIP</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#1A1B23]">
                <span>PROJECT IDENTITY: Nova Space</span>
                <span className="text-[#3C61DD]">⟷</span>
                <span>LEGAL COMPANY IDENTITY: Nova Space SAS</span>
              </div>
              <p className="text-[11px] text-[#444654] italic">
                “A project identity and legal company identity may be related without being identical.”
              </p>
            </div>

            {/* Primary Representative Box */}
            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.06)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E2E1EC] flex items-center justify-center text-[#1A1B23]">
                  <User size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    PRIMARY REPRESENTATIVE
                  </span>
                  <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">Henry Martin</h4>
                  <span className="text-[11px] text-[#444654]">President</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold uppercase inline-flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>VERIFIED IDENTITY</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
