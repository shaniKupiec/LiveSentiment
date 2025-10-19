using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using LiveSentiment.Models;

namespace LiveSentiment.Services
{
    /// <summary>
    /// Hugging Face NLP analysis service using their Inference API
    /// </summary>
    public class HuggingFaceNLPService : INLPAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<HuggingFaceNLPService> _logger;
        private readonly string? _apiKey;

        // Hugging Face model endpoints
        private const string SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";
        private const string EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base";
        private const string KEYWORDS_MODEL = "yiyanghkust/finbert-tone";

        public HuggingFaceNLPService(HttpClient httpClient, IConfiguration configuration, ILogger<HuggingFaceNLPService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["HuggingFace:ApiKey"]; // Optional - many models work without API key
        }

        public async Task<AnalysisResult> AnalyzeResponseAsync(string text, AnalysisOptions options)
        {
            try
            {
                _logger.LogInformation("Starting Hugging Face analysis for text: {TextLength} characters", text.Length);

                var result = new AnalysisResult
                {
                    Provider = "huggingface"
                };

                var tasks = new List<Task>();

                // Run sentiment analysis
                if (options.EnableSentimentAnalysis)
                {
                    tasks.Add(Task.Run(async () =>
                    {
                        result.Sentiment = await AnalyzeSentimentAsync(text);
                    }));
                }

                // Run emotion analysis
                if (options.EnableEmotionAnalysis)
                {
                    tasks.Add(Task.Run(async () =>
                    {
                        result.Emotion = await AnalyzeEmotionAsync(text);
                    }));
                }

                // Run keyword extraction
                if (options.EnableKeywordExtraction)
                {
                    tasks.Add(Task.Run(async () =>
                    {
                        result.Keywords = await ExtractKeywordsAsync(text);
                    }));
                }

                // Wait for all analyses to complete
                await Task.WhenAll(tasks);

                result.IsCompleted = true;
                _logger.LogInformation("Hugging Face analysis completed successfully");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during Hugging Face analysis");
                return new AnalysisResult
                {
                    Provider = "huggingface",
                    ErrorMessage = ex.Message,
                    IsCompleted = false
                };
            }
        }

        public async Task<bool> IsHealthyAsync()
        {
            try
            {
                var testRequest = new { inputs = "test" };
                var json = JsonSerializer.Serialize(testRequest);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, $"https://api-inference.huggingface.co/models/{SENTIMENT_MODEL}")
                {
                    Content = content
                };

                if (!string.IsNullOrEmpty(_apiKey))
                {
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
                }

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Hugging Face service health check failed");
                return false;
            }
        }

        public string GetProviderName() => "huggingface";

        private async Task<SentimentResult> AnalyzeSentimentAsync(string text)
        {
            try
            {
                var request = new { inputs = text };
                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"https://api-inference.huggingface.co/models/{SENTIMENT_MODEL}")
                {
                    Content = content
                };

                if (!string.IsNullOrEmpty(_apiKey))
                {
                    httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
                }

                var response = await _httpClient.SendAsync(httpRequest);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var sentimentData = JsonSerializer.Deserialize<JsonElement[]>(responseContent);

                if (sentimentData != null && sentimentData.Length > 0)
                {
                    var topResult = sentimentData[0];
                    var label = topResult.GetProperty("label").GetString() ?? "neutral";
                    var score = topResult.GetProperty("score").GetDouble();

                    // Convert Hugging Face labels to our format
                    var normalizedLabel = label.ToLower() switch
                    {
                        "label_0" or "negative" => "negative",
                        "label_1" or "neutral" => "neutral",
                        "label_2" or "positive" => "positive",
                        _ => "neutral"
                    };

                    return new SentimentResult
                    {
                        Label = normalizedLabel,
                        Confidence = score
                    };
                }

                return new SentimentResult { Label = "neutral", Confidence = 0.5 };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in sentiment analysis");
                return new SentimentResult { Label = "neutral", Confidence = 0.0 };
            }
        }

        private async Task<EmotionResult> AnalyzeEmotionAsync(string text)
        {
            try
            {
                var request = new { inputs = text };
                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"https://api-inference.huggingface.co/models/{EMOTION_MODEL}")
                {
                    Content = content
                };

                if (!string.IsNullOrEmpty(_apiKey))
                {
                    httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
                }

                var response = await _httpClient.SendAsync(httpRequest);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var emotionData = JsonSerializer.Deserialize<JsonElement[]>(responseContent);

                if (emotionData != null && emotionData.Length > 0)
                {
                    var topResult = emotionData[0];
                    var label = topResult.GetProperty("label").GetString() ?? "neutral";
                    var score = topResult.GetProperty("score").GetDouble();

                    return new EmotionResult
                    {
                        Label = label.ToLower(),
                        Confidence = score
                    };
                }

                return new EmotionResult { Label = "neutral", Confidence = 0.5 };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in emotion analysis");
                return new EmotionResult { Label = "neutral", Confidence = 0.0 };
            }
        }

        private async Task<List<KeywordResult>> ExtractKeywordsAsync(string text)
        {
            try
            {
                // For keyword extraction, we'll use a simple approach with Hugging Face
                // Since there's no direct keyword extraction model, we'll use NER (Named Entity Recognition)
                var request = new { inputs = text };
                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api-inference.huggingface.co/models/dbmdz/bert-large-cased-finetuned-conll03-english")
                {
                    Content = content
                };

                if (!string.IsNullOrEmpty(_apiKey))
                {
                    httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
                }

                var response = await _httpClient.SendAsync(httpRequest);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var nerData = JsonSerializer.Deserialize<JsonElement[]>(responseContent);

                var keywords = new List<KeywordResult>();

                if (nerData != null && nerData.Length > 0)
                {
                    foreach (var entity in nerData)
                    {
                        var word = entity.GetProperty("word").GetString();
                        var score = entity.GetProperty("score").GetDouble();
                        var entityGroup = entity.GetProperty("entity_group").GetString();

                        if (!string.IsNullOrEmpty(word) && !string.IsNullOrEmpty(entityGroup))
                        {
                            keywords.Add(new KeywordResult
                            {
                                Text = word.Replace("##", ""), // Clean BERT subword tokens
                                Relevance = score
                            });
                        }
                    }
                }

                // If no entities found, extract simple keywords from text
                if (keywords.Count == 0)
                {
                    var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                        .Where(w => w.Length > 3 && !IsStopWord(w))
                        .Take(5)
                        .Select(w => new KeywordResult { Text = w, Relevance = 0.7 })
                        .ToList();
                    keywords.AddRange(words);
                }

                return keywords.Take(5).ToList(); // Limit to top 5 keywords
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in keyword extraction");
                return new List<KeywordResult>();
            }
        }

        private static bool IsStopWord(string word)
        {
            var stopWords = new HashSet<string>
            {
                "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
                "this", "that", "these", "those", "is", "are", "was", "were", "be", "been", "being",
                "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may",
                "might", "must", "can", "shall", "i", "you", "he", "she", "it", "we", "they", "me",
                "him", "her", "us", "them", "my", "your", "his", "her", "its", "our", "their"
            };
            return stopWords.Contains(word.ToLower());
        }
    }
}
