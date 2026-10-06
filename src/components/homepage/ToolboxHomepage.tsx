import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  FileText,
  Gauge,
  Globe2,
  Layers3,
  LayoutDashboard,
  Palette,
  Route,
  Sparkles,
  UserRound,
} from "lucide-react";

const generators = [
  {
    name: "Digital CV",
    description: "Turn your CV into an interactive, professional profile website.",
    image: "/homepage-toolbox/digital-cv.svg",
    icon: UserRound,
    accent: "bg-[#eef3ff] text-[#3c61dd]",
  },
  {
    name: "Business Plan",
    description: "Build a complete, structured business plan ready to present.",
    image: "/homepage-toolbox/business-plan.svg",
    icon: FileText,
    accent: "bg-[#fff1f0] text-[#ef5d67]",
  },
  {
    name: "Financial Forecast",
    description: "Create realistic revenue, cost, cash-flow and break-even projections.",
    image: "/homepage-toolbox/forecast.svg",
    icon: BarChart3,
    accent: "bg-[#ecfbf3] text-[#00a86b]",
  },
  {
    name: "Brand Identity",
    description: "Generate your visual universe: logo direction, colors and positioning.",
    image: "/homepage-toolbox/brand-kit.svg",
    icon: Palette,
    accent: "bg-[#f3edff] text-[#7b55e7]",
  },
  {
    name: "Showcase Website",
    description: "Generate a modern website that reuses your project and brand data.",
    image: "/homepage-toolbox/website.svg",
    icon: Globe2,
    accent: "bg-[#eaf8ff] text-[#269bc2]",
  },
  {
    name: "Smart Roadmap",
    description: "Turn your project into a clear, actionable step-by-step plan.",
    image: "/homepage-toolbox/roadmap.svg",
    icon: Route,
    accent: "bg-[#fff5e5] text-[#e79a22]",
  },
];

const extraTools = [
  "Market Study",
  "Competitor Analysis",
  "Business Model",
  "Marketing Strategy",
  "Go-to-Market Plan",
  "Pitch Builder",
  "Grants & Funding",
  "Training Plan",
  "Legal & Admin Guide",
  "Pricing & Offers",
  "Customer Persona",
  "Launch Assets",
];

