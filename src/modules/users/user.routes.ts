import { Router } from "express";
import { Role } from "../../domain/models";
import type { AuthGuards } from "../auth/auth.middleware";
import type { UserController } from "./user.controller";
import { createUserBodySchema, updateUserBodySchema, userIdParamSchema, userListQuerySchema } from "./user.validation";
import { validateRequest } from "../../middleware/validation.middleware";

export const buildUserRouter = (userController: UserController, authGuards: AuthGuards): Router => {
  const router = Router();

  router.use(authGuards.requireAuthenticatedUser);
  router.use(authGuards.requireRoles(Role.ADMIN));

  router.post("/", validateRequest(createUserBodySchema, "body"), userController.createUser);
  router.get("/", validateRequest(userListQuerySchema, "query"), userController.listUsers);
  router.get("/:userId", validateRequest(userIdParamSchema, "params"), userController.getUserById);
  router.patch(
    "/:userId",
    validateRequest(userIdParamSchema, "params"),
    validateRequest(updateUserBodySchema, "body"),
    userController.updateUser,
  );

  return router;
};
