'use client';

import { Users, XCircle, Clock, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';

export default function FounderMeetingSection() {
  const entrepreneurTopics = [
    'Why now',
    'Why this market',
    'Why this team',
    'What has been proven',
    'What remains uncertain',
    'What the funding enables',
  ];

  const investorTopics = [
    'Fit with thesis',
    'Potential return profile',
    'Key risks',
    'Ownership expectations',
    'Execution capability',
    'Future financing path',
  ];

  const rhythm = ['QUESTIONS', 'CONTEXT', 'CLARIFICATION', 'ALIGNMENT', 'NEXT STEP'];

  const outcomes = [
    {
      title: 'NO FIT',
      sub: 'Close respectfully',
      color: 'bg-red-50 text-[#BA1A1A] border-red-200',
      icon: XCircle,
      iconColor: 'text-[#BA1A1A]',
    },
    {
      title: 'MORE INFORMATION NEEDED',
      sub: 'Continue diligence',
      color: 'bg-amber-50 text-[#875301] border-amber-200',
      icon: Clock,
      iconColor: 'text-[#875301]',
    },
    {
      title: 'POTENTIAL FIT',
      sub: 'Move toward terms',
      color: 'bg-[#E8F8EE] text-[#157A55] border-[#157A55]/30',
      icon: CheckCircle2,
      iconColor: 'text-[#157A55]',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            FROM DATA TO CONVERSATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The documents matter.
            <br />
            So does the conversation.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A founder meeting gives both sides the opportunity to clarify assumptions, understand expectations and decide whether deeper deal discussions make sense.
          </p>
        </div>

        {/* 3-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Entrepreneur (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                PERSPECTIVE
              </span>
              <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23]">
                ENTREPRENEUR
              </h3>

              <ul className="space-y-2.5 text-[13px] text-[#444654]">
                {entrepreneurTopics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Center: Rhythm (4 cols) */}
          <div className="lg:col-span-4 bg-[#F3F2FD] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col items-center justify-center gap-5 shadow-xs text-center">
            <div className="px-4 py-2 rounded-full bg-white border border-[#E2E1EC] text-[11px] font-bold text-[#1A1B23]">
              FOUNDER MEETING
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[220px]">
              {rhythm.map((r, idx) => (
                <div
                  key={r}
                  className="p-2 rounded-[8px] bg-white border border-[#E2E1EC] text-[11px] font-bold text-[#747685]"
                >
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Investor (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                PERSPECTIVE
              </span>
              <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23]">INVESTOR</h3>

              <ul className="space-y-2.5 text-[13px] text-[#444654]">
                {investorTopics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#747685]" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 3 Outcome Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {outcomes.map((out) => {
            const Icon = out.icon;
            return (
              <div
                key={out.title}
                className="p-6 rounded-[20px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-[12px] border ${out.color}`}>
                    <Icon size={18} className={out.iconColor} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                      {out.title}
                    </h4>
                    <span className="text-[12px] text-[#747685]">{out.sub}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Statement */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            A GOOD MEETING DOES NOT NEED TO END IN &lsquo;YES.&rsquo; IT SHOULD END WITH A CLEAR NEXT STEP.
          </span>
        </div>
      </div>
    </section>
  );
}
