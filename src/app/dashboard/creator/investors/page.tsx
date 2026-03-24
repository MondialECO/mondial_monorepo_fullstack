"use client"

import { ArrowUpRight } from "lucide-react"

const investors = [
  {
    name: "Aaliyah Taylor",
    email: "aaliyah.taylor@gmail.com",
    concept: "Smart City Energy Grid",
    date: "22 January 2027",
    amount: "$90,000",
    equity: "4.00%",
    stage: "Seed",
  },
  {
    name: "Finley Thompson",
    email: "finley.thompson@gmail.com",
    concept: "Sustainable Agriculture Tech",
    date: "15 February 2027",
    amount: "$75,000",
    equity: "3.25%",
    stage: "Series A",
  },
  {
    name: "Harper Wilson",
    email: "harper.wilson@gmail.com",
    concept: "Wearable Health Monitoring",
    date: "01 January 2027",
    amount: "$110,000",
    equity: "5.00%",
    stage: "Angel",
  },
  {
    name: "Leo Wright",
    email: "leo.wright@gmail.com",
    concept: "Eco-Friendly Packaging Solutions",
    date: "12 February 2027",
    amount: "$120,000",
    equity: "5.25%",
    stage: "Series B",
  },
]

const equityDistributions = [
  {
    title: "Launch a Mobile Pet Grooming Service",
    totalEquity: 25,
    soldPercent: 12.5,
    soldAmount: "$62,500",
    availablePercent: 12.5,
    availableAmount: "$62,500",
  },
  {
    title: "Develop an AI-Powered Language Tutor",
    totalEquity: 24,
    soldPercent: 24,
    soldAmount: "$120,000",
    availablePercent: 0,
    availableAmount: "",
  },
]

