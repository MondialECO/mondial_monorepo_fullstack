import { Suspense } from "react";
import ResetPassword from "@/components/auth/ResetPage/ResetPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
