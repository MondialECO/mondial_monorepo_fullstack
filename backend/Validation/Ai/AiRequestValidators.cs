using FluentValidation;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Jobs;

namespace WebApp.Validation.Ai
{
    /// <summary>
    /// Auto-discovered by AddValidatorsFromAssemblyContaining and run by the
    /// global ValidationFilter, so failures return the shared ApiResponse shape.
    /// </summary>
    public class EnqueueAiJobRequestValidator : AbstractValidator<EnqueueAiJobRequest>
    {
        public EnqueueAiJobRequestValidator()
        {
            RuleFor(x => x.JobType)
                .NotEmpty().WithMessage("JobType is required.")
                .Must(v => Enum.TryParse<AiJobType>(v, ignoreCase: false, out _))
                .WithMessage("JobType is not a recognised AI job type.");
        }
    }

    public class AiFeedbackRequestValidator : AbstractValidator<AiFeedbackRequest>
    {
        public AiFeedbackRequestValidator()
        {
            RuleFor(x => x.ResponseId).NotEmpty().WithMessage("ResponseId is required.");
            RuleFor(x => x.Rating).InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");
            RuleFor(x => x.Comment).MaximumLength(2000);
        }
    }
}
