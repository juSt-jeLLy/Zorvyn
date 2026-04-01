import { Router } from "express";
import { validateRequest } from "../../middleware/validation.middleware";
import type { AuthController } from "./auth.controller";
import { loginBodySchema } from "./auth.validation";

export const buildAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  router.post("/login", validateRequest(loginBodySchema, "body"), authController.login);

  return router;
};
