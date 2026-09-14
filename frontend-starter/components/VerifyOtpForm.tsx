"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import { resendOtp, verifyOtp } from "@/lib/auth";

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email) {
      setError("Missing email. Register again.");
      return;
    }
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      await verifyOtp({
        email,
        purpose: "verify_email",
        code,
      });
      if (phone) {
        // Phone OTP is optional; email verify is enough to login.
      }
      setMessage("Email verified. You can log in now.");
      router.push("/login");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "OTP verification failed.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    if (!email) return;
    setError(null);
    setMessage(null);
    try {
      await resendOtp({ email, purpose: "verify_email" });
      setMessage("A new OTP was sent to your email.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not resend OTP.",
      );
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Verify email</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter the 6-digit OTP sent to{" "}
        <span className="font-medium text-zinc-800">{email || "your email"}</span>
        .
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="text-zinc-700">OTP code</span>
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            minLength={6}
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]{6}"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => void onResend()}
        className="mt-3 w-full rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Resend OTP
      </button>
    </div>
  );
}
