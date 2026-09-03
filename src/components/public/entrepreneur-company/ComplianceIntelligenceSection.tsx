'use client';

import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Clock, Eye, AlertCircle, FileText } from 'lucide-react';

export default function ComplianceIntelligenceSection() {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filters = ['ALL', 'REQUIRED', 'CONTEXTUAL', 'OPTIONAL', 'NOT APPLICABLE'];

  const rows = [
    {
      area: 'Company Registration',
      requirement: 'REQUIRED',
      status: 'VERIFIED',
      statusColor: 'green',
      visibility: 'Private Verification',
      action: 'View',
    },
    {
      area: 'Bank Certificate',
      requirement: 'REQUIRED',
      status: 'VERIFIED',
      statusColor: 'green',
      visibility: 'Private Verification',
      action: 'View',
    },
    {
      area: 'Tax Information',
      requirement: 'CONTEXTUAL',
      status: 'IN PROGRESS',
      statusColor: 'blue',
      visibility: 'Private Verification',
      action: 'Update',
    },
    {
      area: 'Insurance',
      requirement: 'CONTEXTUAL',
      status: 'NEEDS REVIEW',
      statusColor: 'amber',
      visibility: 'Company Controlled',
      action: 'Review',
      highlighted: true,
    },
    {
      area: 'Financial Statements',
      requirement: 'OPTIONAL',
      status: 'AVAILABLE',
      statusColor: 'green',
      visibility: 'Investor Data Room',
      action: 'Manage',
    },
    {
      area: 'Professional Licence',
      requirement: 'NOT APPLICABLE',
      status: 'EXEMPT',
      statusColor: 'gray',
      visibility: 'Public Record',
      action: 'Details',
    },
  ];

  const filteredRows =
    activeFilter === 'ALL' ? rows : rows.filter((r) => r.requirement === activeFilter);

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            DOCUMENT &amp; COMPLIANCE READINESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Not every company needs the same documents.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial distinguishes what is required, contextual, optional or not applicable based on company situation and jurisdiction.
          </p>
        </div>

        {/* Workspace Card */}
        <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] overflow-hidden shadow-lg flex flex-col">
          {/* Top Bar */}
          <div className="p-5 sm:p-6 bg-[#F3F2FD] border-b border-[#E2E1EC] flex flex-wrap items-center justify-between gap-4 text-[12px]">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">COMPANY</span>
                <span className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  NOVA SPACE SAS
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#E2E1EC]" />
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">COUNTRY</span>
                <span className="font-semibold text-[#1A1B23]">France</span>
              </div>
              <div className="h-6 w-[1px] bg-[#E2E1EC]" />
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">ACTIVITY</span>
                <span className="text-[#1A1B23]">Flexible Workspace Marketplace</span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold uppercase border border-amber-200">
              REVIEW IN PROGRESS
            </span>
          </div>

          {/* Body: Table + Detail Panel Grid */}
          <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Filters & Table (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all ${
                      activeFilter === f
                        ? 'bg-[#3C61DD] text-white shadow-xs'
                        : 'bg-white border border-[#E2E1EC] text-[#444654] hover:bg-white/80'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Responsive Table */}
              <div className="bg-white border border-[#E2E1EC] rounded-[18px] overflow-hidden overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse min-w-[550px] text-[12px]">
                  <thead>
                    <tr className="bg-[#FAF8FF] border-b border-[#E2E1EC] text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                      <th className="p-3.5 pl-5">AREA</th>
                      <th className="p-3.5">REQUIREMENT</th>
                      <th className="p-3.5">STATUS</th>
                      <th className="p-3.5">VISIBILITY</th>
                      <th className="p-3.5 pr-5">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                    {filteredRows.map((r) => (
                      <tr
                        key={r.area}
                        className={`hover:bg-[#FAF8FF]/60 transition-colors ${
                          r.highlighted ? 'bg-[#F1F5FF]/40' : ''
                        }`}
                      >
                        <td className="p-3.5 pl-5 font-semibold text-[#1A1B23]">{r.area}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.requirement === 'REQUIRED'
                                ? 'bg-[#E2E1EC] text-[#1A1B23]'
                                : r.requirement === 'CONTEXTUAL'
                                ? 'bg-[#FAF8FF] border border-[#E2E1EC] text-[#444654]'
                                : r.requirement === 'OPTIONAL'
                                ? 'bg-gray-100 text-[#747685]'
                                : 'bg-gray-50 text-[#8A8B8F]'
                            }`}
                          >
                            {r.requirement}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              r.statusColor === 'green'
                                ? 'bg-[#E8F8EE] text-[#00A854]'
                                : r.statusColor === 'blue'
                                ? 'bg-[#F1F5FF] text-[#3C61DD]'
                                : r.statusColor === 'amber'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-gray-100 text-[#8A8B8F]'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#444654]">{r.visibility}</td>
                        <td className="p-3.5 pr-5">
                          <span className="text-[#3C61DD] font-semibold hover:underline cursor-pointer">
                            {r.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Insurance Detail Panel (4 cols) */}
            <div className="lg:col-span-4 bg-white border-2 border-[#3C61DD]/30 rounded-[20px] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-sm text-[12px]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                  <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">INSURANCE</h4>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px] uppercase border border-amber-200">
                    NEEDS REVIEW
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                    WHY IT MAY MATTER
                  </span>
                  <p className="text-[#444654] leading-relaxed">
                    Operating a marketplace connecting third-party workspaces may require general liability insurance depending on user agreement terms.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-[8px] bg-[#3C61DD] hover:bg-[#3252BF] text-white text-[11px] font-bold transition-all shadow-xs"
                >
                  Confirm Requirement
                </button>
                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] text-[11px] font-medium transition-colors"
                >
                  Add Information
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
