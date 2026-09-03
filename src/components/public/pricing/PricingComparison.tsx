'use client';

export default function PricingComparison() {
  const comparisonRows = [
    {
      feature: 'MONTHLY PRICE',
      creator: '€0',
      entrepreneur: '€0',
      provider: '€9.99',
      investor: '€9.99',
      isHighlight: true,
    },
    {
      feature: 'BEST FOR',
      creator: 'Ideas & Projects',
      entrepreneur: 'Companies & Execution',
      provider: 'Professional Services',
      investor: 'Investment Opportunities',
    },
    {
      feature: 'MARKETPLACE ROLE',
      creator: 'Publish Project Opportunity',
      entrepreneur: 'Find Projects, Providers & Capital',
      provider: 'Publish Services',
      investor: 'Discover Companies',
    },
    {
      feature: 'VERIFICATION',
      creator: 'Required where relevant',
      entrepreneur: 'Required where relevant',
      provider: 'Professional verification',
      investor: 'Identity + relevant financial context',
    },
    {
      feature: 'TRANSACTION COMMISSION',
      creator: '—',
      entrepreneur: '—',
      provider: 'Tier-based',
      investor: '—',
    },
  ];

  return (
    <section
      id="quick-comparison"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] flex justify-center border-b border-[rgba(0,0,0,0.06)] scroll-mt-12"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            COMPARE BY ROLE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Different roles. Different economics.
          </h2>
        </div>

        {/* Comparison Table Container with Contained Scroll */}
        <div className="rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-[#E2E1EC] bg-[#FAF8FF]/60 text-[11px] font-extrabold text-[#747685] uppercase tracking-wider">
                  <th className="py-5 px-6 w-[24%]">Features</th>
                  <th className="py-5 px-5 w-[19%] text-[#1A1B23]">CREATOR</th>
                  <th className="py-5 px-5 w-[19%] text-[#1A1B23]">ENTREPRENEUR</th>
                  <th className="py-5 px-5 w-[19%] text-[#965F11]">SERVICE PROVIDER</th>
                  <th className="py-5 px-6 w-[19%] text-[#1A1B23]">INVESTOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.05)] text-[13px]">
                {comparisonRows.map((row) => (
                  <tr
                    key={row.feature}
                    className="hover:bg-[#FAF8FF]/50 transition-colors"
                  >
                    <td className="py-5 px-6 font-heading font-bold text-[12px] text-[#1A1B23] uppercase tracking-wider">
                      {row.feature}
                    </td>
                    <td
                      className={`py-5 px-5 ${
                        row.isHighlight
                          ? 'font-heading font-extrabold text-[16px] text-[#1A1B23]'
                          : 'text-[#444654] font-medium'
                      }`}
                    >
                      {row.creator}
                    </td>
                    <td
                      className={`py-5 px-5 ${
                        row.isHighlight
                          ? 'font-heading font-extrabold text-[16px] text-[#1A1B23]'
                          : 'text-[#444654] font-medium'
                      }`}
                    >
                      {row.entrepreneur}
                    </td>
                    <td
                      className={`py-5 px-5 ${
                        row.isHighlight
                          ? 'font-heading font-extrabold text-[16px] text-[#965F11]'
                          : 'text-[#965F11] font-bold'
                      }`}
                    >
                      {row.provider}
                    </td>
                    <td
                      className={`py-5 px-6 ${
                        row.isHighlight
                          ? 'font-heading font-extrabold text-[16px] text-[#1A1B23]'
                          : 'text-[#444654] font-medium'
                      }`}
                    >
                      {row.investor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
