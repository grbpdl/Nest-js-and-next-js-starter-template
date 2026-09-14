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

export async function adminSetPassword(userId: string, newPassword: string) {
  return apiFetch<ApiSuccess<unknown>>(`/user/${userId}/password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export function getGoogleAuthUrl() {
  return getApiUrl("/auth/google");
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
