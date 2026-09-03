'use client';

import { Users, UserCheck, Shield, KeyRound, CheckCircle2 } from 'lucide-react';

export default function RepresentativesControlSection() {
  const definitions = [
    {
      title: 'Representative',
      desc: 'The legal individual or entity authorized to formally act for the company.',
      icon: UserCheck,
    },
    {
      title: 'Owner / Shareholder',
      desc: 'Individuals or entities holding ownership or equity interest.',
      icon: Shield,
    },
    {
      title: 'Platform User',
      desc: 'Personnel granted authenticated access to the Mondial workspace.',
      icon: KeyRound,
    },
  ];

  const tableRows = [
    {
      user: 'Henry Martin',
      role: 'Company Admin',
      access: 'FULL COMPANY WORKSPACE',
      color: 'green',
    },
    {
      user: 'Operations Lead',
      role: 'Operations Access',
      access: 'LIMITED',
      color: 'blue',
    },
    {
      user: 'Finance Contact',
      role: 'Financial Access',
      access: 'PENDING',
      color: 'amber',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            WHO STANDS BEHIND THE COMPANY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Know who represents, controls and accesses the business.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Before equity, funding or operations begin, company representatives, ownership context and authorized platform users should be clearly distinguished.
          </p>
        </div>

        {/* Relationship System Visual Card */}
        <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2.5">
              <Users size={18} className="text-[#3C61DD]" />
              <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                COMPANY REPRESENTATION &amp; CONTROL GRAPH
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase">
              NOVA SPACE SAS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[12px]">
            {/* Representative */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block mb-1">
                  REPRESENTATIVE
                </span>
                <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">Henry Martin</h4>
                <p className="text-[#444654]">President • Authority: Representative</p>
              </div>
              <span className="px-2 py-0.5 rounded-[4px] bg-[#E8F8EE] text-[#00A854] text-[10px] font-bold uppercase w-fit inline-flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>VERIFIED</span>
              </span>
            </div>

            {/* Owner / Shareholder */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block mb-1">
                  OWNER / SHAREHOLDER
                </span>
                <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">Founder</h4>
                <p className="text-[#444654]">Equity Holder Structure</p>
              </div>
              <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 text-[10px] font-bold uppercase w-fit border border-amber-200">
                TO BE STRUCTURED
              </span>
            </div>

            {/* Finance Contact */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block mb-1">
                  FINANCE CONTACT
                </span>
                <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">To Be Added</h4>
                <p className="text-[#444654]">Financial Operations Lead</p>
              </div>
              <span className="px-2 py-0.5 rounded-[4px] bg-gray-100 text-[#747685] text-[10px] font-bold uppercase w-fit">
                OPTIONAL
              </span>
            </div>

            {/* Authorized User */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block mb-1">
                  AUTHORIZED USER
                </span>
                <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">Operations Lead</h4>
                <p className="text-[#444654]">Limited Workspace Access</p>
              </div>
              <span className="px-2 py-0.5 rounded-[4px] bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold uppercase w-fit">
                INVITED
              </span>
            </div>
          </div>
        </div>

        {/* 3 Concept Definitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {definitions.map((def) => {
            const Icon = def.icon;
            return (
              <div
                key={def.title}
                className="p-6 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-3 shadow-xs"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#F3F2FD] flex items-center justify-center text-[#3C61DD]">
                  <Icon size={20} />
                </div>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">{def.title}</h4>
                <p className="text-[13px] text-[#444654] leading-relaxed">{def.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Workspace Access & Roles Table */}
        <div className="bg-white border border-[#E2E1EC] rounded-[24px] overflow-hidden shadow-xs flex flex-col">
          <div className="p-5 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)]">
            <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
              Workspace Access &amp; Permissions Demo
            </h4>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] text-[13px]">
              <thead>
                <tr className="bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                  <th className="p-4 pl-6">USER / PARTY</th>
                  <th className="p-4">PLATFORM ROLE</th>
                  <th className="p-4 pr-6">ACCESS LEVEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                {tableRows.map((r) => (
                  <tr key={r.user} className="hover:bg-[#FAF8FF]/60 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-[#1A1B23]">{r.user}</td>
                    <td className="p-4 text-[#444654]">{r.role}</td>
                    <td className="p-4 pr-6">
                      <span
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase ${
                          r.color === 'green'
                            ? 'bg-[#E8F8EE] text-[#00A854]'
                            : r.color === 'blue'
                            ? 'bg-[#F1F5FF] text-[#3C61DD]'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.access}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Statement Banner */}
        <div className="w-full py-5 px-6 rounded-[18px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] text-center">
          <span className="font-heading font-bold text-[15px] sm:text-[17px] text-[#070707] uppercase tracking-wide">
            WHO USES THE PLATFORM IS NOT ALWAYS THE SAME AS WHO OWNS THE COMPANY.
          </span>
        </div>
      </div>
    </section>
  );
}
