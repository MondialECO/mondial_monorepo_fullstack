'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import api from '@/lib/axios';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Home,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface OnboardingItem {
  key: string;
  verified: boolean;
  required: boolean;
  status?: string;
  reviewReason?: string;
  documentType?: string;
}

interface OnboardingStatus {
  phase: number;
  role: string;
  phone: string;
  email: string;
  items: {
    identity: OnboardingItem;
    phone: OnboardingItem;
    email: OnboardingItem;
    residence?: OnboardingItem;
    income?: OnboardingItem;
    tax?: OnboardingItem;
    license?: OnboardingItem;
  };
}

type CoreItemKey = 'identity' | 'phone' | 'email';
const ALL_CORE_ITEM_KEYS: CoreItemKey[] = ['identity', 'phone', 'email'];

export default function UniversalPhase1() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const getMandatoryConfig = (key: CoreItemKey) => {
    switch (key) {
      case 'identity':
        return {
          label: t('onboarding.hub.items.identity.label', 'Identity Document'),
          description: t('onboarding.hub.items.identity.description', 'Upload Passport or Government ID'),
          icon: FileText,
        };
      case 'phone':
        return {
          label: t('onboarding.hub.items.phone.label', 'Phone Verification'),
          description: t('onboarding.hub.items.phone.description', 'Verify your mobile number via SMS'),
          icon: Phone,
        };
      case 'email':
        return {
          label: t('onboarding.hub.items.email.label', 'Email Verification'),
          description: t('onboarding.hub.items.email.description', 'Confirm your secure primary email'),
          icon: Mail,
        };
    }
  };

  const optionalItems = [
    {
      id: 'residence',
      label: t('onboarding.hub.items.residence.label', 'Proof of Residence'),
      description: t('onboarding.hub.items.residence.description', 'Utility bill or bank statement'),
      icon: Home,
    },
    {
      id: 'income',
      label: t('onboarding.hub.items.income.label', 'Proof of Income'),
      description: t('onboarding.hub.items.income.description', 'Pay slips or tax returns'),
      icon: DollarSign,
    },
    {
      id: 'tax',
      label: t('onboarding.hub.items.tax.label', 'Tax Documents'),
      description: t('onboarding.hub.items.tax.description', 'Utility bill or bank statement'),
      icon: FileText,
    },
    {
      id: 'license',
      label: t('onboarding.hub.items.license.label', "Driver's license"),
      description: t('onboarding.hub.items.license.description', 'Supplementary ID Document'),
      icon: Lock,
    },
  ];

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await api.get('/onboarding/status');
        const data = response.data?.data ?? response.data;
        setStatus(data);
        setLoadError(null);
      } catch (err) {
        setLoadError(t('onboarding.hub.loadError', 'Failed to load onboarding status'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStatus();
    }
  }, [user, t]);

  const handleVerifyItem = (itemKey: CoreItemKey) => {
    setActionError(null);
    const item = status?.items[itemKey];
    if (!item || item.verified) return;

    if (itemKey === 'identity') {
      router.push('/onboarding/identity');
      return;
    }

    // Phone and email OTP flows would be handled in a separate modal/step
    setActionError(t('onboarding.hub.notConnected', `${itemKey} verification coming soon`, { item: itemKey }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('onboarding.hub.loading', 'Loading verification status...')}</p>
        </div>
      </div>
    );
  }

  if (loadError || !status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h3 className="font-semibold text-destructive">{t('onboarding.hub.errorLoading', 'Error Loading Verification')}</h3>
            </div>
            <p className="text-destructive/80 text-sm mb-4">{loadError}</p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              {t('onboarding.hub.retry', 'Retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active mandatory steps derived dynamically from backend status
  const activeCoreKeys = ALL_CORE_ITEM_KEYS.filter((key) =>
    status ? status.items[key]?.required : true
  );

  const completedCount = activeCoreKeys.filter((key) => status?.items[key]?.verified).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('onboarding.hub.title', 'Profile Verification')}
          </h1>
          <p className="text-base text-muted-foreground">
            {t('onboarding.hub.subtitle', 'Your data is encrypted and handled by our certified security partner.')}
          </p>
        </div>

        {/* Errors */}
        {(loadError || actionError) && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
            <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-destructive">{loadError || actionError}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success-light border border-success-text/20 rounded-lg flex gap-3">
            <CheckCircle2 className="text-success-text flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-success-text">{successMessage}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Mandatory Steps */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {t('onboarding.hub.mandatorySteps', 'Mandatory Steps')}
                </h2>
                <span className="inline-flex items-center justify-center bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                  {t('onboarding.hub.requiredBadge', 'Required')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.hub.completedOf', '{{completed}} of {{total}} Completed', {
                  completed: completedCount,
                  total: activeCoreKeys.length,
                })}
              </p>
            </div>

            <div className="space-y-3">
              {activeCoreKeys.map((key) => {
                const item = status.items[key];
                const config = getMandatoryConfig(key);
                if (!item) return null;

                const Icon = config.icon;
                const isCompleted = item.verified;
                const isPendingReview = item.status === 'submitted' || item.status === 'processing' || item.status === 'manual_review';
                const isActionRequired = item.status === 'rejected' || item.status === 'retry_required';

                return (
                  <button
                    key={key}
                    onClick={() => handleVerifyItem(key)}
                    disabled={verifying === key || isCompleted}
                    className={cn(
                      'w-full p-4 rounded-lg border border-border bg-background flex items-center justify-between',
                      'transition-all duration-200 text-left',
                      isCompleted && 'opacity-60 cursor-not-allowed',
                      isActionRequired && 'border-destructive/40 bg-destructive/5 hover:border-destructive/60',
                      isPendingReview && 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60',
                      !isCompleted && !isActionRequired && !isPendingReview && 'hover:border-primary hover:bg-accent cursor-pointer active:scale-[0.98]'
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "rounded-lg p-3 flex-shrink-0",
                        isCompleted ? "bg-green-600/10" : isActionRequired ? "bg-destructive/10" : isPendingReview ? "bg-amber-500/10" : "bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "w-6 h-6",
                          isCompleted ? "text-green-600 dark:text-green-400" : isActionRequired ? "text-destructive" : isPendingReview ? "text-amber-600 dark:text-amber-400" : "text-primary"
                        )} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4 flex items-center gap-2">
                      {verifying === key ? (
                        <Loader2 className="text-muted-foreground animate-spin" size={20} />
                      ) : isCompleted ? (
                        <CheckCircle2 className="text-success-text" size={20} />
                      ) : isActionRequired ? (
                        <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
                          {t('onboarding.hub.actionRequired', 'Action Required')}
                        </span>
                      ) : isPendingReview ? (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                          {t('onboarding.hub.underReview', 'Under Review')}
                        </span>
                      ) : (
                        <ChevronRight className="text-muted-foreground" size={20} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Documents */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {t('onboarding.hub.additionalDocuments', 'Additional Document')}
              </h2>
              <span className="inline-flex items-center justify-center bg-muted text-foreground text-xs font-medium px-3 py-1 rounded-full">
                {t('onboarding.hub.optionalBadge', 'Optional')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {optionalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-lg p-4 bg-background hover:border-primary/30 transition-colors"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="bg-primary/10 rounded-lg p-2.5 flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted border border-border rounded-lg p-6 flex gap-4">
            <div className="bg-primary rounded-full p-3 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {t('onboarding.hub.regulatoryNotice', "Verification is mandatory for compliance with global AML/KYC regulations. Mondial.eco uses SecureShield AI's enterprise-grade encryption. Your private information is never shared with third parties.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
