import { Router } from "express";
import { Role } from "../../domain/models";
import { validateRequest } from "../../middleware/validation.middleware";
import type { AuthGuards } from "../auth/auth.middleware";
import type { DashboardController } from "./dashboard.controller";
import { dashboardSummaryQuerySchema, dashboardTrendQuerySchema } from "./dashboard.validation";

export const buildDashboardRouter = (dashboardController: DashboardController, authGuards: AuthGuards): Router => {
  const router = Router();

  router.use(authGuards.requireAuthenticatedUser);
  router.use(authGuards.requireRoles(Role.ADMIN, Role.ANALYST, Role.VIEWER));

  router.get("/summary", validateRequest(dashboardSummaryQuerySchema, "query"), dashboardController.getSummary);
  router.get("/trend", validateRequest(dashboardTrendQuerySchema, "query"), dashboardController.getTrend);

  return router;
};
