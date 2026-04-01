import type { Role } from "../domain/models";

export interface ExecutionContext {
  requestId: string;
  actorUserId?: string;
  actorRole?: Role;
}
