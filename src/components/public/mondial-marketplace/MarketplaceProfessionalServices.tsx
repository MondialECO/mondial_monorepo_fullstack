'use client';

import Image from 'next/image';

export default function MarketplaceProfessionalServices() {
  const serviceExamples = [
    {
      category: 'BUILDER SERVICE',
      title: 'Startup Brand Identity',
      context: 'Delivered 12+ pre-seed brands in SaaS and Fintech.',
      scope: 'Fixed Scope',
      timeline: '2-4 Weeks',
      bgImg: '/marketplace-public/service_bg_builder.png',
    },
    {
      category: 'STRUCTURAL SERVICE',
      title: 'Company Formation Review',
      context: 'Legal infrastructure audit for C-Corps.',
      scope: 'Audit & Report',
      timeline: 'Retainer',
      bgImg: '/marketplace-public/service_bg_structural.png',
    },
    {
      category: 'DEAL SERVICE',
      title: 'Investor-Side Due Diligence Support',
      context: 'Technical DD for Series A/B software investments.',
      scope: 'Custom Scope',
      timeline: 'Time & Materials',
      bgImg: '/marketplace-public/service_bg_deal.png',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PROFESSIONAL SERVICES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Find expertise in the shape the work actually needs.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Service Provider Marketplace entries should explain more than a job title — they should communicate a real service, professional context, scope and commercial model.
          </p>
        </div>

        {/* Transformation Flow: Provider -> Expertise -> Structured Service -> Client Understands */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-4">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            SERVICE STRUCTURING TRANSFORMATION
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Provider */}
            <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2">
              <span className="text-[10px] font-bold text-[#747685] uppercase">Professional</span>
              <div>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  Maya Rahman
                </h4>
                <span className="text-[12px] text-[#3C61DD] font-medium">Backend Engineer</span>
              </div>
            </div>

            {/* Step 2: Expertise */}
            <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2">
              <span className="text-[10px] font-bold text-[#747685] uppercase">Expertise</span>
              <p className="font-heading font-bold text-[14px] text-[#1A1B23]">
                API Architecture, Database Systems, Payments
              </p>
            </div>

            {/* Step 3: Structured Service */}
            <div className="p-5 rounded-[20px] bg-[#EBF0FF] border border-[#3C61DD]/30 flex flex-col justify-between gap-2">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">Structured Service</span>
              <p className="font-heading font-bold text-[14px] text-[#1A47C3]">
                Backend Integration for Marketplace MVPs
              </p>
            </div>

            {/* Step 4: Client Understands */}
            <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2">
              <span className="text-[10px] font-bold text-[#157A55] uppercase">Client Understands</span>
              <p className="text-[11px] text-[#444654] leading-relaxed">
                Scope, Deliverables, Pricing Model, Timeline, Requirements, Availability, Verified Context.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Service Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceExamples.map((ex) => (
            <div
              key={ex.title}
              className="p-6 sm:p-7 rounded-[26px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6 relative overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                  {ex.category}
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  {ex.title}
                </h3>
                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px]">
                  <strong className="text-[#747685] block text-[10px] uppercase">Verified Context</strong>
                  <span className="text-[#444654]">{ex.context}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,0,0,0.06)] text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded bg-[#FAF8FF] text-[#1A1B23]">
                  {ex.scope}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#E8F8EE] text-[#157A55]">
                  {ex.timeline}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Demand Paths & Convergence */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            Demand Paths
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Path A */}
            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] block">Path A</span>
                <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">
                  CLIENT BROWSES MARKETPLACE
                </h4>
              </div>
              <span className="text-[11px] font-medium text-[#444654]">
                Discovers Service
              </span>
            </div>

            {/* Path B */}
            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#157A55] block">Path B</span>
                <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">
                  MONDIAL IDENTIFIES ECOSYSTEM NEED
                </h4>
              </div>
              <span className="text-[11px] font-medium text-[#444654]">
                Surfaces Provider
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-[14px] bg-[#EBF0FF] border border-[#3C61DD]/30 text-center font-heading font-bold text-[13px] text-[#1A47C3]">
            Relevant Professional Opportunity
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            A SERVICE SHOULD BE DISCOVERABLE BY SEARCH.
            <br />
            AND RELEVANT WHEN THE NEED APPEARS.
          </h3>
        </div>
      </div>
    </section>
  );
}
