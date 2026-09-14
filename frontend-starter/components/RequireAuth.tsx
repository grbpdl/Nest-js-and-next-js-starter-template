"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/session";
import { isSuperAdmin } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
};

export function RequireAuth({ children, requireSuperAdmin = false }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireSuperAdmin && !isSuperAdmin(user)) {
      router.replace("/profile");
    }
  }, [user, loading, requireSuperAdmin, router]);

  if (loading || !user) {
    return (
      <p className="text-sm text-zinc-500" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return (
      <p className="text-sm text-zinc-500" aria-live="polite">
        Redirecting…
      </p>
    );
  }

  return <>{children}</>;
}
