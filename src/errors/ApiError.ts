export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors?: FieldError[];

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message: string, errors?: FieldError[]): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }
}
