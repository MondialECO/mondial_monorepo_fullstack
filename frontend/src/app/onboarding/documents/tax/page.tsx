import { Receipt } from "lucide-react";
import DocumentUploadStep from "@/components/onboarding/DocumentUploadStep";

export default function TaxPage() {
  return (
    <DocumentUploadStep
      docKey="tax"
      icon={Receipt}
      title="Tax Documents"
      description="Tax residency certificate or most recent return."
      helper="Upload a recent tax filing or residency certificate. Required for Investor accreditation."
    />
  );
}
