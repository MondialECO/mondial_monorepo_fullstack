"use client";

import React from "react";
import { Mail } from "lucide-react";

interface EmailDisplayProps {
  email: string;
  label?: string;
}

/**
 * Masks email for privacy display (e.g., f***@gmail.com)
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;

  const firstChar = localPart[0];
  const maskedLocal = firstChar + "*".repeat(Math.max(2, localPart.length - 1));
  return `${maskedLocal}@${domain}`;
}

export default function EmailDisplay({
  email,
  label = "Confirmation email sent to:",
}: EmailDisplayProps) {
  const maskedEmail = maskEmail(email);

  return (
    <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
      <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
      <div className="text-left">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900">{maskedEmail}</p>
      </div>
    </div>
  );
}
