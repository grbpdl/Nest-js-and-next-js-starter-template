"use client";

import { AdminSetPasswordForm } from "@/components/AdminSetPasswordForm";
import { RequireAuth } from "@/components/RequireAuth";

export default function AdminSetPasswordPage() {
  return (
    <RequireAuth requireSuperAdmin>
      <AdminSetPasswordForm />
    </RequireAuth>
  );
}
