'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import { getRoleDashboardRoute } from '@/lib/roles';
import { CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompletePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  // If already Phase 1, redirect to dashboard (prevent race conditions)
  useEffect(() => {
    if (user && (user.onboardingPhase ?? 0) >= 1) {
      const dashboardRoute = getRoleDashboardRoute(user);
      router.replace(dashboardRoute || "/dashboard/creator");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center space-y-8">
          {/* Success Icon */}
          <div>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('onboarding.complete.title', 'Verification Complete')}
            </h2>
            <p className="text-muted-foreground">
              {t('onboarding.complete.subtitle', 'Your identity has been verified successfully. You now have full access to Mondial.eco.')}
            </p>
          </div>

          {/* Security Info */}
          <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div className="text-left text-sm">
                <p className="font-semibold text-foreground">
                  {t('onboarding.complete.encryptionTitle', 'Enterprise-grade encryption')}
                </p>
                <p className="text-muted-foreground">
                  {t('onboarding.complete.encryptionDesc', 'protecting your personal data and identity documents.')}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button asChild size="lg" className="w-full">
            <Link href={user ? getRoleDashboardRoute(user) : '/'}>
              {t('onboarding.complete.goToDashboard', 'Go to Dashboard')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
