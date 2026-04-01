import { Router } from "express";
import type { AppContainer } from "../container";
import { openApiDocument } from "../docs/openapi";
import { buildAuthRouter } from "../modules/auth/auth.routes";
import { buildDashboardRouter } from "../modules/dashboard/dashboard.routes";
import { buildFinancialRecordRouter } from "../modules/financial-records/financial-record.routes";
import { buildUserRouter } from "../modules/users/user.routes";

export const buildApiRouter = (container: AppContainer): Router => {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({
      data: {
        status: "ok",
      },
    });
  });

  router.get("/docs", (_req, res) => {
    res.status(200).json({ data: openApiDocument });
  });

  router.use("/auth", buildAuthRouter(container.authController));
  router.use("/users", buildUserRouter(container.userController, container.authGuards));
  router.use(
    "/records",
    buildFinancialRecordRouter(container.financialRecordController, container.authGuards),
  );
  router.use("/dashboard", buildDashboardRouter(container.dashboardController, container.authGuards));

  return router;
};
