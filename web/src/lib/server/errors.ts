export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (m = "Invalid request", d?: unknown) => new ApiError(400, "BAD_REQUEST", m, d);
export const unauthorized = (m = "Authentication required") => new ApiError(401, "UNAUTHORIZED", m);
export const forbidden = (m = "You do not have permission to perform this action") => new ApiError(403, "FORBIDDEN", m);
export const notFound = (m = "Not found") => new ApiError(404, "NOT_FOUND", m);
export const conflict = (m: string) => new ApiError(409, "CONFLICT", m);
export const tooMany = (m = "Too many requests", retryAfter = 60) =>
  Object.assign(new ApiError(429, "RATE_LIMITED", m), { retryAfter });
