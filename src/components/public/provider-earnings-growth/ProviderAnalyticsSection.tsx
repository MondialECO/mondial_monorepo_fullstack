'use client';

import { BarChart3, LineChart, PieChart, Users, Star, ArrowRight, Lightbulb } from 'lucide-react';

export default function ProviderAnalyticsSection() {
  const streams = [
    { title: 'Service Performance', q: 'Which services attract attention?', icon: BarChart3 },
    { title: 'Profile Analytics', q: 'How strong is your presentation?', icon: Users },
    { title: 'Earnings Trajectory', q: 'Where is income coming from?', icon: LineChart },
    { title: 'Reputation & Tier', q: 'How are clients rating you?', icon: Star },
    { title: 'Client Insights', q: 'Who is returning and why?', icon: PieChart },
  ];

  const insights = [
    { area: 'PROFILE', finding: 'Intro video missing', action: 'Strengthen profile presentation' },
    { area: 'SERVICE', finding: 'High views, Low inquiry', action: 'Review service positioning' },
    { area: 'CLIENTS', finding: 'Strong repeat-client rate', action: 'Create loyalty offer' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            UNDERSTAND WHAT IS WORKING
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Analytics matter when they
            <br />
            change what you do next.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can connect performance signals across services, visibility, earnings, reputation and client behavior so Providers can identify meaningful ways to improve.
          </p>
        </div>

        {/* 5 Insight Streams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {streams.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <Icon size={16} className="text-[#3C61DD]" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">{s.title}</h4>
                  <p className="text-[11px] text-[#747685] mt-1">{s.q}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Converged Outcome & Benchmark Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Actionable Insights (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                CONVERGED OUTCOME — NEXT BEST IMPROVEMENT
              </span>
              <div className="space-y-2.5 pt-3">
                {insights.map((ins) => (
                  <div
                    key={ins.area}
                    className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-2 text-[12px]"
                  >
                    <div>
                      <span className="font-bold text-[#1A1B23] mr-2">{ins.area}:</span>
                      <span className="text-[#747685]">{ins.finding}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#F3F2FD] text-[#1A47C3] font-bold text-[11px]">
                      ➔ {ins.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benchmark (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4 text-center">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                BENCHMARK CONTEXT
              </span>
              <div className="text-[44px] font-heading font-extrabold text-[#1A1B23] leading-none my-2">
                87
              </div>
              <p className="text-[12px] text-[#157A55] font-bold">Your Score</p>
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] text-[#747685]">
              Category Average: <strong className="text-[#1A1B23]">79 avg</strong>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            DATA SHOULD NOT JUST DESCRIBE THE PAST.
            <br />
            IT SHOULD HELP CHOOSE THE NEXT IMPROVEMENT.
          </h3>
        </div>
      </div>
    </section>
  );
}
