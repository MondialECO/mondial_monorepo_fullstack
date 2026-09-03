'use client';

export default function FigmaProblem() {
  const painPoints = [
    {
      number: '01',
      title: 'Scattered',
      desc: 'A deck, a spreadsheet, a folder of half-finished documents. Nothing connects to anything.',
    },
    {
      number: '02',
      title: 'Blind',
      desc: "You learn you weren't ready only after the answer is already no.",
    },
    {
      number: '03',
      title: 'Reactive',
      desc: 'Legal, tax and cap table issues surface at deal close when it costs 10x more to fix.',
    },
  ];

  return (
    <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 max-w-[800px]">
          <h2 className="text-[28px] sm:text-[38px] md:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Europe&apos;s founders don&apos;t fail at ideas. They fail at proof.
          </h2>
          <p className="text-[14px] sm:text-[17px] md:text-[18px] text-[#5E5E5E] leading-[1.6]">
            The plan lives in a doc. The numbers live in a spreadsheet. The lawyer is a cost you
            postpone. The investor sees none of it — until you ask, and get a polite no that explains
            nothing.
          </p>
        </div>

        {/* 3 Pain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {painPoints.map((pain) => (
            <div
              key={pain.number}
              className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 sm:p-8 flex flex-col gap-3 sm:gap-4"
            >
              <span className="text-[12px] sm:text-[13px] font-semibold text-[#3C61DD] tracking-wider">
                {pain.number}
              </span>
              <h3 className="text-[19px] sm:text-[22px] font-heading font-bold text-[#070707]">
                {pain.title}
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] leading-[1.6]">
                {pain.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
