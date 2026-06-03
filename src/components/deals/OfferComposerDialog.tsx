"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OfferTermsInput, TermSheetView } from "@/types/deals";

interface OfferComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  pending?: boolean;
  /** Prefill (e.g. the current terms when countering). */
  initial?: TermSheetView | null;
  onSubmit: (terms: OfferTermsInput) => void;
}

const EQUITY_TYPES = ["preferred", "safe", "note"];
const LIQ_PREFS = ["1x_non_participating", "1x_participating", "2x", "3x"];
const ANTI_DILUTION = ["none", "broad_based", "narrow_based"];

export default function OfferComposerDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  pending,
  initial,
  onSubmit,
}: OfferComposerDialogProps) {
  const [raise, setRaise] = useState(initial?.totalRaiseAmount?.toString() ?? "");
  const [postMoney, setPostMoney] = useState(initial?.postMoneyValuation?.toString() ?? "");
  const [preMoney, setPreMoney] = useState("");
  const [equity, setEquity] = useState(initial?.investorEquityPercent?.toString() ?? "");
  const [equityType, setEquityType] = useState(initial?.equityType || "preferred");
  const [liqPref, setLiqPref] = useState("1x_non_participating");
  const [antiDilution, setAntiDilution] = useState("none");
  const [boardSeats, setBoardSeats] = useState("0");
  const [proRata, setProRata] = useState(initial?.proRataRights ?? false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const totalRaiseAmount = Number(raise);
    const postMoneyValuation = Number(postMoney);
    if (!Number.isFinite(totalRaiseAmount) || totalRaiseAmount <= 0) {
      setError("Enter a raise amount greater than 0.");
      return;
    }
    if (!Number.isFinite(postMoneyValuation) || postMoneyValuation <= 0) {
      setError("Enter a post-money valuation greater than 0.");
      return;
    }
    setError(null);
    onSubmit({
      totalRaiseAmount,
      postMoneyValuation,
      preMoneyValuation: Number(preMoney) || 0,
      investorEquityPercent: Number(equity) || 0,
      equityType,
      liquidationPreference: liqPref,
      antiDilutionProtection: antiDilution,
      boardSeats: Number(boardSeats) || 0,
      proRataRights: proRata,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="raise">Raise amount (€)</Label>
            <Input id="raise" type="number" value={raise} onChange={(e) => setRaise(e.target.value)} placeholder="500000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postMoney">Post-money valuation (€)</Label>
            <Input id="postMoney" type="number" value={postMoney} onChange={(e) => setPostMoney(e.target.value)} placeholder="5000000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preMoney">Pre-money valuation (€)</Label>
            <Input id="preMoney" type="number" value={preMoney} onChange={(e) => setPreMoney(e.target.value)} placeholder="4500000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equity">Investor equity (%)</Label>
            <Input id="equity" type="number" step="0.01" value={equity} onChange={(e) => setEquity(e.target.value)} placeholder="10" />
          </div>

          <div className="space-y-1.5">
            <Label>Equity type</Label>
            <Select value={equityType} onValueChange={setEquityType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EQUITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Liquidation preference</Label>
            <Select value={liqPref} onValueChange={setLiqPref}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIQ_PREFS.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Anti-dilution</Label>
            <Select value={antiDilution} onValueChange={setAntiDilution}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANTI_DILUTION.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="boardSeats">Board seats</Label>
            <Input id="boardSeats" type="number" value={boardSeats} onChange={(e) => setBoardSeats(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 sm:col-span-2 text-sm text-foreground">
            <Checkbox checked={proRata} onChange={(e) => setProRata(e.target.checked)} />
            Pro-rata rights
          </label>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Context for the other party…" />
          </div>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending ? "Submitting…" : submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
