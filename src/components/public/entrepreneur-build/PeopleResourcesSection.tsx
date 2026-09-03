'use client';

import { Users, UserPlus, Briefcase, Award, ArrowDown, ArrowRight } from 'lucide-react';

export default function PeopleResourcesSection() {
  const branches = [
    {
      title: 'EXISTING TEAM',
      desc: '"Use when the capability already exists internally."',
      icon: Users,
      color: 'bg-white text-[#1A1B23] border-[#E2E1EC]',
    },
    {
      title: 'NEW HIRE',
      desc: '"Use when the need is long-term and central to operations."',
      icon: UserPlus,
      color: 'bg-[#F3F2FD] text-[#1A1B23] border-[#3C61DD]/30',
    },
    {
      title: 'SERVICE PROVIDER',
      desc: '"Use when specialist expertise is needed for a defined scope."',
      icon: Briefcase,
      color: 'bg-white text-[#1A1B23] border-[#E2E1EC]',
    },
    {
      title: 'CO-FOUNDER',
      desc: '"Use when the contribution is strategic, ongoing and founder-level."',
      icon: Award,
      color: 'bg-[#3C61DD] text-white border-[#3C61DD]',
      isPrimary: true,
    },
  ];

  const examples = [
    { need: 'LEGAL REVIEW', match: 'Service Provider', badge: 'bg-[#F1F5FF] text-[#3C61DD]' },
    { need: 'SHORT BRAND PROJECT', match: 'Service Provider', badge: 'bg-[#F1F5FF] text-[#3C61DD]' },
    { need: 'CORE COMMERCIAL LEADERSHIP', match: 'Internal / Founder', badge: 'bg-amber-50 text-amber-800 border border-amber-200' },
    { need: 'BACKEND MVP BUILD', match: 'Provider / Hire / Co-founder', badge: 'bg-[#E8F8EE] text-[#157A55]' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            PEOPLE &amp; RESOURCES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Start with the need.
            <br />
            Not the job title.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial helps Entrepreneurs decide what type of contribution the company actually needs before choosing who should provide it.
          </p>
        </div>

        {/* 4-Branch Diagram */}
        <div className="flex flex-col items-center gap-6">
          {/* Root Node */}
          <div className="w-full max-w-[540px] bg-white border-2 border-[#3C61DD]/40 rounded-[24px] p-6 sm:p-7 flex flex-col items-center text-center gap-3 shadow-md">
            <span className="px-3 py-1 rounded-full bg-[#3C61DD] text-white text-[10px] font-bold uppercase tracking-wider">
              BUSINESS NEED
            </span>
            <h3 className="font-heading font-extrabold text-[18px] sm:text-[20px] text-[#1A1B23]">
              Backend capability for the Nova Space MVP.
            </h3>
            <div className="p-3 rounded-[12px] bg-[#F3F2FD] text-[12px] text-[#444654] w-full">
              <span className="font-bold text-[#3C61DD] uppercase block text-[10px] mb-0.5">
                CONTEXT: WHY?
              </span>
              Booking, Payments, Data, Transaction logic.
            </div>
          </div>

          {/* Connection Down */}
          <div className="flex items-center justify-center -my-2">
            <ArrowDown size={22} className="text-[#3C61DD]" />
          </div>

          {/* 4 Branches Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {branches.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className={`rounded-[20px] p-6 border flex flex-col justify-between gap-4 shadow-xs ${b.color}`}
                >
                  <div className="flex flex-col gap-3">
                    <div
                      className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${
                        b.isPrimary ? 'bg-white/20 text-white' : 'bg-[#F3F2FD] text-[#3C61DD]'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <h4 className="font-heading font-extrabold text-[17px]">{b.title}</h4>
                  </div>
                  <p
                    className={`text-[13px] leading-relaxed italic ${
                      b.isPrimary ? 'text-white/90' : 'text-[#444654]'
                    }`}
                  >
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mapping Examples */}
        <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-5 shadow-xs">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            MAPPING EXAMPLES
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
            {examples.map((ex) => (
              <div
                key={ex.need}
                className="p-4 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2.5"
              >
                <span className="font-bold text-[#1A1B23] text-[12px]">{ex.need}</span>
                <span
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold w-fit ${ex.badge}`}
                >
                  {ex.match}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Principle Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <p className="text-[12px] font-bold text-[#747685] uppercase">
            THE QUESTION IS NOT: &ldquo;WHO CAN I HIRE?&rdquo;
          </p>
          <p className="font-heading font-extrabold text-[16px] sm:text-[20px] text-[#070707]">
            THE QUESTION IS: &ldquo;WHAT DOES THE COMPANY NEED, AND WHAT IS THE RIGHT WAY TO FILL IT?&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
