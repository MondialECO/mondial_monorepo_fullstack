"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoleCardGrid, RoleCardList, type RoleOption } from "./RoleCard";
import { cn } from "@/lib/utils";

type Variant = "grid" | "list";

export function RoleSelector({
  roles,
  variant = "grid",
  defaultRoleId,
  signInHref = "/login",
  onSubmit,
  className,
}: {
  roles: RoleOption[];
  variant?: Variant;
  defaultRoleId?: string;
  signInHref?: string;
  /** If omitted, the form POSTs to /api/signup with { roleId } */
  onSubmit?: (roleId: string) => void | Promise<void>;
  className?: string;
}) {
  const [selected, setSelected] = useState<string | undefined>(defaultRoleId);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(selected);
      } else {
        // Default: hand off to an API route the app provides.
        await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId: selected }),
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn("flex w-full flex-col items-center gap-8", className)}>
      <div
        role="radiogroup"
        aria-label="Select your role"
        className={cn(
          "w-full",
          variant === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
            : "flex flex-col gap-3",
        )}
      >
        {roles.map((role) =>
          variant === "grid" ? (
            <RoleCardGrid
              key={role.id}
              role={role}
              selected={selected === role.id}
              onSelect={setSelected}
            />
          ) : (
            <RoleCardList
              key={role.id}
              role={role}
              selected={selected === role.id}
              onSelect={setSelected}
            />
          ),
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <Button
          size="lg"
          className="w-full rounded-full sm:w-auto sm:min-w-[260px]"
          disabled={!selected || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Initializing…" : "Initialize Account"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={signInHref}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
