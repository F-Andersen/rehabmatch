import { apiRequest } from "../../lib/api";
import type { AuthResponse, PublicUser } from "./types";

export async function fetchCurrentUser(): Promise<PublicUser> {
  const response = await apiRequest<AuthResponse>("/api/v1/auth/me");
  return response.data;
}

export async function loginRequest(email: string, password: string): Promise<PublicUser> {
  const response = await apiRequest<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return response.data;
}

export async function registerRequest(payload: {
  fullName: string;
  email: string;
  password: string;
  role: "PATIENT" | "SPECIALIST";
}): Promise<PublicUser> {
  const response = await apiRequest<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function logoutRequest(): Promise<void> {
  await apiRequest<void>("/api/v1/auth/logout", { method: "POST" });
}

export async function updateMeRequest(payload: {
  cityId?: string | null;
  fullName?: string;
  phone?: string | null;
}): Promise<PublicUser> {
  const response = await apiRequest<AuthResponse>("/api/v1/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}
