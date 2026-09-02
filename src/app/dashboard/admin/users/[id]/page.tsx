"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/app/_providers/AuthProvider";
import { isSuperAdmin } from "@/lib/roles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  User as UserIcon,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  Briefcase,
  Layers,
  TrendingUp,
  DollarSign,
  Award,
  BookOpen,
  Globe,
  Plus,
  Trash2,
  FileCheck
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminErrorState,
} from "@/components/admin/shared";

interface AdminUserDetail {
  userId: string;
  displayName: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  address: string | null;
  city: string | null;
  country: string | null;
  imagePath: string | null;
  bio: string | null;
  title: string | null;
  roles: string[];
  joinedAt: string;
  lastLogin: string | null;
  isLocked: boolean;
  lockoutEnd: string | null;
  onboardingPhase: number;

  kycStatus: string;
  kycIdentityVerified: boolean;
  kycFaceVerified: boolean;
  kycVerifiedAt: string | null;
  kycRejectionReason: string | null;

  spVerified?: boolean;
  spVerificationStatus?: string;
  spTrustScore?: number;

  investorFinanceVerified?: boolean;
  investorFinanceStatus?: string;

  universalProfile?: {
    publicSlug?: string;
    headline?: string;
    bio?: string;
    professionalOverview?: string;
    skills: string[];
    expertiseDomains: string[];
    languages: string[];
    experienceCount: number;
    educationCount: number;
    portfolioItemCount: number;
  };

  roleActivity: {
    creatorIdeasCount: number;
    entrepreneurCompaniesCount: number;
    investorMatchesCount: number;
    investorInvestmentsCount: number;
    serviceProviderListingsCount: number;
    serviceProviderWorkroomsCount: number;
  };
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params?.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canSeePrivileged = isSuperAdmin(currentUser);
  const isTargetPrivileged = user?.roles?.some((r) => r.toLowerCase() === "superadmin" || r.toLowerCase() === "admin") ?? false;
  const isTargetSuperAdmin = user?.roles?.some((r) => r.toLowerCase() === "superadmin") ?? false;

  // Modals state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [roleToAdd, setRoleToAdd] = useState("Creator");
  const [isRemoveRoleModalOpen, setIsRemoveRoleModalOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminUserDetail>(`/admin/user/${userId}`);
      if (res.data) {
        setUser(res.data);
      }
    } catch (err: unknown) {
      console.error("Error loading user details:", err);
      setError("User not found or failed to load user profile.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleToggleLock = async () => {
    if (!user) return;
    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (user.isLocked) {
        // Unlock
        const res = await api.post("/admin/enable-login", { userId: user.userId });
        setActionSuccess(res.data?.message || "User login restored.");
        setUser((prev) => prev ? { ...prev, isLocked: false, lockoutEnd: null } : null);
      } else {
        // Lock
        const res = await api.post("/admin/disable-login", { 
          userId: user.userId, 
          reason: lockReason.trim() || "Administrative review suspension." 
        });
        setActionSuccess(res.data?.message || "User account suspended.");
        setUser((prev) => prev ? { ...prev, isLocked: true } : null);
      }
      setIsLockModalOpen(false);
      setLockReason("");
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.response?.data?.message || "Action failed.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAddRole = async () => {
    if (!user || !roleToAdd) return;
    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.post(`/admin/users/${user.userId}/roles/add`, { role: roleToAdd });
      setActionSuccess(res.data?.message || `Role '${roleToAdd}' added.`);
      if (res.data?.roles) {
        setUser((prev) => prev ? { ...prev, roles: res.data.roles } : null);
      }
      setIsAddRoleModalOpen(false);
    } catch (err: any) {
      setActionError(err.response?.data?.error || "Failed to add role.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!user || !roleToRemove) return;
    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.post(`/admin/users/${user.userId}/roles/remove`, { role: roleToRemove });
      setActionSuccess(res.data?.message || `Role '${roleToRemove}' removed.`);
      if (res.data?.roles) {
        setUser((prev) => prev ? { ...prev, roles: res.data.roles } : null);
      }
      setIsRemoveRoleModalOpen(false);
      setRoleToRemove("");
    } catch (err: any) {
      setActionError(err.response?.data?.error || "Failed to remove role.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const isSelf = currentUser?.id === user?.userId;

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "superadmin":
        return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400 font-bold shadow-xs";
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300";
      case "creator":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300";
      case "entrepreneur":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300";
      case "investor":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300";
      case "serviceprovider":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground space-y-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium">Loading user profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <AdminErrorState
          title="User Not Found"
          message={error || "The requested user account could not be found in directory storage."}
        />
        <div className="text-center">
          <Button onClick={() => router.push("/dashboard/admin/users")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to User Directory
          </Button>
        </div>
      </div>
    );
  }

  // Access gate: Normal Admin cannot view SuperAdmin user profiles
  if (!canSeePrivileged && isTargetSuperAdmin) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <Shield className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          This user profile is restricted. You do not have sufficient privileges to view this account.
        </p>
        <Button onClick={() => router.push("/dashboard/admin/users")} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to User Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Shared Admin Page Header */}
      <AdminPageHeader
        title="User Account Profile"
        description={user.email ? `${user.email} • ID: ${user.userId}` : `User ID: ${user.userId}`}
        badge={user.roles?.includes("SuperAdmin") ? "SUPERADMIN" : "USER"}
        icon={UserIcon}
        backHref="/dashboard/admin/users"
        backLabel="Back to User Directory"
        actions={
          isSelf ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 text-xs">
              Viewing Your Own Admin Account (Self-Protection Active)
            </Badge>
          ) : undefined
        }
      />

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm rounded-lg border border-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-sm rounded-lg border border-rose-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            {actionError}
          </span>
          <button onClick={() => setActionError(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main User Card Header */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-2xl border-2 border-primary/20 shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">{user.displayName}</h2>
                  <AdminStatusBadge status={user.isLocked ? "suspended" : "active"} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <span>ID: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{user.userId}</code></span>
                  <span>•</span>
                  <span>Joined: {new Date(user.joinedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Country: {user.country || "Not specified"}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
              {/* Suspend / Restore — hidden for privileged targets when viewer is not SuperAdmin */}
              {(canSeePrivileged || !isTargetPrivileged) && (
                <>
                  {user.isLocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setIsUnlocking(true); setIsLockModalOpen(true); }}
                      disabled={isSelf}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <Unlock className="w-3.5 h-3.5 mr-1.5" /> Restore Login Access
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setIsUnlocking(false); setIsLockModalOpen(true); }}
                      disabled={isSelf}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" /> Suspend Login
                    </Button>
                  )}
                </>
              )}

