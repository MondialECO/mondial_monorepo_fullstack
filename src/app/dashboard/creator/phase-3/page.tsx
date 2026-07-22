import { redirect } from 'next/navigation';

// The former "Financial Modeling Inputs" (3.1) screen was removed: it collected five
// numeric inputs it never persisted, and the forecast step re-collects its own. Phase 3
// now starts at the business plan. This root redirects so bookmarks, the Phase 2 →
// Phase 3 transition, and any legacy step-1 resolution all land cleanly here.
export default function Phase3IndexPage() {
  redirect('/dashboard/creator/phase-3/business-plan');
}
