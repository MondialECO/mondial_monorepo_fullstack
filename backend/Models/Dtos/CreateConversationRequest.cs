namespace WebApp.Models.Dtos
{
    public class CreateConversationRequest
    {
        // The other participant of the direct conversation. The caller is
        // always the first participant (taken from the JWT, never the body).
        public string TargetUserId { get; set; } = "";
    }
}
