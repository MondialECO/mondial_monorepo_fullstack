import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Gauge,
  Lock,
  MessageSquare,
  Pause,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const profile = {
  name: "Maya Rahman",
  initials: "MR",
  title: "Brand systems and launch designer",
  tier: "Tier 3",
  status: "Verified",
  score: 94,
  rating: "4.9",
  response: "28m",
  month: "$4,250",
};

const phaseSteps = [
  {
    title: "Professional identity",
    body: "Confirm name, title, firm, country, website, experience, and primary category.",
    state: "Ready",
  },
  {
    title: "Credential verification",
    body: "Upload category-specific proof such as license, portfolio links, or case studies.",
    state: "Required",
  },
  {
    title: "Tier assignment",
    body: "Review paid-work eligibility, commission rate, and upgrade path.",
    state: "Locked",
  },
  {
    title: "Skills test",
    body: "Optional category test for stronger ranking and public badge.",
    state: "Recommended",
  },
];

const services = [
  {
    title: "Startup Brand Identity Sprint",
    category: "Design",
    status: "Live",
    impressions: "3.4K",
    inquiries: "28",
    revenue: "$8,420",
    conversion: "7.8%",
  },
  {
    title: "Investor Data Room Legal Review",
    category: "Legal",
    status: "Draft",
    impressions: "820",
    inquiries: "9",
    revenue: "$2,100",
    conversion: "4.2%",
  },
  {
    title: "SaaS Launch Pricing Workshop",
    category: "Strategy",
    status: "Paused",
    impressions: "1.1K",
    inquiries: "11",
    revenue: "$3,600",
    conversion: "5.1%",
  },
];

const leads = [
  {
    client: "NovaTech Labs",
    role: "Entrepreneur",
    need: "Legal document preparation before investor meeting",
    source: "Phase 6 Data Room",
    match: 94,
    budget: "$800-$1,500",
    timer: "3h left",
  },
  {
    client: "SarahDesign",
    role: "Creator",
    need: "UI/UX designer for FinTech SaaS prototype",
    source: "Phase 3 Skill Gap",
    match: 89,
    budget: "$600-$1,200",
    timer: "Available",
  },
  {
    client: "Horizon Capital",
    role: "Investor",
    need: "Independent legal due diligence for term-sheet review",
    source: "Investor Data Room",
    match: 97,
    budget: "$2,000-$4,500",
    timer: "5h left",
  },
];

const proposals = [
  {
    client: "CloudX Founder",
    stage: "Draft",
    total: "$950",
    next: "Review milestones before sending",
  },
  {
    client: "AutoPilot AI",
    stage: "Booking",
    total: "$1,800",
    next: "Send contract and confirm escrow",
  },
  {
    client: "EcoTech",
    stage: "Escrow funded",
    total: "$2,400",
    next: "Open milestone workroom",
  },
];

const threads = [
  {
    group: "New Leads",
    name: "NovaTech Labs",
    meta: "Entrepreneur · 94% match",
    unread: 2,
  },
  {
    group: "New Leads",
    name: "SarahDesign",
    meta: "Creator · Phase 3",
    unread: 1,
  },
  {
    group: "Proposals & Bookings",
    name: "CloudX Founder",
    meta: "Proposal draft",
    unread: 0,
  },
  {
    group: "Project Workrooms",
    name: "EcoTech",
    meta: "Milestone 2 · Revision",
    unread: 3,
  },
  {
    group: "Payment / Support",
    name: "Escrow Payments",
    meta: "$817 released",
    unread: 0,
  },
];

const workStrip = [
  "Lead",
  "Proposal",
  "Booking",
  "Contract",
  "Escrow",
  "Milestones",
  "Payment",
  "Review",
];

const notifications = [
  {
    title: "New qualified lead",
    body: "NovaTech Labs needs legal document preparation before an investor meeting.",
    tone: "info" as const,
    time: "12m",
  },
  {
    title: "Milestone deadline 24h",
    body: "EcoTech revision evidence is due tomorrow.",
    tone: "warning" as const,
    time: "1h",
  },
  {
    title: "Payment released",
    body: "$817 was released to your payout balance.",
    tone: "success" as const,
    time: "Today",
  },
];

