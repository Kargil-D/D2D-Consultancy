"use client";

import { useEffect, useState } from "react";
import { Field, inputCls } from "@/components/admin/ui/Field";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  email: string;
}

export default function YourAccountPage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiClient
      .get<ProfileData>("/api/customer/account")
      .then((data) => {
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhoneNumber(data.phoneNumber ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load your account"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // apiClient only exposes get/post — call fetch directly for this PUT route.
      const res = await fetch("/api/customer/account", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phoneNumber: phoneNumber || undefined }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Unable to save changes");
      const updated = json.data as ProfileData;
      setProfile(updated);
      setSuccess(true);
      refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Account</h1>
      <p className="text-sm text-slate-500 mb-6">{profile?.email}</p>

      <form onSubmit={handleSave} className="rounded-2xl bg-white border border-slate-200 p-6 max-w-lg space-y-4">
        <Field label="Name">
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
            <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
          </div>
        </Field>
        <Field label="Mobile Number">
          <input className={inputCls} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Mobile number" />
        </Field>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">Saved!</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
