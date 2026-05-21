"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { ONBOARDING_ITEMS, OnboardingItem } from "@/lib/onboarding-routes";
import { cn } from "@/lib/utils";

export default function OnboardingHubPage() {
  const router = useRouter();
  const { status, isLoading, isComplete, nextRequired } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;
    if (isComplete) router.replace("/onboarding/complete");
  }, [isLoading, isComplete, router]);

  if (isLoading || !status) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading your verification…
      </div>
    );
  }

  const core = ONBOARDING_ITEMS.filter((i) => i.group === "core");
  const supplementary = ONBOARDING_ITEMS.filter((i) => i.group === "supplementary");

  // Show supplementary items the role requires PLUS any user-uploaded optional
  // ones (so a Creator who chose to upload Residence still sees that card).
  // The hub always shows all four supplementary cards so the user can opt in
  // even when they're not required.
  const requiredCoreDone = core.filter((i) => status.items[i.key]?.verified).length;
  const requiredCoreTotal = core.filter((i) => status.items[i.key]?.required).length;

  // Additional items the user's role requires (Investor: income+tax; SP: license)
  const extraRequired = supplementary.filter((i) => status.items[i.key]?.required);

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Profile Verification
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your data is encrypted and handled by our certified security partner.
        </p>
      </header>

      {/* Mandatory Steps */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Mandatory Steps</h2>
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              Required
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {requiredCoreDone} of {requiredCoreTotal + extraRequired.length} Completed
          </span>
        </div>

        <ul className="space-y-3">
          {core.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              verified={status.items[item.key]?.verified}
              required={status.items[item.key]?.required}
            />
          ))}
        </ul>
      </section>

      {/* Additional Documents */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-foreground">Additional Document</h2>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {extraRequired.length > 0 ? "Required for your role" : "Optional"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {supplementary.map((item) => (
            <ItemCard
              key={item.key}
              item={item}
              verified={status.items[item.key]?.verified}
              required={status.items[item.key]?.required}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex items-start gap-4 flex-1">
          <span className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Verification is mandatory for compliance with global AML/KYC regulations. Mondial.eco uses enterprise-grade encryption. Your private information is never shared with third parties.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto whitespace-nowrap" disabled={!nextRequired}>
          <Link href={nextRequired?.href ?? "/onboarding"}>
            {nextRequired ? "Start verification" : "All required steps done"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  verified,
  required,
}: {
  item: OnboardingItem;
  verified?: boolean;
  required?: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-4 rounded-2xl border bg-card px-4 py-4 transition",
          verified ? "border-green-600/40 bg-green-600/5" : "border-border hover:border-primary/40",
        )}
      >
        <span
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
            verified ? "bg-green-600/15 text-green-700 dark:text-green-300" : "bg-primary/10 text-primary",
          )}
        >
          {verified ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-foreground">{item.title}</span>
          <span className="block text-xs text-muted-foreground">{item.description}</span>
        </span>
        {verified ? (
          <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
            Verified
          </span>
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </Link>
    </li>
  );
}

function ItemCard({
  item,
  verified,
  required,
}: {
  item: OnboardingItem;
  verified?: boolean;
  required?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-card px-4 py-4 transition",
        verified ? "border-green-600/40 bg-green-600/5" : "border-border hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          verified ? "bg-green-600/15 text-green-700 dark:text-green-300" : "bg-primary/10 text-primary",
        )}
      >
        {verified ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{item.title}</span>
          {required && !verified && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Required</span>
          )}
        </span>
        <span className="block text-xs text-muted-foreground mt-0.5">{item.description}</span>
      </span>
    </Link>
  );
}
