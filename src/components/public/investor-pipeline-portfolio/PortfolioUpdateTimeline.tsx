'use client';

export default function PortfolioUpdateTimeline() {
  const updates = [
    { num: 'UPDATE 01', tag: 'PRODUCT', title: 'Booking workflow launched.' },
    { num: 'UPDATE 02', tag: 'MARKET', title: 'First pilot companies onboarded.' },
    { num: 'UPDATE 03', tag: 'REVENUE', title: 'Initial commercial signal appears.' },
    { num: 'UPDATE 04', tag: 'TEAM', title: 'Technical team expanded.' },
    { num: 'UPDATE 05', tag: 'FUNDING', title: 'Next capital decision approaching.' },
  ];

  const inquiryQuestions = [
    'What changed?',
    'What worked?',
    'What did not?',
    'Which assumptions changed?',
    'What is the next major risk?',
    'What does the company need now?',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            AFTER THE INVESTMENT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The company keeps changing.
            <br />
            The Investor context should too.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Portfolio relationships become more useful when company updates reconnect current progress with the original investment case.
          </p>
        </div>

        {/* 2-Column: Illustrative Company Journey (Left) + Strategic Investor Inquiry (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Illustrative Company Journey (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider block">
                ILLUSTRATIVE COMPANY JOURNEY
              </span>

              {/* T=0 Box */}
              <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-white text-[#3C61DD] font-heading font-bold text-[11px] uppercase">
                    INVESTMENT MOMENT (T=0)
                  </span>
                  <span className="text-[10px] text-[#747685]">Baseline Round</span>
                </div>
                <div className="pt-2 text-[12px] space-y-1">
                  <div>
                    <strong className="text-[#1A1B23]">Original Thesis:</strong>{' '}
                    <span className="text-[#444654]">Marketplace demand exists.</span>
                  </div>
                  <div>
                    <strong className="text-[#1A1B23]">Capital Purpose:</strong>{' '}
                    <span className="text-[#444654]">Build product, Launch pilot, Acquire early customers.</span>
                  </div>
                </div>
              </div>

              {/* 5 Updates Timeline */}
              <div className="space-y-2 pt-2">
                {updates.map((up) => (
                  <div
                    key={up.num}
                    className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] flex items-center justify-between text-[12px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#747685]">{up.num}</span>
                      <span className="px-2 py-0.5 rounded bg-[#FAF8FF] text-[#3C61DD] font-bold text-[10px]">
                        {up.tag}
                      </span>
                    </div>
                    <span className="font-medium text-[#1A1B23]">{up.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">Chronological operational milestones</div>
          </div>

          {/* Right: Strategic Investor Inquiry (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider block">
                STRATEGIC INVESTOR INQUIRY
              </span>

              {/* T=0 -> T=NOW Visual Bridge */}
              <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between text-[11px] font-bold">
                <div className="text-center">
                  <span className="text-[#3C61DD] block">T=0</span>
                  <span className="text-[#1A1B23] text-[10px]">Original Investment Case</span>
                </div>
                <span className="text-[#3C61DD] text-[16px]">➔</span>
                <div className="text-center">
                  <span className="text-[#157A55] block">T=NOW</span>
                  <span className="text-[#1A1B23] text-[10px]">Current Company Reality</span>
                </div>
              </div>

              {/* 6 Questions */}
              <div className="space-y-2 pt-2">
                {inquiryQuestions.map((q) => (
                  <div
                    key={q}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-bold text-[#1A1B23] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">Analytical framework for updates</div>
          </div>
        </div>

        {/* Section Quote */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs text-center">
          <blockquote className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            &ldquo;AN INVESTOR UPDATE SHOULD NOT ONLY SAY &apos;WHAT HAPPENED.&apos; IT SHOULD HELP EXPLAIN &apos;WHAT CHANGED ABOUT THE INVESTMENT CASE.&apos;&rdquo;
          </blockquote>
        </div>
      </div>
    </section>
  );
}
