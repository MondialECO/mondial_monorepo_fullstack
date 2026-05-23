"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerApi } from "@/lib/api-auth";
import { useAuth } from "@/app/_providers/AuthProvider";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/roles";
import {
  SIGNUP_ROLE_STORAGE_KEY,
  formatRoleLabel,
  mapSignupRoleToBackendRole,
} from "@/lib/signup-role";

export default function Signup() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleHydrated, setRoleHydrated] = useState(false);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (user && !authLoading) {
      const dashboardRoute = ROLE_DASHBOARD_ROUTES[user.role];
      router.replace(dashboardRoute);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const roleId = localStorage.getItem(SIGNUP_ROLE_STORAGE_KEY);
    if (!roleId) {
      router.replace("/signup/role");
      return;
    }
    setSelectedRoleId(roleId);
    setRoleHydrated(true);
  }, [router]);

  const roleLabel = useMemo(
    () => formatRoleLabel(selectedRoleId ?? "creator"),
    [selectedRoleId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setErrorMsg("Please select a role first.");
      router.push("/signup/role");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const model = {
        fullName,
        email,
        password,
        role: mapSignupRoleToBackendRole(selectedRoleId),
      };

      const response = await registerApi(model);
      const onboardingToken = response.data?.onboardingToken;

      if (!onboardingToken) {
        setErrorMsg("Registration succeeded but token generation failed. Please try again.");
        return;
      }

      router.push(
        `/signup/onboarding?token=${encodeURIComponent(onboardingToken)}`
      );
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as Record<string, any>;
      setErrorMsg(axiosErr?.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while hydrating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show "Already logged in" message with redirect and logout options
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Already logged in
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name}!
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => router.replace(ROLE_DASHBOARD_ROUTES[user.role])}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              size="lg"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={logout}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
              size="lg"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!roleHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="text-sm text-muted-foreground">Loading signup flow...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Create Account</h1>
        <p className="text-center text-muted-foreground mb-2">Join our community today</p>
        <p className="text-center text-sm text-primary mb-6">
          Selected role: <span className="font-semibold">{roleLabel}</span>{" "}
          <Link href="/signup/role" className="underline underline-offset-2">
            Change
          </Link>
        </p>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              type="text"
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
