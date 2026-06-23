"use client";

import { Button } from "@/components/ui/button";
import ErrorState from "@/components/shared/ErrorState";
import { useInvestorProfile } from "@/hooks/queries/investor-profile";
import ProfileHeaderBanner from "./_components/ProfileHeaderBanner";
import ProfileStatsCard from "./_components/ProfileStatsCard";
import ProfileAboutCard from "./_components/ProfileAboutCard";
import InvestmentPreferencesCard from "./_components/InvestmentPreferencesCard";
import ProfileCompletionCard from "./_components/ProfileCompletionCard";
import PublicProfileSkeleton from "./_components/PublicProfileSkeleton";

export default function InvestorProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useInvestorProfile();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1080px] pb-8">
        <PublicProfileSkeleton />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto w-full max-w-[1080px] space-y-4 pb-8">
        <ErrorState
          title="Couldn't load your profile"
          message="Check your connection and retry."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-5 pb-8">
      <ProfileHeaderBanner profile={profile} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <ProfileAboutCard profile={profile} />
          <InvestmentPreferencesCard profile={profile} />
        </div>
        <ProfileCompletionCard profile={profile} />
      </div>
    </div>
  );
}
