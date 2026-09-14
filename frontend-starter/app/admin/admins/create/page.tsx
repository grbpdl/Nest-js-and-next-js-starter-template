"use client";

import { CreateAccountForm } from "@/components/CreateAccountForm";
import { RequireAuth } from "@/components/RequireAuth";

export default function CreateAdminPage() {
  return (
    <RequireAuth requireSuperAdmin>
      <CreateAccountForm mode="admin" />
    </RequireAuth>
  );
}
