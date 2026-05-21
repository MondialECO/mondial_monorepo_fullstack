"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Building2, Receipt, ShieldCheck, FileUp, CheckCircle2, X, LucideIcon } from "lucide-react";
import { useEntrepreneurProgress } from "@/hooks/useEntrepreneurProgress";
import { RouteGuard } from "@/components/entrepreneur/RouteGuard";
import PhaseStepShell from "@/components/entrepreneur/PhaseStepShell";
import LockedStepPreview from "@/components/entrepreneur/LockedStepPreview";
import { cn } from "@/lib/utils";

type DocKey = "kbis" | "rib" | "tax" | "insurance";

interface DocSlot {
  key: DocKey;
  title: string;
  description: string;
  icon: LucideIcon;
}

const DOCS: DocSlot[] = [
  {
    key: "kbis",
    title: "KBIS / Extrait Kbis",
    description:
      "Official company registration extract from the French national trade registry (Registre du Commerce)",
    icon: FileText,
  },
  {
    key: "rib",
    title: "Bank RIB / Relevé d'Identité Bancaire",
    description: "Your company bank account details for payment verification and fund transfers",
    icon: Building2,
  },
  {
    key: "tax",
    title: "Tax Certificate / Attestation Fiscale",
    description: "Certificate of tax compliance issued by the Direction Générale des Finances Publiques",
    icon: Receipt,
  },
  {
    key: "insurance",
    title: "Professional Insurance / Attestation RC Pro",
    description:
      "Valid professional liability insurance certificate covering your current business activities",
    icon: ShieldCheck,
  },
];

const ACCEPT = ".pdf,.jpg,.jpeg,.png";
const MAX_BYTES = 10 * 1024 * 1024;

type StoredFile = { name: string; size: number };

function Phase2Step2Content() {
  const router = useRouter();
  const { progress, completeStep, savePhaseData, getPhaseData } = useEntrepreneurProgress();

  const initial =
    (getPhaseData(2) as { documents?: Partial<Record<DocKey, StoredFile>> } | undefined)
      ?.documents ?? {};
  const [files, setFiles] = useState<Partial<Record<DocKey, StoredFile>>>(initial);
  const [errors, setErrors] = useState<Partial<Record<DocKey, string>>>({});

  const setFile = useCallback(
    (key: DocKey, file: File | null) => {
      if (!file) {
        setFiles((prev) => {
          const next = { ...prev };
          delete next[key];
          savePhaseData(2, { ...((getPhaseData(2) as object) ?? {}), documents: next });
          return next;
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        setErrors((e) => ({ ...e, [key]: "File too large (max 10MB)" }));
        return;
      }
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ACCEPT.split(",").includes(ext)) {
        setErrors((e) => ({ ...e, [key]: "Unsupported file type" }));
        return;
      }
      setErrors((e) => ({ ...e, [key]: undefined }));
      const next = { ...files, [key]: { name: file.name, size: file.size } };
      setFiles(next);
      savePhaseData(2, { ...((getPhaseData(2) as object) ?? {}), documents: next });
    },
    [files, getPhaseData, savePhaseData],
  );

  const uploadedCount = Object.values(files).filter(Boolean).length;
  const allReady = uploadedCount === DOCS.length;

  function handleNext() {
    if (!allReady) return;
    completeStep(2, 2);
    router.push("/dashboard/entrepreneur/phase-2/step-3");
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <PhaseStepShell
      title="Document Submission"
      subtitle="Please provide the following legal documents to certify your company's existence and compliance. Only PDF, JPG, or PNG formats are accepted."
      progressLabel="PROGRESS"
      progressValue={`${uploadedCount} of ${DOCS.length} Required`}
      progressIcon={FileUp}
      footerHint={{ label: "Save For Later" }}
      primaryAction={{ label: "Next", onClick: handleNext, disabled: !allReady }}
      secondaryAction={{ label: "Cancel", href: "/dashboard/entrepreneur/phase-2" }}
      infoBanner={{
        title: "Why need this information",
        description:
          "These documents are required for legal compliance and to protect the mondial.eco ecosystem. We use them to verify that your business is in good standing before unlocking access to specialized eco-funding and commercial partnerships.",
      }}
      lockedPreview={
        <LockedStepPreview
          step={3}
          title="Ownership & KYC Checks"
          subtitle="Identity verification for legal representatives"
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DOCS.map((doc) => (
          <DocumentCard
            key={doc.key}
            doc={doc}
            file={files[doc.key]}
            error={errors[doc.key]}
            onFile={(f) => setFile(doc.key, f)}
          />
        ))}
      </div>
    </PhaseStepShell>
  );
}

function DocumentCard({
  doc,
  file,
  error,
  onFile,
}: {
  doc: DocSlot;
  file?: StoredFile;
  error?: string;
  onFile: (file: File | null) => void;
}) {
  const Icon = doc.icon;
  const isUploaded = !!file;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{doc.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{doc.description}</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-1 flex-shrink-0">
          Mandatory
        </span>
      </div>

      {!isUploaded ? (
        <label
          htmlFor={`upload-${doc.key}`}
          className={cn(
            "relative flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition",
            "border-border hover:border-primary/40 hover:bg-primary/5",
          )}
        >
          <Icon className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm text-foreground font-medium">Click to upload document or drag and drop</p>
          <input
            id={`upload-${doc.key}`}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="rounded-xl border border-green-600/30 bg-green-600/5 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            onClick={() => onFile(null)}
            className="p-1 rounded hover:bg-foreground/5 text-muted-foreground"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <FileText className="w-3.5 h-3.5" />
          PDF, JPG, PNG — max 10MB
        </span>
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  );
}

export default function Phase2Step2Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={2}>
      <Phase2Step2Content />
    </RouteGuard>
  );
}
