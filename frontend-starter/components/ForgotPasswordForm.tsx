"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import { forgotPassword } from "@/lib/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await forgotPassword(emailOrPhone);
      const params = new URLSearchParams({ emailOrPhone });
      router.push(`/reset-password?${params.toString()}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not send reset OTP.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Forgot password</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter your email or phone. We will send a 6-digit OTP to reset your
        password.
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
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send OTP"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600">
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
