'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function MarketplaceRoleGateway() {
  const roleCards = [
    {
      role: 'CREATOR',
      desc: 'I have a project → Structure it → Bring it to market.',
      cta: 'EXPLORE CREATORS',
      href: '/for-creators',
      color: '#3C61DD',
    },
    {
      role: 'ENTREPRENEUR',
      desc: 'I am building a company → Find projects, people, providers, capital.',
      cta: 'EXPLORE ENTREPRENEURS',
      href: '/for-entrepreneurs',
      color: '#157A55',
    },
    {
      role: 'SERVICE PROVIDER',
      desc: 'I bring professional expertise → Publish services → Meet relevant demand.',
      cta: 'EXPLORE SERVICE PROVIDERS',
      href: '/for-service-providers',
      color: '#8B5CF6',
    },
    {
      role: 'INVESTOR',
      desc: 'I bring investment capital → Define thesis → Discover relevant companies.',
      cta: 'EXPLORE INVESTORS',
      href: '/for-investors',
      color: '#1A47C3',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            ENTER THE ECOSYSTEM
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What are you bringing to the Marketplace?
          </h2>
        </div>

        {/* 4 Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleCards.map((rc) => (
            <div
              key={rc.role}
              className="p-6 sm:p-7 rounded-[26px] bg-white border border-[#E2E1EC] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-6"
            >
              <div>
                <span
                  className="text-[11px] font-extrabold uppercase tracking-wider block"
                  style={{ color: rc.color }}
                >
                  {rc.role}
                </span>
                <p className="font-heading font-bold text-[15px] sm:text-[16px] text-[#1A1B23] mt-3 leading-snug">
                  {rc.desc}
                </p>
              </div>

              <Link
                href={rc.href}
                className="text-[11px] font-extrabold text-[#3C61DD] hover:underline uppercase tracking-wider inline-flex items-center gap-1.5 group"
              >
                <span>{rc.cta}</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Final Ecosystem Conclusion Showcase */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-6">
          {/* 4 Roles Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#3C61DD]">
              CREATOR
            </span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#157A55]">
              ENTREPRENEUR
            </span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#8B5CF6]">
              SERVICE PROVIDER
            </span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#1A47C3]">
              INVESTOR
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <h3 className="font-heading font-extrabold text-[20px] sm:text-[24px] text-[#1A1B23]">
              MONDIAL MARKETPLACE
            </h3>
            <span className="text-[12px] text-[#747685]">as central discovery layer</span>
          </div>

          <h4 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed max-w-[700px]">
            FOUR ROLES. DIFFERENT NEEDS.
            <br />
            ONE STRUCTURED PLACE TO CONNECT.
          </h4>

          {/* 2 Final CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#value-types"
              className="px-7 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
            >
              <span>EXPLORE THE MARKETPLACE</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>

            <Link
              href="/signup"
              className="px-6 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors"
            >
              CHOOSE YOUR ROLE
            </Link>
          </div>

          {/* Bottom Breadcrumb */}
          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] w-full flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#747685]">
            <span>MONDIAL ECO</span>
            <span>|</span>
            <span>STRUCTURE</span>
            <span>·</span>
            <span>DISCOVER</span>
            <span>·</span>
            <span>CONNECT</span>
            <span>·</span>
            <span>BUILD</span>
          </div>
        </div>
      </div>
    </section>
  );
}
