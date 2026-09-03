'use client';

export default function CreatorPathStepper() {
  const steps = [
    {
      num: '1',
      title: 'IDENTITY & VERIFICATION',
      subtitle: 'Verified Creator Profile',
      active: true,
    },
    {
      num: '2',
      title: 'PROJECT IDENTITY & BRANDING',
      subtitle: 'Structured Project',
      active: false,
    },
    {
      num: '3',
      title: 'PROJECT INTELLIGENCE',
      tags: ['Business Plan', 'Market Intelligence', 'Financial Forecast', 'Risk Analysis'],
      active: false,
    },
    {
      num: '4',
      title: 'OFFER & RESOURCE SETUP',
      subtitle: 'Resource Needs, Skills Gaps, Offer Setup',
      active: false,
    },
    {
      num: '5',
      title: 'LICENSE OR BUILD',
      subtitle: 'Full Buyout, Co-founder / Equity, Build Yourself',
      active: false,
    },
    {
      num: '6',
      title: 'VERIFIED ENTREPRENEUR LEVEL UP',
      subtitle: 'Direct progression to company building',
      active: false,
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left: Editorial Callout (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-28">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-bold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            YOUR PATH
          </div>
          <h2 className="text-[36px] sm:text-[44px] font-heading font-extrabold text-[#070707] leading-[1.12] tracking-tight">
            From idea to your next move.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            A structured progression designed to transform raw concepts into verified, actionable ventures. Each phase builds compounding value.
          </p>

          <div className="flex items-center gap-2.5 pt-2 text-[13px] font-semibold text-[#070707]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3C61DD]" />
            <span>Step-by-step progress with verifiable milestones.</span>
          </div>
        </div>

        {/* Right: Vertical 6-Phase Stepper (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {steps.map((st) => (
            <div
              key={st.num}
              className={`p-5 rounded-[18px] border transition-all flex items-start gap-4 ${
                st.active
                  ? 'bg-[#F1F5FF]/50 border-[#3C61DD]/30 shadow-sm'
                  : 'bg-[#F9F9FA] border-[rgba(0,0,0,0.06)] hover:bg-white hover:shadow-xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-extrabold text-[14px] shrink-0 ${
                  st.active
                    ? 'bg-[#3C61DD] text-white shadow-sm'
                    : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#8A8B8F]'
                }`}
              >
                {st.num}
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <h4
                  className={`font-heading font-bold text-[14px] sm:text-[15px] tracking-wide ${
                    st.active ? 'text-[#3C61DD]' : 'text-[#070707]'
                  }`}
                >
                  {st.title}
                </h4>

                {st.subtitle && (
                  <p className="text-[12px] sm:text-[13px] text-[#5E5E5E]">{st.subtitle}</p>
                )}

                {st.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {st.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-medium text-[#5E5E5E] border border-[rgba(0,0,0,0.06)] shadow-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
