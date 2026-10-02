"use client";

import { useState, type FormEvent } from "react";
import { api, ApiFail } from "@/lib/admin/api-client";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api("/auth/login", { method: "POST", json: { email: f.get("email"), password: f.get("password") } });
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof ApiFail ? err.message : "Unable to sign in");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Admin sign in</h1>
        <p className="text-sm text-muted mt-1">Authorized staff only.</p>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        Email
        <input name="email" type="email" required autoComplete="username" className="rounded-lg border border-border bg-background px-4 py-3 focus:border-accent-2 focus:outline-none" />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="rounded-lg border border-border bg-background px-4 py-3 focus:border-accent-2 focus:outline-none" />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={busy} className="rounded-full bg-accent px-6 py-3 font-medium text-on-accent hover:bg-accent-2 disabled:opacity-60 transition-colors">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
