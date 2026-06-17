"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SignTermSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleLabel: string;
  pending?: boolean;
  onConfirm: (file: File) => void;
}

export default function SignTermSheetDialog({
  open,
  onOpenChange,
  roleLabel,
  pending,
  onConfirm,
}: SignTermSheetDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!file) {
      setError("Attach the signed term sheet to continue.");
      return;
    }
    setError(null);
    onConfirm(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign as {roleLabel}</DialogTitle>
          <DialogDescription>
            Upload your signed copy of the agreed term sheet. This records the{" "}
            {roleLabel.toLowerCase()} signature — it cannot sign the other party&apos;s slot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="signedFile">Signed term sheet</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center hover:bg-muted/40">
            <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden />
            <span className="text-sm text-foreground">
              {file ? file.name : "Choose a file (PDF, max 50MB)"}
            </span>
            <input
              id="signedFile"
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Signing…" : "Submit signature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
