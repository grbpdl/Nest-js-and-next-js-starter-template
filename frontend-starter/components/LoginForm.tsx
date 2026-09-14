"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import { getGoogleAuthUrl, login } from "@/lib/auth";
import { useAuth } from "@/lib/session";

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ emailOrPhone, password });
      await refresh();
      router.replace("/profile");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Login failed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Login</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Use your email/phone and password, or continue with Google.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="text-zinc-700">Email or phone</span>
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <a
        href={getGoogleAuthUrl()}
        className="mt-3 flex w-full items-center justify-center rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Continue with Google
      </a>
      <p className="mt-4 text-center text-sm text-zinc-600">
        No account?{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          Register
        </Link>
      </p>
    </div>
  );
}
