namespace WebApp.Models.Dtos
{
    public record ImpressionRequest(string ListingId);
    public record ClickRequest(string ListingId, string? Target);
}
