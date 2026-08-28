"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Package,
  Lock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import marketplaceProjectsApi, { BuyoutSaleRecord } from "@/lib/api-marketplace-projects";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BuyoutSaleRecordScreenProps {
  dealId: string;
  onClose?: () => void;
}

export const BuyoutSaleRecordScreen: React.FC<BuyoutSaleRecordScreenProps> = ({
  dealId,
  onClose,
}) => {
  const [record, setRecord] = useState<BuyoutSaleRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecord = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceProjectsApi.getBuyoutSaleRecord(dealId);
      setRecord(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load sale record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [dealId]);

  if (loading) {
    return (
      <Card className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium">Loading Canonical Sale Record...</p>
      </Card>
    );
  }

  if (error && !record) {
    return (
      <Card className="p-6 bg-destructive/5 border border-destructive/30 rounded-xl text-foreground shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <XCircle className="w-5 h-5 text-destructive" />
          <h3 className="font-semibold text-foreground">Sale Record Error</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecord}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </Card>
    );
  }

  if (!record) return null;

  return (
    <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 text-foreground max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-light text-success-strong rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-success-light text-success-strong border-success-strong/30 font-black text-xs uppercase tracking-wider">
                  {record.status}
                </Badge>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Canonical Buyout Sale Record</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Reference: <span className="font-mono text-foreground font-semibold">{record.auditReference}</span>
              </p>
            </div>
          </div>
        </div>

        {onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-background border border-border rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Final Sale Price</span>
          <span className="text-lg font-extrabold text-foreground">€{record.purchasePrice.toLocaleString()} {record.currency}</span>
        </div>

        <div className="p-4 bg-background border border-border rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Completion Date</span>
          <span className="text-xs font-semibold text-foreground block truncate">
            {new Date(record.soldAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {new Date(record.soldAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="p-4 bg-background border border-border rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Seller (Creator)</span>
          <span className="text-sm font-bold text-foreground block truncate">{record.sellerName}</span>
          <span className="text-[10px] text-muted-foreground font-mono block truncate">ID: {record.sellerUserId}</span>
        </div>

        <div className="p-4 bg-background border border-border rounded-xl space-y-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Buyer (Entrepreneur)</span>
          <span className="text-sm font-bold text-foreground block truncate">{record.buyerName}</span>
          <span className="text-[10px] text-muted-foreground font-mono block truncate">ID: {record.buyerUserId}</span>
        </div>
      </div>

      {/* TRANSFERRED ASSET BUNDLE */}
      <div className="p-5 bg-background border border-border rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Transferred Deliverables Bundle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {record.transferredAssets.map((assetName, idx) => (
            <div key={idx} className="p-2.5 bg-card border border-border rounded-lg flex items-center gap-2.5 text-xs text-foreground">
              <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0" />
              <span className="font-medium truncate">{assetName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LEGAL & CRYPTOGRAPHIC PROOF */}
      <div className="p-5 bg-background border border-border rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Cryptographic Integrity &amp; Signed Binding
        </h3>
        <div className="space-y-2 text-xs font-mono text-muted-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-card rounded-lg gap-1 border border-border">
            <span className="text-muted-foreground">Signed Manifest Hash:</span>
            <span className="text-foreground truncate font-semibold">{record.manifestHash}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-card rounded-lg gap-1 border border-border">
            <span className="text-muted-foreground">Signing Package ID:</span>
            <span className="text-foreground truncate">{record.signingPackageId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-card rounded-lg gap-1 border border-border">
            <span className="text-muted-foreground">Accepted Terms Revision:</span>
            <span className="text-foreground">Revision #{record.acceptedRevisionNumber}</span>
          </div>
        </div>
      </div>

      {/* FOOTER NOTICE */}
      <div className="pt-2 text-center text-xs text-muted-foreground">
        This canonical sale record is permanently registered in the platform registry. All intellectual property, assets, and deliverables are fully transferred.
      </div>
    </Card>
  );
};

export default BuyoutSaleRecordScreen;
