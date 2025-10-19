using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using LiveSentiment.Data;
using LiveSentiment.Models;
using Microsoft.AspNetCore.SignalR;
using LiveSentiment.Hubs;

namespace LiveSentiment.Services
{
    /// <summary>
    /// Service for processing and analyzing responses
    /// </summary>
    public class ResponseAnalysisService
    {
        private readonly AppDbContext _context;
        private readonly HybridNLPService _nlpService;
        private readonly ILogger<ResponseAnalysisService> _logger;
        private readonly IHubContext<PollHub> _hubContext;

        public ResponseAnalysisService(
            AppDbContext context,
            HybridNLPService nlpService,
            ILogger<ResponseAnalysisService> logger,
            IHubContext<PollHub> hubContext)
        {
            _context = context;
            _nlpService = nlpService;
            _logger = logger;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Process a response for NLP analysis if the question has NLP features enabled
        /// </summary>
        /// <param name="responseId">The response ID to analyze</param>
        /// <returns>True if analysis was performed</returns>
        public async Task<bool> ProcessResponseAsync(Guid responseId)
        {
            try
            {
                _logger.LogInformation("Processing response {ResponseId} for NLP analysis", responseId);

                // Get the response with its question
                var response = await _context.Responses
                    .Include(r => r.Question)
                    .FirstOrDefaultAsync(r => r.Id == responseId);
                
                _logger.LogInformation("Response text: '{Text}' (length: {Length})", response?.Value, response?.Value?.Length ?? 0);

                if (response == null)
                {
                    _logger.LogWarning("Response {ResponseId} not found", responseId);
                    return false;
                }

                // Check if the question supports NLP analysis
                _logger.LogInformation("Question details - Type: {Type}, Sentiment: {Sentiment}, Emotion: {Emotion}, Keywords: {Keywords}", 
                    response.Question.Type, response.Question.EnableSentimentAnalysis, response.Question.EnableEmotionAnalysis, response.Question.EnableKeywordExtraction);
                
                if (!ShouldAnalyzeResponse(response.Question, response.Value))
                {
                    _logger.LogInformation("Response {ResponseId} does not require analysis", responseId);
                    return false;
                }

                // Check if analysis is already completed
                if (response.AnalysisCompleted)
                {
                    _logger.LogInformation("Response {ResponseId} already analyzed", responseId);
                    return true;
                }

                // Perform NLP analysis
                var analysisOptions = new AnalysisOptions
                {
                    EnableSentimentAnalysis = response.Question.EnableSentimentAnalysis,
                    EnableEmotionAnalysis = response.Question.EnableEmotionAnalysis,
                    EnableKeywordExtraction = response.Question.EnableKeywordExtraction
                };

                _logger.LogInformation("Analyzing response {ResponseId} with options: Sentiment={Sentiment}, Emotion={Emotion}, Keywords={Keywords}",
                    responseId, analysisOptions.EnableSentimentAnalysis, analysisOptions.EnableEmotionAnalysis, analysisOptions.EnableKeywordExtraction);

                var analysisResult = await _nlpService.AnalyzeResponseAsync(response.Value, analysisOptions);

                // Update the response with analysis results
                response.AnalysisResults = JsonDocument.Parse(JsonSerializer.Serialize(analysisResult));
                response.AnalysisTimestamp = analysisResult.AnalysisTimestamp;
                response.AnalysisCompleted = analysisResult.IsCompleted;
                response.AnalysisProvider = analysisResult.Provider;
                response.AnalysisError = analysisResult.ErrorMessage;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Response {ResponseId} analysis completed successfully using {Provider}",
                    responseId, analysisResult.Provider);

                // Send SignalR event to notify frontend that NLP analysis is complete
                try
                {
                    await _hubContext.Clients.Group($"presenter_{response.Question.PresentationId}")
                        .SendAsync("NLPAnalysisCompleted", new
                        {
                            QuestionId = response.QuestionId.ToString(),
                            ResponseId = responseId.ToString(),
                            AnalysisResults = analysisResult,
                            AnalysisTimestamp = analysisResult.AnalysisTimestamp.ToString("O")
                        });
                    
                    _logger.LogInformation("Sent NLPAnalysisCompleted event for response {ResponseId}", responseId);
                }
                catch (Exception signalREx)
                {
                    _logger.LogWarning(signalREx, "Failed to send NLPAnalysisCompleted event for response {ResponseId}", responseId);
                    // Don't fail the analysis if SignalR fails
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing response {ResponseId} for analysis", responseId);
                
                // Update response with error information
                try
                {
                    var response = await _context.Responses.FindAsync(responseId);
                    if (response != null)
                    {
                        response.AnalysisCompleted = false;
                        response.AnalysisError = ex.Message;
                        response.AnalysisTimestamp = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception updateEx)
                {
                    _logger.LogError(updateEx, "Error updating response {ResponseId} with error information", responseId);
                }

                return false;
            }
        }

        /// <summary>
        /// Process multiple responses in batch
        /// </summary>
        /// <param name="responseIds">List of response IDs to analyze</param>
        /// <returns>Number of responses successfully analyzed</returns>
        public async Task<int> ProcessResponsesBatchAsync(IEnumerable<Guid> responseIds)
        {
            var successCount = 0;
            var tasks = responseIds.Select(async responseId =>
            {
                try
                {
                    var success = await ProcessResponseAsync(responseId);
                    if (success) Interlocked.Increment(ref successCount);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in batch processing for response {ResponseId}", responseId);
                }
            });

            await Task.WhenAll(tasks);
            
            _logger.LogInformation("Batch processing completed: {SuccessCount}/{TotalCount} responses analyzed",
                successCount, responseIds.Count());

            return successCount;
        }

        /// <summary>
        /// Re-analyze a response (useful when analysis failed or needs updating)
        /// </summary>
        /// <param name="responseId">The response ID to re-analyze</param>
        /// <returns>True if re-analysis was successful</returns>
        public async Task<bool> ReanalyzeResponseAsync(Guid responseId)
        {
            try
            {
                var response = await _context.Responses
                    .Include(r => r.Question)
                    .FirstOrDefaultAsync(r => r.Id == responseId);

                if (response == null)
                {
                    _logger.LogWarning("Response {ResponseId} not found for re-analysis", responseId);
                    return false;
                }

                // Reset analysis status
                response.AnalysisCompleted = false;
                response.AnalysisError = null;
                response.AnalysisResults = null;
                response.AnalysisProvider = null;
                response.AnalysisTimestamp = null;

                await _context.SaveChangesAsync();

                // Process the response again
                return await ProcessResponseAsync(responseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error re-analyzing response {ResponseId}", responseId);
                return false;
            }
        }

        /// <summary>
        /// Get analysis statistics for a question
        /// </summary>
        /// <param name="questionId">The question ID</param>
        /// <returns>Analysis statistics</returns>
        public async Task<AnalysisStatistics> GetAnalysisStatisticsAsync(Guid questionId)
        {
            try
            {
                var responses = await _context.Responses
                    .Where(r => r.QuestionId == questionId)
                    .ToListAsync();

                var totalResponses = responses.Count;
                var analyzedResponses = responses.Count(r => r.AnalysisCompleted);

                var statistics = new AnalysisStatistics
                {
                    QuestionId = questionId,
                    TotalResponses = totalResponses,
                    AnalyzedResponses = analyzedResponses
                };

                // Calculate sentiment distribution
                var sentimentCounts = new Dictionary<string, int>();
                var emotionCounts = new Dictionary<string, int>();
                var keywordFrequencies = new Dictionary<string, int>();
                var totalConfidence = 0.0;
                var confidenceCount = 0;

                foreach (var response in responses.Where(r => r.AnalysisCompleted && r.AnalysisResults != null))
                {
                    try
                    {
                        var analysisResult = JsonSerializer.Deserialize<AnalysisResult>(response.AnalysisResults?.RootElement.GetRawText() ?? "{}");
                        
                        if (analysisResult?.Sentiment != null)
                        {
                            var sentiment = analysisResult.Sentiment.Label;
                            sentimentCounts[sentiment] = sentimentCounts.GetValueOrDefault(sentiment, 0) + 1;
                            totalConfidence += analysisResult.Sentiment.Confidence;
                            confidenceCount++;
                        }

                        if (analysisResult?.Emotion != null)
                        {
                            var emotion = analysisResult.Emotion.Label;
                            emotionCounts[emotion] = emotionCounts.GetValueOrDefault(emotion, 0) + 1;
                        }

                        if (analysisResult?.Keywords != null)
                        {
                            foreach (var keyword in analysisResult.Keywords)
                            {
                                keywordFrequencies[keyword.Text] = keywordFrequencies.GetValueOrDefault(keyword.Text, 0) + 1;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error parsing analysis results for response {ResponseId}", response.Id);
                    }
                }

                // Calculate percentages
                statistics.SentimentCounts = sentimentCounts;
                statistics.SentimentPercentages = sentimentCounts.ToDictionary(
                    kvp => kvp.Key,
                    kvp => analyzedResponses > 0 ? (double)kvp.Value / analyzedResponses * 100 : 0
                );

                statistics.EmotionCounts = emotionCounts;
                statistics.EmotionPercentages = emotionCounts.ToDictionary(
                    kvp => kvp.Key,
                    kvp => analyzedResponses > 0 ? (double)kvp.Value / analyzedResponses * 100 : 0
                );

                // Top keywords
                statistics.TopKeywords = keywordFrequencies
                    .OrderByDescending(kvp => kvp.Value)
                    .Take(10)
                    .Select(kvp => new KeywordFrequency
                    {
                        Text = kvp.Key,
                        Count = kvp.Value,
                        Percentage = analyzedResponses > 0 ? (double)kvp.Value / analyzedResponses * 100 : 0,
                        AverageRelevance = 0.7 // Placeholder - would need to calculate from individual results
                    })
                    .ToList();

                statistics.UniqueKeywords = keywordFrequencies.Count;
                statistics.AverageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

                return statistics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating analysis statistics for question {QuestionId}", questionId);
                return new AnalysisStatistics { QuestionId = questionId };
            }
        }

        private static bool ShouldAnalyzeResponse(Question question, string responseValue)
        {
            // Only analyze text-based questions with NLP features enabled
            if (question.Type != QuestionType.OpenEnded && question.Type != QuestionType.WordCloud)
                return false;

            // Check if any NLP features are enabled
            if (!question.EnableSentimentAnalysis && !question.EnableEmotionAnalysis && !question.EnableKeywordExtraction)
                return false;

            // Don't analyze empty or very short responses
            if (string.IsNullOrWhiteSpace(responseValue) || responseValue.Trim().Length < 3)
                return false;

            return true;
        }
    }
}
