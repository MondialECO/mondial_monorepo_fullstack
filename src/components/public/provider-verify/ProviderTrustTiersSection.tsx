'use client';

import { Shield, ShieldCheck, CheckCircle2, XCircle, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';

export default function ProviderTrustTiersSection() {
  const logicFlow = [
    'MORE VERIFIED TRUST',
    'STRONGER ACCESS',
    'LOWER PLATFORM COMMISSION',
    'MORE ECOSYSTEM VISIBILITY',
  ];

  const tiers = [
    {
      num: 'TIER 1',
      title: 'Identity',
      desc: 'Professional identity established.',
      paidAccess: 'NOT YET',
      isPaidAvailable: false,
      message: 'Message: Build stronger professional evidence.',
      isHighlighted: false,
    },
    {
      num: 'TIER 2',
      title: 'Basic Verified',
      desc: 'Standard verification complete.',
      paidAccess: 'AVAILABLE',
      isPaidAvailable: true,
      commission: '12%',
      badge: 'CURRENT MODEL',
      isHighlighted: true,
    },
    {
      num: 'TIER 3',
      title: 'Verified Professional',
      desc: 'Proven track record.',
      paidAccess: 'Premium opportunities',
      isPaidAvailable: true,
      commission: '8%',
      path: 'Strong project history, Strong Mondial Score, Skills Test',
      isHighlighted: false,
    },
    {
      num: 'TIER 4',
      title: 'Vetted',
      desc: 'Top-tier verified expert.',
      paidAccess: 'Featured + priority opportunities',
      isPaidAvailable: true,
      commission: '5%',
      path: 'Application + Mondial human review',
      isHighlighted: false,
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            TRUST CAN PROGRESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Verification is not one binary badge.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial uses progressive Provider tiers so professional trust, paid-work access and platform economics can evolve with stronger verification and performance.
          </p>
        </div>

        {/* Logic Visualization Bar */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-[#FAF8FF] border-l-4 border-l-[#3C61DD] border border-[#E2E1EC] shadow-xs flex flex-wrap items-center justify-between gap-4">
          {logicFlow.map((item, idx) => (
            <div key={item} className="flex items-center gap-3">
              <span className="font-heading font-bold text-[13px] sm:text-[14px] text-[#1A1B23]">
                {item}
              </span>
              {idx < logicFlow.length - 1 && <span className="text-[#3C61DD] font-bold">➔</span>}
            </div>
          ))}
        </div>

        {/* 4 Tiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {tiers.map((t) => (
            <div
              key={t.num}
              className={`p-6 rounded-[24px] flex flex-col justify-between gap-6 transition-all ${
                t.isHighlighted
                  ? 'bg-white border-2 border-[#3C61DD] shadow-lg relative'
                  : 'bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs'
              }`}
            >
              {t.badge && (
                <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-[#3C61DD] text-white text-[9px] font-extrabold uppercase shadow-sm">
                  {t.badge}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                  <span
                    className={`text-[11px] font-bold uppercase ${
                      t.isHighlighted ? 'text-[#3C61DD]' : 'text-[#747685]'
                    }`}
                  >
                    {t.num}
                  </span>
                  <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23]">
                    {t.title}
                  </h3>
                  <p className="text-[12px] text-[#444654]">{t.desc}</p>
                </div>

                <div className="flex flex-col gap-3 text-[12px]">
                  <div>
                    <span className="text-[9px] font-bold text-[#747685] uppercase block">
                      PAID WORK ACCESS
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {t.isPaidAvailable ? (
                        <CheckCircle2 size={13} className="text-[#157A55]" />
                      ) : (
                        <XCircle size={13} className="text-[#BA1A1A]" />
                      )}
                      <span
                        className={`font-bold ${
                          t.isPaidAvailable ? 'text-[#1A1B23]' : 'text-[#BA1A1A]'
                        }`}
                      >
                        {t.paidAccess}
                      </span>
                    </div>
                  </div>

                  {t.commission && (
                    <div>
                      <span className="text-[9px] font-bold text-[#747685] uppercase block">
                        PLATFORM COMMISSION
                      </span>
                      <span className="font-heading font-extrabold text-[20px] text-[#3C61DD]">
                        {t.commission}
                      </span>
                    </div>
                  )}

                  {t.message && (
                    <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] text-[11px] text-[#747685]">
                      {t.message}
                    </div>
                  )}

                  {t.path && (
                    <div>
                      <span className="text-[9px] font-bold text-[#747685] uppercase block">
                        REQUIREMENTS
                      </span>
                      <span className="text-[11px] text-[#444654]">{t.path}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory Trust Disclaimer */}
        <div className="p-6 sm:p-7 rounded-[22px] bg-[#F3F2FD] border border-[#E2E1EC] shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#1A1B23]">
            <AlertTriangle size={18} className="text-[#875301]" />
            <h4 className="font-heading font-extrabold text-[15px] sm:text-[16px]">
              A HIGHER TIER DOES NOT GUARANTEE CLIENT SELECTION.
            </h4>
          </div>
          <p className="text-[13px] text-[#444654] pl-6 sm:pl-7 leading-relaxed">
            Trust Principle: <strong className="text-[#1A1B23]">TIER ≠ QUALITY GUARANTEE</strong>. Tier represents Mondial verification and platform status, not guaranteed project outcomes.
          </p>
        </div>
      </div>
    </section>
  );
}
