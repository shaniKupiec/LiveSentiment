using Microsoft.EntityFrameworkCore;
using LiveSentiment.Data;
using LiveSentiment.Models;
using System.Security.Claims;

namespace LiveSentiment.Services
{
    public interface IQuestionService
    {
        Task<IEnumerable<QuestionResponse>> GetQuestionsAsync(Guid presentationId, Guid presenterId);
        Task<QuestionResponse?> GetQuestionAsync(Guid questionId, Guid presenterId);
        Task<QuestionResponse> CreateQuestionAsync(CreateQuestionRequest request, Guid presentationId, Guid presenterId);
        Task<QuestionResponse> UpdateQuestionAsync(Guid questionId, UpdateQuestionRequest request, Guid presenterId);
        Task DeleteQuestionAsync(Guid questionId, Guid presenterId);
        Task ReorderQuestionsAsync(Guid presentationId, List<Guid> questionIds, Guid presenterId);
        Task<QuestionResponse> ToggleQuestionActiveAsync(Guid questionId, bool isActive, Guid presenterId);
    }

    public class QuestionService : IQuestionService
    {
        private readonly AppDbContext _context;

        public QuestionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<QuestionResponse>> GetQuestionsAsync(Guid presentationId, Guid presenterId)
        {
            // Verify the presentation belongs to the presenter
            var presentation = await _context.Presentations
                .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

            if (presentation == null)
                throw new UnauthorizedAccessException("Presentation not found or access denied");

            var questions = await _context.Questions
                .Where(q => q.PresentationId == presentationId)
                .OrderBy(q => q.Order)
                .Select(q => new QuestionResponse
                {
                    Id = q.Id,
                    Text = q.Text,
                    Type = q.Type,
                    Configuration = q.Configuration,
    
                    EnableSentimentAnalysis = q.EnableSentimentAnalysis,
                    EnableEmotionAnalysis = q.EnableEmotionAnalysis,
                    EnableKeywordExtraction = q.EnableKeywordExtraction,
                    Order = q.Order,
                    IsActive = q.IsActive,
                    IsLive = q.IsLive,
                    LiveStartedAt = q.LiveStartedAt,
                    LiveEndedAt = q.LiveEndedAt,
                    CreatedDate = q.CreatedDate,
                    LastUpdated = q.LastUpdated,
                    ResponseCount = q.Responses.Count
                })
                .ToListAsync();

            return questions;
        }

        public async Task<QuestionResponse?> GetQuestionAsync(Guid questionId, Guid presenterId)
        {
            var question = await _context.Questions
                .Include(q => q.Presentation)
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null)
                return null;

            // Verify the question belongs to a presentation owned by the presenter
            if (question.Presentation.PresenterId != presenterId)
                throw new UnauthorizedAccessException("Access denied to this question");

            return new QuestionResponse
            {
                Id = question.Id,
                Text = question.Text,
                Type = question.Type,
                Configuration = question.Configuration,
                EnableSentimentAnalysis = question.EnableSentimentAnalysis,
                EnableEmotionAnalysis = question.EnableEmotionAnalysis,
                EnableKeywordExtraction = question.EnableKeywordExtraction,
                Order = question.Order,
                IsActive = question.IsActive,
                IsLive = question.IsLive,
                LiveStartedAt = question.LiveStartedAt,
                LiveEndedAt = question.LiveEndedAt,
                CreatedDate = question.CreatedDate,
                LastUpdated = question.LastUpdated,
                ResponseCount = question.Responses.Count
            };
        }

