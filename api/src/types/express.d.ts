import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
