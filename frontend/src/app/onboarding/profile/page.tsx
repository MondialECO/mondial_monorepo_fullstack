"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCircle } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { Button } from "@/components/ui/button";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { refresh, status } = useOnboarding();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneVerified = status?.phoneVerified ?? false;
  const kycVerified = (status?.kycStatus ?? "").toUpperCase() === "VERIFIED";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("title", title);
      fd.append("bio", bio);
      fd.append("city", city);
      fd.append("country", country);
      if (photo) fd.append("photo", photo);

      await api.put("/onboarding/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refresh();
      router.push("/onboarding/complete");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to save profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Complete your profile</h2>
          <p className="text-sm text-muted-foreground">
            Shown on your public profile and to investors / founders you connect with.
          </p>
        </div>
      </div>

      {(!phoneVerified || !kycVerified) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Finish the previous step first to keep things in order.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Full name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Title / role
            </label>
            <input
              id="title"
              placeholder="Founder, Investor, …"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">
              City
            </label>
            <input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-foreground mb-1">
              Country
            </label>
            <input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1">
            Short bio
          </label>
          <textarea
            id="bio"
            rows={3}
            placeholder="One or two sentences about what you do."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring transition resize-none"
          />
        </div>

        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-foreground mb-1">
            Profile photo (optional)
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:opacity-90"
          />
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WEBP. Up to 30MB.</p>
        </div>

        <Button type="submit" disabled={busy || !name.trim()} className="w-full">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Save and continue
        </Button>
      </form>
    </div>
  );
}
