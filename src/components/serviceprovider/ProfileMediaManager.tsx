"use client";

import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SpCard, SpSectionHeader, SpStatusBadge } from "@/components/serviceprovider/ui";
import { useProviderOverview } from "@/hooks/queries/analytics";
import { useCapacity } from "@/hooks/queries/service-catalog";
import {
  useRemoveCoverImage,
  useRemoveProfileImage,
  useUploadCoverImage,
  useUploadProfileImage,
} from "@/hooks/queries/service-provider";
import { resolveProviderMediaUrl } from "@/lib/service-provider/provider-media";
import type { ServiceProviderProfile } from "@/types/service-provider";
import { ProviderImageUploader } from "./ProviderImageUploader";

export function ProfileMediaManager({ profile }: { profile: ServiceProviderProfile }) {
  const { user } = useAuth();
  const providerName = user?.name || "Service Provider";
  const overview = useProviderOverview("EUR");
  const capacity = useCapacity();
  const tierLabel = overview.data?.provider.tierLabel;
  const available = capacity.data?.newOrderAvailability ?? overview.data?.provider.availableNow;
  const profileImageUrl = resolveProviderMediaUrl(profile.profileImage?.url);
  const coverImageUrl = resolveProviderMediaUrl(profile.coverImage?.url);
  const initials = providerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SP";
  const uploadProfile = useUploadProfileImage();
  const removeProfile = useRemoveProfileImage();
  const uploadCover = useUploadCoverImage();
  const removeCover = useRemoveCoverImage();

  return (
    <div className="space-y-6">
    <SpCard className="overflow-hidden p-0">
      <div className="relative aspect-[3/1] min-h-32 max-h-60 bg-[linear-gradient(120deg,#F9FAFB,#EEF2FF_55%,#F4F5F7)]">
        {coverImageUrl && <img src={coverImageUrl} alt="" className="absolute inset-0 size-full object-cover" />}
      </div>
      <div className="relative -mt-10 flex flex-col gap-4 px-4 pb-6 sm:-mt-12 sm:flex-row sm:items-end sm:px-7">
        <Avatar className="size-24 border-4 border-white bg-[#F4F5F7] sm:size-28">
          {profileImageUrl && <AvatarImage src={profileImageUrl} alt={`${providerName} profile image`} />}
          <AvatarFallback className="bg-[#E8ECFF] text-lg font-semibold text-[#3C61DD]">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 sm:pb-1">
          <h2 className="font-heading text-xl font-semibold text-[#171717] sm:text-2xl">{providerName}</h2>
          <p className="mt-1 text-sm text-[#4B5563]">{profile.headline?.trim() || "Add a professional headline"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SpStatusBadge tone={profile.verificationStatus === "Verified" ? "positive" : "neutral"}>{profile.verificationStatus === "UnderReview" ? "Under review" : profile.verificationStatus}</SpStatusBadge>
            {tierLabel && <SpStatusBadge title="Affects match priority, not pricing.">{tierLabel}</SpStatusBadge>}
            {available !== undefined && <SpStatusBadge tone={available ? "positive" : "neutral"}>{available ? "Available now" : "Not accepting new work"}</SpStatusBadge>}
          </div>
        </div>
      </div>
    </SpCard>
    <SpCard>
      <SpSectionHeader title="Profile header media" description="Use a clear portrait and a cover image that supports your professional positioning." />
      <div className="mt-6 grid gap-7 lg:grid-cols-2">
        <ProviderImageUploader
          kind="profile"
          label="Profile image"
          currentUrl={resolveProviderMediaUrl(profile.profileImage?.url)}
          currentAlt={`${providerName} profile image`}
          onUpload={(file, onProgress) => uploadProfile.mutateAsync({ file, onProgress }).then(() => undefined)}
          onRemove={() => removeProfile.mutateAsync(undefined).then(() => undefined)}
        />
        <ProviderImageUploader
          kind="cover"
          label="Cover image"
          currentUrl={resolveProviderMediaUrl(profile.coverImage?.url)}
          onUpload={(file, onProgress) => uploadCover.mutateAsync({ file, onProgress }).then(() => undefined)}
          onRemove={() => removeCover.mutateAsync(undefined).then(() => undefined)}
        />
      </div>
      <div className="mt-6 flex gap-3 rounded-xl border border-[#E8D7B0] bg-[#FFF9ED] p-4 text-sm leading-6 text-[#6F4B12]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>Basic file validation is active. Production security scanning is not yet enabled.</p>
      </div>
    </SpCard>
    </div>
  );
}
