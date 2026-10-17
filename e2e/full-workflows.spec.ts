import { expect, test } from "@playwright/test";
import {
  API_BASE,
  CLIENT_ORIGIN,
  apiLogin,
  fillMinimalSpecialistProfile,
  logoutIfNeeded,
  registerPatient,
  registerSpecialist,
  specialistDisplayName,
  uniqueEmail,
} from "./helpers";

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

test("specialist registration leaves profile PENDING", async ({ page }) => {
  await registerSpecialist(page, uniqueEmail("e2e-spec-pending"));
  await fillMinimalSpecialistProfile(page);
  await expect(page.getByText("PENDING").first()).toBeVisible();
});

test("admin approves specialist then catalog lists profile", async ({ page, request }) => {
  test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_* required in .env");

  const specEmail = uniqueEmail("e2e-spec-approve");
  await registerSpecialist(page, specEmail);
  await fillMinimalSpecialistProfile(page);

  const adminLogin = await apiLogin(request, adminEmail!, adminPassword!);
  expect(adminLogin.status()).toBe(200);

  const specialists = await request.get(`${API_BASE}/admin/specialists?status=PENDING&pageSize=50`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  const list = await specialists.json();
  const row = list.data.find((s: { fullName: string }) => s.fullName === specialistDisplayName(specEmail));
  expect(row).toBeTruthy();

  const approve = await request.patch(`${API_BASE}/admin/specialists/${row.id}/verification`, {
    data: { status: "APPROVED" },
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(approve.status()).toBe(200);

  const publicList = await request.get(
    `${API_BASE}/specialists?q=${encodeURIComponent(specialistDisplayName(specEmail))}`,
  );
  const publicBody = await publicList.json();
  expect(publicBody.data.some((s: { id: string }) => s.id === row.id)).toBe(true);
});

test("patient DIRECT_WSM flow via API then UI history", async ({ page, request }) => {
  const email = uniqueEmail("e2e-wsm");
  await registerPatient(page, email);

  const catalog = await page.request.get(`${API_BASE}/catalog`);
  const catalogBody = await catalog.json();
  const injury = catalogBody.data.injuryTypes[0];
  const city = catalogBody.data.cities[0];

  const search = await page.request.post(`${API_BASE}/search-requests`, {
    data: {
      injuryTypeId: injury.id,
      cityId: city.id,
      maxBudget: 2500,
      preferenceMode: "DIRECT_WSM",
    },
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(search.status()).toBe(201);
  const searchId = (await search.json()).data.id;

  const rec = await page.request.post(`${API_BASE}/recommendations`, {
    data: {
      searchRequestId: searchId,
      mode: "DIRECT_WSM",
      priorities: {
        EXPERIENCE: 3,
        PRICE: 3,
        RATING: 3,
        LOCATION: 3,
        FORMAT: 3,
      },
      limit: 5,
    },
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(rec.status()).toBe(201);

  await page.goto("/recommendations");
  await expect(page.getByRole("heading", { name: "Історія рекомендацій" })).toBeVisible();
});

test("consultation request and specialist response", async ({ page, request }) => {
  test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_* required");

  const specEmail = uniqueEmail("e2e-req-spec");
  const patientEmail = uniqueEmail("e2e-req-patient");

  await registerSpecialist(page, specEmail);
  await fillMinimalSpecialistProfile(page);

  const adminLogin = await apiLogin(request, adminEmail!, adminPassword!);
  expect(adminLogin.status()).toBe(200);
  const pending = await request.get(`${API_BASE}/admin/specialists?status=PENDING`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  const specRow = (await pending.json()).data.find(
    (s: { fullName: string }) => s.fullName === specialistDisplayName(specEmail),
  );
  expect(specRow).toBeTruthy();
  const approveSpec = await request.patch(
    `${API_BASE}/admin/specialists/${specRow.id}/verification`,
    {
      data: { status: "APPROVED" },
      headers: { Origin: CLIENT_ORIGIN },
    },
  );
  expect(approveSpec.status()).toBe(200);

  await logoutIfNeeded(page);
  await registerPatient(page, patientEmail);

  const preferredAt = new Date(Date.now() + 86_400_000).toISOString();
  const created = await page.request.post(`${API_BASE}/appointment-requests`, {
    data: { specialistId: specRow.id, preferredAt, note: "E2E consultation" },
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(created.status()).toBe(201);
  const requestId = (await created.json()).data.id;

  await logoutIfNeeded(page);
  const specLogin = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: specEmail, password: "E2ESpecPass123!" },
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(specLogin.status()).toBe(200);

  const accept = await page.request.patch(
    `${API_BASE}/specialist/appointment-requests/${requestId}/status`,
    {
      data: { status: "ACCEPTED" },
      headers: { Origin: CLIENT_ORIGIN },
    },
  );
  expect(accept.status()).toBe(200);

  await page.goto("/specialist/requests");
  await expect(page.getByText("Прийнято")).toBeVisible();
});

test("review pending then admin approval updates public rating", async ({ page, request }) => {
  test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_* required");

  const specEmail = uniqueEmail("e2e-rev-spec");
  const patientEmail = uniqueEmail("e2e-rev-patient");

  await registerSpecialist(page, specEmail);
  await fillMinimalSpecialistProfile(page);
  await apiLogin(request, adminEmail!, adminPassword!);
  const pending = await request.get(`${API_BASE}/admin/specialists?status=PENDING`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  const specRow = (await pending.json()).data.find(
    (s: { fullName: string }) => s.fullName === specialistDisplayName(specEmail),
  );
  expect(specRow).toBeTruthy();
  const approveSpec = await request.patch(
    `${API_BASE}/admin/specialists/${specRow.id}/verification`,
    {
      data: { status: "APPROVED" },
      headers: { Origin: CLIENT_ORIGIN },
    },
  );
  expect(approveSpec.status()).toBe(200);

  await logoutIfNeeded(page);
  await registerPatient(page, patientEmail);

  const review = await page.request.post(`${API_BASE}/specialists/${specRow.id}/reviews`, {
    data: { rating: 5, comment: "E2E review for thesis demo" },
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(review.status()).toBe(201);

  const adminReviews = await request.get(`${API_BASE}/admin/reviews?status=PENDING`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  const reviewRow = (await adminReviews.json()).data.find((r: { comment: string }) =>
    r.comment.includes("E2E review"),
  );
  const approve = await request.patch(`${API_BASE}/admin/reviews/${reviewRow.id}/status`, {
    data: { status: "APPROVED" },
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(approve.status()).toBe(200);

  const publicReviews = await request.get(`${API_BASE}/specialists/${specRow.id}/reviews`);
  const body = await publicReviews.json();
  expect(body.data.length).toBeGreaterThan(0);
});
