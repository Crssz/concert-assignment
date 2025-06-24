// Custom error classes for different API error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

// Handle API response and throw appropriate error
export async function handleApiResponse(response: Response) {
  if (response.ok) {
    return response;
  }

  let errorData: { message?: string; error?: string } = { message: 'An error occurred' };
  
  try {
    errorData = await response.json();
  } catch {
    // If response body is not JSON, use status text
    errorData.message = response.statusText || 'An error occurred';
  }

  const message = errorData.message || errorData.error || 'An error occurred';

  switch (response.status) {
    case 400:
      throw new BadRequestError(message);
    case 401:
      throw new UnauthorizedError(message);
    case 404:
      throw new NotFoundError(message);
    case 409:
      throw new ConflictError(message);
    default:
      throw new ApiError(message, response.status);
  }
} 