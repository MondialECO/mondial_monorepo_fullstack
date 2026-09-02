"use client";

import { UserCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared";
import { PendingVerificationQueue } from "@/components/admin/serviceprovider/PendingVerificationQueue";

export default function AdminServiceProvidersVerificationPage() {
  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      <AdminPageHeader
        title="Service Provider Verification Queue"
        description="Review remediated provider profiles, service listings, credentials, and portfolio items for marketplace verification."
        badge="CREDENTIALS"
        icon={UserCheck}
        backHref="/dashboard/admin/verifications"
        backLabel="Back to Verification Hub"
      />

      {/* Operational Queue */}
      <PendingVerificationQueue />
    </div>
  );
}
