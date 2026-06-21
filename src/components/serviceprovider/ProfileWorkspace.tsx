'use client';

import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderOpen,
  Gauge,
  Globe2,
  Layers,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Star,
  ThumbsUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import EmptyState from '@/components/ui/empty-state';
import { useAuth } from '@/app/_providers/AuthProvider';
import { cn } from '@/lib/utils';
import {
  useServiceProviderProfile,
  useSubmitVerification,
  useUpsertProfile,
} from '@/hooks/queries/service-provider';
import {
  PRICING_MODELS,
  SERVICE_CATEGORIES,
  type ServiceProviderProfile,
  type VerificationStatus,
} from '@/types/service-provider';
import { PortfolioSection } from './PortfolioSection';

const statusMeta: Record<
  VerificationStatus,
  {
    label: string;
    variant: 'secondary' | 'warning' | 'success' | 'destructive';
    Icon: typeof ShieldCheck;
  }
> = {
  Pending: { label: 'Pending', variant: 'secondary', Icon: ShieldQuestion },
  UnderReview: { label: 'Under review', variant: 'warning', Icon: ShieldAlert },
  Verified: { label: 'Verified', variant: 'success', Icon: ShieldCheck },
  Rejected: { label: 'Rejected', variant: 'destructive', Icon: ShieldAlert },
};

const csv = (list: string[]) => list.join(', ');
const parseCsv = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    )
  );

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

// Mirrors the backend's locked completion weighting (ServiceProviderMapping).
type Requirement = { key: string; label: string; met: boolean };
function requirements(p: ServiceProviderProfile): Requirement[] {
  return [
    { key: 'headline', label: 'Add a headline', met: !!p.headline?.trim() },
    { key: 'bio', label: 'Write a bio', met: !!p.bio?.trim() },
    { key: 'skills', label: 'List at least one skill', met: p.skills.length > 0 },
    {
      key: 'categories',
      label: 'Select a service category',
      met: p.serviceCategories.length > 0,
    },
    { key: 'industries', label: 'Add an industry', met: p.industries.length > 0 },
    { key: 'languages', label: 'Add a language', met: p.languages.length > 0 },
    {
      key: 'pricing',
      label: 'Choose a pricing model',
      met: p.pricingModels.length > 0,
    },
    {
      key: 'portfolio',
      label: 'Add a portfolio item',
      met: p.portfolioItems.length > 0,
    },
  ];
}

export function ProfileWorkspace() {
  const { data: profile, isLoading, isError } = useServiceProviderProfile();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto w-full max-w-4xl pb-8">
        <EmptyState
          icon={Briefcase}
          title="Could not load your provider profile"
          description="Refresh the page or try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      <FreelancerProfilePreview profile={profile} displayName={user?.name || 'Demo ServiceProvider'} />
      <OverviewCard profile={profile} />
      <VerificationCard profile={profile} />
      <ProfileForm profile={profile} />
      <PortfolioSection items={profile.portfolioItems} />
    </div>
  );
}

const samplePackages = [
  {
    name: 'Launch Sprint',
    price: '$750',
    delivery: '7 days',
    description: 'Landing page, onboarding flow, and dashboard polish for an MVP launch.',
  },
  {
    name: 'SaaS Buildout',
    price: '$2,400',
    delivery: '21 days',
    description: 'Full Next.js feature build with auth, API integration, and responsive QA.',
  },
  {
    name: 'Growth Retainer',
    price: '$1,800/mo',
    delivery: 'Monthly',
    description: 'Ongoing product iteration, conversion fixes, and founder support.',
  },
];

const sampleReviews = [
  {
    name: 'Nadia, fintech founder',
    text: 'Clear scope, fast delivery, and the dashboard felt investor-ready after one sprint.',
  },
  {
    name: 'Arman, SaaS operator',
    text: 'Strong product sense. The handoff was clean and every screen matched our system.',
  },
];

function formatList(list: string[], fallback: string[]) {
  return list.length > 0 ? list : fallback;
}

