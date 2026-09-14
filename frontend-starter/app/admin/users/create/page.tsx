"use client";

import { CreateAccountForm } from "@/components/CreateAccountForm";
import { RequireAuth } from "@/components/RequireAuth";

export default function CreateUserPage() {
  return (
    <RequireAuth requirePermission="create:user">
      <CreateAccountForm mode="user" />
    </RequireAuth>
  );
}
