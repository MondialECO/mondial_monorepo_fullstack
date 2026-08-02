"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  FolderOpen,
  Languages,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  SpCard,
  SpEmptyState,
  SpFormField,
  SpMutationFeedback,
  SpPage,
  SpPageHeader,
  SpSectionHeader,
  SpStatusBadge,
  SpTabBar,
  SpTagInput,
} from "@/components/serviceprovider/ui";
import { useProviderOverview } from "@/hooks/queries/analytics";
import { useSpDirtyFormGuard } from "@/hooks/useSpDirtyFormGuard";
import { safeHttpUrl } from "@/lib/service-provider/url-security";
import {
  EMPTY_PROFESSIONAL_OVERVIEW,
  professionalOverviewPlainText,
  sanitizeProfessionalOverview,
} from "@/lib/service-provider/professional-overview";
import { resolveProviderMediaUrl } from "@/lib/service-provider/provider-media";
import { useCapacity, useServiceListings } from "@/hooks/queries/service-catalog";
import {
  useServiceProviderProfile,
  useServiceProviderTrust,
  useSubmitVerification,
  useUpsertProfile,
} from "@/hooks/queries/service-provider";
import {
  PRICING_MODELS,
  SERVICE_CATEGORIES,
  type ServiceProviderProfile,
  type TiptapJson,
  type VerificationStatus,
} from "@/types/service-provider";
import type { TrustBreakdown } from "@/types/service-provider";
import { PortfolioSection } from "./PortfolioSection";
import { ProfessionalOverviewEditor } from "./ProfessionalOverviewEditor";
import { ProfessionalOverviewView } from "./ProfessionalOverviewView";
import { ProfileMediaManager } from "./ProfileMediaManager";
import { TrustAndSkillsSection } from "./TrustAndSkillsSection";

type ProfileView = "overview" | "edit" | "trust";

type ProfileDraft = {
  headline: string;
  bio: string;
  professionalOverview: TiptapJson;
  skills: string[];
  industries: string[];
  languages: string[];
  categories: string[];
  pricing: string[];
};

const TAG_LIMITS = {
  skills: { max: 50, message: "Skills must be 50 characters or fewer." },
  industries: { max: 100, message: "Industries must be 100 characters or fewer." },
  languages: { max: 50, message: "Languages must be 50 characters or fewer." },
} as const;

function profileDraft(profile: ServiceProviderProfile): ProfileDraft {
  return {
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    professionalOverview: sanitizeProfessionalOverview(profile.professionalOverview?.document ?? EMPTY_PROFESSIONAL_OVERVIEW),
    skills: profile.skills,
    industries: profile.industries,
    languages: profile.languages,
    categories: profile.serviceCategories,
    pricing: profile.pricingModels,
  };
}

function firstTagLengthError(draft: ProfileDraft) {
  if (draft.skills.some((value) => value.length > TAG_LIMITS.skills.max)) return TAG_LIMITS.skills.message;
  if (draft.industries.some((value) => value.length > TAG_LIMITS.industries.max)) return TAG_LIMITS.industries.message;
  if (draft.languages.some((value) => value.length > TAG_LIMITS.languages.max)) return TAG_LIMITS.languages.message;
  return null;
}

const statusMeta: Record<
  VerificationStatus,
  { label: string; tone: "neutral" | "positive" | "warning" | "negative"; Icon: typeof ShieldCheck }
> = {
  Pending: { label: "Pending", tone: "neutral", Icon: ShieldQuestion },
  UnderReview: { label: "Under review", tone: "warning", Icon: ShieldAlert },
  Verified: { label: "Verified", tone: "positive", Icon: ShieldCheck },
  Rejected: { label: "Rejected", tone: "negative", Icon: ShieldAlert },
};

type Requirement = { key: string; label: string; met: boolean };

function requirements(profile: ServiceProviderProfile): Requirement[] {
  return [
    { key: "headline", label: "Professional headline", met: !!profile.headline?.trim() },
    { key: "bio", label: "Short bio", met: !!profile.bio?.trim() },
    { key: "skills", label: "At least one skill", met: profile.skills.length > 0 },
    { key: "categories", label: "Service category", met: profile.serviceCategories.length > 0 },
    { key: "industries", label: "Industry experience", met: profile.industries.length > 0 },
    { key: "languages", label: "Language", met: profile.languages.length > 0 },
    { key: "pricing", label: "Pricing model", met: profile.pricingModels.length > 0 },
    { key: "portfolio", label: "Portfolio item", met: profile.portfolioItems.length > 0 },
  ];
}

