import type { AppRole, UserStatus } from "./jwt";

export type AuthenticatedUser = {
  userId: string;
  email: string;
  roleCode: AppRole;
  status: UserStatus;
};
