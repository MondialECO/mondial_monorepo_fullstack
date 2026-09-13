# Developer Setup Guide — Mondial ECO

Complete instructions for setting up the Mondial ECO monorepo development environment locally.

---

## Repository Overview

Mondial ECO is organized as a full-stack monorepo:

```
mondial_monorepo_fullstack/
├── src/                  # Next.js 16 / React 19 Frontend
├── backend/              # ASP.NET Core 8 Web API (.NET 8)
├── docs/                 # Documentation (Architecture, Product, Operations, Archive)
├── docker-compose.yml    # Full local container topology
└── docker-compose.prod.yml # Production multi-replica topology
```

---

## System Requirements

- **OS:** macOS 12+, Windows 11 / WSL2, or Linux (Ubuntu 22.04+)
- **Node.js:** 20.x LTS (install from [nodejs.org](https://nodejs.org))
- **.NET SDK:** 8.0 SDK (pinned to 8.x; install from [dot.net](https://dot.net))
- **Docker & Docker Compose:** Docker Desktop or Docker Engine + Compose v2
- **Git:** 2.40+ (install from [git-scm.com](https://git-scm.com))
- **MongoDB Compass** (optional): GUI for MongoDB inspection
- **Redis CLI** (optional): For inspecting Redis caches / locks

---

## Step 1: Clone Monorepo

```bash
git clone https://github.com/MondialECO/mondial_monorepo_fullstack.git
cd mondial_monorepo_fullstack
```

---

## Step 2: Environment Configuration

### Frontend Environment (`.env.local`)

In the monorepo root:

```bash
cp .env.example .env.local
```

Ensure `.env.local` contains:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend Configuration (`backend/appsettings.Development.json`)

If running the backend locally outside Docker, create or verify `backend/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "MongoDb": "mongodb://localhost:27017/mondial_dev",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "SecretKey": "DEVELOPMENT_SUPER_SECRET_KEY_MIN_32_CHARS_LONG!!",
    "Issuer": "mondial.local",
    "Audience": "mondial-app"
  },
  "OpenRouter": {
    "ApiKey": "YOUR_OPENROUTER_DEV_KEY",
    "TimeoutSeconds": 120
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

---

## Step 3: Run Locally (Native Development)

### 3.1 Start Backing Services (MongoDB & Redis)

You can spin up only the databases via Docker:

```bash
# Start MongoDB
docker run -d --name mondial-mongo -p 27017:27017 mongo:latest

# Start Redis
docker run -d --name mondial-redis -p 6379:6379 redis:alpine
```

### 3.2 Start Backend API

```bash
cd backend
dotnet restore
dotnet run
```

Backend will listen on `http://localhost:5000` (or `https://localhost:5001`).

### 3.3 Start Frontend Next.js Server

In another terminal from the repository root:

```bash
npm install
npm run dev
```

Frontend will listen on `http://localhost:3000`.

---

## Step 4: Run via Docker Compose (All-in-One)

To spin up the complete local environment in containers:

```bash
docker-compose up --build -d
```

Services started:
- `frontend`: Next.js web application on port `3000`
- `backend`: ASP.NET Core API on port `5000`
- `redis`: Redis cache & rate-limiting on port `6379`
- `traefik`: Reverse proxy routing traffic

Stop all services with:
```bash
docker-compose down
```

---

## Step 5: Verification & Health Checks

### Frontend Checks
- **App Homepage:** [http://localhost:3000](http://localhost:3000)
- **Login:** [http://localhost:3000/login](http://localhost:3000/login)
- **Onboarding:** [http://localhost:3000/onboarding](http://localhost:3000/onboarding)

### Backend Checks
```bash
# Health Readiness
curl http://localhost:5000/health/ready

# Health Liveness
curl http://localhost:5000/health/live

# Authentication Test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mondial.local","password":"Password123!"}'
```

---

## Testing & Quality Assurance

### Frontend Testing & Linting
```bash
# Type check without emitting
npx tsc --noEmit

# Lint check
npm run lint

# Run unit tests
npm test
```

### Backend Testing
```bash
cd backend
dotnet test
```

---

## Key Architecture References

For detailed system mechanics, consult the canonical documentation:
- **System Architecture:** [docs/system-architecture/MONDIAL-ECO-SYSTEM-DESIGN.md](../system-architecture/MONDIAL-ECO-SYSTEM-DESIGN.md)
- **Technical Architecture:** [docs/system-architecture/MONDIAL-ECO-TECHNICAL-ARCHITECTURE.md](../system-architecture/MONDIAL-ECO-TECHNICAL-ARCHITECTURE.md)
- **API Map:** [docs/system-architecture/05-api-map.md](../system-architecture/05-api-map.md)
- **Source of Truth:** [docs/system-architecture/07-source-of-truth.md](../system-architecture/07-source-of-truth.md)
- **Documentation Authority:** [docs/DOCUMENTATION-AUTHORITY.md](../DOCUMENTATION-AUTHORITY.md)
