import { Suspense } from "react";
import ConfirmEmailContent from "@/components/auth/confirm-email/ConfirmEmailContent";

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
