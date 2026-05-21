import { Car } from "lucide-react";
import DocumentUploadStep from "@/components/onboarding/DocumentUploadStep";

export default function LicensePage() {
  return (
    <DocumentUploadStep
      docKey="license"
      icon={Car}
      title="Driver's licence"
      description="Scan of the front of your driver's licence as a supplementary ID."
      helper="Upload a clear photo or scan. Service Providers must provide a professional credential or licence."
      acceptHint="PDF or image. Up to 20MB."
      accept=".pdf,.jpg,.jpeg,.png,.webp"
    />
  );
}
