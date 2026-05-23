# Mondial Monorepo Setup

Use this guide on a fresh machine after cloning the repository. The active frontend app is at the repository root. The backend is in `backend/`.

## Prerequisites

- Git
- Node.js 20+ and npm
- .NET 8 SDK
- MongoDB connection, either local MongoDB or MongoDB Atlas
- Optional for local development: Redis. The backend disables Redis by default in Development unless `Redis:Enabled=true`.

## Clone

```powershell
git clone <repo-url> mondial_monorepo_fullstack
cd mondial_monorepo_fullstack
```

## Frontend Setup

Install dependencies from the repository root:

```powershell
npm ci
```

Create `.env.local` in the repository root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5093/api
NEXT_PUBLIC_DEV_MODE=false
```

Optional:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Run the frontend:

```powershell
npm run dev
```

Expected frontend URL:

- `http://localhost:3000`

## Backend Setup

Restore packages:

```powershell
cd backend
dotnet restore WebApp.csproj
```

Configure local secrets with ASP.NET user-secrets. Do not put real secrets in committed files.

```powershell
dotnet user-secrets set "MongoDbSettings:ConnectionString" "mongodb://localhost:27017"
dotnet user-secrets set "MongoDbSettings:DatabaseName" "MondialEcoDev"
dotnet user-secrets set "JwtSettings:Issuer" "mondialbusiness.eu"
dotnet user-secrets set "JwtSettings:Audience" "mondialbusiness.eu"
dotnet user-secrets set "JwtSettings:Key" "replace-with-a-random-key-at-least-32-bytes-long"
dotnet user-secrets set "EmailSettings:SmtpServer" "smtp.zoho.com"
dotnet user-secrets set "EmailSettings:Port" "587"
dotnet user-secrets set "EmailSettings:Email" "dev@example.com"
dotnet user-secrets set "EmailSettings:Password" "replace-with-smtp-password-or-dev-placeholder"
dotnet user-secrets set "Twilio:Enabled" "false"
dotnet user-secrets set "Cors:AllowedOrigins:0" "http://localhost:3000"
```

If using MongoDB Atlas, replace the Mongo connection string with your Atlas URI. If using local MongoDB, make sure MongoDB is running before starting the backend.

Run the backend:

```powershell
dotnet run --project WebApp.csproj --launch-profile http
```

Expected backend URLs:

- API: `http://localhost:5093/api`
- Swagger: `http://localhost:5093/swagger`
- Health: `http://localhost:5093/health`

## Build Checks

From the repository root:

```powershell
npm run build
```

From `backend/`:

```powershell
dotnet build WebApp.csproj
```

## Signup/Login Smoke Test

1. Start the backend on `http://localhost:5093`.
2. Start the frontend on `http://localhost:3000`.
3. Open `http://localhost:3000/signup`.
4. Create a user with one canonical role: `Entrepreneur`, `Creator`, `Investor`, or `ServiceProvider`.
5. Complete the post-signup onboarding token flow.
6. Log in at `http://localhost:3000/login`.
7. With Universal Phase 1 incomplete, direct dashboard access should redirect to the role-specific Phase 1 page.
8. After Universal Phase 1 is complete, dashboard access should proceed and Entrepreneur company phases should use `/api/companies/current-phase`.

## Environment Reference

Frontend variables:

- `NEXT_PUBLIC_API_BASE_URL`: backend API base URL, including `/api`. Local default: `http://localhost:5093/api`.
- `NEXT_PUBLIC_DEV_MODE`: set `false` for normal local and production runs.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: optional search-console verification token.

Backend configuration keys:

- `MongoDbSettings:ConnectionString`: MongoDB connection string.
- `MongoDbSettings:DatabaseName`: Mongo database name. Local default: `MondialEcoDev`.
- `JwtSettings:Issuer`: JWT issuer.
- `JwtSettings:Audience`: JWT audience.
- `JwtSettings:Key`: at least 32 bytes for HMAC-SHA256.
- `EmailSettings:SmtpServer`: SMTP host.
- `EmailSettings:Port`: SMTP port.
- `EmailSettings:Email`: SMTP sender/login.
- `EmailSettings:Password`: SMTP password.
- `Twilio:Enabled`: set `false` until SMS sending is intentionally enabled.
- `Twilio:AccountSid`, `Twilio:AuthToken`, `Twilio:FromNumber`: required only when `Twilio:Enabled=true`.
- `Redis:Enabled`: optional in Development. Production uses Redis-backed services.
- `Redis:Configuration`: Redis connection string.
- `Redis:InstanceName`: Redis key prefix.
- `Cors:AllowedOrigins:0`: local frontend origin, usually `http://localhost:3000`.

Production/staging can use environment variables with `__` separators, for example:

```env
MongoDbSettings__ConnectionString=mongodb+srv://USER:PASS@cluster.mongodb.net/
JwtSettings__Key=replace-with-production-secret
Cors__AllowedOrigins__0=https://your-frontend-domain
Twilio__Enabled=false
```

## Notes

- `appsettings.json` is committed with blank secrets only.
- `backend/appsettings.Example.json` and `backend/.env.example` document deploy-time keys.
- Do not commit `.env`, `.env.local`, `appsettings.Development.json`, `node_modules`, `.next`, `bin`, `obj`, logs, or local agent folders.
