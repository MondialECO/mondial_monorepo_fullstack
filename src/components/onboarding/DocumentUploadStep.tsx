"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { OnboardingItemKey } from "@/lib/onboarding-routes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface DocumentUploadStepProps {
  /** Key in /status.items, also the path component sent to the backend. */
  docKey: OnboardingItemKey;
  title: string;
  description: string;
  helper: string;
  icon: LucideIcon;
  /** Accepted file extensions hint to the user. */
  acceptHint?: string;
  /** HTML accept attr — backend's SaveFile.cs accepts pdf/doc/docx/ppt/pptx for the "documents" folder. */
  accept?: string;
}

export default function DocumentUploadStep({
  docKey,
  title,
  description,
  helper,
  icon: Icon,
  acceptHint = "PDF, DOC, DOCX, PPT, PPTX. Up to 20MB.",
  accept = ".pdf,.doc,.docx,.ppt,.pptx",
}: DocumentUploadStepProps) {
  const router = useRouter();
  const { refresh, status } = useOnboarding();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyUploaded = status?.items?.[docKey]?.verified ?? false;
  const isRequired = status?.items?.[docKey]?.required ?? false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/onboarding/documents/${docKey}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refresh();
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-card border-b border-border h-16 px-6 flex items-center justify-start">
        <Link
          href="/onboarding"
          className="text-muted-foreground hover:text-foreground transition flex items-center gap-2 text-sm"
        >
          ← Back to Hub
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6">
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-[400px] space-y-6">
          {/* Title Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                {isRequired && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full mt-2">
                    Required
                  </span>
                )}
              </div>
            </div>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>

          {/* Success Message */}
          {alreadyUploaded && (
            <div className="rounded-lg border border-green-600/30 bg-green-600/5 px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Already uploaded. Upload a new file to replace it.</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={submit} className="space-y-6">
            <div className="rounded-lg border-2 border-dashed border-border bg-muted p-8 text-center space-y-4 cursor-pointer hover:border-primary/50 transition">
              <input
                id={`upload-${docKey}`}
                type="file"
                accept={accept}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label
                htmlFor={`upload-${docKey}`}
                className="flex flex-col items-center gap-3 cursor-pointer"
              >
                <Upload className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{helper}</p>
                </div>
              </label>

              {/* File Info */}
              {file && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 justify-center text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-foreground font-medium">{file.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">{acceptHint}</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={busy || !file}
              className="w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
