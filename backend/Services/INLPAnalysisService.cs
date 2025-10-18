using LiveSentiment.Models;

namespace LiveSentiment.Services
{
    /// <summary>
    /// Interface for NLP analysis services
    /// </summary>
    public interface INLPAnalysisService
    {
        /// <summary>
        /// Analyze a text response for sentiment, emotion, and keywords
        /// </summary>
        /// <param name="text">The text to analyze</param>
        /// <param name="options">Analysis options</param>
        /// <returns>Analysis result</returns>
        Task<AnalysisResult> AnalyzeResponseAsync(string text, AnalysisOptions options);

        /// <summary>
        /// Check if the service is available and healthy
        /// </summary>
        /// <returns>True if service is available</returns>
        Task<bool> IsHealthyAsync();

        /// <summary>
        /// Get the name of the service provider
        /// </summary>
        /// <returns>Provider name</returns>
        string GetProviderName();
    }
}
