import { Wallet } from "lucide-react";
import DocumentUploadStep from "@/components/onboarding/DocumentUploadStep";

export default function IncomePage() {
  return (
    <DocumentUploadStep
      docKey="income"
      icon={Wallet}
      title="Proof of Income"
      description="Pay slips, employment letter, or last year's tax return."
      helper="Upload at least one document showing income. Investors must provide this for accreditation."
    />
  );
}
