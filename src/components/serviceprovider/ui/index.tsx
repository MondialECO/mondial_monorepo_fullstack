import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpPage({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1440px] space-y-6", className)} {...props} />;
}

export function SpPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col justify-between gap-4 sm:flex-row sm:items-start", className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#171717]">{title}</h1>
        {description && <p className="mt-1 text-sm leading-6 text-[#6B7280]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SpCard({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-none sm:p-6", className)} {...props} />;
}

export function SpMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClassName,
  className,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <SpCard className={cn("min-h-44", className)}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">{label}</p>
        {Icon && <span className={cn("flex size-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#3C61DD]", iconClassName)}><Icon className="size-5" aria-hidden="true" /></span>}
      </div>
      <div className="mt-6 text-3xl font-semibold tracking-tight text-[#171717]">{value}</div>
      {detail && <div className="mt-2 text-sm text-[#6B7280]">{detail}</div>}
    </SpCard>
  );
}

export type SpTabItem = {
  label: string;
  href: string;
  active?: boolean;
  badge?: React.ReactNode;
};

export function SpTabBar({ items, label = "Page sections", className }: { items: SpTabItem[]; label?: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("overflow-x-auto border-b border-[#E5E7EB]", className)}>
      <div className="flex min-w-max gap-7">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2",
              item.active ? "border-[#3C61DD] text-[#171717]" : "border-transparent text-[#6B7280] hover:text-[#171717]",
            )}
          >
            {item.label}{item.badge}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function SpFilterBar({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-none sm:flex-row sm:items-center", className)} {...props} />;
}

const statusTones = {
  neutral: "border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]",
  positive: "border-[#BBE8D3] bg-[#E8F7F0] text-[#157A55]",
  warning: "border-[#F0D6AE] bg-[#FBF2E7] text-[#965F11]",
  negative: "border-[#F5C2C2] bg-[#FDECEC] text-[#B42318]",
  info: "border-[#CAD4FA] bg-[#EEF2FF] text-[#3C61DD]",
} as const;

export function SpStatusBadge({ tone = "neutral", className, ...props }: React.ComponentProps<"span"> & { tone?: keyof typeof statusTones }) {
  return <span className={cn("inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold", statusTones[tone], className)} {...props} />;
}

export function SpEmptyState({ icon: Icon, title, description, action, className }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <SpCard className={cn("flex min-h-64 items-center justify-center text-center", className)}>
      <div className="max-w-md">
        {Icon && <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#F4F5F7] text-[#6B7280]"><Icon className="size-5" aria-hidden="true" /></span>}
        <h2 className="mt-4 font-heading text-lg font-semibold text-[#171717]">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </SpCard>
  );
}

const feedbackStyles = {
  success: { icon: CheckCircle2, className: "border-[#BBE8D3] bg-[#E8F7F0] text-[#157A55]" },
  error: { icon: AlertCircle, className: "border-[#F5C2C2] bg-[#FDECEC] text-[#B42318]" },
  info: { icon: Info, className: "border-[#CAD4FA] bg-[#EEF2FF] text-[#3C61DD]" },
} as const;

export function SpMutationFeedback({ status, children, className }: { status: keyof typeof feedbackStyles; children: React.ReactNode; className?: string }) {
  const config = feedbackStyles[status];
  const Icon = config.icon;
  return (
    <div role={status === "error" ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-xl border px-4 py-3 text-sm", config.className, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
