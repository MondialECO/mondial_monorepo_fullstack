'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/_providers/AuthProvider';
import api from '@/lib/axios';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Phone,
  Mail,
  FileText,
  DollarSign,
  BadgeCheck,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

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

const ITEM_ICONS = {
  identity: FileText,
  face: Shield,
  phone: Phone,
  email: Mail,
  residence: Home,
  income: DollarSign,
  tax: FileText,
  license: BadgeCheck,
};

const ITEM_LABELS = {
  identity: 'Legal Identity',
  face: 'Face Verification',
  phone: 'Phone Number',
  email: 'Email Address',
  residence: 'Residence Proof',
  income: 'Income Statement',
  tax: 'Tax Return',
  license: 'Professional License',
};

export default function UniversalPhase1() {
  const { user, refreshAuthMe } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCodes, setOtpCodes] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState<Record<string, boolean>>({});

  const isPhaseComplete = (status?.phase ?? 0) >= 1;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await api.get('/onboarding/status');
        const data = response.data?.data ?? response.data;
        setStatus(data);
        setPhoneNumber(data?.phone ?? '');
      } catch (err) {
        setError('Failed to load onboarding status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStatus();
    }
  }, [user]);

  const handleVerifyItem = async (itemKey: string) => {
    try {
      setVerifying(itemKey);
      setError(null);
      const item = status?.items[itemKey as keyof typeof status.items];
      if (!item || item.verified) return;

      let endpoint = '';
      let payload: Record<string, unknown> = {};

      switch (itemKey) {
        case 'identity':
        case 'face':
          endpoint = '/onboarding/identity/dev-confirm';
          break;
        case 'phone':
          if (otpSent.phone) {
            const code = otpCodes.phone?.trim() ?? '';
            if (code.length !== 6) {
              setError('Enter the 6-digit phone verification code.');
              return;
            }
            endpoint = '/onboarding/verify-otp';
            payload = { code };
          } else if (phoneNumber.trim()) {
            endpoint = '/onboarding/send-otp';
            payload = { phone: phoneNumber.trim() };
          } else {
            endpoint = '/onboarding/phone/dev-confirm';
          }
          break;
        case 'email':
          if (otpSent.email) {
            const code = otpCodes.email?.trim() ?? '';
            if (code.length !== 6) {
              setError('Enter the 6-digit email verification code.');
              return;
            }
            endpoint = '/onboarding/verify-email-otp';
            payload = { code };
          } else {
            endpoint = '/onboarding/send-email-otp';
          }
          break;
        default:
          setError(`No verification action configured for ${itemKey}`);
          return;
      }

      // Do NOT mark as verified locally before backend response
      await api.post(endpoint, payload);

      if (endpoint.endsWith('send-otp') || endpoint.endsWith('send-email-otp')) {
        setOtpSent((current) => ({ ...current, [itemKey]: true }));
        return;
      }

      // Refetch both status endpoints to confirm backend state
      const statusResponse = await api.get('/onboarding/status');
      const statusData = statusResponse.data?.data ?? statusResponse.data;
      setStatus(statusData);
      setPhoneNumber(statusData?.phone ?? phoneNumber);
      setOtpCodes((current) => ({ ...current, [itemKey]: '' }));
      setOtpSent((current) => ({ ...current, [itemKey]: false }));

      // Refresh AuthProvider with updated user state from backend
      await refreshAuthMe();
    } catch (err) {
      console.error(`Failed to verify ${itemKey}:`, err);
      setError(`Verification failed for ${itemKey}. Please try again.`);
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="max-w-md">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-red-900">Error Loading Verification</h3>
            </div>
            <p className="text-red-800 text-sm mb-4">{error}</p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine next action route based on role
  const nextRouteMap: Record<string, string> = {
    Entrepreneur: '/dashboard/entrepreneur/phase-2',
    Creator: '/dashboard/creator',
    Investor: '/dashboard/investor',
    ServiceProvider: '/dashboard/serviceprovider',
  };

  const nextRoute = nextRouteMap[status.role] || '/dashboard';

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Identity & Onboarding Verification
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              {isPhaseComplete ? '✓ Verification Complete' : 'Complete all required items to proceed'}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-8">
        {/* Status Banner */}
        {isPhaseComplete ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-green-900 mb-2">All Verifications Complete</h2>
                <p className="text-green-800 mb-4">
                  Your identity has been fully verified. You now have access to all platform features.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Verification Required</h2>
                <p className="text-blue-800">
                  Please complete all required verification items to unlock full platform access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(status.items).map(([key, item]) => {
            if (!item) return null;

            const Icon = ITEM_ICONS[key as keyof typeof ITEM_ICONS] || FileText;
            const label = ITEM_LABELS[key as keyof typeof ITEM_LABELS] || key;

            return (
              <div
                key={key}
                className={`bg-white border-2 rounded-lg p-4 flex items-start gap-4 transition ${
                  item.verified
                    ? 'border-green-200 bg-green-50'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {item.verified ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                    <p className="font-semibold text-neutral-900">{label}</p>
                    {item.required && (
                      <span className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600">
                    {item.verified
                      ? 'Verified'
                      : otpSent[key]
                        ? 'Code sent'
                        : 'Not verified'}
                  </p>

                  {key === 'phone' && !item.verified && !isPhaseComplete && (
                    <Input
                      value={otpSent.phone ? otpCodes.phone ?? '' : phoneNumber}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (otpSent.phone) {
                          setOtpCodes((current) => ({ ...current, phone: value }));
                        } else {
                          setPhoneNumber(value);
                        }
                      }}
                      className="mt-3"
                      placeholder={otpSent.phone ? '6-digit code' : '+15551234567'}
                      inputMode={otpSent.phone ? 'numeric' : 'tel'}
                    />
                  )}

                  {key === 'email' && otpSent.email && !item.verified && !isPhaseComplete && (
                    <Input
                      value={otpCodes.email ?? ''}
                      onChange={(event) =>
                        setOtpCodes((current) => ({ ...current, email: event.target.value }))
                      }
                      className="mt-3"
                      placeholder="6-digit code"
                      inputMode="numeric"
                    />
                  )}
                </div>

                {!item.verified && !isPhaseComplete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVerifyItem(key)}
                    disabled={verifying === key}
                    className="flex-shrink-0"
                  >
                    {verifying === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      otpSent[key] ? 'Submit' : 'Verify'
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <Button variant="outline" asChild className="flex-1 h-12">
            <Link href="/dashboard">Back</Link>
          </Button>
          {isPhaseComplete && (
            <Button asChild className="flex-1 h-12 gap-2">
              <Link href={nextRoute}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
