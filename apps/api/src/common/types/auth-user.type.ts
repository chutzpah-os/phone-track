import type { SessionUser } from '@phonetrack/shared';

export type AuthenticatedUser = SessionUser;

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
