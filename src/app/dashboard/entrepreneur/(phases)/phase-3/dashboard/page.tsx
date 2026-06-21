import { redirect } from 'next/navigation';

// /phase-3/dashboard was referenced by older Step 3 code but never existed
// as a real page. The Phase 3 flow now uses the overview at /phase-3 and the
// submission steps at /phase-3/step-N. Redirect here so any stale link
// (cached browser history, etc) lands somewhere meaningful.
export default function Phase3DashboardRedirect() {
  redirect('/dashboard/entrepreneur/phase-3');
}
