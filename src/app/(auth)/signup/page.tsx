"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerApi } from "@/lib/api-auth";
import { useAuth } from "@/app/_providers/AuthProvider";
import { resolvePostLoginRedirect } from "@/lib/roles";
import {
  SIGNUP_ROLE_STORAGE_KEY,
  formatRoleLabel,
  mapSignupRoleToBackendRole,
} from "@/lib/signup-role";
import { useTranslation } from "@/hooks/useTranslation";

interface PasswordRule {
  id: string;
  label: string;
  errorMessage: string;
  isValid: (pwd: string) => boolean;
}

export default function Signup() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading, establishSession } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleHydrated, setRoleHydrated] = useState(false);

  const passwordRules: PasswordRule[] = useMemo(() => [
    {
      id: "minLength",
      label: t('auth.signup.rules.minLength', 'At least 6 characters'),
      errorMessage: t('auth.signup.rules.minLengthError', 'Password must be at least 6 characters.'),
      isValid: (pwd: string) => pwd.length >= 6,
    },
    {
      id: "uppercase",
      label: t('auth.signup.rules.uppercase', 'At least one uppercase letter'),
      errorMessage: t('auth.signup.rules.uppercaseError', 'Password must contain an uppercase letter.'),
      isValid: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      id: "lowercase",
      label: t('auth.signup.rules.lowercase', 'At least one lowercase letter'),
      errorMessage: t('auth.signup.rules.lowercaseError', 'Password must contain a lowercase letter.'),
      isValid: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      id: "digit",
      label: t('auth.signup.rules.digit', 'At least one digit'),
      errorMessage: t('auth.signup.rules.digitError', 'Password must contain a digit.'),
      isValid: (pwd: string) => /[0-9]/.test(pwd),
    },
  ], [t]);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (user && !authLoading) {
      const destination = resolvePostLoginRedirect(user);
      router.replace(destination);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const roleId = localStorage.getItem(SIGNUP_ROLE_STORAGE_KEY);
    const resolvedRole = roleId || "creator";
    setSelectedRoleId(resolvedRole);
    if (!roleId) {
      localStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, resolvedRole);
    }
    setRoleHydrated(true);
  }, []);

  const roleLabel = useMemo(
    () => {
      const rawRole = selectedRoleId ?? "creator";
      const roleKey = rawRole === "service-provider" ? "serviceProvider" : rawRole;
      return t(`auth.roles.${roleKey}.name`, formatRoleLabel(rawRole));
    },
    [selectedRoleId, t]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setErrorMsg(t('auth.signup.selectRoleFirst', 'Please select a role first.'));
      router.push("/signup/role");
      return;
    }

    // Pre-submit validation: verify each password rule matches backend policy
    const unmet = passwordRules.filter((rule) => !rule.isValid(password));
    if (unmet.length > 0) {
      const messages = unmet.map((r) => r.errorMessage);
      setPasswordErrors(messages);
      setErrorMsg(messages[0]);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setPasswordErrors([]);

    try {
      const model = {
        fullName,
        email,
        password,
        role: mapSignupRoleToBackendRole(selectedRoleId),
      };

      const response = await registerApi(model);
      const token = response.data?.token ?? response.token;
      const authUser = response.data?.user ?? response.user;

      if (!token || !authUser) {
        setErrorMsg(t('auth.signup.sessionInitFailed', 'Registration succeeded but session initialization failed. Please log in.'));
        router.replace("/login");
        return;
      }

      await establishSession({ token, user: authUser });
      router.replace("/onboarding");
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as Record<string, any>;
      const resData = axiosErr?.response?.data;
      const fieldErrors = resData?.data || resData?.errors;
      const pwFieldErrors = fieldErrors?.Password || fieldErrors?.password;

      if (Array.isArray(pwFieldErrors) && pwFieldErrors.length > 0) {
        setPasswordErrors(pwFieldErrors);
      } else if (typeof pwFieldErrors === "string") {
        setPasswordErrors([pwFieldErrors]);
      }

      setErrorMsg(resData?.message || t('auth.signup.registrationFailed', 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while hydrating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="text-sm text-muted-foreground">{t('auth.signup.loading', 'Loading...')}</div>
      </div>
    );
  }

  // If already logged in, redirect silently (useEffect handles it)
  if (user) {
    return null;
  }

  if (!roleHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="text-sm text-muted-foreground">{t('auth.signup.loadingFlow', 'Loading signup flow...')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
          {t('auth.signup.title', 'Create Account')}
        </h1>
        <p className="text-center text-muted-foreground mb-2">
          {t('auth.signup.subtitle', 'Join our community today')}
        </p>
        <p className="text-center text-sm text-primary mb-6">
          {t('auth.signup.selectedRole', 'Selected role:')}{" "}
          <span className="font-semibold">{roleLabel}</span>{" "}
          <Link href="/signup/role" className="underline underline-offset-2">
            {t('auth.signup.change', 'Change')}
          </Link>
        </p>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('auth.signup.fullNameLabel', 'Full Name')}</Label>
            <Input
              type="text"
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t('auth.signup.emailLabel', 'Email Address')}</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('auth.signup.passwordLabel', 'Password')}</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordErrors([]);
              }}
              required
              aria-invalid={passwordErrors.length > 0}
              className={passwordErrors.length > 0 ? "border-red-500 focus-visible:ring-red-500" : ""}
            />

            {/* Password Rules Checklist */}
            <div className="mt-2 text-xs space-y-1 bg-muted/40 p-2.5 rounded-md border border-border">
              <p className="font-medium text-foreground text-xs mb-1">
                {t('auth.signup.requirementsTitle', 'Password requirements:')}
              </p>
              <ul className="space-y-1">
                {passwordRules.map((rule) => {
                  const isMet = rule.isValid(password);
                  return (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isMet
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className="inline-block w-4 text-center font-bold">
                        {isMet ? "✓" : "○"}
                      </span>
                      <span>{rule.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Field-level Password Errors */}
            {passwordErrors.length > 0 && (
              <div className="mt-2 space-y-1 text-xs text-red-600 dark:text-red-400 font-medium" data-testid="password-errors">
                {passwordErrors.map((err, idx) => (
                  <p key={idx} className="flex items-center gap-1">
                    <span>{'\u26A0'}</span> {err}
                  </p>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t('auth.signup.submitting', 'Creating Account...')
              : t('auth.signup.submit', 'Sign Up')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.signup.alreadyHaveAccount', 'Already have an account?')}{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            {t('auth.signup.logIn', 'Log in')}
          </Link>
        </div>
      </div>
    </div>
  );
}
