"use client";

import { Handshake } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import DealInboxItem from "./DealInboxItem";
import { DealInboxSkeleton } from "./Skeletons";
import type { DealRole, DealStatus } from "@/types/deals";

interface DealInboxProps {
  deals: DealStatus[];
  isLoading: boolean;
  isError: boolean;
  myRole: DealRole | null;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function DealInbox({
  deals,
  isLoading,
  isError,
  myRole,
  activeId,
  onSelect,
}: DealInboxProps) {
  if (isLoading) return <DealInboxSkeleton />;

  if (isError) {
    return (
      <div className="p-4">
        <EmptyState icon={Handshake} title="Couldn't load deals" description="Please try again in a moment." />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Handshake}
          title="No deals yet"
          description={
            myRole === "investor"
              ? "Make an offer from a company's opportunity page to start a deal."
              : "Offers from investors will appear here."
          }
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {deals.map((d) => (
          <DealInboxItem
            key={d.dealId}
            deal={d}
            myRole={myRole}
            active={d.dealId === activeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
