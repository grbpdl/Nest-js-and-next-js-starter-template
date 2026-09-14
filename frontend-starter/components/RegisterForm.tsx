"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import { register } from "@/lib/auth";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password,
      });
      const params = new URLSearchParams({ email });
      if (phone) params.set("phone", phone);
      router.push(`/verify?${params.toString()}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Register</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create an account, then verify your email with the OTP we send.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-700">First name</span>
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-700">Last name</span>
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-zinc-700">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">Phone (optional)</span>
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            minLength={8}
          />
          <span className="mt-1 block text-xs text-zinc-500">
            Min 8 chars with upper, lower, number, and special character.
          </span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Login
        </Link>
      </p>
    </div>
  );
}
