export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
