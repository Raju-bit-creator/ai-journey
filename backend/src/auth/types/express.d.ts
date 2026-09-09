import type { PublicUser } from '../auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
