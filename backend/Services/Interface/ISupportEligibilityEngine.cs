using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface ISupportEligibilityEngine
    {
        SupportMatch EvaluateOpportunity(SupportOpportunity opp, SupportEligibilityContext ctx);
    }
}
