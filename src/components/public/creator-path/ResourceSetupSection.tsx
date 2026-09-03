'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Lightbulb } from 'lucide-react';

export default function ResourceSetupSection() {
  const tabs = ['Command Roadmap', 'Phase Roadmap', 'Path Previews', 'Transformation', 'Summary', 'FAQ'];

  return (
    <section
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-[860px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            PHASE 04 — OFFER &amp; RESOURCE SETUP
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Know what the project needs before choosing what happens next.
          </h2>
        </div>

        {/* Workspace Mock Container */}
        <div className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] shadow-sm overflow-hidden flex flex-col">
          {/* Workspace Tabs Header */}
          <div className="w-full px-5 py-3.5 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <span
                  key={tab}
                  className={`px-3 py-1 rounded-[6px] text-[12px] whitespace-nowrap cursor-pointer ${
                    tab === 'Path Previews'
                      ? 'bg-[#F1F5FF] text-[#3C61DD] font-bold shadow-xs'
                      : 'text-[#8A8B8F] hover:text-[#070707]'
                  }`}
                >
                  {tab}
                </span>
              ))}
            </div>

            <span className="text-[12px] font-bold text-[#8A8B8F] uppercase tracking-wider">
              PROJECT: NOVA SPACE
            </span>
          </div>

          {/* 3 Workspace Cards Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Resource Needs */}
            <div className="bg-[#F9F9FA] rounded-[18px] p-5 sm:p-6 border border-[rgba(0,0,0,0.06)] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <Briefcase size={18} className="text-[#3C61DD]" />
                  <h3 className="font-heading font-bold text-[16px] text-[#070707]">RESOURCE NEEDS</h3>
                </div>
                <div className="border-t border-[rgba(0,0,0,0.06)] pt-3 flex flex-col gap-2.5 text-[12px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#3E3E3E]">Marketplace Development</span>
                    <span className="font-bold text-red-600 bg-red-100/70 px-2 py-0.5 rounded-[4px] text-[11px]">CRITICAL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#3E3E3E]">Launch Operations</span>
                    <span className="font-bold text-[#3C61DD] bg-[#F1F5FF] px-2 py-0.5 rounded-[4px] text-[11px]">MEDIUM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#3E3E3E]">Customer Acquisition</span>
                    <span className="font-bold text-[#8A8B8F] bg-[#EDEDED] px-2 py-0.5 rounded-[4px] text-[11px]">LOW</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#3E3E3E]">Legal Support</span>
                    <span className="font-bold text-[#00A854] bg-[#D4FFE5] px-2 py-0.5 rounded-[4px] text-[11px]">COMPLETE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Skills Gaps */}
            <div className="bg-[#F9F9FA] rounded-[18px] p-5 sm:p-6 border border-[rgba(0,0,0,0.06)] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <Lightbulb size={18} className="text-[#3C61DD]" />
                  <h3 className="font-heading font-bold text-[16px] text-[#070707]">SKILLS GAPS</h3>
                </div>
                <div className="border-t border-[rgba(0,0,0,0.06)] pt-3 flex flex-col gap-2 text-[12px]">
                  <div className="flex justify-between items-center pb-1">
                    <span className="font-medium text-[#070707]">Marketplace Development</span>
                    <span className="font-bold text-red-600 text-[11px]">HIGH PRIORITY</span>
                  </div>
                  <span className="text-[#5E5E5E]">• Backend Integration</span>
                  <span className="text-[#5E5E5E]">• Marketplace Operations</span>
                  <span className="text-[#5E5E5E]">• Growth Marketing</span>
                </div>
              </div>
            </div>

            {/* Card 3: Actionable Options */}
            <div className="bg-[#F1F5FF] rounded-[18px] p-5 sm:p-6 border border-[#3C61DD]/20 flex flex-col justify-between gap-4 shadow-sm">
              <div className="flex flex-col gap-3">
                <h3 className="font-heading font-bold text-[16px] text-[#3C61DD]">ACTIONABLE OPTIONS</h3>
                <div className="border-t border-[#3C61DD]/20 pt-3 flex flex-col gap-2.5">
                  <Link
                    href="/signup"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] hover:bg-[#F9F9FA] text-[12px] font-semibold text-[#070707] transition-colors"
                  >
                    <span>Find Provider</span>
                    <ArrowRight size={14} className="text-[#3C61DD]" />
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] hover:bg-[#F9F9FA] text-[12px] font-semibold text-[#070707] transition-colors"
                  >
                    <span>Find Co-founder</span>
                    <ArrowRight size={14} className="text-[#3C61DD]" />
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] hover:bg-[#F9F9FA] text-[12px] font-semibold text-[#070707] transition-colors"
                  >
                    <span>Build Internally</span>
                    <ArrowRight size={14} className="text-[#3C61DD]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Summary Footer */}
          <div className="px-6 py-4 bg-[#F1F5FF] border-t border-[#3C61DD]/15 flex items-center justify-between flex-wrap gap-3 text-[13px]">
            <div className="flex items-center gap-3 font-semibold text-[#3C61DD]">
              <span>Project Summary Structured</span>
              <span className="text-[#8A8B8F]">|</span>
              <span className="text-[#5E5E5E]">Intelligence Complete</span>
              <span className="text-[#8A8B8F]">|</span>
              <span className="text-[#00A854]">Resource Map Ready</span>
            </div>
            <span className="text-[12px] font-bold text-[#3C61DD]">Phase 04 Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
