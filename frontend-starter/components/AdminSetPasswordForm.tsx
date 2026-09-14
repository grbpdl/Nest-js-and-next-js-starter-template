"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api";
import { adminSetPassword, listUsers } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

export function AdminSetPasswordForm() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listUsers();
        setUsers(res.data ?? []);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not load users.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      setError("Select a user.");
      return;
    }
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      await adminSetPassword(userId, newPassword);
      setMessage("Password updated for the selected user.");
      setNewPassword("");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not update password.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Set user password</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Super admin only. Set a new password for any user or admin (no current
        password required).
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading users…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-zinc-700">User</span>
            <select
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            >
              <option value="">Select user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {u.email}
                  {u.roles?.length
                    ? ` (${u.roles.map((r) => r.name).join(", ")})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-700">New password</span>
            <input
              type="password"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Set password"}
          </button>
        </form>
      )}
    </div>
  );
}
