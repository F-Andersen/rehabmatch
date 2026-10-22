import { apiRequest } from "../../lib/api";
import type { PaginationMeta } from "../specialists/types";

export type OwnReview = {
  id: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type AppointmentRequestItem = {
  id: string;
  status: "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  preferredAt: string;
  note: string | null;
  createdAt: string;
  patientName?: string;
  specialistName?: string;
};

export type PatientReviewListItem = {
  id: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  specialistId: string;
  specialistName: string;
};

export async function fetchPatientReviews(page = "1", pageSize = "20") {
  return apiRequest<{ data: PatientReviewListItem[]; meta: PaginationMeta }>(
    `/api/v1/me/reviews?page=${page}&pageSize=${pageSize}`,
  );
}

export async function fetchMyReviewForSpecialist(specialistId: string) {
  const res = await apiRequest<{ data: OwnReview | null }>(
    `/api/v1/specialists/${specialistId}/reviews/mine`,
  );
  return res.data;
}

export async function submitSpecialistReview(
  specialistId: string,
  payload: { rating: number; comment: string },
) {
  const res = await apiRequest<{ data: OwnReview & { message: string } }>(
    `/api/v1/specialists/${specialistId}/reviews`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

export async function createConsultationRequest(payload: {
  specialistId: string;
  preferredAt: string;
  note?: string;
}) {
  const res = await apiRequest<{ data: AppointmentRequestItem }>("/api/v1/appointment-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function fetchPatientAppointmentRequests(
  params: Record<string, string | undefined> = {},
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return apiRequest<{ data: AppointmentRequestItem[]; meta: PaginationMeta }>(
    `/api/v1/me/appointment-requests${qs ? `?${qs}` : ""}`,
  );
}

export async function cancelPatientAppointmentRequest(id: string) {
  const res = await apiRequest<{ data: AppointmentRequestItem }>(
    `/api/v1/me/appointment-requests/${id}/cancel`,
    { method: "PATCH" },
  );
  return res.data;
}

export async function fetchSpecialistAppointmentRequests(
  params: Record<string, string | undefined> = {},
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return apiRequest<{ data: AppointmentRequestItem[]; meta: PaginationMeta }>(
    `/api/v1/specialist/appointment-requests${qs ? `?${qs}` : ""}`,
  );
}

export async function patchSpecialistAppointmentStatus(
  id: string,
  status: "ACCEPTED" | "DECLINED",
) {
  const res = await apiRequest<{ data: AppointmentRequestItem }>(
    `/api/v1/specialist/appointment-requests/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminReviewRow = {
  id: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  patientName: string;
  specialistName: string;
  specialistId: string;
};

export async function fetchAdminUsers(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return apiRequest<{ data: AdminUserRow[]; meta: PaginationMeta }>(
    `/api/v1/admin/users${qs ? `?${qs}` : ""}`,
  );
}

export async function patchAdminUserStatus(id: string, isActive: boolean) {
  const res = await apiRequest<{ data: AdminUserRow }>(`/api/v1/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
  return res.data;
}

export async function fetchAdminReviews(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return apiRequest<{ data: AdminReviewRow[]; meta: PaginationMeta }>(
    `/api/v1/admin/reviews${qs ? `?${qs}` : ""}`,
  );
}

export async function patchAdminReviewStatus(id: string, status: "APPROVED" | "REJECTED") {
  const res = await apiRequest<{ data: { id: string; status: string } }>(
    `/api/v1/admin/reviews/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}

export async function fetchAdminAppointmentRequests(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return apiRequest<{ data: AppointmentRequestItem[]; meta: PaginationMeta }>(
    `/api/v1/admin/appointment-requests${qs ? `?${qs}` : ""}`,
  );
}

export type CatalogAdminRow = {
  id: string;
  name: string;
  description?: string | null;
  cityId?: string;
  city?: { id: string; name: string };
};

export async function fetchAdminCatalog(type: string) {
  const res = await apiRequest<{ data: CatalogAdminRow[] }>(`/api/v1/admin/catalog/${type}`);
  return res.data;
}

export async function createAdminCatalogEntry(
  type: string,
  payload: { name: string; description?: string; cityId?: string },
) {
  const res = await apiRequest<{ data: CatalogAdminRow }>(`/api/v1/admin/catalog/${type}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function patchAdminCatalogEntry(
  type: string,
  id: string,
  payload: { name?: string; description?: string },
) {
  const res = await apiRequest<{ data: CatalogAdminRow }>(`/api/v1/admin/catalog/${type}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export type CriterionRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export async function fetchAdminCriteria() {
  const res = await apiRequest<{ data: CriterionRow[] }>("/api/v1/admin/criteria");
  return res.data;
}

export async function patchAdminCriterion(
  id: string,
  payload: { name?: string; description?: string; isActive?: boolean },
) {
  const res = await apiRequest<{ data: CriterionRow }>(`/api/v1/admin/criteria/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}
