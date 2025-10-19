using Microsoft.Extensions.Logging;
using LiveSentiment.Models;

namespace LiveSentiment.Services
{
    /// <summary>
    /// Hybrid NLP service that uses Groq as primary and Hugging Face as fallback
    /// </summary>
    public class HybridNLPService : INLPAnalysisService
    {
        private readonly GroqNLPService _groqService;
        private readonly HuggingFaceNLPService _huggingFaceService;
        private readonly ILogger<HybridNLPService> _logger;

        public HybridNLPService(
            GroqNLPService groqService,
            HuggingFaceNLPService huggingFaceService,
            ILogger<HybridNLPService> logger)
        {
            _groqService = groqService;
            _huggingFaceService = huggingFaceService;
            _logger = logger;
        }

        public async Task<AnalysisResult> AnalyzeResponseAsync(string text, AnalysisOptions options)
        {
            _logger.LogInformation("Starting hybrid NLP analysis for text: {TextLength} characters", text.Length);

            // Try Groq first (primary service)
            try
            {
                _logger.LogInformation("Attempting analysis with Groq service");
                var groqResult = await _groqService.AnalyzeResponseAsync(text, options);
                
                if (groqResult.IsCompleted && string.IsNullOrEmpty(groqResult.ErrorMessage))
                {
                    _logger.LogInformation("Groq analysis completed successfully");
                    return groqResult;
                }
                
                _logger.LogWarning("Groq analysis failed or incomplete: {Error}", groqResult.ErrorMessage);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Groq service failed, falling back to Hugging Face");
            }

            // Fallback to Hugging Face - COMMENTED OUT FOR NOW
            // TODO: Uncomment when HuggingFace API key is available
            /*
            try
            {
                _logger.LogInformation("Attempting analysis with Hugging Face service");
                var hfResult = await _huggingFaceService.AnalyzeResponseAsync(text, options);
                
                if (hfResult.IsCompleted && string.IsNullOrEmpty(hfResult.ErrorMessage))
                {
                    _logger.LogInformation("Hugging Face analysis completed successfully");
                    return hfResult;
                }
                
                _logger.LogWarning("Hugging Face analysis failed or incomplete: {Error}", hfResult.ErrorMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Both NLP services failed");
            }
            */

            // If both services fail, return error result
            return new AnalysisResult
            {
                Provider = "none",
                ErrorMessage = "All NLP services are currently unavailable",
                IsCompleted = false
            };
        }

        public async Task<bool> IsHealthyAsync()
        {
            // Check if at least one service is healthy
            var groqHealthy = await _groqService.IsHealthyAsync();
            // var hfHealthy = await _huggingFaceService.IsHealthyAsync(); // COMMENTED OUT FOR NOW
            
            var isHealthy = groqHealthy; // Only check Groq for now
            
            _logger.LogInformation("Hybrid service health check - Groq: {GroqHealthy}, Overall: {IsHealthy}", 
                groqHealthy, isHealthy);
            
            return isHealthy;
        }

        public string GetProviderName() => "hybrid";

        /// <summary>
        /// Get the status of both services
        /// </summary>
        /// <returns>Service status information</returns>
        public async Task<ServiceStatus> GetServiceStatusAsync()
        {
            var groqHealthy = await _groqService.IsHealthyAsync();
            // var hfHealthy = await _huggingFaceService.IsHealthyAsync(); // COMMENTED OUT FOR NOW

            return new ServiceStatus
            {
                GroqAvailable = groqHealthy,
                HuggingFaceAvailable = false, // Set to false since it's commented out
                PrimaryService = groqHealthy ? "groq" : "none",
                LastChecked = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Service status information
    /// </summary>
    public class ServiceStatus
    {
        public bool GroqAvailable { get; set; }
        public bool HuggingFaceAvailable { get; set; }
        public string PrimaryService { get; set; } = string.Empty;
        public DateTime LastChecked { get; set; }
    }
}
