'use client';

import { Building2, PieChart, Briefcase, DollarSign, Zap, Coins, Info } from 'lucide-react';

export default function StructuredDataRoomSection() {
  const chapters = [
    {
      num: '01',
      title: 'COMPANY',
      sub: 'WHO IS THE COMPANY?',
      items: ['Registration', 'Legal Identity', 'Representatives'],
      icon: Building2,
    },
    {
      num: '02',
      title: 'OWNERSHIP',
      sub: 'WHO OWNS IT?',
      items: ['Cap Table', 'Share Structure', 'Equity Context'],
      icon: PieChart,
    },
    {
      num: '03',
      title: 'BUSINESS',
      sub: 'WHAT DOES IT DO?',
      items: ['Business Plan', 'Business Model', 'Market Context'],
      icon: Briefcase,
    },
    {
      num: '04',
      title: 'FINANCIAL',
      sub: 'WHAT EVIDENCE EXISTS?',
      items: ['Historical Context', 'Forecast', 'Cash / Funding Need'],
      icon: DollarSign,
    },
    {
      num: '05',
      title: 'EXECUTION',
      sub: 'WHAT DOES IT NEED?',
      items: ['Milestones', 'Traction & KPIs', 'Resource Context'],
      icon: Zap,
    },
    {
      num: '06',
      title: 'FUNDING',
      sub: 'WHAT IS BEING OFFERED?',
      items: ['Funding Ask', 'Use of Funds', 'Scenario Context'],
      icon: Coins,
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            STRUCTURED DILIGENCE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A Data Room should be more
            <br />
            than a folder of files.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial connects the company context built across earlier stages so investors can review the business with clearer structure.
          </p>
        </div>

        {/* Master Data Room Hub */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col items-center gap-10 shadow-xs">
          {/* Central Hub */}
          <div className="px-8 py-5 rounded-[20px] bg-[#DCE1FF] border-2 border-[#1A47C3]/30 text-center flex flex-col items-center gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-[#1A47C3] uppercase tracking-wider">
              NOVA SPACE SAS
            </span>
            <h3 className="font-heading font-extrabold text-[20px] text-[#001551]">
              MASTER DATA ROOM
            </h3>
          </div>

          {/* 6 Connected Chapters Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {chapters.map((ch) => {
              const Icon = ch.icon;
              return (
                <div
                  key={ch.num}
                  className="p-5 rounded-[18px] bg-white border border-[#E2E1EC] flex flex-col gap-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#3C61DD]">
                        {ch.num}
                      </span>
                      <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                        {ch.title}
                      </h4>
                    </div>
                    <Icon size={16} className="text-[#3C61DD]" />
                  </div>

                  <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wide">
                    {ch.sub}
                  </span>

                  <ul className="space-y-1 text-[13px] text-[#444654]">
                    {ch.items.map((it) => (
                      <li key={it} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#747685]" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Area */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col items-center gap-3">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide max-w-[780px]">
            A GOOD DATA ROOM REDUCES THE DISTANCE BETWEEN DOCUMENTS AND UNDERSTANDING.
          </h3>
          <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-[#747685]">
            <Info size={14} />
            <span>
              Access to individual information areas may still depend on permissions and deal stage.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
