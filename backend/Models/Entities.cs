using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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
    }

    // A Presentation owned by a Presenter
    public class Presentation
    {
        public Guid Id { get; set; }
        public Guid PresenterId { get; set; }
        public Presenter Presenter { get; set; }
        [MaxLength(255)]
        public string Title { get; set; }
        public DateTime Date { get; set; }
        [MaxLength(100)]
        public string Label { get; set; }
        public ICollection<Poll> Polls { get; set; }
    }

    // Poll attached to a Presentation
    public class Poll
    {
        public Guid Id { get; set; }
        public Guid PresentationId { get; set; }
        public Presentation Presentation { get; set; }
        public string Question { get; set; }
        [MaxLength(50)]
        public string Type { get; set; }
        public JsonObject Options { get; set; }
        public bool Active { get; set; }
        public ICollection<Response> Responses { get; set; }
        public SentimentAggregate SentimentAggregate { get; set; }
    }

    // Responses for polls, anonymous audience
    public class Response
    {
        public Guid Id { get; set; }
        public Guid PollId { get; set; }
        public Poll Poll { get; set; }
        public string Value { get; set; }
        public DateTime Timestamp { get; set; }
    }

    // Aggregated results for sentiment, emotion counts, and keyword trends per poll
    public class SentimentAggregate
    {
        public Guid PollId { get; set; }
        public Poll Poll { get; set; }
        public DateTime AggregatedSince { get; set; }
        public JsonObject SentimentCounts { get; set; }
        public JsonObject EmotionCounts { get; set; }
        public JsonArray Keywords { get; set; }
    }
} 