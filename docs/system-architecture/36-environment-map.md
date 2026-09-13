# Mondial ECO — Environment Variable & Configuration Specification

This document maps all configuration keys and environment variables consumed by the Next.js frontend, ASP.NET Core backend, Redis, and Traefik containers. Per security requirements, **no secret values are printed**.

---

## 1. Environment Variable Matrix

| Variable / Configuration Key | Consumed By | Purpose & Semantics | Environment | Secret? | Required for Boot? |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Frontend (`api-config.ts`) | Base URL for backend REST calls (e.g. `https://api.mondialbusiness.eu/api`) | Dev & Prod | No | **YES (in Prod)**<br/>Fails build if missing in production |
| `MongoDbSettings__ConnectionString` | Backend (`Program.cs`) | MongoDB Atlas connection string with replica set credentials | Dev & Prod | **YES** | **YES**<br/>Validated at boot by `StartupConfigValidation` |
| `MongoDbSettings__DatabaseName` | Backend (`Program.cs`) | Target database name (e.g. `MondialEcoDev`) | Dev & Prod | No | **YES** |
| `Mongo__TransactionsEnabled` | Backend (`Program.cs`) | Enforces replica set multi-document ACID transactions | Dev & Prod | No | **YES**<br/>Must be explicitly `"true"` |
| `JwtSettings__Key` | Backend (`Program.cs`) | 256-bit (>= 32 bytes) HMAC-SHA256 signing secret for JWT tokens | Dev & Prod | **YES** | **YES**<br/>Must be >= 32 bytes or boot aborts |
| `JwtSettings__Issuer` | Backend (`Program.cs`) | Expected issuer claim (`mondialbusiness.eu`) | Dev & Prod | No | **YES** |
| `JwtSettings__Audience` | Backend (`Program.cs`) | Expected audience claim (`mondialbusiness.eu`) | Dev & Prod | No | **YES** |
| `JwtSettings__ExpiryHours` | Backend (`AuthController.cs`) | Session duration before access token expiry (default: 8 hours) | Dev & Prod | No | No (Default: 8) |
| `OpenRouter__ApiKey` | Backend (`OpenRouterClient.cs`)| API Bearer key for OpenRouter AI inference | Dev & Prod | **YES** | **YES** |
| `EmailSettings__SmtpServer` | Backend (`EmailService.cs`) | SMTP server hostname (`smtp.zoho.com`) | Dev & Prod | No | **YES** |
| `EmailSettings__Port` | Backend (`EmailService.cs`) | SMTP port (587 TLS) | Dev & Prod | No | No (Default: 587) |
| `EmailSettings__Email` | Backend (`EmailService.cs`) | Authenticated sender mailbox account | Dev & Prod | No | **YES** |
| `EmailSettings__Password` | Backend (`EmailService.cs`) | SMTP mailbox password or application token | Dev & Prod | **YES** | **YES** |
| `Redis__Configuration` | Backend (`Program.cs`) | Redis connection endpoint (`localhost:6379` in dev, `redis:6379` in prod) | Dev & Prod | No | No (Default: localhost:6379) |
| `Redis__InstanceName` | Backend (`Program.cs`) | Key namespace prefix (`Mondial`) | Dev & Prod | No | No (Default: Mondial) |
| `REDIS_PASSWORD` | Redis container & Backend | Redis AUTH password for Redis 7 daemon | Prod | **YES** | **YES (in Prod)** |
| `ACME_EMAIL` | Traefik container | Contact email for Let's Encrypt TLS certificate notices | Prod | No | **YES (in Prod)** |
| `APP_DOMAIN` | Traefik container | Ingress domain routing rule (e.g. `api.mondialbusiness.eu`) | Prod | No | **YES (in Prod)** |
| `APP_IMAGE` | Docker Compose | Target image tag for deployment (e.g. `ghcr.io/...`) | Prod | No | No (Default: local) |
| `Sumsub__AppToken` | Backend (`SumsubService.cs`) | Application token for Sumsub KYC API | Dev & Prod | **YES** | No (Optional in mock) |
| `Sumsub__WebhookSecret` | Backend (`SumsubService.cs`) | HMAC signing secret for Sumsub callback validation | Dev & Prod | **YES** | No (Optional in mock) |
| `Sumsub__BaseUrl` | Backend (`SumsubService.cs`) | Target Sumsub API endpoint (staging vs prod) | Dev & Prod | No | No |
| `Twilio__AccountSid` | Backend (`TwilioService.cs`) | Account identifier for Twilio SMS | Dev & Prod | **YES** | No (Optional/Flagged) |
| `Twilio__AuthToken` | Backend (`TwilioService.cs`) | Secret auth token for Twilio API | Dev & Prod | **YES** | No (Optional/Flagged) |
| `Twilio__FromNumber` | Backend (`TwilioService.cs`) | Registered originating phone number | Dev & Prod | No | No (Optional/Flagged) |
| `Twilio__Enabled` | Backend (`TwilioService.cs`) | Feature flag toggle for Twilio SMS operations | Dev & Prod | No | No (Default: false) |
| `Hangfire__WorkerCount` | Backend (`Program.cs`) | Concurrency limit for background job execution | Dev & Prod | No | No (Default: 4) |
| `Limits__MaxRequestBodyBytes` | Backend (`Program.cs`) | Kestrel maximum request payload cap (default: 10MB) | Dev & Prod | No | No (Default: 10MB) |
