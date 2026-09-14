"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/session";

/**
 * Google OAuth lands here after the API sets cookies and redirects from
 * /auth/google/callback. Cookies are already on the API origin; refresh session.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  useEffect(() => {
    void (async () => {
      const user = await refresh();
      router.replace(user ? "/profile" : "/login");
    })();
  }, [refresh, router]);

  return (
    <p className="text-sm text-zinc-500" aria-live="polite">
      Completing Google sign-in…
    </p>
  );
}
