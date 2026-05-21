"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  UserCircle2,
  Trash2,
  Plus,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useEntrepreneurProgress } from "@/hooks/useEntrepreneurProgress";
import { RouteGuard } from "@/components/entrepreneur/RouteGuard";
import PhaseStepShell from "@/components/entrepreneur/PhaseStepShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Shareholder {
  id: string;
  fullName: string;
  ownership: number; // percent
  nationality: string;
  role?: string;
}

type Phase3Data = {
  shareholders?: Shareholder[];
  kycStarted?: boolean;
  kycVerified?: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function Phase2Step3Content() {
  const router = useRouter();
  const { progress, completeStep, savePhaseData, getPhaseData } = useEntrepreneurProgress();

  const stored = (getPhaseData(2) as { phase3?: Phase3Data } | undefined)?.phase3 ?? {};
  const [shareholders, setShareholders] = useState<Shareholder[]>(
    stored.shareholders && stored.shareholders.length > 0
      ? stored.shareholders
      : [
          { id: uid(), fullName: "Elowen Davies", ownership: 20, nationality: "United Kingdom", role: "Chief Executive" },
          { id: uid(), fullName: "Elowen Davies", ownership: 40, nationality: "Canada", role: "CMO" },
        ],
  );
  const [kycVerified, setKycVerified] = useState<boolean>(stored.kycVerified ?? false);
  const [mode, setMode] = useState<"view" | "edit">(shareholders.length > 0 ? "view" : "edit");
  const [busyKyc, setBusyKyc] = useState(false);

  function persist(next: Partial<Phase3Data>) {
    const prev = (getPhaseData(2) as object) ?? {};
    savePhaseData(2, { ...prev, phase3: { shareholders, kycVerified, ...next } });
  }

  function updateRow(id: string, patch: Partial<Shareholder>) {
    setShareholders((rows) => {
      const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
      persist({ shareholders: next });
      return next;
    });
  }

  function addRow() {
    const next: Shareholder[] = [
      ...shareholders,
      { id: uid(), fullName: "", ownership: 0, nationality: "" },
    ];
    setShareholders(next);
    setMode("edit");
    persist({ shareholders: next });
  }

  function removeRow(id: string) {
    const next = shareholders.filter((r) => r.id !== id);
    setShareholders(next);
    persist({ shareholders: next });
    if (next.length === 0) setMode("edit");
  }

  function devConfirmKyc() {
    setBusyKyc(true);
    setTimeout(() => {
      setKycVerified(true);
      setBusyKyc(false);
      persist({ kycVerified: true });
    }, 400);
  }

  function handleContinue() {
    completeStep(2, 3);
    router.push("/dashboard/entrepreneur/phase-2/step-4");
  }

  const filledPct = Math.min(
    100,
    Math.round(
      (shareholders.filter((s) => s.fullName && s.ownership > 0 && s.nationality).length /
        Math.max(1, shareholders.length)) *
        100,
    ),
  );

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const canContinue = shareholders.length > 0 && filledPct === 100 && kycVerified;

  return (
    <PhaseStepShell
      title="Ownership & KYC Verification"
      subtitle="Identify beneficial owners and complete biometric identity verification."
      progressLabel="Verification"
      progressValue={`From ${filledPct}% Filled`}
      progressIcon={Users}
      primaryAction={{ label: "Continue", onClick: handleContinue, disabled: !canContinue }}
      secondaryAction={{ label: "Save Draft", onClick: () => persist({}) }}
      footerHint={{
        label: "Back to Uploads",
        onClick: () => router.push("/dashboard/entrepreneur/phase-2/step-2"),
      }}
      infoBanner={{
        title: "Why need this information",
        description:
          "These documents are required for legal compliance and to protect the mondial.eco ecosystem. We use them to verify that your business is in good standing before unlocking access to specialized eco-funding and commercial partnerships.",
      }}
    >
      {/* Beneficial Ownership */}
      <section className="rounded-2xl border border-border bg-card/40 p-5 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Beneficial Ownership</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Identify beneficial owners and complete biometric identity verification.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
            <Plus className="w-4 h-4" />
            Add Shareholder
          </Button>
        </div>

        {mode === "view" ? (
          <TableView shareholders={shareholders} onEdit={() => setMode("edit")} />
        ) : (
          <EditView
            shareholders={shareholders}
            updateRow={updateRow}
            removeRow={removeRow}
            onDone={() => setMode(shareholders.length > 0 ? "view" : "edit")}
          />
        )}
      </section>

      {/* Two-column: Representative KYC + Security & Privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RepresentativeKycCard
          verified={kycVerified}
          busy={busyKyc}
          onScan={devConfirmKyc}
        />
        <SecurityPrivacyCard />
      </div>

      {/* Locked checks preview row */}
      <div className="mt-6 rounded-2xl border border-border bg-card/40 px-5 py-4 flex items-center gap-4 opacity-70">
        <span className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
          3
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Ownership & KYC Checks</p>
          <p className="text-xs text-muted-foreground">KBIS, RIB, Insurance, Tax Certificates</p>
        </div>
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>
    </PhaseStepShell>
  );
}

function TableView({ shareholders, onEdit }: { shareholders: Shareholder[]; onEdit: () => void }) {
  if (shareholders.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        No shareholders yet. Click "Add Shareholder" to begin.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Full Name</th>
            <th className="px-4 py-3 font-semibold">Ownership</th>
            <th className="px-4 py-3 font-semibold">Nationality</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {shareholders.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="px-4 py-4">
                <p className="font-medium text-foreground">{s.fullName || "—"}</p>
                {s.role && <p className="text-xs text-muted-foreground">{s.role}</p>}
              </td>
              <td className="px-4 py-4 text-foreground">{s.ownership}%</td>
              <td className="px-4 py-4 text-foreground">{s.nationality || "—"}</td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={onEdit}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditView({
  shareholders,
  updateRow,
  removeRow,
  onDone,
}: {
  shareholders: Shareholder[];
  updateRow: (id: string, patch: Partial<Shareholder>) => void;
  removeRow: (id: string) => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-3">
      {shareholders.map((s) => (
        <div
          key={s.id}
          className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr_auto] gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Full Name
            </label>
            <Input
              value={s.fullName}
              onChange={(e) => updateRow(s.id, { fullName: e.target.value })}
              placeholder="John Doe"
              className="h-10 bg-card"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Ownership (%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={s.ownership}
              onChange={(e) => updateRow(s.id, { ownership: Number(e.target.value) })}
              className="h-10 bg-card"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Nationality
            </label>
            <Input
              value={s.nationality}
              onChange={(e) => updateRow(s.id, { nationality: e.target.value })}
              placeholder="United States"
              className="h-10 bg-card"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(s.id)}
            className="h-10 w-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-600 hover:border-red-300 transition"
            aria-label="Remove shareholder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {shareholders.length > 0 && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onDone}>
            Done editing
          </Button>
        </div>
      )}
    </div>
  );
}

function RepresentativeKycCard({
  verified,
  busy,
  onScan,
}: {
  verified: boolean;
  busy: boolean;
  onScan: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Representative KYC</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Verify owners and conduct biometric checks for KYC.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Primary Applicant</p>
              <p className="text-xs text-muted-foreground">Sarah Jenkis (Director)</p>
            </div>
          </div>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-1",
              verified
                ? "bg-green-600/15 text-green-700 dark:text-green-300"
                : "bg-primary/10 text-primary",
            )}
          >
            {verified ? "Verified" : "Not Started"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Complete the biometric identity verification using your mobile device or webcam.
        </p>

        <Button onClick={onScan} disabled={verified || busy} className="w-full gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {verified ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Identity Verified
            </span>
          ) : (
            "Start Identity Verification"
          )}
        </Button>
      </div>
    </div>
  );
}

function SecurityPrivacyCard() {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Security & Privacy</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Verify ownership and complete KYC for better security.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </span>
          <p className="text-sm font-semibold text-foreground">Regular Compliance</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your personal data is encrypted and handled by our certified KYC partner to ensure strict
          regulatory compliance (AML/CFT).
        </p>

        <div className="flex items-center gap-4 pt-1">
          <ComplianceBadge label="ISO 27001" />
          <span className="text-border">|</span>
          <ComplianceBadge label="GDPR" />
          <span className="text-border">|</span>
          <ComplianceBadge label="SOC2" />
        </div>
      </div>
    </div>
  );
}

function ComplianceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <ShieldCheck className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export default function Phase2Step3Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={3}>
      <Phase2Step3Content />
    </RouteGuard>
  );
}
