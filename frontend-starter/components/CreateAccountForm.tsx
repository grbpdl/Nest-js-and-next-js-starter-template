"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api";
import {
  createAdmin,
  createUser,
  listRoles,
  type AppRole,
  type CreateUserInput,
} from "@/lib/auth";

type Props = {
  mode: "user" | "admin";
};

export function CreateAccountForm({ mode }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(mode === "admin");

  const title = mode === "admin" ? "Create admin" : "Create user";
  const description =
    mode === "admin"
      ? "Creates a verified account with the admin role. You can attach extra roles at the same time."
      : "Creates a verified account with the user role.";

  useEffect(() => {
    if (mode !== "admin") return;
    void (async () => {
      try {
        const res = await listRoles();
        const all = (res.data ?? []).filter((r) => r.name !== "super_admin");
        setRoles(all);
        const admin = all.find((r) => r.name === "admin");
        if (admin) {
          setSelectedRoleIds(new Set([admin.id]));
        }
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not load roles.",
        );
      } finally {
        setRolesLoading(false);
      }
    })();
  }, [mode]);

  function toggleRole(id: string, roleName: string) {
    if (roleName === "admin") return; // admin is always required for this form
    setSelectedRoleIds((prev) => {
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

    const payload: CreateUserInput = {
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      password,
    };

    try {
      if (mode === "admin") {
        const adminRole = roles.find((r) => r.name === "admin");
        const extraIds = Array.from(selectedRoleIds).filter(
          (id) => id !== adminRole?.id,
        );
        await createAdmin({
          ...payload,
          roleIds: extraIds.length ? extraIds : undefined,
        });
        setMessage("Admin created successfully.");
        if (adminRole) {
          setSelectedRoleIds(new Set([adminRole.id]));
        }
      } else {
        await createUser(payload);
        setMessage("User created successfully.");
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not create account.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
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
        </label>

        {mode === "admin" ? (
          <fieldset>
            <legend className="text-sm text-zinc-700">Roles</legend>
            <p className="mt-1 text-xs text-zinc-500">
              The <span className="font-medium">admin</span> role is always
              included. Select any additional roles to assign now.
            </p>
            {rolesLoading ? (
              <p className="mt-2 text-sm text-zinc-500">Loading roles…</p>
            ) : (
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded border border-zinc-200 p-3">
                {roles.map((role) => {
                  const isAdminRole = role.name === "admin";
                  return (
                    <label
                      key={role.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.has(role.id)}
                        disabled={isAdminRole}
                        onChange={() => toggleRole(role.id, role.name)}
                      />
                      <span className="font-medium text-zinc-800">
                        {role.name}
                        {isAdminRole ? " (required)" : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={pending || (mode === "admin" && rolesLoading)}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : title}
        </button>
      </form>
    </div>
  );
}
