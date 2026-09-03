'use client';

import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function MessagingHierarchySection() {
  const consistencyItems = [
    { label: 'TARGET CUSTOMER', value: 'Independent professionals' },
    { label: 'PROBLEM', value: 'Access without commitment' },
    { label: 'SOLUTION', value: 'Hourly verified workspaces' },
    { label: 'VALUE PROPOSITION', value: 'Professional flexibility' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 05</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">STEP 04 — SAY IT CLEARLY</span>
          </div>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            One project. Different levels of explanation.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            The project should remain consistent whether it is explained in one line, a short introduction or a fuller project summary.
          </p>
        </div>

        {/* 2-Column Messaging Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 3 Communication Levels (7.5 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Level 01 */}
            <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 flex flex-col gap-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  LEVEL 01 — SHORT MESSAGE
                </span>
                <span className="text-[11px] text-[#8A8B8F]">Use cases: Navigation • Project Card • Short Intro</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-heading font-bold text-[18px] text-[#070707]">
                  “Workspace when you need it.”
                </p>
                <p className="text-[14px] text-[#5E5E5E]">
                  “Book verified local workspaces by the hour.”
                </p>
              </div>
            </div>

            {/* Level 02 */}
            <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 flex flex-col gap-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  LEVEL 02 — 30-SECOND EXPLANATION
                </span>
                <span className="text-[11px] text-[#8A8B8F]">Use cases: Marketplace • Creator Profile • Conversation</span>
              </div>
              <p className="text-[14px] text-[#070707] leading-relaxed">
                “Nova Space helps independent professionals find and book verified local workspaces by the hour. Instead of committing to fixed monthly coworking subscriptions or working in crowded cafés, users access flexible spaces on demand with clear information.”
              </p>
            </div>

            {/* Level 03 */}
            <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 flex flex-col gap-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  LEVEL 03 — PROJECT SUMMARY
                </span>
                <span className="text-[11px] text-[#8A8B8F]">Use cases: Project Presentation • Business Plan • Matching</span>
              </div>
              <p className="text-[13px] sm:text-[14px] text-[#070707] leading-relaxed">
                “Nova Space is a verified local workspace marketplace designed for independent professionals, consultants, and remote workers who need professional space on demand. By converting unused commercial spaces into hourly workspaces with verified information and seamless booking, Nova Space eliminates the need for expensive long-term commitments or inflexible monthly memberships.”
              </p>
            </div>
          </div>

          {/* Right: Message Consistency Panel (4.5 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border border-[#3C61DD]/20 rounded-[24px] p-6 sm:p-7 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <ShieldCheck size={18} className="text-[#3C61DD]" />
              <h3 className="font-heading font-bold text-[16px] text-[#070707]">
                MESSAGE CONSISTENCY
              </h3>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              {consistencyItems.map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex items-center justify-between shadow-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">{item.label}</span>
                    <span className="font-semibold text-[#070707]">{item.value}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#00A854] uppercase bg-[#E8F8EE] px-2 py-0.5 rounded-[4px]">
                    ✓ CONSISTENT
                  </span>
                </div>
              ))}

              <div className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex items-center justify-between shadow-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">UNPROVEN CLAIMS</span>
                  <span className="font-semibold text-[#070707]">NONE DETECTED</span>
                </div>
                <span className="text-[10px] font-bold text-[#00A854] uppercase bg-[#E8F8EE] px-2 py-0.5 rounded-[4px]">
                  ✓ CLEAR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Consistency Banner */}
        <div className="w-full py-5 px-6 rounded-[18px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] text-center">
          <span className="font-heading font-bold text-[16px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE MESSAGE CAN CHANGE IN LENGTH. THE PROJECT LOGIC SHOULD NOT CHANGE.
          </span>
        </div>
      </div>
    </section>
  );
}
