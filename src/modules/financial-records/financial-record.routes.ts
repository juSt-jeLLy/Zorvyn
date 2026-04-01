import { Router } from "express";
import { Role } from "../../domain/models";
import { validateRequest } from "../../middleware/validation.middleware";
import type { AuthGuards } from "../auth/auth.middleware";
import type { FinancialRecordController } from "./financial-record.controller";
import {
  createFinancialRecordBodySchema,
  listFinancialRecordQuerySchema,
  recordIdParamSchema,
  updateFinancialRecordBodySchema,
} from "./financial-record.validation";

export const buildFinancialRecordRouter = (
  financialRecordController: FinancialRecordController,
  authGuards: AuthGuards,
): Router => {
  const router = Router();

  router.use(authGuards.requireAuthenticatedUser);

  router.get(
    "/",
    authGuards.requireRoles(Role.ADMIN, Role.ANALYST),
    validateRequest(listFinancialRecordQuerySchema, "query"),
    financialRecordController.listRecords,
  );
  router.get(
    "/:recordId",
    authGuards.requireRoles(Role.ADMIN, Role.ANALYST),
    validateRequest(recordIdParamSchema, "params"),
    financialRecordController.getRecordById,
  );
  router.post(
    "/",
    authGuards.requireRoles(Role.ADMIN),
    validateRequest(createFinancialRecordBodySchema, "body"),
    financialRecordController.createRecord,
  );
  router.patch(
    "/:recordId",
    authGuards.requireRoles(Role.ADMIN),
    validateRequest(recordIdParamSchema, "params"),
    validateRequest(updateFinancialRecordBodySchema, "body"),
    financialRecordController.updateRecord,
  );
  router.delete(
    "/:recordId",
    authGuards.requireRoles(Role.ADMIN),
    validateRequest(recordIdParamSchema, "params"),
    financialRecordController.deleteRecord,
  );

  return router;
};
