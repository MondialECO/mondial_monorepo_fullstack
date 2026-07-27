using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// STUB: deterministic payment adapter for Module 4. No money moves. Configure
/// PaymentGatewayStub:SimulateFailure=true to exercise failure/reconciliation paths.
/// Replace only this DI registration when a real Stripe/Connect adapter is ready.
/// </summary>
public sealed class StubPaymentGatewayService : IPaymentGatewayService
{
    private readonly bool _fail;
    public StubPaymentGatewayService(IConfiguration configuration) =>
        _fail = configuration.GetValue("PaymentGatewayStub:SimulateFailure", false);

    public Task<PaymentGatewayResult> AuthorizeEscrowAsync(string idempotencyKey, decimal amount, string currency, CancellationToken cancellationToken = default) =>
        Result("escrow", idempotencyKey);
    public Task<PaymentGatewayResult> ReleaseEscrowAsync(string idempotencyKey, string escrowReference, decimal amount, string currency, CancellationToken cancellationToken = default) =>
        Result("release", idempotencyKey);
    public Task<PaymentGatewayResult> RefundEscrowAsync(string idempotencyKey, string escrowReference, decimal amount, string currency, CancellationToken cancellationToken = default) =>
        Result("refund", idempotencyKey);
    public Task<PaymentGatewayResult> CreatePayoutAsync(string idempotencyKey, string maskedPayoutMethodId, decimal amount, string currency, CancellationToken cancellationToken = default) =>
        Result("payout", idempotencyKey);
    public Task<PayoutGatewayStatus> GetPayoutStatusAsync(string gatewayReference, CancellationToken cancellationToken = default) =>
        Task.FromResult(_fail
            ? new PayoutGatewayStatus(PayoutStatus.Failed, gatewayReference, "STUB configured failure.")
            : new PayoutGatewayStatus(PayoutStatus.Completed, gatewayReference));

    private Task<PaymentGatewayResult> Result(string prefix, string key) => Task.FromResult(_fail
        ? new PaymentGatewayResult(false, Error: "STUB configured failure.")
        : new PaymentGatewayResult(true, $"stub_{prefix}_{key}"));
}
