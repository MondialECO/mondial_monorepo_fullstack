namespace WebApp.Models.Dtos
{
    // Negotiable economics for an offer / counter-offer round (Phase D-4).
    public class OfferTermsRequest
    {
        public double TotalRaiseAmount { get; set; }
        public double PreMoneyValuation { get; set; }
        public double PostMoneyValuation { get; set; }
        public string EquityType { get; set; } = "preferred";
        public double InvestorEquityPercent { get; set; }
        public bool ProRataRights { get; set; }
        public string LiquidationPreference { get; set; } = "1x_non_participating";
        public int BoardSeats { get; set; }
        public string AntiDilutionProtection { get; set; } = "none";
        public string Note { get; set; }
    }

    public class RejectOfferRequest
    {
        public string Note { get; set; }
    }

    public class TermSheetRevisionResponse
    {
        public int RevisionNumber { get; set; }
        public string ProposedByRole { get; set; }
        public string Status { get; set; }
        public string Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ViewedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public TermSheetResponse Terms { get; set; }
    }
}
