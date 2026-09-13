export type VerificationStep = {
  id: string;
  title: string;
  description: string;
  optional?: boolean;
};

export const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: "identity-document",
    title: "Identity Document",
    description: "Passport, Driver's License or ID card",
  },
  {
    id: "proof-of-address",
    title: "Proof of Address",
    description: "Utility bill or bank statement (Optional)",
    optional: true,
  },
];
