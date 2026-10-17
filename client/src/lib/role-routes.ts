import type { UserRole } from "../features/auth/types";

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SPECIALIST":
      return "/specialist/dashboard";
    case "PATIENT":
    default:
      return "/dashboard";
  }
}