function FreelancerProfilePreview({
  profile,
  displayName,
}: {
  profile: ServiceProviderProfile;
  displayName: string;
}) {
  const status = statusMeta[profile.verificationStatus];
  const skills = formatList(profile.skills, ['Next.js', 'React', 'TypeScript']);
  const categories = formatList(profile.serviceCategories, ['Development', 'Design']);
  const languages = formatList(profile.languages, ['English', 'Bengali']);
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/40 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {initials || 'SP'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                      {displayName}
                    </h1>
                    <Badge variant={status.variant}>
                      <status.Icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="max-w-2xl text-base font-medium text-foreground">
                    {profile.headline?.trim() || 'Full-stack SaaS builder for founders who need clean, launch-ready products.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-current text-warning" />
                    {profile.trustScore.toFixed(1)} trust score
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Remote worldwide
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" />
                    Replies within 1 hour
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe2 className="h-4 w-4" />
                    {languages.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/dashboard/serviceprovider/messenger">
                <MessageSquare className="h-4 w-4" />
                Contact
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="space-y-8 p-6 sm:p-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">About this provider</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {profile.bio?.trim() ||
                'I help founders turn product ideas into polished web applications: dashboard UX, onboarding, marketplace flows, and clean implementation in modern React stacks.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 8).map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Services</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/serviceprovider/services">View all</Link>
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {samplePackages.map((pkg) => (
                <div key={pkg.name} className="flex min-h-48 flex-col rounded-lg border bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{pkg.name}</p>
                    <Badge variant="secondary">{pkg.delivery}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{pkg.description}</p>
                  <div className="mt-auto pt-4">
                    <p className="text-xs text-muted-foreground">Starting at</p>
                    <p className="text-xl font-semibold text-foreground">{pkg.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Founder reviews</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {sampleReviews.map((review) => (
                <div key={review.name} className="rounded-lg border bg-background p-4">
                  <div className="mb-2 flex items-center gap-1 text-warning">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{review.text}</p>
                  <p className="mt-3 text-sm font-medium text-foreground">{review.name}</p>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Book this provider</CardTitle>
            <CardDescription>
              Fiverr-style preview for founders reviewing your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-lg font-semibold text-foreground">$750</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="text-lg font-semibold text-foreground">7 days</p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard/serviceprovider/messenger">
                <MessageSquare className="h-4 w-4" />
                Message provider
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/serviceprovider/services">
                <Briefcase className="h-4 w-4" />
                View service catalog
              </Link>
            </Button>
            <Separator />
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                Fast response and scoped delivery
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <ThumbsUp className="h-4 w-4 text-primary" />
                {profile.completionPercent}% profile complete
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                Available for new projects
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories.slice(0, 6).map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  Icon,
  label,
  children,
}: {
  Icon: typeof ShieldCheck;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{children}</div>
    </div>
  );
}

function OverviewCard({ profile }: { profile: ServiceProviderProfile }) {
  const status = statusMeta[profile.verificationStatus];
  const reqs = requirements(profile);
  const missing = reqs.filter((r) => !r.met);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl">
                {profile.headline?.trim() || 'Your provider profile'}
              </CardTitle>
              <CardDescription className="line-clamp-2 max-w-xl">
                {profile.bio?.trim() ||
                  'Add a headline and bio so founders understand what you offer.'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={status.variant}>
            <status.Icon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile Icon={status.Icon} label="Verification">
            <span className="text-base">{status.label}</span>
          </StatTile>
          <StatTile Icon={Star} label="Trust score">
            {profile.trustScore.toFixed(1)}
          </StatTile>
          <StatTile Icon={Gauge} label="Completion">
            {profile.completionPercent}%
          </StatTile>
          <StatTile Icon={Layers} label="Current phase">
            {profile.currentPhase}
          </StatTile>
          <StatTile Icon={Sparkles} label="Skills">
            {profile.skills.length}
          </StatTile>
          <StatTile Icon={FolderOpen} label="Portfolio">
            {profile.portfolioItems.length}
          </StatTile>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile completion</span>
            <span className="font-semibold text-foreground">
              {profile.completionPercent}%
            </span>
          </div>
          <Progress value={profile.completionPercent} />

          {missing.length === 0 ? (
            <p className="inline-flex items-center gap-2 text-sm text-success-text">
              <CheckCircle2 className="h-4 w-4" />
              Your profile is complete.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Complete your profile ({missing.length} item
                {missing.length === 1 ? '' : 's'} left)
              </p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {reqs.map((r) => (
                  <li
                    key={r.key}
                    className={cn(
                      'inline-flex items-center gap-2 text-sm',
                      r.met
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    )}
                  >
                    {r.met ? (
                      <CheckCircle2 className="h-4 w-4 text-success-text" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const statusMessage: Record<
  VerificationStatus,
  { title: string; body: string; box: string }
> = {
  Pending: {
    title: 'Not yet submitted',
    body: 'Complete your profile, then submit it for verification to earn the verified provider badge.',
    box: 'border-border bg-muted/50 text-muted-foreground',
  },
  UnderReview: {
    title: 'Verification under review',
    body: "Verification is currently under review. We'll notify you once a decision is made.",
    box: 'border-info/30 bg-info/10 text-info',
  },
  Verified: {
    title: 'Verified provider',
    body: 'Your provider profile has been verified.',
    box: 'border-success-light bg-success-light/50 text-success-text',
  },
  Rejected: {
    title: 'Verification rejected',
    body: 'Please address the feedback below and resubmit your profile.',
    box: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
};

function VerificationCard({ profile }: { profile: ServiceProviderProfile }) {
  const submit = useSubmitVerification();
  const [confirm, setConfirm] = useState(false);
  const msg = statusMessage[profile.verificationStatus];
  const canSubmit =
    profile.verificationStatus === 'Pending' ||
    profile.verificationStatus === 'Rejected';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Verification</CardTitle>
        <CardDescription>
          A verified badge and trust score help founders pick you with confidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn('space-y-1 rounded-lg border p-4', msg.box)}>
          <p className="text-sm font-medium">{msg.title}</p>
          <p className="text-sm opacity-90">{msg.body}</p>
          {profile.verificationStatus === 'Rejected' &&
            profile.rejectionReason && (
              <p className="pt-1 text-sm font-medium">
                Reason: {profile.rejectionReason}
              </p>
            )}
        </div>

        {canSubmit && (
          <div className="space-y-3 rounded-lg border p-4">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
              />
              <span>I confirm the information in my profile is accurate.</span>
            </label>
            {submit.isError && (
              <p className="text-sm text-destructive">
                Could not submit for verification. Try again.
              </p>
            )}
            <Button
              disabled={!confirm || submit.isPending}
              onClick={() => submit.mutate({ confirmAccuracy: true })}
            >
              {submit.isPending ? 'Submitting…' : 'Submit for verification'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function ProfileForm({ profile }: { profile: ServiceProviderProfile }) {
  const upsert = useUpsertProfile();
  const [headline, setHeadline] = useState(profile.headline ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [skills, setSkills] = useState(csv(profile.skills));
  const [industries, setIndustries] = useState(csv(profile.industries));
  const [languages, setLanguages] = useState(csv(profile.languages));
  const [categories, setCategories] = useState<string[]>(
    profile.serviceCategories
  );
  const [pricing, setPricing] = useState<string[]>(profile.pricingModels);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  const save = async () => {
    const parsedSkills = parseCsv(skills);
    if (parsedSkills.length === 0) {
      setError('Add at least one skill.');
      return;
    }
    if (categories.length === 0) {
      setError('Select at least one service category.');
      return;
    }
    setError(null);
    try {
      await upsert.mutateAsync({
        skills: parsedSkills,
        serviceCategories: categories,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        industries: parseCsv(industries),
        languages: parseCsv(languages),
        pricingModels: pricing,
      });
      setSaved(true);
    } catch {
      setError('Could not save the profile. Check the fields and try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Edit profile</CardTitle>
        <CardDescription>
          Skills and at least one service category are required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <SectionHeading>Professional information</SectionHeading>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Fractional CFO for early-stage startups"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading>Skills &amp; categories</SectionHeading>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma separated)</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="fundraising, contracts, modelling"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              Service categories
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SERVICE_CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={categories.includes(c)}
                    onChange={() => setCategories((prev) => toggle(prev, c))}
                  />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading>Industries &amp; languages</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industries">Industries (comma separated)</Label>
              <Input
                id="industries"
                value={industries}
                onChange={(e) => setIndustries(e.target.value)}
                placeholder="Fintech, SaaS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="languages">Languages (comma separated)</Label>
              <Input
                id="languages"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English, French"
              />
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionHeading>Pricing models</SectionHeading>
          <fieldset className="space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRICING_MODELS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={pricing.includes(p)}
                    onChange={() => setPricing((prev) => toggle(prev, p))}
                  />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? 'Saving…' : 'Save profile'}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-success-text">
              <BadgeCheck className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
