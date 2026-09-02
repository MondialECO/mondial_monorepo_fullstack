"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/_providers/AuthProvider";
import { useDeals } from "@/hooks/queries/deals";
import { useDealRealtime } from "@/hooks/queries/use-deal-realtime";
import { dealRoleForUser } from "@/lib/deal-utils";
import DealInbox from "./DealInbox";
import DealDetailPanel from "./DealDetailPanel";

const STATUS_LABEL: Record<string, string> = {
  idle: "Offline",
  connecting: "Connecting…",
  connected: "Live",
  reconnecting: "Reconnecting…",
  disconnected: "Offline",
};

export default function NegotiationWorkspace() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const myRole = dealRoleForUser(user?.role);
  const activeId = params.get("deal") || params.get("d");

  const { data: deals = [], isLoading, isError } = useDeals();
  // Deal events ride the per-user notifications hub; gate on token (like
  // NotificationBell), not on `user`, so the connection isn't held hostage to
  // auth-context hydration timing.
  const realtimeStatus = useDealRealtime(!!token);

  const select = (id: string) => router.replace(`?d=${id}`);
  const live = realtimeStatus === "connected";

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px]">Deals</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              aria-live="polite"
            >
              <span
                className={
                  live
                    ? "inline-block h-1.5 w-1.5 rounded-full bg-success-text"
                    : "inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"
                }
                aria-hidden
              />
              {STATUS_LABEL[realtimeStatus]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Negotiate term sheets between entrepreneurs and investors.
          </p>
        </div>
      </div>

      <div className="grid h-[560px] md:h-[calc(100dvh-220px)] md:min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[340px_1fr]">
        <div className={cn("min-h-0 overflow-hidden border-border md:border-r", activeId ? "hidden md:block" : "block")}>
          <DealInbox
            deals={deals}
            isLoading={isLoading}
            isError={isError}
            myRole={myRole}
            activeId={activeId}
            onSelect={select}
          />
        </div>

        <div className={cn("min-h-0 overflow-hidden", activeId ? "block" : "hidden md:block")}>
          {activeId ? (
            <DealDetailPanel
              key={activeId}
              dealId={activeId}
              myRole={myRole}
              onBack={() => router.replace("?")}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">Select a deal to view the negotiation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
