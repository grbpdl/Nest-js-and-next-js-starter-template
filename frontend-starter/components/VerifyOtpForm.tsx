"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import { resendOtp, verifyOtp } from "@/lib/auth";

type Step = "email" | "phone" | "done";

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";

  const [step, setStep] = useState<Step>("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const title =
    step === "phone" ? "Verify phone" : "Verify email";
  const destination = step === "phone" ? phone : email;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (step === "email" && !email) {
      setError("Missing email. Register again.");
      return;
    }
    if (step === "phone" && !phone) {
      setError("Missing phone. Register again.");
      return;
    }

    setError(null);
    setMessage(null);
    setPending(true);
    try {
      if (step === "email") {
        await verifyOtp({ email, purpose: "verify_email", code });
        setCode("");
        if (phone) {
          setMessage("Email verified. Enter the OTP sent to your phone.");
          setStep("phone");
        } else {
          setMessage("Email verified. You can log in now.");
          setStep("done");
          router.push("/login");
        }
      } else {
        await verifyOtp({ phone, purpose: "verify_phone", code });
        setMessage("Phone verified. You can log in now.");
        setStep("done");
        router.push("/login");
      }
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
    if (step === "email" && !email) return;
    if (step === "phone" && !phone) return;
    setError(null);
    setMessage(null);
    try {
      if (step === "email") {
        await resendOtp({ email, purpose: "verify_email" });
        setMessage("A new OTP was sent to your email.");
      } else {
        await resendOtp({ phone, purpose: "verify_phone" });
        setMessage("A new OTP was sent to your phone.");
      }
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not resend OTP.",
      );
    }
  }

  function skipPhone() {
    router.push("/login");
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter the 6-digit OTP sent to{" "}
        <span className="font-medium text-zinc-800">
          {destination || (step === "phone" ? "your phone" : "your email")}
        </span>
        .
      </p>
      {phone ? (
        <p className="mt-2 text-xs text-zinc-500">
          Step {step === "phone" ? "2" : "1"} of 2 — email and phone are
          verified separately.
        </p>
      ) : null}
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
      {step === "phone" ? (
        <button
          type="button"
          onClick={skipPhone}
          className="mt-2 w-full text-sm text-zinc-500 underline hover:text-zinc-800"
        >
          Skip phone for now (email is enough to log in)
        </button>
      ) : null}
    </div>
  );
}
