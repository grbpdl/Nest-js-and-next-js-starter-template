"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api";
import { listAdmins, listRegularUsers } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

type Props = {
  kind: "users" | "admins";
};

export function AccountList({ kind }: Props) {
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const title = kind === "admins" ? "Admins" : "Users";
  const createHref =
    kind === "admins" ? "/admin/admins/create" : "/admin/users/create";
  const createLabel =
    kind === "admins" ? "Create admin" : "Create user";

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res =
          kind === "admins" ? await listAdmins() : await listRegularUsers();
        setRows(res.data ?? []);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : `Could not load ${title.toLowerCase()}.`,
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [kind, title]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {kind === "admins"
              ? "Accounts with the admin role."
              : "Accounts with the user role."}
          </p>
        </div>
        <Link
          href={createHref}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {createLabel}
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Phone</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Roles</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100">
                  <td className="px-2 py-2 font-medium text-zinc-900">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-2 py-2 text-zinc-700">{row.email}</td>
                  <td className="px-2 py-2 text-zinc-700">
                    {row.phone || "—"}
                  </td>
                  <td className="px-2 py-2 text-zinc-700">
                    {row.accountStatus || "—"}
                  </td>
                  <td className="px-2 py-2 text-zinc-700">
                    {row.roles?.map((r) => r.name).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
