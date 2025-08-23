using Microsoft.AspNetCore.Mvc;
using LiveSentiment.Models;

namespace LiveSentiment.Extensions
{
    public static class ControllerExtensions
    {
        public static ActionResult Success<T>(this ControllerBase controller, T data)
        {
            var response = new SuccessResponse<T> { Data = data };
            return controller.Ok(response);
        }

        public static ActionResult Error(this ControllerBase controller, string errorCode, string message, string userMessage, int statusCode = 400)
        {
            var errorResponse = new ErrorResponse
            {
                ErrorCode = errorCode,
                Message = message,
                UserMessage = userMessage
            };

            return controller.StatusCode(statusCode, errorResponse);
        }

        public static ActionResult NotFound(this ControllerBase controller, string errorCode, string message, string userMessage)
        {
            return controller.Error(errorCode, message, userMessage, 404);
        }

        public static ActionResult Unauthorized(this ControllerBase controller, string errorCode, string message, string userMessage)
        {
            return controller.Error(errorCode, message, userMessage, 401);
        }

        public static ActionResult Forbidden(this ControllerBase controller, string errorCode, string message, string userMessage)
        {
            return controller.Error(errorCode, message, userMessage, 403);
        }

        public static ActionResult BadRequest(this ControllerBase controller, string errorCode, string message, string userMessage)
        {
            return controller.Error(errorCode, message, userMessage, 400);
        }

        public static ActionResult Conflict(this ControllerBase controller, string errorCode, string message, string userMessage)
        {
            return controller.Error(errorCode, message, userMessage, 409);
        }

        public static ActionResult InternalServerError(this ControllerBase controller, string errorCode, string message, string userMessage)
        {
            return controller.Error(errorCode, message, userMessage, 500);
        }
    }
} 