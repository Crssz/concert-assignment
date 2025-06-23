export interface AuthUser {
  id: string;
  email: string;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
