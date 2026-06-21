'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Bell,
  Search,
  AlertCircle,
  Star,
  RefreshCw,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { useServiceProviderProfile } from '@/hooks/queries/service-provider';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

// Data for the 7-day revenue trend curved area chart
const REVENUE_TREND_DATA = [
  { day: 'Mon', Revenue: 250 },
  { day: 'Tue', Revenue: 210 },
  { day: 'Wed', Revenue: 380 },
  { day: 'Thu', Revenue: 310 },
  { day: 'Fri', Revenue: 520 },
  { day: 'Sat', Revenue: 410 },
  { day: 'Sun', Revenue: 680 },
];

// Sparkline data for mini charts
const IMPRESSIONS_SPARK = [
  { val: 100 }, { val: 105 }, { val: 95 }, { val: 120 }, { val: 115 }, { val: 135 }, { val: 140 }
];
const CLICKS_SPARK = [
  { val: 50 }, { val: 60 }, { val: 55 }, { val: 75 }, { val: 70 }, { val: 85 }, { val: 90 }
];
const VIEWS_SPARK = [
  { val: 200 }, { val: 195 }, { val: 180 }, { val: 170 }, { val: 175 }, { val: 155 }, { val: 150 }
];
const CONVERSION_SPARK = [
  { val: 4.2 }, { val: 4.4 }, { val: 4.3 }, { val: 4.6 }, { val: 4.5 }, { val: 4.7 }, { val: 4.8 }
];

