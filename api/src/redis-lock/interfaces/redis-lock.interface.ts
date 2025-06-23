export interface LockOptions {
  ttl?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface ExtendLockOptions {
  ttl: number;
}

export interface LockResult {
  lockId: string;
  key: string;
  ttl: number;
}

export interface LockError {
  code: string;
  message: string;
  key: string;
}
