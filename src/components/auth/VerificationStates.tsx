"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationStatus = "loading" | "success" | "error" | "expired";

interface VerificationStatesProps {
  status: VerificationStatus;
  message?: string;
  email?: string;
  onResend?: () => void;
  isResending?: boolean;
  resendDisabled?: boolean;
}

export default function VerificationStates({
  status,
  message = "",
  email = "",
  onResend,
  isResending = false,
  resendDisabled = false,
}: VerificationStatesProps) {
  if (status === "loading") {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verifying Email</h2>
        <p className="text-gray-600">
          {message || "Please wait while we confirm your email address..."}
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
        <p className="text-gray-600">
          {message || "Your email has been successfully verified."}
        </p>
        <div className="pt-2">
          <p className="text-sm text-gray-500">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="w-16 h-16 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Link Expired</h2>
        <p className="text-gray-600">
          {message || "Your confirmation link has expired."}
        </p>
        {email && (
          <p className="text-sm text-gray-500">
            We can send a new confirmation link to <strong>{email}</strong>
          </p>
        )}
        {onResend && (
          <div className="pt-4">
            <Button
              onClick={onResend}
              disabled={isResending || resendDisabled}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend Confirmation Link"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // error state (default)
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="w-16 h-16 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">
        Verification Failed
      </h2>
      <p className="text-gray-600">
        {message || "Invalid or expired confirmation link."}
      </p>
      {email && (
        <p className="text-sm text-gray-500">
          Confirmation link sent to <strong>{email}</strong>
        </p>
      )}
      {onResend && (
        <div className="pt-4 space-y-2">
          <p className="text-sm text-gray-600">
            Didn't receive the email or link expired?
          </p>
          <Button
            onClick={onResend}
            disabled={isResending || resendDisabled}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isResending ? "Sending..." : "Resend Confirmation Link"}
          </Button>
        </div>
      )}
    </div>
  );
}
