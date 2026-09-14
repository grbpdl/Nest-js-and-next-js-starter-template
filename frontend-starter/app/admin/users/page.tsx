"use client";

import { AccountList } from "@/components/AccountList";
import { RequireAuth } from "@/components/RequireAuth";

export default function UsersListPage() {
  return (
    <RequireAuth requireSuperAdmin>
      <AccountList kind="users" />
    </RequireAuth>
  );
}
