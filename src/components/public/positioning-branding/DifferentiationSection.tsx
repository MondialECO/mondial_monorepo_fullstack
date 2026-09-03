'use client';

import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DifferentiationSection() {
  const rows = [
    {
      alt: 'Coworking Membership',
      how: 'Monthly subscription',
      strength: 'Professional environment',
      limitation: 'Can require recurring commitment',
      diff: 'Hourly access',
    },
    {
      alt: 'Café',
      how: 'Pay for food / drink',
      strength: 'Easy access',
      limitation: 'Limited professional environment',
      diff: 'Verified workspace context',
    },
    {
      alt: 'Traditional Office',
      how: 'Lease or long-term rental',
      strength: 'Dedicated space',
      limitation: 'High commitment',
      diff: 'Flexible access',
    },
    {
      alt: 'Meeting-Room Marketplace',
      how: 'Booking whole rooms',
      strength: 'Group spaces',
      limitation: 'Not tailored for individual workers',
      diff: 'Individual & flexible space',
    },
  ];

  const hypotheses = [
    'Customer preference for verification',
    'Booking frequency',
    'Price sensitivity',
    'Initial launch geography',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 04</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">STEP 03 — WHY THIS PROJECT?</span>
          </div>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Understand what makes the approach meaningfully different.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Differentiation should come from relevant customer value, not unsupported claims such as “best”, “unique” or “revolutionary”.
          </p>
        </div>

        {/* Competitive Landscape Table Card */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden shadow-xs flex flex-col">
          {/* Card Top */}
          <div className="p-5 sm:p-6 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText size={18} className="text-[#3C61DD]" />
              <h3 className="font-heading font-bold text-[16px] text-[#070707]">
                Competitive Landscape Analysis
              </h3>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[rgba(0,0,0,0.08)] text-[12px] font-medium text-[#3C61DD] shadow-xs"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>

          {/* Responsive Table Container */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#F1F1F2] border-b border-[rgba(0,0,0,0.06)] text-[11px] font-bold text-[#5E5E5E] uppercase tracking-wider">
                  <th className="p-4 pl-6">ALTERNATIVE</th>
                  <th className="p-4">HOW IT WORKS</th>
                  <th className="p-4">STRENGTH</th>
                  <th className="p-4">LIMITATION FOR TARGET USER</th>
                  <th className="p-4 pr-6 text-[#3C61DD] bg-[#F1F5FF]/50">NOVA SPACE DIFFERENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.04)] text-[13px]">
                {rows.map((r) => (
                  <tr key={r.alt} className="hover:bg-[#F9F9FA]/60 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-[#070707]">{r.alt}</td>
                    <td className="p-4 text-[#5E5E5E]">{r.how}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-[6px] bg-[#E8F8EE] text-[#00A854] text-[11px] font-medium">
                        {r.strength}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-[6px] bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200">
                        {r.limitation}
                      </span>
                    </td>
                    <td className="p-4 pr-6 font-semibold text-[#3C61DD] bg-[#F1F5FF]/40">
                      {r.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Differentiation Summary Banner */}
        <div className="w-full p-6 rounded-[20px] bg-white border border-[rgba(0,0,0,0.08)] shadow-xs flex flex-col gap-3">
          <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
            DIFFERENTIATION SUMMARY
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#070707]">
            <span className="text-[#5E5E5E] font-medium">Nova Space focuses on:</span>
            <span className="px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD]">HOURLY FLEXIBILITY</span>
            <span className="text-[#8A8B8F]">+</span>
            <span className="px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD]">LOCAL DISCOVERY</span>
            <span className="text-[#8A8B8F]">+</span>
            <span className="px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD]">
              VERIFIED WORKSPACE INFORMATION
            </span>
            <span className="text-[#8A8B8F]">+</span>
            <span className="px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD]">PROFESSIONAL USE</span>
          </div>
        </div>

        {/* Not Validated Yet (Hypothesis State) */}
        <div className="w-full p-6 rounded-[20px] bg-[#FAF8FF] border border-[#3C61DD]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#8A8B8F] uppercase">
              <AlertCircle size={14} className="text-amber-600" />
              <span>NOT VALIDATED YET (HYPOTHESIS STATE)</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px]">
              {hypotheses.map((h) => (
                <span
                  key={h}
                  className="px-2.5 py-1 rounded-[6px] bg-white border border-[rgba(0,0,0,0.06)] text-[#5E5E5E]"
                >
                  • {h}
                </span>
              ))}
            </div>
          </div>
          <span className="px-4 py-2 rounded-[10px] bg-white border border-[#3C61DD]/30 text-[#3C61DD] text-[12px] font-bold shrink-0 shadow-xs">
            Validate Later with Market Intelligence
          </span>
        </div>
      </div>
    </section>
  );
}
