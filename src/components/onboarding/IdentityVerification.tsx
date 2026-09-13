'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  ChevronRight,
  RefreshCw,
  Camera,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

export type DocumentType = 'national_id' | 'passport' | 'residence_permit';

export interface IdentityStatusResponse {
  status?: string;
  documentType?: string;
  isCurrent?: boolean;
  reviewReason?: string | null;
  canRetry?: boolean;
}

export const DOCUMENT_TYPES = [
  {
    id: 'national_id' as DocumentType,
    label: 'National ID (CNI)',
    sublabel: "Carte Nationale d'Identité",
    icon: '🆔',
    description: 'French National Identity Card (Front & Back live capture)',
  },
  {
    id: 'passport' as DocumentType,
    label: 'Passport',
    sublabel: 'Passeport',
    icon: '🛂',
    description: 'International travel document photo page (Live capture)',
  },
  {
    id: 'residence_permit' as DocumentType,
    label: 'Residence Permit',
    sublabel: 'Titre de séjour',
    icon: '📋',
    description: 'Official French residence permit (Front & Back live capture)',
  },
];

declare global {
  interface Window {
    snsWebSdk?: {
      init: (
        accessToken: string,
        tokenExpirationHandler: () => Promise<string>
      ) => {
        withConf: (conf: Record<string, unknown>) => any;
        withOptions: (options: Record<string, unknown>) => any;
        on: (event: string, callback: (...args: any[]) => void) => any;
        build: () => {
          launch: (containerId: string) => void;
        };
      };
    };
  }
}

export function loadSumsubScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.snsWebSdk) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sumsub-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Sumsub SDK script')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js';
    script.async = true;
    script.setAttribute('data-sumsub-sdk', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Sumsub SDK script'));
    document.body.appendChild(script);
  });
}

