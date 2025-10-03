// Environment configuration for LiveSentiment
export const config = {
  // Base URL for the application
  baseUrl: import.meta.env.DEV 
    ? 'http://localhost:5173' 
    : window.location.origin,

  // API configuration
  apiBaseUrl: import.meta.env.DEV 
    ? 'http://localhost:5000' 
    : '', // Use relative URLs in production - nginx will proxy to backend

  // Environment type
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Error messages
  errorMessages: {
    default: "Something went wrong. Please try again later.",
    network: "Unable to connect to the server. Please check your internet connection and try again.",
    server: "Server error occurred. Please try again later.",
  },
} as const;

// Helper function to generate audience URL for a presentation
export const getAudienceUrl = (presentationId: string): string => {
  return `${config.baseUrl}/audience/${presentationId}`;
};

// Helper function to generate QR code data for a presentation
export const getQRCodeData = (presentationId: string): string => {
  return getAudienceUrl(presentationId);
};
