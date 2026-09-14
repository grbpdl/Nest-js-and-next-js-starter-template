"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import {
  createRole,
  listPermissions,
  type AppPermission,
} from "@/lib/auth";

export function CreateRoleForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPermissions();
        setPermissions(res.data ?? []);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not load permissions.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    setPending(true);
    try {
      const res = await createRole({
        name: name.trim(),
        permissions: Array.from(selected).map((id) => ({ id })),
      });
      router.push(`/admin/roles/${res.data?.id ?? ""}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not create role.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Create role</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create a role and attach seeded permissions. Users with this role get
        those permissions.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading permissions…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-zinc-700">Role name</span>
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="editor"
            />
          </label>

          <fieldset>
            <legend className="text-sm text-zinc-700">Permissions</legend>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded border border-zinc-200 p-3">
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
                    <span className="font-mono text-xs text-zinc-800">
                      {code}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create role"}
          </button>
        </form>
      )}
    </div>
  );
}
