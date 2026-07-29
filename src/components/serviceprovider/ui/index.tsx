"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
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

export function SpSectionHeader({
  title,
  description,
  action,
  className,
  titleId,
  descriptionId,
  titleTabIndex,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  titleId?: string;
  descriptionId?: string;
  titleTabIndex?: number;
}) {
  return (
    <div className={cn("flex flex-col justify-between gap-3 sm:flex-row sm:items-start", className)}>
      <div className="min-w-0">
        <h2 id={titleId} tabIndex={titleTabIndex} className="font-heading text-lg font-semibold text-[#171717]">{title}</h2>
        {description && <p id={descriptionId} className="mt-1 text-sm leading-6 text-[#6B7280]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
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

export function SpFormField({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-[#374151]">
        {label}{required && <span className="ml-1 text-[#B42318]" aria-hidden="true">*</span>}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id,
            "aria-describedby": [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": !!error || undefined,
          })
        : children}
      {description && <p id={descriptionId} className="text-xs leading-5 text-[#6B7280]">{description}</p>}
      {error && <p id={errorId} className="text-xs font-medium text-[#B42318]">{error}</p>}
    </div>
  );
}

export function SpTagInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  description,
  maxItems = 15,
  required,
  error,
  validateItem,
  maxItemLength,
  itemLengthError,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  description?: string;
  maxItems?: number;
  required?: boolean;
  error?: string | null;
  validateItem?: (item: string) => string | null;
  maxItemLength?: number;
  itemLengthError?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const [draftError, setDraftError] = React.useState<string | null>(null);
  const visibleError = draftError ?? error;

  const addDraft = () => {
    const item = draft.trim().replace(/,$/, "").trim();
    if (!item || value.length >= maxItems || value.some((entry) => entry.toLocaleLowerCase() === item.toLocaleLowerCase())) {
      setDraft("");
      return;
    }
    if (maxItemLength !== undefined && item.length > maxItemLength) {
      setDraftError(itemLengthError ?? `${label} must be ${maxItemLength} characters or fewer.`);
      return;
    }
    const validationError = validateItem?.(item) ?? null;
    if (validationError) {
      setDraftError(validationError);
      return;
    }
    onChange([...value, item]);
    setDraft("");
    setDraftError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-[#374151]">
          {label}{required && <span className="ml-1 text-[#B42318]" aria-hidden="true">*</span>}
        </label>
        <span className="text-xs text-[#6B7280]">{value.length}/{maxItems}</span>
      </div>
      <div className="rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] p-2 focus-within:border-[#3C61DD] focus-within:ring-2 focus-within:ring-[#3C61DD]/10">
        {value.length > 0 && (
          <ul aria-label={`Selected ${label.toLocaleLowerCase()}`} className="mb-2 flex flex-wrap gap-2">
            {value.map((item) => (
              <li key={item} className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] py-1 pl-2.5 pr-1 text-sm font-medium text-[#3C61DD]">
                <span>{item}</span>
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() => onChange(value.filter((entry) => entry !== item))}
                  className="flex size-6 items-center justify-center rounded-full hover:bg-[#DCE4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            id={id}
            value={draft}
            onChange={(event) => { setDraft(event.target.value); setDraftError(null); }}
            aria-invalid={!!visibleError || undefined}
            aria-describedby={[description ? `${id}-description` : null, visibleError ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addDraft();
              }
              if (event.key === "Backspace" && !draft && value.length > 0) onChange(value.slice(0, -1));
            }}
            onBlur={addDraft}
            placeholder={placeholder}
            disabled={value.length >= maxItems}
            className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm text-[#171717] outline-none placeholder:text-[#9CA3AF] disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={addDraft}
            disabled={!draft.trim() || value.length >= maxItems}
            className="rounded-lg border border-[#D1D5DB] bg-white px-3 text-xs font-semibold text-[#374151] hover:bg-[#F4F5F7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
      {description && <p id={`${id}-description`} className="text-xs leading-5 text-[#6B7280]">{description}</p>}
      {visibleError && <p id={`${id}-error`} role="alert" className="text-xs font-medium text-[#B42318]">{visibleError}</p>}
    </div>
  );
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
