import { Suspense } from "react";
import NegotiationWorkspace from "@/components/deals/NegotiationWorkspace";

export default function EntrepreneurDealsPage() {
  return (
    <Suspense fallback={null}>
      <NegotiationWorkspace />
    </Suspense>
  );
}
