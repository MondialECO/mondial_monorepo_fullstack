"use client";

import { useState } from "react";
import { useAuth } from "@/app/_providers/AuthProvider";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent form submission during provider hydration
    if (authLoading) {
      setError("Please wait while we initialize the authentication system...");
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-gray-600">
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
              className="block text-sm font-medium text-gray-700 mb-1.5"
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
                w-full px-4 py-3 rounded-lg border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
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
              className="block text-sm font-medium text-gray-700 mb-1.5"
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
                  w-full px-4 py-3 rounded-lg border border-gray-300 
                  focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
              bg-black text-white font-medium
              py-3.5 rounded-lg
              hover:bg-gray-900 transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-sm
            `}
          >
            {(isLoading || authLoading) && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading ? "Signing in..." : authLoading ? "Loading..." : "Sign in"}
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center text-sm text-gray-600 space-y-2 pt-4">
          <div>
            <a href="/forgot-password" className="text-black hover:underline font-medium">
              Forgot password?
            </a>
          </div>
          <div>
            Don&#39;t have an account?{" "}
            <a href="/signup" className="text-black font-medium hover:underline">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}