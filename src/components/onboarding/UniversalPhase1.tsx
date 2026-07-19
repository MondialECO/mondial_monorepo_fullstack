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

interface OnboardingItem {
  key: string;
  verified: boolean;
  required: boolean;
}

interface OnboardingStatus {
  phase: number;
  role: string;
  phone: string;
  email: string;
  items: {
    identity: OnboardingItem;
    face: OnboardingItem;
    phone: OnboardingItem;
    email: OnboardingItem;
    residence?: OnboardingItem;
    income?: OnboardingItem;
    tax?: OnboardingItem;
    license?: OnboardingItem;
  };
}

type CoreItemKey = 'identity' | 'face' | 'phone' | 'email';
const CORE_ITEM_KEYS: CoreItemKey[] = ['identity', 'face', 'phone', 'email'];

const MANDATORY_ITEMS = {
  identity: { label: 'Identity Document', description: 'Upload Passport or Government ID', icon: FileText },
  face: { label: 'Facial verification', description: 'Quick face scan for bio-matching', icon: Shield },
  phone: { label: 'Phone Verification', description: 'Verify your mobile number via SMS', icon: Phone },
  email: { label: 'Email Verification', description: 'Confirm your secure primary email', icon: Mail },
};

const OPTIONAL_ITEMS = [
  { id: 'residence', label: 'Proof of Residence', description: 'Utility bill or bank statement', icon: Home },
  { id: 'income', label: 'Proof of Income', description: 'Pay slips or tax returns', icon: DollarSign },
  { id: 'tax', label: 'Tax Documents', description: 'Utility bill or bank statement', icon: FileText },
  { id: 'license', label: "Driver's license", description: 'Supplementary ID Document', icon: Lock },
];

export default function UniversalPhase1() {
  const router = useRouter();
  const { user, refreshAuthMe } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

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
        setLoadError('Failed to load onboarding status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStatus();
    }
  }, [user]);

  const handleVerifyItem = (itemKey: CoreItemKey) => {
    setActionError(null);
    const item = status?.items[itemKey];
    if (!item || item.verified) return;

    if (itemKey === 'identity' || itemKey === 'face') {
      router.push('/onboarding/identity');
      return;
    }

    // Phone and email OTP flows would be handled in a separate modal/step
    setActionError(`${itemKey} verification coming soon`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading verification status...</p>
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
              <h3 className="font-semibold text-destructive">Error Loading Verification</h3>
            </div>
            <p className="text-destructive/80 text-sm mb-4">{loadError}</p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = CORE_ITEM_KEYS.filter((key) => status?.items[key]?.verified).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Profile Verification</h1>
          <p className="text-base text-muted-foreground">
            Your data is encrypted and handled by our certified security partner.
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
          <div className="mb-6 p-4 bg-success-bg border border-success-border rounded-lg flex gap-3">
            <CheckCircle2 className="text-success flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-success">{successMessage}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Mandatory Steps */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Mandatory Steps</h2>
                <span className="inline-flex items-center justify-center bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                  Required
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{completedCount} of 4 Completed</p>
            </div>

            <div className="space-y-3">
              {CORE_ITEM_KEYS.map((key) => {
                const item = status.items[key];
                const config = MANDATORY_ITEMS[key];
                if (!item) return null;

                const Icon = config.icon;
                const isCompleted = item.verified;

                return (
                  <button
                    key={key}
                    onClick={() => handleVerifyItem(key)}
                    disabled={verifying === key || isCompleted}
                    className={cn(
                      'w-full p-4 rounded-lg border border-border bg-background flex items-center justify-between',
                      'transition-all duration-200 text-left',
                      isCompleted && 'opacity-60 cursor-not-allowed',
                      !isCompleted && 'hover:border-primary hover:bg-accent cursor-pointer active:scale-[0.98]'
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-primary/10 rounded-lg p-3 flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      {verifying === key ? (
                        <Loader2 className="text-muted-foreground animate-spin" size={20} />
                      ) : isCompleted ? (
                        <CheckCircle2 className="text-success" size={20} />
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
              <h2 className="text-lg font-semibold text-foreground">Additional Document</h2>
              <span className="inline-flex items-center justify-center bg-muted text-foreground text-xs font-medium px-3 py-1 rounded-full">
                Optional
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {OPTIONAL_ITEMS.map((item) => {
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
              Verification is mandatory for compliance with global AML/KYC regulations. Mondial.eco
              uses SecureShield AI's enterprise-grade encryption. Your private information is never
              shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
