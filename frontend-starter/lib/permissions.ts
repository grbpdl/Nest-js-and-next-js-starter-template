import type { AuthUser } from "./types";
import { isSuperAdmin } from "./auth";

/** Permission codes match backend guards: `action:entity` (e.g. `read:user`). */
export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return Boolean(user.permissions?.includes(permission));
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: string[],
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return permissions.some((p) => user.permissions?.includes(p));
}
