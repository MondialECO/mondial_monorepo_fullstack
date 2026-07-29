"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BadgeCheck, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpCard, SpStatusBadge } from "@/components/serviceprovider/ui";
import { PROFILE_VIEW_ROUTE } from "@/lib/service-provider/profile-navigation";
import type { ProfileEditorOutcome, ServiceProviderProfile } from "@/types/service-provider";

const OUTCOME_COPY: Record<
  ProfileEditorOutcome,
  { title: string; body: string; icon: typeof ShieldCheck }
> = {
  ProfileUpdated: {
    title: "Profile Updated",
    body: "Your published profile now shows your latest details.",
    icon: ClipboardCheck,
  },
  ProfileSubmittedPendingReview: {
    title: "Profile Submitted",
    body: "Your profile is published. Your new credentials are queued for review.",
    icon: ClipboardCheck,
  },
  VerificationComplete: {
    title: "Verification Complete",
    body: "Your identity and credentials have been reviewed.",
    icon: BadgeCheck,
  },
};

/**
 * Result screen. Everything shown here comes from the server's submit response —
 * the tier, verification status and pending-review count are never inferred or
 * fabricated on the client.
 */
export function EditorResult({
  outcome,
  profile,
  credentialsPendingReview,
  tierLevel,
}: {
  outcome: ProfileEditorOutcome;
  profile: ServiceProviderProfile;
  credentialsPendingReview: number;
  /** Server-assigned tier (from the trust projection); undefined while unknown. */
  tierLevel?: number;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const copy = OUTCOME_COPY[outcome];
  const Icon = copy.icon;
  const verified = profile.verificationStatus === "Verified";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="text-center">
        <Icon className="mx-auto size-10 text-[#157A55]" aria-hidden="true" />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 font-heading text-2xl font-semibold text-[#171717] outline-none sm:text-3xl"
        >
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[#4B5563]">{copy.body}</p>
      </header>

      {outcome === "ProfileSubmittedPendingReview" && (
        <SpCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">Credentials Pending Review</h2>
              <p className="mt-1 text-sm text-[#4B5563]">
                {credentialsPendingReview === 1
                  ? "1 credential is awaiting review by Mondial.eco."
                  : `${credentialsPendingReview} credentials are awaiting review by Mondial.eco.`}
              </p>
            </div>
            <SpStatusBadge tone="warning">Pending Review</SpStatusBadge>
          </div>
          <p className="mt-3 text-xs text-[#6B7280]">
            Verification is decided by an authorised reviewer. Your current status and tier are
            unchanged until that review completes.
          </p>
        </SpCard>
      )}

      <SpCard>
        <h2 className="text-sm font-semibold text-[#171717]">Current platform status</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Verification</dt>
            <dd className="mt-1">
              <SpStatusBadge tone={verified ? "positive" : "neutral"}>
                {verified ? "Verified" : profile.verificationStatus}
              </SpStatusBadge>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Tier</dt>
            <dd className="mt-1">
              {tierLevel ? (
                <SpStatusBadge tone="neutral">{`Tier ${tierLevel}`}</SpStatusBadge>
              ) : (
                <span className="text-sm text-[#6B7280]">Not available</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6B7280]">Marketplace</dt>
            <dd className="mt-1 text-sm text-[#374151]">
              {verified ? "Eligible for matching" : "Available after verification"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[#6B7280]">Affects match priority, not pricing.</p>
      </SpCard>

      <div className="flex justify-center">
        <Button asChild className="min-h-11">
          <Link href={PROFILE_VIEW_ROUTE}>View Profile</Link>
        </Button>
      </div>
    </div>
  );
}
