'use client';

import Image from 'next/image';

export default function MarketplaceEcosystemProfiles() {
  const profiles = [
    {
      name: 'Alex Chen',
      role: 'CREATOR',
      roleColor: '#3C61DD',
      avatar: '/marketplace-public/profile_alex_chen.png',
      details: [
        'Status: Chapter II Validate',
        'Focus: Sustainable Urban Agriculture',
        'Project: Nova Space',
      ],
    },
    {
      name: 'Sarah Jenkins',
      role: 'ENTREPRENEUR',
      roleColor: '#157A55',
      avatar: '/marketplace-public/profile_sarah_jenkins.png',
      details: [
        'Role: CEO, Nexus Logistics',
        'Verified Company',
        'Context: Series A Supply Chain SaaS',
      ],
    },
    {
      name: 'Marcus Thorne',
      role: 'SERVICE PROVIDER',
      roleColor: '#8B5CF6',
      avatar: '/marketplace-public/profile_marcus_thorne.png',
      details: [
        'Category: Legal & Compliance',
        'Service: Due Diligence Support',
        'Availability: Accepting Clients',
        'Verification: Tier 1',
      ],
    },
    {
      name: 'Elena Rostova',
      role: 'INVESTOR',
      roleColor: '#1A47C3',
      avatar: '/marketplace-public/profile_elena_rostova.png',
      details: [
        'Type: Early-Stage Venture',
        'Thesis: Climate Tech / Pre-Seed',
        'Typical Ticket: €250K - €1M',
      ],
    },
  ];

  const privateItems = [
    'Identity Documents',
    'Sensitive Financial Evidence',
    'Private Company Documents',
    'Controlled Verification Records',
  ];

  const publicItems = [
    'Verified Identity',
    'Verified Capacity',
    'Trust Signals',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            KNOW WHO IS BEHIND THE OPPORTUNITY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The opportunity matters.
            <br />
            So does the person or organization behind it.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Public ecosystem profiles help users understand relevant identity, role, professional context and trust signals before starting a relationship.
          </p>
        </div>

        {/* 4 Profile Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map((p) => (
            <div
              key={p.name}
              className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-3">
                <div className="w-full h-[220px] rounded-[16px] overflow-hidden bg-[#F1F1F2] relative">
                  <Image
                    src={p.avatar}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 280px"
                  />
                </div>
                <div>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider block"
                    style={{ color: p.roleColor }}
                  >
                    {p.role}
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-0.5">
                    {p.name}
                  </h3>
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] space-y-1.5 text-[11px] text-[#444654]">
                {p.details.map((d) => (
                  <div key={d} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E2E1EC]" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Profile Privacy Architecture */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-center max-w-[700px] mx-auto">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PRIVACY BOUNDARY
            </span>
            <h4 className="font-heading font-bold text-[20px] text-[#1A1B23]">
              Private Context vs Public Trust Signals
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Private Context (5 cols) */}
            <div className="md:col-span-5 p-6 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#BA1A1A] uppercase tracking-wider">
                PRIVATE CONTEXT
              </span>
              <div className="space-y-2 text-[12px] font-medium text-[#1A1B23]">
                {privateItems.map((item) => (
                  <div key={item} className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transition (1 col) */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center py-2">
              <span className="text-[10px] font-bold text-[#747685] leading-tight">
                PRIVATE VERIFICATION
                <br />
                ↓
                <br />
                PUBLIC TRUST SIGNAL
              </span>
            </div>

            {/* Public Context (5 cols) */}
            <div className="md:col-span-5 p-6 rounded-[22px] bg-[#E8F8EE]/50 border border-[#157A55]/30 flex flex-col justify-between gap-3">
              <span className="text-[11px] font-bold text-[#157A55] uppercase tracking-wider">
                PUBLIC CONTEXT
              </span>
              <div className="space-y-2 text-[12px] font-medium text-[#1A1B23]">
                {publicItems.map((item) => (
                  <div key={item} className="p-2.5 rounded-[10px] bg-white border border-[#157A55]/20 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#157A55]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-[11px] font-extrabold text-[#157A55] uppercase">
                WITHOUT PUBLIC DOCUMENT EXPOSURE
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] text-center text-[12px] font-bold text-[#1A1B23]">
            RIGHT PERSON + RIGHT CONTEXT + RIGHT VISIBILITY = BETTER CONNECTION
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            TRUST DOES NOT REQUIRE MAKING EVERYTHING PUBLIC.
          </h3>
        </div>
      </div>
    </section>
  );
}
