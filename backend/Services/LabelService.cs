using System;
using LiveSentiment.Data;
using LiveSentiment.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LiveSentiment.Services
{
    public interface ILabelService
    {
        Task<List<LabelResponse>> GetUserLabelsAsync(Guid presenterId);
        Task<List<LabelResponse>> GetAllUserLabelsAsync(Guid presenterId); // Including inactive
        Task<LabelResponse?> GetLabelAsync(Guid labelId, Guid presenterId);
        Task<LabelWithPresentationsResponse?> GetLabelWithPresentationsAsync(Guid labelId, Guid presenterId);
        Task<LabelResponse> CreateLabelAsync(CreateLabelRequest request, Guid presenterId);
        Task<LabelResponse?> UpdateLabelAsync(Guid labelId, UpdateLabelRequest request, Guid presenterId);
        Task<bool> DeleteLabelAsync(Guid labelId, Guid presenterId);
        Task<bool> ReactivateLabelAsync(Guid labelId, Guid presenterId);
        Task<bool> AssignLabelToPresentationAsync(Guid labelId, Guid presentationId, Guid presenterId);
        Task<bool> RemoveLabelFromPresentationAsync(Guid presentationId, Guid presenterId);

    }

    public class LabelService : ILabelService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LabelService> _logger;

        public LabelService(AppDbContext context, ILogger<LabelService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<LabelResponse>> GetUserLabelsAsync(Guid presenterId)
        {
            try
            {
                return await _context.Labels
                    .Where(l => l.PresenterId == presenterId && l.IsActive)
                    .Select(l => new LabelResponse
                    {
                        Id = l.Id,
                        Name = l.Name,
                        Color = l.Color,
                        CreatedDate = l.CreatedDate,
                        LastUpdated = l.LastUpdated,
                        IsActive = l.IsActive,
                        PresentationCount = l.Presentations.Count
                    })
                    .OrderBy(l => l.Name)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting labels for presenter {PresenterId}: {Message}", 
                    presenterId, ex.Message);
                throw;
            }
        }

        public async Task<List<LabelResponse>> GetAllUserLabelsAsync(Guid presenterId)
        {
            try
            {
                return await _context.Labels
                    .Where(l => l.PresenterId == presenterId)
                    .Select(l => new LabelResponse
                    {
                        Id = l.Id,
                        Name = l.Name,
                        Color = l.Color,
                        CreatedDate = l.CreatedDate,
                        LastUpdated = l.LastUpdated,
                        IsActive = l.IsActive,
                        PresentationCount = l.Presentations.Count
                    })
                    .OrderBy(l => l.Name)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all labels for presenter {PresenterId}: {Message}", 
                    presenterId, ex.Message);
                throw;
            }
        }

        public async Task<LabelResponse?> GetLabelAsync(Guid labelId, Guid presenterId)
        {
            try
            {
                var label = await _context.Labels
                    .Where(l => l.Id == labelId && l.PresenterId == presenterId)
                    .Select(l => new LabelResponse
                    {
                        Id = l.Id,
                        Name = l.Name,
                        Color = l.Color,
                        CreatedDate = l.CreatedDate,
                        LastUpdated = l.LastUpdated,
                        IsActive = l.IsActive,
                        PresentationCount = l.Presentations.Count
                    })
                    .FirstOrDefaultAsync();

                return label;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting label {LabelId} for presenter {PresenterId}: {Message}", 
                    labelId, presenterId, ex.Message);
                throw;
            }
        }

        public async Task<LabelWithPresentationsResponse?> GetLabelWithPresentationsAsync(Guid labelId, Guid presenterId)
        {
            try
            {
                var label = await _context.Labels
                    .Where(l => l.Id == labelId && l.PresenterId == presenterId)
                    .Select(l => new LabelWithPresentationsResponse
                    {
                        Id = l.Id,
                        Name = l.Name,
                        Color = l.Color,
                        CreatedDate = l.CreatedDate,
                        LastUpdated = l.LastUpdated,
                        IsActive = l.IsActive,
                        PresentationCount = l.Presentations.Count,
                        Presentations = l.Presentations.Select(p => new PresentationSummary
                        {
                            Id = p.Id,
                            Title = p.Title,
                            CreatedDate = p.CreatedDate
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                return label;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting label with presentations {LabelId} for presenter {PresenterId}: {Message}", 
                    labelId, presenterId, ex.Message);
                throw;
            }
        }

        public async Task<LabelResponse> CreateLabelAsync(CreateLabelRequest request, Guid presenterId)
        {
            try
            {
                var label = new Label
                {
                    Id = Guid.NewGuid(),
                    PresenterId = presenterId,
                    Name = request.Name,
                    Color = request.Color,
                    CreatedDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Labels.Add(label);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created label {LabelId} for presenter {PresenterId}", label.Id, presenterId);

                return new LabelResponse
                {
                    Id = label.Id,
                    Name = label.Name,
                    Color = label.Color,
                    CreatedDate = label.CreatedDate,
                    LastUpdated = label.LastUpdated,
                    IsActive = label.IsActive,
                    PresentationCount = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating label for presenter {PresenterId}: {Message}", 
                    presenterId, ex.Message);
                throw;
            }
        }

        public async Task<LabelResponse?> UpdateLabelAsync(Guid labelId, UpdateLabelRequest request, Guid presenterId)
        {
            const int maxRetries = 3;
            var retryCount = 0;

            while (retryCount < maxRetries)
            {
                try
                {
                    _logger.LogInformation("Updating label {LabelId} for presenter {PresenterId} (attempt {RetryCount})", 
                        labelId, presenterId, retryCount + 1);
                    
                    // Use a more robust approach to avoid potential race conditions
                    var label = await _context.Labels
                        .Include(l => l.Presentations)
                        .FirstOrDefaultAsync(l => l.Id == labelId && l.PresenterId == presenterId);

                    if (label == null)
                    {
                        _logger.LogWarning("Label {LabelId} not found for presenter {PresenterId}", labelId, presenterId);
                        return null;
                    }

                    // Store original values for logging
                    var originalName = label.Name;
                    var originalColor = label.Color;
                    var originalIsActive = label.IsActive;

                    label.Name = request.Name;
                    label.Color = request.Color;
                    label.IsActive = request.IsActive;
                    label.LastUpdated = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Successfully updated label {LabelId} for presenter {PresenterId}. " +
                        "Changes: Name: {OriginalName} -> {NewName}, Color: {OriginalColor} -> {NewColor}, " +
                        "IsActive: {OriginalIsActive} -> {NewIsActive}", 
                        labelId, presenterId, originalName, request.Name, originalColor, request.Color, 
                        originalIsActive, request.IsActive);

                    // Create response with null-safe access to navigation properties
                    var response = new LabelResponse
                    {
                        Id = label.Id,
                        Name = label.Name,
                        Color = label.Color,
                        CreatedDate = label.CreatedDate,
                        LastUpdated = label.LastUpdated,
                        IsActive = label.IsActive,
                        PresentationCount = label.Presentations?.Count ?? 0
                    };

                    _logger.LogDebug("Created response for label {LabelId} with {PresentationCount} presentations", 
                        labelId, response.PresentationCount);

                    return response;
                }
                catch (Exception ex)
                {
                    retryCount++;
                    _logger.LogWarning(ex, "Error updating label {LabelId} for presenter {PresenterId} (attempt {RetryCount}): {Message}", 
                        labelId, presenterId, retryCount, ex.Message);
                    
                    if (retryCount >= maxRetries)
                    {
                        _logger.LogError(ex, "Failed to update label {LabelId} for presenter {PresenterId} after {MaxRetries} attempts: {Message}", 
                            labelId, presenterId, maxRetries, ex.Message);
                        throw;
                    }
                    
                    // Wait a bit before retrying
                    await Task.Delay(100 * retryCount);
                }
            }

            // This should never be reached, but just in case
            throw new InvalidOperationException($"Failed to update label {labelId} after {maxRetries} attempts");
        }

        public async Task<bool> DeleteLabelAsync(Guid labelId, Guid presenterId)
        {
            try
            {
                var label = await _context.Labels
                    .FirstOrDefaultAsync(l => l.Id == labelId && l.PresenterId == presenterId);

                if (label == null)
                    return false;

                // Implement soft delete instead of hard delete
                label.IsActive = false;
                label.LastUpdated = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully soft deleted label {LabelId} for presenter {PresenterId}", labelId, presenterId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error soft deleting label {LabelId} for presenter {PresenterId}: {Message}", 
                    labelId, presenterId, ex.Message);
                throw;
            }
        }

        public async Task<bool> ReactivateLabelAsync(Guid labelId, Guid presenterId)
        {
            try
            {
                var label = await _context.Labels
                    .FirstOrDefaultAsync(l => l.Id == labelId && l.PresenterId == presenterId);

                if (label == null || label.IsActive) // Only reactivate if it's soft-deleted
                    return false;

                label.IsActive = true;
                label.LastUpdated = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully reactivated label {LabelId} for presenter {PresenterId}", labelId, presenterId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reactivating label {LabelId} for presenter {PresenterId}: {Message}", 
                    labelId, presenterId, ex.Message);
                throw;
            }
        }

        public async Task<bool> AssignLabelToPresentationAsync(Guid labelId, Guid presentationId, Guid presenterId)
        {
            try
            {
                // Verify both label and presentation belong to the presenter, and label is active
                var label = await _context.Labels
                    .FirstOrDefaultAsync(l => l.Id == labelId && l.PresenterId == presenterId && l.IsActive);

                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

                if (label == null || presentation == null)
                    return false;

                presentation.LabelId = labelId;
                presentation.LastUpdated = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully assigned label {LabelId} to presentation {PresentationId} for presenter {PresenterId}", 
                    labelId, presentationId, presenterId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning label {LabelId} to presentation {PresentationId} for presenter {PresenterId}: {Message}", 
                    labelId, presentationId, presenterId, ex.Message);
                throw;
            }
        }

        public async Task<bool> RemoveLabelFromPresentationAsync(Guid presentationId, Guid presenterId)
        {
            try
            {
                var presentation = await _context.Presentations
                    .FirstOrDefaultAsync(p => p.Id == presentationId && p.PresenterId == presenterId);

                if (presentation == null)
                    return false;

                presentation.LabelId = null;
                presentation.LastUpdated = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully removed label from presentation {PresentationId} for presenter {PresenterId}", 
                    presentationId, presenterId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing label from presentation {PresentationId} for presenter {PresenterId}: {Message}", 
                    presentationId, presenterId, ex.Message);
                throw;
            }
        }


    }
}
