"use client";

import React from "react";

interface EmailVerificationLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function EmailVerificationLayout({
  children,
  className = "",
}: EmailVerificationLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div
        className={`w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:shadow-2xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
