'use client';

import { Users, Clock } from 'lucide-react';

export default function TargetCustomerSection() {
  const subSegments = ['Freelancers', 'Consultants', 'Remote Workers', 'Solo Business Owners'];
  const customerNeeds = ['Flexible access', 'Professional environment', 'Simple booking', 'Verified location information'];
  const alternatives = ['Home', 'Café', 'Coworking membership', 'Meeting-room booking'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            WHO IS IT FOR?
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A project becomes clearer when the first customer is clear.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Mondial helps the Creator separate the primary target from possible future audiences.
          </p>
        </div>

        {/* 2-Column Customer Segmentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Customer Segmentation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
              CUSTOMER SEGMENTATION
            </span>

            {/* Primary Target Card */}
            <div className="p-6 rounded-[20px] bg-white border-2 border-[#3C61DD]/40 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#3C61DD]">
                  <Users size={16} />
                  <span>PRIMARY TARGET</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#3C61DD] text-white text-[10px] font-bold uppercase">
                  ACTIVE
                </span>
              </div>

              <h3 className="font-heading font-bold text-[20px] text-[#3C61DD]">
                Independent Professionals
              </h3>

              <div className="flex flex-wrap gap-2">
                {subSegments.map((seg) => (
                  <span
                    key={seg}
                    className="px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[12px] font-medium border border-[#3C61DD]/20"
                  >
                    {seg}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.04)] text-[12px]">
                <div>
                  <span className="font-bold text-[#8A8B8F] uppercase text-[10px] block">CORE NEED</span>
                  <p className="text-[#070707] font-medium">
                    “Flexible professional workspace without long-term commitment.”
                  </p>
                </div>
                <div>
                  <span className="font-bold text-[#8A8B8F] uppercase text-[10px] block">TYPICAL CONTEXT</span>
                  <p className="text-[#5E5E5E]">
                    Works remotely, Travels locally, Needs occasional meeting space, Does not need permanent office.
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary & Future Segments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-[16px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">SECONDARY • POSSIBLE</span>
                <h4 className="font-heading font-bold text-[16px] text-[#070707]">Small Teams</h4>
              </div>
              <div className="p-4 rounded-[16px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">SECONDARY • POSSIBLE</span>
                <h4 className="font-heading font-bold text-[16px] text-[#070707]">Startups</h4>
              </div>
            </div>
          </div>

          {/* Right: Primary Customer Definition Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col gap-4 shadow-xs">
            <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
              PRIMARY CUSTOMER DEFINITION
            </span>

            <div className="p-4 rounded-[16px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3C61DD] text-white flex items-center justify-center font-bold text-[13px]">
                  IP
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[15px] text-[#070707]">Independent Professional</h4>
                  <p className="text-[11px] text-[#5E5E5E]">The agile worker seeking modular productivity.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.04)] text-[12px]">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">CUSTOMER NEEDS</span>
                <div className="flex flex-wrap gap-1.5">
                  {customerNeeds.map((need) => (
                    <span
                      key={need}
                      className="px-2.5 py-0.5 rounded-[6px] bg-[#F9F9FA] text-[#070707] text-[11px] border border-[rgba(0,0,0,0.04)]"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.04)] text-[12px]">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">CURRENT ALTERNATIVES</span>
                <div className="flex flex-wrap gap-1.5">
                  {alternatives.map((alt) => (
                    <span
                      key={alt}
                      className="px-2.5 py-0.5 rounded-[6px] bg-[#F9F9FA] text-[#5E5E5E] text-[11px] border border-[rgba(0,0,0,0.04)]"
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Open Assumption */}
            <div className="p-3.5 rounded-[12px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-between gap-3 text-[12px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">OPEN ASSUMPTION</span>
                <span className="font-medium text-[#070707]">“How often will they book?”</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase border border-amber-200">
                NEEDS VALIDATION
              </span>
            </div>

            {/* Next Indicator */}
            <div className="p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[#3C61DD]/20 flex items-center justify-between text-[11px] font-bold text-[#3C61DD]">
              <span>NEXT: MARKET SIZE &amp; OPPORTUNITY</span>
              <span className="text-[#8A8B8F]">→</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
