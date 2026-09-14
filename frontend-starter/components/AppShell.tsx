"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { useAuth } from "@/lib/session";

const PUBLIC_AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]);

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-zinc-900 font-medium text-white"
          : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicAuth = PUBLIC_AUTH_PATHS.has(pathname);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  if (isPublicAuth) {
    return (
      <div className="flex min-h-full flex-1 items-start justify-center bg-zinc-50 px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-4">
          <Link
            href={user ? "/profile" : "/login"}
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            Auth Starter
          </Link>
          {user ? (
            <p className="mt-1 truncate text-xs text-zinc-500">
              {user.firstName} {user.lastName}
            </p>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {loading ? (
            <p className="px-3 py-2 text-sm text-zinc-400">Loading…</p>
          ) : user ? (
            <>
              <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Account
              </p>
              <NavLink href="/profile" label="Profile" pathname={pathname} />
              <NavLink
                href="/change-password"
                label="Change password"
                pathname={pathname}
              />

              {isSuperAdmin(user) ? (
                <>
                  <p className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Administration
                  </p>
                  <NavLink
                    href="/admin/users"
                    label="Users"
                    pathname={pathname}
                  />
                  <NavLink
                    href="/admin/admins"
                    label="Admins"
                    pathname={pathname}
                  />
                  <NavLink
                    href="/admin/users/create"
                    label="Create user"
                    pathname={pathname}
                  />
                  <NavLink
                    href="/admin/admins/create"
                    label="Create admin"
                    pathname={pathname}
                  />
                  <NavLink
                    href="/admin/users/set-password"
                    label="Set password"
                    pathname={pathname}
                  />
                </>
              ) : null}
            </>
          ) : (
            <>
              <NavLink href="/login" label="Login" pathname={pathname} />
              <NavLink href="/register" label="Register" pathname={pathname} />
            </>
          )}
        </nav>

        {user ? (
          <div className="border-t border-zinc-200 p-3">
            <button
              type="button"
              onClick={() => void onLogout()}
              className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        ) : null}
      </aside>

      <main className="flex-1 overflow-auto bg-zinc-50 px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
