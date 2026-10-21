export type AuthErrorStatus = 401 | 403;
export type AuthErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN';

export class AuthError extends Error {
  constructor(
    public readonly status: AuthErrorStatus,
    public readonly code: AuthErrorCode,
  ) {
    super(code);
    this.name = 'AuthError';
  }
}
