"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/app/_providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/roles";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export default function LoginPage() {
  const { login, isLoading: authLoading, user, logout } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect logged-in users based on phase
  useEffect(() => {
    if (user && !authLoading) {
      // If Phase < 1, redirect to onboarding (universal phase 1 gate)
      if ((user.onboardingPhase ?? 0) < 1) {
        router.replace("/onboarding");
      } else {
        // Phase >= 1, redirect to role dashboard
        const dashboardRoute = ROLE_DASHBOARD_ROUTES[user.role];
        router.replace(dashboardRoute);
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setError(firstError.message);
      return;
    }

    // Prevent form submission during provider hydration
    if (authLoading) {
      setError("Please wait while we initialize the authentication system...");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to login");
      setError(error.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while hydrating
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl shadow-lg border border-border text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If already logged in, redirect silently (useEffect handles it)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl shadow-lg border border-border">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pr-11"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-r-lg"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full gap-2"
            size="lg"
          >
            {(isLoading || authLoading) && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading ? "Signing in..." : authLoading ? "Loading..." : "Sign in"}
          </Button>
        </form>

        {/* Footer links */}
        <div className="text-center text-sm text-muted-foreground space-y-2 pt-4">
          <div>
            <Link href="/forgot-password" className="text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div>
            Don&#39;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}