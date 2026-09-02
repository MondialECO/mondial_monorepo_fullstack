"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/app/_providers/AuthProvider";
import { isSuperAdmin } from "@/lib/roles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Search, 
  Shield, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Filter,
  X
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminPagination,
  AdminEmptyState,
  AdminErrorState,
  AdminTable,
} from "@/components/admin/shared";

interface AdminUserListItem {
  userId: string;
  displayName: string;
  publicSlug: string | null;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  roles: string[];
  joinedAt: string;
  lastLogin: string | null;
  kycStatus: string;
  isLocked: boolean;
  lockoutEnd: string | null;
  onboardingPhase: number;
}

interface PagedResult {
  items: AdminUserListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const canSeePrivileged = isSuperAdmin(currentUser);

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedKyc, setSelectedKyc] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedRole) params.set("role", selectedRole);
      if (selectedKyc) params.set("kycStatus", selectedKyc);
      if (selectedStatus) params.set("loginStatus", selectedStatus);

      const res = await api.get<PagedResult>(`/admin/users?${params.toString()}`);
      if (res.data) {
        setUsers(res.data.items || []);
        setTotalItems(res.data.totalItems || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: unknown) {
      console.error("Error loading users:", err);
      setError("Failed to load user directory. Please ensure you are authorized as Admin.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedRole, selectedKyc, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Frontend-only visibility filter: hide SuperAdmin users from normal Admin
  const visibleUsers = useMemo(() => {
    if (canSeePrivileged) return users;
    return users.filter((u) => !u.roles?.some((r) => r.toLowerCase() === "superadmin"));
  }, [users, canSeePrivileged]);

  const hasActiveFilters = Boolean(search || selectedRole || selectedKyc || selectedStatus);

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedRole("");
    setSelectedKyc("");
    setSelectedStatus("");
    setPage(1);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "superadmin":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold";
      case "admin":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-medium";
      case "creator":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium";
      case "entrepreneur":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium";
      case "investor":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium";
      case "serviceprovider":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-medium";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <AdminPageHeader
        icon={Users}
        title="User Management"
        description="Search, inspect, and manage platform accounts, multi-role configurations, and access safety."
        badge={
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5">
            {totalItems.toLocaleString()} Users
          </Badge>
        }
      />

      {error && <AdminErrorState message={error} onRetry={fetchUsers} />}

      {/* Filter and Search Bar */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, user ID, slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-background"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Roles</option>
                <option value="Creator">Creator</option>
                <option value="Entrepreneur">Entrepreneur</option>
                <option value="Investor">Investor</option>
                <option value="ServiceProvider">Service Provider</option>
                {canSeePrivileged && (
                  <>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </>
                )}
              </select>
            </div>

            {/* Account Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="locked">Suspended / Locked Only</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-medium text-foreground flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-primary" /> KYC:
              </span>
              <button
                type="button"
                onClick={() => { setSelectedKyc(""); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs transition ${selectedKyc === "" ? "bg-primary text-primary-foreground font-semibold" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => { setSelectedKyc("Verified"); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs transition ${selectedKyc === "Verified" ? "bg-emerald-600 text-white font-semibold" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => { setSelectedKyc("Pending"); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs transition ${selectedKyc === "Pending" ? "bg-amber-600 text-white font-semibold" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => { setSelectedKyc("Rejected"); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs transition ${selectedKyc === "Rejected" ? "bg-rose-600 text-white font-semibold" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
              >
                Rejected
              </button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground ml-2"
                >
                  <X className="w-3 h-3 mr-1" /> Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <AdminTable
        title="User Accounts Directory"
        description={
          <span>
            Showing <strong className="font-bold text-foreground">{visibleUsers.length}</strong> users on current page
          </span>
        }
        loading={isLoading}
        empty={visibleUsers.length === 0}
        emptyTitle="No users found"
        emptyDescription="No users match the search and filter criteria."
        pagination={
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={isLoading}
          />
        }
      >
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-muted/30 text-muted-foreground uppercase font-medium border-b border-border/50">
            <tr>
              <th scope="col" className="px-5 py-3.5">User Profile</th>
              <th scope="col" className="px-4 py-3.5">Roles</th>
              <th scope="col" className="px-4 py-3.5">Country</th>
              <th scope="col" className="px-4 py-3.5">KYC Status</th>
              <th scope="col" className="px-4 py-3.5">Account Status</th>
              <th scope="col" className="px-4 py-3.5">Joined</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {visibleUsers.map((u) => (
              <tr key={u.userId} className="hover:bg-muted/20 transition-colors">
                {/* User Avatar + Name + Email */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary/20">
                      {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate max-w-xs">
                        {u.displayName || "Anonymous User"}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs font-mono">
                        {u.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Roles */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {u.roles && u.roles.length > 0 ? (
                      u.roles.map((r) => (
                        <Badge
                          key={r}
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.2 ${getRoleBadgeVariant(r)}`}
                        >
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* Country */}
                <td className="px-4 py-3.5 text-muted-foreground">
                  {u.country || "—"}
                </td>

                {/* KYC Status */}
                <td className="px-4 py-3.5">
                  <AdminStatusBadge status={u.kycStatus || "Not Started"} size="sm" />
                </td>

                {/* Account Status */}
                <td className="px-4 py-3.5">
                  {u.isLocked ? (
                    <Badge variant="destructive" className="text-[10px] flex items-center gap-1 w-fit">
                      <Lock className="w-3 h-3" /> Suspended
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </Badge>
                  )}
                </td>

                {/* Joined Date */}
                <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                  {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : "—"}
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <Link href={`/dashboard/admin/users/${u.userId}`}>
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs inline-flex items-center gap-1 bg-background hover:bg-muted">
                      View User <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
