using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface;

public record PaymentGatewayResult(bool Success, string? GatewayReference = null, string? Error = null);
public record PayoutGatewayStatus(PayoutStatus Status, string? GatewayReference = null, string? Error = null);

public interface IPaymentGatewayService
{
    Task<PaymentGatewayResult> AuthorizeEscrowAsync(string idempotencyKey, decimal amount, string currency, CancellationToken cancellationToken = default);
    Task<PaymentGatewayResult> ReleaseEscrowAsync(string idempotencyKey, string escrowReference, decimal amount, string currency, CancellationToken cancellationToken = default);
    Task<PaymentGatewayResult> RefundEscrowAsync(string idempotencyKey, string escrowReference, decimal amount, string currency, CancellationToken cancellationToken = default);
    Task<PaymentGatewayResult> CreatePayoutAsync(string idempotencyKey, string maskedPayoutMethodId, decimal amount, string currency, CancellationToken cancellationToken = default);
    Task<PayoutGatewayStatus> GetPayoutStatusAsync(string gatewayReference, CancellationToken cancellationToken = default);
}
