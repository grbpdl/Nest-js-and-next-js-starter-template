"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import {
  getRoleWithPermissions,
  listPermissions,
  setRolePermissions,
  type AppPermission,
  type AppRole,
} from "@/lib/auth";

export function EditRolePermissionsForm() {
  const params = useParams<{ id: string }>();
  const roleId = params.id;

  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [roleRes, permRes] = await Promise.all([
          getRoleWithPermissions(roleId),
          listPermissions(),
        ]);
        const r = roleRes.data ?? null;
        setRole(r);
        setPermissions(permRes.data ?? []);
        setSelected(new Set((r?.permissions ?? []).map((p) => p.id)));
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not load role.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [roleId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const res = await setRolePermissions(roleId, Array.from(selected));
      setRole(res.data ?? role);
      setMessage("Permissions updated. Users with this role get these codes.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not update permissions.",
      );
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading role…</p>;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">
        Edit role{role ? `: ${role.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Toggle seeded permissions for this role.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="max-h-80 space-y-2 overflow-y-auto rounded border border-zinc-200 p-3">
          {permissions.map((p) => {
            const code = `${p.action}:${p.entity}`;
            return (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
                <span className="font-mono text-xs text-zinc-800">{code}</span>
              </label>
            );
          })}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save permissions"}
        </button>
      </form>
    </div>
  );
}
