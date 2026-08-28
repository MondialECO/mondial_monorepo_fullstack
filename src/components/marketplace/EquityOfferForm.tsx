"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, Sparkles, Handshake, AlertCircle, X } from "lucide-react";
import { CreateEquityOfferRequest, CounterEquityOfferRequest, EquityTerms } from "@/lib/api-marketplace-projects";

interface EquityOfferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEquityOfferRequest) => Promise<void>;
  projectName: string;
  creatorName?: string;
  isCounter?: boolean;
  initialTerms?: Partial<EquityTerms>;
  currentRevisionNumber?: number;
}

const DEFAULT_ROLES = [
  "Co-founder",
  "Co-founder & CTO",
  "Co-founder & Product Lead",
  "Technical Advisor",
  "Founding Strategist",
];

const DEFAULT_COMMITMENTS = [
  "5 hours / week",
  "10 hours / week",
  "15 hours / week",
  "20 hours / week (Part-time)",
  "Full-time (40 hours / week)",
];

const DEFAULT_RESPONSIBILITIES = [
  "Product vision and technical architecture handover",
  "Core domain knowledge transfer & documentation",
  "Bi-weekly strategy & product review sessions",
];

export function EquityOfferForm({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  creatorName = "Creator",
  isCounter = false,
  initialTerms,
  currentRevisionNumber = 1,
}: EquityOfferFormProps) {
  const [equityPercentage, setEquityPercentage] = useState<number>(initialTerms?.equityPercentage ?? 15);
  const [creatorRole, setCreatorRole] = useState<string>(initialTerms?.creatorRole || "Co-founder");
  const [customRole, setCustomRole] = useState<string>("");
  const [cashComponent, setCashComponent] = useState<string>(
    initialTerms?.cashComponent != null ? String(initialTerms.cashComponent) : ""
  );
  const [vestingEnabled, setVestingEnabled] = useState<boolean>(initialTerms?.vestingEnabled ?? true);
  const [vestingMonths, setVestingMonths] = useState<number>(initialTerms?.vestingMonths || 48);
  const [cliffMonths, setCliffMonths] = useState<number>(initialTerms?.cliffMonths || 12);
  const [responsibilities, setResponsibilities] = useState<string[]>(
    initialTerms?.responsibilities?.length ? initialTerms.responsibilities : DEFAULT_RESPONSIBILITIES
  );
  const [newResp, setNewResp] = useState<string>("");
  const [timeCommitment, setTimeCommitment] = useState<string>(
    initialTerms?.timeCommitment || "10 hours / week"
  );
  const [notes, setNotes] = useState<string>(initialTerms?.notes || "");
  const [expiryDays, setExpiryDays] = useState<number>(14);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddResp = () => {
    if (!newResp.trim()) return;
    setResponsibilities((prev) => [...prev, newResp.trim()]);
    setNewResp("");
  };

  const handleRemoveResp = (index: number) => {
    setResponsibilities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalRole = creatorRole === "custom" ? customRole.trim() : creatorRole.trim();
    if (!finalRole) {
      setError("Please specify a role for the Creator.");
      return;
    }

    if (equityPercentage <= 0 || equityPercentage >= 100) {
      setError("Equity percentage must be between 0.1% and 99.9%.");
      return;
    }

    const cashNum = cashComponent.trim() !== "" ? parseFloat(cashComponent) : null;
    if (cashNum !== null && (isNaN(cashNum) || cashNum < 0)) {
      setError("Cash component cannot be negative.");
      return;
    }

    if (vestingEnabled) {
      if (vestingMonths <= 0) {
        setError("Vesting duration must be greater than 0 months.");
        return;
      }
      if (cliffMonths < 0 || cliffMonths > vestingMonths) {
        setError("Cliff cannot exceed total vesting months.");
        return;
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const payload: CreateEquityOfferRequest = {
      equityPercentage,
      creatorRole: finalRole,
      cashComponent: cashNum,
      vestingEnabled,
      vestingMonths: vestingEnabled ? vestingMonths : 0,
      cliffMonths: vestingEnabled ? cliffMonths : 0,
      responsibilities: responsibilities.filter((r) => r.trim().length > 0),
      timeCommitment,
      expiresAt: expiresAt.toISOString(),
      notes: notes.trim() || undefined,
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Failed to submit offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isCounter ? `Counter Equity Offer (V${currentRevisionNumber + 1})` : "Send Co-founder / Equity Offer"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isCounter
                  ? `Submit your counter-terms to ${creatorName} for ${projectName}.`
                  : `Propose an equity partnership to ${creatorName} for ${projectName}.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Equity Percentage */}
          <div className="space-y-3 rounded-xl border border-border p-4 bg-background">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Creator Equity Percentage</Label>
              <div className="flex items-center gap-1.5 font-mono">
                <Input
                  type="number"
                  min={1}
                  max={49}
                  step={0.5}
                  value={equityPercentage}
                  onChange={(e) => setEquityPercentage(parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 text-right font-extrabold text-primary"
                />
                <span className="text-base font-bold text-primary">%</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={49}
              step={0.5}
              value={equityPercentage}
              onChange={(e) => setEquityPercentage(parseFloat(e.target.value) || 0)}
              className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground">
              Proposed ownership stake allocated to the Creator. Typical advisory/co-founder stakes range from 5% to 25%.
            </p>
          </div>

          {/* Creator Role */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Creator Role in Project</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setCreatorRole(role)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    creatorRole === role
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-muted/40 hover:bg-muted border-border text-foreground"
                  }`}
                >
                  {role}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCreatorRole("custom")}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  creatorRole === "custom"
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-muted/40 hover:bg-muted border-border text-foreground"
                }`}
              >
                Custom Role...
              </button>
            </div>
            {creatorRole === "custom" && (
              <Input
                placeholder="e.g. Lead Robotics Advisor"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="mt-2 text-xs"
                required
              />
            )}
          </div>

          {/* Cash Component (Optional) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Cash Component / Upfront Buyout Component (€) <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 5000"
              value={cashComponent}
              onChange={(e) => setCashComponent(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Optional upfront bonus or partial IP purchase fee paired with the equity stake.
            </p>
          </div>

          {/* Vesting Schedule */}
          <div className="space-y-3 rounded-xl border border-border p-4 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">Vesting Schedule</Label>
                <p className="text-[11px] text-muted-foreground">Subject equity to standard time-based vesting.</p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={vestingEnabled}
                  onChange={(e) => setVestingEnabled(e.target.checked)}
                  id="vesting-toggle"
                />
                <label htmlFor="vesting-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  {vestingEnabled ? "Enabled" : "Disabled"}
                </label>
              </div>
            </div>

            {vestingEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Total Vesting (Months)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={vestingMonths}
                    onChange={(e) => setVestingMonths(parseInt(e.target.value) || 0)}
                    className="text-xs mt-1"
                  />
                  <span className="text-[10px] text-muted-foreground">({Math.round(vestingMonths / 12)} years)</span>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Cliff Period (Months)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={cliffMonths}
                    onChange={(e) => setCliffMonths(parseInt(e.target.value) || 0)}
                    className="text-xs mt-1"
                  />
                  <span className="text-[10px] text-muted-foreground">({Math.round(cliffMonths / 12)} year cliff)</span>
                </div>
              </div>
            )}
          </div>

          {/* Time Commitment */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Expected Time Commitment</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COMMITMENTS.map((comm) => (
                <button
                  type="button"
                  key={comm}
                  onClick={() => setTimeCommitment(comm)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    timeCommitment === comm
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-muted/40 hover:bg-muted border-border text-foreground"
                  }`}
                >
                  {comm}
                </button>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Key Responsibilities & Deliverables</Label>
            <div className="space-y-2">
              {responsibilities.map((resp, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border text-xs">
                  <span>• {resp}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(idx)}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Add specific deliverable..."
                value={newResp}
                onChange={(e) => setNewResp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddResp();
                  }
                }}
                className="text-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddResp} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>

          {/* Offer Expiry & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Offer Validity</Label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days (Recommended)</option>
                <option value={30}>30 days</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Personal Note / Rationale</Label>
              <Textarea
                placeholder="Add context to your offer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5 text-xs font-semibold">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                </>
              ) : isCounter ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Submit Counter-Offer V{currentRevisionNumber + 1}
                </>
              ) : (
                <>
                  <Handshake className="h-3.5 w-3.5" /> Send Equity Offer (V1)
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
