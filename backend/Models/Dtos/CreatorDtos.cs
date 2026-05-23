namespace WebApp.Models.Dtos;

// ============ CREATOR PHASES ============

public class CrossRoadsDecisionRequest
{
    public string Decision { get; set; } // PATH_A | PATH_B
}

public class CreatorIpOfferRequest
{
    public string CreatorId { get; set; }
    public string IpId { get; set; }
    public string BuyerType { get; set; } // Investor | Entrepreneur
    public string BuyerId { get; set; }
    public double Price { get; set; }
    public bool NdaRequired { get; set; } = true;
}

public class CreatorIpOfferResponse
{
    public string OfferId { get; set; }
    public string CreatorId { get; set; }
    public string IpId { get; set; }
    public string BuyerType { get; set; }
    public double Price { get; set; }
    public string Status { get; set; } // pending | accepted | rejected | countered
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