        public async Task<QuestionResponse> CreateQuestionAsync(CreateQuestionRequest request, Guid presentationId, Guid presenterId)
        {
            // Verify the presentation belongs to the presenter
            var presentation = await _context.Presentations
                .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

            if (presentation == null)
                throw new UnauthorizedAccessException("Presentation not found or access denied");

            // Validate NLP configuration
            ValidateNlpConfiguration(request);

            // Get the next order number
            var nextOrder = await _context.Questions
                .Where(q => q.PresentationId == presentationId)
                .MaxAsync(q => (int?)q.Order) ?? 0;

            var question = new Question
            {
                Id = Guid.NewGuid(),
                PresentationId = presentationId,
                Text = request.Text,
                Type = request.Type,
                Configuration = request.Configuration,
                EnableSentimentAnalysis = request.EnableSentimentAnalysis,
                EnableEmotionAnalysis = request.EnableEmotionAnalysis,
                EnableKeywordExtraction = request.EnableKeywordExtraction,
                Order = request.Order > 0 ? request.Order : nextOrder + 1,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            return new QuestionResponse
            {
                Id = question.Id,
                Text = question.Text,
                Type = question.Type,
                Configuration = question.Configuration,
                EnableSentimentAnalysis = question.EnableSentimentAnalysis,
                EnableEmotionAnalysis = question.EnableEmotionAnalysis,
                EnableKeywordExtraction = question.EnableKeywordExtraction,
                Order = question.Order,
                IsActive = question.IsActive,
                CreatedDate = question.CreatedDate,
                LastUpdated = question.LastUpdated,
                ResponseCount = 0
            };
        }

        public async Task<QuestionResponse> UpdateQuestionAsync(Guid questionId, UpdateQuestionRequest request, Guid presenterId)
        {
            var question = await _context.Questions
                .Include(q => q.Presentation)
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null)
                throw new KeyNotFoundException("Question not found");

            // Verify the question belongs to a presentation owned by the presenter
            if (question.Presentation.PresenterId != presenterId)
                throw new UnauthorizedAccessException("Access denied to this question");

            // Validate NLP configuration
            ValidateNlpConfiguration(request);

            question.Text = request.Text;
            question.Type = request.Type;
            question.Configuration = request.Configuration;
            question.EnableSentimentAnalysis = request.EnableSentimentAnalysis;
            question.EnableEmotionAnalysis = request.EnableEmotionAnalysis;
            question.EnableKeywordExtraction = request.EnableKeywordExtraction;
            question.Order = request.Order;
            question.IsActive = request.IsActive;
            question.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new QuestionResponse
            {
                Id = question.Id,
                Text = question.Text,
                Type = question.Type,
                Configuration = question.Configuration,
                EnableSentimentAnalysis = question.EnableSentimentAnalysis,
                EnableEmotionAnalysis = question.EnableEmotionAnalysis,
                EnableKeywordExtraction = question.EnableKeywordExtraction,
                Order = question.Order,
                IsActive = question.IsActive,
                CreatedDate = question.CreatedDate,
                LastUpdated = question.LastUpdated,
                ResponseCount = question.Responses.Count
            };
        }

        public async Task DeleteQuestionAsync(Guid questionId, Guid presenterId)
        {
            var question = await _context.Questions
                .Include(q => q.Presentation)
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null)
                throw new KeyNotFoundException("Question not found");

            // Verify the question belongs to a presentation owned by the presenter
            if (question.Presentation.PresenterId != presenterId)
                throw new UnauthorizedAccessException("Access denied to this question");

            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();
        }

        public async Task ReorderQuestionsAsync(Guid presentationId, List<Guid> questionIds, Guid presenterId)
        {
            // Verify the presentation belongs to the presenter
            var presentation = await _context.Presentations
                .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

            if (presentation == null)
                throw new UnauthorizedAccessException("Presentation not found or access denied");

            // Verify all questions belong to this presentation
            var questions = await _context.Questions
                .Where(q => q.PresentationId == presentationId && questionIds.Contains(q.Id))
                .ToListAsync();

            if (questions.Count != questionIds.Count)
                throw new ArgumentException("Some questions not found in this presentation");

            // Update order based on the provided sequence
            for (int i = 0; i < questionIds.Count; i++)
            {
                var question = questions.First(q => q.Id == questionIds[i]);
                question.Order = i + 1;
                question.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<QuestionResponse> ToggleQuestionActiveAsync(Guid questionId, bool isActive, Guid presenterId)
        {
            var question = await _context.Questions
                .Include(q => q.Presentation)
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null)
                throw new KeyNotFoundException("Question not found");

            // Verify the question belongs to a presentation owned by the presenter
            if (question.Presentation.PresenterId != presenterId)
                throw new UnauthorizedAccessException("Access denied to this question");

            question.IsActive = isActive;
            question.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new QuestionResponse
            {
                Id = question.Id,
                Text = question.Text,
                Type = question.Type,
                Configuration = question.Configuration,

                EnableSentimentAnalysis = question.EnableSentimentAnalysis,
                EnableEmotionAnalysis = question.EnableEmotionAnalysis,
                EnableKeywordExtraction = question.EnableKeywordExtraction,
                Order = question.Order,
                IsActive = question.IsActive,
                CreatedDate = question.CreatedDate,
                LastUpdated = question.LastUpdated,
                ResponseCount = question.Responses.Count
            };
        }

        private void ValidateNlpConfiguration(CreateQuestionRequest request)
        {
            // Only text-based questions can have NLP enabled
            var textBasedTypes = new[] { QuestionType.OpenEnded, QuestionType.WordCloud };
            if ((request.EnableSentimentAnalysis || request.EnableEmotionAnalysis || request.EnableKeywordExtraction) && !textBasedTypes.Contains(request.Type))
            {
                throw new ArgumentException("NLP analysis can only be enabled for text-based questions (OpenEnded, WordCloud)");
            }
        }
    }
}
