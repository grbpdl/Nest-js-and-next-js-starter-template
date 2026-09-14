"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import { forgotPassword, resetPassword } from "@/lib/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("emailOrPhone") || "";

  const [emailOrPhone, setEmailOrPhone] = useState(initial);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      await resetPassword({ emailOrPhone, token, password });
      setMessage("Password reset. You can log in now.");
      router.push("/login");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not reset password.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    if (!emailOrPhone) return;
    setError(null);
    setMessage(null);
    try {
      await forgotPassword(emailOrPhone);
      setMessage("A new OTP was sent.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not resend OTP.",
      );
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Reset password</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter the OTP from email or SMS and choose a new password.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="text-zinc-700">Email or phone</span>
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">OTP code</span>
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 tracking-widest"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            minLength={6}
            maxLength={6}
            inputMode="numeric"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">New password</span>
          <input
            type="password"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <span className="mt-1 block text-xs text-zinc-500">
            Min 8 chars with upper, lower, number, and special character.
          </span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Reset password"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => void onResend()}
        className="mt-3 w-full rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Resend OTP
      </button>
      <p className="mt-4 text-center text-sm text-zinc-600">
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
