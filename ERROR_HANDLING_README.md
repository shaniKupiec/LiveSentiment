# Error Handling System Documentation

## Overview
This document describes the comprehensive error handling system implemented for the LiveSentiment application, covering both backend and frontend components.

## Backend Implementation

### 1. Standardized Error Response Format
All HTTP responses now follow a consistent JSON format:

**Error Response:**
```json
{
  "errorCode": "AUTH_001",
  "message": "User not authenticated",
  "userMessage": "Please log in to access your presentations.",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Success Response:**
```json
{
  "data": { /* actual data */ },
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Error Codes
The system uses standardized error codes for different types of errors:

- **Authentication (AUTH_***):** UNAUTHORIZED, INVALID_CREDENTIALS, EMAIL_ALREADY_EXISTS
- **Validation (VAL_***):** VALIDATION_ERROR, INVALID_INPUT
- **Resources (RES_***):** NOT_FOUND, ALREADY_EXISTS
- **Server (SRV_***):** INTERNAL_ERROR, DATABASE_ERROR, NETWORK_ERROR
- **Presentation (PRES_***):** PRESENTATION_NOT_FOUND, PRESENTATION_ACCESS_DENIED

### 3. Components

#### ErrorModels.cs
- Defines `ErrorResponse` and `SuccessResponse<T>` classes
- Contains all error code constants

#### GlobalExceptionHandler.cs
- Middleware that catches all unhandled exceptions
- Maps different exception types to appropriate error responses
- Ensures consistent error format across the application

#### ControllerExtensions.cs
- Extension methods for controllers to return standardized responses
- Methods: `Success<T>`, `Error`, `NotFound`, `Unauthorized`, `BadRequest`, etc.

### 4. Usage in Controllers
Controllers now use extension methods for consistent responses:

```csharp
// Success response
return this.Success(presentations);

// Error response
return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access your presentations.");
```

## Frontend Implementation

### 1. Error Types and Interfaces
- `ErrorResponse`: Matches backend error response format
- `SuccessResponse<T>`: Matches backend success response format
- `ApiError`: Extended Error interface with additional properties

### 2. Global Error Handler Component
- `ErrorProvider`: Context provider for error handling
- `useErrorHandler`: Hook to access error handling functions
- Displays user-friendly error messages as toast notifications
- Auto-clears errors after 5 seconds

### 3. API Service Updates
- Removed old error handling logic
- Now parses standardized backend responses
- Handles network errors and server communication failures
- Throws `ApiError` objects with user-friendly messages

### 4. Usage in Components
Components use the error handler hook:

```typescript
const { showError } = useErrorHandler();

try {
  const data = await apiService.login(credentials);
  // Handle success
} catch (error) {
  showError(error); // Automatically displays user-friendly message
}
```

## Error Handling Flow

### Backend Flow
1. Request reaches controller
2. Controller validates input and processes request
3. If error occurs, controller returns standardized error response
4. If unhandled exception occurs, `GlobalExceptionHandler` catches it
5. Exception is mapped to appropriate error response and returned

### Frontend Flow
1. API request is made
2. If successful, response data is extracted from `SuccessResponse`
3. If error occurs, `ApiError` is thrown with user-friendly message
4. Component catches error and calls `showError()`
5. Error handler displays toast notification with user message

## Benefits

1. **Consistency**: All errors follow the same format
2. **User Experience**: Users see friendly, actionable error messages
3. **Developer Experience**: Easy to debug with detailed error codes and messages
4. **Maintainability**: Centralized error handling logic
5. **Extensibility**: Easy to add new error types and codes

## Example Scenarios

### Authentication Error
- **Backend**: Returns 401 with `AUTH_001` error code
- **Frontend**: Shows "Please log in to access your presentations."

### Validation Error
- **Backend**: Returns 400 with `VAL_001` error code
- **Frontend**: Shows "Please check your input and try again."

### Network Error
- **Frontend**: Automatically detects network failure and shows "Unable to connect to the server. Please check your internet connection."

## Future Enhancements

1. **Error Logging**: Add structured logging for errors
2. **Error Analytics**: Track error frequency and types
3. **Retry Logic**: Implement automatic retry for transient errors
4. **Error Boundaries**: Add React error boundaries for component-level error handling
5. **Internationalization**: Support multiple languages for error messages 