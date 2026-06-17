'use client';

import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Circle,
  FolderOpen,
  Gauge,
  Layers,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">
          Service Provider Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep your profile complete and verified to win founder engagements.
        </p>
      </div>
      <OverviewCard profile={profile} />
      <VerificationCard profile={profile} />
      <ProfileForm profile={profile} />
      <PortfolioSection items={profile.portfolioItems} />
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
