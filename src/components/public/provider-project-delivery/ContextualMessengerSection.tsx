'use client';

import { MessageSquare, ArrowRight, CheckCircle2, Sparkles, FileText, Calendar, Lock, Play, DollarSign, Star } from 'lucide-react';

export default function ContextualMessengerSection() {
  const stages = [
    { num: '01', title: 'NEW LEAD', purpose: 'Understand the need.', nextAction: 'Prepare Proposal', icon: MessageSquare },
    { num: '02', title: 'PROPOSAL', purpose: 'Clarify scope.', nextAction: 'Send / Revise Proposal', icon: FileText },
    { num: '03', title: 'BOOKING', purpose: 'Confirm timing & requirements.', nextAction: 'Set Start Conditions', icon: Calendar },
    { num: '04', title: 'CONTRACT', purpose: 'Complete agreement.', nextAction: 'Sign', icon: CheckCircle2 },
    { num: '05', title: 'ESCROW', purpose: 'Confirm funding.', nextAction: 'Open Workroom', icon: Lock },
    { num: '06', title: 'PROJECT', purpose: 'Deliver and collaborate.', nextAction: 'Submit Milestone', icon: Play },
    { num: '07', title: 'PAYMENT EVENT', purpose: 'Track project release.', nextAction: 'Review Status', icon: DollarSign },
    { num: '08', title: 'REVIEW', purpose: 'Close the project relationship.', nextAction: 'Feedback / Case Study', icon: Star },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}

        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CONVERSATION WITH CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The message should know
            <br />
            what stage the project is in.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial Messenger connects communication to the active client journey so the next action changes as the relationship moves forward.
          </p>
        </div>

        {/* Logic Card */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              SAME CONVERSATION
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              DIFFERENT PROJECT STAGE
            </span>
            <span className="text-[#3C61DD]">=</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              DIFFERENT NEXT ACTION
            </span>
          </div>
          <p className="text-[13px] font-bold text-[#747685] uppercase tracking-wide pt-1">
            MESSENGER IS NOT ANOTHER INBOX. IT IS THE COMMUNICATION LAYER AROUND THE WORK.
          </p>
        </div>


        {/* 8-Stage Communication Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.title}
                className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                      {st.num} {st.title}
                    </span>
                    <Icon size={16} className="text-[#3C61DD]" />
                  </div>
                  <p className="text-[12px] text-[#747685]">{st.purpose}</p>
                </div>

                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px]">
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">
                    NEXT ACTION
                  </span>
                  <span className="font-bold text-[#1A1B23]">{st.nextAction}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
