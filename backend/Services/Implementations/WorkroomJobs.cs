using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

public sealed class WorkroomConversionJob(IWorkroomService workrooms)
{
    public Task ConvertAsync(string proposalId) => workrooms.ConvertProposalAsync(proposalId);
    public Task SweepAsync() => workrooms.SweepConversionsAsync();
}

public sealed class WorkroomTimedRulesJob(IWorkroomService workrooms)
{
    public Task RunAsync() => workrooms.SweepTimedRulesAsync();
}
