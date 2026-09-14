import { apiFetch, getApiUrl } from "./api";
import type { ApiSuccess, AuthUser } from "./types";

export type LoginInput = {
  emailOrPhone: string;
  password: string;
  deviceId?: string;
  fcmToken?: string;
  deviceInfo?: {
    platform?: string;
    model?: string;
    manufacturer?: string;
    osVersion?: string;
    appVersion?: string;
  };
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
};

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  /** Extra role IDs when creating an admin (admin role is always included). */
  roleIds?: string[];
};

export async function login(input: LoginInput) {
  return apiFetch<ApiSuccess<AuthUser & { access_token: string }>>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function register(input: RegisterInput) {
  return apiFetch<ApiSuccess<AuthUser>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout(deviceId?: string) {
  return apiFetch<ApiSuccess<unknown>>("/auth/logout", {
    method: "POST",
    body: JSON.stringify(deviceId ? { deviceId } : {}),
  });
}

export async function getMe() {
  return apiFetch<ApiSuccess<AuthUser>>("/auth/me");
}

export async function verifyOtp(input: {
  email?: string;
  phone?: string;
  purpose: string;
  code: string;
}) {
  return apiFetch<ApiSuccess<unknown>>("/otp/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resendOtp(input: {
  email?: string;
  phone?: string;
  purpose: string;
}) {
  return apiFetch<ApiSuccess<unknown>>("/otp/resend", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createUser(input: CreateUserInput) {
  return apiFetch<ApiSuccess<AuthUser>>("/user", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createAdmin(input: CreateUserInput) {
  return apiFetch<ApiSuccess<AuthUser>>("/user/admin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function forgotPassword(emailOrPhone: string) {
  return apiFetch<ApiSuccess<unknown>>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ emailOrPhone }),
  });
}

export async function resetPassword(input: {
  emailOrPhone: string;
  token: string;
  password: string;
}) {
  return apiFetch<ApiSuccess<unknown>>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiFetch<ApiSuccess<unknown>>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listUsers() {
  return apiFetch<ApiSuccess<AuthUser[]>>("/user");
}

export async function listRegularUsers() {
  return apiFetch<ApiSuccess<AuthUser[]>>("/user/users");
}

export async function listAdmins() {
  return apiFetch<ApiSuccess<AuthUser[]>>("/user/admins");
}

export type AppPermission = {
  id: string;
  action: string;
  entity: string;
};

export type AppRole = {
  id: string;
  name: string;
  permissions?: AppPermission[];
};

export async function listRoles() {
  return apiFetch<ApiSuccess<AppRole[]>>("/role");
}

export async function getRoleWithPermissions(roleId: string) {
  return apiFetch<ApiSuccess<AppRole>>(`/role/permissions/${roleId}`);
}

export async function createRole(input: {
  name: string;
  permissions?: { id: string }[];
}) {
  return apiFetch<ApiSuccess<AppRole>>("/role", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function setRolePermissions(
  roleId: string,
  permissionIds: string[],
) {
  return apiFetch<ApiSuccess<AppRole>>(`/role/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify({
      permissions: permissionIds.map((id) => ({ id })),
    }),
  });
}

export async function listPermissions() {
  return apiFetch<ApiSuccess<AppPermission[]>>("/permission");
}

export async function assignRolesToUser(userId: string, roleIds: string[]) {
  return apiFetch<ApiSuccess<AuthUser>>("/role/assign", {
    method: "POST",
    body: JSON.stringify({ userId, roleIds }),
  });
}

export async function revokeRolesFromUser(userId: string, roleIds: string[]) {
  return apiFetch<ApiSuccess<AuthUser>>("/role/revoke", {
    method: "POST",
    body: JSON.stringify({ userId, roleIds }),
  });
}

export async function adminSetPassword(userId: string, newPassword: string) {
  return apiFetch<ApiSuccess<unknown>>(`/user/${userId}/password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export function getGoogleAuthUrl() {
  return getApiUrl("/auth/google");
}

export function isGoogleAuthEnabled() {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}

export function hasRole(user: AuthUser | null | undefined, role: string) {
  return Boolean(user?.roles?.some((r) => r.name === role));
}

export function isSuperAdmin(user: AuthUser | null | undefined) {
  return hasRole(user, "super_admin");
}

export function isAdmin(user: AuthUser | null | undefined) {
  return hasRole(user, "admin") || isSuperAdmin(user);
}
