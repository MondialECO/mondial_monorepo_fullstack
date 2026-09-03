'use client';

export default function ProjectIntelligenceSection() {
  const planItems = [
    { name: 'Problem & Solution', status: 'COMPLETE', type: 'green' },
    { name: 'Target Customer', status: 'COMPLETE', type: 'green' },
    { name: 'Market Structure', status: 'COMPLETE', type: 'green' },
    { name: 'Business Model', status: 'COMPLETE', type: 'green' },
    { name: 'Customer Evidence', status: 'COMPLETE', type: 'green' },
    { name: 'Pricing Strategy', status: '92%', type: 'amber' },
    { name: 'Financial Projection', status: '48%', type: 'amber' },
    { name: 'Market Sources', status: '36%', type: 'amber' },
    { name: 'Operations Strategy', status: 'NOT STARTED', type: 'neutral' },
    { name: 'Strategic Risks', status: 'NOT STARTED', type: 'neutral' },
  ];

  return (
    <section
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            PHASE 03 — PROJECT INTELLIGENCE &amp; AI TOOLS
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Challenge the project before building around assumptions.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            Phase 03 turns the structured project into connected business intelligence.
          </p>
        </div>

        {/* Split Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left: AI Business Plan (6 cols) */}
          <div className="lg:col-span-6 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <h3 className="font-heading font-bold text-[16px] text-[#070707]">AI Business Plan</h3>
              <span className="px-2.5 py-1 rounded-[6px] bg-[#F1F5FF] text-[#3C61DD] font-semibold text-[11px] border border-[#3C61DD]/20">
                INTELLIGENCE ACTIVE
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {planItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between py-1.5 px-2 rounded-[8px] hover:bg-white/80 transition-colors text-[13px]"
                >
                  <span className="font-medium text-[#3E3E3E]">{item.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-[5px] text-[11px] font-bold ${
                      item.type === 'green'
                        ? 'bg-[#D4FFE5] text-[#00A854]'
                        : item.type === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-[#EDEDED] text-[#8A8B8F]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Market Intelligence & Financial Forecast (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Market Intelligence Sub-Card */}
            <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
                <h4 className="font-heading font-bold text-[15px] text-[#070707]">Market Intelligence</h4>
                <span className="text-[12px] font-bold text-[#3C61DD]">68% COMPLETE</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-[12px] p-3 border border-[rgba(0,0,0,0.04)]">
                  <span className="text-[24px] font-heading font-bold text-[#3C61DD] block leading-tight">9</span>
                  <span className="text-[11px] text-[#8A8B8F]">Interviews</span>
                </div>
                <div className="bg-white rounded-[12px] p-3 border border-[rgba(0,0,0,0.04)]">
                  <span className="text-[24px] font-heading font-bold text-[#3C61DD] block leading-tight">4</span>
                  <span className="text-[11px] text-[#8A8B8F]">Competitors</span>
                </div>
                <div className="bg-white rounded-[12px] p-3 border border-[rgba(0,0,0,0.04)]">
                  <span className="text-[24px] font-heading font-bold text-[#3C61DD] block leading-tight">3</span>
                  <span className="text-[11px] text-[#8A8B8F]">Sources</span>
                </div>
              </div>
            </div>

            {/* AI Financial Forecast Sub-Card */}
            <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-6 flex flex-col gap-3 shadow-sm">
              <h4 className="font-heading font-bold text-[15px] text-[#070707] border-b border-[rgba(0,0,0,0.06)] pb-2.5">
                AI Financial Forecast
              </h4>
              <div className="flex flex-col gap-2 text-[12px]">
                <div className="flex justify-between items-center py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="text-[#5E5E5E]">Break-even Month:</span>
                  <span className="font-bold text-[#070707]">Month 16</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="text-[#5E5E5E]">Projected Revenue (Y1):</span>
                  <span className="font-bold text-[#070707]">$145,000</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="text-[#5E5E5E]">Operating Costs / mo:</span>
                  <span className="font-bold text-[#070707]">$8,300</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#5E5E5E]">Target Funding Need:</span>
                  <span className="font-bold text-[#3C61DD]">$250,000</span>
                </div>
              </div>
            </div>

            {/* Risk Analysis Sub-Card */}
            <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 flex flex-col gap-2.5 shadow-sm">
              <h4 className="font-heading font-bold text-[14px] text-[#070707]">Risk Analysis Findings</h4>
              <ul className="flex flex-col gap-1.5 text-[12px] text-[#5E5E5E]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>Customer acquisition cost unvalidated.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>Evidence gap identified in competitor hourly pricing.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quote Block */}
        <div className="w-full bg-[#F1F5FF] border border-[#3C61DD]/20 rounded-[16px] p-4 sm:p-5 text-center shadow-sm">
          <p className="font-heading font-bold text-[13px] sm:text-[15px] tracking-wide text-[#3C61DD] uppercase">
            &ldquo;THE TOOLS ARE CONNECTED BECAUSE THE PROJECT IS ONE PROJECT.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
