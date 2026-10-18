"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React from "react";
import { BrandKitSnapshot } from "@/types/creator/brand-kit";
import { History, AlertTriangle, ArrowRight, X, Clock, Check } from "lucide-react";

interface RestoreSnapshotModalProps {
  isOpen: boolean;
  snapshot: BrandKitSnapshot | null;
  snapshotIndex: number;
  isRestoring: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function RestoreSnapshotModal({ isOpen,
  snapshot,
  snapshotIndex,
  isRestoring,
  onConfirm,
  onClose, }: RestoreSnapshotModalProps) {
  const { t } = useTranslation("creator");
  if (!isOpen || !snapshot) return null;

  const formattedDate = new Date(snapshot.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-snapshot-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2 text-foreground">
            <History className="size-5 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              {t("modals.restoreTitle")}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t("modals.restoreClose")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <h3 id="restore-snapshot-title" className="text-lg font-bold text-foreground">
            {t("modals.restoreTo")} {snapshot.description || `Snapshot #${snapshotIndex + 1}`}
          </h3>

          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("modals.restoreTimestamp")}</span>
              <span className="font-semibold text-foreground">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("modals.restoreDirection")}</span>
              <span className="font-semibold text-foreground">
                {snapshot.direction?.candidates?.find((c) => c.key === snapshot.direction?.selectedDirectionKey)?.name || "Default"}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("modals.restoreColours")}</span>
              <span className="font-semibold text-foreground">
                {snapshot.colors?.roles?.length || 5} {t("modals.restoreRolesConfigured")}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("modals.restoreTypography")}</span>
              <span className="font-semibold text-foreground">
                {snapshot.typography?.roles?.length || 4} {t("modals.restoreRoleSpecimens")}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t("modals.restoreNotice")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/60 px-6 py-3.5 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {t("modals.restoreCancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRestoring}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <span>{isRestoring ? "Restoring..." : "Confirm Restore"}</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
