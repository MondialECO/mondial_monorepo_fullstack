using System.Text.Json;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>Request body for <c>POST /api/ai/jobs</c>.</summary>
    public class EnqueueAiJobRequest
    {
        /// <summary>AI job type name (must match an <c>AiJobType</c> value).</summary>
        public string JobType { get; set; } = "";

        /// <summary>Free-form module input; persisted as the request's InputPayload.</summary>
        public JsonElement? Input { get; set; }
    }
}
