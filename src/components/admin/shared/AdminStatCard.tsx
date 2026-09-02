import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type StatVariant =
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "gray"
  | "cyan"
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: StatVariant;
  subtitle?: string | ReactNode;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  variant = "blue",
  subtitle,
  loading = false,
  className = "",
  onClick,
}: AdminStatCardProps) {
  let iconColor = "bg-primary/10 text-primary border-primary/20";
  switch (variant) {
    case "green":
    case "success":
      iconColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      break;
    case "amber":
    case "warning":
      iconColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      break;
    case "red":
    case "danger":
      iconColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      break;
    case "purple":
      iconColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      break;
    case "cyan":
    case "info":
      iconColor = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      break;
    case "gray":
    case "default":
      iconColor = "bg-muted text-muted-foreground border-border/60";
      break;
    case "blue":
    case "primary":
    default:
      iconColor = "bg-primary/10 text-primary border-primary/20";
      break;
  }

  return (
    <Card
      onClick={onClick}
      className={`border-border/60 shadow-sm bg-card hover:border-border transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } ${className}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </CardTitle>
        {Icon && (
          <div className={`p-2 rounded-lg border ${iconColor} flex-shrink-0`}>
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <Skeleton className="h-8 w-24 rounded-md my-1" />
        ) : (
          <div className="text-2xl font-bold tracking-tight text-foreground font-syne">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
        )}
        {subtitle && (
          <div className="text-xs text-muted-foreground truncate pt-0.5">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