export default function InvestmentDashboard() {
  return (
    <div className="space-y-4 sm:space-y-8">
      {/* 1. QUICK STATS */}
      <div className="w-full p-2 sm:p-3 bg-muted rounded-2xl shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-2 outline-offset-[-2px] outline-border flex flex-col sm:flex-row justify-start items-stretch sm:items-center gap-2 sm:gap-3">
        {[
          { label: "Investors", value: "03" },
          { label: "Total Raised", value: "$970K" },
          { label: "Total equity", value: "38%" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex-1 p-3 sm:p-4 bg-card rounded-xl outline outline-1 outline-offset-[-1px] outline-border/5 inline-flex flex-col justify-center items-start gap-1.5 sm:gap-2.5"
          >
            <div className="inline-flex justify-between items-center">
              <div className="text-muted-foreground text-sm font-medium font-['Inter'] leading-5">
                {item.label}
              </div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start gap-4">
              <div className="text-foreground text-[30px] font-bold font-['Inter'] leading-tight">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. INVESTOR INSIGHTS */}
      <div className="w-full px-3 pt-5 pb-3 sm:px-5 sm:pt-8 sm:pb-5 bg-muted rounded-2xl shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-2 outline-offset-[-2px] outline-border inline-flex flex-col justify-start items-start gap-4 sm:gap-5">
        <div className="flex flex-col justify-start items-start gap-2">
          <div className="self-stretch text-foreground text-[20px] font-semibold font-['Inter'] leading-7">
            Investor Insights
          </div>
          <div className="self-stretch text-muted-foreground text-sm font-normal font-['Inter'] leading-5">
            Explore investment prospects and manage your investments
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="self-stretch bg-muted rounded-xl shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-1 outline-offset-[-1px] outline-border/10 hidden md:inline-flex justify-start items-start overflow-hidden">
          {/* Investor Column */}
          <div className="w-64 inline-flex flex-col justify-start items-start">
            <div className="self-stretch h-11 px-6 py-3 bg-muted inline-flex justify-start items-center gap-3">
              <div className="text-muted-foreground text-sm font-medium font-['Inter'] leading-5">Investor</div>
            </div>
            {investors.map((row, i) => (
              <div
                key={i}
                className={`self-stretch h-20 px-6 py-4 inline-flex justify-start items-center gap-3 ${i % 2 === 0 ? "bg-card border-t border-b border-border/5" : ""
                  }`}
              >
                <img className="w-10 h-10 rounded-full" src={`https://i.pravatar.cc/40?u=${row.name}`} alt={row.name} />
                <div className="inline-flex flex-col justify-start items-start">
                  <div className="text-foreground text-sm font-semibold font-['Inter'] leading-5">{row.name}</div>
                  <div className="text-muted-foreground text-[12px] font-normal font-['Inter'] leading-5">{row.email}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Concept Column */}
          <div className="flex-1 inline-flex flex-col justify-start items-start">
            <div className="self-stretch h-11 px-6 py-3 bg-muted inline-flex justify-start items-center gap-3">
              <div className="text-muted-foreground text-sm font-medium font-['Inter'] leading-5">Concept</div>
            </div>
            {investors.map((row, i) => (
              <div
                key={i}
                className={`self-stretch h-20 px-6 py-4 inline-flex justify-start items-center ${i % 2 === 0 ? "bg-card border-t border-b border-border/5" : ""
                  }`}
              >
                <div className="flex-1 text-muted-foreground text-sm font-normal font-['Inter'] leading-5">{row.concept}</div>
              </div>
            ))}
          </div>

          {/* Created Column */}
          <div className="w-40 inline-flex flex-col justify-start items-start">
            <div className="self-stretch h-11 px-6 py-3 bg-muted inline-flex justify-start items-center gap-3">
              <div className="text-muted-foreground text-sm font-medium font-['Inter'] leading-5">Created</div>
            </div>
            {investors.map((row, i) => (
              <div
                key={i}
                className={`self-stretch h-20 px-6 py-4 inline-flex justify-start items-center ${i % 2 === 0 ? "bg-card border-t border-b border-border/5" : ""
                  }`}
              >
                <div className="text-muted-foreground text-sm font-normal font-['Inter'] leading-5">{row.date}</div>
              </div>
            ))}
          </div>

          {/* Investment Column */}
          <div className="w-40 inline-flex flex-col justify-start items-start">
            <div className="self-stretch h-11 px-6 py-3 bg-muted inline-flex justify-start items-center gap-3">
              <div className="text-muted-foreground text-sm font-medium font-['Inter'] leading-5">Investment</div>
            </div>
            {investors.map((row, i) => (
              <div
                key={i}
                className={`self-stretch h-20 px-6 py-4 inline-flex justify-start items-center ${i % 2 === 0 ? "bg-card border-t border-b border-border/5" : ""
                  }`}
              >
                <div className="text-foreground text-sm font-normal font-['Inter'] leading-5">{row.amount}</div>
              </div>
            ))}
          </div>

          {/* Equity Column */}
          <div className="w-40 inline-flex flex-col justify-start items-start">
            <div className="self-stretch h-11 px-6 py-3 bg-muted inline-flex justify-start items-center gap-3">
              <div className="text-muted-foreground text-sm font-medium font-['Inter'] leading-5">Equity</div>
            </div>
            {investors.map((row, i) => (
              <div
                key={i}
                className={`self-stretch h-20 px-6 py-4 inline-flex justify-start items-center ${i % 2 === 0 ? "bg-card border-t border-b border-border/5" : ""
                  }`}
              >
                <div className="text-muted-foreground text-sm font-normal font-['Inter'] leading-5">{row.equity}</div>
              </div>
            ))}
          </div>

          {/* Stage Column */}
          <div className="w-40 inline-flex flex-col justify-start items-start">
            <div className="self-stretch h-11 px-6 py-3 bg-muted inline-flex justify-start items-center gap-3">
              <div className="text-muted-foreground text-sm font-medium font-['Inter'] leading-5">Stage</div>
            </div>
            {investors.map((row, i) => (
              <div
                key={i}
                className={`self-stretch h-20 px-6 py-4 inline-flex justify-start items-center ${i % 2 === 0 ? "bg-card border-t border-b border-border/5" : ""
                  }`}
              >
                <div className="px-2 py-0.5 bg-muted rounded outline outline-1 outline-offset-[-1px] outline-border/5 flex justify-start items-center gap-1">
                  <div className="text-center text-foreground text-xs font-normal font-['Inter'] leading-5">{row.stage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="self-stretch md:hidden flex flex-col gap-3">
          {investors.map((row, i) => (
            <div
              key={i}
              className="p-4 bg-muted rounded-xl outline outline-1 outline-offset-[-1px] outline-border/5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <img className="w-10 h-10 rounded-full" src={`https://i.pravatar.cc/40?u=${row.name}`} alt={row.name} />
                <div className="flex flex-col">
                  <div className="text-foreground text-sm font-medium font-['Inter'] leading-5">{row.name}</div>
                  <div className="text-muted-foreground text-xs font-normal font-['Inter'] leading-5">{row.email}</div>
                </div>
              </div>
              <div className="text-muted-foreground text-sm font-normal font-['Inter'] leading-5">
                <span className="text-foreground font-medium">Concept:</span> {row.concept}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Investment</div>
                  <div className="text-foreground font-medium">{row.amount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Equity</div>
                  <div className="text-muted-foreground">{row.equity}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Created</div>
                  <div className="text-muted-foreground">{row.date}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Stage</div>
                  <div className="px-2 py-0.5 bg-muted rounded outline outline-1 outline-offset-[-1px] outline-border/5 inline-flex items-center">
                    <span className="text-foreground text-xs font-normal">{row.stage}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. EQUITY DISTRIBUTION */}
      <div className="w-full px-3 pt-5 pb-3 sm:px-5 sm:pt-8 sm:pb-5 bg-card rounded-2xl shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] inline-flex flex-col justify-start items-start gap-4 sm:gap-5">
        <div className="flex flex-col justify-start items-start gap-2">
          <div className="text-foreground text-[20px] font-semibold font-['Inter'] leading-7">
            Equity Distribution by Idea
          </div>
          <div className="self-stretch text-muted-foreground text-sm font-normal font-['Inter'] leading-5">
            Manage your ideas in this space
          </div>
        </div>

        <div className="self-stretch rounded-xl shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-1 outline-offset-[-1px] outline-border/5 flex flex-col justify-start items-start overflow-hidden">
          {equityDistributions.map((item, i) => {
            const soldWidth = item.totalEquity > 0 ? (item.soldPercent / item.totalEquity) * 100 : 0

            return (
              <div
                key={i}
                className="self-stretch p-4 sm:p-6 bg-card inline-flex justify-start items-start gap-1"
              >
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-4">
                  {/* Title row */}
                  <div className="self-stretch flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ArrowUpRight className="w-5 h-5 text-foreground shrink-0" />
                      <div className="text-foreground text-[16px] font-medium font-['Inter'] leading-tight line-clamp-1">
                        {item.title}
                      </div>
                    </div>
                    <div className="sm:flex-1 sm:text-right text-foreground text-sm font-semibold font-['Inter'] leading-6 shrink-0">
                      Total Equity {item.totalEquity.toFixed(2)}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="self-stretch rounded-xl flex flex-col justify-start items-start gap-2">
                    <div className="self-stretch inline-flex justify-start items-start gap-2">
                      <div className="flex-1 text-lime-600 text-xs font-medium font-['Inter'] leading-5">
                        Sold
                      </div>
                    </div>
                    <div className="self-stretch h-7 sm:h-9 relative bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full absolute left-0 top-0 bg-lime-600 rounded-lg transition-all"
                        style={{ width: `${soldWidth}%` }}
                      />
                    </div>
                    <div className="text-foreground text-xs font-normal font-['Inter'] leading-5 line-clamp-1">
                      Size: {item.soldAmount}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
