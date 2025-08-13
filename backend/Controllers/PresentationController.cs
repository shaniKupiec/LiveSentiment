using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LiveSentiment.Data;
using LiveSentiment.Models;
using LiveSentiment.Extensions;
using System.Security.Claims;

namespace LiveSentiment.Controllers
{
    [ApiController]
    [Route("api/presentations")]
    [Authorize]
    public class PresentationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PresentationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/presentations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PresentationResponse>>> GetPresentations()
        {
            var presenterId = GetCurrentPresenterId();
            Console.WriteLine($"GetPresentations called. PresenterId: {presenterId}");
            
            if (presenterId == Guid.Empty)
            {
                Console.WriteLine("PresenterId is empty - returning unauthorized");
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access your presentations.");
            }

            var presentations = await _context.Presentations
                .Include(p => p.Label)
                .Where(p => p.PresenterId == presenterId)
                .OrderByDescending(p => p.CreatedDate)
                .Select(p => new PresentationResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    CreatedDate = p.CreatedDate,
                    LastUpdated = p.LastUpdated,
                    LabelId = p.LabelId,
                    Label = p.Label != null ? new LabelInfo
                    {
                        Id = p.Label.Id,
                        Name = p.Label.Name,
                        Color = p.Label.Color,
                        IsActive = p.Label.IsActive
                    } : null
                })
                .ToListAsync();

