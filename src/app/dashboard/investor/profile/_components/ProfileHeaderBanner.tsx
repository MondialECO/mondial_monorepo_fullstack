"use client";

import Link from "next/link";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Card } from "@/components/ui/card";
import type { InvestorProfile } from "@/types/investor/profile";

const TYPE_LABEL: Record<string, string> = {
  angel: "Angel",
  seed_fund: "Seed Fund",
  vc: "Venture Capital",
  corporate: "Corporate",
  family_office: "Family Office",
};

export default function ProfileHeaderBanner({ profile }: { profile: InvestorProfile }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border p-0">
      {/* Cover: real image when set, else a theme-token banner (no hex). */}
      <div className="relative h-36 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-muted sm:h-44">
        {profile.coverImageUrl ? (
          <ImageWithFallback
            src={profile.coverImageUrl}
            alt=""
            fallbackType="placeholder"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-10 flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-card bg-card">
              <ImageWithFallback
                src={profile.logoUrl ?? undefined}
                alt={profile.name ?? "Investor"}
                fallbackType="avatar"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/investor/profile/edit">
              <Pencil className="h-4 w-4" />
              Edit profile
            </Link>
          </Button>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold leading-tight text-foreground">
              {profile.name ?? "Investor"}
            </h1>
            {profile.type ? (
              <Badge variant="secondary">{TYPE_LABEL[profile.type] ?? profile.type}</Badge>
            ) : null}
            {profile.isPublic ? (
              <Badge variant="success" className="gap-1">
                <Eye className="h-3 w-3" /> Public
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <EyeOff className="h-3 w-3" /> Private
              </Badge>
            )}
          </div>
          {profile.headline ? (
            <p className="text-sm text-muted-foreground">{profile.headline}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
