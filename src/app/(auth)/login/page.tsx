"use client";

import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/app/_providers/AuthProvider";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
  const { login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-light)] dark:bg-background px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-card dark:bg-card rounded-2xl shadow-lg border border-border">
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
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
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              className={`
                w-full px-4 py-3 rounded-lg border border-border
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-all duration-200
                disabled:opacity-60
              `}
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
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className={`
                  w-full px-4 py-3 rounded-lg border border-border
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-all duration-200 pr-11
                  disabled:opacity-60
                `}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className={`
              w-full flex items-center justify-center gap-2
              bg-primary text-primary-foreground font-medium
              py-3.5 rounded-lg
              hover:opacity-90 transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-sm
            `}
          >
            {(isLoading || authLoading) && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading ? "Signing in..." : authLoading ? "Loading..." : "Sign in"}
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center text-sm text-muted-foreground space-y-2 pt-4">
          <div>
            <a href="/forgot-password" className="text-primary hover:underline font-medium">
              Forgot password?
            </a>
          </div>
          <div>
            Don&#39;t have an account?{" "}
            <a href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}