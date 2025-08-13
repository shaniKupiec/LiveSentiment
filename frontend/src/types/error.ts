export interface ErrorResponse {
  errorCode: string;
  message: string;
  userMessage: string;
  timestamp: string;
}

export interface SuccessResponse<T> {
  data: T;
  success: boolean;
  timestamp: string;
}

export interface ApiErrorInterface {
  status?: number;
  errorCode?: string;
  userMessage?: string;
  name: string;
  message: string;
  stack?: string;
}

export class ApiError extends Error implements ApiErrorInterface {
  status?: number;
  errorCode?: string;
  userMessage?: string;

  constructor(message: string, status?: number, errorCode?: string, userMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.userMessage = userMessage;
  }
}

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again later.";
export const NETWORK_ERROR_MESSAGE = "Unable to connect to the server. Please check your internet connection and try again.";
export const SERVER_ERROR_MESSAGE = "Server error occurred. Please try again later."; 