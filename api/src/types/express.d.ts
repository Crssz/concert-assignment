declare module 'express' {
  interface Request {
    user?: UserEntity;
  }
}