export function ProfileWorkspace() {
  const searchParams = useSearchParams();
  const view = profileView(searchParams.get("view"));
  const profileQuery = useServiceProviderProfile();

  if (profileQuery.isLoading) return <ProfileSkeleton />;

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <SpPage>
        <SpPageHeader title="Profile & Trust" description="Your professional marketplace identity and reputation." />
        <SpEmptyState
          icon={BriefcaseBusiness}
          title="Could not load your provider profile"
          description="Your profile data was not replaced with examples. Try the request again."
          action={<Button variant="outline" onClick={() => profileQuery.refetch()}>Try again</Button>}
        />
      </SpPage>
    );
  }

  const profile = profileQuery.data;
  const tabs = [
    { label: "Overview", href: "/dashboard/serviceprovider/profile", active: view === "overview" },
    { label: "Edit Profile", href: "/dashboard/serviceprovider/profile?view=edit", active: view === "edit" },
    { label: "Trust & Skills", href: "/dashboard/serviceprovider/profile?view=trust", active: view === "trust" },
  ];

  return (
    <SpPage className="pb-4">
      <SpPageHeader
        title="Profile & Trust"
        description="Build a credible public profile and understand the real signals behind your Trust Score."
        actions={<SpStatusBadge tone={profile.profileComplete ? "positive" : "warning"}>{profile.completionPercent}% complete</SpStatusBadge>}
      />
      <SpTabBar label="Profile and trust views" items={tabs} />
      {view === "overview" && <ProfileOverview profile={profile} />}
      {view === "edit" && <ProfileEditView profile={profile} />}
      {view === "trust" && <TrustAndSkillsSection profile={profile} />}
    </SpPage>
  );
}

function ProfileSkeleton() {
  return (
    <SpPage aria-label="Loading Profile & Trust">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-8 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
      <span className="sr-only">Loading your provider profile</span>
    </SpPage>
  );
}

