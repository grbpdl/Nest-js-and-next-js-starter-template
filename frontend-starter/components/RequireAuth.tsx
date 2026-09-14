"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/session";
import { isSuperAdmin } from "@/lib/auth";
import { hasAnyPermission, hasPermission } from "@/lib/permissions";

type Props = {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  /** Single permission code (`action:entity`) */
  requirePermission?: string;
  /** Any of these permissions */
  requireAnyPermission?: string[];
};

export function RequireAuth({
  children,
  requireSuperAdmin = false,
  requirePermission,
  requireAnyPermission,
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed =
    Boolean(user) &&
    (!requireSuperAdmin || isSuperAdmin(user)) &&
    (!requirePermission || hasPermission(user, requirePermission)) &&
    (!requireAnyPermission ||
      hasAnyPermission(user, requireAnyPermission));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowed) {
      router.replace("/profile");
    }
  }, [user, loading, allowed, router]);

  if (loading || !user) {
    return (
      <p className="text-sm text-zinc-500" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!allowed) {
    return (
      <p className="text-sm text-zinc-500" aria-live="polite">
        Redirecting…
      </p>
    );
  }

  return <>{children}</>;
}
