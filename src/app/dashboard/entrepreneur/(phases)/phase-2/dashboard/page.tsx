import { redirect } from 'next/navigation';

// The /phase-2/dashboard route used to render a mock "investor-ready" dashboard,
// which conflicted with the corrected Phase 2 semantics (documents submitted /
// compliance review pending — not verified). The route is retired; redirect to
// the Phase 2 overview so any stale link still lands somewhere meaningful.
export default function Phase2DashboardRedirect() {
  redirect('/dashboard/entrepreneur/phase-2');
}
