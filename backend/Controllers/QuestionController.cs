using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LiveSentiment.Models;
using LiveSentiment.Services;
using LiveSentiment.Extensions;
using System.Security.Claims;

namespace LiveSentiment.Controllers
{
    [ApiController]
    [Route("api/presentations/{presentationId}/questions")]
    [Authorize]
    public class QuestionController : ControllerBase
    {
        private readonly IQuestionService _questionService;

        public QuestionController(IQuestionService questionService)
        {
            _questionService = questionService;
        }

        // GET: api/presentations/{presentationId}/questions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuestionResponse>>> GetQuestions(Guid presentationId)
        {
            try
            {
                var presenterId = GetCurrentPresenterId();
                if (presenterId == Guid.Empty)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access questions.");
                }

                var questions = await _questionService.GetQuestionsAsync(presentationId, presenterId);
                return this.Success(questions);
            }
            catch (UnauthorizedAccessException ex)
            {
                return this.Forbidden(ErrorCodes.ACCESS_DENIED, "Access denied", ex.Message);
            }
            catch (Exception ex)
            {
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to retrieve questions", ex.Message);
            }
        }

        // GET: api/presentations/{presentationId}/questions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionResponse>> GetQuestion(Guid presentationId, Guid id)
        {
            try
            {
                var presenterId = GetCurrentPresenterId();
                if (presenterId == Guid.Empty)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access this question.");
                }

                var question = await _questionService.GetQuestionAsync(id, presenterId);
                if (question == null)
                {
                    return this.NotFound(ErrorCodes.QUESTION_NOT_FOUND, "Question not found", "Question not found or you don't have access to it.");
                }

                return this.Success(question);
            }
            catch (UnauthorizedAccessException ex)
            {
                return this.Forbidden(ErrorCodes.ACCESS_DENIED, "Access denied", ex.Message);
            }
            catch (Exception ex)
            {
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to retrieve question", ex.Message);
            }
        }

        /// <summary>
        /// Creates a new question for a presentation
        /// </summary>
        /// <param name="presentationId">The ID of the presentation</param>
        /// <param name="request">The question creation request</param>
        /// <returns>The created question</returns>
        /// <remarks>
        /// Sample requests:
        /// 
        /// **Multiple Choice (Single Answer):**
        /// ```json
        /// {
        ///   "text": "What is your role in the organization?",
        ///   "type": 1,
        ///   "configuration": {
        ///     "options": ["Student", "Teacher", "Administrator", "Other"],
        ///     "allowOther": false
        ///   },
        ///   "enableSentimentAnalysis": false,
        ///   "enableEmotionAnalysis": false,
        ///   "enableKeywordExtraction": false,
        ///   "order": 1
        /// }
        /// ```
        /// 
        /// **Open-Ended with NLP:**
        /// ```json
        /// {
        ///   "text": "What feedback do you have about the presentation?",
        ///   "type": 6,
        ///   "configuration": {
        ///     "maxLength": 500,
        ///     "minLength": 10,
        ///     "placeholder": "Please share your thoughts..."
        ///   },
        ///   "enableSentimentAnalysis": true,
        ///   "enableEmotionAnalysis": true,
        ///   "enableKeywordExtraction": true,
        ///   "order": 2
        /// }
        /// ```
        /// 
        /// **Word Cloud:**
        /// ```json
        /// {
        ///   "text": "What words come to mind when you think of this topic?",
        ///   "type": 7,
        ///   "configuration": {
        ///     "maxWords": 3,
        ///     "minWordLength": 2,
        ///     "placeholder": "Enter 1-3 words"
        ///   },
        ///   "enableSentimentAnalysis": true,
        ///   "enableEmotionAnalysis": false,
        ///   "enableKeywordExtraction": true,
        ///   "order": 3
        /// }
        /// ```
        /// 
        /// **Numeric Rating:**
        /// ```json
        /// {
        ///   "text": "Rate the presentation from 1-10",
        ///   "type": 3,
        ///   "configuration": {
        ///     "minValue": 1,
        ///     "maxValue": 10,
        ///     "stepSize": 1,
        ///     "labels": {
        ///       "1": "Very Poor",
        ///       "5": "Average",
        ///       "10": "Excellent"
        ///     }
        ///   },
        ///   "enableSentimentAnalysis": false,
        ///   "enableEmotionAnalysis": false,
        ///   "enableKeywordExtraction": false,
        ///   "order": 4
        /// }
        /// ```
        /// 
        /// **Important Notes:**
        /// - Only text-based questions (type 6=OpenEnded, type 7=WordCloud) can have NLP enabled
        /// - For non-text questions, all NLP fields must be false
        /// - All three text analysis options (Sentiment, Emotion, Keywords) can be enabled independently
        /// </remarks>
        // POST: api/presentations/{presentationId}/questions
        [HttpPost]
        [ProducesResponseType(typeof(QuestionResponse), 201)]
        [ProducesResponseType(typeof(ErrorResponse), 400)]
        [ProducesResponseType(typeof(ErrorResponse), 401)]
        [ProducesResponseType(typeof(ErrorResponse), 403)]
        [ProducesResponseType(typeof(ErrorResponse), 500)]
        public async Task<ActionResult<QuestionResponse>> CreateQuestion(Guid presentationId, [FromBody] CreateQuestionRequest request)
        {
            try
            {
                var presenterId = GetCurrentPresenterId();
                if (presenterId == Guid.Empty)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to create questions.");
                }

                if (!ModelState.IsValid)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
                }

                var question = await _questionService.CreateQuestionAsync(request, presentationId, presenterId);
                return this.Success(question);
            }
            catch (UnauthorizedAccessException ex)
            {
                return this.Forbidden(ErrorCodes.ACCESS_DENIED, "Access denied", ex.Message);
            }
            catch (ArgumentException ex)
            {
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid configuration", ex.Message);
            }
            catch (Exception ex)
            {
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to create question", ex.Message);
            }
        }

        // PUT: api/presentations/{presentationId}/questions/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<QuestionResponse>> UpdateQuestion(Guid presentationId, Guid id, [FromBody] UpdateQuestionRequest request)
        {
            try
            {
                var presenterId = GetCurrentPresenterId();
                if (presenterId == Guid.Empty)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to update questions.");
                }

                if (!ModelState.IsValid)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
                }

                var question = await _questionService.UpdateQuestionAsync(id, request, presenterId);
                return this.Success(question);
            }
            catch (UnauthorizedAccessException ex)
            {
                return this.Forbidden(ErrorCodes.ACCESS_DENIED, "Access denied", ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return this.NotFound(ErrorCodes.QUESTION_NOT_FOUND, "Question not found", ex.Message);
            }
            catch (ArgumentException ex)
            {
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid configuration", ex.Message);
            }
            catch (Exception ex)
            {
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to update question", ex.Message);
            }
        }

        // DELETE: api/presentations/{presentationId}/questions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(Guid presentationId, Guid id)
        {
            try
            {
                var presenterId = GetCurrentPresenterId();
                if (presenterId == Guid.Empty)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to delete questions.");
                }

                await _questionService.DeleteQuestionAsync(id, presenterId);
                return this.NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return this.Forbidden(ErrorCodes.ACCESS_DENIED, "Access denied", ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return this.NotFound(ErrorCodes.QUESTION_NOT_FOUND, "Question not found", ex.Message);
            }
            catch (Exception ex)
            {
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to delete question", ex.Message);
            }
        }

        // PUT: api/presentations/{presentationId}/questions/{id}/toggle
        [HttpPut("{id}/toggle")]
        public async Task<ActionResult<QuestionResponse>> ToggleQuestionActive(Guid presentationId, Guid id, [FromBody] ToggleQuestionActiveRequest request)
        {
            try
            {
                var presenterId = GetCurrentPresenterId();
                if (presenterId == Guid.Empty)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to toggle question status.");
                }

                if (!ModelState.IsValid)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
                }

                var question = await _questionService.ToggleQuestionActiveAsync(id, request.IsActive, presenterId);
                return this.Success(question);
            }
            catch (UnauthorizedAccessException ex)
            {
                return this.Forbidden(ErrorCodes.ACCESS_DENIED, "Access denied", ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return this.NotFound(ErrorCodes.QUESTION_NOT_FOUND, "Question not found", ex.Message);
            }
            catch (Exception ex)
            {
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to toggle question status", ex.Message);
            }
        }

        // PUT: api/presentations/{presentationId}/questions/reorder
        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderQuestions(Guid presentationId, [FromBody] ReorderQuestionsRequest request)
        {
            try
            {
                var presenterId = GetCurrentPresenterId();
                if (presenterId == Guid.Empty)
                {
                    return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to reorder questions.");
                }

                if (!ModelState.IsValid)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
                }

                await _questionService.ReorderQuestionsAsync(presentationId, request.QuestionIds, presenterId);
                return this.NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return this.Forbidden(ErrorCodes.ACCESS_DENIED, "Access denied", ex.Message);
            }
            catch (ArgumentException ex)
            {
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid request", ex.Message);
            }
            catch (Exception ex)
            {
                return this.InternalServerError(ErrorCodes.INTERNAL_ERROR, "Failed to reorder questions", ex.Message);
            }
        }

        private Guid GetCurrentPresenterId()
        {
            var presenterIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (presenterIdClaim != null && Guid.TryParse(presenterIdClaim.Value, out Guid presenterId))
            {
                return presenterId;
            }
            return Guid.Empty;
        }
    }
}
