"use client";

import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { RequireAuth } from "@/components/RequireAuth";

export default function ChangePasswordPage() {
  return (
    <RequireAuth>
      <ChangePasswordForm />
    </RequireAuth>
  );
}
