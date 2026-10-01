namespace WebApp.Models.Dtos.Ai
{
    public class CreditPackageDto
    {
        public string PackageId { get; set; } = string.Empty;
        public int Credits { get; set; }
        public int AmountInCents { get; set; }
        public string Currency { get; set; } = "eur";
        public string DisplayName { get; set; } = string.Empty;
    }

    public class CreateCheckoutRequestDto
    {
        public string PackageId { get; set; } = string.Empty;
    }

    public class CheckoutSessionResponseDto
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string? SessionId { get; set; }
    }

    public class CreditPurchaseHistoryDto
    {
        public string PurchaseId { get; set; } = string.Empty;
        public string PackageId { get; set; } = string.Empty;
        public int Credits { get; set; }
        public int AmountInCents { get; set; }
        public string Currency { get; set; } = "eur";
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
