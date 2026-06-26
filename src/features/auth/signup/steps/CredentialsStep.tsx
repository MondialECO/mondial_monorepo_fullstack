"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignupTitle } from "../components";
import {
  credentialsSchema,
  type CredentialsFormData,
} from "../constants/credentials-validation";

interface CredentialsStepProps {
  onBack?: () => void;
  onNext?: (data: CredentialsFormData) => void | Promise<void>;
  initialData?: Partial<CredentialsFormData>;
  isLoading?: boolean;
}

/**
 * Credentials Step — Email + Password entry for account creation.
 * Figma: frame 3655
 */
export function CredentialsStep({
  onBack,
  onNext,
  initialData,
  isLoading = false,
}: CredentialsStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    mode: "onChange",
    defaultValues: initialData || {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = (data: CredentialsFormData) => {
    onNext?.(data);
  };

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <SignupTitle
        badge="Account Setup"
        title="Create Your Account"
        subtitle="Set up your credentials to access Mondial ecosystem."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-[428px] flex flex-col gap-8"
      >
        {/* Full Name Field */}
        <div className="flex flex-col gap-3">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            {...register("fullName")}
            className="h-12 rounded-lg border-[1.5px]"
            aria-invalid={errors.fullName ? "true" : "false"}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            className="h-12 rounded-lg border-[1.5px]"
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-3">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              {...register("password")}
              className="h-12 rounded-lg border-[1.5px] pr-12"
              aria-invalid={errors.password ? "true" : "false"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
          {password && !errors.password && (
            <p className="text-xs text-muted-foreground">
              ✓ Password meets requirements
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="flex flex-col gap-3">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              {...register("confirmPassword")}
              className="h-12 rounded-lg border-[1.5px] pr-12"
              aria-invalid={errors.confirmPassword ? "true" : "false"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 pt-4">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              size="lg"
              disabled={isLoading}
            >
              Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            size="lg"
            className="px-6"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
