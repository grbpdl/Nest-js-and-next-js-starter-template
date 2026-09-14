"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { useAuth } from "@/lib/session";

export function AppNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 text-sm text-zinc-500">
          Starter
        </div>
      </header>
    );
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  const linkClass = (href: string) =>
    `rounded px-2 py-1 text-sm ${
      pathname === href
        ? "bg-zinc-900 text-white"
        : "text-zinc-700 hover:bg-zinc-100"
    }`;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/profile" : "/login"} className="font-semibold">
          Auth Starter
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className={linkClass("/profile")}>
                Profile
              </Link>
              <Link href="/change-password" className={linkClass("/change-password")}>
                Change password
              </Link>
              {isSuperAdmin(user) && (
                <>
                  <Link
                    href="/admin/users/create"
                    className={linkClass("/admin/users/create")}
                  >
                    Create User
                  </Link>
                  <Link
                    href="/admin/admins/create"
                    className={linkClass("/admin/admins/create")}
                  >
                    Create Admin
                  </Link>
                  <Link
                    href="/admin/users/set-password"
                    className={linkClass("/admin/users/set-password")}
                  >
                    Set password
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => void onLogout()}
                className="rounded px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass("/login")}>
                Login
              </Link>
              <Link href="/register" className={linkClass("/register")}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
