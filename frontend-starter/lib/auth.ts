import { apiFetch, getApiUrl } from "./api";
import type { ApiSuccess, AuthUser } from "./types";

export type LoginInput = {
  emailOrPhone: string;
  password: string;
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

export async function logout() {
  return apiFetch<ApiSuccess<unknown>>("/auth/logout", {
    method: "POST",
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
