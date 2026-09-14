"use client";

import { AccountList } from "@/components/AccountList";
import { RequireAuth } from "@/components/RequireAuth";

export default function AdminsListPage() {
  return (
    <RequireAuth requireSuperAdmin>
      <AccountList kind="admins" />
    </RequireAuth>
  );
}
