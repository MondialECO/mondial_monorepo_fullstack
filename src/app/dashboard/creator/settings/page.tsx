"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Lock, User, ExternalLink, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import api from "@/lib/axios";

interface AccountDetails {
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  user?: string;
  createdAt?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAccount = async () => {
      setIsLoadingAccount(true);
      try {
        const res = await api.get("/auth/account");
        if (isMounted && res.data?.data) {
          setAccountDetails(res.data.data);
        }
      } catch {
        // Fallback gracefully to AuthProvider user
      } finally {
        if (isMounted) setIsLoadingAccount(false);
      }
    };
    fetchAccount();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ type: "error", message: "Please enter your current password." });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        setPasswordStatus({ type: "success", message: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordStatus({ type: "error", message: res.data?.message || "Failed to change password." });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPasswordStatus({
        type: "error",
        message: axiosErr.response?.data?.message || "Incorrect current password or server error.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayName = accountDetails?.name || user?.name || "Creator";
  const displayEmail = accountDetails?.email || "";
  const displayRole = user?.role || "Creator";
  const memberSince = accountDetails?.createdAt
    ? new Date(accountDetails.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="w-full max-w-[1136px] mx-auto pb-8 md:pb-12 px-4 md:px-0 font-sans">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
          {/* Header Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-xl md:text-3xl font-extrabold tracking-tight">
                Account & Security Settings
              </h1>
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                {displayRole}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs md:text-sm font-normal">
              Manage your verified credentials, security, and profile access.
            </p>
          </div>

          {/* Section 1: Canonical Profile & Identity */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
              <div>
                <h2 className="text-foreground text-base md:text-lg font-bold">
                  Profile & Identity
                </h2>
                <p className="text-muted-foreground text-xs md:text-sm font-normal">
                  Your public bio, experiences, skills, and credentials are governed by the Universal Profile system.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 self-start sm:self-center border-border">
                <Link href="/dashboard/profile/edit">
                  <User className="h-4 w-4" />
                  Edit Universal Profile
                  <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
                </Link>
              </Button>
            </div>

            {/* Read-Only Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Full Name
                </Label>
                <p className="text-sm font-semibold text-foreground">
                  {displayName}
                </p>
              </div>

              <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Account Email
                </Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground truncate">
                    {displayEmail || "Verified Account Email"}
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  System Role
                </Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    {displayRole} Account
                  </p>
                </div>
              </div>

              {memberSince && (
                <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    Member Since
                  </Label>
                  <p className="text-sm font-semibold text-foreground">
                    {memberSince}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Security & Password */}
          <div className="space-y-4 pt-4 border-t border-border/70">
            <div>
              <h2 className="text-foreground text-base md:text-lg font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Change Password
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm font-normal">
                Update your account password securely.
              </p>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${
                  passwordStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                {passwordStatus.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <Label htmlFor="current-password" className="text-xs font-semibold text-foreground">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-10 bg-muted/40 border-border/70 text-sm focus:border-primary"
                  autoComplete="current-password"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-10 bg-muted/40 border-border/70 text-sm focus:border-primary"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-semibold text-foreground">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="h-10 bg-muted/40 border-border/70 text-sm focus:border-primary"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUpdatingPassword}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl px-6 h-10 text-sm"
              >
                {isUpdatingPassword ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
