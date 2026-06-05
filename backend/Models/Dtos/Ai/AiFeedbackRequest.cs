namespace WebApp.Models.Dtos.Ai
{
    /// <summary>Request body for <c>POST /api/ai/feedback</c>.</summary>
    public class AiFeedbackRequest
    {
        /// <summary>The AIResponses id this feedback is about.</summary>
        public string ResponseId { get; set; } = "";

        /// <summary>Rating 1–5.</summary>
        public int Rating { get; set; }

        public string? Comment { get; set; }
    }
}
