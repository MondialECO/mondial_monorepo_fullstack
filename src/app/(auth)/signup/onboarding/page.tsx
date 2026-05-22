"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { SignupLayout } from "@/features/auth/signup/components";
import {
  RoleSelectionStep,
  CredentialsStep,
  VerificationStep,
} from "@/features/auth/signup/steps";
import { useSignupFlow } from "@/features/auth/signup/hooks";
import { registerApi } from "@/lib/api-auth";
import type { CredentialsFormData } from "@/features/auth/signup/constants";
import { SIGNUP_ROLE_STORAGE_KEY, formatRoleLabel } from "@/lib/signup-role";

export default function SignupOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const postSignupEmail = searchParams.get("email");
  const postSignupRole = searchParams.get("role");
  const isPostSignupMode = Boolean(postSignupEmail);

  const {
    currentStep,
    selectedRole,
    credentials,
    nextStep,
    previousStep,
    selectRole,
    setCredentials,
    updateFormData,
    canGoPrevious,
  } = useSignupFlow();

  // Redirect to dashboard once flow completes with error handling.
  useEffect(() => {
    if (currentStep === "completion") {
      const t = setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [currentStep, router]);

  const handleCredentialsSubmit = async (data: CredentialsFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Update formData with credentials + role
      updateFormData({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: selectedRole || "creator",
      });

      // Call registration API
      const response = await registerApi({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: selectedRole || "creator",
      });

      // Store token if returned by backend
      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      // Store credentials for form repopulation
      setCredentials(data);

      // Advance to verification step
      nextStep();
    } catch (error) {
      let errorMsg = "Registration failed. Please try again.";

      if (error instanceof AxiosError) {
        errorMsg =
          (error.response?.data as Record<string, unknown>)?.message?.toString() ||
          error.message ||
          errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setSubmitError(errorMsg);
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verification step uses the wider two-column card.
  const width = currentStep === "verification" ? "5xl" : "2xl";

  useEffect(() => {
    if (postSignupRole) {
      localStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, postSignupRole);
    }
  }, [postSignupRole]);

  if (isPostSignupMode) {
    return (
      <SignupLayout width="5xl">
        <div className="flex w-full flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Account Created Successfully
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">{formatRoleLabel(postSignupRole ?? "creator")}</span>
            </p>
            {postSignupEmail && (
              <p className="mt-1 text-sm text-muted-foreground">
                Email: <span className="font-medium text-foreground">{postSignupEmail}</span>
              </p>
            )}
          </div>
          <VerificationStep
            onBack={() => router.push("/signup")}
            onStart={() => router.push("/login")}
          />
        </div>
      </SignupLayout>
    );
  }

  return (
    <SignupLayout width={width}>
      {currentStep === "role-selection" && (
        <RoleSelectionStep
          selectedRole={selectedRole}
          onSelectRole={selectRole}
          onNext={nextStep}
          showBack={false}
        />
      )}

      {currentStep === "credentials" && (
        <div className="flex w-full flex-col items-center gap-10">
          <CredentialsStep
            onBack={previousStep}
            onNext={handleCredentialsSubmit}
            initialData={credentials || undefined}
            isLoading={isSubmitting}
          />
          {submitError && (
            <div className="w-full max-w-[428px] rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
        </div>
      )}

      {currentStep === "verification" && (
        <VerificationStep
          onBack={canGoPrevious ? previousStep : undefined}
          onStart={nextStep}
        />
      )}

      {currentStep === "completion" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="size-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Welcome to Mondial!
            </h2>
            <p className="text-sm text-muted-foreground">
              Your account is ready. Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}
    </SignupLayout>
  );
}

