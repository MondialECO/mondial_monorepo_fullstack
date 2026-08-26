import { describe, expect, it } from 'vitest';
import { toAiError } from '@/lib/ai-errors';

describe('Business Plan & AI Error Classification Mapping', () => {
  it('maps HTTP 402 to credits error kind with accurate copy and non-retryable semantics', () => {
    const error402 = {
      response: {
        status: 402,
        data: { message: 'Insufficient credits.' },
      },
    };

    const result = toAiError(error402);
    expect(result.kind).toBe('credits');
    expect(result.status).toBe(402);
    expect(result.message).toBe("You've used all your AI credits.");
    expect(result.message).not.toContain('temporarily unavailable');
    expect(result.message).not.toContain('provider error');
  });

  it('maps HTTP 503 to provider/service error kind with temporary unavailability message', () => {
    const error503 = {
      response: {
        status: 503,
        data: { message: 'Service Unavailable' },
      },
    };

    const result = toAiError(error503);
    expect(result.kind).toBe('service');
    expect(result.status).toBe(503);
    expect(result.message).toContain('temporarily unavailable');
    expect(result.message).not.toContain('credits');
  });

  it('maps HTTP 429 to rate-limit error kind with rate limit message', () => {
    const error429 = {
      response: {
        status: 429,
        data: { message: 'Too Many Requests' },
      },
    };

    const result = toAiError(error429);
    expect(result.kind).toBe('rateLimited');
    expect(result.status).toBe(429);
    expect(result.message).toContain('wait a moment and try again');
    expect(result.message).not.toContain('credits');
  });

  it('maps validation 4xx to validation specific message without assuming provider failure', () => {
    const error400 = {
      response: {
        status: 400,
        data: { message: 'clarifierSessionId is required.' },
      },
    };

    const result = toAiError(error400);
    expect(result.kind).toBe('other');
    expect(result.status).toBe(400);
    expect(result.message).toBe('clarifierSessionId is required.');
    expect(result.message).not.toContain('temporarily unavailable');
    expect(result.message).not.toContain('credits');
  });
});
