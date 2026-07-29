"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  Briefcase,
  Camera,
  GraduationCap,
  Pencil,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  SpCard,
  SpEmptyState,
  SpPage,
  SpSectionHeader,
  SpStatusBadge,
  SpTabBar,
} from "@/components/serviceprovider/ui";
import { ProfessionalOverviewView } from "@/components/serviceprovider/ProfessionalOverviewView";
import { PortfolioSection } from "@/components/serviceprovider/PortfolioSection";
import { TrustAndSkillsSection } from "@/components/serviceprovider/TrustAndSkillsSection";
import { useProviderOverview } from "@/hooks/queries/analytics";
import { useServiceListings } from "@/hooks/queries/service-catalog";
import {
  useServiceProviderProfile,
  useServiceProviderTrust,
} from "@/hooks/queries/service-provider";
import { resolveProviderMediaUrl } from "@/lib/service-provider/provider-media";
import {
  legacyProfileRedirect,
  PROFILE_VIEW_ROUTE,
  SECTION_EDIT_HREF,
} from "@/lib/service-provider/profile-navigation";
import {
  CREDENTIAL_STATUS_LABELS,
  LANGUAGE_PROFICIENCY_LABELS,
  type LanguageProficiency,
  type ServiceProviderProfile,
} from "@/types/service-provider";

/** Owner sees edit affordances and private fields; public/client mode sees neither. */
export type ProfileViewMode = "owner" | "public";

const readable = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

