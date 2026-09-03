'use client';

import { Palette, CheckCircle2 } from 'lucide-react';

export default function BrandDirectionSection() {
  const brandAttributes = ['ACCESSIBLE', 'PROFESSIONAL', 'MODERN', 'RELIABLE', 'FLEXIBLE'];

  const modules = [
    {
      num: '01',
      title: 'TONE OF VOICE',
      keywords: ['Clear', 'Professional', 'Direct', 'Helpful'],
      avoid: ['Corporate jargon', 'Overpromising', 'Hype'],
    },
    {
      num: '02',
      title: 'VISUAL DIRECTION',
      keywords: ['Clean', 'Structured', 'Open', 'Modern'],
      avoid: ['Strong whitespace', 'Clear hierarchy', 'Trustworthy interface patterns'],
    },
    {
      num: '03',
      title: 'PROJECT PERSONALITY',
      keywords: ['Practical', 'Professional', 'Flexible', 'Urban', 'Human'],
      avoid: [],
    },
    {
      num: '04',
      title: 'COMMUNICATION',
      keywords: ['Explain value clearly', 'Show structured info', 'Keep customer needs visible'],
      avoid: ['Avoid unsupported claims'],
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 06</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">STEP 05 — SHAPE THE EXPERIENCE</span>
          </div>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Give the project a consistent direction.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Brand Direction translates the project’s positioning and audience into a practical visual and communication direction.
          </p>
        </div>

        {/* 3-Area Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Project Context (3.5 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <Palette size={18} className="text-[#3C61DD]" />
              <h3 className="font-heading font-bold text-[16px] text-[#070707]">
                PROJECT CONTEXT
              </h3>
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">PROJECT</span>
                <p className="font-bold text-[#070707]">NOVA SPACE</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">POSITIONING</span>
                <p className="text-[#5E5E5E]">Flexible, Local, Professional, Verified</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">TARGET CUSTOMER</span>
                <p className="text-[#5E5E5E]">Independent Professionals</p>
              </div>

              <div className="pt-2 border-t border-[rgba(0,0,0,0.04)]">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block mb-2">
                  BRAND ATTRIBUTES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {brandAttributes.map((attr) => (
                    <span
                      key={attr}
                      className="px-2.5 py-1 rounded-[6px] bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-bold"
                    >
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Brand Direction Modules (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {modules.map((m) => (
              <div
                key={m.title}
                className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[18px] p-4 flex flex-col gap-2 shadow-xs text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#3C61DD]">{m.num}</span>
                  <span className="font-heading font-bold text-[13px] text-[#070707]">{m.title}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {m.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-[4px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)] text-[#070707]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Brand Direction Summary (3.5 cols) */}
          <div className="lg:col-span-3 bg-[#FAF8FF] border border-[#3C61DD]/20 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                BRAND DIRECTION SUMMARY
              </span>
              <h4 className="font-heading font-bold text-[20px] text-[#070707]">NOVA SPACE</h4>
              <p className="text-[14px] text-[#070707] font-medium leading-relaxed italic">
                “Professional flexibility, made easier to access.”
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-full bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold uppercase inline-flex items-center gap-1.5 w-fit">
              <CheckCircle2 size={13} />
              <span>DIRECTION DEFINED</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