function ProfileOverview({ profile }: { profile: ServiceProviderProfile }) {
  const { user } = useAuth();
  const overview = useProviderOverview("EUR");
  const capacity = useCapacity();
  const trust = useServiceProviderTrust(profile.verificationStatus === "Verified");
  const listings = useServiceListings();
  const status = statusMeta[profile.verificationStatus];
  const name = overview.data?.provider.name || user?.name || "Service Provider";
  const providerInitials = overview.data?.provider.initials || initials(name);
  const tierLabel = overview.data?.provider.tierLabel;
  const available = capacity.data?.newOrderAvailability ?? overview.data?.provider.availableNow;
  const response = overview.data?.last30Days;
  const profileImageUrl = resolveProviderMediaUrl(profile.profileImage?.url) ?? resolveProviderMediaUrl(overview.data?.provider.imagePath);
  const coverImageUrl = resolveProviderMediaUrl(profile.coverImage?.url);

  return (
    <div className="space-y-6">
      <SpCard className="overflow-hidden p-0">
        <div className="relative h-36 border-b border-[#E5E7EB] bg-[#F9FAFB] sm:h-48 lg:h-56">
          {coverImageUrl ? <img src={coverImageUrl} alt="" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 bg-[linear-gradient(120deg,#F9FAFB,#EEF2FF_55%,#F4F5F7)]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" aria-hidden="true" />
          <Button asChild variant="outline" className="absolute right-3 top-3 min-h-11 border-white/80 bg-white/95 shadow-none sm:right-6 sm:top-5">
            <Link href="/dashboard/serviceprovider/profile?view=edit"><Pencil className="size-4" />Edit profile</Link>
          </Button>
        </div>
        <div className="relative -mt-12 flex flex-col gap-5 px-4 pb-6 sm:-mt-14 sm:flex-row sm:items-end sm:px-7">
          <div className="relative w-fit">
            <Avatar className="size-24 border-4 border-white bg-[#F4F5F7] sm:size-28">
              {profileImageUrl && <AvatarImage src={profileImageUrl} alt={`${name} profile image`} />}
              <AvatarFallback className="bg-[#E8ECFF] font-heading text-xl font-semibold text-[#3C61DD]">{providerInitials}</AvatarFallback>
            </Avatar>
            {available !== undefined && (
              <span className={`absolute bottom-1 right-1 size-4 rounded-full border-2 border-white ${available ? "bg-[#157A55]" : "bg-[#9CA3AF]"}`} title={available ? "Available now" : "Not accepting new work"}>
                <span className="sr-only">{available ? "Available now" : "Not accepting new work"}</span>
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 sm:pb-1">
            <h2 className="font-heading text-2xl font-semibold text-[#171717]">{name}</h2>
            <p className="mt-1 text-sm text-[#4B5563] sm:text-base">{profile.headline?.trim() || "Add a professional headline"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SpStatusBadge tone={status.tone}><status.Icon className="size-3.5" aria-hidden="true" />{status.label}</SpStatusBadge>
              {tierLabel && <SpStatusBadge title="Affects match priority, not pricing.">{tierLabel}</SpStatusBadge>}
              {available !== undefined && <SpStatusBadge tone={available ? "positive" : "neutral"}>{available ? "Available now" : "Not accepting new work"}</SpStatusBadge>}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E5E7EB] pt-3 text-xs text-[#6B7280] sm:text-sm">
              <span>Member since {formatMonthYear(profile.createdAt)}</span>
              <span>{response?.averageResponseState === "available" && response.averageResponseMinutes != null ? `Average response ${formatResponseTime(response.averageResponseMinutes)}` : "Response time builds from lead activity"}</span>
            </div>
          </div>
        </div>
      </SpCard>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <SpCard>
            <SpSectionHeader title="Short Bio" action={<QuietLink href="/dashboard/serviceprovider/profile?view=edit" label="Edit" />} />
            {profile.bio?.trim() ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4B5563]">{profile.bio}</p>
            ) : (
              <InlineEmpty text="Add a short bio so clients can quickly understand your focus." href="/dashboard/serviceprovider/profile?view=edit" />
            )}
          </SpCard>

          <SpCard>
            <SpSectionHeader title="Professional Overview" action={<QuietLink href="/dashboard/serviceprovider/profile?view=edit#professional-overview" label="Edit" />} />
            {profile.professionalOverview?.plainText?.trim() ? (
              <div className="mt-4"><ProfessionalOverviewView content={profile.professionalOverview} /></div>
            ) : (
              <InlineEmpty text="Add a detailed overview of your expertise, approach and client value." href="/dashboard/serviceprovider/profile?view=edit#professional-overview" />
            )}
          </SpCard>

          <PortfolioPreview profile={profile} />
          <ServicesPreview listings={listings.data} isLoading={listings.isLoading} isError={listings.isError} />
        </div>

        <aside className="space-y-6" aria-label="Profile reputation and expertise">
          <TrustSummary profile={profile} trust={trust.data} isLoading={trust.isLoading} isError={trust.isError} />
          <SpCard>
            <SpSectionHeader title={`Skills (${profile.skills.length})`} action={<QuietLink href="/dashboard/serviceprovider/profile?view=edit" label="Edit" />} />
            {profile.skills.length ? <PillList values={profile.skills} /> : <InlineEmpty text="Add at least one skill." href="/dashboard/serviceprovider/profile?view=edit" />}
            <div className="my-5 border-t border-[#E5E7EB]" />
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#374151]"><Languages className="size-4" aria-hidden="true" />Languages</h3>
            {profile.languages.length ? <ul className="mt-3 space-y-2 text-sm text-[#4B5563]">{profile.languages.map((language) => <li key={language}>{language}</li>)}</ul> : <p className="mt-3 text-sm text-[#6B7280]">No languages added yet.</p>}
          </SpCard>

          <ProfileReadiness profile={profile} />
        </aside>
      </div>
    </div>
  );
}

function PortfolioPreview({ profile }: { profile: ServiceProviderProfile }) {
  return (
    <SpCard>
      <SpSectionHeader title="Portfolio" description={`${profile.portfolioItems.length} ${profile.portfolioItems.length === 1 ? "item" : "items"}`} action={<QuietLink href="/dashboard/serviceprovider/profile?view=edit#portfolio" label="Manage" />} />
      {profile.portfolioItems.length === 0 ? (
        <InlineEmpty text="Add work samples so clients can evaluate your delivery." href="/dashboard/serviceprovider/profile?view=edit#portfolio" />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {profile.portfolioItems.slice(0, 4).map((item) => (
            <article key={item.id ?? `legacy-${item.index}`} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#F4F5F7]">
                {(item.primaryImage?.url || item.imagePath) ? (
                  <img src={resolveProviderMediaUrl(item.primaryImage?.url ?? item.imagePath)!} alt={item.imageCaption?.trim() || `${item.title} project image`} className="size-full object-cover" />
                ) : <FolderOpen className="size-7 text-[#9CA3AF]" aria-hidden="true" />}
              </div>
              <div className="p-4">
                <h3 className="font-heading text-sm font-semibold text-[#171717]">{item.title}</h3>
                {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6B7280]">{item.description}</p>}
                {safeHttpUrl(item.url) && <a href={safeHttpUrl(item.url)!} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#3C61DD] hover:underline">View project<span className="sr-only">: {item.title}</span><ArrowRight className="size-3" aria-hidden="true" /></a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </SpCard>
  );
}

function ServicesPreview({ listings, isLoading, isError }: { listings?: Array<{ id: string; title: string; category: string; status: string; description: string }>; isLoading: boolean; isError: boolean }) {
  const published = listings?.filter((listing) => listing.status === "Published") ?? [];
  return (
    <SpCard>
      <SpSectionHeader title="Published Services" description="Listings clients can currently discover." action={<QuietLink href="/dashboard/serviceprovider/services" label="Open catalog" />} />
      {isLoading ? <Skeleton className="mt-4 h-28 rounded-xl" /> : isError ? (
        <p className="mt-4 text-sm text-[#6B7280]">Published services could not be loaded with this profile.</p>
      ) : published.length === 0 ? (
        <InlineEmpty text="No published services yet." href="/dashboard/serviceprovider/services" />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {published.slice(0, 4).map((listing) => (
            <article key={listing.id} className="rounded-xl border border-[#E5E7EB] p-4">
              <SpStatusBadge>{formatEnum(listing.category)}</SpStatusBadge>
              <h3 className="mt-3 font-heading text-sm font-semibold text-[#171717]">{listing.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6B7280]">{listing.description}</p>
            </article>
          ))}
        </div>
      )}
    </SpCard>
  );
}

function TrustSummary({ profile, trust, isLoading, isError }: { profile: ServiceProviderProfile; trust?: TrustBreakdown; isLoading: boolean; isError: boolean }) {
  return (
    <SpCard>
      <SpSectionHeader title="Trust Score" action={<QuietLink href="/dashboard/serviceprovider/profile?view=trust" label="Details" />} />
      {profile.verificationStatus !== "Verified" ? (
        <p className="mt-4 text-sm leading-6 text-[#6B7280]">Trust signals become available after profile verification.</p>
      ) : isLoading ? <Skeleton className="mt-4 h-32 rounded-xl" /> : isError || !trust ? (
        <p className="mt-4 text-sm leading-6 text-[#6B7280]">Your Trust Score could not be loaded right now.</p>
      ) : !trust.hasEnoughData ? (
        <div className="mt-5">
          <p className="text-4xl font-semibold text-[#9CA3AF]">—</p>
          <p className="mt-2 text-sm text-[#6B7280]">Building your trust score from real client and delivery signals.</p>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-4xl font-semibold text-[#171717]">{Math.round(trust.trustScore)}<span className="ml-1 text-base font-medium text-[#6B7280]">/100</span></p>
          <Progress className="mt-4" value={trust.trustScore} aria-label={`Trust Score ${Math.round(trust.trustScore)} out of 100`} />
          <ul className="mt-5 space-y-3">
            {trust.signals.slice(0, 4).map((signal) => (
              <li key={signal.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[#4B5563]">{signal.label}</span>
                <span className="font-semibold text-[#171717]">{signal.hasData ? `${Math.round(signal.value)}/100` : "Not tracked"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SpCard>
  );
}

function ProfileReadiness({ profile }: { profile: ServiceProviderProfile }) {
  const reqs = requirements(profile);
  return (
    <SpCard>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-[#171717]">Profile readiness</h2>
        <span className="text-sm font-semibold text-[#171717]">{profile.completionPercent}%</span>
      </div>
      <Progress className="mt-4" value={profile.completionPercent} aria-label={`Profile ${profile.completionPercent} percent complete`} />
      <ul className="mt-5 space-y-2">
        {reqs.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm text-[#4B5563]">
            {item.met ? <CheckCircle2 className="size-4 text-[#157A55]" aria-hidden="true" /> : <Circle className="size-4 text-[#9CA3AF]" aria-hidden="true" />}
            <span className={item.met ? "text-[#6B7280]" : "font-medium text-[#374151]"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </SpCard>
  );
}

function ProfileEditView({ profile }: { profile: ServiceProviderProfile }) {
  return (
    <div className="space-y-6">
      <ProfileMediaManager profile={profile} />
      <ProfileEditor profile={profile} />
      {/* Owner-only workspace: this tree is already behind the provider's own dashboard. */}
      <div id="portfolio" className="scroll-mt-24"><PortfolioSection items={profile.portfolioItems} isOwner /></div>
      <VerificationPanel profile={profile} />
    </div>
  );
}

function ProfileEditor({ profile }: { profile: ServiceProviderProfile }) {
  const { user } = useAuth();
  const upsert = useUpsertProfile();
  const initialDraft = profileDraft(profile);
  const [headline, setHeadline] = useState(initialDraft.headline);
  const [bio, setBio] = useState(initialDraft.bio);
  const [professionalOverview, setProfessionalOverview] = useState(initialDraft.professionalOverview);
  const [professionalOverviewText, setProfessionalOverviewText] = useState(professionalOverviewPlainText(initialDraft.professionalOverview));
  const [skills, setSkills] = useState(initialDraft.skills);
  const [industries, setIndustries] = useState(initialDraft.industries);
  const [languages, setLanguages] = useState(initialDraft.languages);
  const [categories, setCategories] = useState(initialDraft.categories);
  const [pricing, setPricing] = useState(initialDraft.pricing);
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const formState = { headline, bio, professionalOverview, skills, industries, languages, categories, pricing };
  const dirtyGuard = useSpDirtyFormGuard(formState);
  const { markClean } = dirtyGuard;
  const providerIdentity = profile.providerId ?? user?.id ?? "service-provider";
  const hydratedProviderRef = useRef(providerIdentity);

  function applyServerDraft(next: ProfileDraft) {
    setHeadline(next.headline);
    setBio(next.bio);
    setProfessionalOverview(next.professionalOverview);
    setProfessionalOverviewText(professionalOverviewPlainText(next.professionalOverview));
    setSkills(next.skills);
    setIndustries(next.industries);
    setLanguages(next.languages);
    setCategories(next.categories);
    setPricing(next.pricing);
    markClean(next);
  }

  useEffect(() => {
    if (hydratedProviderRef.current === providerIdentity) return;
    hydratedProviderRef.current = providerIdentity;
    applyServerDraft(profileDraft(profile));
    setFeedback(null);
  }, [profile, providerIdentity, markClean]);

  const toggleValue = (values: string[], value: string) => values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

  async function save() {
    if (skills.length === 0) {
      setFeedback({ status: "error", message: "Add at least one skill before saving." });
      return;
    }
    if (categories.length === 0) {
      setFeedback({ status: "error", message: "Select at least one service category before saving." });
      return;
    }
    const tagError = firstTagLengthError(formState);
    if (tagError) {
      setFeedback({ status: "error", message: tagError });
      return;
    }
    if (professionalOverviewText.length > 5000) {
      setFeedback({ status: "error", message: "Professional Overview must be 5,000 characters or fewer." });
      return;
    }
    setFeedback(null);
    try {
      const savedProfile = await upsert.mutateAsync({
        skills,
        serviceCategories: categories,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        professionalOverview: {
          schemaVersion: 1,
          document: professionalOverview,
        },
        industries,
        languages,
        pricingModels: pricing,
      });
      applyServerDraft(profileDraft(savedProfile));
      setFeedback({ status: "success", message: "Profile changes saved." });
    } catch {
      setFeedback({ status: "error", message: "Could not save your profile. Review the fields and try again." });
    }
  }

  return (
    <div className="space-y-6">
      <SpCard>
        <SpSectionHeader title="Professional identity" description="Introduce your expertise clearly. Your registered name cannot be edited here." />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <SpFormField id="provider-name" label="Provider name" description="Captured from your Mondial.eco account.">
            <Input value={user?.name || "Service Provider"} disabled />
          </SpFormField>
          <SpFormField id="headline" label="Professional headline" description={`${headline.length}/150 characters`}>
            <Input maxLength={150} value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="e.g. Senior UI/UX Designer for SaaS Platforms" />
          </SpFormField>
          <SpFormField id="bio" label="Short Bio" description={`${bio.length}/3000 characters. Keep this concise; the detailed overview is below.`} className="sm:col-span-2">
            <Textarea maxLength={3000} rows={5} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Summarize your expertise and the clients you help." />
          </SpFormField>
        </div>
      </SpCard>

      <SpCard id="professional-overview" className="scroll-mt-24">
        <ProfessionalOverviewEditor
          value={professionalOverview}
          onChange={(document, plainText) => {
            setProfessionalOverview(document);
            setProfessionalOverviewText(plainText);
          }}
          error={professionalOverviewText.length > 5000 ? "Professional Overview must be 5,000 characters or fewer." : null}
        />
      </SpCard>

      <SpCard>
        <SpSectionHeader title="Expertise domains" description="Select the service categories that accurately describe your work." />
        <fieldset className="mt-6">
          <legend className="sr-only">Service categories</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_CATEGORIES.map((category) => {
              const checked = categories.includes(category);
              return (
                <label key={category} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#3C61DD] ${checked ? "border-[#3C61DD] bg-[#EEF2FF] text-[#1F3FAF]" : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#C7CEDB]"}`}>
                  <input type="checkbox" checked={checked} onChange={() => setCategories((current) => toggleValue(current, category))} className="size-4 accent-[#3C61DD]" />
                  <span className="font-medium">{formatEnum(category)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </SpCard>

      <SpCard>
        <SpSectionHeader title="Skills, industries & languages" description="Use specific terms clients are likely to recognize. Language proficiency is not tracked by the current profile contract." />
        <div className="mt-6 space-y-6">
          <SpTagInput id="skills" label="Skills" value={skills} onChange={setSkills} maxItems={30} maxItemLength={TAG_LIMITS.skills.max} itemLengthError={TAG_LIMITS.skills.message} required placeholder="Type a skill and press Enter" description="At least one skill is required. Maximum 30." error={skills.some((value) => value.length > TAG_LIMITS.skills.max) ? TAG_LIMITS.skills.message : null} />
          <SpTagInput id="industries" label="Industries" value={industries} onChange={setIndustries} maxItems={20} maxItemLength={TAG_LIMITS.industries.max} itemLengthError={TAG_LIMITS.industries.message} placeholder="Type an industry and press Enter" error={industries.some((value) => value.length > TAG_LIMITS.industries.max) ? TAG_LIMITS.industries.message : null} />
          <SpTagInput id="languages" label="Languages" value={languages} onChange={setLanguages} maxItems={20} maxItemLength={TAG_LIMITS.languages.max} itemLengthError={TAG_LIMITS.languages.message} placeholder="Type a language and press Enter" error={languages.some((value) => value.length > TAG_LIMITS.languages.max) ? TAG_LIMITS.languages.message : null} />
        </div>
      </SpCard>

      <SpCard>
        <SpSectionHeader title="Engagement preferences" description="Choose every pricing model you are willing to offer." />
        <fieldset className="mt-6">
          <legend className="sr-only">Pricing models</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRICING_MODELS.map((model) => {
              const checked = pricing.includes(model);
              return (
                <label key={model} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#3C61DD] ${checked ? "border-[#3C61DD] bg-[#EEF2FF] text-[#1F3FAF]" : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#C7CEDB]"}`}>
                  <input type="checkbox" checked={checked} onChange={() => setPricing((current) => toggleValue(current, model))} className="size-4 accent-[#3C61DD]" />
                  <span className="font-medium">{formatEnum(model)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </SpCard>

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="outline"><Link href="/dashboard/serviceprovider/profile">Cancel</Link></Button>
        <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save profile"}</Button>
      </div>
    </div>
  );
}

const verificationCopy: Record<VerificationStatus, { title: string; body: string; tone: "neutral" | "positive" | "warning" | "negative" }> = {
  Pending: { title: "Ready when your profile is complete", body: "Your first complete submission is verified immediately; it does not enter a routine admin approval queue.", tone: "neutral" },
  UnderReview: { title: "Moderation review in progress", body: "This is a remediation review following an earlier admin decision. You will be notified when it is resolved.", tone: "warning" },
  Verified: { title: "Profile verified", body: "Your verification badge is active. Trust signals continue to build from real marketplace activity.", tone: "positive" },
  Rejected: { title: "Profile needs remediation", body: "Address the admin feedback, complete the profile, and resubmit into moderation review.", tone: "negative" },
};

function VerificationPanel({ profile }: { profile: ServiceProviderProfile }) {
  const submit = useSubmitVerification();
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const copy = verificationCopy[profile.verificationStatus];
  const canSubmit = profile.verificationStatus === "Pending" || profile.verificationStatus === "Rejected";
  const missing = requirements(profile).filter((item) => !item.met);

  async function submitProfile() {
    setSuccess(null);
    try {
      const result = await submit.mutateAsync({ confirmAccuracy: true });
      setSuccess(result.isVerified ? "Your completed profile is now verified." : "Your profile was submitted for moderation review.");
      setConfirmed(false);
    } catch {
      // The mutation error is rendered below without replacing backend state.
    }
  }

  return (
    <SpCard>
      <SpSectionHeader title="Profile verification" description="Verification is separate from the shared identity/KYC gate." />
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SpStatusBadge tone={copy.tone}>{copy.title}</SpStatusBadge>
        <p className="text-sm leading-6 text-[#6B7280]">{copy.body}</p>
      </div>
      {profile.verificationStatus === "Rejected" && profile.rejectionReason && (
        <SpMutationFeedback status="error" className="mt-5">Admin feedback: {profile.rejectionReason}</SpMutationFeedback>
      )}
      {success && <SpMutationFeedback status="success" className="mt-5">{success}</SpMutationFeedback>}
      {submit.isError && <SpMutationFeedback status="error" className="mt-5">Could not submit the profile. Confirm it is complete and try again.</SpMutationFeedback>}
      {canSubmit && (
        <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          {missing.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#374151]">Complete these items first:</p>
              <ul className="mt-2 grid gap-1 text-sm text-[#6B7280] sm:grid-cols-2">{missing.map((item) => <li key={item.key}>• {item.label}</li>)}</ul>
            </div>
          )}
          <label className="flex items-start gap-3 text-sm text-[#374151]">
            <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>I confirm that the information in this profile is accurate and ready to show clients.</span>
          </label>
          <Button className="mt-4" disabled={!confirmed || missing.length > 0 || submit.isPending} onClick={submitProfile}>
            {submit.isPending ? "Submitting…" : profile.verificationStatus === "Rejected" ? "Resubmit for moderation review" : "Submit completed profile"}
          </Button>
        </div>
      )}
    </SpCard>
  );
}

function PillList({ values }: { values: string[] }) {
  return <ul className="mt-4 flex flex-wrap gap-2">{values.map((value) => <li key={value} className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-sm text-[#374151]">{value}</li>)}</ul>;
}

function InlineEmpty({ text, href }: { text: string; href: string }) {
  return <div className="mt-4 rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-5"><p className="text-sm text-[#6B7280]">{text}</p><Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#3C61DD] hover:underline">Add details<ArrowRight className="size-4" aria-hidden="true" /></Link></div>;
}

function QuietLink({ href, label }: { href: string; label: string }) {
  return <Button asChild variant="outline" size="sm" className="shadow-none"><Link href={href}>{label}<ArrowRight className="size-3.5" aria-hidden="true" /></Link></Button>;
}

function profileView(value: string | null): ProfileView {
  return value === "edit" || value === "trust" ? value : "overview";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SP";
}

function formatMonthYear(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(value));
}

function formatResponseTime(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `${hours.toFixed(hours < 10 ? 1 : 0)} hr`;
}

function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
