'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PricingRoleGateway() {
  const roleGateways = [
    {
      kicker: 'I HAVE AN IDEA',
      role: 'CREATOR',
      price: '(FREE)',
      cta: 'Start as Creator',
      href: '/signup',
      accent: '#3C61DD',
    },
    {
      kicker: 'I AM BUILDING A COMPANY',
      role: 'ENTREPRENEUR',
      price: '(FREE)',
      cta: 'Start as Entrepreneur',
      href: '/signup',
      accent: '#157A55',
    },
    {
      kicker: 'I OFFER EXPERTISE',
      role: 'SERVICE PROVIDER',
      price: '(€9.99/mo)',
      cta: 'Join as Provider',
      href: '/signup',
      accent: '#965F11',
    },
    {
      kicker: 'I WANT TO INVEST',
      role: 'INVESTOR',
      price: '(€9.99/mo)',
      cta: 'Join as Investor',
      href: '/signup',
      accent: '#1A1B23',
    },
  ];

  return (
    <section
      id="role-gateway"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white flex justify-center scroll-mt-12"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CHOOSE YOUR ROLE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What are you bringing to Mondial?
          </h2>
        </div>

        {/* 4 Role Gateway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleGateways.map((rg) => (
            <div
              key={rg.role}
              className="p-6 sm:p-7 rounded-[26px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                  {rg.kicker}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className="font-heading font-extrabold text-[20px] uppercase"
                    style={{ color: rg.accent }}
                  >
                    {rg.role}
                  </h3>
                  <span className="text-[13px] font-bold text-[#747685]">
                    {rg.price}
                  </span>
                </div>
              </div>

              <Link
                href={rg.href}
                className="w-full py-3 px-4 rounded-[10px] bg-white hover:bg-[#F3F2FD] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[13px] text-center transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 group"
              >
                <span>{rg.cta}</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Final Pricing Strip & Closing Statement */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-6">
          {/* Pricing Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] sm:text-[13px] font-heading font-bold text-[#1A1B23]">
            <span>CREATOR €0</span>
            <span className="text-[#C4C5D6]">|</span>
            <span>ENTREPRENEUR €0</span>
            <span className="text-[#C4C5D6]">|</span>
            <span>SERVICE PROVIDER €9.99/MO</span>
            <span className="text-[#C4C5D6]">|</span>
            <span>INVESTOR €9.99/MO</span>
          </div>

          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] w-full text-center">
            <h4 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-widest">
              SIMPLE. ROLE-BASED. TRANSPARENT.
            </h4>
          </div>
        </div>
      </div>
    </section>
  );
}
