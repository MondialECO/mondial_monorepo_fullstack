'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FaceVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [sumsub, setSumsub] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Load Sumsub SDK on mount
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch Sumsub access token from backend
        const response = await api.get('/onboarding/sumsub/token');
        const { accessToken } = response.data?.data || response.data;

        if (!accessToken) {
          setError('Failed to initialize face verification. Please try again.');
          return;
        }

        // Load Sumsub SDK script
        if (!(window as any).SumsubWebSdk) {
          const script = document.createElement('script');
          script.src = 'https://sdk.sumsub.com/idensic.min.js';
          script.async = true;
          script.onload = () => {
            initSumsubWidget(accessToken);
          };
          script.onerror = () => {
            setError('Failed to load face verification SDK');
          };
          document.head.appendChild(script);
        } else {
          initSumsubWidget(accessToken);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initialize face verification');
      }
    };
    load();
  }, []);

  const initSumsubWidget = (accessToken: string) => {
    try {
      const container = document.getElementById('sumsub-container');
      if (!container) return;

      container.innerHTML = '';

      const sdk = (window as any).SumsubWebSdk.init({
        accessToken,
        applicantEmail: (window as any).__userEmail || 'unknown@example.com',
        containerId: 'sumsub-container',
        onMessage: (msg: any) => {
          console.log('Sumsub message:', msg);
          // Update progress based on message
          if (msg.type === 'LIVENESS') {
            setScanProgress(Math.min(scanProgress + 10, 95));
          }
        },
        onError: (error: any) => {
          console.error('Sumsub error:', error);
          setError('Face verification failed. Please try again.');
        },
      });

      // Listen for completion
      sdk.on('idensic:completed', () => {
        setScanProgress(100);
        setFaceVerified(true);
      });

      sdk.on('idensic:failed', () => {
        setError('Face verification failed. Please try again.');
      });

      setSumsub(sdk);
    } catch {
      setError('Failed to initialize face verification widget');
    }
  };

  const handleSubmitFace = async () => {
    if (!faceVerified) {
      setError('Please complete the face verification process');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/onboarding/face/verify-sumsub');

      if (response.data?.success) {
        router.push('/onboarding/phone');
      } else {
        setError(response.data?.message || 'Failed to complete face verification');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete face verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipFace = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post('/onboarding/face/skip');
      router.push('/onboarding/phone');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to skip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 sm:px-6 md:px-8 pt-8 pb-12">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/onboarding/identity" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Title and subtitle */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Verify your identity</h1>
          <p className="text-base text-muted-foreground">
            Your information is encrypted and secured by VeriSure, our trusted security partner.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-8">
        {error && (
          <div className="mb-6 border-2 border-destructive/30 bg-destructive/10 rounded-lg p-4 flex gap-3 text-sm text-destructive">
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Face Verification Container */}
        <div className="space-y-8">
          <div className="bg-muted rounded-lg overflow-hidden">
            {/* Face Frame Area - Centered with circular frame and scanning progress */}
            <div className="relative w-full bg-muted min-h-[700px] flex flex-col items-center justify-center p-8">
              {/* Circular Face Frame with animated rings */}
              <div className="relative w-80 h-80 mb-8">
                {/* Outer animated ring 1 */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />

                {/* Outer animated ring 2 */}
                <div className="absolute inset-4 rounded-full border border-primary/20 animate-pulse" style={{animationDelay: '0.2s'}} />

                {/* Main circular frame */}
                <div className="absolute inset-8 rounded-full border-4 border-primary bg-muted/50 flex items-center justify-center overflow-hidden">
                  {/* Sumsub widget container */}
                  <div id="sumsub-container" className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                      <p className="text-sm font-medium text-foreground">Initializing verification</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scanning Progress Box */}
              <div className="w-full max-w-md bg-card border-2 border-border rounded-lg p-6 space-y-4 mb-6">
                {/* Scanning progress label and percentage */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{faceVerified ? 'Complete' : 'Scanning...'}</span>
                  <span className="text-foreground font-semibold">{Math.max(scanProgress, faceVerified ? 100 : 65)}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{width: `${Math.max(scanProgress, faceVerified ? 100 : 65)}%`}}
                  />
                </div>

                {/* Status message with checkmark */}
                <div className="flex items-center justify-center gap-2">
                  {faceVerified ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <p className="text-sm text-foreground font-medium">Verification complete!</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <p className="text-sm text-foreground font-medium">Looking good, hold still...</p>
                    </>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <p className="text-center text-foreground max-w-md text-base mb-8">
                Position your face within the frame and look directly at the camera.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    className="gap-2 flex-1"
                    disabled={faceVerified || loading}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/>
                    </svg>
                    {faceVerified ? 'Capture Complete' : 'Capture'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      console.log('Need help clicked');
                    }}
                    disabled={loading}
                  >
                    Need Help?
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSkipFace}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Skipping...
                    </>
                  ) : (
                    "Skip Face Verification"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer with navigation buttons */}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Your data is end-to-end encrypted and secure</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitFace}
                disabled={loading || !faceVerified}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
