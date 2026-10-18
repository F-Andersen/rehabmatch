import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  adminUserStatusSchema,
  adminUsersQuerySchema,
  listUsersForAdmin,
  updateUserActiveStatus,
} from "../../modules/admin/admin.users.service.js";
import {
  catalogCreateSchema,
  catalogPatchSchema,
  createCatalogAdmin,
  listCatalogAdmin,
  parseCatalogType,
  patchCatalogAdmin,
} from "../../modules/admin/admin.catalog.service.js";
import {
  criteriaPatchSchema,
  listCriteriaAdmin,
  patchCriterionAdmin,
} from "../../modules/admin/admin.criteria.service.js";
import { listAppointmentsQuerySchema } from "../../modules/appointments/appointment.schemas.js";
import { listAdminAppointmentRequests } from "../../modules/appointments/appointment.service.js";
import {
  adminReviewStatusSchema,
  adminReviewsQuerySchema,
} from "../../modules/reviews/review.schemas.js";
import {
  listReviewsForAdmin,
  updateReviewStatusAdmin,
} from "../../modules/reviews/review.service.js";
import {
  adminSpecialistsQuerySchema,
  adminVerificationSchema,
} from "../../modules/specialists/specialist.schemas.js";
import {
  listSpecialistsForAdmin,
  updateSpecialistVerification,
} from "../../modules/specialists/specialist.admin.service.js";
import { getOwnSpecialistProfile } from "../../modules/specialists/specialist.profile.service.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(UserRole.ADMIN));

adminRouter.get("/summary", async (_req, res, next) => {
  try {
    const [users, specialists, pendingSpecialists, pendingReviews, appointmentGroups] =
      await Promise.all([
        prisma.user.count(),
        prisma.specialist.count(),
        prisma.specialist.count({ where: { verificationStatus: "PENDING" } }),
        prisma.review.count({ where: { status: "PENDING" } }),
        prisma.appointmentRequest.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]);

    const appointmentRequests = {
      total: appointmentGroups.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: Object.fromEntries(
        appointmentGroups.map((row) => [row.status, row._count._all]),
      ) as Record<string, number>,
    };

    res.json({
      data: {
        users,
        specialists,
        pendingSpecialists,
        pendingReviews,
        appointmentRequests,
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const query = adminUsersQuerySchema.parse(req.query);
    const result = await listUsersForAdmin(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/users/:id/status", async (req, res, next) => {
  try {
    const input = adminUserStatusSchema.parse(req.body);
    const data = await updateUserActiveStatus(req.params.id, input.isActive);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/specialists", async (req, res, next) => {
  try {
    const query = adminSpecialistsQuerySchema.parse(req.query);
    const result = await listSpecialistsForAdmin(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/specialists/:id", async (req, res, next) => {
  try {
    const specialist = await prisma.specialist.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });
    if (!specialist) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Спеціаліста не знайдено" } });
      return;
    }
    const data = await getOwnSpecialistProfile(specialist.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/specialists/:id/verification", async (req, res, next) => {
  try {
    const input = adminVerificationSchema.parse(req.body);
    const data = await updateSpecialistVerification(req.params.id, input.status);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/reviews", async (req, res, next) => {
  try {
    const query = adminReviewsQuerySchema.parse(req.query);
    const result = await listReviewsForAdmin(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/reviews/:id/status", async (req, res, next) => {
  try {
    const input = adminReviewStatusSchema.parse(req.body);
    const data = await updateReviewStatusAdmin(req.params.id, input.status);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/appointment-requests", async (req, res, next) => {
  try {
    const query = listAppointmentsQuerySchema.parse(req.query);
    const result = await listAdminAppointmentRequests(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/catalog/:type", async (req, res, next) => {
  try {
    const type = parseCatalogType(req.params.type);
    const data = await listCatalogAdmin(type);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/catalog/:type", async (req, res, next) => {
  try {
    const type = parseCatalogType(req.params.type);
    const input = catalogCreateSchema.parse(req.body);
    const data = await createCatalogAdmin(type, input);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/catalog/:type/:id", async (req, res, next) => {
  try {
    const type = parseCatalogType(req.params.type);
    const input = catalogPatchSchema.parse(req.body);
    const data = await patchCatalogAdmin(type, req.params.id, input);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/criteria", async (_req, res, next) => {
  try {
    const data = await listCriteriaAdmin();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/criteria/:id", async (req, res, next) => {
  try {
    const input = criteriaPatchSchema.parse(req.body);
    const data = await patchCriterionAdmin(req.params.id, input);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
