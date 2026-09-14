"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api";
import {
  assignRolesToUser,
  listRoles,
  listUsers,
  revokeRolesFromUser,
  type AppRole,
} from "@/lib/auth";
import { useAuth } from "@/lib/session";
import type { AuthUser } from "@/lib/types";

export function AssignRolesForm() {
  const { user: me, refresh } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [userId, setUserId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          listUsers(),
          listRoles(),
        ]);
        setUsers(usersRes.data ?? []);
        setRoles(rolesRes.data ?? []);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not load users/roles.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const selected = users.find((u) => u.id === userId);
    if (!selected) {
      setSelectedRoles(new Set());
      return;
    }
    setSelectedRoles(new Set((selected.roles ?? []).map((r) => r.id)));
  }, [userId, users]);

  function toggleRole(id: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
      // Replace via assign of selected set: revoke missing then assign all
      // Backend assign merges; so set exact by revoke extras first if needed.
      const current = users.find((u) => u.id === userId);
      const currentIds = new Set((current?.roles ?? []).map((r) => r.id));
      const nextIds = selectedRoles;

      const toAdd = Array.from(nextIds).filter((id) => !currentIds.has(id));
      const toRemove = Array.from(currentIds).filter((id) => !nextIds.has(id));

      if (toRemove.length) {
        await revokeRolesFromUser(userId, toRemove);
      }
      if (toAdd.length) {
        await assignRolesToUser(userId, toAdd);
      }

      const refreshed = await listUsers();
      setUsers(refreshed.data ?? []);
      if (me?.id === userId) {
        await refresh();
      }
      setMessage("Roles updated. User access follows their role permissions.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not assign roles.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Assign roles</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Attach roles to a user. Their effective permissions come from those
        roles (shown on Profile after they re-login or refresh session).
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading…</p>
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
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm text-zinc-700">Roles</legend>
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded border border-zinc-200 p-3">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span className="font-medium text-zinc-800">{role.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save role assignment"}
          </button>
        </form>
      )}
    </div>
  );
}
