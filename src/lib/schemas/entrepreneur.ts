// Plain TypeScript types — no validation library.
// Validation has been removed by design; these are just the shapes the form
// produces and consumes. Keep field names in sync with EMPTY_FORM_DATA in
// usePhase2Step1Form.ts and the inputs in LegalIdentityForm.tsx.

export interface LegalIdentityFormData {
  companyName: string;
  registrationNumber: string;
  legalForm: string;
  incorporationDate: string;
  countryOfRegistration: string;
  registeredAddress: string;
  industryCode: string;
}

export interface DocumentUploadData {
  documents: Array<{
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
}
