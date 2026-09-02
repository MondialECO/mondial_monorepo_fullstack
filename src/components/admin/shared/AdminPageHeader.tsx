import React, { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: string | ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  badge,
  icon: Icon,
  backHref,
  backLabel = "Back",
  actions,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/40 pb-6 mb-6">
      {backHref && (
        <div className="flex items-center">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/15 flex-shrink-0 mt-0.5 sm:mt-0">
              <Icon className="size-5 sm:size-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-syne truncate">
                {title}
              </h1>
              {typeof badge === "string" ? (
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
                >
                  {badge}
                </Badge>
              ) : (
                badge
              )}
            </div>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
