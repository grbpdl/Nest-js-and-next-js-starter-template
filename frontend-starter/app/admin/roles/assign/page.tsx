"use client";

import { AssignRolesForm } from "@/components/AssignRolesForm";
import { RequireAuth } from "@/components/RequireAuth";

export default function AssignRolesPage() {
  return (
    <RequireAuth requirePermission="update:role">
      <AssignRolesForm />
    </RequireAuth>
  );
}