              {/* Public Profile link */}
              {user.universalProfile?.publicSlug && (
                <Link
                  href={`/profile/${user.universalProfile.publicSlug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-muted transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Public Profile
                </Link>
              )}
            </div>
          </div>

          {/* Role Badges Bar */}
          <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Roles:
              </span>
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((r) => (
                  <Badge
                    key={r}
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-1 border ${getRoleBadgeVariant(r)}`}
                  >
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No roles assigned</span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddRoleModalOpen(true)}
              className="text-xs h-7 gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 rounded-none h-auto gap-4">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-1 font-semibold text-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-1 font-semibold text-sm"
          >
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-1 font-semibold text-sm"
          >
            Universal Profile
          </TabsTrigger>
          <TabsTrigger
            value="verification"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-1 font-semibold text-sm"
          >
            Verifications
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-1 font-semibold text-sm"
          >
            Role Activity
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-1 font-semibold text-sm"
          >
            Financial Summary
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Account Identity</CardTitle>
                <CardDescription className="text-xs">Basic registration and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium text-foreground">{user.displayName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-medium text-foreground">{user.userName || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    {user.email}
                    {user.emailConfirmed ? (
                      <span title="Email Confirmed"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></span>
                    ) : (
                      <span title="Email Unconfirmed"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Phone Number:</span>
                  <span className="font-medium text-foreground">{user.phoneNumber || "Not registered"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Onboarding Phase:</span>
                  <Badge variant="secondary" className="text-xs">Phase {user.onboardingPhase}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Location & Timestamps</CardTitle>
                <CardDescription className="text-xs">Geographic and session metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium text-foreground">{user.address || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">City:</span>
                  <span className="font-medium text-foreground">{user.city || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="font-medium text-foreground">{user.country || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Account Created:</span>
                  <span className="font-medium text-foreground">{new Date(user.joinedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span className="font-medium text-foreground">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never / Pre-recorded"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: ROLES & PERMISSIONS */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Role Governance</CardTitle>
                  <CardDescription className="text-xs">
                    Safely add or remove platform roles without deleting historical business data.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddRoleModalOpen(true)} className="text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {user.roles.map((role) => (
                  <div key={role} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-xs font-semibold px-3 py-1 border ${getRoleBadgeVariant(role)}`}>
                        {role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {role === "Admin" ? "Full administrative authority over platform operations." :
                         role === "Creator" ? "Can build AI project studios, ideas, and negotiate buyouts." :
                         role === "Entrepreneur" ? "Can manage ventures, cap tables, data rooms, and deals." :
                         role === "Investor" ? "Can discover vetted deals, request data rooms, and invest." :
                         role === "ServiceProvider" ? "Can publish services, submit proposals, and complete workrooms." : ""}
                      </span>
                    </div>

                    {/* Remove button — hidden for privileged roles when viewer is not SuperAdmin */}
                    {(canSeePrivileged || (role !== "Admin" && role !== "SuperAdmin")) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRoleToRemove(role);
                          setIsRemoveRoleModalOpen(true);
                        }}
                        disabled={
                          (isSelf && (role === "Admin" || role === "SuperAdmin"))
                        }
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove Role
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: UNIVERSAL PROFILE */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Universal Profile (Read-Only)</CardTitle>
                  <CardDescription className="text-xs">
                    Live public profile representation shared across all user roles.
                  </CardDescription>
                </div>
                {user.universalProfile?.publicSlug && (
                  <Badge variant="outline" className="text-xs">
                    Slug: @{user.universalProfile.publicSlug}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Headline</label>
                <p className="mt-1 font-medium text-foreground">
                  {user.universalProfile?.headline || "No headline provided."}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Bio / Overview</label>
                <p className="mt-1 text-foreground whitespace-pre-wrap">
                  {user.universalProfile?.bio || user.universalProfile?.professionalOverview || "No bio entered."}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Skills</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {user.universalProfile?.skills && user.universalProfile.skills.length > 0 ? (
                    user.universalProfile.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Expertise Domains</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {user.universalProfile?.expertiseDomains && user.universalProfile.expertiseDomains.length > 0 ? (
                    user.universalProfile.expertiseDomains.map((d) => (
                      <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border flex gap-6 text-xs text-muted-foreground">
                <span>Experience Items: <strong className="text-foreground">{user.universalProfile?.experienceCount ?? 0}</strong></span>
                <span>Education Items: <strong className="text-foreground">{user.universalProfile?.educationCount ?? 0}</strong></span>
                <span>Portfolio Items: <strong className="text-foreground">{user.universalProfile?.portfolioItemCount ?? 0}</strong></span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: VERIFICATIONS */}
        <TabsContent value="verification" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Universal Phase 1 KYC */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Universal Phase 1 KYC</span>
                  <Badge variant="outline">{user.kycStatus}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Identity Doc:</span>
                  <span className="font-semibold text-foreground">{user.kycIdentityVerified ? "Verified" : "Unverified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Face/Selfie:</span>
                  <span className="font-semibold text-foreground">{user.kycFaceVerified ? "Verified" : "Unverified"}</span>
                </div>
                {user.kycRejectionReason && (
                  <div className="p-2 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded mt-2">
                    <strong>Rejection Reason:</strong> {user.kycRejectionReason}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Provider Verification */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Provider Verification</span>
                  <Badge variant="outline">{user.spVerificationStatus || "N/A"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trust Score:</span>
                  <span className="font-semibold text-foreground">{user.spTrustScore != null ? `${user.spTrustScore}/100` : "—"}</span>
                </div>
                {user.roles.includes("ServiceProvider") && (
                  <Link
                    href="/dashboard/admin/serviceproviders"
                    className="inline-block mt-2 text-primary hover:underline font-semibold"
                  >
                    Open Provider Review Queue →
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Investor Finance Verification */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Investor Finance</span>
                  <Badge variant="outline">{user.investorFinanceVerified ? "Verified" : "Unverified"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proof of Funds:</span>
                  <span className="font-semibold text-foreground">{user.investorFinanceVerified ? "Approved" : "Pending / None"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: ROLE ACTIVITY */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.roles.includes("Creator") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" /> Creator Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Business Ideas / Pitches:</span>
                    <span className="font-bold text-foreground">{user.roleActivity.creatorIdeasCount}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.roles.includes("Entrepreneur") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" /> Entrepreneur Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Registered Companies:</span>
                    <span className="font-bold text-foreground">{user.roleActivity.entrepreneurCompaniesCount}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.roles.includes("Investor") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" /> Investor Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Deal Matches:</span>
                    <span className="font-bold text-foreground">{user.roleActivity.investorMatchesCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Active Investments:</span>
                    <span className="font-bold text-foreground">{user.roleActivity.investorInvestmentsCount}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.roles.includes("ServiceProvider") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" /> Service Provider Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Published Services:</span>
                    <span className="font-bold text-foreground">{user.roleActivity.serviceProviderListingsCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Workrooms & Engagements:</span>
                    <span className="font-bold text-foreground">{user.roleActivity.serviceProviderWorkroomsCount}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB 6: FINANCIAL SUMMARY */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Financial & Transaction Summary</CardTitle>
              <CardDescription className="text-xs">
                Auditable financial activity. Ledger balances cannot be manually altered.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-4 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Workroom Escrow Engagements</div>
                  <div className="text-lg font-bold">{user.roleActivity.serviceProviderWorkroomsCount} Active / Completed</div>
                </div>
                <Link
                  href="/dashboard/admin/disputes"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View Disputes Queue →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SUSPEND / RESTORE LOGIN MODAL */}
      <Dialog open={isLockModalOpen} onOpenChange={setIsLockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isUnlocking ? (
                <>
                  <Unlock className="w-5 h-5 text-emerald-600" /> Restore User Login Access
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-rose-600" /> Suspend User Login
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isUnlocking
                ? `Restore authentication for ${user.displayName}. The user will be able to log in immediately.`
                : `Suspending ${user.displayName} blocks login access across the entire platform. Their profile, projects, and workrooms remain safely preserved.`}
            </DialogDescription>
          </DialogHeader>

          {!isUnlocking && (
            <div className="space-y-2 py-2">
              <label className="text-xs font-semibold text-foreground">
                Suspension Reason (Required):
              </label>
              <Input
                placeholder="e.g. Terms violation, dispute investigation..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsLockModalOpen(false)}
              disabled={isSubmittingAction}
            >
              Cancel
            </Button>
            <Button
              variant={isUnlocking ? "default" : "destructive"}
              onClick={handleToggleLock}
              disabled={isSubmittingAction || (!isUnlocking && !lockReason.trim())}
            >
              {isSubmittingAction ? "Processing..." : isUnlocking ? "Confirm Restore" : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD ROLE MODAL */}
      <Dialog open={isAddRoleModalOpen} onOpenChange={setIsAddRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Assign Platform Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new role to {user.displayName}. All existing roles and data will be preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">Select Role:</label>
            <select
              value={roleToAdd}
              onChange={(e) => setRoleToAdd(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Creator" disabled={user.roles.includes("Creator")}>
                Creator {user.roles.includes("Creator") ? "(Already Assigned)" : ""}
              </option>
              <option value="Entrepreneur" disabled={user.roles.includes("Entrepreneur")}>
                Entrepreneur {user.roles.includes("Entrepreneur") ? "(Already Assigned)" : ""}
              </option>
              <option value="Investor" disabled={user.roles.includes("Investor")}>
                Investor {user.roles.includes("Investor") ? "(Already Assigned)" : ""}
              </option>
              <option value="ServiceProvider" disabled={user.roles.includes("ServiceProvider")}>
                Service Provider {user.roles.includes("ServiceProvider") ? "(Already Assigned)" : ""}
              </option>
              {isSuperAdmin(currentUser) && (
                <>
                  <option value="Admin" disabled={user.roles.includes("Admin")}>
                    Admin {user.roles.includes("Admin") ? "(Already Assigned)" : ""}
                  </option>
                  <option value="SuperAdmin" disabled={user.roles.includes("SuperAdmin")}>
                    SuperAdmin {user.roles.includes("SuperAdmin") ? "(Already Assigned)" : ""}
                  </option>
                </>
              )}
            </select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAddRoleModalOpen(false)}
              disabled={isSubmittingAction}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={isSubmittingAction}>
              {isSubmittingAction ? "Adding..." : "Add Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REMOVE ROLE MODAL */}
      <Dialog open={isRemoveRoleModalOpen} onOpenChange={setIsRemoveRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Remove Role: {roleToRemove}
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-700 dark:text-rose-300 font-medium">
              Role access will be removed. Existing historical data, companies, and completed transactions will be preserved for audit consistency.
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground py-2">
            Are you sure you want to remove the <strong className="text-foreground">{roleToRemove}</strong> role from <strong>{user.displayName}</strong>?
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsRemoveRoleModalOpen(false)}
              disabled={isSubmittingAction}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveRole}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? "Removing..." : "Confirm Removal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
