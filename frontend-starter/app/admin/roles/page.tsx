"use client";

import { RolesList } from "@/components/RolesList";
import { RequireAuth } from "@/components/RequireAuth";

export default function RolesPage() {
  return (
    <RequireAuth requirePermission="read:role">
      <RolesList />
    </RequireAuth>
  );
}
