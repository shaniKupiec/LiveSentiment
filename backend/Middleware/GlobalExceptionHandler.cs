using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using LiveSentiment.Models;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace LiveSentiment.Middleware
{
    public class GlobalExceptionHandler
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var errorResponse = exception switch
            {
                DbUpdateConcurrencyException => new ErrorResponse
                {
                    ErrorCode = ErrorCodes.DATABASE_ERROR,
                    Message = "Database concurrency conflict",
                    UserMessage = "The data has been modified by another user. Please refresh and try again."
                },
                DbUpdateException => new ErrorResponse
                {
                    ErrorCode = ErrorCodes.DATABASE_ERROR,
                    Message = "Database operation failed",
                    UserMessage = "Unable to save your changes. Please try again."
                },
                ArgumentException => new ErrorResponse
                {
                    ErrorCode = ErrorCodes.INVALID_INPUT,
                    Message = "Invalid argument provided",
                    UserMessage = "Invalid input provided. Please check your data and try again."
                },
                UnauthorizedAccessException => new ErrorResponse
                {
                    ErrorCode = ErrorCodes.UNAUTHORIZED,
                    Message = "Unauthorized access attempt",
                    UserMessage = "You are not authorized to perform this action."
                },
                _ => new ErrorResponse
                {
                    ErrorCode = ErrorCodes.INTERNAL_ERROR,
                    Message = "An unexpected error occurred",
                    UserMessage = "Something went wrong. Please try again later."
                }
            };

            context.Response.StatusCode = exception switch
            {
                UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
                ArgumentException => (int)HttpStatusCode.BadRequest,
                DbUpdateConcurrencyException => (int)HttpStatusCode.Conflict,
                DbUpdateException => (int)HttpStatusCode.InternalServerError,
                _ => (int)HttpStatusCode.InternalServerError
            };

            var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(jsonResponse);
        }
    }
} 