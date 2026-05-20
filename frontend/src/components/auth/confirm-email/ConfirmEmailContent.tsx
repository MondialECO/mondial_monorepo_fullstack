"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { confirmEmailApi, resendConfirmationEmailApi } from "../../../../service/auth/auth";
import EmailVerificationLayout from "@/components/auth/EmailVerificationLayout";
import VerificationStates from "@/components/auth/VerificationStates";
import EmailDisplay from "@/components/auth/EmailDisplay";
import Link from "next/link";

type VerificationStatus = "loading" | "success" | "error" | "expired";

export default function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);

  useEffect(() => {
    const confirmEmail = async () => {
      if (!userId || !token) {
        setStatus("error");
        setMessage("Invalid confirmation link.");
        return;
      }

      try {
        const response = await confirmEmailApi({
          UserId: userId,
          Token: token,
        });

        setStatus("success");
        setMessage(response.message || "Email confirmed successfully!");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "Email confirmation failed.";
        
        // Check if error indicates expired token
        if (errorMessage.toLowerCase().includes("expired")) {
          setStatus("expired");
          setMessage("Your confirmation link has expired. Request a new one.");
        } else {
          setStatus("error");
          setMessage(errorMessage);
        }
      }
    };

    confirmEmail();
  }, [userId, token, router]);

  const handleResend = async () => {
    if (!email) {
      setMessage("Email address not available. Please sign up again.");
      return;
    }

    setIsResending(true);
    setResendDisabled(true);

    try {
      await resendConfirmationEmailApi({ email });
      setMessage("Confirmation email sent! Check your inbox.");
      setStatus("loading");
      setMessage("New confirmation email sent. Check your inbox for the link.");
    } catch (err: any) {
      console.error("Resend error:", err);
      setMessage(err.response?.data?.message || "Failed to resend confirmation email.");
      setStatus("error");
      setResendDisabled(false);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <EmailVerificationLayout>
      <div className="space-y-6">
        <VerificationStates
          status={status}
          message={message}
          email={email}
          onResend={status === "error" || status === "expired" ? handleResend : undefined}
          isResending={isResending}
          resendDisabled={resendDisabled}
        />

        {email && (
          <EmailDisplay
            email={email}
            label="Confirmation email:"
          />
        )}

        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
          {status === "success" ? (
            <Link
              href="/login"
              className="text-center text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Go to Login
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="text-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Create new account
              </Link>
              <Link
                href="/login"
                className="text-center text-sm text-gray-600 hover:text-gray-700 hover:underline"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </EmailVerificationLayout>
  );
}
