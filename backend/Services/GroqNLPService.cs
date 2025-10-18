using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using LiveSentiment.Models;

namespace LiveSentiment.Services
{
    /// <summary>
    /// Groq NLP analysis service using direct HTTP API calls
    /// </summary>
    public class GroqNLPService : INLPAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GroqNLPService> _logger;
        private readonly string _model;
        private readonly string _apiKey;

        public GroqNLPService(HttpClient httpClient, IConfiguration configuration, ILogger<GroqNLPService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _model = configuration["Groq:Model"] ?? "llama-3.3-70b-versatile";
            
            // Try multiple configuration sources for the API key
            _apiKey = configuration["Groq:ApiKey"] ?? 
                     configuration["GROQ_API_KEY"] ?? 
                     Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? "";
            
            // TEMPORARY: Add your API key directly here for testing
            if (string.IsNullOrEmpty(_apiKey))
            {
                _apiKey = "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"; // TODO: Move to environment variable
                _logger.LogWarning("Using hardcoded API key for testing - REMOVE THIS IN PRODUCTION!");
            }
            
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("Groq API key is not configured. NLP analysis will be disabled.");
                // Don't throw exception, just log warning and disable service
            }
            else
            {
                _logger.LogInformation("Groq API key configured successfully (length: {Length})", _apiKey.Length);
            }
        }

        public async Task<AnalysisResult> AnalyzeResponseAsync(string text, AnalysisOptions options)
        {
            try
            {
                _logger.LogInformation("Starting Groq analysis for text: {TextLength} characters", text.Length);

                // Check if API key is configured
                if (string.IsNullOrEmpty(_apiKey))
                {
                    _logger.LogWarning("Groq API key not configured, skipping analysis");
                    return new AnalysisResult
                    {
                        Provider = "groq",
                        ErrorMessage = "Groq API key not configured",
                        IsCompleted = false
                    };
                }

                var result = new AnalysisResult
                {
                    Provider = "groq"
                };

                // Build the analysis prompt based on enabled options
                var prompt = BuildAnalysisPrompt(text, options);
                
                var requestBody = new
                {
                    model = _model,
                    messages = new[]
                    {
                        new { role = "system", content = GetSystemPrompt() },
                        new { role = "user", content = prompt }
                    },
                    temperature = 0.1f,
                    max_tokens = 1000
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
                {
                    Content = content
                };
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var groqResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                var messageContent = groqResponse.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

                if (string.IsNullOrEmpty(messageContent))
                {
                    throw new InvalidOperationException("Empty response content from Groq API");
                }

                _logger.LogInformation("Groq analysis completed successfully");

                // Parse the JSON response
                result = ParseAnalysisResult(messageContent, options);
                result.Provider = "groq";
                result.IsCompleted = true;

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during Groq analysis");
                return new AnalysisResult
                {
                    Provider = "groq",
                    ErrorMessage = ex.Message,
                    IsCompleted = false
                };
            }
        }

        public async Task<bool> IsHealthyAsync()
        {
            try
            {
                var requestBody = new
                {
                    model = _model,
                    messages = new[]
                    {
                        new { role = "user", content = "Test" }
                    },
                    max_tokens = 10
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
                {
                    Content = content
                };
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Groq service health check failed");
                return false;
            }
        }

        public string GetProviderName() => "groq";

        private string GetSystemPrompt()
        {
            return @"You are an expert NLP analysis system. Analyze the given text and return ONLY a valid JSON response with the requested analysis.

Response format:
{
  ""sentiment"": {
    ""label"": ""positive|negative|neutral"",
    ""confidence"": 0.0-1.0
  },
  ""emotion"": {
    ""label"": ""joy|sadness|anger|fear|surprise|disgust|neutral"",
    ""confidence"": 0.0-1.0
  },
  ""keywords"": [
    {
      ""text"": ""keyword"",
      ""relevance"": 0.0-1.0
    }
  ]
}

Only include fields that are requested. Be precise and consistent in your analysis.";
        }

        private string BuildAnalysisPrompt(string text, AnalysisOptions options)
        {
            var requestedAnalyses = new List<string>();

            if (options.EnableSentimentAnalysis)
                requestedAnalyses.Add("sentiment analysis (positive/negative/neutral)");

            if (options.EnableEmotionAnalysis)
                requestedAnalyses.Add("emotion detection (joy, sadness, anger, fear, surprise, disgust, neutral)");

            if (options.EnableKeywordExtraction)
                requestedAnalyses.Add("keyword extraction (top 5 most relevant keywords)");

            var analysisList = string.Join(", ", requestedAnalyses);
            
            return $"Please analyze the following text for: {analysisList}\n\nText: \"{text}\"\n\nReturn only the JSON response with the requested analysis fields.";
        }

        private AnalysisResult ParseAnalysisResult(string jsonContent, AnalysisOptions options)
        {
            try
            {
                var result = new AnalysisResult
                {
                    Provider = "groq",
                    IsCompleted = true
                };

                // Clean the JSON content (remove any markdown formatting)
                var cleanJson = jsonContent.Trim();
                
                // Remove markdown code block markers
                if (cleanJson.StartsWith("```json"))
                {
                    cleanJson = cleanJson.Substring(7);
                }
                else if (cleanJson.StartsWith("```"))
                {
                    cleanJson = cleanJson.Substring(3);
                }
                
                if (cleanJson.EndsWith("```"))
                {
                    cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);
                }
                
                cleanJson = cleanJson.Trim();
                
                _logger.LogInformation("Cleaned JSON content: {CleanJson}", cleanJson);

                var jsonDoc = JsonDocument.Parse(cleanJson);
                var root = jsonDoc.RootElement;

                // Parse sentiment analysis
                if (options.EnableSentimentAnalysis && root.TryGetProperty("sentiment", out var sentimentElement))
                {
                    result.Sentiment = new SentimentResult
                    {
                        Label = sentimentElement.GetProperty("label").GetString() ?? "neutral",
                        Confidence = sentimentElement.TryGetProperty("confidence", out var conf) ? conf.GetDouble() : 0.5
                    };
                }

                // Parse emotion analysis
                if (options.EnableEmotionAnalysis && root.TryGetProperty("emotion", out var emotionElement))
                {
                    result.Emotion = new EmotionResult
                    {
                        Label = emotionElement.GetProperty("label").GetString() ?? "neutral",
                        Confidence = emotionElement.TryGetProperty("confidence", out var conf) ? conf.GetDouble() : 0.5
                    };
                }

                // Parse keyword extraction
                if (options.EnableKeywordExtraction && root.TryGetProperty("keywords", out var keywordsElement))
                {
                    result.Keywords = new List<KeywordResult>();
                    foreach (var keywordElement in keywordsElement.EnumerateArray())
                    {
                        result.Keywords.Add(new KeywordResult
                        {
                            Text = keywordElement.GetProperty("text").GetString() ?? "",
                            Relevance = keywordElement.TryGetProperty("relevance", out var rel) ? rel.GetDouble() : 0.5
                        });
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing Groq analysis result: {JsonContent}", jsonContent);
                return new AnalysisResult
                {
                    Provider = "groq",
                    ErrorMessage = $"Failed to parse analysis result: {ex.Message}",
                    IsCompleted = false
                };
            }
        }
    }
}
