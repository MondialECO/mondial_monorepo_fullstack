# Mondial — Unified Monorepo

**Full-stack SaaS platform** connecting creators and investors.

```
Mondial/
├── frontend/          Next.js 16 + React 19 + Tailwind 4
├── backend/           ASP.NET Core 8 + SQL Server
├── docs/              Shared documentation
└── README.md          This file
```

---

## Quick Start

### Prerequisites
- **Frontend:** Node.js 18+, npm/yarn
- **Backend:** .NET 8 SDK, SQL Server (local or Docker)
- **Tools:** Git, VS Code (or Visual Studio for backend)

### Setup

#### 1. Frontend
```bash
cd frontend
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
```

#### 2. Backend
```bash
cd backend
dotnet restore       # Restore NuGet packages
dotnet build         # Build solution
dotnet run           # Start API on http://localhost:5000
```

---

## Project Structure

### Frontend (`frontend/`)
- **Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui
- **State:** Zustand (global), TanStack Query (server), React Context (auth)
- **Key Routes:**
  - `/` — Homepage
  - `/login`, `/signup` — Authentication
  - `/dashboard/creator` — Creator dashboard
  - `/dashboard/investor` — Investor dashboard
  - `/dashboard/entrepreneur/phase-{1-9}` — Onboarding phases

### Backend (`backend/`)
- **Stack:** ASP.NET Core 8, Entity Framework Core, SQL Server
- **Architecture:** Clean Architecture (Controllers → Services → Data)
- **Key Endpoints:**
  - `POST /auth/login` — User authentication
  - `POST /auth/signup` — User registration
  - `GET /creator/dashboard/stats` — Creator stats
  - `GET /investor/portfolio` — Investor investments
  - See `backend/README.md` for full API docs

### Docs (`docs/`)
- `FEATURE_COMPLETION.md` — What's built vs incomplete
- `PERFORMANCE_FIXES.md` — Optimization records
- `LAUNCH_READY.md` — MVP launch checklist
- Other audit & status reports

---

## Development Workflow

### Making Changes

#### Frontend Only
```bash
cd frontend
npm run dev
# Make changes, auto-reload works
npm run lint  # Before commit
```

#### Backend Only
```bash
cd backend
dotnet watch run
# Changes auto-compile and reload
```

#### Both (Full Stack)
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && dotnet watch run

# Both will auto-reload on file changes
```

### Before Committing
```bash
# Frontend
cd frontend
npm run lint     # Fix ESLint errors
npm run build    # Verify build succeeds

# Backend
cd backend
dotnet build     # Verify compilation
dotnet test      # Run tests (if any)
```

---

## Key Configurations

### Frontend Environment
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend Environment
Create `backend/.env`:
```env
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=localhost;Database=Mondial;User Id=sa;Password=YourPassword;TrustServerCertificate=true;
JWT_SECRET=your-secret-key-here
```

---

## Database

### SQL Server Setup (Local)
```bash
# Docker (recommended)
docker run -e ACCEPT_EULA=Y -e SA_PASSWORD=YourPassword -p 1433:1433 mcr.microsoft.com/mssql/server

# Then run migrations
cd backend
dotnet ef database update
```

---

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy `out/` or `.next/` depending on deployment target
```

### Backend (Azure/Docker)
```bash
cd backend
dotnet publish -c Release
# Deploy to Azure App Service or Docker container
```

See `backend/DEPLOYMENT.md` for detailed backend deployment.

---

## API Integration

### Making API Calls from Frontend

All frontend requests go through `frontend/src/lib/axios.ts`:

```typescript
import api from '@/lib/axios';

// Automatic auth header injection + error handling
const response = await api.get('/creator/dashboard/stats');
```

**No need to manage tokens manually** — AuthProvider handles it.

---

## Status

- **Frontend:** ✅ Ready for MVP (50% full features, auth + dashboard + homepage)
- **Backend:** ⚠️ In progress (core endpoints wired, some integrations pending)
- **Launch:** 2026-05-22 (2 days) — soft launch with mock data fallbacks

See `docs/FEATURE_COMPLETION.md` for detailed feature status.

---

## Common Tasks

| Task | Command |
|------|---------|
| Start full stack dev | Run both `npm run dev` and `dotnet watch run` in separate terminals |
| Fix linting errors | `cd frontend && npm run lint -- --fix` |
| See what changed | `git status` |
| Create a feature branch | `git checkout -b feature/your-feature` |
| Update docs after changes | Edit `docs/*.md` |

---

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend connection error
- Ensure SQL Server is running (`docker ps` if using Docker)
- Check connection string in `backend/.env`
- Run `dotnet ef database update` to create tables

### Port conflicts
- Frontend: Change to port 3001 in `frontend/next.config.ts`
- Backend: Change to port 5001 in `backend/Program.cs`

---

## Git Workflow

```bash
# Pull latest
git pull

# Create feature branch
git checkout -b feature/awesome-feature

# Make changes + commit
git add .
git commit -m "feat: add awesome feature"

# Push and create PR
git push origin feature/awesome-feature
```

---

## Support & Docs

- **Frontend:** See `frontend/CLAUDE.md` for conventions
- **Backend:** See `backend/README.md` for architecture
- **Full Audit:** See `docs/AUDIT.md` for complete system assessment

**Launch checklist:** See `docs/LAUNCH_READY.md`
