# Mondial ECO — External Third-Party Integrations Map

This document inventories all external HTTP clients, cloud gateways, and third-party APIs used across the Mondial ECO ecosystem. Per security requirements, **no secret values are printed**.

---

## 1. External Integration Directory

| Provider | Purpose & Capability | Calling Backend Service | Configuration Key (Env Var) | Data Sent | Data Received |
|---|---|---|---|---|---|
| **OpenRouter AI** | LLM completion engine for Idea Clarifier, Business Plan, and Financial Forecast | `OpenRouterClient.cs`<br/>(via typed `HttpClient`) | `OpenRouter:ApiKey`<br/>`OpenRouter:BaseUrl` | Model identifier, system instructions, hydrated user prompt, token limits | Completion message choices, structured text/JSON, token usage metrics |
| **Sumsub KYC** | Automated identity document verification and OCR | `SumsubService.cs` | `Sumsub:AppToken`<br/>`Sumsub:WebhookSecret`<br/>`Sumsub:BaseUrl` | Applicant profile, ID document scans | Verification status (`GREEN`/`RED`), OCR identity fields, webhook notifications |
| **Zoho SMTP** | Transactional email delivery for account activation, password reset, and deal alerts | `EmailBackgroundService.cs`<br/>(via MailKit `4.16.0`) | `EmailSettings:SmtpServer`<br/>`EmailSettings:Email`<br/>`EmailSettings:Password` | Recipient email, subject line, branded HTML email template | SMTP delivery ACK or exception code |
| **Twilio SMS** | SMS verification code dispatch for phone number verification in Phase 1 | `TwilioService.cs` | `Twilio:AccountSid`<br/>`Twilio:AuthToken`<br/>`Twilio:FromNumber` | E.164 phone number, one-time verification code text | Twilio Message SID, delivery receipt status |
| **Let's Encrypt** | Automated TLS/SSL certificate issuance and renewal | Traefik v2.11 ACME Resolver | `ACME_EMAIL` | Domain names (`mondialbusiness.eu`), TLS challenge proof | Signed x509 SSL certificate stored in `/letsencrypt/acme.json` |

---

## 2. Integration Resilience & Failover Patterns

1. **Polly Transient Fault Handling on OpenRouter**:
   - `OpenRouterClient` utilizes Polly to automatically retry on HTTP 429 (Too Many Requests) and HTTP 5xx errors with exponential backoff.
   - Long-running jobs run asynchronously on the Hangfire `ai` queue, isolating the user from upstream latency.
2. **Asynchronous Non-Blocking Email Queue**:
   - Outbound transactional emails are never dispatched synchronously on request threads. Calling controllers enqueue to the in-memory `IEmailQueue` singleton; `EmailBackgroundService` drains the queue sequentially.
3. **Sumsub Webhook Cryptographic Verification**:
   - Incoming webhooks from Sumsub are authenticated against `Sumsub:WebhookSecret` using HMAC-SHA256 signature verification before processing applicant status transitions.