export default function ServiceProviderDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useServiceProviderProfile();

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Maya';

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1136px] space-y-6 bg-background pb-8 font-sans">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px] rounded-2xl" />
          <Skeleton className="h-[350px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1136px] space-y-6 bg-background pb-8 font-sans">
      {/* Header Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border/70" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Service Provider</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
            <span className="text-foreground">Overview</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="h-9 w-64 rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative rounded-lg">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative rounded-lg" asChild>
            <Link href="/dashboard/serviceprovider/messenger">
              <MessageSquare className="h-4 w-4 text-foreground" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">3</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Row 1: Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl leading-tight">
          Good morning, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your services today.
        </p>
      </div>

      {/* Row 2: Top Metrics Grid (6 columns) */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {/* Mondial Score */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mondial Score</p>
          <p className="text-3xl font-black text-primary tracking-tight mt-2">94</p>
        </Card>

        {/* Avg Rating */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Rating</p>
          <p className="text-3xl font-black text-foreground tracking-tight mt-2">4.9</p>
        </Card>

        {/* Response Rate */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Response Rate</p>
          <p className="text-3xl font-black text-success-text tracking-tight mt-2">92%</p>
        </Card>

        {/* Orders */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Orders</p>
          <p className="text-3xl font-black text-foreground tracking-tight mt-2">11</p>
        </Card>

        {/* Unique Clients */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Unique Clients</p>
          <p className="text-3xl font-black text-foreground tracking-tight mt-2">8</p>
        </Card>

        {/* Repeat Rate */}
        <Card className="rounded-2xl border-border bg-card p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Repeat Rate</p>
          <p className="text-3xl font-black text-warning tracking-tight mt-2">37%</p>
        </Card>
      </div>

      {/* Row 3: Financial Overview and Action Needed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Financial Overview */}
        <Card className="rounded-2xl border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-foreground">Financial Overview</h3>
            
            {/* 4 Financial Metric Cards (2x2) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-muted/5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Available Funds</span>
                <span className="text-xl font-bold text-foreground block">$1,240</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Pending Clearance</span>
                <span className="text-xl font-bold text-foreground block">$450</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Expected Earnings</span>
                <span className="text-xl font-bold text-success-text block">$890</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Canceled</span>
                <span className="text-xl font-bold text-destructive block">$0</span>
              </div>
            </div>
          </div>

          {/* 7-Day Revenue Trend Chart */}
          <div className="space-y-2 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">7-Day Revenue Trend</span>
              <span className="text-xs font-bold text-success-text flex items-center gap-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                +12%
              </span>
            </div>

            <div className="h-[120px] w-full pt-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_TREND_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(v) => [`$${v}`]} contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Action Needed */}
        <Card className="rounded-2xl border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
            <h3 className="font-extrabold text-lg text-foreground">Action Needed</h3>
            <Link href="/dashboard/serviceprovider/leads" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {/* Item 1: Unread Messages */}
            <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-foreground">3 Unread Messages</h4>
                  <p className="text-[10px] text-muted-foreground">From active clients</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold px-4" asChild>
                <Link href="/dashboard/serviceprovider/messenger">Reply</Link>
              </Button>
            </div>

            {/* Item 2: Deliveries Due */}
            <div className="flex items-center justify-between py-3.5 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-warning/10 rounded-lg flex items-center justify-center text-warning">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-foreground">2 Deliveries Due Today</h4>
                  <p className="text-[10px] text-muted-foreground">Ensure timely submission</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold px-4" asChild>
                <Link href="/dashboard/serviceprovider/projects">Deliver</Link>
              </Button>
            </div>

            {/* Item 3: Late Delivery */}
            <div className="flex items-center justify-between py-3.5 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-destructive/10 rounded-lg flex items-center justify-center text-destructive">
                  <AlertCircle className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-foreground">1 Late Delivery</h4>
                  <p className="text-[10px] text-muted-foreground">Order #4928 - Overdue by 2 hours</p>
                </div>
              </div>
              <Button size="sm" variant="destructive" className="h-8 rounded-lg text-xs font-semibold px-4" asChild>
                <Link href="/dashboard/serviceprovider/projects">Resolve</Link>
              </Button>
            </div>

            {/* Item 4: New Review */}
            <div className="flex items-center justify-between py-3.5 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-success-light rounded-lg flex items-center justify-center text-success-text">
                  <Star className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-foreground">New Review Received</h4>
                  <p className="text-[10px] text-muted-foreground">5 stars from Alex T.</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold text-primary hover:text-primary/80 px-2" asChild>
                <Link href="/dashboard/serviceprovider/profile">View</Link>
              </Button>
            </div>

            {/* Item 5: Update Portfolio */}
            <div className="flex items-center justify-between py-3.5 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <RefreshCw className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-foreground">Update Portfolio</h4>
                  <p className="text-[10px] text-muted-foreground">It's been 30 days since last update</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold text-primary hover:text-primary/80 px-2" asChild>
                <Link href="/dashboard/serviceprovider/profile">Update</Link>
              </Button>
            </div>

            {/* Item 6: Service Settings */}
            <div className="flex items-center justify-between py-3.5 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-foreground">Service Settings</h4>
                  <p className="text-[10px] text-muted-foreground">Review pricing recommendations</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold text-primary hover:text-primary/80 px-2" asChild>
                <Link href="/dashboard/serviceprovider/settings">Review</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Service Performance (Last 30 Days) */}
      <Card className="rounded-2xl border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-2">
          <h3 className="font-extrabold text-lg text-foreground">Service Performance (Last 30 Days)</h3>
          <Link href="/dashboard/serviceprovider/analytics" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Detailed Report
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 4 Performance Sparkline Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Impressions */}
          <div className="p-4 rounded-xl border border-border bg-muted/5 flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Impressions</span>
                <span className="text-2xl font-black text-foreground block mt-1">12.4k</span>
              </div>
              <span className="text-[10px] font-bold text-success-text flex items-center gap-0.5 mt-1">
                ↑5%
              </span>
            </div>
            <div className="h-[40px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={IMPRESSIONS_SPARK}>
                  <Line type="monotone" dataKey="val" stroke="var(--success-text)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clicks */}
          <div className="p-4 rounded-xl border border-border bg-muted/5 flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Clicks</span>
                <span className="text-2xl font-black text-foreground block mt-1">1,842</span>
              </div>
              <span className="text-[10px] font-bold text-success-text flex items-center gap-0.5 mt-1">
                ↑12%
              </span>
            </div>
            <div className="h-[40px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CLICKS_SPARK}>
                  <Line type="monotone" dataKey="val" stroke="var(--success-text)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Views */}
          <div className="p-4 rounded-xl border border-border bg-muted/5 flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Views</span>
                <span className="text-2xl font-black text-foreground block mt-1">956</span>
              </div>
              <span className="text-[10px] font-bold text-destructive flex items-center gap-0.5 mt-1">
                ↓2%
              </span>
            </div>
            <div className="h-[40px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={VIEWS_SPARK}>
                  <Line type="monotone" dataKey="val" stroke="var(--destructive)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion */}
          <div className="p-4 rounded-xl border border-border bg-muted/5 flex flex-col justify-between h-[120px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Conversion</span>
                <span className="text-2xl font-black text-foreground block mt-1">4.8%</span>
              </div>
              <span className="text-[10px] font-bold text-success-text flex items-center gap-0.5 mt-1">
                ↑0.5%
              </span>
            </div>
            <div className="h-[40px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CONVERSION_SPARK}>
                  <Line type="monotone" dataKey="val" stroke="var(--success-text)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
