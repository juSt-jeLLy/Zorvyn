import { Role, UserStatus } from "../../domain/models";
import { z } from "zod";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../config/constants";

const userIdSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
});

export const createUserBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus).optional().default(UserStatus.ACTIVE),
});

export const updateUserBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const userIdParamSchema = userIdSchema;

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamSchema>;
