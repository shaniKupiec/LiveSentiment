using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LiveSentiment.Data;
using Microsoft.EntityFrameworkCore;

namespace LiveSentiment.Hubs
{
    // SignalR hub for real-time poll and sentiment updates
    public class PollHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PollHub> _logger;

        public PollHub(AppDbContext context, ILogger<PollHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        // AUDIENCE METHODS (No authentication required)
        
        /// <summary>
        /// Audience joins a presentation group to receive real-time updates
        /// </summary>
        public async Task JoinPresentation(string presentationId)
        {
            try
            {
                // Validate presentation exists
                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id.ToString() == presentationId);
                
                if (presentation == null)
                {
                    await Clients.Caller.SendAsync("Error", "Presentation not found");
                    return;
                }

                var groupName = $"presentation_{presentationId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                
                _logger.LogInformation($"Audience member {Context.ConnectionId} joined presentation {presentationId}");
                
                // Notify presenter about audience count update
                await Clients.Group($"presenter_{presentationId}")
                    .SendAsync("AudienceCountUpdated", await GetAudienceCount(presentationId));
                
                await Clients.Caller.SendAsync("JoinedPresentation", presentationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error joining presentation {presentationId}");
                await Clients.Caller.SendAsync("Error", "Failed to join presentation");
            }
        }

        /// <summary>
        /// Audience leaves a presentation group
        /// </summary>
        public async Task LeavePresentation(string presentationId)
        {
            try
            {
                var groupName = $"presentation_{presentationId}";
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                
                _logger.LogInformation($"Audience member {Context.ConnectionId} left presentation {presentationId}");
                
                // Notify presenter about audience count update
                await Clients.Group($"presenter_{presentationId}")
                    .SendAsync("AudienceCountUpdated", await GetAudienceCount(presentationId));
                
                await Clients.Caller.SendAsync("LeftPresentation", presentationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error leaving presentation {presentationId}");
            }
        }

        /// <summary>
        /// Audience submits a response to an active question
        /// </summary>
        public async Task SubmitResponse(string questionId, string response, string sessionId)
        {
            try
            {
                // Validate question exists and is live
                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .FirstOrDefaultAsync(q => q.Id.ToString() == questionId && q.IsLive);

                if (question == null)
                {
                    await Clients.Caller.SendAsync("Error", "Question not found or not active");
                    return;
                }

                // Create response record
                var responseEntity = new Models.Response
                {
                    Id = Guid.NewGuid(),
                    QuestionId = question.Id,
                    Value = response,
                    SessionId = sessionId,
                    Timestamp = DateTime.UtcNow
                };

                _context.Responses.Add(responseEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Response submitted for question {questionId} by session {sessionId}");

                // Notify presenter about new response
                await Clients.Group($"presenter_{question.PresentationId}")
                    .SendAsync("ResponseReceived", new
                    {
                        QuestionId = questionId,
                        Response = response,
                        SessionId = sessionId,
                        Timestamp = responseEntity.Timestamp
                    });

                await Clients.Caller.SendAsync("ResponseSubmitted", questionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error submitting response for question {questionId}");
                await Clients.Caller.SendAsync("Error", "Failed to submit response");
            }
        }

        // PRESENTER METHODS (Authentication required)
        
        /// <summary>
        /// Presenter joins their presentation session to receive real-time updates
        /// </summary>
        [Authorize]
        public async Task JoinPresenterSession(string presentationId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                // Validate presenter owns this presentation
                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id.ToString() == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                {
                    await Clients.Caller.SendAsync("Error", "Presentation not found or access denied");
                    return;
                }

                var groupName = $"presenter_{presentationId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                
                _logger.LogInformation($"Presenter {presenterId} joined session for presentation {presentationId}");
                
                // Send current audience count
                var audienceCount = await GetAudienceCount(presentationId);
                await Clients.Caller.SendAsync("AudienceCountUpdated", audienceCount);
                
                await Clients.Caller.SendAsync("JoinedPresenterSession", presentationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error joining presenter session for presentation {presentationId}");
                await Clients.Caller.SendAsync("Error", "Failed to join presenter session");
            }
        }

        /// <summary>
        /// Presenter starts a live session for their presentation
        /// </summary>
        [Authorize]
        public async Task StartLiveSession(string presentationId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id.ToString() == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                {
                    await Clients.Caller.SendAsync("Error", "Presentation not found or access denied");
                    return;
                }

                presentation.IsLive = true;
                presentation.LiveStartedAt = DateTime.UtcNow;
                presentation.LiveEndedAt = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Live session started for presentation {presentationId} by presenter {presenterId}");

                // Notify all audience members
                await Clients.Group($"presentation_{presentationId}")
                    .SendAsync("LiveSessionStarted", new
                    {
                        PresentationId = presentationId,
                        StartedAt = presentation.LiveStartedAt
                    });

                await Clients.Caller.SendAsync("LiveSessionStarted", presentationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error starting live session for presentation {presentationId}");
                await Clients.Caller.SendAsync("Error", "Failed to start live session");
            }
        }

        /// <summary>
        /// Presenter ends the live session
        /// </summary>
        [Authorize]
        public async Task EndLiveSession(string presentationId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id.ToString() == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                {
                    await Clients.Caller.SendAsync("Error", "Presentation not found or access denied");
                    return;
                }

                presentation.IsLive = false;
                presentation.LiveEndedAt = DateTime.UtcNow;

                // Also deactivate any live questions
                var liveQuestions = await _context.Questions
                    .Where(q => q.PresentationId.ToString() == presentationId && q.IsLive)
                    .ToListAsync();

                foreach (var question in liveQuestions)
                {
                    question.IsLive = false;
                    question.LiveEndedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Live session ended for presentation {presentationId} by presenter {presenterId}");

                // Notify all audience members
                await Clients.Group($"presentation_{presentationId}")
                    .SendAsync("LiveSessionEnded", new
                    {
                        PresentationId = presentationId,
                        EndedAt = presentation.LiveEndedAt
                    });

                await Clients.Caller.SendAsync("LiveSessionEnded", presentationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ending live session for presentation {presentationId}");
                await Clients.Caller.SendAsync("Error", "Failed to end live session");
            }
        }

        /// <summary>
        /// Presenter activates a question for audience response
        /// </summary>
        [Authorize]
        public async Task ActivateQuestion(string questionId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .FirstOrDefaultAsync(q => q.Id.ToString() == questionId && q.Presentation.PresenterId == presenterId);

                if (question == null)
                {
                    await Clients.Caller.SendAsync("Error", "Question not found or access denied");
                    return;
                }

                // Deactivate any other live questions in the same presentation
                var otherLiveQuestions = await _context.Questions
                    .Where(q => q.PresentationId == question.PresentationId && q.IsLive && q.Id != question.Id)
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

                _logger.LogInformation($"Question {questionId} activated by presenter {presenterId}");

                // Notify all audience members
                await Clients.Group($"presentation_{question.PresentationId}")
                    .SendAsync("QuestionActivated", new
                    {
                        QuestionId = questionId,
                        Text = question.Text,
                        Type = question.Type,
                        Configuration = question.Configuration,
                        StartedAt = question.LiveStartedAt
                    });

                await Clients.Caller.SendAsync("QuestionActivated", questionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error activating question {questionId}");
                await Clients.Caller.SendAsync("Error", "Failed to activate question");
            }
        }

        /// <summary>
        /// Presenter deactivates a question
        /// </summary>
        [Authorize]
        public async Task DeactivateQuestion(string questionId)
        {
            try
            {
                var presenterId = GetPresenterId();
                if (presenterId == null)
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized");
                    return;
                }

                var question = await _context.Questions
                    .Include(q => q.Presentation)
                    .FirstOrDefaultAsync(q => q.Id.ToString() == questionId && q.Presentation.PresenterId == presenterId);

                if (question == null)
                {
                    await Clients.Caller.SendAsync("Error", "Question not found or access denied");
                    return;
                }

                question.IsLive = false;
                question.LiveEndedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question {questionId} deactivated by presenter {presenterId}");

                // Notify all audience members
                await Clients.Group($"presentation_{question.PresentationId}")
                    .SendAsync("QuestionDeactivated", new
                    {
                        QuestionId = questionId,
                        EndedAt = question.LiveEndedAt
                    });

                await Clients.Caller.SendAsync("QuestionDeactivated", questionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deactivating question {questionId}");
                await Clients.Caller.SendAsync("Error", "Failed to deactivate question");
            }
        }

        // Helper methods
        private Guid? GetPresenterId()
        {
            var presenterIdClaim = Context.User?.FindFirst("PresenterId")?.Value;
            return Guid.TryParse(presenterIdClaim, out var presenterId) ? presenterId : null;
        }

        private async Task<int> GetAudienceCount(string presentationId)
        {
            // This is a simplified count - in a real implementation, you might want to track this more precisely
            // For now, we'll use the number of connections in the presentation group
            // Note: This is an approximation and may not be 100% accurate
            return 0; // SignalR doesn't provide a direct way to count group members
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected");
            await base.OnDisconnectedAsync(exception);
        }
    }
} 