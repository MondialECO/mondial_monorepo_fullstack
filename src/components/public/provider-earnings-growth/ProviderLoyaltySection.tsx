'use client';

import { Users, Heart, Tag, Gift, Percent, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ProviderLoyaltySection() {
  const loyaltyExamples = [
    { title: '10% off next engagement', icon: Percent },
    { title: 'Fixed-value discount', icon: Tag },
    { title: 'Free add-on', icon: Gift },
  ];

  const benefits = [
    'More context',
    'Faster scope alignment',
    'Stronger reputation',
    'Future project opportunity',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            GROW BEYOND THE FIRST PROJECT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The best next client
            <br />
            may be one you already know.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Repeat work can become a stronger client relationship, giving Providers a way to recognize loyalty and create appropriate return offers.
          </p>
        </div>

        {/* Timeline & Loyalty Offer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Relationship Timeline (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase">
                CURRENT LOYALTY MODEL
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Progression to Loyalty Client
              </h3>

              <div className="space-y-2 pt-3 text-[12px]">
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  Project 01: Brand Identity
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  Project 02: Launch Assets
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  Project 03: Campaign Support
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#E8F8EE] text-[#157A55] text-[12px] font-bold text-center">
              ✔ LOYALTY CLIENT — 3+ COMPLETED ENGAGEMENTS
            </div>
          </div>

          {/* Right: Illustrative Offers & Benefits (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                LOYALTY OFFER OPTIONS
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Return Engagement Incentives
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3">
                {loyaltyExamples.map((ex) => {
                  const Icon = ex.icon;
                  return (
                    <div
                      key={ex.title}
                      className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col items-center text-center gap-1.5"
                    >
                      <Icon size={16} className="text-[#3C61DD]" />
                      <span className="text-[11px] font-bold text-[#1A1B23]">{ex.title}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                {benefits.map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[10px] font-bold text-[#444654]"
                  >
                    ✔ {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">
              *REPEAT BUSINESS IS NOT AUTOMATIC. THE CLIENT STILL CHOOSES WHETHER TO RETURN.
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            GROWTH IS NOT ONLY FINDING MORE PEOPLE.
            <br />
            IT CAN ALSO MEAN BUILDING BETTER RELATIONSHIPS.
          </h3>
        </div>
      </div>
    </section>
  );
}
