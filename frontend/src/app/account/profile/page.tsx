"use client";

import { useEffect, useState } from "react";
import { Loader2, UserCircle } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";

/**
 * Basic profile editor. Moved out of Phase 1 onboarding per the Figma
 * design — the hub at /onboarding only covers verification items, while
 * name / title / bio / location belong under Account Settings.
 *
 * This page is a thin stub for now; full Account Settings UX is its own
 * future task. Talks to the existing PUT /api/auth/account endpoint.
 */
export default function AccountProfilePage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get("/auth/account")
      .then((res) => {
        if (cancelled) return;
        const d = res.data?.data ?? res.data;
        setName(d?.name ?? "");
        setTitle(d?.title ?? "");
        setBio(d?.bio ?? "");
        setCity(d?.address?.City ?? "");
        setCountry(d?.address?.Country ?? "");
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await api.put("/auth/account", {
        Name: name,
        Title: title,
        Bio: bio,
        Address: { address: "", City: city, Country: country },
      });
      setSaved(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Name, title, location and bio shown on your public profile.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-600/30 bg-green-600/5 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          Saved.
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={name} onChange={setName} required />
          <Field label="Title / role" value={title} onChange={setTitle} placeholder="Founder, Investor, …" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="City" value={city} onChange={setCity} />
          <Field label="Country" value={country} onChange={setCountry} />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1.5">
            Short bio
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring transition resize-none bg-card"
          />
        </div>
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Save changes
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring transition bg-card"
      />
    </div>
  );
}
