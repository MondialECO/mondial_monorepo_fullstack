'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';
import { isSuperAdmin } from '@/lib/roles';
import { Button } from '@/components/ui/button';

export default function AdminSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const isSuper = isSuperAdmin(user);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSuper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 text-red-600 dark:text-red-400">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          System & Operations diagnostics, background jobs, queues, and platform controls require SuperAdmin privileges.
        </p>
        <div className="pt-2">
          <Link href="/dashboard/admin">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
