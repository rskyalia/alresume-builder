/**
 * Generic API response envelope used by all backend endpoints.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Shape of error responses returned by the backend.
 */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
