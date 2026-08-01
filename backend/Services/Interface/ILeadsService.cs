using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

public interface ILeadsService
{
    Task<ServiceProviderResult<ClientBriefResponse>> CreateBriefAsync(string clientId, CreateClientBriefRequest request);
    Task<ServiceProviderResult<ClientBriefResponse>> PublishBriefAsync(string clientId, string briefId);
    Task<ServiceProviderResult<ClientBriefResponse>> CloseBriefAsync(string clientId, string briefId);
    Task<ServiceProviderResult<List<ClientBriefResponse>>> GetInboxAsync(string providerId, LeadQueryRequest query);
    Task<ServiceProviderResult<ClientBriefResponse>> GetBriefAsync(string providerId, string briefId);
    Task<ServiceProviderResult<ClientBriefResponse>> UpdateInteractionAsync(string providerId, string briefId, UpdateBriefInteractionRequest request);
    Task<ServiceProviderResult<List<ProposalResponse>>> GetProviderProposalsAsync(string providerId);
    Task<ServiceProviderResult<List<ProposalResponse>>> GetClientProposalsAsync(string clientId);
    Task<ServiceProviderResult<ProposalResponse>> GetProposalAsync(string actorId, string proposalId);
    Task<ServiceProviderResult<ProposalResponse>> CreateDraftAsync(string providerId, UpsertProposalRequest request);
    Task<ServiceProviderResult<ProposalResponse>> UpdateDraftAsync(string providerId, string proposalId, UpsertProposalRequest request);
    Task<ServiceProviderResult<ProposalResponse>> SubmitAsync(string providerId, string proposalId);
    Task<ServiceProviderResult<ProposalResponse>> WithdrawAsync(string providerId, string proposalId);
    Task<ServiceProviderResult<ProposalResponse>> DuplicateExpiredAsync(string providerId, string proposalId);
    Task<ServiceProviderResult<ProposalResponse>> ReviseAsync(string providerId, string proposalId, UpsertProposalRequest request);
    Task<ServiceProviderResult<ProposalResponse>> MarkViewedAsync(string clientId, string proposalId);
    Task<ServiceProviderResult<ProposalResponse>> RequestChangesAsync(string clientId, string proposalId);
    Task<ServiceProviderResult<ProposalResponse>> StartReviewAsync(string clientId, string proposalId);
    Task<ServiceProviderResult<ProposalResponse>> AcceptAsync(string clientId, string proposalId, AcceptProposalRequest request);
    Task<ServiceProviderResult<ProposalResponse>> DeclineAsync(string clientId, string proposalId);
    Task<ServiceProviderResult<PackagePurchaseResponse>> PurchasePackageAsync(string clientId, PackagePurchaseRequest request);
    Task<ServiceProviderResult<ProposalResponse>> ProviderReviewOrderRequestAsync(string providerId, string proposalId, bool accept);
}

public interface IResponseRateService
{
    Task<double?> CalculateAsync(string providerId);
    Task RefreshTrustSignalAsync(string providerId);
}
