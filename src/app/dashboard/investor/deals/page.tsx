import { Suspense } from "react";
import NegotiationWorkspace from "@/components/deals/NegotiationWorkspace";

export default function InvestorDealsPage() {
  return (
    <Suspense fallback={null}>
      <NegotiationWorkspace />
    </Suspense>
  );
}
