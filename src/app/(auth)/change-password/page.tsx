"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/_providers/AuthProvider";
import axios from "@/lib/axios";

export default function ChangePassword() {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/auth/change-password", {
        currentPassword,
        newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-md">
      <h1 className="text-xl font-bold mb-4">Change Password</h1>
      {message && <p className="text-green-600 mb-3">{message}</p>}
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block mb-1 font-medium">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-cyan outline-none"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block mb-1 font-medium">New Password</label>
          <input
            type="password"
            id="newPassword"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-cyan outline-none"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block mb-1 font-medium">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-brand-cyan outline-none"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
