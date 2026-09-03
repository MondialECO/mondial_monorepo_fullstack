'use client';

export default function ProviderCommission() {
  const tiers = [
    {
      name: 'TIER 1: IDENTITY',
      desc: 'No paid work access',
      rate: null,
      accent: '#747685',
      bg: '#F1F1F2',
      border: '#C4C5D6',
      isLocked: true,
    },
    {
      name: 'TIER 2: BASIC VERIFIED',
      desc: 'Standard entry level',
      rate: '12%',
      accent: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
    },
    {
      name: 'TIER 3: VERIFIED PROFESSIONAL',
      desc: 'Established track record',
      rate: '8%',
      accent: '#3C61DD',
      bg: '#FAF8FF',
      border: '#E2E1EC',
    },
    {
      name: 'TIER 4: VETTED',
      desc: 'Highest trust level',
      rate: '5%',
      accent: '#157A55',
      bg: '#E8F8EE',
      border: '#A7F3D0',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1240px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#965F11] uppercase tracking-wider">
            PROVIDER COMMISSION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            More verified trust. Lower platform commission.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Commission rates decrease as providers build trust through verification and platform history.
          </p>
        </div>

        {/* 2-Column Grid: 4 Tiers (Left) + Illustrative €1,000 Project (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 4 Tier Cards (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-[22px] border shadow-2xs flex flex-col justify-between gap-4 transition-all"
                style={{ backgroundColor: t.bg, borderColor: t.border }}
              >
                <div>
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-wider block"
                    style={{ color: t.accent }}
                  >
                    {t.name}
                  </span>
                  <p className="text-[13px] text-[#444654] mt-1 font-medium">
                    {t.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
                  {t.rate ? (
                    <span
                      className="font-heading font-extrabold text-[32px] sm:text-[36px] leading-none block"
                      style={{ color: t.accent }}
                    >
                      {t.rate}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-[6px] bg-[#E2E1EC] text-[#747685] font-bold text-[11px] uppercase tracking-wider">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Illustrative €1,000 Project Panel (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block">
                  EXAMPLE BREAKDOWN
                </span>
                <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23] mt-1">
                  Illustrative €1,000 Project
                </h3>
                <p className="text-[13px] text-[#444654] mt-1">
                  Platform commission taken based on tier.
                </p>
              </div>

              {/* Commission Rows */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#1A1B23]">
                    Tier 2 Commission
                  </span>
                  <span className="font-heading font-extrabold text-[16px] text-[#D97706]">
                    €120
                  </span>
                </div>

                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#1A1B23]">
                    Tier 3 Commission
                  </span>
                  <span className="font-heading font-extrabold text-[16px] text-[#3C61DD]">
                    €80
                  </span>
                </div>

                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#1A1B23]">
                    Tier 4 Commission
                  </span>
                  <span className="font-heading font-extrabold text-[16px] text-[#157A55]">
                    €50
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-[#747685] italic text-center">
              Static illustrative demonstration only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
