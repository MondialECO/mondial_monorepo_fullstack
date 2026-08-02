import Link from "next/link";
import { Globe, Linkedin, Twitter, Github, Mail, Phone, Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestorProfile } from "@/types/investor/profile";

const SOCIAL_ICON: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  github: Github,
  website: Globe,
};

function withScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function prettyLabel(key: string): string {
  if (key === "x") return "X";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export default function ProfileAboutCard({ profile }: { profile: InvestorProfile }) {
  const social = Object.entries(profile.socialLinks ?? {}).filter(([, v]) => !!v?.trim());
  const hasContact =
    !!profile.website?.trim() ||
    !!profile.email?.trim() ||
    !!profile.primaryPhone?.trim() ||
    social.length > 0;

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.bio?.trim() ? (
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No bio added yet.</p>
        )}

        {hasContact ? (
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
            {profile.website?.trim() ? (
              <Link
                href={withScheme(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                Website
              </Link>
            ) : null}
            {profile.email?.trim() ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {profile.email}
              </span>
            ) : null}
            {profile.primaryPhone?.trim() ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {profile.primaryPhone}
              </span>
            ) : null}
            {social.map(([key, url]) => {
              const Icon = SOCIAL_ICON[key.toLowerCase()] ?? Link2;
              return (
                <Link
                  key={key}
                  href={withScheme(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Icon className="h-4 w-4" />
                  {prettyLabel(key)}
                </Link>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
