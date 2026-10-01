"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  History,
} from "lucide-react";
import {
  creditKeys,
  useCreditPackages,
  useCreditPurchases,
  useCreateCreditCheckout,
} from "@/hooks/queries/creator-ai";
import type { CreditPackage } from "@/types/creator/ai";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const purchaseParam = searchParams?.get("creditPurchase");

  const [selectedPackageId, setSelectedPackageId] = useState<string>("pack_250");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"packages" | "history">("packages");
  const [pollCount, setPollCount] = useState<number>(0);

  const isReturnSuccess = purchaseParam === "success";

  const { data: packages, isLoading: isLoadingPackages, isError: isPackagesError } = useCreditPackages();

  const { data: purchases, isLoading: isLoadingPurchases } = useCreditPurchases({
    refetchInterval: isReturnSuccess && pollCount < 15 ? 2500 : false,
  });

  const checkoutMutation = useCreateCreditCheckout();

  // If redirected back from Stripe with success query param, invalidate balance and refetch
  useEffect(() => {
    if (isReturnSuccess) {
      queryClient.invalidateQueries({ queryKey: creditKeys.balance });
      queryClient.invalidateQueries({ queryKey: creditKeys.purchases });
    }
  }, [isReturnSuccess, queryClient]);

  const latestPurchase = purchases?.[0];
  const latestStatus = latestPurchase?.status?.toLowerCase();

  // Track bounded polling iterations while in pending state
  useEffect(() => {
    if (isReturnSuccess && (!latestPurchase || latestStatus === "pending") && pollCount < 15) {
      const timer = setTimeout(() => {
        setPollCount((prev) => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isReturnSuccess, latestPurchase, latestStatus, pollCount]);

  // When latest purchase transitions to succeeded, invalidate balance again
  useEffect(() => {
    if (isReturnSuccess && latestStatus === "succeeded") {
      queryClient.invalidateQueries({ queryKey: creditKeys.balance });
    }
  }, [isReturnSuccess, latestStatus, queryClient]);

  // Default to first available package or 250 pack
  useEffect(() => {
    if (packages && packages.length > 0) {
      const has250 = packages.some((p) => p.packageId === "pack_250");
      if (has250) {
        setSelectedPackageId("pack_250");
      } else {
        setSelectedPackageId(packages[0].packageId);
      }
    }
  }, [packages]);

  const handleCheckout = async () => {
    setErrorMessage(null);
    if (!selectedPackageId) return;

    try {
      const res = await checkoutMutation.mutateAsync(selectedPackageId);
      if (res?.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
      } else {
        setErrorMessage("Failed to receive checkout URL. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred initializing checkout.";
      setErrorMessage(message);
    }
  };

  const formatPrice = (amountInCents: number, currency: string) => {
    const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase();
    return `${symbol}${(amountInCents / 100).toFixed(2)}`;
  };

  // 3 conceptual package slots (100, 250, 500)
  const targetSlots = [
    { id: "pack_100", credits: 100, label: "Starter", desc: "Best for quick idea validations" },
    { id: "pack_250", credits: 250, label: "Creator", desc: "Most popular — full phase generation", popular: true },
    { id: "pack_500", credits: 500, label: "Pro", desc: "Maximum power for multi-project workflows" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-bold">Buy AI Credits</DialogTitle>
            </div>
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("packages")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === "packages" ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Packs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  activeTab === "history" ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="h-3 w-3" />
                History
              </button>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Choose a credit pack to continue using MBC AI tools. Credits are added directly to your balance.
          </DialogDescription>
        </DialogHeader>

        {/* Return status alerts from Stripe redirect */}
        {isReturnSuccess && (
          <>
            {(!latestPurchase || latestStatus === "pending") && pollCount < 15 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs flex items-center gap-2">
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                <span>Payment received! Adding your credits…</span>
              </div>
            )}
            {latestStatus === "succeeded" && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Payment received! Credits added successfully.</span>
              </div>
            )}
            {latestStatus === "failed" && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Payment failed or could not be completed. No credits were added.</span>
              </div>
            )}
            {latestStatus === "expired" && (
              <div className="p-3 bg-muted border border-border text-muted-foreground rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Checkout session expired. No credits were added.</span>
              </div>
            )}
            {(!latestPurchase || latestStatus === "pending") && pollCount >= 15 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Payment received! Verification is taking a little longer than expected. Please check your purchase history shortly.</span>
              </div>
            )}
          </>
        )}

        {purchaseParam === "cancelled" && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Checkout was cancelled. No charges were made.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === "packages" && (
          <div className="space-y-4 py-2">
            {isLoadingPackages ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Loading available packs…</span>
              </div>
            ) : isPackagesError || !packages || packages.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed rounded-xl space-y-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                <h4 className="text-sm font-semibold">Pricing In Preparation</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Credit purchasing is currently in preparation. Package prices have not been finalized yet.
                  Please check back shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {targetSlots.map((slot) => {
                    const matchedPkg = packages.find((p) => p.packageId === slot.id);
                    const isConfigured = Boolean(matchedPkg && matchedPkg.amountInCents > 0);
                    const isSelected = selectedPackageId === slot.id;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => isConfigured && setSelectedPackageId(slot.id)}
                        className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all select-none ${
                          !isConfigured
                            ? "opacity-50 border-muted bg-muted/20 cursor-not-allowed"
                            : isSelected
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary cursor-pointer"
                            : "border-border hover:border-primary/40 bg-card cursor-pointer"
                        }`}
                      >
                        {slot.popular && isConfigured && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            Popular
                          </div>
                        )}

                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            {slot.label}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black">{slot.credits}</span>
                            <span className="text-xs text-muted-foreground font-medium">credits</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-tight pt-1">
                            {slot.desc}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border/50 mt-3">
                          {isConfigured && matchedPkg ? (
                            <div className="text-sm font-bold text-foreground">
                              {formatPrice(matchedPkg.amountInCents, matchedPkg.currency)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground italic">
                              Price pending
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border mt-4">
                  <div className="text-xs text-muted-foreground">
                    One-time payment • Secure Stripe Hosted Checkout
                  </div>
                  <Button
                    type="button"
                    onClick={handleCheckout}
                    disabled={
                      checkoutMutation.isPending ||
                      !selectedPackageId ||
                      !packages.some((p) => p.packageId === selectedPackageId && p.amountInCents > 0)
                    }
                    className="w-full sm:w-auto min-w-[170px]"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        Continue to Checkout
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="py-2 space-y-3">
            {isLoadingPurchases ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading history…
              </div>
            ) : !purchases || purchases.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-xl text-xs text-muted-foreground space-y-1">
                <Clock className="h-5 w-5 mx-auto text-muted-foreground/60" />
                <p>No credit purchases yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border border rounded-xl overflow-hidden text-xs">
                {purchases.map((p) => (
                  <div key={p.purchaseId} className="p-3 flex items-center justify-between bg-card">
                    <div>
                      <div className="font-semibold text-sm">+{p.credits} AI Credits</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()} at{" "}
                        {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatPrice(p.amountInCents, p.currency)}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === "succeeded"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : p.status === "pending"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
