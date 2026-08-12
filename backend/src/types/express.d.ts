import type { AuthenticatedUser } from "../shared/auth/request";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
