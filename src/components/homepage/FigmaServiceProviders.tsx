'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function FigmaServiceProviders() {
  const cards = [
    {
      role: 'Creators',
      image: '/profiles/creator.png',
      headline: 'Hire a verified SP designer right inside Phase 2',
      bullets: [
        'Brief auto-scoped from your idea — nothing re-explained',
        'Scope and price locked before the first message',
        'Direct asset delivery into your phase documents',
      ],
      href: '/for-creators',
    },
    {
      role: 'Entrepreneurs',
      image: '/profiles/entrepreneur.png',
      headline: 'Legal and cap table specialists when equity work begins.',
      bullets: [
        'Deal SPs prepare data rooms ahead of diligence',
        'Scoped to your current phase, never generic',
        'Fixed milestone deliverables with escrow protection',
      ],
      href: '/for-entrepreneurs',
    },
    {
      role: 'Investors',
      image: '/profiles/investor.png',
      headline: "SPs prepare entrepreneurs' documents for your review.",
      bullets: [
        'Structured, verified paperwork — not a scramble before a term sheet',
        'One less thing slowing down your pipeline',
        'Legal compliance verified by certified practitioners',
      ],
      href: '/for-investors',
    },
    {
      role: 'Providers',
      image: '/profiles/service.png',
      headline: 'Leads arrive with a plan, a forecast and a defined need',
      bullets: [
        'Counter-offer and lock scope inside the platform',
        "Paid on delivery, tracked against the founder's phase",
        'Build recurring reputation on a European tech network',
      ],
      href: '/for-service-providers',
    },
  ];

  return (
    <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2.5 sm:gap-3 max-w-[800px]">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            Scope · Deliver · Get paid
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            Service Provider
          </h2>
          <p className="text-[14px] sm:text-[16px] md:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Designers, builders, lawyers, and advisors transform phases into finished work for
            creators, entrepreneurs, and investors, with a defined brief, scope, and price.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.map((c) => (
            <div
              key={c.role}
              className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[18px] p-5 sm:p-6 flex flex-col justify-between gap-5 sm:gap-6 transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Avatar & Role */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden relative bg-[#E8EEFF] shrink-0 border border-white">
                    <Image src={c.image} alt={c.role} fill className="object-cover" />
                  </div>
                  <span className="font-heading font-semibold text-[15px] sm:text-[16px] text-[#070707]">
                    {c.role}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="font-heading font-semibold text-[15px] sm:text-[16px] text-[#070707] leading-snug">
                  {c.headline}
                </h3>

                {/* Bullet Points */}
                <ul className="flex flex-col gap-2 pt-1 text-[12px] text-[#5E5E5E]">
                  {c.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#3C61DD] font-bold mt-0.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Link */}
              <Link
                href={c.href}
                className="text-[13px] font-medium text-[#3C61DD] hover:underline inline-flex items-center gap-1 pt-2"
              >
                Learn More <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