function PageShell({
  title,
  description,
  eyebrow = "Service Provider",
  action,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1136px] space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-[28px] font-bold leading-tight text-foreground">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card className="gap-3">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          {hint ? <Badge variant="outline">{hint}</Badge> : null}
        </div>
        <div>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSummaryCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border border-border">
            <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
              {profile.initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {profile.name}
              </h2>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">
                <BadgeCheck className="h-3 w-3" />
                {profile.tier} - {profile.status}
              </Badge>
              <Badge variant="outline">Available now</Badge>
              <Badge variant="info">Fast responder</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:min-w-[420px]">
          <MiniStat label="Score" value={String(profile.score)} />
          <MiniStat label="Rating" value={profile.rating} />
          <MiniStat label="Response" value={profile.response} />
          <MiniStat label="Month" value={profile.month} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function GateCard({
  title,
  body,
  state,
}: {
  title: string;
  body: string;
  state: string;
}) {
  const variant =
    state === "Ready" ? "success" : state === "Locked" ? "outline" : "warning";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={variant}>{state}</Badge>
        </div>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ServiceCard({ service }: { service: (typeof services)[number] }) {
  const variant =
    service.status === "Live"
      ? "success"
      : service.status === "Draft"
        ? "warning"
        : "outline";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">{service.title}</CardTitle>
            <CardDescription>{service.category}</CardDescription>
          </div>
          <Badge variant={variant}>{service.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Impressions" value={service.impressions} />
          <MiniStat label="Inquiries" value={service.inquiries} />
          <MiniStat label="Revenue" value={service.revenue} />
          <MiniStat label="Conversion" value={service.conversion} />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button size="sm" variant="outline">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm" variant="outline">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
          <Button size="sm" variant="ghost">
            View as client
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadCard({ lead }: { lead: (typeof leads)[number] }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{lead.client}</h3>
              <Badge variant="info">{lead.role}</Badge>
              <Badge variant="outline">{lead.source}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{lead.need}</p>
          </div>
          <Badge variant={lead.timer.includes("left") ? "warning" : "success"}>
            {lead.timer}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_160px] sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AI match score</span>
              <span className="font-semibold text-foreground">{lead.match}%</span>
            </div>
            <Progress value={lead.match} />
          </div>
          <MiniStat label="Budget" value={lead.budget} />
          <Button>
            <Send className="h-4 w-4" />
            Generate proposal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalCard({ item }: { item: (typeof proposals)[number] }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{item.client}</h3>
            <Badge variant={item.stage === "Escrow funded" ? "success" : "info"}>
              {item.stage}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{item.next}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MiniStat label="Total" value={item.total} />
          <Button variant="outline">Open</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceProviderOverview() {
  return (
    <PageShell
      title="Service Provider Dashboard"
      description="Track verification, services, leads, proposals, projects, earnings, and reputation from one workspace."
      action={
        <Button asChild>
          <Link href="/dashboard/serviceprovider/services/create">
            <Plus className="h-4 w-4" />
            Create service
          </Link>
        </Button>
      }
    >
      <ProfileSummaryCard />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Qualified leads" value="12" icon={Users} hint="+4" />
        <StatCard label="Active projects" value="5" icon={Briefcase} />
        <StatCard label="Escrow pending" value="$3.2K" icon={CreditCard} />
        <StatCard label="Mondial Score" value="94" icon={Gauge} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Unlock path</CardTitle>
            <CardDescription>
              Paid leads unlock after identity, professional verification, and one live service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Provider readiness</span>
                <span className="font-semibold text-foreground">78%</span>
              </div>
              <Progress value={78} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Identity verified",
                "Professional profile started",
                "First service drafted",
                "Payout method missing",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm"
                >
                  {index < 3 ? (
                    <CheckCircle2 className="h-4 w-4 text-success-text" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-warning" />
                  )}
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next best actions</CardTitle>
            <CardDescription>Prioritized from the SP gates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Finish credential verification",
              "Publish Startup Brand Identity Sprint",
              "Add payout method",
              "Respond to NovaTech Labs",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">{item}</span>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export function ServiceProviderPhase2() {
  return (
    <PageShell
      title="Professional Verification"
      description="Complete the sequential Phase 2 flow before paid work, leads, briefs, proposals, and workrooms unlock."
      action={
        <Button asChild variant="outline">
          <Link href="/dashboard/serviceprovider/profile">Open profile</Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Phase 2 progress</h2>
              <p className="text-sm text-muted-foreground">
                Step 2.1 is ready. Later steps stay locked until each previous step is complete.
              </p>
            </div>
            <Badge variant="warning">In progress</Badge>
          </div>
          <Progress value={25} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {phaseSteps.map((step) => (
          <GateCard key={step.title} {...step} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tier preview</CardTitle>
          <CardDescription>
            Skills test and stronger credentials can improve tier and lower commission.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {[
            ["Tier 1", "No paid work", "-"],
            ["Tier 2", "Paid work", "12%"],
            ["Tier 3", "Premium leads", "8%"],
            ["Tier 4", "Priority", "5%"],
          ].map(([tier, paid, commission]) => (
            <div key={tier} className="rounded-lg border bg-background p-4">
              <p className="font-semibold text-foreground">{tier}</p>
              <p className="text-sm text-muted-foreground">{paid}</p>
              <p className="mt-3 text-sm font-semibold text-primary">
                {commission} commission
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function ServiceBuilder() {
  return (
    <PageShell
      title="Create New Service"
      description="Build a marketplace-ready service with pricing, packages, add-ons, requirements, gallery, and publish review."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Service wizard</CardTitle>
            <CardDescription>Six steps adapted from the Stitch hierarchy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Overview",
                "Pricing",
                "AI add-ons",
                "Description",
                "Gallery",
                "Review",
              ].map((step, index) => (
                <div
                  key={step}
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    index === 0 ? "bg-primary/10 text-primary" : "bg-background"
                  )}
                >
                  <span className="font-semibold">{index + 1}. {step}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                Service title
                <Input placeholder="I will design your startup brand identity" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                Category
                <Input placeholder="Design / Brand Identity" />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-foreground">
              Description
              <Textarea
                rows={5}
                placeholder="Describe scope, deliverables, timeline, and client requirements."
              />
            </label>
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    AI pricing assistant
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Category average is $520. Your Standard package at $599 is 15% above market.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline">Save draft</Button>
              <Button>Continue to pricing</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client preview</CardTitle>
            <CardDescription>How this service will read in marketplace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-background p-4">
              <Badge variant="info">Design</Badge>
              <h3 className="mt-3 font-semibold text-foreground">
                Startup Brand Identity Sprint
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Logo direction, visual system, pitch-ready brand assets, and handoff.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Basic" value="$299" />
                <MiniStat label="Standard" value="$599" />
                <MiniStat label="Premium" value="$1,199" />
              </div>
            </div>
            <Badge variant="success">SEO score: High visibility</Badge>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export function ServicesDashboard() {
  return (
    <PageShell
      title="My Services"
      description="Manage services, publishing states, analytics, and marketplace visibility."
      action={
        <Button asChild>
          <Link href="/dashboard/serviceprovider/services/create">
            <Plus className="h-4 w-4" />
            Create service
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4">
        {services.map((service) => (
          <ServiceCard key={service.title} service={service} />
        ))}
      </div>
    </PageShell>
  );
}

export function LeadsAndBriefs({ mode }: { mode: "leads" | "briefs" }) {
  return (
    <PageShell
      title={mode === "leads" ? "Ecosystem Leads" : "Client Briefs"}
      description={
        mode === "leads"
          ? "Qualified leads arrive from Creator, Entrepreneur, and Investor journey triggers."
          : "Review expiring client briefs and apply where your services match."
      }
    >
      <Tabs defaultValue={mode === "leads" ? "ecosystem" : "briefs"}>
        <TabsList>
          <TabsTrigger value="ecosystem">Ecosystem leads</TabsTrigger>
          <TabsTrigger value="briefs">Client briefs</TabsTrigger>
          <TabsTrigger value="push">AI push matches</TabsTrigger>
        </TabsList>
        <TabsContent value="ecosystem" className="space-y-4">
          {leads.map((lead) => (
            <LeadCard key={lead.client} lead={lead} />
          ))}
        </TabsContent>
        <TabsContent value="briefs" className="space-y-4">
          {leads.slice(0, 2).map((lead) => (
            <LeadCard key={lead.client} lead={{ ...lead, timer: "72h expiry" }} />
          ))}
        </TabsContent>
        <TabsContent value="push">
          <Card>
            <CardContent className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">AI push matching</h3>
                <p className="text-sm text-muted-foreground">
                  Behavioral triggers will surface stuck projects when your service category fits the next action.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

export function ProposalsContracts() {
  return (
    <PageShell
      title="Proposals & Contracts"
      description="Move client opportunities from draft proposal through booking, contract signing, escrow, and workroom unlock."
    >
      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <ProposalCard key={proposal.client} item={proposal} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gate logic</CardTitle>
          <CardDescription>Workroom unlocks only after contract and escrow are complete.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {["Proposal accepted", "Contract signed", "Escrow funded", "Workroom unlocked"].map((item, index) => (
            <div key={item} className="rounded-lg border bg-background p-4">
              {index < 2 ? (
                <CheckCircle2 className="h-4 w-4 text-success-text" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <p className="mt-2 text-sm font-medium text-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function MessengerThreadList() {
  const groups = Array.from(new Set(threads.map((thread) => thread.group)));
  return (
    <aside className="min-h-[620px] border-r border-border bg-card">
      <div className="space-y-4 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border border-border">
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {profile.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{profile.name}</p>
            <Badge variant="success">{profile.tier} - Verified</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Score" value="94" />
          <MiniStat label="Rating" value="4.9" />
          <MiniStat label="Response" value="28m" />
          <MiniStat label="Month" value="$4.2K" />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search threads" />
        </div>
      </div>
      <div>
        {groups.map((group) => (
          <section key={group}>
            <div className="bg-muted/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group}
            </div>
            {threads
              .filter((thread) => thread.group === group)
              .map((thread, index) => (
                <div
                  key={thread.name}
                  className={cn(
                    "flex items-center gap-3 border-b border-border px-4 py-3",
                    index === 0 && group === "New Leads" && "border-l-4 border-l-primary bg-primary/10"
                  )}
                >
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="text-xs font-semibold">
                      {thread.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {thread.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {thread.meta}
                    </p>
                  </div>
                  {thread.unread ? <Badge>{thread.unread}</Badge> : null}
                </div>
              ))}
          </section>
        ))}
      </div>
    </aside>
  );
}

export function ServiceProviderMessenger() {
  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-xs">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" className="h-9 rounded-lg px-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/50">
            <Link href="/dashboard/serviceprovider">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Service Provider Messenger
            </div>
            <h1 className="truncate text-xs font-extrabold text-foreground">
              Leads, proposals, bookings, escrow, milestones, payments, reviews, and disputes
            </h1>
          </div>
        </div>
        <Badge variant="destructive" className="h-7 rounded-lg px-2 text-[10px] font-extrabold">
          8 unread
        </Badge>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px]">
          <MessengerThreadList />
          <main className="flex min-h-0 flex-col bg-background">
            <div className="shrink-0 border-b border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarFallback className="bg-muted font-semibold">NT</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-foreground">NovaTech Labs</h2>
                      <Badge variant="success">Verified Company</Badge>
                      <Badge variant="info">94% Match</Badge>
                      <Badge variant="warning">3h left</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Lead Chat - Entrepreneur - Source: Funding Readiness
                    </p>
                  </div>
                </div>
                <Button size="sm">Generate proposal</Button>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {workStrip.map((step, index) => (
                  <Badge
                    key={step}
                    variant={index === 0 ? "default" : "outline"}
                    className="rounded-lg"
                  >
                    {index + 1} {step}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <SystemCard
                icon={Sparkles}
                title="New qualified lead"
                body="Entrepreneur Phase 6: Data Room. Client needs legal document preparation before an investor meeting."
                tone="info"
              />
              <MessageBubble
                side="left"
                name="NovaTech Labs"
                body="We are preparing for investor review and need a clean legal package before the meeting."
              />
              <SystemCard
                icon={Sparkles}
                title="AI proposal ready"
                body="Standard Legal Package plus 1-hour strategy call add-on is suggested."
                tone="default"
              />
              <MessageBubble
                side="right"
                name="Maya Rahman"
                body="I can prepare the document package and add milestones for review, revision, and final handoff."
              />
              <SystemCard
                icon={AlertTriangle}
                title="Next best action"
                body="Review AI Proposal, add milestones, send proposal, then booking, contract, and escrow can start."
                tone="warning"
              />
            </div>
            <div className="shrink-0 border-t border-border bg-card p-4">
              <Textarea placeholder="Write a scoped response..." rows={3} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button>Send proposal</Button>
                <Button variant="outline">Add milestones</Button>
                <Button variant="outline">Ask question</Button>
                <Button variant="destructive">Decline lead</Button>
              </div>
            </div>
          </main>
          <aside className="hidden border-l border-border bg-card p-4 xl:block">
            <div className="space-y-4">
              <ContextCard title="Lead context">
                <Progress value={94} />
                <p className="text-sm text-muted-foreground">94% match based on category, keywords, response time, and availability.</p>
              </ContextCard>
              <ContextCard title="Client snapshot">
                <Detail label="Role" value="Entrepreneur" />
                <Detail label="Status" value="Verified Company" />
                <Detail label="Phase" value="Phase 6 Data Room" />
                <Detail label="Need" value="Legal package" />
              </ContextCard>
              <ContextCard title="Escrow preview">
                <Detail label="Status" value="Not started" />
                <Detail label="Expected budget" value="$800-$1,500" />
              </ContextCard>
            </div>
          </aside>
      </div>
    </div>
  );
}

function ContextCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function MessageBubble({
  side,
  name,
  body,
}: {
  side: "left" | "right";
  name: string;
  body: string;
}) {
  return (
    <div className={cn("flex", side === "right" && "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl border px-4 py-3 text-sm shadow-sm",
          side === "right"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground"
        )}
      >
        <p className="mb-1 text-xs font-semibold opacity-80">{name}</p>
        <p className="leading-6">{body}</p>
      </div>
    </div>
  );
}

function SystemCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tone: "default" | "info" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        tone === "warning"
          ? "border-warning/30 bg-warning/10"
          : tone === "info"
            ? "border-info/30 bg-info/10"
            : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{body}</p>
        </div>
      </div>
    </div>
  );
}

export function WorkroomProjects() {
  return (
    <PageShell
      title="Projects & Workroom"
      description="Manage active projects after contract signing and escrow funding."
    >
      <Tabs defaultValue="milestones">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>
        <TabsContent value="milestones" className="grid gap-4 md:grid-cols-3">
          {["Research", "UI Mockups", "Final handoff"].map((item, index) => (
            <Card key={item}>
              <CardHeader>
                <CardTitle className="text-base">{item}</CardTitle>
                <CardDescription>Milestone {index + 1} of 3</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant={index === 1 ? "warning" : index === 0 ? "success" : "outline"}>
                  {index === 1 ? "Revision requested" : index === 0 ? "Approved" : "Locked"}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {index === 1 ? "Submit revision within 48 hours." : "Scope and files are tracked here."}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="files">
          <Card><CardContent><SystemCard icon={Upload} title="Files submitted" body="Two files are attached to Milestone 2 and ready for revision upload." tone="info" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="timer">
          <Card><CardContent><SystemCard icon={Timer} title="Timer inactive" body="Hourly projects can track active time from the workroom before invoice review." tone="default" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="revisions">
          <Card><CardContent><SystemCard icon={Clock3} title="Revision count" body="1 of 3 revisions used for the current milestone." tone="warning" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="disputes">
          <Card><CardContent><SystemCard icon={ShieldCheck} title="No active dispute" body="Evidence and admin support appear here if a client opens a dispute." tone="default" /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

export function EarningsAnalytics({ mode }: { mode: "earnings" | "analytics" }) {
  return (
    <PageShell
      title={mode === "earnings" ? "Earnings & Payouts" : "Analytics & Growth"}
      description={
        mode === "earnings"
          ? "Track released funds, escrow, invoices, payout method, and withdrawal readiness."
          : "Understand service performance, conversion, ranking, and growth opportunities."
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Released balance" value="$1,600" icon={CreditCard} />
        <StatCard label="Pending escrow" value="$800" icon={Lock} />
        <StatCard label="Invoices" value="12" icon={FileText} />
        <StatCard label="Monthly growth" value="+18%" icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "earnings" ? "Payout activity" : "Growth signals"}</CardTitle>
          <CardDescription>Existing dashboard table style expressed as compact rows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            ["EcoTech milestone 2", "$817", "Released"],
            ["CloudX booking", "$950", "Escrow pending"],
            ["Brand sprint", "$599", "Invoice ready"],
          ].map(([name, value, status]) => (
            <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-4">
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{status}</p>
              </div>
              <p className="font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function TierReputation() {
  return (
    <PageShell
      title="Tier & Reputation"
      description="Track tier eligibility, commission rate, Mondial Score, and reputation growth."
    >
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current tier</CardTitle>
            <CardDescription>Tier 3 providers receive premium leads at 8% commission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="success">Tier 3 - Verified</Badge>
            <Progress value={72} />
            <p className="text-sm text-muted-foreground">
              Complete 3 more high-rated projects to apply for Tier 4 human review.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mondial Score breakdown</CardTitle>
            <CardDescription>Weighted from satisfaction, delivery, response, repeat clients, and disputes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["Client satisfaction", 40],
              ["On-time delivery", 25],
              ["Response rate", 15],
              ["Repeat client", 10],
              ["Skills test", 10],
            ].map(([label, value]) => (
              <div key={label} className="space-y-2 rounded-lg border bg-background p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{value}%</span>
                </div>
                <Progress value={Number(value)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export function NotificationsSettings({ mode }: { mode: "notifications" | "settings" }) {
  return (
    <PageShell
      title={mode === "notifications" ? "Notifications" : "Settings"}
      description={
        mode === "notifications"
          ? "Review lead, project, payment, and system updates."
          : "Manage provider profile, availability, payout, security, and notification preferences."
      }
    >
      {mode === "notifications" ? (
        <div className="grid gap-4">
          {notifications.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.tone}>{item.title}</Badge>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="availability">
          <TabsList>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="payout">Payout</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="availability">
            <SettingsPanel icon={CalendarDays} title="Availability and capacity" body="Available Now is on. Maximum active projects is set to 5." />
          </TabsContent>
          <TabsContent value="payout">
            <SettingsPanel icon={CreditCard} title="Payout method" body="Wise ending 4521 is connected for released balances." />
          </TabsContent>
          <TabsContent value="notifications">
            <SettingsPanel icon={Bell} title="Notification channels" body="Lead, project, payment, and system alerts are enabled for in-app and email." />
          </TabsContent>
          <TabsContent value="security">
            <SettingsPanel icon={ShieldCheck} title="Account security" body="Identity verification and professional review protect paid work access." />
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}

function SettingsPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