export default function ToolboxHomepage() {
  return (
    <>
      <section className="relative overflow-hidden bg-white border-b border-[#e8ecf2]">
        <div className="absolute inset-x-0 top-0 h-[680px] pointer-events-none">
          <div className="absolute -right-28 -top-40 h-[560px] w-[560px] rounded-full bg-[#dceaff] blur-3xl opacity-80" />
          <div className="absolute left-[42%] top-28 h-[360px] w-[360px] rounded-full bg-[#eef3ff] blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-14 sm:px-8 md:pt-20 lg:grid-cols-[0.88fr_1.12fr] lg:px-12 xl:px-16">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bfd0ff] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3c61dd] shadow-2xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              MBC Creator · Intelligent Toolbox
            </div>

            <h1 className="mt-6 max-w-[700px] font-heading text-[52px] font-bold leading-[0.94] tracking-[-0.055em] text-[#0d1735] sm:text-[64px] md:text-[74px] xl:text-[84px]">
              Build your profile.
              <br />
              Build your project.
              <br />
              <span className="text-[#3c61dd]">Generate the rest.</span>
            </h1>

            <p className="mt-7 max-w-[650px] text-[17px] leading-7 text-[#5e6a82] sm:text-[18px]">
              Create your Creator Profile, access your personal dashboard and use connected generators to turn your information into real business-ready results.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-[#3c61dd] px-6 text-[14px] font-semibold text-white shadow-lg shadow-[#3c61dd]/20 transition hover:bg-[#3252be]"
              >
                Create my Creator Profile
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#generators"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[13px] border border-[#cfd9ec] bg-white px-6 text-[14px] font-semibold text-[#25334e] transition hover:border-[#aebee0] hover:bg-[#f9fbff]"
              >
                Explore the generators
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-medium text-[#4f5b72]">
              {["Creator Profile", "Personal Dashboard", "Connected Generators", "Concrete Results"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e8eeff] text-[#3c61dd]">
                    <BadgeCheck className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[580px] lg:min-h-[620px]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(60,97,221,.16),transparent_62%)]" />

            <div className="absolute left-0 top-10 w-full max-w-[760px] overflow-hidden rounded-[28px] border border-[#dfe6f2] bg-white shadow-[0_40px_100px_-36px_rgba(31,63,175,.42)] lg:left-[-10px]">
              <div className="flex h-14 items-center justify-between border-b border-[#e8edf5] px-5">
                <div className="flex items-center gap-3">
                  <Image src="/images/mbc-logo.png" alt="MBC" width={68} height={32} className="h-8 w-auto object-contain" />
                  <span className="hidden text-[11px] font-medium text-[#98a2b3] sm:inline">Creator Dashboard</span>
                </div>
                <div className="h-8 w-[38%] rounded-full bg-[#f3f6fb]" />
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#e3b391] to-[#70503e]" />
              </div>

              <div className="grid min-h-[410px] grid-cols-[116px_1fr] sm:grid-cols-[150px_1fr]">
                <aside className="border-r border-[#e8edf5] bg-[#fafbfe] p-3">
                  <div className="mb-4 rounded-lg bg-[#edf3ff] px-3 py-2 text-[10px] font-semibold text-[#3c61dd]">Dashboard</div>
                  {["My profile", "My project", "Generators", "My results", "Roadmap"].map((item) => (
                    <div key={item} className="px-3 py-2.5 text-[9px] font-medium text-[#667085]">
                      {item}
                    </div>
                  ))}
                </aside>

                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[20px] font-bold text-[#101828]">Hi Léa 👋</div>
                      <div className="mt-1 text-[10px] text-[#7c879a]">Your workspace is ready. Keep building your project.</div>
                    </div>
                    <span className="rounded-full bg-[#ecfbf3] px-3 py-1 text-[9px] font-semibold text-[#128153]">Project active</span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#e5eaf2] p-4">
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span>Project progress</span>
                        <span>70%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf1f7]">
                        <div className="h-full w-[70%] rounded-full bg-[#20bd7a]" />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#e5eaf2] p-4">
                      <div className="text-[10px] font-semibold">My project</div>
                      <div className="mt-2 text-[11px] text-[#667085]">Ethical fashion brand</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {generators.slice(0, 6).map(({ name, icon: Icon, accent }) => (
                      <div key={name} className="rounded-xl border border-[#e5eaf2] bg-white p-3">
                        <div className={`grid h-8 w-8 place-items-center rounded-lg ${accent}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="mt-3 text-[9px] font-semibold text-[#1b2740]">{name}</div>
                        <div className="mt-1 text-[8px] text-[#3c61dd]">Open →</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-3 top-20 hidden w-[210px] rounded-2xl border border-[#dfe6f2] bg-white p-4 shadow-xl shadow-[#1f3faf]/10 xl:block">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8190a7]">Creator Profile</div>
              <div className="mt-2 text-[14px] font-bold text-[#14203b]">One profile feeds every tool.</div>
            </div>

            <div className="absolute bottom-4 right-0 hidden w-[220px] rounded-2xl border border-[#dfe6f2] bg-white p-4 shadow-xl shadow-[#1f3faf]/10 md:block">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8190a7]">MBC Intelligence</div>
              <div className="mt-2 text-[14px] font-bold text-[#14203b]">Your data gets smarter as you build.</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1f7]">
                <div className="h-full w-[82%] rounded-full bg-[#3c61dd]" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mb-8 grid w-full max-w-[1340px] grid-cols-2 overflow-hidden rounded-2xl border border-[#e4e9f2] bg-white shadow-sm sm:grid-cols-4">
          {[
            ["20+", "Intelligent generators"],
            ["1 profile", "Shared across every tool"],
            ["Connected", "Project data stays reusable"],
            ["Concrete", "Outputs you can actually use"],
          ].map(([value, label], index) => (
            <div key={label} className={`px-5 py-5 ${index < 3 ? "sm:border-r sm:border-[#e8edf4]" : ""}`}>
              <div className="text-[20px] font-bold text-[#101828]">{value}</div>
              <div className="mt-1 text-[10px] text-[#7a869a]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="generators" className="bg-white py-20 sm:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3c61dd]">Concrete tools. Real results.</div>
              <h2 className="mt-3 max-w-[800px] font-heading text-[40px] font-bold leading-[1.02] tracking-[-0.04em] text-[#0d1735] sm:text-[50px]">
                Your project deserves more than generic AI answers.
              </h2>
              <p className="mt-4 max-w-[720px] text-[15px] leading-7 text-[#667085]">
                Every MBC generator produces a finished output and reuses the information already stored in your Creator Profile and project.
              </p>
            </div>
            <Link href="#all-tools" className="text-[13px] font-semibold text-[#3c61dd]">
              See the full toolbox →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {generators.map(({ name, description, image, icon: Icon, accent }) => (
              <article key={name} className="group flex overflow-hidden rounded-[22px] border border-[#e3e8f2] bg-white shadow-[0_14px_40px_-28px_rgba(31,63,175,.35)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(31,63,175,.4)] lg:min-h-[430px] xl:flex-col">
                <div className="relative h-[220px] w-[46%] overflow-hidden bg-[#f5f8ff] lg:h-[200px] lg:w-full xl:h-[170px]">
                  <Image src={image} alt={`${name} output preview`} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="(max-width: 1024px) 50vw, 16vw" />
                </div>
                <div className="flex flex-1 flex-col p-5 xl:p-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">Generator</div>
                  <h3 className="mt-1 text-[16px] font-bold text-[#17213b]">{name}</h3>
                  <p className="mt-2 text-[12px] leading-5 text-[#667085]">{description}</p>
                  <div className="mt-auto pt-5 text-[12px] font-semibold text-[#3c61dd]">See an example →</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden bg-[#f7f9fc] py-20 sm:py-24">
        <div className="absolute right-[-140px] top-[-160px] h-[520px] w-[520px] rounded-full bg-[#e8eeff] blur-3xl" />
        <div className="relative mx-auto w-full max-w-[1340px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-[800px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3c61dd]">How MBC works</div>
            <h2 className="mt-3 font-heading text-[40px] font-bold leading-[1.03] tracking-[-0.04em] text-[#0d1735] sm:text-[52px]">
              One connected system. Not twenty disconnected forms.
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-[#667085]">
              Your Creator Profile becomes MBC&apos;s memory. Your project adds context. Every generator reuses that knowledge and each result enriches what comes next.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              { n: "01", title: "Create your Creator Profile", copy: "Import your CV or add your skills, experience, goals and useful documents.", icon: UserRound },
              { n: "02", title: "Define your project", copy: "Give MBC the core information about your idea, audience, offer and objectives.", icon: BriefcaseBusiness },
              { n: "03", title: "Use connected generators", copy: "Choose the output you need. MBC reuses what it already knows instead of asking again.", icon: Sparkles },
              { n: "04", title: "Keep and reuse every result", copy: "Business plans, forecasts, brand assets and websites become part of your project memory.", icon: Layers3 },
            ].map(({ n, title, copy, icon: Icon }) => (
              <article key={n} className="relative rounded-[24px] border border-[#dde5f2] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8eeff] text-[#3c61dd]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold tracking-widest text-[#a0abc0]">{n}</span>
                </div>
                <h3 className="mt-6 text-[18px] font-bold text-[#16213a]">{title}</h3>
                <p className="mt-3 text-[13px] leading-6 text-[#6b768b]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="dashboard" className="bg-[#0d1735] py-20 text-white sm:py-24">
        <div className="mx-auto grid w-full max-w-[1340px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
          <div className="flex flex-col justify-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9db5ff]">Your MBC workspace</div>
            <h2 className="mt-3 font-heading text-[42px] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[54px]">
              Your dashboard becomes your project workshop.
            </h2>
            <p className="mt-5 max-w-[600px] text-[15px] leading-7 text-[#aebbd5]">
              Keep your profile, project, generators, results and progress in one place. The interface shows what is ready, what needs attention and what tool can move you forward next.
            </p>
            <div className="mt-8 grid max-w-[560px] grid-cols-2 gap-4">
              {[
                ["72%", "Project built"],
                ["6", "Generators used"],
                ["14", "Results created"],
                ["4", "Next actions"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-white/10 bg-white/[.05] p-5">
                  <div className="text-[28px] font-bold">{v}</div>
                  <div className="mt-1 text-[11px] text-[#9eabc3]">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white text-[#101828] shadow-2xl shadow-black/25">
            <div className="flex h-14 items-center justify-between border-b border-[#e8edf4] px-5">
              <div className="flex items-center gap-3">
                <Image src="/images/mbc-logo.png" alt="MBC" width={66} height={30} className="h-8 w-auto" />
                <span className="text-[11px] text-[#98a2b3]">Creator Workspace</span>
              </div>
              <span className="rounded-full bg-[#ecfbf3] px-3 py-1 text-[9px] font-semibold text-[#128153]">Project active</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr]">
              <div className="hidden border-r border-[#e8edf4] bg-[#fafbfe] p-4 sm:block">
                {[
                  ["Dashboard", LayoutDashboard],
                  ["Profile", UserRound],
                  ["Project", BriefcaseBusiness],
                  ["Generators", Sparkles],
                  ["Results", Layers3],
                  ["Roadmap", Route],
                ].map(([label, Icon], index) => (
                  <div key={label as string} className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[10px] ${index === 0 ? "bg-[#edf3ff] font-semibold text-[#3c61dd]" : "text-[#667085]"}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {label as string}
                  </div>
                ))}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[20px] font-bold">Welcome back, Léa 👋</h3>
                    <p className="mt-1 text-[10px] text-[#7f8a9e]">Continue building your project from where you left off.</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["72%", "Project"],
                    ["6", "Tools used"],
                    ["14", "Results"],
                    ["3", "Goals"],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-xl border border-[#e6ebf3] p-3">
                      <div className="text-[17px] font-bold">{v}</div>
                      <div className="text-[8px] text-[#8a95a7]">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {generators.slice(0, 6).map(({ name, icon: Icon, accent }) => (
                    <div key={name} className="rounded-xl border border-[#e6ebf3] p-3">
                      <div className={`grid h-8 w-8 place-items-center rounded-lg ${accent}`}><Icon className="h-4 w-4" /></div>
                      <div className="mt-3 text-[10px] font-semibold">{name}</div>
                      <div className="mt-1 text-[8px] text-[#7d899d]">Open generator →</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="all-tools" className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid w-full max-w-[1340px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3c61dd]">The full toolbox</div>
            <h2 className="mt-3 font-heading text-[40px] font-bold leading-[1.03] tracking-[-0.04em] text-[#0d1735] sm:text-[52px]">
              Six launch tools first. A complete toolbox behind them.
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[#667085]">
              The six main generators deliver immediate value. As MBC grows, the same Creator Profile and project memory power the rest of the toolbox.
            </p>
            <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-[13px] bg-[#3c61dd] px-5 py-3 text-[14px] font-semibold text-white">
              Start building
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {extraTools.map((tool, index) => (
              <div key={tool} className="rounded-2xl border border-[#e3e8f2] bg-[#fbfcff] p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#3c61dd] shadow-sm">
                  {index % 3 === 0 ? <Gauge className="h-4 w-4" /> : index % 3 === 1 ? <Layers3 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="mt-3 text-[12px] font-semibold text-[#26324a]">{tool}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-20 sm:pb-24">
        <div className="mx-auto w-full max-w-[1340px] px-5 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#123f9a,#2563eb_65%,#4d83ff)] px-7 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
            <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/15 blur-2xl" />
            <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c8d7ff]">Ready to start?</div>
                <h2 className="mt-3 font-heading text-[40px] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[50px]">
                  One profile. One dashboard. Every tool you need to move forward.
                </h2>
                <p className="mt-4 max-w-[700px] text-[14px] leading-7 text-[#dce6ff]">
                  Create your Creator Profile, open your workspace and let MBC turn what it knows about you and your project into useful, reusable outputs.
                </p>
              </div>
              <div className="lg:text-right">
                <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-white px-6 text-[14px] font-semibold text-[#2855ce] shadow-xl">
                  Create my Creator Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-[#dbe6ff] lg:justify-end">
                  <span>Free to get started</span>
                  <span>Connected workspace</span>
                  <span>Built for creators</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
