'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive'; Icon: typeof ShieldCheck }
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProfileForm({ profile }: { profile: ServiceProviderProfile }) {
  const upsert = useUpsertProfile();
  const [headline, setHeadline] = useState(profile.headline ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [skills, setSkills] = useState(csv(profile.skills));
  const [industries, setIndustries] = useState(csv(profile.industries));
  const [languages, setLanguages] = useState(csv(profile.languages));
  const [categories, setCategories] = useState<string[]>(profile.serviceCategories);
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
        <CardTitle className="text-xl">Profile details</CardTitle>
        <CardDescription>
          Skills and at least one service category are required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div className="space-y-2">
          <Label htmlFor="skills">Skills (comma separated)</Label>
          <Input
            id="skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="fundraising, contracts, modelling"
          />
        </div>
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

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            Pricing models
          </legend>
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

function VerificationCard({ profile }: { profile: ServiceProviderProfile }) {
  const submit = useSubmitVerification();
  const [confirm, setConfirm] = useState(false);
  const status = statusMeta[profile.verificationStatus];
  const canSubmit =
    profile.verificationStatus === 'Pending' ||
    profile.verificationStatus === 'Rejected';

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Verification</CardTitle>
          <Badge variant={status.variant}>
            <status.Icon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        {profile.verificationStatus === 'Rejected' && profile.rejectionReason && (
          <CardDescription className="text-destructive">
            {profile.rejectionReason}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile completion</span>
            <span className="font-semibold text-foreground">
              {profile.completionPercent}%
            </span>
          </div>
          <Progress value={profile.completionPercent} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Trust score" value={profile.trustScore.toFixed(1)} />
          <Stat
            label="Portfolio items"
            value={String(profile.portfolioItems.length)}
          />
          <Stat
            label="Profile"
            value={profile.profileComplete ? 'Complete' : 'Incomplete'}
          />
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

export function ProfileWorkspace() {
  const { data: profile, isLoading, isError } = useServiceProviderProfile();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto w-full max-w-4xl pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Could not load your provider profile</CardTitle>
            <CardDescription>
              Refresh the page or try again in a moment.
            </CardDescription>
          </CardHeader>
        </Card>
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
      <VerificationCard profile={profile} />
      <ProfileForm profile={profile} />
      <PortfolioSection items={profile.portfolioItems} />
    </div>
  );
}
