using System.Text.Json;
using WebApp.Models;

namespace WebApp.Middleware
{
    /// <summary>
    /// Catches any unhandled exception, logs it with the request's correlation
    /// id, and returns a consistent JSON envelope instead of leaking a stack
    /// trace. Exception details are only included when the environment is
    /// Development.
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _env;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                var correlationId = context.TraceIdentifier;

                // Log the complete exception details including inner exceptions and stack trace
                var exceptionDetails = FormatExceptionDetails(ex);
                _logger.LogError(
                    "Unhandled exception for {Method} {Path} (TraceId: {TraceId}). Details: {ExceptionDetails}",
                    context.Request.Method, context.Request.Path, correlationId, exceptionDetails);

                if (context.Response.HasStarted)
                {
                    // Response already partially sent; can't rewrite it.
                    // This often happens when the exception occurs during response body writing
                    _logger.LogError("Response already started; cannot send error response. TraceId: {TraceId}", correlationId);
                    throw;
                }

                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";

                var message = "An unexpected error occurred. Please try again later.";
                var payload = ApiResponse.Error(message, correlationId);
                await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
            }
        }

        private static string FormatExceptionDetails(Exception ex)
        {
            var sb = new System.Text.StringBuilder();
            var current = ex;
            var depth = 0;

            while (current != null && depth < 5) // Limit depth to avoid excessive output
            {
                if (depth > 0)
                    sb.Append(" → ");

                sb.Append($"{current.GetType().Name}: {current.Message}");
                current = current.InnerException;
                depth++;
            }

            sb.Append($". StackTrace: {ex.StackTrace}");
            return sb.ToString();
        }
    }
}
