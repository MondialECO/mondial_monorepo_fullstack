'use client';

import { Building2, CheckCircle2, ShieldCheck, Lock, MapPin, CheckSquare, Sparkles } from 'lucide-react';

export default function ProjectPresentationSection() {
  const highlights = [
    { title: 'Hourly Access', desc: 'Book by the hour without subscriptions.' },
    { title: 'Local Discovery', desc: 'Find nearby curated spaces.' },
    { title: 'Verified Info', desc: 'Structured facility data.' },
    { title: 'Pro Context', desc: 'Quiet, professional environments.' },
  ];

  const checklist = [
    'Identity — COMPLETE',
    'Customer — COMPLETE',
    'Problem & Solution — COMPLETE',
    'Positioning — COMPLETE',
    'Value Prop — COMPLETE',
    'Brand Direction — COMPLETE',
  ];

  const openQuestions = [
    'Initial Geography Focus',
    'Pricing Thresholds',
    'Expected Booking Frequency',
    'Validation of Market Demand',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 07</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">BRING IT TOGETHER</span>
          </div>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Turn structured information into a project people can follow
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Project Presentation combines identity, positioning and brand direction into one coherent story without changing the underlying project logic.
          </p>
        </div>

        {/* 2-Column Presentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Presentation Preview Card (7.5 cols) */}
          <div className="lg:col-span-8 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden shadow-sm flex flex-col">
            {/* Header */}
            <div className="p-6 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#3C61DD] text-white flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[20px] text-[#070707]">NOVA SPACE</h3>
                  <p className="text-[13px] text-[#5E5E5E]">
                    Flexible workspace, when and where you need it.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-[6px] bg-[#E5E7EB] text-[#3C61DD] text-[11px] font-bold">
                  Marketplace
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#E5E7EB] text-[#5E5E5E] text-[11px] font-medium">
                  Independent Professionals
                </span>
              </div>
            </div>

            {/* Narrative 3-Box Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[rgba(0,0,0,0.06)] text-[12px]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">PROBLEM</span>
                <p className="text-[#070707] leading-relaxed">
                  Professionals struggle to find reliable, professional workspace on short notice outside of long-term lease commitments.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">SOLUTION</span>
                <p className="text-[#070707] leading-relaxed">
                  A marketplace connecting independent professionals with curated, hourly-accessible workspaces in local neighborhoods.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">VALUE PROPOSITION</span>
                <p className="text-[#070707] leading-relaxed">
                  Instantly book verified, professional environments with zero long-term commitment, enabling hyper-local productivity.
                </p>
              </div>
            </div>

            {/* Strategic Highlights: Why This Approach */}
            <div className="p-6 bg-[#F9F9FA]/60 flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#070707] uppercase tracking-wider">
                Why This Approach
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                {highlights.map((h) => (
                  <div key={h.title} className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-0.5 shadow-xs">
                    <span className="font-bold text-[#3C61DD]">{h.title}</span>
                    <span className="text-[11px] text-[#5E5E5E]">{h.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Status Panel (4.5 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border border-[#3C61DD]/20 rounded-[24px] p-6 sm:p-7 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">STATUS PANEL</span>
                <h4 className="font-heading font-bold text-[16px] text-[#070707]">Project Readiness</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-[#5E5E5E] text-[10px] font-bold uppercase">
                ILLUSTRATIVE
              </span>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-2 text-[12px]">
              {checklist.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[#070707] font-medium">
                  <CheckCircle2 size={15} className="text-[#00A854]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Open Questions */}
            <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-2 text-[12px]">
              <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">OPEN QUESTIONS</span>
              <div className="flex flex-wrap gap-1.5">
                {openQuestions.map((q) => (
                  <span
                    key={q}
                    className="px-2.5 py-1 rounded-[6px] bg-white border border-[rgba(0,0,0,0.04)] text-[#5E5E5E] text-[11px]"
                  >
                    • {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Statement */}
        <div className="w-full py-5 px-6 rounded-[18px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] text-center">
          <span className="font-heading font-bold text-[16px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE PRESENTATION IS CLEAR. THE ASSUMPTIONS STILL NEED TO BE TESTED.
          </span>
        </div>
      </div>
    </section>
  );
}
