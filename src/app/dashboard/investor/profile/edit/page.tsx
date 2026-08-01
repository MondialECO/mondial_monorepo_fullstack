"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorState from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import {
  useInvestorProfile,
  useUpdateInvestorProfile,
} from "@/hooks/queries/investor-profile";
import type { InvestorProfile, UpdateInvestorProfileInput } from "@/types/investor/profile";
import { Field, OptionSelect } from "@/app/dashboard/investor/thesis/_components/fields";
import type { Opt } from "@/app/dashboard/investor/thesis/_components/options";
import PublicProfileSkeleton from "../_components/PublicProfileSkeleton";

const TYPE_OPTIONS: Opt[] = [
  { value: "angel", label: "Angel" },
  { value: "seed_fund", label: "Seed Fund" },
  { value: "vc", label: "Venture Capital" },
  { value: "corporate", label: "Corporate" },
  { value: "family_office", label: "Family Office" },
];

type SocialRow = { key: string; value: string };

type EditDraft = {
  name: string;
  type: string | null;
  headline: string;
  bio: string;
  website: string;
  primaryPhone: string;
  coverImageUrl: string;
  logoUrl: string;
  isPublic: boolean;
  successfulExits: string;
  averageCheckSize: string;
  social: SocialRow[];
};

function draftFrom(p: InvestorProfile): EditDraft {
  return {
    name: p.name ?? "",
    type: p.type,
    headline: p.headline ?? "",
    bio: p.bio ?? "",
    website: p.website ?? "",
    primaryPhone: p.primaryPhone ?? "",
    coverImageUrl: p.coverImageUrl ?? "",
    logoUrl: p.logoUrl ?? "",
    isPublic: p.isPublic,
    successfulExits: String(p.successfulExits ?? 0),
    averageCheckSize: String(p.averageCheckSize ?? 0),
    social: Object.entries(p.socialLinks ?? {}).map(([key, value]) => ({ key, value })),
  };
}

function toInput(d: EditDraft): UpdateInvestorProfileInput {
  const socialLinks: Record<string, string> = {};
  for (const { key, value } of d.social) {
    const k = key.trim().toLowerCase();
    const v = value.trim();
    if (k && v) socialLinks[k] = v;
  }
  const exits = Math.max(0, Math.floor(Number(d.successfulExits) || 0));
  const avg = Math.max(0, Math.floor(Number(d.averageCheckSize) || 0));
  return {
    name: d.name.trim(),
    type: d.type ?? undefined,
    headline: d.headline.trim(),
    bio: d.bio.trim(),
    website: d.website.trim(),
    primaryPhone: d.primaryPhone.trim(),
    coverImageUrl: d.coverImageUrl.trim(),
    logoUrl: d.logoUrl.trim(),
    isPublic: d.isPublic,
    successfulExits: exits,
    averageCheckSize: avg,
    socialLinks,
  };
}

