namespace LiveSentiment.Models
{
    public class ErrorResponse
    {
        public string ErrorCode { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string UserMessage { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class SuccessResponse<T>
    {
        public T Data { get; set; } = default!;
        public bool Success { get; set; } = true;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public static class ErrorCodes
    {
        // Authentication errors
        public const string UNAUTHORIZED = "AUTH_001";
        public const string INVALID_CREDENTIALS = "AUTH_002";
        public const string EMAIL_ALREADY_EXISTS = "AUTH_003";
        
        // Validation errors
        public const string VALIDATION_ERROR = "VAL_001";
        public const string INVALID_INPUT = "VAL_002";
        
        // Resource errors
        public const string NOT_FOUND = "RES_001";
        public const string ALREADY_EXISTS = "RES_002";
        
        // Server errors
        public const string INTERNAL_ERROR = "SRV_001";
        public const string DATABASE_ERROR = "SRV_002";
        public const string NETWORK_ERROR = "SRV_003";
        
        // Presentation errors
        public const string PRESENTATION_NOT_FOUND = "PRES_001";
        public const string PRESENTATION_ACCESS_DENIED = "PRES_002";
        
        // Question errors
        public const string QUESTION_NOT_FOUND = "QST_001";
        public const string QUESTION_ACCESS_DENIED = "QST_002";
        public const string QUESTION_CONFIGURATION_ERROR = "QST_003";
        
        // Access control
        public const string ACCESS_DENIED = "ACC_001";
    }
} 