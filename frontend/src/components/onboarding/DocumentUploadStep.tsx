"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { OnboardingItemKey } from "@/lib/onboarding-routes";
import { Button } from "@/components/ui/button";
import BackToHub from "@/components/onboarding/BackToHub";
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
    <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <BackToHub />

      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            {title}
            {isRequired && (
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Required</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {alreadyUploaded && (
        <div className="rounded-lg border border-green-600/40 bg-green-600/5 px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Already uploaded. Upload a new file below to replace it.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">{helper}</p>
          <input
            id={`upload-${docKey}`}
            type="file"
            accept={accept}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:opacity-90"
          />
          <p className="mt-2 text-xs text-muted-foreground">{acceptHint}</p>
          {file && (
            <p className="mt-3 text-sm font-medium text-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <Button type="submit" disabled={busy || !file} className="w-full">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Upload document
        </Button>
      </form>
    </div>
  );
}
