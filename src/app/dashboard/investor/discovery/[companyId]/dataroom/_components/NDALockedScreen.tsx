"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Lock, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NDAAcceptModal from "@/components/investor/NDAAcceptModal";
import entrepreneurApi, { DataRoomAccessStatusResponse } from "@/lib/api-entrepreneur";

interface NDALockedScreenProps {
  companyId: string;
  companyName: string;
  accessStatus?: DataRoomAccessStatusResponse | null;
  onRefresh?: () => void;
}

const UNLOCKS = [
  "Full data-room document index (pitch deck, financial model, cap table, legal)",
  "Session analytics — every view and download logged for audit",
  "Live diligence-progress tracking",
];

export default function NDALockedScreen({
  companyId,
  companyName,
  accessStatus,
  onRefresh,
}: NDALockedScreenProps) {
  const [ndaOpen, setNdaOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isPending = accessStatus?.requestStatus === "pending";
  const isDeclined = accessStatus?.requestStatus === "declined";
  const isExpired = accessStatus?.isExpired;
  const isRevoked = accessStatus?.isRevoked;
  const ndaAccepted = accessStatus?.ndaAccepted;

  const handleRequestDirect = async () => {
    if (!ndaAccepted && accessStatus?.ndaRequired) {
      setNdaOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await entrepreneurApi.requestDataRoomAccess(companyId, "view_and_download");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err?.message || "Failed to submit access request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Pending Approval State
  if (isPending) {
    return (
      <Card className="border-border bg-card rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Clock className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Access Request Pending Approval
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your request to access {companyName}&apos;s Data Room has been sent to the founder. You will receive an in-app notification once approved.
          </p>

          <div className="mt-8 w-full max-w-md space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-left">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-foreground">
                Mutual NDA Accepted
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-foreground">
                Data Room Access Request Submitted
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-amber-500">
                Founder Approval Pending
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-6 gap-2"
            onClick={() => onRefresh && onRefresh()}
          >
            <RefreshCw className="h-4 w-4" /> Check Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2. Declined State
  if (isDeclined) {
    return (
      <Card className="border-border bg-card rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Access Request Not Approved
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Data Room access isn&apos;t available at this time.
          </p>

          <Button
            className="mt-6"
            onClick={handleRequestDirect}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Request Again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 3. Expired State
  if (isExpired) {
    return (
      <Card className="border-border bg-card rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <ShieldAlert className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Data Room Access Expired
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your previous Data Room access grant for {companyName} has expired.
          </p>

          <Button
            className="mt-6"
            onClick={handleRequestDirect}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Request New Access"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 4. Revoked State
  if (isRevoked) {
    return (
      <Card className="border-border bg-card rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Data Room Access Revoked
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your Data Room access has been revoked by the company.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 5. Default Locked / Request Ready State
  return (
    <>
      <Card className="border-dashed border-border bg-card rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {ndaAccepted
              ? "Request Data Room Access"
              : "The Data Room is NDA-Protected"}
          </h2>

          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {ndaAccepted
              ? `Submit an access request to view sensitive deal materials for ${companyName}.`
              : `Sign the mutual NDA to request access to sensitive deal materials for ${companyName}.`}
          </p>

          <ul className="mt-6 w-full max-w-md space-y-2 text-left">
            {UNLOCKS.map((u) => (
              <li
                key={u}
                className="flex items-start gap-2 text-xs text-foreground"
              >
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span>{u}</span>
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-4 text-xs text-destructive">{error}</p>
          )}

          <Button
            className="mt-6"
            onClick={handleRequestDirect}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : ndaAccepted
              ? "Request Data Room Access"
              : "Request Data Room Access"}
          </Button>
        </CardContent>
      </Card>

      <NDAAcceptModal
        companyId={companyId}
        companyName={companyName}
        open={ndaOpen}
        onOpenChange={(open) => {
          setNdaOpen(open);
          if (!open && onRefresh) onRefresh();
        }}
      />
    </>
  );
}

