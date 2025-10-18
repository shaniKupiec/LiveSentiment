using System.Text.Json;

namespace LiveSentiment.Models
{
    /// <summary>
    /// Configuration options for NLP analysis
    /// </summary>
    public class AnalysisOptions
    {
        public bool EnableSentimentAnalysis { get; set; } = false;
        public bool EnableEmotionAnalysis { get; set; } = false;
        public bool EnableKeywordExtraction { get; set; } = false;
    }

    /// <summary>
    /// Complete analysis result for a text response
    /// </summary>
    public class AnalysisResult
    {
        public SentimentResult? Sentiment { get; set; }
        public EmotionResult? Emotion { get; set; }
        public List<KeywordResult> Keywords { get; set; } = new List<KeywordResult>();
        public bool IsCompleted { get; set; } = false;
        public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;
        public string? ErrorMessage { get; set; }
        public string Provider { get; set; } = string.Empty; // "groq" or "huggingface"
    }

    /// <summary>
    /// Sentiment analysis result
    /// </summary>
    public class SentimentResult
    {
        public string Label { get; set; } = string.Empty; // "positive", "negative", "neutral"
        public double Confidence { get; set; } = 0.0; // 0.0 to 1.0
    }

    /// <summary>
    /// Emotion analysis result
    /// </summary>
    public class EmotionResult
    {
        public string Label { get; set; } = string.Empty; // "joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral"
        public double Confidence { get; set; } = 0.0; // 0.0 to 1.0
    }

    /// <summary>
    /// Keyword extraction result
    /// </summary>
    public class KeywordResult
    {
        public string Text { get; set; } = string.Empty;
        public double Relevance { get; set; } = 0.0; // 0.0 to 1.0
    }

    /// <summary>
    /// Aggregated analysis statistics for a question
    /// </summary>
    public class AnalysisStatistics
    {
        public Guid QuestionId { get; set; }
        public int TotalResponses { get; set; }
        public int AnalyzedResponses { get; set; }
        
        // Sentiment Distribution
        public Dictionary<string, int> SentimentCounts { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, double> SentimentPercentages { get; set; } = new Dictionary<string, double>();
        
        // Emotion Distribution
        public Dictionary<string, int> EmotionCounts { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, double> EmotionPercentages { get; set; } = new Dictionary<string, double>();
        
        // Keyword Analysis
        public List<KeywordFrequency> TopKeywords { get; set; } = new List<KeywordFrequency>();
        public int UniqueKeywords { get; set; }
        
        // Analysis Quality
        public double AverageConfidence { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Keyword frequency for aggregated statistics
    /// </summary>
    public class KeywordFrequency
    {
        public string Text { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
        public double AverageRelevance { get; set; }
    }

    /// <summary>
    /// Request model for analyzing a response
    /// </summary>
    public class AnalyzeResponseRequest
    {
        public string Text { get; set; } = string.Empty;
        public AnalysisOptions Options { get; set; } = new AnalysisOptions();
    }

    /// <summary>
    /// Response model for analysis API
    /// </summary>
    public class AnalyzeResponseResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public AnalysisResult? Analysis { get; set; }
        public string Provider { get; set; } = string.Empty;
    }
}
