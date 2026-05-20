"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ResendEmailButtonProps {
  onResend: () => Promise<void>;
  cooldownSeconds?: number;
  className?: string;
}

export default function ResendEmailButton({
  onResend,
  cooldownSeconds = 60,
  className = "w-full",
}: ResendEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handleResend = async () => {
    try {
      setIsLoading(true);
      await onResend();
      // Start cooldown after successful resend
      setCooldownRemaining(cooldownSeconds);
    } catch (error) {
      console.error("Resend failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || cooldownRemaining > 0;

  return (
    <Button
      onClick={handleResend}
      disabled={isDisabled}
      className={`${className} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
    >
      <RefreshCw
        className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
      />
      {cooldownRemaining > 0
        ? `Resend in ${cooldownRemaining}s`
        : isLoading
          ? "Sending..."
          : "Resend Confirmation Email"}
    </Button>
  );
}
