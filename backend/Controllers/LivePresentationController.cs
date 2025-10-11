using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LiveSentiment.Data;
using LiveSentiment.Models;
using LiveSentiment.Extensions;
using System.Security.Claims;
using System.Text.Json;

namespace LiveSentiment.Controllers
{
    /// <summary>
    /// Live presentation management endpoints for presenters (authentication required)
    /// </summary>
    [Route("api/presentations/{id}/live")]
    [ApiController]
    [Authorize]
    public class LivePresentationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LivePresentationController> _logger;

        public LivePresentationController(AppDbContext context, ILogger<LivePresentationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Start a live session for a presentation
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <returns>Live session status</returns>
        [HttpPost("start")]
        public async Task<ActionResult<LiveSessionResponse>> StartLiveSession(string id)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "Invalid presenter token", "Please log in to access this feature.");
                }

                if (!Guid.TryParse(id, out var presentationId))
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid presentation ID format", "Please provide a valid presentation ID.");
                }

                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                {
                    return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found or access denied", "Presentation not found or you don't have access to it.");
                }

                if (presentation.IsLive)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Presentation is already live", "This presentation is already live. Please stop the current session first.");
                }

                presentation.IsLive = true;
                presentation.LiveStartedAt = DateTime.UtcNow;
                presentation.LiveEndedAt = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Live session started for presentation {presentationId} by presenter {presenterId}");

                return this.Success(new LiveSessionResponse
                {
                    PresentationId = presentationId,
                    IsLive = true,
                    LiveStartedAt = presentation.LiveStartedAt,
                    Message = "Live session started successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error starting live session for presentation {id}");
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to start live session", ex.Message);
            }
        }

        /// <summary>
        /// Stop the live session for a presentation
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <returns>Live session status</returns>
        [HttpPost("stop")]
        public async Task<ActionResult<LiveSessionResponse>> StopLiveSession(string id)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "Invalid presenter token", "Please log in to access this feature.");
                }

                if (!Guid.TryParse(id, out var presentationId))
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid presentation ID format", "Please provide a valid presentation ID.");
                }

                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                {
                    return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found or access denied", "Presentation not found or you don't have access to it.");
                }

                if (!presentation.IsLive)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Presentation is not currently live", "This presentation is not currently live, so it cannot be stopped.");
                }

                presentation.IsLive = false;
                presentation.LiveEndedAt = DateTime.UtcNow;

                // Also deactivate any live questions
                var liveQuestions = await _context.Questions
                    .Where(q => q.PresentationId == presentationId && q.IsLive)
                    .ToListAsync();

                foreach (var question in liveQuestions)
                {
                    question.IsLive = false;
                    question.LiveEndedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Live session stopped for presentation {presentationId} by presenter {presenterId}");

                return this.Success(new LiveSessionResponse
                {
                    PresentationId = presentationId,
                    IsLive = false,
                    LiveStartedAt = presentation.LiveStartedAt,
                    LiveEndedAt = presentation.LiveEndedAt,
                    Message = "Live session stopped successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error stopping live session for presentation {id}");
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to stop live session", ex.Message);
            }
        }

        /// <summary>
        /// Activate a question for audience response
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <param name="questionId">Question ID</param>
        /// <returns>Question activation status</returns>
        [HttpPost("question/{questionId}/activate")]
        public async Task<ActionResult<QuestionActivationResponse>> ActivateQuestion(string id, string questionId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "Invalid presenter token", "Please log in to access this feature.");
                }

                if (!Guid.TryParse(id, out var presentationId) || !Guid.TryParse(questionId, out var qId))
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid ID format", "Please provide valid presentation and question IDs.");
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .FirstOrDefaultAsync(q => q.Id == qId && q.PresentationId == presentationId && q.Presentation.PresenterId == presenterId);

                if (question == null)
                {
                    return this.NotFound(ErrorCodes.QUESTION_NOT_FOUND, "Question not found or access denied", "Question not found or you don't have access to it.");
                }

                if (!question.Presentation.IsLive)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Presentation must be live to activate questions", "Please start the live session before activating questions.");
                }

                if (question.IsLive)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Question is already active", "This question is already live. Please deactivate it first if you want to make changes.");
                }

                // Deactivate any other live questions in the same presentation
                var otherLiveQuestions = await _context.Questions
                    .Where(q => q.PresentationId == presentationId && q.IsLive && q.Id != qId)
                    .ToListAsync();

                foreach (var otherQuestion in otherLiveQuestions)
                {
                    otherQuestion.IsLive = false;
                    otherQuestion.LiveEndedAt = DateTime.UtcNow;
                }

                // Activate the requested question
                question.IsLive = true;
                question.LiveStartedAt = DateTime.UtcNow;
                question.LiveEndedAt = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question {questionId} activated for presentation {presentationId} by presenter {presenterId}");

                return this.Success(new QuestionActivationResponse
                {
                    QuestionId = qId,
                    IsLive = true,
                    LiveStartedAt = question.LiveStartedAt,
                    Message = "Question activated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error activating question {questionId} for presentation {id}");
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to activate question", ex.Message);
            }
        }

        /// <summary>
        /// Deactivate a question
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <param name="questionId">Question ID</param>
        /// <returns>Question deactivation status</returns>
        [HttpPost("question/{questionId}/deactivate")]
        public async Task<ActionResult<QuestionActivationResponse>> DeactivateQuestion(string id, string questionId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "Invalid presenter token", "Please log in to access this feature.");
                }

                if (!Guid.TryParse(id, out var presentationId) || !Guid.TryParse(questionId, out var qId))
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid ID format", "Please provide valid presentation and question IDs.");
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .FirstOrDefaultAsync(q => q.Id == qId && q.PresentationId == presentationId && q.Presentation.PresenterId == presenterId);

                if (question == null)
                {
                    return this.NotFound(ErrorCodes.QUESTION_NOT_FOUND, "Question not found or access denied", "Question not found or you don't have access to it.");
                }

                if (!question.IsLive)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Question is not currently active", "This question is not currently live, so it cannot be deactivated.");
                }

                question.IsLive = false;
                question.LiveEndedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question {questionId} deactivated for presentation {presentationId} by presenter {presenterId}");

                return this.Success(new QuestionActivationResponse
                {
                    QuestionId = qId,
                    IsLive = false,
                    LiveStartedAt = question.LiveStartedAt,
                    LiveEndedAt = question.LiveEndedAt,
                    Message = "Question deactivated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deactivating question {questionId} for presentation {id}");
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to deactivate question", ex.Message);
            }
        }

        /// <summary>
        /// Get real-time results for a question
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <param name="questionId">Question ID</param>
        /// <returns>Real-time question results</returns>
        [HttpGet("question/{questionId}/results")]
        public async Task<ActionResult<QuestionResultsResponse>> GetQuestionResults(string id, string questionId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "Invalid presenter token", "Please log in to access this feature.");
                }

                if (!Guid.TryParse(id, out var presentationId) || !Guid.TryParse(questionId, out var qId))
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid ID format", "Please provide valid presentation and question IDs.");
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .Include(q => q.Responses)
                    .FirstOrDefaultAsync(q => q.Id == qId && q.PresentationId == presentationId && q.Presentation.PresenterId == presenterId);

                if (question == null)
                {
                    return this.NotFound(ErrorCodes.QUESTION_NOT_FOUND, "Question not found or access denied", "Question not found or you don't have access to it.");
                }

                var totalResponses = question.Responses.Count;
                var uniqueSessions = question.Responses.Select(r => r.SessionId).Distinct().Count();

                var results = new QuestionResultsResponse
                {
                    QuestionId = qId,
                    QuestionText = question.Text,
                    QuestionType = question.Type,
                    IsLive = question.IsLive,
                    LiveStartedAt = question.LiveStartedAt,
                    LiveEndedAt = question.LiveEndedAt,
                    TotalResponses = totalResponses,
                    UniqueSessions = uniqueSessions,
                    Responses = question.Responses.Select(r => new ResponseSummary
                    {
                        Id = r.Id,
                        Value = r.Value,
                        SessionId = r.SessionId,
                        Timestamp = r.Timestamp
                    }).OrderByDescending(r => r.Timestamp).ToList()
                };

                // Add type-specific analysis
                switch (question.Type)
                {
                    case QuestionType.MultipleChoiceSingle:
                    case QuestionType.MultipleChoiceMultiple:
                        results.ChoiceCounts = GetChoiceCounts(question.Responses, question.Configuration);
                        break;
                    case QuestionType.NumericRating:
                        results.NumericStats = GetNumericStats(question.Responses);
                        break;
                    case QuestionType.YesNo:
                        results.YesNoCounts = GetYesNoCounts(question.Responses);
                        break;
                    case QuestionType.OpenEnded:
                    case QuestionType.WordCloud:
                        if (question.EnableSentimentAnalysis || question.EnableEmotionAnalysis || question.EnableKeywordExtraction)
                        {
                            results.TextAnalysis = GetTextAnalysis(question.Responses);
                        }
                        break;
                }

                return this.Success(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting results for question {questionId} in presentation {id}");
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to get question results", ex.Message);
            }
        }

        /// <summary>
        /// Get live session status
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <returns>Current live session status</returns>
        [HttpGet("status")]
        public async Task<ActionResult<LiveSessionStatusResponse>> GetLiveSessionStatus(string id)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "Invalid presenter token", "Please log in to access this feature.");
                }

                if (!Guid.TryParse(id, out var presentationId))
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid presentation ID format", "Please provide a valid presentation ID.");
                }

                var presentation = await _context.Presentations
                    .Include(p => p.Questions.Where(q => q.IsLive))
                    .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                {
                    return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found or access denied", "Presentation not found or you don't have access to it.");
                }

                var activeQuestion = presentation.Questions.FirstOrDefault(q => q.IsLive);

                var status = new LiveSessionStatusResponse
                {
                    PresentationId = presentationId,
                    IsLive = presentation.IsLive,
                    LiveStartedAt = presentation.LiveStartedAt,
                    LiveEndedAt = presentation.LiveEndedAt,
                    ActiveQuestionId = activeQuestion?.Id,
                    ActiveQuestionText = activeQuestion?.Text,
                    ActiveQuestionType = activeQuestion?.Type,
                    ActiveQuestionStartedAt = activeQuestion?.LiveStartedAt,
                    TotalQuestions = await _context.Questions.CountAsync(q => q.PresentationId == presentationId && q.IsActive)
                };

                return this.Success(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting live session status for presentation {id}");
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to get live session status", ex.Message);
            }
        }

        /// <summary>
        /// Get audience count for live session
        /// </summary>
        /// <param name="id">Presentation ID</param>
        /// <returns>Audience count</returns>
        [HttpGet("audience-count")]
        public async Task<ActionResult<AudienceCountResponse>> GetAudienceCount(string id)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "Invalid presenter token", "Please log in to access this feature.");
                }

                if (!Guid.TryParse(id, out var presentationId))
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid presentation ID format", "Please provide a valid presentation ID.");
                }

                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                {
                    return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found or access denied", "Presentation not found or you don't have access to it.");
                }

                // Get unique session count from responses
                var uniqueSessions = await _context.Responses
                    .Where(r => r.Question.PresentationId == presentationId)
                    .Select(r => r.SessionId)
                    .Distinct()
                    .CountAsync();

                return this.Success(new AudienceCountResponse
                {
                    PresentationId = presentationId,
                    AudienceCount = uniqueSessions,
                    LastUpdated = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting audience count for presentation {id}");
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to get audience count", ex.Message);
            }
        }

        // Helper methods
        private Guid? GetPresenterId()
        {
            var presenterIdClaim = User?.FindFirst("PresenterId")?.Value;
            return Guid.TryParse(presenterIdClaim, out var presenterId) ? presenterId : null;
        }

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

        private TextAnalysis GetTextAnalysis(ICollection<Response> responses)
        {
            // This is a placeholder for text analysis
            // In a real implementation, you would integrate with NLP services
            return new TextAnalysis
            {
                TotalResponses = responses.Count,
                AverageLength = responses.Average(r => r.Value.Length),
                CommonWords = new Dictionary<string, int>(), // Would be populated by NLP analysis
                SentimentDistribution = new Dictionary<string, int>(), // Would be populated by sentiment analysis
                EmotionDistribution = new Dictionary<string, int>() // Would be populated by emotion analysis
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

    // Response models for live presentation API
    public class LiveSessionResponse
    {
        public Guid PresentationId { get; set; }
        public bool IsLive { get; set; }
        public DateTime? LiveStartedAt { get; set; }
        public DateTime? LiveEndedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class QuestionActivationResponse
    {
        public Guid QuestionId { get; set; }
        public bool IsLive { get; set; }
        public DateTime? LiveStartedAt { get; set; }
        public DateTime? LiveEndedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class QuestionResultsResponse
    {
        public Guid QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public QuestionType QuestionType { get; set; }
        public bool IsLive { get; set; }
        public DateTime? LiveStartedAt { get; set; }
        public DateTime? LiveEndedAt { get; set; }
        public int TotalResponses { get; set; }
        public int UniqueSessions { get; set; }
        public List<ResponseSummary> Responses { get; set; } = new List<ResponseSummary>();
        public Dictionary<string, int>? ChoiceCounts { get; set; }
        public NumericStats? NumericStats { get; set; }
        public YesNoCounts? YesNoCounts { get; set; }
        public TextAnalysis? TextAnalysis { get; set; }
    }

    public class ResponseSummary
    {
        public Guid Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class LiveSessionStatusResponse
    {
        public Guid PresentationId { get; set; }
        public bool IsLive { get; set; }
        public DateTime? LiveStartedAt { get; set; }
        public DateTime? LiveEndedAt { get; set; }
        public Guid? ActiveQuestionId { get; set; }
        public string? ActiveQuestionText { get; set; }
        public QuestionType? ActiveQuestionType { get; set; }
        public DateTime? ActiveQuestionStartedAt { get; set; }
        public int TotalQuestions { get; set; }
    }

    public class AudienceCountResponse
    {
        public Guid PresentationId { get; set; }
        public int AudienceCount { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class TextAnalysis
    {
        public int TotalResponses { get; set; }
        public double AverageLength { get; set; }
        public Dictionary<string, int> CommonWords { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> SentimentDistribution { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> EmotionDistribution { get; set; } = new Dictionary<string, int>();
    }
}