            Console.WriteLine($"Found {presentations.Count} presentations for presenter {presenterId}");
            return this.Success(presentations);
        }

        // GET: api/presentations/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PresentationResponse>> GetPresentation(Guid id)
        {
            var presenterId = GetCurrentPresenterId();
            if (presenterId == Guid.Empty)
            {
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access this presentation.");
            }

            var presentation = await _context.Presentations
                .Include(p => p.Label)
                .FirstOrDefaultAsync(p => p.Id == id && p.PresenterId == presenterId);

            if (presentation == null)
            {
                return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found", "Presentation not found or you don't have access to it.");
            }

            var response = new PresentationResponse
            {
                Id = presentation.Id,
                Title = presentation.Title,
                CreatedDate = presentation.CreatedDate,
                LastUpdated = presentation.LastUpdated,
                LabelId = presentation.LabelId,
                Label = presentation.Label != null ? new LabelInfo
                {
                    Id = presentation.Label.Id,
                    Name = presentation.Label.Name,
                    Color = presentation.Label.Color,
                    IsActive = presentation.Label.IsActive
                } : null
            };

            return this.Success(response);
        }

        // GET: api/presentations/by-label/{labelId}
        [HttpGet("by-label/{labelId}")]
        public async Task<ActionResult<IEnumerable<PresentationResponse>>> GetPresentationsByLabel(Guid labelId)
        {
            var presenterId = GetCurrentPresenterId();
            if (presenterId == Guid.Empty)
            {
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access your presentations.");
            }

            var presentations = await _context.Presentations
                .Include(p => p.Label)
                .Where(p => p.PresenterId == presenterId && p.LabelId == labelId)
                .OrderByDescending(p => p.CreatedDate)
                .Select(p => new PresentationResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    CreatedDate = p.CreatedDate,
                    LastUpdated = p.LastUpdated,
                    LabelId = p.LabelId,
                    Label = p.Label != null ? new LabelInfo
                    {
                        Id = p.Label.Id,
                        Name = p.Label.Name,
                        Color = p.Label.Color,
                        IsActive = p.Label.IsActive
                    } : null
                })
                .ToListAsync();

            return this.Success(presentations);
        }

        // GET: api/presentations/by-label-name/{labelName}
        [HttpGet("by-label-name/{labelName}")]
        public async Task<ActionResult<IEnumerable<PresentationResponse>>> GetPresentationsByLabelName(string labelName)
        {
            var presenterId = GetCurrentPresenterId();
            if (presenterId == Guid.Empty)
            {
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access your presentations.");
            }

            var presentations = await _context.Presentations
                .Include(p => p.Label)
                .Where(p => p.PresenterId == presenterId && p.Label != null && p.Label.Name == labelName)
                .OrderByDescending(p => p.CreatedDate)
                .Select(p => new PresentationResponse
                {
                    Id = p.Id,
                    Title = p.Title,
                    CreatedDate = p.CreatedDate,
                    LastUpdated = p.LastUpdated,
                    LabelId = p.LabelId,
                    Label = p.Label != null ? new LabelInfo
                    {
                        Id = p.Label.Id,
                        Name = p.Label.Name,
                        Color = p.Label.Color,
                        IsActive = p.Label.IsActive
                    } : null
                })
                .ToListAsync();

            return this.Success(presentations);
        }

        // POST: api/presentations
        [HttpPost]
        public async Task<ActionResult<PresentationResponse>> CreatePresentation([FromBody] CreatePresentationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
            }

            var presenterId = GetCurrentPresenterId();
            if (presenterId == Guid.Empty)
            {
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to create a presentation.");
            }

            // Validate that the label belongs to the current presenter if provided
            if (request.LabelId.HasValue)
            {
                var label = await _context.Labels
                    .FirstOrDefaultAsync(l => l.Id == request.LabelId.Value && l.PresenterId == presenterId && l.IsActive);
                
                if (label == null)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid label", "The specified label does not exist, is inactive, or does not belong to you.");
                }
            }

            var presentation = new Presentation
            {
                Id = Guid.NewGuid(),
                PresenterId = presenterId,
                Title = request.Title,
                LabelId = request.LabelId,
                CreatedDate = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            _context.Presentations.Add(presentation);
            await _context.SaveChangesAsync();

            // Reload the presentation with label information to return the response
            await _context.Entry(presentation).Reference(p => p.Label).LoadAsync();

            var response = new PresentationResponse
            {
                Id = presentation.Id,
                Title = presentation.Title,
                CreatedDate = presentation.CreatedDate,
                LastUpdated = presentation.LastUpdated,
                LabelId = presentation.LabelId,
                Label = presentation.Label != null ? new LabelInfo
                {
                    Id = presentation.Label.Id,
                    Name = presentation.Label.Name,
                    Color = presentation.Label.Color,
                    IsActive = presentation.Label.IsActive
                } : null
            };

            return this.Success(response);
        }

        // PUT: api/presentations/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<PresentationResponse>> UpdatePresentation(Guid id, [FromBody] UpdatePresentationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Model validation failed", "Please check your input and try again.");
            }

            var presenterId = GetCurrentPresenterId();
            if (presenterId == Guid.Empty)
            {
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to update this presentation.");
            }

            var presentation = await _context.Presentations
                .FirstOrDefaultAsync(p => p.Id == id && p.PresenterId == presenterId);

            if (presentation == null)
            {
                return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found", "Presentation not found or you don't have access to it.");
            }

            // Validate that the label belongs to the current presenter if provided
            if (request.LabelId.HasValue)
            {
                var label = await _context.Labels
                    .FirstOrDefaultAsync(l => l.Id == request.LabelId.Value && l.PresenterId == presenterId && l.IsActive);
                
                if (label == null)
                {
                    return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid label", "The specified label does not exist, is inactive, or does not belong to you.");
                }
            }

            presentation.Title = request.Title;
            presentation.LabelId = request.LabelId;
            presentation.LastUpdated = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PresentationExists(id))
                {
                    return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found", "Presentation not found or you don't have access to it.");
                }
                else
                {
                    throw;
                }
            }

            // Reload the presentation with label information to return the response
            await _context.Entry(presentation).Reference(p => p.Label).LoadAsync();

            var response = new PresentationResponse
            {
                Id = presentation.Id,
                Title = presentation.Title,
                CreatedDate = presentation.CreatedDate,
                LastUpdated = presentation.LastUpdated,
                LabelId = presentation.LabelId,
                Label = presentation.Label != null ? new LabelInfo
                {
                    Id = presentation.Label.Id,
                    Name = presentation.Label.Name,
                    Color = presentation.Label.Color,
                    IsActive = presentation.Label.IsActive
                } : null
            };

            return this.Success(response);
        }

        // DELETE: api/presentations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePresentation(Guid id)
        {
            var presenterId = GetCurrentPresenterId();
            if (presenterId == Guid.Empty)
            {
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to delete this presentation.");
            }

            var presentation = await _context.Presentations
                .FirstOrDefaultAsync(p => p.Id == id && p.PresenterId == presenterId);

            if (presentation == null)
            {
                return this.NotFound(ErrorCodes.PRESENTATION_NOT_FOUND, "Presentation not found", "Presentation not found or you don't have access to it.");
            }

            _context.Presentations.Remove(presentation);
            await _context.SaveChangesAsync();

            return this.Success(new { message = "Presentation deleted successfully" });
        }

        private bool PresentationExists(Guid id)
        {
            return _context.Presentations.Any(e => e.Id == id);
        }

        private Guid GetCurrentPresenterId()
        {
            Console.WriteLine($"GetCurrentPresenterId called. User: {User?.Identity?.Name}, IsAuthenticated: {User?.Identity?.IsAuthenticated}");
            Console.WriteLine($"Claims: {string.Join(", ", User?.Claims?.Select(c => $"{c.Type}: {c.Value}") ?? Array.Empty<string>())}");
            
            var presenterIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"NameIdentifier claim: {presenterIdClaim}");
            
            if (Guid.TryParse(presenterIdClaim, out Guid presenterId))
            {
                Console.WriteLine($"Successfully parsed presenterId: {presenterId}");
                return presenterId;
            }
            Console.WriteLine($"Failed to parse presenterId from claim: {presenterIdClaim}");
            return Guid.Empty;
        }
    }
} 