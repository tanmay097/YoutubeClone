"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginSchema, registerSchema } from "@vidora/shared";
import { api } from "@/lib/client";
import { useAuth } from "./AuthProvider";
import { Field, primaryBtn } from "./Field";
import { IKIcon } from "./IKIcon";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = isRegister ? registerSchema.safeParse(form) : loginSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = isRegister ? await api.register(parsed.data as any) : await api.login(parsed.data);
      setUser(res.user);
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setFormError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface/60 p-8">
        <div className="flex flex-col items-center text-center">
          <IKIcon name="logo" size={44} />
          <h1 className="mt-4 text-2xl font-bold">{isRegister ? "Create your account" : "Sign in"}</h1>
          <p className="mt-1 text-sm text-muted">{isRegister ? "Start uploading and subscribing" : "to continue to Vidora"}</p>
        </div>
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
          {isRegister && (
            <Field id="name" label="Channel name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} />
          )}
          <Field id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={form.password}
            onChange={set("password")}
            error={errors.password}
          />
          {formError && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {isRegister ? "Already have an account? " : "New to Vidora? "}
          <Link
            href={`${isRegister ? "/login" : "/register"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-link hover:underline"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