export default function IdentityVerification() {
  const router = useRouter();
  const [initialChecking, setInitialChecking] = useState(true);
  const [status, setStatus] = useState<IdentityStatusResponse | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('national_id');
  const [sessionActive, setSessionActive] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkMounted, setSdkMounted] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const response = await api.get('/identity/status');
      const data: IdentityStatusResponse = response.data?.data || {};
      setStatus(data);

      const normalized = (data.status || '').toLowerCase();
      if (normalized === 'verified' || normalized === 'rejected') {
        stopPolling();
        if (normalized === 'verified') {
          setSessionActive(false);
        }
      }
      return data;
    } catch {
      // Non-fatal network hiccup on polling status
      return null;
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    // Perform an immediate check
    checkStatus();
    // Non-aggressive 5-second polling interval
    pollTimerRef.current = setInterval(async () => {
      const latest = await checkStatus();
      const normalized = (latest?.status || '').toLowerCase();
      if (normalized === 'verified' || normalized === 'rejected') {
        stopPolling();
      }
    }, 5000);
  }, [checkStatus, stopPolling]);

  useEffect(() => {
    let mounted = true;
    checkStatus().finally(() => {
      if (mounted) setInitialChecking(false);
    });

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [checkStatus, stopPolling]);

  const getNewAccessToken = useCallback(async (): Promise<string> => {
    try {
      const refreshRes = await api.post('/identity/session', {
        documentType,
        countryCode: 'FR',
        issuingCountry: 'FR',
        nationality: 'FR',
      });
      const newToken = refreshRes.data?.data?.accessToken;
      if (!newToken) {
        throw new Error('No access token returned from identity session refresh');
      }
      return newToken;
    } catch (err: any) {
      console.error('Failed to refresh Sumsub SDK token:', err);
      setError('Verification token expired. Please restart the verification session.');
      return '';
    }
  }, [documentType]);

  const handleApplicantSubmitted = useCallback(() => {
    // Client-side event is UX-only (never authoritative)
    setIsSubmitted(true);
    startPolling();
  }, [startPolling]);

  const handleApplicantStatusChanged = useCallback(
    (_payload?: any) => {
      // Client-side event is UX-only
      checkStatus();
    },
    [checkStatus]
  );

  const handleSdkError = useCallback((sdkError: any) => {
    console.error('Sumsub WebSDK error:', sdkError);
    const msg =
      typeof sdkError === 'string'
        ? sdkError
        : sdkError?.message || 'A camera or verification session error occurred. Please try again.';
    setError(msg);
  }, []);

  const startVerification = async () => {
    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    setError(null);
    setLoading(true);
    setIsSubmitted(false);

    try {
      const response = await api.post('/identity/session', {
        documentType,
        countryCode: 'FR',
        issuingCountry: 'FR',
        nationality: 'FR',
      });

      const sessionData = response.data?.data;
      const token = sessionData?.accessToken;

      if (!token) {
        throw new Error(response.data?.message || 'Failed to obtain identity session token');
      }

      setAccessToken(token);
      setSessionActive(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to initialize secure verification session. Please try again.'
      );
      setSessionActive(false);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionActive || !accessToken) return;

    let isCancelled = false;

    const launchSdk = async () => {
      try {
        await loadSumsubScript();
        if (isCancelled) return;

        if (window.snsWebSdk) {
          const container = document.getElementById('sumsub-websdk-container');
          if (!container) {
            console.warn('Sumsub WebSDK container not in DOM');
            return;
          }

          const snsWebSdkInstance = window.snsWebSdk
            .init(accessToken, getNewAccessToken)
            .withConf({
              lang: 'en',
              country: 'FRA',
            })
            .withOptions({
              addViewportTag: false,
              adaptIframeHeight: true,
            })
            .on('idCheck.onApplicantSubmitted', handleApplicantSubmitted)
            .on('onApplicantSubmitted', handleApplicantSubmitted)
            .on('idCheck.onApplicantStatusChanged', handleApplicantStatusChanged)
            .on('onApplicantStatusChanged', handleApplicantStatusChanged)
            .on('idCheck.onError', handleSdkError)
            .on('onError', handleSdkError)
            .build();

          snsWebSdkInstance.launch('#sumsub-websdk-container');
          if (!isCancelled) {
            setSdkMounted(true);
          }
        } else {
          // Fallback in non-browser or test mock environments
          if (!isCancelled) {
            setSdkMounted(true);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to launch Sumsub SDK:', err);
          setError(err.message || 'Failed to load verification interface.');
        }
      }
    };

    launchSdk();

    return () => {
      isCancelled = true;
    };
  }, [
    sessionActive,
    accessToken,
    getNewAccessToken,
    handleApplicantSubmitted,
    handleApplicantStatusChanged,
    handleSdkError,
  ]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/identity/retry');
      setSessionActive(false);
      setAccessToken(null);
      setSdkMounted(false);
      setIsSubmitted(false);
      stopPolling();
      await checkStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = () => {
    setSessionActive(false);
    setAccessToken(null);
    setSdkMounted(false);
    setIsSubmitted(false);
    stopPolling();
  };

  const normalizedStatus = (status?.status || '').toLowerCase();
  const isVerified = normalizedStatus === 'verified';
  const isRejected = normalizedStatus === 'rejected';

  if (initialChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking identity verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 sm:px-6 md:px-8 pt-8 pb-8">
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <button
            onClick={() => router.push('/onboarding')}
            className="hover:text-foreground transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Onboarding Hub</span>
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary font-medium">Identity Verification</span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Identity Verification
          </h1>
          <p className="text-base text-muted-foreground">
            Fast, secure document verification powered by Sumsub Live Capture.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-16">
        {error && (
          <div className="mb-6 border border-destructive/30 bg-destructive/10 rounded-lg p-4 flex gap-3 text-sm text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* State A: Already Verified */}
        {isVerified && !sessionActive && (
          <div className="bg-card border-2 border-green-600/30 rounded-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Identity Verified</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
                Your identity document has been verified. You can now return to the onboarding hub
                to complete any remaining steps.
              </p>
            </div>
            <Button
              onClick={() => router.push('/onboarding')}
              className="px-8 font-semibold cursor-pointer"
            >
              Continue to Hub
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* State B: Rejected */}
        {isRejected && !sessionActive && (
          <div className="bg-card border-2 border-destructive/30 rounded-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Verification Not Approved</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
                {status?.reviewReason ||
                  'The document could not be validated. Please ensure your document is valid, unexpired, and clearly visible during live capture.'}
              </p>
            </div>
            <Button
              onClick={handleRetry}
              disabled={loading}
              className="px-8 font-semibold cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        )}

        {/* State C: Document Selection Flow */}
        {!isVerified && !isRejected && !sessionActive && (
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Select France Identity Document
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the government-issued document you will scan with your camera.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {DOCUMENT_TYPES.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setDocumentType(doc.id);
                      setError(null);
                    }}
                    className={cn(
                      'p-5 rounded-xl border-2 transition text-left h-44 flex flex-col justify-between cursor-pointer',
                      documentType === doc.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{doc.icon}</span>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          documentType === doc.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        )}
                      >
                        {documentType === doc.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{doc.label}</h3>
                      <p className="text-xs text-primary/80 font-medium">{doc.sublabel}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {doc.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Policy & Security Notice */}
            <div className="bg-muted/50 border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Camera className="w-4 h-4 text-primary" />
                <span>Live Document Capture Requirements</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5 pl-6 list-disc">
                <li>Have your physical document ready in good lighting.</li>
                <li>Your device camera will capture the document securely in real time.</li>
                <li>Driver's licenses and uploaded image files are not accepted for France KYC.</li>
                <li>Biometric face scanning and selfies are not required.</li>
              </ul>
            </div>

            {/* Start Button */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>256-bit encrypted provider session</span>
              </div>
              <Button
                onClick={startVerification}
                disabled={loading}
                className="px-8 font-semibold cursor-pointer gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting Session...
                  </>
                ) : (
                  <>
                    Start Secure Verification
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* State D: Active Sumsub WebSDK Session */}
        {sessionActive && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelSession}
                className="cursor-pointer gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Document
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkStatus}
                className="cursor-pointer gap-2 text-xs text-muted-foreground"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Check Status
              </Button>
            </div>

            {isSubmitted && (
              <div className="border border-primary/30 bg-primary/10 rounded-xl p-4 flex items-center gap-3 text-sm text-primary">
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    Verification submitted. We're checking your document.
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Our verification system is reviewing your document. This usually takes under a minute.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm min-h-[520px]">
              <div id="sumsub-websdk-container" className="w-full min-h-[500px]" />
              {!sdkMounted && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Initializing secure camera session...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
