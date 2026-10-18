"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useAuth } from "@/app/_providers/AuthProvider";
import { ONBOARDING_ITEMS, OnboardingItem } from "@/lib/onboarding-routes";
import { getRoleDashboardRoute } from "@/lib/roles";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useTranslation } from "@/hooks/useTranslation";

export default function OnboardingHubPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { status, isLoading, isComplete, nextRequired, refresh } = useOnboarding();
  const { user, refreshAuthMe } = useAuth();
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // If already Phase 1, refresh auth context and redirect to dashboard immediately
    if (status && status.phase != null && status.phase >= 1) {
      void refreshAuthMe().then((freshUser) => {
        const targetUser = freshUser || user;
        const role = targetUser?.role || status.role || "creator";
        const dashboardRoute = getRoleDashboardRoute(targetUser || role);
        router.replace(dashboardRoute || "/dashboard/creator");
      });
      return;
    }

    // If all items verified, show completion page
    if (isComplete) {
      router.replace("/onboarding/complete");
    }
  }, [isLoading, isComplete, status, router, refreshAuthMe, user]);

  // Mandatory core steps are derived dynamically from backend status
  const core = ONBOARDING_ITEMS.filter((i) => i.group === "core");
  const mandatoryItems = core.filter((i) => status ? status.items[i.key]?.required : true);
  const allMandatoryVerified = mandatoryItems.every((i) => status?.items[i.key]?.verified);

  async function handleComplete() {
    setCompleteError(null);
    setCompleting(true);
    try {
      await api.post("/onboarding/complete");
      // Refresh both onboarding status AND auth context with Phase=1
      const [, freshUser] = await Promise.all([refresh(), refreshAuthMe()]);
      const targetUser = freshUser || user;
      const role = targetUser?.role || status?.role || "creator";
      const destination = getRoleDashboardRoute(targetUser || role);
      router.replace(destination || "/dashboard/creator");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCompleteError(msg ?? t('onboarding.hub.loadError', "Failed to complete verification. Please try again."));
    } finally {
      setCompleting(false);
    }
  }

  if (isLoading || !status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>{t('onboarding.hub.loading', 'Loading your verification…')}</span>
        </div>
      </div>
    );
  }

  const supplementary = ONBOARDING_ITEMS.filter((i) => i.group === "supplementary");
  const optionalItems = supplementary;

  const requiredCoreDone = mandatoryItems.filter((i) => status.items[i.key]?.verified).length;
  const requiredCoreTotal = mandatoryItems.length;

  const extraRequired = supplementary.filter((i) => status.items[i.key]?.required);

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {t('onboarding.hub.title', 'Profile Verification')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('onboarding.hub.subtitle', 'Your data is encrypted and handled by our certified security partner.')}
        </p>
      </header>

      {/* Mandatory Steps */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {t('onboarding.hub.mandatorySteps', 'Mandatory Steps')}
            </h2>
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {t('onboarding.hub.requiredBadge', 'Required')}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {t('onboarding.hub.completedOf', '{{completed}} of {{total}} Completed', {
              completed: requiredCoreDone,
              total: requiredCoreTotal + extraRequired.length,
            })}
          </span>
        </div>

        <ul className="space-y-3">
          {mandatoryItems.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              verified={status.items[item.key]?.verified}
              status={status.items[item.key]?.status}
              required={true}
            />
          ))}
        </ul>
      </section>

      {/* Additional Documents */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-foreground">
            {t('onboarding.hub.additionalDocumentsPlural', 'Additional Steps & Documents')}
          </h2>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {extraRequired.length > 0
              ? t('onboarding.hub.requiredForRole', 'Required for your role')
              : t('onboarding.hub.optionalBadge', 'Optional')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {optionalItems.map((item) => (
            <ItemCard
              key={item.key}
              item={item}
              verified={status.items[item.key]?.verified}
              required={status.items[item.key]?.required}
            />
          ))}
        </div>
      </section>

      {/* Error Message */}
      {completeError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 flex gap-3 text-sm text-destructive mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{completeError}</span>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex items-start gap-4 flex-1">
          <span className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('onboarding.hub.regulatoryNotice', 'Verification is mandatory for compliance with global AML/KYC regulations. Mondial.eco uses enterprise-grade encryption. Your private information is never shared with third parties.')}
          </p>
        </div>
        {allMandatoryVerified ? (
          <Button
            onClick={handleComplete}
            disabled={completing}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            {completing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('onboarding.hub.completing', 'Completing...')}
              </>
            ) : (
              t('onboarding.hub.completeVerification', 'Complete Verification')
            )}
          </Button>
        ) : (
          <Button asChild className="w-full sm:w-auto whitespace-nowrap" disabled={!nextRequired}>
            <Link href={nextRequired?.href ?? "/onboarding"}>
              {nextRequired
                ? t('onboarding.hub.startVerification', 'Start verification')
                : t('onboarding.hub.allStepsDone', 'All required steps done')}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  verified,
  status,
  required,
}: {
  item: OnboardingItem;
  verified?: boolean;
  status?: string;
  required?: boolean;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const isPendingReview = status === 'submitted' || status === 'processing' || status === 'manual_review';
  const isActionRequired = status === 'rejected' || status === 'retry_required';

  const title = t(`onboarding.hub.items.${item.key}.label`, item.title);
  const description = t(`onboarding.hub.items.${item.key}.description`, item.description);

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-4 rounded-2xl border bg-card px-4 py-4 transition",
          verified
            ? "border-green-600/40 bg-green-600/5"
            : isActionRequired
            ? "border-destructive/40 bg-destructive/5 hover:border-destructive/60"
            : isPendingReview
            ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
            : "border-border hover:border-primary/40",
        )}
      >
        <span
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
            verified
              ? "bg-green-600/15 text-green-700 dark:text-green-300"
              : isActionRequired
              ? "bg-destructive/15 text-destructive"
              : isPendingReview
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-primary/10 text-primary",
          )}
        >
          {verified ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-foreground">{title}</span>
          <span className="block text-xs text-muted-foreground">{description}</span>
        </span>
        {verified ? (
          <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
            {t('onboarding.hub.verified', 'Verified')}
          </span>
        ) : isActionRequired ? (
          <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
            {t('onboarding.hub.actionRequired', 'Action Required')}
          </span>
        ) : isPendingReview ? (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            {t('onboarding.hub.underReview', 'Under Review')}
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
  const { t } = useTranslation();
  const Icon = item.icon;
  const title = t(`onboarding.hub.items.${item.key}.label`, item.title);
  const description = t(`onboarding.hub.items.${item.key}.description`, item.description);

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
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {required && !verified && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              {t('onboarding.hub.requiredBadge', 'Required')}
            </span>
          )}
        </span>
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      </span>
    </Link>
  );
}