function formatMonth(value?: string | null) {
  if (!value) return null;
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function EditAction({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm" className="min-h-11">
      <Link href={href}>
        <Pencil className="size-4" aria-hidden="true" />
        Edit<span className="sr-only">{` ${label}`}</span>
      </Link>
    </Button>
  );
}

export function ProfileView({ mode = "owner" }: { mode?: ProfileViewMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const profileQuery = useServiceProviderProfile();
  const overview = useProviderOverview("EUR");
  const listings = useServiceListings();
  const profile = profileQuery.data;
  const trust = useServiceProviderTrust(profile?.verificationStatus === "Verified");

  const isOwner = mode === "owner";

  // Links minted before the split pointed the whole editor at `?view=edit`.
  const legacyView = searchParams.get("view");
  useEffect(() => {
    const redirect = legacyProfileRedirect(legacyView);
    if (redirect) router.replace(redirect);
  }, [legacyView, router]);

  if (profileQuery.isLoading) {
    return (
      <SpPage className="pb-4">
        <div className="space-y-4" role="status" aria-live="polite">
          <span className="sr-only">Loading profile</span>
          <div className="h-48 animate-pulse rounded-2xl bg-[#EDEFF3]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#EDEFF3]" />
        </div>
      </SpPage>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <SpPage className="pb-4">
        <SpCard>
          <SpEmptyState
            title="Profile unavailable"
            description="We could not load this profile. Check your connection and try again."
            action={
              <Button type="button" variant="outline" className="min-h-11" onClick={() => profileQuery.refetch()}>
                Retry
              </Button>
            }
          />
        </SpCard>
      </SpPage>
    );
  }

  const provider = overview.data?.provider;
  const response = overview.data?.last30Days;
  const verified = profile.verificationStatus === "Verified";
  const coverUrl = resolveProviderMediaUrl(profile.coverImage?.url);
  const profileImageUrl =
    resolveProviderMediaUrl(profile.profileImage?.url) ?? resolveProviderMediaUrl(provider?.imagePath);
  const name = provider?.name || user?.name || "Service Provider";

  // Owner sees every credential with its status; public sees verified only, and
  // the server already strips private fields from the public projection.
  const credentials = isOwner
    ? profile.credentials ?? []
    : (profile.credentials ?? []).filter((item) => item.status === "Verified");

  const languages =
    profile.languageProficiencies?.length > 0
      ? profile.languageProficiencies
      : profile.languages.map((language) => ({
          id: language,
          language,
          proficiency: null as LanguageProficiency | null,
        }));

  // Trust & Skills remains a read-only section of the profile page (the skills
  // test is a side path, not part of the four-step editor).
  const showingTrust = legacyView === "trust";
  const tabs = isOwner
    ? [
        { label: "Overview", href: PROFILE_VIEW_ROUTE, active: !showingTrust },
        { label: "Trust & Skills", href: `${PROFILE_VIEW_ROUTE}?view=trust`, active: showingTrust },
      ]
    : [];

  return (
    <SpPage className="pb-4">
      {isOwner && <SpTabBar label="Profile sections" items={tabs} />}
      {showingTrust ? (
        <TrustAndSkillsSection profile={profile} />
      ) : (
        <ProfileSections
          profile={profile}
          isOwner={isOwner}
          name={name}
          verified={verified}
          coverUrl={coverUrl}
          profileImageUrl={profileImageUrl}
          tierLevel={trust.data?.tierLevel}
          availableNow={provider?.availableNow}
          responseMinutes={
            response?.averageResponseState === "available" ? response.averageResponseMinutes : null
          }
          credentials={credentials}
          languages={languages}
          listings={listings.data ?? []}
        />
      )}
    </SpPage>
  );
}

function ProfileSections({
  profile,
  isOwner,
  name,
  verified,
  coverUrl,
  profileImageUrl,
  tierLevel,
  availableNow,
  responseMinutes,
  credentials,
  languages,
  listings,
}: {
  profile: ServiceProviderProfile;
  isOwner: boolean;
  name: string;
  verified: boolean;
  coverUrl?: string | null;
  profileImageUrl?: string | null;
  tierLevel?: number;
  availableNow?: boolean;
  responseMinutes?: number | null;
  credentials: ServiceProviderProfile["credentials"];
  languages: Array<{ id: string; language: string; proficiency: LanguageProficiency | null }>;
  listings: Array<{ id: string; title: string; category: string; status: string }>;
}) {
  return (
    <>
      {/* ---- Header ---- */}
      <SpCard className="overflow-hidden p-0">
        {isOwner && (
          <div className="flex justify-end px-4 pt-4 sm:px-7">
            <Button asChild className="min-h-11">
              <Link href={SECTION_EDIT_HREF.profile()}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit Profile
              </Link>
            </Button>
          </div>
        )}
        <div className="relative aspect-[3/1] max-h-56 min-h-28 bg-[linear-gradient(120deg,#F9FAFB,#EEF2FF_55%,#F4F5F7)]">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
          )}
        </div>
        <div className="relative -mt-12 flex flex-col gap-4 px-4 pb-6 sm:px-7">
          <div className="flex items-end gap-4">
            <div className="size-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#F4F5F7]">
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImageUrl} alt={name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-[#9CA3AF]">
                  <Camera className="size-6" aria-hidden="true" />
                  <span className="sr-only">No profile image set</span>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold text-[#171717]">{name}</h1>
            {profile.headline && <p className="mt-1 text-sm text-[#4B5563]">{profile.headline}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {verified && (
                <SpStatusBadge tone="positive">
                  <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
                  Verified
                </SpStatusBadge>
              )}
              {tierLevel ? (
                <SpStatusBadge tone="neutral">{`Tier ${tierLevel}`}</SpStatusBadge>
              ) : null}
              {availableNow && <SpStatusBadge tone="positive">Available now</SpStatusBadge>}
            </div>

            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#4B5563]">
              {profile.createdAt && (
                <div className="flex gap-1">
                  <dt className="text-[#6B7280]">Member since:</dt>
                  <dd>
                    {new Date(profile.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
              <div className="flex gap-1">
                <dt className="text-[#6B7280]">Avg response time:</dt>
                <dd>
                  {responseMinutes ? `${responseMinutes} mins` : "Not tracked"}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-[#6B7280]">Affects match priority, not pricing.</p>
          </div>
        </div>
      </SpCard>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* ---- About ---- */}
          <SpCard>
            <SpSectionHeader
              title="About"
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.about()} label="about" /> : undefined}
            />
            <div className="mt-4 space-y-4">
              {profile.bio ? (
                <p className="text-sm leading-6 text-[#4B5563]">{profile.bio}</p>
              ) : null}
              <ProfessionalOverviewView content={profile.professionalOverview} />
              {!profile.bio && !profile.professionalOverview?.plainText && (
                <SpEmptyState
                  title="No overview yet"
                  description={isOwner ? "Add a short bio and a Professional Overview." : "This provider has not added an overview."}
                />
              )}
            </div>
          </SpCard>

          {/* ---- Experience ---- */}
          <SpCard>
            <SpSectionHeader
              title="Experience"
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.experience()} label="experience" /> : undefined}
            />
            <div className="mt-4 space-y-4">
              {(profile.experiences ?? []).length === 0 ? (
                <SpEmptyState
                  icon={Briefcase}
                  title="No experience added"
                  description={isOwner ? "Add roles to show clients where you have worked." : "No experience listed."}
                />
              ) : (
                (profile.experiences ?? []).map((item) => (
                  <article key={item.id} className="border-l-2 border-[#E5E7EB] pl-4">
                    <h3 className="text-sm font-semibold text-[#171717]">{item.jobTitle}</h3>
                    <p className="text-sm text-[#4B5563]">{item.companyName}</p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      {formatMonth(item.startDate)} —{" "}
                      {item.isCurrent ? "Present" : formatMonth(item.endDate) ?? "—"}
                    </p>
                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-[#4B5563]">{item.description}</p>
                    )}
                  </article>
                ))
              )}
            </div>
          </SpCard>

          {/* ---- Education ---- */}
          <SpCard>
            <SpSectionHeader
              title="Education"
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.education()} label="education" /> : undefined}
            />
            <div className="mt-4 space-y-4">
              {(profile.education ?? []).length === 0 ? (
                <SpEmptyState
                  icon={GraduationCap}
                  title="No education added"
                  description={isOwner ? "Add your qualifications." : "No education listed."}
                />
              ) : (
                (profile.education ?? []).map((item) => (
                  <article key={item.id} className="border-l-2 border-[#E5E7EB] pl-4">
                    <h3 className="text-sm font-semibold text-[#171717]">{item.degree}</h3>
                    <p className="text-sm text-[#4B5563]">
                      {item.institution}
                      {item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      {item.startYear} — {item.endYear ?? "Present"}
                    </p>
                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-[#4B5563]">{item.description}</p>
                    )}
                  </article>
                ))
              )}
            </div>
          </SpCard>

          {/* ---- Portfolio (existing manager, unchanged) ---- */}
          <PortfolioSection items={profile.portfolioItems} />

          {/* ---- Services ---- */}
          <SpCard>
            <SpSectionHeader
              title="Services"
              description={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.services()} label="services" /> : undefined}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {listings.length === 0 ? (
                <SpEmptyState
                  title="No published services"
                  description={isOwner ? "Create a service listing to start receiving briefs." : "No services published."}
                  className="sm:col-span-2"
                />
              ) : (
                listings.map((listing) => (
                  <article key={listing.id} className="rounded-xl border border-[#E5E7EB] p-4">
                    <h3 className="text-sm font-semibold text-[#171717]">{listing.title}</h3>
                    <p className="mt-1 text-xs text-[#6B7280]">{readable(listing.category)}</p>
                    {isOwner && (
                      <SpStatusBadge tone="neutral" className="mt-2">
                        {readable(listing.status)}
                      </SpStatusBadge>
                    )}
                  </article>
                ))
              )}
            </div>
          </SpCard>
        </div>

        {/* ---- Right column ---- */}
        <div className="space-y-6">
          <SpCard>
            <SpSectionHeader title="Mondial Score" />
            <div className="mt-4">
              {profile.hasEnoughTrustData ? (
                <p className="font-heading text-3xl font-semibold text-[#171717]">
                  {Math.round(profile.trustScore)}
                  <span className="ml-1 text-base font-normal text-[#6B7280]">/ 100</span>
                </p>
              ) : (
                <p className="text-sm text-[#6B7280]">Not enough data</p>
              )}
              <p className="mt-2 text-xs text-[#6B7280]">
                Reflects delivery and client signals. Affects match priority, not pricing.
              </p>
            </div>
          </SpCard>

          <SpCard>
            <SpSectionHeader
              title="Skills"
              description={`${profile.skills.length} listed`}
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.skills()} label="skills" /> : undefined}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.length === 0 ? (
                <p className="text-sm text-[#6B7280]">No skills added.</p>
              ) : (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm text-[#374151]"
                  >
                    {skill}
                  </span>
                ))
              )}
            </div>

            {profile.industries.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs uppercase tracking-wide text-[#6B7280]">Industries</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.industries.map((industry) => (
                    <span
                      key={industry}
                      className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm text-[#374151]"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SpCard>

          <SpCard>
            <SpSectionHeader
              title="Languages"
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.languages()} label="languages" /> : undefined}
            />
            <div className="mt-4 space-y-2">
              {languages.length === 0 ? (
                <p className="text-sm text-[#6B7280]">No languages added.</p>
              ) : (
                languages.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#374151]">{entry.language}</span>
                    {entry.proficiency && (
                      <span className="text-[#6B7280]">
                        {LANGUAGE_PROFICIENCY_LABELS[entry.proficiency]}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </SpCard>

          <SpCard>
            <SpSectionHeader
              title="Credentials"
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.credentials()} label="credentials" /> : undefined}
            />
            <div className="mt-4 space-y-3">
              {credentials.length === 0 ? (
                <SpEmptyState
                  icon={Award}
                  title="No credentials added"
                  description={isOwner ? "Add a certification, license or degree." : "No verified credentials."}
                />
              ) : (
                credentials.map((credential) => (
                  <article key={credential.id} className="rounded-xl border border-[#E5E7EB] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#171717]">{credential.title}</h3>
                        {credential.issuingOrganization && (
                          <p className="text-xs text-[#6B7280]">{credential.issuingOrganization}</p>
                        )}
                      </div>
                      {/* Owners see every status; public sees the verified badge only. */}
                      {isOwner ? (
                        <SpStatusBadge
                          tone={
                            credential.status === "Verified"
                              ? "positive"
                              : credential.status === "Rejected" || credential.status === "Expired"
                                ? "negative"
                                : "warning"
                          }
                        >
                          {CREDENTIAL_STATUS_LABELS[credential.status]}
                        </SpStatusBadge>
                      ) : (
                        <SpStatusBadge tone="positive">Verified</SpStatusBadge>
                      )}
                    </div>
                    {isOwner && credential.reviewNote && (
                      <p className="mt-2 text-xs text-[#B42318]">{credential.reviewNote}</p>
                    )}
                    {isOwner && credential.documentFileName && (
                      <p className="mt-1 truncate text-xs text-[#6B7280]">
                        {credential.documentFileName}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </SpCard>

          <SpCard>
            <SpSectionHeader title="Ratings" />
            <div className="mt-4">
              {profile.hasEnoughTrustData ? (
                <p className="flex items-center gap-2 font-heading text-2xl font-semibold text-[#171717]">
                  <Star className="size-5 text-[#157A55]" aria-hidden="true" />
                  {(profile.trustScore / 20).toFixed(1)}
                </p>
              ) : (
                <p className="text-sm text-[#6B7280]">No reviews yet</p>
              )}
            </div>
          </SpCard>
        </div>
      </div>
    </>
  );
}
