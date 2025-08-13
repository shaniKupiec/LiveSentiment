using LiveSentiment.Models;
using LiveSentiment.Services;
using LiveSentiment.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LiveSentiment.Controllers
{
    [ApiController]
    [Route("api/labels")]
    [Authorize]
    public class LabelController : ControllerBase
    {
        private readonly ILabelService _labelService;

        public LabelController(ILabelService labelService)
        {
            _labelService = labelService;
        }

        [HttpGet]
        public async Task<ActionResult<List<LabelResponse>>> GetUserLabels()
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access your labels");

            var labels = await _labelService.GetUserLabelsAsync(presenterId.Value);
            return this.Success(labels);
        }

        [HttpGet("all")]
        public async Task<ActionResult<List<LabelResponse>>> GetAllUserLabels()
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access your labels");

            var labels = await _labelService.GetAllUserLabelsAsync(presenterId.Value);
            return this.Success(labels);
        }

        [HttpGet("{labelId}")]
        public async Task<ActionResult<LabelResponse>> GetLabel(Guid labelId)
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access this label");

            var label = await _labelService.GetLabelAsync(labelId, presenterId.Value);
            if (label == null)
                return this.NotFound(ErrorCodes.NOT_FOUND, "Label not found", "The label you requested was not found or you don't have access to it");

            return this.Success(label);
        }

        [HttpGet("{labelId}/presentations")]
        public async Task<ActionResult<LabelWithPresentationsResponse>> GetLabelWithPresentations(Guid labelId)
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to access this label");

            var label = await _labelService.GetLabelWithPresentationsAsync(labelId, presenterId.Value);
            if (label == null)
                return this.NotFound(ErrorCodes.NOT_FOUND, "Label not found", "The label you requested was not found or you don't have access to it");

            return this.Success(label);
        }

        [HttpPost]
        public async Task<ActionResult<LabelResponse>> CreateLabel([FromBody] CreateLabelRequest request)
        {
            if (!ModelState.IsValid)
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid input", "Please check your input and try again");

            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to create a label");

            var label = await _labelService.CreateLabelAsync(request, presenterId.Value);
            return this.Success(label);
        }

        [HttpPut("{labelId}")]
        public async Task<ActionResult<LabelResponse>> UpdateLabel(Guid labelId, [FromBody] UpdateLabelRequest request)
        {
            if (!ModelState.IsValid)
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid input", "Please check your input and try again");

            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to update this label");

            var label = await _labelService.UpdateLabelAsync(labelId, request, presenterId.Value);
            if (label == null)
                return this.NotFound(ErrorCodes.NOT_FOUND, "Label not found", "The label you requested was not found or you don't have access to it");

            return this.Success(label);
        }

        [HttpDelete("{labelId}")]
        public async Task<ActionResult> DeleteLabel(Guid labelId)
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to delete this label");

            var success = await _labelService.DeleteLabelAsync(labelId, presenterId.Value);
            if (!success)
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Cannot delete label", "Label not found or you don't have access to it");

            return this.Success(new { message = "Label deleted successfully (soft delete)" });
        }

        [HttpPost("{labelId}/reactivate")]
        public async Task<ActionResult> ReactivateLabel(Guid labelId)
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to reactivate this label");

            var success = await _labelService.ReactivateLabelAsync(labelId, presenterId.Value);
            if (!success)
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Cannot reactivate label", "Label not found, already active, or you don't have access to it");

            return NoContent();
        }

        [HttpPost("{labelId}/assign/{presentationId}")]
        public async Task<ActionResult> AssignLabelToPresentation(Guid labelId, Guid presentationId)
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to assign labels");

            var success = await _labelService.AssignLabelToPresentationAsync(labelId, presentationId, presenterId.Value);
            if (!success)
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid label or presentation", "The label or presentation you specified is not valid");

            return NoContent();
        }

        [HttpDelete("presentations/{presentationId}/label")]
        public async Task<ActionResult> RemoveLabelFromPresentation(Guid presentationId)
        {
            var presenterId = GetPresenterIdFromClaims();
            if (presenterId == null)
                return this.Unauthorized(ErrorCodes.UNAUTHORIZED, "User not authenticated", "Please log in to remove labels");

            var success = await _labelService.RemoveLabelFromPresentationAsync(presentationId, presenterId.Value);
            if (!success)
                return this.BadRequest(ErrorCodes.VALIDATION_ERROR, "Invalid presentation", "The presentation you specified is not valid");

            return NoContent();
        }



        private Guid? GetPresenterIdFromClaims()
        {
            var presenterIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(presenterIdClaim, out var presenterId))
                return presenterId;
            return null;
        }
    }
}
