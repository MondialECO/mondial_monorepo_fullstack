# Phase 9: Deal Pipeline — Controller & TypeScript (Redesigned)

## Controller (Phase9Controller.cs)

```csharp
using Backend.Models.Dtos;
using Backend.Services.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/companies/{companyId}/deals")]
    public class Phase9Controller : ControllerBase
    {
        private readonly IPhase9Service _phase9Service;

        public Phase9Controller(IPhase9Service phase9Service)
        {
            _phase9Service = phase9Service;
        }

        [HttpPost]
        public async Task<ActionResult<DealResponse>> CreateDeal(string companyId, [FromBody] CreateDealRequest request)
        {
            try
            {
                var deal = await _phase9Service.CreateDealAsync(companyId, request);
                return CreatedAtAction(nameof(GetDeal), new { companyId, dealId = deal.DealId }, deal);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<DealResponse[]>> GetDeals(string companyId, [FromQuery] string status = null)
        {
            try
            {
                var deals = await _phase9Service.GetDealsAsync(companyId, status);
                return Ok(deals);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{dealId}")]
        public async Task<ActionResult<DealResponse>> GetDeal(string companyId, string dealId)
        {
            try
            {
                var deals = await _phase9Service.GetDealsAsync(companyId);
                var deal = deals.Find(d => d.DealId == dealId);
                if (deal == null) return NotFound();
                return Ok(deal);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPatch("{dealId}")]
        public async Task<ActionResult<DealResponse>> UpdateDeal(string companyId, string dealId, [FromBody] UpdateDealRequest request)
        {
            try
            {
                var deal = await _phase9Service.UpdateDealAsync(companyId, dealId, request);
                return Ok(deal);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{dealId}")]
        public async Task<ActionResult> DeleteDeal(string companyId, string dealId)
        {
            try
            {
                await _phase9Service.DeleteDealAsync(companyId, dealId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        [HttpPost("{dealId}/close")]
        public async Task<ActionResult<DealResponse>> CloseDeal(string companyId, string dealId)
        {
            try
            {
                var deal = await _phase9Service.CloseDealAsync(companyId, dealId);
                return Ok(deal);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("summary")]
        public async Task<ActionResult<RoundSummaryResponse>> GetRoundSummary(string companyId)
        {
            try
            {
                var summary = await _phase9Service.GetRoundSummaryAsync(companyId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("timeline")]
        public async Task<ActionResult<TimelineEventResponse[]>> GetTimeline(string companyId)
        {
            try
            {
                var timeline = await _phase9Service.GetTimelineAsync(companyId);
                return Ok(timeline);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/companies/{companyId}/term-sheets")]
    public class TermSheetController : ControllerBase
    {
        private readonly IPhase9Service _phase9Service;

        public TermSheetController(IPhase9Service phase9Service)
        {
            _phase9Service = phase9Service;
        }

        [HttpPost]
        public async Task<ActionResult<TermSheetResponse>> CreateTermSheet(string companyId, [FromBody] CreateTermSheetRequest request)
        {
            try
            {
                var ts = await _phase9Service.CreateTermSheetAsync(companyId, request);
                return CreatedAtAction(nameof(GetActiveTermSheet), new { companyId }, ts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<ActionResult<TermSheetResponse>> GetActiveTermSheet(string companyId)
        {
            try
            {
                var ts = await _phase9Service.GetActiveTermSheetAsync(companyId);
                if (ts == null) return NotFound();
                return Ok(ts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPatch("{termSheetId}/accept")]
        public async Task<ActionResult<TermSheetResponse>> AcceptTermSheet(string companyId, string termSheetId)
        {
            try
            {
                var ts = await _phase9Service.AcceptTermSheetAsync(companyId, termSheetId);
                return Ok(ts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPatch("{termSheetId}/counter")]
        public async Task<ActionResult<TermSheetResponse>> CounterTermSheet(string companyId, string termSheetId)
        {
            try
            {
                var ts = await _phase9Service.CounterTermSheetAsync(companyId, termSheetId);
                return Ok(ts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
```

## TypeScript Types (api-entrepreneur.ts)

