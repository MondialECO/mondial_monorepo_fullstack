"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  Briefcase,
  Building2,
  Camera,
  Check,
  Compass,
  Copy,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  Pencil,
  PieChart,
  Share2,
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
import { useProfile, usePublicProfile } from "@/hooks/queries/universal-profile";
import { useServiceProviderProfile, useServiceProviderTrust } from "@/hooks/queries/service-provider";
import { PROVIDER_IMAGE_RULES, resolveProviderMediaUrl } from "@/lib/service-provider/provider-media";
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
export interface ProfileViewProps {
  mode?: "owner" | "public" | "client";
  profile?: any;
  identifier?: string;
}

/** Single source for the cover ratio — shared with the uploader's crop target. */
const COVER_RULE = PROVIDER_IMAGE_RULES.cover;

function formatMonth(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function readable(str?: string | null) {
  if (!str) return "";
  return str.replace(/([A-Z])/g, " $1").trim();
}

function EditAction({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="min-h-8 px-2 text-[#4B5563] hover:text-[#171717]">
      <Link href={href}>
        <Pencil className="size-3.5" aria-hidden="true" />
        <span>Edit {label}</span>
      </Link>
    </Button>
  );
}

export function ProfileView({ mode = "owner", profile: profileProp, identifier }: ProfileViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isOwner = mode === "owner";

  const ownerQuery = useProfile({ enabled: (isOwner || !identifier) && !profileProp });
  const publicQuery = usePublicProfile(identifier ?? "", {
    enabled: !isOwner && !profileProp && Boolean(identifier),
  });

  const query = isOwner ? ownerQuery : (identifier ? publicQuery : ownerQuery);
  const profile = profileProp ?? query.data;

  const userRoles = (user as any)?.roles as string[] | undefined;
  const isExplicitNonSp =
    Boolean(user?.role && user.role.toLowerCase() !== "serviceprovider") &&
    (!userRoles || !userRoles.some((r: string) => r.toLowerCase() === "serviceprovider")) &&
    (!profile?.roles || !profile.roles.some((r: string) => r.toLowerCase() === "serviceprovider"));

  const isServiceProvider = isOwner
    ? !isExplicitNonSp
    : (!profile?.roles || profile.roles.length === 0
        ? true
        : profile.roles.some((r: string) => r.toLowerCase() === "serviceprovider") || Boolean(profile?.serviceProviderExtension || profile?.serviceProvider));

  const spProfileQuery = useServiceProviderProfile(isOwner && isServiceProvider);
  const spProfile = spProfileQuery.data;

  const overview = useProviderOverview("EUR", isOwner && isServiceProvider);
  const ownerListings = useServiceListings(isOwner && isServiceProvider);
  const trust = useServiceProviderTrust(isOwner && isServiceProvider);

  // Links minted before the split pointed the whole editor at `?view=edit`.
  const legacyView = searchParams.get("view");
  useEffect(() => {
    if (!isOwner) return;
    if (legacyView === "trust" && !isServiceProvider) {
      router.replace(PROFILE_VIEW_ROUTE);
      return;
    }
    const redirect = legacyProfileRedirect(legacyView);
    if (redirect) router.replace(redirect);
  }, [legacyView, router, isOwner, isServiceProvider]);

  if (!profile && query.isLoading) {
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

  if (!profile && (query.isError || !query.isLoading)) {
    return (
      <SpPage className="pb-4">
        <SpCard>
          <SpEmptyState
            title={isOwner ? "Profile unavailable" : "Profile not found"}
            description={
              isOwner
                ? "We could not load this profile. Check your connection and try again."
                : "The profile you are looking for does not exist or is currently unavailable."
            }
            action={
              isOwner ? (
                <Button type="button" variant="outline" className="min-h-11" onClick={() => ownerQuery.refetch()}>
                  Retry
                </Button>
              ) : (
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/">Back to Home</Link>
                </Button>
              )
            }
          />
        </SpCard>
      </SpPage>
    );
  }

  if (!profile) return null;

  const provider = overview.data?.provider;
  const response = overview.data?.last30Days;
  const verificationStatus = spProfile?.verificationStatus ?? provider?.verificationStatus ?? profile.verificationStatus;
  const verified = verificationStatus === "Verified";
  const coverUrl = resolveProviderMediaUrl(profile.coverImage?.publicUrl ?? profile.coverImage?.url);
  const profileImageUrl =
    resolveProviderMediaUrl(profile.profileImage?.publicUrl ?? profile.profileImage?.url) ??
    (isOwner ? resolveProviderMediaUrl(provider?.imagePath) : undefined);
  const name = profile.name || provider?.name || user?.name || "Mondial Member";

  const spExtension = profile.serviceProviderExtension ?? (profile as any).serviceProvider;

  // Owner sees every credential with its status; public sees verified only
  const rawCredentials = isOwner
    ? (spProfile?.credentials ?? profile.credentials ?? [])
    : (spExtension?.verifiedCredentials ?? (profile.credentials ?? []).filter((item: any) => item.status === "Verified"));
  const credentials = isOwner
    ? rawCredentials
    : rawCredentials.filter((item: any) => !item.status || item.status === "Verified");

  const portfolioItems = isOwner
    ? (spProfile?.portfolioItems ?? profile.portfolioItems ?? [])
    : (spExtension?.portfolioItems ?? profile.portfolioItems ?? []);

  const trustScore = isOwner
    ? (trust.data?.trustScore ?? spProfile?.trustScore ?? 0)
    : (spExtension?.trustScore ?? profile.trustScore ?? 0);

  const hasEnoughTrustData = isOwner
    ? Boolean(trust.data?.hasEnoughData ?? spProfile?.hasEnoughTrustData)
    : Boolean(spExtension?.hasEnoughTrustData ?? profile.hasEnoughTrustData);

  const tierLevel = isOwner
    ? (trust.data?.tierLevel ?? provider?.tierLevel)
    : (spExtension?.providerTier ? (parseInt(String(spExtension.providerTier).replace(/\D/g, ""), 10) || undefined) : undefined);

  const listings = isOwner
    ? (ownerListings.data ?? [])
    : (spExtension?.publishedServices ?? []);

  const ratingSummary = isOwner ? null : (spExtension?.ratingSummary ?? null);

  const languages =
    (profile.languageProficiencies?.length ?? 0) > 0
      ? profile.languageProficiencies
      : (profile.languages ?? []).map((language: string) => ({
          id: language,
          language,
          proficiency: null as LanguageProficiency | null,
        }));

  // Trust & Skills remains a read-only section of the profile page
  const showingTrust = isOwner && isServiceProvider && legacyView === "trust";
  const tabs = isOwner && isServiceProvider
    ? [
        { label: "Overview", href: PROFILE_VIEW_ROUTE, active: !showingTrust },
        { label: "Trust & Skills", href: `${PROFILE_VIEW_ROUTE}?view=trust`, active: showingTrust },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-4">
      {isOwner && isServiceProvider && tabs.length > 0 && <SpTabBar label="Profile sections" items={tabs} />}
      {showingTrust ? (
        <TrustAndSkillsSection profile={spProfile ?? profile} verificationStatus={verificationStatus} />
      ) : (
        <ProfileSections
          profile={profile}
          isOwner={isOwner}
          isServiceProvider={isServiceProvider}
          roles={profile.roles ?? (isOwner && user?.role ? [user.role] : [])}
          name={name}
          slug={profile.slug}
          verified={verified}
          coverUrl={coverUrl}
          profileImageUrl={profileImageUrl}
          tierLevel={tierLevel}
          availableNow={provider?.availableNow}
          responseMinutes={
            response?.averageResponseState === "available" ? response.averageResponseMinutes : null
          }
          credentials={credentials}
          portfolioItems={portfolioItems}
          trustScore={trustScore}
          hasEnoughTrustData={hasEnoughTrustData}
          languages={languages}
          listings={listings}
          ratingSummary={ratingSummary}
          creatorExtension={profile.creatorExtension}
          entrepreneurExtension={profile.entrepreneurExtension}
          investorExtension={profile.investorExtension}
        />
      )}
    </div>
  );
}

function ProfileSections({
  profile,
  isOwner,
  isServiceProvider,
  roles,
  name,
  slug,
  verified,
  coverUrl,
  profileImageUrl,
  tierLevel,
  availableNow,
  responseMinutes,
  credentials = [],
  portfolioItems = [],
  trustScore = 0,
  hasEnoughTrustData = false,
  languages = [],
  listings = [],
  ratingSummary = null,
  creatorExtension = null,
  entrepreneurExtension = null,
  investorExtension = null,
}: {
  profile: any;
  isOwner: boolean;
  isServiceProvider: boolean;
  roles: string[];
  name: string;
  slug?: string | null;
  verified: boolean;
  coverUrl?: string | null;
  profileImageUrl?: string | null;
  tierLevel?: number;
  availableNow?: boolean;
  responseMinutes?: number | null;
  credentials?: any[];
  portfolioItems?: any[];
  trustScore?: number;
  hasEnoughTrustData?: boolean;
  languages?: Array<{ id: string; language: string; proficiency: LanguageProficiency | null }>;
  listings?: Array<{ id: string; title: string; category: string; status?: string; pricingModel?: string; startingPrice?: number; currency?: string; primaryImageUrl?: string | null }>;
  ratingSummary?: { averageRating: number; totalReviews: number } | null;
  creatorExtension?: { publishedProjectsCount?: number; focusCategories?: string[] } | null;
  entrepreneurExtension?: { foundedCompanies?: Array<{ id?: string; name: string; industry?: string; foundedYear?: number; status?: string }> } | null;
  investorExtension?: { investmentThesis?: string; targetStages?: string[]; targetIndustries?: string[]; targetGeography?: string[] } | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!slug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/profile/${slug}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const coverAspectRatio = `${COVER_RULE.width} / ${COVER_RULE.height}`;

  return (
    <>
      {/* ---- Unified profile header (cover + avatar + identity in one card) ---- */}
      <div className="mx-auto w-full max-w-[1440px]">
        <SpCard className="overflow-hidden p-0">
          <div
            data-testid="profile-cover"
            className="relative w-full bg-[linear-gradient(120deg,#F9FAFB,#EEF2FF_55%,#F4F5F7)]"
            style={{ aspectRatio: coverAspectRatio }}
          >
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
            )}

            {/* Owner action buttons */}
            {isOwner && (
              <div className="absolute right-4 top-4 flex flex-wrap items-center gap-2 sm:right-6 sm:top-6">
                {slug && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-11 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white text-[#171717]"
                      onClick={handleShare}
                    >
                      {copied ? (
                        <>
                          <Check className="size-4 text-[#157A55]" aria-hidden="true" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="size-4" aria-hidden="true" />
                          <span>Share Profile</span>
                        </>
                      )}
                    </Button>

                    <Button
                      asChild
                      variant="secondary"
                      className="min-h-11 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white text-[#171717]"
                    >
                      <Link href={`/profile/${slug}`}>
                        <ExternalLink className="size-4" aria-hidden="true" />
                        <span>View Public Profile</span>
                      </Link>
                    </Button>
                  </>
                )}

                <Button asChild className="min-h-11">
                  <Link href={SECTION_EDIT_HREF.profile()}>
                    <Pencil className="size-4" aria-hidden="true" />
                    <span>Edit Profile</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Avatar overlaps the cover while staying inside the same card. */}
          <div className="relative z-10 -mt-12 flex items-end gap-4 px-4 sm:px-6">
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

          {/* Identity information */}
          <div className="min-w-0 px-4 pb-6 pt-4 sm:px-6">
            <h1 className="font-heading text-2xl font-semibold text-[#171717]">{name}</h1>
            {profile.headline && <p className="mt-1 text-sm text-[#4B5563]">{profile.headline}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {roles.map((role) => (
                <SpStatusBadge key={role} tone="neutral">
                  {role}
                </SpStatusBadge>
              ))}
              {verified && (
                <SpStatusBadge tone="positive">
                  <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
                  Verified
                </SpStatusBadge>
              )}
              {isServiceProvider && tierLevel ? (
                <SpStatusBadge tone="neutral">{`Tier ${tierLevel}`}</SpStatusBadge>
              ) : null}
              {isServiceProvider && availableNow && <SpStatusBadge tone="positive">Available now</SpStatusBadge>}
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
              {isServiceProvider && (
                <div className="flex gap-1">
                  <dt className="text-[#6B7280]">Avg response time:</dt>
                  <dd>{responseMinutes ? `${responseMinutes} mins` : "Not tracked"}</dd>
                </div>
              )}
            </dl>

            {isServiceProvider && (
              <p className="mt-3 text-xs text-[#6B7280]">Affects match priority, not pricing.</p>
            )}
          </div>
        </SpCard>
      </div>

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
                  description={isOwner ? "Add a short bio and a Professional Overview." : "This member has not added an overview."}
                />
              )}
            </div>
          </SpCard>

          {/* ---- Creator Extension ---- */}
          {creatorExtension && (
            <SpCard>
              <SpSectionHeader
                title="Creator Projects & Focus"
                description={`${creatorExtension.publishedProjectsCount ?? 0} published project${(creatorExtension.publishedProjectsCount ?? 0) === 1 ? "" : "s"}`}
              />
              <div className="mt-4 space-y-3">
                {(creatorExtension.focusCategories ?? []).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Focus Categories</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {creatorExtension.focusCategories?.map((cat) => (
                        <span key={cat} className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#374151]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SpCard>
          )}

          {/* ---- Entrepreneur Extension ---- */}
          {entrepreneurExtension && (
            <SpCard>
              <SpSectionHeader
                title="Founded Companies & Ventures"
                description={`${entrepreneurExtension.foundedCompanies?.length ?? 0} venture${(entrepreneurExtension.foundedCompanies?.length ?? 0) === 1 ? "" : "s"}`}
              />
              <div className="mt-4 space-y-3">
                {(!entrepreneurExtension.foundedCompanies || entrepreneurExtension.foundedCompanies.length === 0) ? (
                  <p className="text-sm text-[#6B7280]">No ventures listed yet.</p>
                ) : (
                  entrepreneurExtension.foundedCompanies.map((company, i) => (
                    <article key={company.id || i} className="rounded-xl border border-[#E5E7EB] p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-[#171717]">{company.name}</h4>
                          {company.industry && <p className="text-xs text-[#6B7280]">{company.industry}</p>}
                        </div>
                        {company.foundedYear && (
                          <span className="text-xs text-[#6B7280]">Founded {company.foundedYear}</span>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </SpCard>
          )}

          {/* ---- Investor Extension ---- */}
          {investorExtension && (
            <SpCard>
              <SpSectionHeader title="Investment Profile" />
              <div className="mt-4 space-y-4 text-sm text-[#374151]">
                {investorExtension.investmentThesis && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Thesis</h4>
                    <p className="mt-1 leading-relaxed text-[#4B5563]">{investorExtension.investmentThesis}</p>
                  </div>
                )}
                {(investorExtension.targetStages ?? []).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Target Stages</h4>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {investorExtension.targetStages?.map((stage) => (
                        <span key={stage} className="rounded-md bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-medium text-[#3C61DD]">
                          {stage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(investorExtension.targetIndustries ?? []).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Target Industries</h4>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {investorExtension.targetIndustries?.map((ind) => (
                        <span key={ind} className="rounded-md bg-[#F3F4F6] px-2.5 py-0.5 text-xs text-[#374151]">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(investorExtension.targetGeography ?? []).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Target Geography</h4>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {investorExtension.targetGeography?.map((geo) => (
                        <span key={geo} className="rounded-md border border-[#E5E7EB] px-2.5 py-0.5 text-xs text-[#4B5563]">
                          {geo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SpCard>
          )}

          {/* ---- Experience ---- */}
          <SpCard>
            <SpSectionHeader
              title="Experience"
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.experience()} label="experience" /> : undefined}
            />
            <div className="mt-4 space-y-4">
              {((profile.experiences ?? []) as any[]).length === 0 ? (
                <SpEmptyState
                  icon={Briefcase}
                  title="No experience added"
                  description={isOwner ? "Add roles to show clients where you have worked." : "No experience listed."}
                />
              ) : (
                ((profile.experiences ?? []) as any[]).map((item) => (
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
              {((profile.education ?? []) as any[]).length === 0 ? (
                <SpEmptyState
                  icon={GraduationCap}
                  title="No education added"
                  description={isOwner ? "Add your qualifications." : "No education listed."}
                />
              ) : (
                ((profile.education ?? []) as any[]).map((item) => (
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

          {/* ---- Portfolio (SP-only) ---- */}
          {isServiceProvider && <PortfolioSection items={portfolioItems} isOwner={isOwner} />}

          {/* ---- Services (SP-only) ---- */}
          {isServiceProvider && (
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
                      {listing.startingPrice !== undefined && listing.startingPrice > 0 && (
                        <p className="mt-2 text-xs font-medium text-[#157A55]">
                          From {listing.currency === "USD" ? "$" : listing.currency === "GBP" ? "£" : "€"}{listing.startingPrice} · {listing.pricingModel || "Fixed"}
                        </p>
                      )}
                      {isOwner && listing.status && (
                        <SpStatusBadge tone="neutral" className="mt-2">
                          {readable(listing.status)}
                        </SpStatusBadge>
                      )}
                    </article>
                  ))
                )}
              </div>
            </SpCard>
          )}
        </div>

        {/* ---- Right column ---- */}
        <div className="space-y-6">
          {isServiceProvider && (
            <SpCard>
              <SpSectionHeader title="Mondial Score" />
              <div className="mt-4">
                {hasEnoughTrustData ? (
                  <p className="font-heading text-3xl font-semibold text-[#171717]">
                    {Math.round(trustScore)}
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
          )}

          <SpCard>
            <SpSectionHeader
              title="Skills"
              description={`${(profile.skills ?? []).length} listed`}
              action={isOwner ? <EditAction href={SECTION_EDIT_HREF.skills()} label="skills" /> : undefined}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {(profile.skills ?? []).length === 0 ? (
                <p className="text-sm text-[#6B7280]">No skills added.</p>
              ) : (
                (profile.skills ?? []).map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm text-[#374151]"
                  >
                    {skill}
                  </span>
                ))
              )}
            </div>

            {(profile.industries ?? []).length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs uppercase tracking-wide text-[#6B7280]">Expertise Domains</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.industries.map((industry: string) => (
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

          {(profile.socialLinks ?? []).length > 0 && (
            <SpCard>
              <SpSectionHeader
                title="Social & Web links"
                action={isOwner ? <EditAction href={SECTION_EDIT_HREF.skills()} label="social links" /> : undefined}
              />
              <div className="mt-4 space-y-2">
                {(profile.socialLinks ?? []).map((link: any) => (
                  <a
                    key={link.id || link.url}
                    href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] p-2.5 text-sm hover:bg-[#F9FAFB] transition-colors"
                  >
                    <span className="font-medium text-[#171717]">{link.platform || "Link"}</span>
                    <span className="truncate text-xs text-[#3C61DD]">{link.url}</span>
                  </a>
                ))}
              </div>
            </SpCard>
          )}

          {isServiceProvider && (
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
                            {CREDENTIAL_STATUS_LABELS[credential.status as keyof typeof CREDENTIAL_STATUS_LABELS] ?? credential.status}
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
          )}

          {isServiceProvider && (
            <SpCard>
              <SpSectionHeader title="Ratings" />
              <div className="mt-4">
                {ratingSummary && ratingSummary.totalReviews > 0 ? (
                  <div>
                    <p className="flex items-center gap-2 font-heading text-2xl font-semibold text-[#171717]">
                      <Star className="size-5 text-[#157A55] fill-[#157A55]" aria-hidden="true" />
                      {ratingSummary.averageRating.toFixed(1)}
                      <span className="text-sm font-normal text-[#6B7280]">
                        ({ratingSummary.totalReviews} review{ratingSummary.totalReviews === 1 ? "" : "s"})
                      </span>
                    </p>
                  </div>
                ) : hasEnoughTrustData ? (
                  <p className="flex items-center gap-2 font-heading text-2xl font-semibold text-[#171717]">
                    <Star className="size-5 text-[#157A55]" aria-hidden="true" />
                    {(trustScore / 20).toFixed(1)}
                  </p>
                ) : (
                  <p className="text-sm text-[#6B7280]">No reviews yet</p>
                )}
              </div>
            </SpCard>
          )}
        </div>
      </div>
    </>
  );
}
