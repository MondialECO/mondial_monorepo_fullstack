'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, HelpCircle, Sparkles, Building, Briefcase, TrendingUp } from 'lucide-react';

export default function FigmaRoleGateway() {
  const roles = [
    {
      title: 'Creators',
      desc: 'Start with an idea.',
      cta: 'Apply',
      href: '/signup?role=Creator',
      icon: Sparkles,
      active: false,
    },
    {
      title: 'Entrepreneurs',
      desc: 'Get investor-ready.',
      cta: 'Apply',
      href: '/signup?role=Entrepreneur',
      icon: Building,
      active: false,
    },
    {
      title: 'Providers',
      desc: 'Find serious founders.',
      cta: 'Apply',
      href: '/signup?role=ServiceProvider',
      icon: Briefcase,
      active: false,
    },
    {
      title: 'Investors',
      desc: 'See vetted dealflow.',
      cta: 'Request access',
      href: '/signup?role=Investor',
      icon: TrendingUp,
      active: true, // Highlighted card in Figma
    },
  ];

  return (
    <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]" id="roles">
      <div className="w-full max-w-[1280px] flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2.5 sm:gap-3 max-w-[800px]">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            Get Started
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            Ready to build the proof, not the pitch?
          </h2>
          <p className="text-[14px] sm:text-[16px] md:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Whether you&apos;re creating, building, providing services, or investing — there&apos;s a
            place for you on Mondial. Choose your role and join the ecosystem.
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {roles.map((r) => {
            const Icon = r.icon;
            if (r.active) {
              return (
                <div
                  key={r.title}
                  className="bg-[#3C61DD] text-white rounded-[18px] p-5 sm:p-6 flex flex-col justify-between min-h-[180px] sm:h-[200px] shadow-lg transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-white/15 flex items-center justify-center text-white">
                      <Icon size={18} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[18px] sm:text-[20px] text-white">{r.title}</h3>
                    <p className="text-[12px] sm:text-[13px] text-white/80">{r.desc}</p>
                  </div>
                  <Link
                    href={r.href}
                    className="text-[13px] sm:text-[14px] font-semibold text-white inline-flex items-center gap-1 hover:underline pt-2"
                  >
                    <span>{r.cta}</span>
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              );
            }

            return (
              <div
                key={r.title}
                className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[18px] p-5 sm:p-6 flex flex-col justify-between min-h-[180px] sm:h-[200px] transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[#3C61DD] shadow-sm">
                    <Icon size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[18px] sm:text-[20px] text-[#070707]">{r.title}</h3>
                  <p className="text-[12px] sm:text-[13px] text-[#5E5E5E]">{r.desc}</p>
                </div>
                <Link
                  href={r.href}
                  className="text-[13px] sm:text-[14px] font-semibold text-[#3C61DD] inline-flex items-center gap-1 hover:underline pt-2"
                >
                  <span>{r.cta}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom Help Banner */}
        <div className="w-full bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E8EEFF] text-[#3C61DD] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <span className="font-heading font-semibold text-[13px] sm:text-[14px] text-[#070707] block">
                Not sure which one you are?
              </span>
              <p className="text-[12px] sm:text-[13px] text-[#5E5E5E] leading-[1.6]">
                Most people start as a Creator. You can move roles later — the platform does it for
                you at Level Up.
              </p>
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-[8px] bg-white border border-[rgba(0,0,0,0.08)] text-[12px] sm:text-[13px] font-medium text-[#070707] hover:bg-[#F1F1F2] transition-colors shadow-sm shrink-0"
          >
            <span>Talk to us</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
