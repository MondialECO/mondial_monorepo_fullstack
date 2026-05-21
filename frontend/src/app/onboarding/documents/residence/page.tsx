import { Home } from "lucide-react";
import DocumentUploadStep from "@/components/onboarding/DocumentUploadStep";

export default function ResidencePage() {
  return (
    <DocumentUploadStep
      docKey="residence"
      icon={Home}
      title="Proof of Residence"
      description="Recent utility bill or bank statement showing your current address."
      helper="Drag a file or browse. Must be dated within the last 3 months."
    />
  );
}
