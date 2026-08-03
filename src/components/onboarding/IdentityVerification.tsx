'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

type Step = 'type-select' | 'upload';
type DocumentType = 'passport' | 'national_id' | 'drivers_license';

const DOCUMENT_TYPES = [
  { id: 'passport' as DocumentType, label: 'Passport', icon: '🛂' },
  { id: 'national_id' as DocumentType, label: 'National ID', icon: '🆔' },
  { id: 'drivers_license' as DocumentType, label: "Driver's License", icon: '🚗' },
];

const PHOTO_REQUIREMENTS = [
  'Image must be sharp and not blurry',
  'Face or document should be clearly visible',
  'Avoid dark or overexposed photos',
  'Plain or simple background preferred',
];

export default function IdentityVerification() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('type-select');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentTypeSelect = (type: DocumentType) => {
    setDocumentType(type);
    setStep('upload');
    setError(null);
  };

  const handlePhotoUpload = (file: File | null, side: 'front' | 'back') => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    if (side === 'front') setFrontPhoto(file);
    else if (side === 'back') setBackPhoto(file);

    setError(null);
  };

  const handleSubmitDocuments = async () => {
    if (!documentType || !frontPhoto) {
      setError('Please upload front photo');
      return;
    }

    // Back photo required for all except passport
    if (documentType !== 'passport' && !backPhoto) {
      setError('Please upload back photo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('frontPhoto', frontPhoto);
      if (backPhoto) {
        formData.append('backPhoto', backPhoto);
      }

      const response = await api.post('/onboarding/identity/upload', formData);

      if (response.data?.success) {
        router.push('/onboarding/face-verification');
      } else {
        setError(response.data?.message || 'Failed to upload documents');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with breadcrumb and title */}
      <div className="max-w-4xl mx-auto px-6 sm:px-6 md:px-8 pt-8 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <span>Account</span>
          <ChevronRight className="w-4 h-4" />
          <span>Security</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary">Security</span>
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
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Step 1: Document Type Selection */}
        {(step === 'type-select' || step === 'upload') && (
          <div className="space-y-8">
            {/* Step 1 Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-card text-foreground flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <h2 className="text-lg font-semibold text-foreground">Select Document type</h2>
            </div>

            {/* Document Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DOCUMENT_TYPES.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (documentType !== doc.id) {
                      // Clear photos if changing document type
                      setFrontPhoto(null);
                      setBackPhoto(null);
                      setError(null);
                    }
                    handleDocumentTypeSelect(doc.id);
                  }}
                  className={cn(
                    'p-4 rounded-lg border-2 transition text-left h-40 flex flex-col justify-between cursor-pointer',
                    documentType === doc.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-2xl">{doc.icon}</div>
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      documentType === doc.id
                        ? 'border-primary bg-primary'
                        : 'border-border'
                    )}>
                      {documentType === doc.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{doc.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.id === 'passport' && 'Full travel document'}
                      {doc.id === 'national_id' && 'Government ID card'}
                      {doc.id === 'drivers_license' && 'Standard state ID'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {step === 'upload' && (
          <div className="space-y-8">
            {/* Step 2 Header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-card text-foreground flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <h2 className="text-lg font-semibold text-foreground">Upload Document Photos</h2>
            </div>

            {/* Photo Requirements Box */}
            <div className="bg-card border-2 border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5 text-primary" />
                Photo Requirements:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {PHOTO_REQUIREMENTS.map((req, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upload Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front Photo Upload */}
              <div>
                <div className="mb-4">
                  <h3 className="font-medium text-foreground text-base">
                    {documentType === 'passport' ? 'Font Size' : 'Font Size'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select and upload the files oof your choice
                  </p>
                </div>
                <div
                  className="border-2 border-dashed border-border rounded-lg bg-card p-6 text-center cursor-pointer hover:border-primary/50 transition"
                  onClick={() => document.getElementById('front-input')?.click()}
                >
                  {frontPhoto ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success-text" />
                      <span className="text-sm font-medium text-foreground">{frontPhoto.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-6 h-6 mx-auto text-primary" />
                      <p className="text-sm font-medium text-foreground">Click to upload font side</p>
                      <p className="text-xs text-muted-foreground">or drag and drop</p>
                    </div>
                  )}
                  <input
                    id="front-input"
                    type="file"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null, 'front')}
                  />
                </div>
              </div>

              {/* Back Photo Upload */}
              {documentType !== 'passport' && (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium text-foreground text-base">Back side</h3>
                    <p className="text-sm text-muted-foreground">
                      Select and upload the files oof your choice
                    </p>
                  </div>
                  <div
                    className="border-2 border-dashed border-border rounded-lg bg-card p-6 text-center cursor-pointer hover:border-primary/50 transition"
                    onClick={() => document.getElementById('back-input')?.click()}
                  >
                    {backPhoto ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success-text" />
                        <span className="text-sm font-medium text-foreground">{backPhoto.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-6 h-6 mx-auto text-primary" />
                        <p className="text-sm font-medium text-foreground">Click to upload font side</p>
                        <p className="text-xs text-muted-foreground">or drag and drop</p>
                      </div>
                    )}
                    <input
                      id="back-input"
                      type="file"
                      accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null, 'back')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer with security info and button */}
            <div className="border-t border-border pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your data is end-to-end encrypted and secure</span>
              </div>
              <Button
                onClick={handleSubmitDocuments}
                disabled={loading || !frontPhoto || (documentType !== 'passport' && !backPhoto)}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
