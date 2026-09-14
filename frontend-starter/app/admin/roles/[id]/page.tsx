"use client";

import { EditRolePermissionsForm } from "@/components/EditRolePermissionsForm";
import { RequireAuth } from "@/components/RequireAuth";

export default function EditRolePage() {
  return (
    <RequireAuth requirePermission="update:role">
      <EditRolePermissionsForm />
    </RequireAuth>
  );
}
