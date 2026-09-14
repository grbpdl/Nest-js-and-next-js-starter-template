"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api";
import { listRoles, type AppRole } from "@/lib/auth";
import { useAuth } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export function RolesList() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canCreate = hasPermission(user, "create:role");

  useEffect(() => {
    void (async () => {
      try {
        const res = await listRoles();
        setRoles(res.data ?? []);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not load roles.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Roles</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Seeded and custom roles. Permissions control API and sidebar access.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/admin/roles/create"
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create role
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : roles.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No roles found. Run db:seed.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3"
            >
              <div>
                <p className="font-medium text-zinc-900">{role.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {(role.permissions ?? []).length} permission
                  {(role.permissions ?? []).length === 1 ? "" : "s"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(role.permissions ?? []).slice(0, 8).map((p) => (
                    <span
                      key={p.id}
                      className="rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-700"
                    >
                      {p.action}:{p.entity}
                    </span>
                  ))}
                  {(role.permissions ?? []).length > 8 ? (
                    <span className="text-[10px] text-zinc-400">
                      +{(role.permissions ?? []).length - 8} more
                    </span>
                  ) : null}
                </div>
              </div>
              {hasPermission(user, "update:role") ? (
                <Link
                  href={`/admin/roles/${role.id}`}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
                >
                  Edit permissions
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
