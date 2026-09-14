"use client";

import { ProfileCard } from "@/components/ProfileCard";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/session";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      {user ? <ProfileCard user={user} /> : null}
    </RequireAuth>
  );
}
