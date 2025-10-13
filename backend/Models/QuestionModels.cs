using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace LiveSentiment.Models
{
    /// <summary>
    /// Types of questions supported by the system
    /// </summary>
    public enum QuestionType
    {
        /// <summary>
        /// Multiple choice with single answer selection
        /// </summary>
        MultipleChoiceSingle = 1,
        
        /// <summary>
        /// Multiple choice with multiple answer selection
        /// </summary>
        MultipleChoiceMultiple = 2,
        
        /// <summary>
        /// Numeric rating (e.g., 1-10 scale)
        /// </summary>
        NumericRating = 3,
        
        /// <summary>
        /// Yes/No binary question
        /// </summary>
        YesNo = 4,
        
        /// <summary>
        /// Open-ended text input (supports NLP analysis)
        /// </summary>
        OpenEnded = 5,
        
        /// <summary>
        /// Word cloud input (supports NLP analysis)
        /// </summary>
        WordCloud = 6
    }

    // Question entity that belongs to a Presentation
    public class Question
    {
        public Guid Id { get; set; }
        public Guid PresentationId { get; set; }
        public Presentation Presentation { get; set; }
        
        [Required]
        [MaxLength(500)]
        public string Text { get; set; } = string.Empty;
        
        [Required]
        public QuestionType Type { get; set; }
        
        // Configuration for the question type (options, scale ranges, etc.)
        public JsonDocument? Configuration { get; set; }
        
        // NLP Configuration
        public bool EnableSentimentAnalysis { get; set; } = false;
        public bool EnableEmotionAnalysis { get; set; } = false;
        public bool EnableKeywordExtraction { get; set; } = false;
        
        public int Order { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsLive { get; set; } = false;
        public DateTime? LiveStartedAt { get; set; }
        public DateTime? LiveEndedAt { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        
        // Navigation properties
        public ICollection<Response> Responses { get; set; } = new List<Response>();
    }

    // Request models for CRUD operations
    /// <summary>
    /// Request model for creating a new question
    /// </summary>
    public class CreateQuestionRequest
    {
        /// <summary>
        /// The question text (max 500 characters)
        /// </summary>
        [Required]
        [StringLength(500)]
        public string Text { get; set; } = string.Empty;
        
        /// <summary>
        /// The type of question (1=MultipleChoiceSingle, 2=MultipleChoiceMultiple, 3=NumericRating, 4=YesNo, 5=OpenEnded, 6=WordCloud)
        /// </summary>
        [Required]
        public QuestionType Type { get; set; }
        
        /// <summary>
        /// Configuration specific to the question type (options, ranges, etc.)
        /// </summary>
        public JsonDocument? Configuration { get; set; }
        
        /// <summary>
        /// Enable sentiment analysis (positive/negative/neutral). Only available for OpenEnded (5) and WordCloud (6) questions.
        /// </summary>
        public bool EnableSentimentAnalysis { get; set; } = false;
        
        /// <summary>
        /// Enable emotion detection (joy, sadness, anger, etc.). Only available for OpenEnded (5) and WordCloud (6) questions.
        /// </summary>
        public bool EnableEmotionAnalysis { get; set; } = false;
        
        /// <summary>
        /// Enable keyword extraction. Only available for OpenEnded (5) and WordCloud (6) questions.
        /// </summary>
        public bool EnableKeywordExtraction { get; set; } = false;
        
        /// <summary>
        /// The order of the question within the presentation. If 0, will be auto-assigned.
        /// </summary>
        public int Order { get; set; }
    }

    public class UpdateQuestionRequest : CreateQuestionRequest
    {
        public bool IsActive { get; set; } = true;
    }

    // Response models
    public class QuestionResponse
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public QuestionType Type { get; set; }
        public JsonDocument? Configuration { get; set; }
        public bool EnableSentimentAnalysis { get; set; }
        public bool EnableEmotionAnalysis { get; set; }
        public bool EnableKeywordExtraction { get; set; }
        public int Order { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        public int ResponseCount { get; set; }
    }

    public class QuestionSummary
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public QuestionType Type { get; set; }
        public int Order { get; set; }
        public bool IsActive { get; set; }
        public bool EnableSentimentAnalysis { get; set; }
        public int ResponseCount { get; set; }
    }

    // Reorder questions request
    public class ReorderQuestionsRequest
    {
        [Required]
        public List<Guid> QuestionIds { get; set; } = new List<Guid>();
    }

    // Toggle question active status request
    public class ToggleQuestionActiveRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }
}
