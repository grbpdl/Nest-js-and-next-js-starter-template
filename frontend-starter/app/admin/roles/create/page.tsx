"use client";

import { CreateRoleForm } from "@/components/CreateRoleForm";
import { RequireAuth } from "@/components/RequireAuth";

export default function CreateRolePage() {
  return (
    <RequireAuth requirePermission="create:role">
      <CreateRoleForm />
    </RequireAuth>
  );
}
