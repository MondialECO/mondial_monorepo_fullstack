"use client";

import { useState, useEffect } from "react";
import type { CredentialsFormData } from "@/features/auth/signup/constants";
import type { RegisterRequest } from "@/lib/api-auth";

export type SignupStep = "role-selection" | "credentials" | "verification" | "completion";

interface UseSignupFlowReturn {
  currentStep: SignupStep;
  selectedRole: string | null;
  credentials: CredentialsFormData | null;
  formData: RegisterRequest | null;
  nextStep: () => void;
  previousStep: () => void;
  selectRole: (roleId: string) => void;
  setCredentials: (data: CredentialsFormData) => void;
  updateFormData: (data: Partial<RegisterRequest>) => void;
  resetFlow: () => void;
  canGoPrevious: boolean;
  stepProgress: number; // 0-100
}

const STEP_ORDER: SignupStep[] = [
  "role-selection",
  "credentials",
  "verification",
  "completion",
];
const SESSION_STORAGE_KEY = "signup_flow_state";

export function useSignupFlow(
  initialStep: SignupStep = "role-selection"
): UseSignupFlowReturn {
  const [currentStep, setCurrentStep] = useState<SignupStep>(initialStep);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [credentials, setCredentialsState] = useState<CredentialsFormData | null>(
    null
  );
  const [formData, setFormDataState] = useState<RegisterRequest | null>(null);

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedState) {
      try {
        const { step, role, credentials: savedCreds, formData: savedFormData } =
          JSON.parse(savedState);
        if (step && STEP_ORDER.includes(step)) setCurrentStep(step);
        if (role) setSelectedRole(role);
        if (savedCreds) setCredentialsState(savedCreds);
        if (savedFormData) setFormDataState(savedFormData);
      } catch {
        // Ignore parse errors, use initial state
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        step: currentStep,
        role: selectedRole,
        credentials: credentials,
        formData: formData,
      })
    );
  }, [currentStep, selectedRole, credentials, formData]);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const canGoPrevious = currentStepIndex > 0;

  const nextStep = () => {
    if (currentStepIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentStepIndex + 1]);
    }
  };

  const previousStep = () => {
    if (canGoPrevious) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
    }
  };

  const selectRole = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const setCredentials = (data: CredentialsFormData) => {
    setCredentialsState(data);
  };

  const updateFormData = (data: Partial<RegisterRequest>) => {
    setFormDataState((prev) => ({
      fullName: prev?.fullName ?? "",
      email: prev?.email ?? "",
      password: prev?.password ?? "",
      role: prev?.role ?? selectedRole ?? "",
      ...data,
    }));
  };

  const resetFlow = () => {
    setCurrentStep("role-selection");
    setSelectedRole(null);
    setCredentialsState(null);
    setFormDataState(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const stepProgress = Math.round(
    ((currentStepIndex + 1) / STEP_ORDER.length) * 100
  );

  return {
    currentStep,
    selectedRole,
    credentials,
    formData,
    nextStep,
    previousStep,
    selectRole,
    setCredentials,
    updateFormData,
    resetFlow,
    canGoPrevious,
    stepProgress,
  };
}
