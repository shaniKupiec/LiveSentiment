using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace LiveSentiment.Models
{
    // Presenter stores user info
    public class Presenter
    {
        public Guid Id { get; set; }
        [MaxLength(255)]
        public string Name { get; set; }
        [MaxLength(255)]
        public string Email { get; set; }
        [MaxLength(255)]
        public string PasswordHash { get; set; }
        [MaxLength(50)]
        public string LoginMethod { get; set; }
        public ICollection<Presentation> Presentations { get; set; }
        public ICollection<Label> Labels { get; set; }
    }

    // Label entity owned by a Presenter
    public class Label
    {
        public Guid Id { get; set; }
        public Guid PresenterId { get; set; }
        public Presenter Presenter { get; set; }
        [MaxLength(100)]
        public string Name { get; set; }
        [MaxLength(7)] // Hex color code like #FF5733
        public string Color { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        public bool IsActive { get; set; } = true;
        public ICollection<Presentation> Presentations { get; set; }
    }

    // A Presentation owned by a Presenter
    public class Presentation
    {
        public Guid Id { get; set; }
        public Guid PresenterId { get; set; }
        public Presenter Presenter { get; set; }
        [MaxLength(255)]
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        public Guid? LabelId { get; set; } // Nullable - presentations can exist without labels
        public Label Label { get; set; }
        public ICollection<Poll> Polls { get; set; }
        public ICollection<Question> Questions { get; set; } = new List<Question>();
    }

    // Poll attached to a Presentation (keeping for backward compatibility)
    public class Poll
    {
        public Guid Id { get; set; }
        public Guid PresentationId { get; set; }
        public Presentation Presentation { get; set; }
        public string Question { get; set; }
        [MaxLength(50)]
        public string Type { get; set; }
        public JsonDocument Options { get; set; }
        public bool Active { get; set; }
        public ICollection<Response> Responses { get; set; }
        // Note: SentimentAggregate now links to Question, not Poll
    }

    // Responses for questions, anonymous audience
    public class Response
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public Question Question { get; set; }
        public string Value { get; set; }
        public DateTime Timestamp { get; set; }
    }

    // Aggregated results for sentiment, emotion counts, and keyword trends per question
    public class SentimentAggregate
    {
        public Guid QuestionId { get; set; }
        public Question Question { get; set; }
        public DateTime AggregatedSince { get; set; }
        public JsonDocument SentimentCounts { get; set; }
        public JsonDocument EmotionCounts { get; set; }
        public JsonArray Keywords { get; set; }
    }
} 