import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