export default function InvestorProfileEditPage() {
  const router = useRouter();
  const { data: profile, isLoading, isError, refetch } = useInvestorProfile();
  const update = useUpdateInvestorProfile();

  const [draft, setDraft] = useState<EditDraft | null>(null);

  useEffect(() => {
    if (profile && draft === null) setDraft(draftFrom(profile));
  }, [profile, draft]);

  if (isLoading || draft === null) {
    return (
      <div className="mx-auto w-full max-w-[760px] pb-8">
        <PublicProfileSkeleton />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto w-full max-w-[760px] space-y-4 pb-8">
        <ErrorState title="Couldn't load your profile" message="Check your connection and retry." />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const patch = (p: Partial<EditDraft>) =>
    setDraft((d) => ({ ...(d as EditDraft), ...p }));

  const setSocial = (i: number, p: Partial<SocialRow>) =>
    patch({ social: draft.social.map((r, idx) => (idx === i ? { ...r, ...p } : r)) });
  const addSocial = () => patch({ social: [...draft.social, { key: "", value: "" }] });
  const removeSocial = (i: number) =>
    patch({ social: draft.social.filter((_, idx) => idx !== i) });

  const numInvalid =
    Number(draft.successfulExits) < 0 || Number(draft.averageCheckSize) < 0;

  const onSave = () => {
    update.mutate(toInput(draft), {
      onSuccess: () => router.push("/dashboard/investor/profile"),
    });
  };

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/investor/profile")}>
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Button>
      </div>

      {/* Basic information */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Display name">
            <Input
              value={draft.name}
              onChange={(e) => patch({ name: e.currentTarget.value })}
              placeholder="e.g. Atlas Ventures"
            />
          </Field>
          <Field label="Investor type">
            <OptionSelect
              options={TYPE_OPTIONS}
              value={draft.type}
              onValueChange={(v) => patch({ type: v })}
              placeholder="Select a type…"
            />
          </Field>
          <Field label="Headline" hint="A short one-line summary shown under your name.">
            <Input
              value={draft.headline}
              onChange={(e) => patch({ headline: e.currentTarget.value })}
              placeholder="e.g. Seed-stage fintech & climate investor"
              maxLength={140}
            />
          </Field>
          <Field label="Bio">
            <Textarea
              value={draft.bio}
              onChange={(e) => patch({ bio: e.currentTarget.value })}
              placeholder="Tell founders about your background and how you work."
              rows={5}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Contact & links */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle>Contact & Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Website">
            <Input
              value={draft.website}
              onChange={(e) => patch({ website: e.currentTarget.value })}
              placeholder="example.com"
              inputMode="url"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={draft.primaryPhone}
              onChange={(e) => patch({ primaryPhone: e.currentTarget.value })}
              placeholder="+1 555 000 0000"
              inputMode="tel"
            />
          </Field>

          <div className="space-y-2">
            <div>
              <Label className="text-sm font-medium text-foreground">Social links</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Platform name (e.g. linkedin, twitter) and its URL.
              </p>
            </div>
            <div className="space-y-2">
              {draft.social.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={row.key}
                    onChange={(e) => setSocial(i, { key: e.currentTarget.value })}
                    placeholder="linkedin"
                    className="w-36 shrink-0"
                  />
                  <Input
                    value={row.value}
                    onChange={(e) => setSocial(i, { value: e.currentTarget.value })}
                    placeholder="https://…"
                    inputMode="url"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocial(i)}
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSocial}>
              <Plus className="h-4 w-4" />
              Add link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visibility & media */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle>Visibility & Profile Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Profile visibility" hint="Controls whether founders can discover your profile.">
            <div className="inline-flex rounded-lg border border-border p-1">
              <button
                type="button"
                onClick={() => patch({ isPublic: true })}
                aria-pressed={draft.isPublic}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  draft.isPublic
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="h-4 w-4" /> Public
              </button>
              <button
                type="button"
                onClick={() => patch({ isPublic: false })}
                aria-pressed={!draft.isPublic}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  !draft.isPublic
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <EyeOff className="h-4 w-4" /> Private
              </button>
            </div>
          </Field>

          <Field label="Logo / avatar URL">
            <Input
              value={draft.logoUrl}
              onChange={(e) => patch({ logoUrl: e.currentTarget.value })}
              placeholder="https://…/logo.png"
              inputMode="url"
            />
          </Field>
          <Field label="Cover image URL">
            <Input
              value={draft.coverImageUrl}
              onChange={(e) => patch({ coverImageUrl: e.currentTarget.value })}
              placeholder="https://…/cover.jpg"
              inputMode="url"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Successful exits">
              <Input
                type="number"
                min={0}
                value={draft.successfulExits}
                onChange={(e) => patch({ successfulExits: e.currentTarget.value })}
              />
            </Field>
            <Field label="Average check size (USD)">
              <Input
                type="number"
                min={0}
                step={1000}
                value={draft.averageCheckSize}
                onChange={(e) => patch({ averageCheckSize: e.currentTarget.value })}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {update.isError ? (
        <p className="text-sm text-destructive">
          {update.error?.message ?? "Couldn't save your changes. Please try again."}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard/investor/profile")}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={update.isPending || numInvalid}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
