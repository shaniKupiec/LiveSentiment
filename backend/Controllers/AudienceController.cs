using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiveSentiment.Data;
using LiveSentiment.Models;
using LiveSentiment.Extensions;
using System.Text.Json;

namespace LiveSentiment.Controllers
{
    /// <summary>
    /// Public API endpoints for audience members (no authentication required)
    /// </summary>
    [Route("api/audience")]
    [ApiController]
    public class AudienceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AudienceController> _logger;

        public AudienceController(AppDbContext context, ILogger<AudienceController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get presentation information for audience
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <returns>Presentation details</returns>
        [HttpGet("presentation/{id}")]
        public async Task<ActionResult<AudiencePresentationResponse>> GetPresentation(string id)
        {
            try
            {
                if (!Guid.TryParse(id, out var presentationId))
                {
                    return BadRequest("Invalid presentation ID format");
                }

                var presentation = await _context.Presentations
                    .Include(p => p.Presenter)
                    .Include(p => p.Label)
                    .FirstOrDefaultAsync(p => p.Id == presentationId);

                if (presentation == null)
                {
                    return NotFound("Presentation not found");
                }

                var response = new AudiencePresentationResponse
                {
                    Id = presentation.Id,
                    Title = presentation.Title,
                    PresenterName = presentation.Presenter.Name,
                    IsLive = presentation.IsLive,
                    LiveStartedAt = presentation.LiveStartedAt,
                    LiveEndedAt = presentation.LiveEndedAt,
                    LabelName = presentation.Label?.Name,
                    LabelColor = presentation.Label?.Color
                };

                return this.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting presentation {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get active question for audience
        /// </summary>
        /// <param name="id">Question ID</param>
        /// <returns>Active question details</returns>
        [HttpGet("question/{id}")]
        public async Task<ActionResult<AudienceQuestionResponse>> GetActiveQuestion(string id)
        {
            try
            {
                if (!Guid.TryParse(id, out var questionId))
                {
                    return BadRequest("Invalid question ID format");
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .FirstOrDefaultAsync(q => q.Id == questionId && q.IsLive && q.Presentation.IsLive);

                if (question == null)
                {
                    return NotFound("Question not found or not active");
                }

                var response = new AudienceQuestionResponse
                {
                    Id = question.Id,
                    Text = question.Text,
                    Type = question.Type,
                    Configuration = question.Configuration,
                    LiveStartedAt = question.LiveStartedAt,
                    EnableSentimentAnalysis = question.EnableSentimentAnalysis,
                    EnableEmotionAnalysis = question.EnableEmotionAnalysis,
                    EnableKeywordExtraction = question.EnableKeywordExtraction
                };

                return this.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting active question {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Submit a response to an active question
        /// </summary>
        /// <param name="id">Question ID</param>
        /// <param name="request">Response data</param>
        /// <returns>Success confirmation</returns>
        [HttpPost("question/{id}/response")]
        public async Task<ActionResult<SubmitResponseResult>> SubmitResponse(string id, [FromBody] SubmitResponseRequest request)
        {
            try
            {
                if (!Guid.TryParse(id, out var questionId))
                {
                    return BadRequest("Invalid question ID format");
                }

                if (string.IsNullOrWhiteSpace(request.SessionId))
                {
                    return BadRequest("Session ID is required");
                }

                if (string.IsNullOrWhiteSpace(request.Value))
                {
                    return BadRequest("Response value is required");
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .FirstOrDefaultAsync(q => q.Id == questionId && q.IsLive && q.Presentation.IsLive);

                if (question == null)
                {
                    return NotFound("Question not found or not active");
                }

                // Check if this session has already responded to this question
                var existingResponse = await _context.Responses
                    .FirstOrDefaultAsync(r => r.QuestionId == questionId && r.SessionId == request.SessionId);

                if (existingResponse != null)
                {
                    return Conflict("You have already responded to this question");
                }

                // Create new response
                var response = new Response
                {
                    Id = Guid.NewGuid(),
                    QuestionId = questionId,
                    Value = request.Value,
                    SessionId = request.SessionId,
                    Timestamp = DateTime.UtcNow
                };

                _context.Responses.Add(response);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Response submitted for question {questionId} by session {request.SessionId}");

                return this.Success(new SubmitResponseResult
                {
                    Success = true,
                    Message = "Response submitted successfully",
                    ResponseId = response.Id,
                    Timestamp = response.Timestamp
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error submitting response for question {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get active question for a presentation (for audience when they first connect)
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <returns>Active question details if any</returns>
        [HttpGet("presentation/{id}/active-question")]
        public async Task<ActionResult<AudienceQuestionResponse>> GetActiveQuestionForPresentation(string id)
        {
            try
            {
                if (!Guid.TryParse(id, out var presentationId))
                {
                    return BadRequest("Invalid presentation ID format");
                }

                var presentation = await _context.Presentations
                    .Include(p => p.Questions)
                    .FirstOrDefaultAsync(p => p.Id == presentationId && p.IsLive);

                if (presentation == null)
                {
                    return NotFound("Presentation not found or not live");
                }

                var activeQuestion = presentation.Questions.FirstOrDefault(q => q.IsLive);

                if (activeQuestion == null)
                {
                    return NotFound("No active question found");
                }

                var response = new AudienceQuestionResponse
                {
                    Id = activeQuestion.Id,
                    Text = activeQuestion.Text,
                    Type = activeQuestion.Type,
                    Configuration = activeQuestion.Configuration,
                    LiveStartedAt = activeQuestion.LiveStartedAt,
                    EnableSentimentAnalysis = activeQuestion.EnableSentimentAnalysis,
                    EnableEmotionAnalysis = activeQuestion.EnableEmotionAnalysis,
                    EnableKeywordExtraction = activeQuestion.EnableKeywordExtraction
                };

                return this.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting active question for presentation {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get response statistics for an active question (public view)
        /// </summary>
        /// <param name="id">Question ID</param>
        /// <returns>Response statistics</returns>
        [HttpGet("question/{id}/stats")]
        public async Task<ActionResult<QuestionStatsResponse>> GetQuestionStats(string id)
        {
            try
            {
                if (!Guid.TryParse(id, out var questionId))
                {
                    return BadRequest("Invalid question ID format");
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .Include(q => q.Responses)
                    .FirstOrDefaultAsync(q => q.Id == questionId && q.Presentation.IsLive);

                if (question == null)
                {
                    return NotFound("Question not found or presentation not live");
                }

                var totalResponses = question.Responses.Count;
                var uniqueSessions = question.Responses.Select(r => r.SessionId).Distinct().Count();

                var stats = new QuestionStatsResponse
                {
                    QuestionId = questionId,
                    TotalResponses = totalResponses,
                    UniqueSessions = uniqueSessions,
                    IsLive = question.IsLive,
                    LiveStartedAt = question.LiveStartedAt,
                    LiveEndedAt = question.LiveEndedAt
                };

                // Add type-specific statistics
                switch (question.Type)
                {
                    case QuestionType.MultipleChoiceSingle:
                    case QuestionType.MultipleChoiceMultiple:
                        stats.ChoiceCounts = GetChoiceCounts(question.Responses, question.Configuration);
                        break;
                    case QuestionType.NumericRating:
                        stats.NumericStats = GetNumericStats(question.Responses);
                        break;
                    case QuestionType.YesNo:
                        stats.YesNoCounts = GetYesNoCounts(question.Responses);
                        break;
                }

                return this.Success(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting question stats for {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Check if a session has already responded to a question
        /// </summary>
        /// <param name="id">Question ID</param>
        /// <param name="sessionId">Session ID</param>
        /// <returns>Response status</returns>
        [HttpGet("question/{id}/response-status/{sessionId}")]
        public async Task<ActionResult<ResponseStatusResult>> GetResponseStatus(string id, string sessionId)
        {
            try
            {
                if (!Guid.TryParse(id, out var questionId))
                {
                    return BadRequest("Invalid question ID format");
                }

                var existingResponse = await _context.Responses
                    .FirstOrDefaultAsync(r => r.QuestionId == questionId && r.SessionId == sessionId);

                return this.Success(new ResponseStatusResult
                {
                    HasResponded = existingResponse != null,
                    ResponseId = existingResponse?.Id,
                    Timestamp = existingResponse?.Timestamp
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking response status for question {id}, session {sessionId}");
                return StatusCode(500, "Internal server error");
            }
        }

        // Helper methods for statistics
        private Dictionary<string, int> GetChoiceCounts(ICollection<Response> responses, JsonDocument? configuration)
        {
            var counts = new Dictionary<string, int>();
            
            if (configuration == null) return counts;

            try
            {
                var options = configuration.RootElement.GetProperty("options").EnumerateArray();
                foreach (var option in options)
                {
                    var optionText = option.GetString() ?? "";
                    counts[optionText] = 0;
                }

                foreach (var response in responses)
                {
                    if (counts.ContainsKey(response.Value))
                    {
                        counts[response.Value]++;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error parsing choice configuration");
            }

            return counts;
        }

        private NumericStats GetNumericStats(ICollection<Response> responses)
        {
            var numericValues = new List<double>();
            
            foreach (var response in responses)
            {
                if (double.TryParse(response.Value, out var value))
                {
                    numericValues.Add(value);
                }
            }

            if (!numericValues.Any())
            {
                return new NumericStats();
            }

            return new NumericStats
            {
                Count = numericValues.Count,
                Average = numericValues.Average(),
                Min = numericValues.Min(),
                Max = numericValues.Max(),
                Median = GetMedian(numericValues)
            };
        }

        private YesNoCounts GetYesNoCounts(ICollection<Response> responses)
        {
            var yesCount = responses.Count(r => r.Value.ToLower() == "yes" || r.Value.ToLower() == "true" || r.Value == "1");
            var noCount = responses.Count(r => r.Value.ToLower() == "no" || r.Value.ToLower() == "false" || r.Value == "0");

            return new YesNoCounts
            {
                Yes = yesCount,
                No = noCount
            };
        }

        private double GetMedian(List<double> values)
        {
            var sorted = values.OrderBy(x => x).ToList();
            var count = sorted.Count;
            
            if (count % 2 == 0)
            {
                return (sorted[count / 2 - 1] + sorted[count / 2]) / 2.0;
            }
            else
            {
                return sorted[count / 2];
            }
        }
    }

    // Response models for audience API
    public class AudiencePresentationResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string PresenterName { get; set; } = string.Empty;
        public bool IsLive { get; set; }
        public DateTime? LiveStartedAt { get; set; }
        public DateTime? LiveEndedAt { get; set; }
        public string? LabelName { get; set; }
        public string? LabelColor { get; set; }
    }

    public class AudienceQuestionResponse
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public QuestionType Type { get; set; }
        public JsonDocument? Configuration { get; set; }
        public DateTime? LiveStartedAt { get; set; }
        public bool EnableSentimentAnalysis { get; set; }
        public bool EnableEmotionAnalysis { get; set; }
        public bool EnableKeywordExtraction { get; set; }
    }

    public class SubmitResponseRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public class SubmitResponseResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid ResponseId { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class QuestionStatsResponse
    {
        public Guid QuestionId { get; set; }
        public int TotalResponses { get; set; }
        public int UniqueSessions { get; set; }
        public bool IsLive { get; set; }
        public DateTime? LiveStartedAt { get; set; }
        public DateTime? LiveEndedAt { get; set; }
        public Dictionary<string, int>? ChoiceCounts { get; set; }
        public NumericStats? NumericStats { get; set; }
        public YesNoCounts? YesNoCounts { get; set; }
    }

    public class NumericStats
    {
        public int Count { get; set; }
        public double Average { get; set; }
        public double Min { get; set; }
        public double Max { get; set; }
        public double Median { get; set; }
    }

    public class YesNoCounts
    {
        public int Yes { get; set; }
        public int No { get; set; }
    }

    public class ResponseStatusResult
    {
        public bool HasResponded { get; set; }
        public Guid? ResponseId { get; set; }
        public DateTime? Timestamp { get; set; }
    }
}