```typescript
// Add to lib/api-entrepreneur.ts

export interface DealResponse {
  dealId: string;
  investorId: string;
  investorName: string;
  investorType: 'vc' | 'angel' | 'corporate' | 'family_office';
  status: 'interested' | 'in_discussion' | 'term_sheet' | 'due_diligence' | 'closed' | 'abandoned';
  committedAmountEur?: number;
  activityTitle: string;
  activityDescription: string;
  activityDate: string;
  createdAt: string;
}

export interface TermSheetResponse {
  termSheetId: string;
  dealId: string;
  investorName: string;
  equityPercent: number;
  investmentAmountEur: number;
  preMoneyValuationEur: number;
  postMoneyValuationEur: number;
  shareClass: string;
  liquidationPref: string;
  boardSeat: string;
  hasBoardSeat: boolean;
  antiDilutionType: string;
  closingDeadline?: string;
  expiresAt?: string;
  status: 'pending' | 'accepted' | 'countered' | 'rejected';
  createdAt: string;
}

export interface RoundSummaryResponse {
  totalDeals: number;
  committedAmountEur: number;
  roundTargetEur: number;
  remainingEur: number;
  percentFilled: number;
  interestedCount: number;
  inDiscussionCount: number;
  termSheetCount: number;
  closedCount: number;
}

export interface TimelineEventResponse {
  eventId: string;
  eventDate: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'pending';
  color: 'green' | 'blue' | 'amber' | 'gray';
}

// API Methods

export const createDeal = async (
  companyId: string,
  request: {
    investorName: string;
    investorType: string;
    activityTitle: string;
    activityDescription: string;
  }
): Promise<DealResponse> => {
  const res = await axiosInstance.post(`/api/companies/${companyId}/deals`, request);
  return res.data;
};

export const getDeals = async (companyId: string, status?: string): Promise<DealResponse[]> => {
  const res = await axiosInstance.get(`/api/companies/${companyId}/deals`, { params: { status } });
  return res.data;
};

export const updateDeal = async (
  companyId: string,
  dealId: string,
  request: {
    status?: string;
    committedAmountEur?: number;
    activityTitle?: string;
    activityDescription?: string;
  }
): Promise<DealResponse> => {
  const res = await axiosInstance.patch(`/api/companies/${companyId}/deals/${dealId}`, request);
  return res.data;
};

export const deleteDeal = async (companyId: string, dealId: string): Promise<void> => {
  await axiosInstance.delete(`/api/companies/${companyId}/deals/${dealId}`);
};

export const closeDeal = async (companyId: string, dealId: string): Promise<DealResponse> => {
  const res = await axiosInstance.post(`/api/companies/${companyId}/deals/${dealId}/close`, {});
  return res.data;
};

export const getRoundSummary = async (companyId: string): Promise<RoundSummaryResponse> => {
  const res = await axiosInstance.get(`/api/companies/${companyId}/deals/summary`);
  return res.data;
};

export const getTimeline = async (companyId: string): Promise<TimelineEventResponse[]> => {
  const res = await axiosInstance.get(`/api/companies/${companyId}/deals/timeline`);
  return res.data;
};

export const createTermSheet = async (
  companyId: string,
  request: {
    dealId: string;
    investorName: string;
    equityPercent: number;
    investmentAmountEur: number;
    preMoneyValuationEur: number;
    shareClass: string;
    liquidationPref: string;
    boardSeat: string;
    hasBoardSeat: boolean;
    antiDilutionType: string;
    closingDeadline?: Date;
    expiresAt?: Date;
  }
): Promise<TermSheetResponse> => {
  const res = await axiosInstance.post(`/api/companies/${companyId}/term-sheets`, {
    ...request,
    closingDeadline: request.closingDeadline?.toISOString(),
    expiresAt: request.expiresAt?.toISOString(),
  });
  return res.data;
};

export const getActiveTermSheet = async (companyId: string): Promise<TermSheetResponse | null> => {
  try {
    const res = await axiosInstance.get(`/api/companies/${companyId}/term-sheets/active`);
    return res.data;
  } catch (error) {
    if ((error as any)?.response?.status === 404) return null;
    throw error;
  }
};

export const acceptTermSheet = async (companyId: string, termSheetId: string): Promise<TermSheetResponse> => {
  const res = await axiosInstance.patch(`/api/companies/${companyId}/term-sheets/${termSheetId}/accept`, {});
  return res.data;
};

export const counterTermSheet = async (companyId: string, termSheetId: string): Promise<TermSheetResponse> => {
  const res = await axiosInstance.patch(`/api/companies/${companyId}/term-sheets/${termSheetId}/counter`, {});
  return res.data;
};
```

## Error Handling Middleware Addition

```csharp
// In Startup.cs or Program.cs error handling middleware
app.UseExceptionHandler((errorApp) =>
{
    errorApp.Run(async context =>
    {
        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        if (exception is InvalidOperationException)
        {
            context.Response.StatusCode = 409;  // Conflict
        }
        else if (exception is KeyNotFoundException)
        {
            context.Response.StatusCode = 404;  // Not Found
        }
        else if (exception is ArgumentException)
        {
            context.Response.StatusCode = 400;  // Bad Request
        }
        else
        {
            context.Response.StatusCode = 500;  // Internal Server Error
        }

        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = exception?.Message });
    });
});
```

