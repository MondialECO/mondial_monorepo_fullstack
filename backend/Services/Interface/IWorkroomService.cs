using WebApp.Models.Dtos;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface;

public interface IWorkroomService
{
    Task ConvertProposalAsync(string proposalId);
    Task SweepConversionsAsync();
    Task SweepTimedRulesAsync();
    Task<ServiceProviderResult<List<WorkroomEngagementResponse>>> GetEngagementsAsync(string actorId);
    Task<ServiceProviderResult<WorkroomDetailResponse>> GetEngagementAsync(string actorId, string engagementId);
    Task<ServiceProviderResult<ContractResponse>> SignContractAsync(string actorId, string engagementId, bool explicitlyConfirmed);
    Task<ServiceProviderResult<WorkroomMilestoneResponse>> FundMilestoneAsync(string clientId, string milestoneId);
    Task<ServiceProviderResult<WorkroomMilestoneResponse>> ActivateMilestoneAsync(string providerId, string milestoneId);
    Task<ServiceProviderResult<WorkroomDetailResponse>> SubmitDeliverableAsync(string providerId, string milestoneId, SubmitDeliverableRequest request);
    Task<ServiceProviderResult<WorkroomDetailResponse>> RequestRevisionAsync(string clientId, string milestoneId, CreateRevisionRequest request);
    Task<ServiceProviderResult<WorkroomDetailResponse>> ApproveMilestoneAsync(string clientId, string milestoneId);
    Task<ServiceProviderResult<WorkroomDetailResponse>> OpenDisputeAsync(string actorId, string milestoneId, string reason);
    Task<ServiceProviderResult<WorkroomEngagementResponse>> PauseEngagementAsync(string actorId, string engagementId, string reason);
    Task<ServiceProviderResult<WorkroomEngagementResponse>> ResumeEngagementAsync(string actorId, string engagementId);
    Task<ServiceProviderResult<WorkroomMilestoneResponse>> RequestExtensionAsync(string providerId, string milestoneId, int days, string reason);
    Task<ServiceProviderResult<WorkroomMilestoneResponse>> DecideExtensionAsync(string clientId, string milestoneId, bool approve, int days, string reason);
    Task<ServiceProviderResult<WorkroomDetailResponse>> StartRevisionAsync(string providerId, string revisionId);
    Task<ServiceProviderResult<WorkroomDetailResponse>> ResolveDisputeAsync(string adminId, string milestoneId, string outcome, string reason);
    Task<ServiceProviderResult<WorkroomEngagementResponse>> CompleteEngagementAsync(string actorId, string engagementId);
    Task<ServiceProviderResult<Review>> SubmitReviewAsync(string clientId, string engagementId, CreateReviewRequest request);
    Task<ServiceProviderResult<Review>> RespondToReviewAsync(string providerId, string reviewId, string response);
    Task<ServiceProviderResult<WorkroomFile>> UploadFileAsync(string actorId, string engagementId, string? milestoneId, IFormFile file, bool providerPrivate);
    Task<ServiceProviderResult<WorkroomFileDownload>> DownloadFileAsync(string actorId, string fileId);
    Task<ServiceProviderResult<WorkroomTask>> CreateTaskAsync(string actorId, string engagementId, CreateTaskRequest request);
    Task<ServiceProviderResult<ClientInputRequest>> RequestClientInputAsync(string providerId, string engagementId, CreateClientInputRequest request);
    Task<ServiceProviderResult<HourlyTimeEntry>> AddTimeEntryAsync(string providerId, string engagementId, CreateTimeEntryRequest request);
    Task<ServiceProviderResult<ProviderFinancialSummaryResponse>> GetFinancialSummaryAsync(string providerId, string? currency);
    Task<ServiceProviderResult<StatementResponse>> GetStatementAsync(string providerId, DateTime from, DateTime to, string? currency);
    Task<ServiceProviderResult<ProviderFinancialSettings>> AddPayoutMethodAsync(string providerId, AddPayoutMethodRequest request);
    Task<ServiceProviderResult<ProviderFinancialSettings>> SetDefaultPayoutMethodAsync(string providerId, string payoutMethodId);
    Task<ServiceProviderResult<ProviderFinancialSettings>> RemovePayoutMethodAsync(string providerId, string payoutMethodId);
    Task<ServiceProviderResult<ProviderFinancialSettings>> UpdateTaxSettingsAsync(string providerId, UpdateTaxSettingsRequest request);
    Task<ServiceProviderResult<PayoutRequest>> RequestPayoutAsync(string providerId, CreatePayoutRequest request);
}
