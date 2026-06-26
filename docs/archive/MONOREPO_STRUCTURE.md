# Monorepo Structure Guide

**Location:** `C:\devs\Mondial`

Your full-stack application is now organized in a single monorepo directory for seamless development.

---

## Directory Layout

```
Mondial/
├── frontend/                  # Next.js 16 + React 19 (SPA)
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/        # React components
│   │   ├── lib/              # Utilities, axios, roles
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript interfaces
│   │   └── styles/           # Global styles
│   ├── public/               # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── .env.example
│   ├── .env.local            # ← Create this locally
│   ├── CLAUDE.md             # Frontend conventions (Next.js specific)
│   └── README.md
│
├── backend/                   # ASP.NET Core 8 (REST API)
│   ├── Controllers/          # API endpoints
│   ├── Models/               # Data models
│   ├── Services/             # Business logic
│   ├── DbContext/            # Entity Framework Core
│   ├── Middleware/           # Custom middleware
│   ├── Configuration/        # App configuration
│   ├── Program.cs            # App entry point & DI setup
│   ├── WebApp.csproj         # Project file
│   ├── .env.example
│   ├── .env                  # ← Create this locally
│   ├── Dockerfile            # Docker build config
│   ├── DEPLOYMENT.md         # Deployment guide
│   ├── OPERATIONS.md         # Monitoring & ops
│   ├── LAUNCH.md             # Launch checklist
│   └── README.md             # Backend docs
│
├── docs/                      # Shared documentation
│   ├── AUDIT.md              # Full system audit (50% complete features)
│   ├── FEATURE_COMPLETION.md # What's built vs incomplete
│   ├── LAUNCH_READY.md       # MVP launch status (✓ ready)
│   ├── PERFORMANCE_FIXES.md  # Optimizations completed
│   ├── MVP_STATUS.md         # Completion tracking
│   └── (other audit files)
│
├── .gitignore                # Git ignore rules (monorepo)
├── README.md                 # Main monorepo guide (START HERE)
├── SETUP.md                  # Step-by-step setup instructions
├── MONOREPO_STRUCTURE.md     # This file
└── .git/                     # Git repository (shared)
```

---

## Key Files Location Quick Reference

| What | Where | Notes |
|------|-------|-------|
| **Frontend** | `frontend/src/` | Next.js App Router |
| **Backend** | `backend/Controllers/` | ASP.NET REST endpoints |
| **Database Models** | `backend/Models/` | User, Project, Investment, etc. |
| **API Logic** | `backend/Services/` | Business logic layer |
| **Frontend Config** | `frontend/next.config.ts` | Next.js settings |
| **Backend Config** | `backend/Program.cs` | Startup config, DI, middleware |
| **Frontend Env Vars** | `frontend/.env.local` | Create locally (not in git) |
| **Backend Env Vars** | `backend/.env` | Create locally (not in git) |
| **Docs** | `docs/` | All audit & status reports |
| **Frontend Conventions** | `frontend/CLAUDE.md` | Code style, best practices |
| **Backend Docs** | `backend/README.md` | Architecture, endpoints |

---

## Git Setup (One-Time)

Both frontend and backend share the same Git repository:

```bash
cd C:\devs\Mondial

# View remote
git remote -v

# All commits include both frontend and backend changes
git log --oneline | head -10

# Status shows both
git status

# Push/pull affects entire monorepo
git push origin main
git pull origin main
```

---

## Development Workflow

### Start Development (Two Terminals)

**Terminal 1 — Frontend:**
```bash
cd C:\devs\Mondial\frontend
npm run dev
# Opens http://localhost:3000
```

**Terminal 2 — Backend:**
```bash
cd C:\devs\Mondial\backend
dotnet watch run
# Opens http://localhost:5000
```

### Making Changes

#### Frontend Change Example
```bash
# Edit a component
nano C:\devs\Mondial\frontend\src\components\homepage\HeroSection.tsx

# Auto-reloads in browser
# Stage and commit
git add frontend/
git commit -m "feat: update hero section colors"
```

#### Backend Change Example
```bash
# Edit a controller
nano C:\devs\Mondial\backend\Controllers\AuthController.cs

# Auto-compiles (dotnet watch)
# Stage and commit
git add backend/
git commit -m "feat: add email verification endpoint"
```

#### Both Frontend & Backend Change
```bash
# Edit frontend component
nano C:\devs\Mondial\frontend\src/app/login/page.tsx

# Edit backend endpoint
nano C:\devs\Mondial\backend\Controllers\AuthController.cs

# Stage both
git add frontend/ backend/
git commit -m "feat: implement login with email verification"
git push origin main
```

---

## Navigation Shortcuts

### Open Frontend
```bash
code C:\devs\Mondial\frontend    # VS Code
# or
start C:\devs\Mondial\frontend   # File Explorer
```

### Open Backend
```bash
explorer C:\devs\Mondial\backend
# or for Visual Studio
cd C:\devs\Mondial\backend && start WebApp.sln
```

### View Docs
```bash
code C:\devs\Mondial\docs
# or just read them in your editor
```

### Open Monorepo Root
```bash
code C:\devs\Mondial             # Opens entire monorepo
```

---

## Important: Environment Variables

### Frontend (`C:\devs\Mondial\frontend\.env.local`)
```env
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Required before `npm run dev` works.**

### Backend (`C:\devs\Mondial\backend\.env`)
```env
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=localhost,1433;Database=Mondial;User Id=sa;Password=MyPassword123;TrustServerCertificate=true;
JWT_SECRET=dev-secret-key-change-in-production
CORS_AllowedOrigins=http://localhost:3000
```

**Required before `dotnet run` works.**

---

## What Moved From Original Locations

| Original | New Location | Note |
|----------|--------------|------|
| `C:\devs\Mondial.Client` | `C:\devs\Mondial\frontend` | Frontend only |
| `C:\devs\backend` | `C:\devs\Mondial\backend` | Backend only |
| `C:\devs\Mondial.Client\docs` | `C:\devs\Mondial\docs` | Shared docs |

**Old directories still exist** — you can delete them once you've verified everything works in the new location:
```bash
# After verifying the monorepo works:
rm -rf C:\devs\Mondial.Client
rm -rf C:\devs\backend
```

---

## First-Time Setup

1. **Read:** `README.md` (overview)
2. **Follow:** `SETUP.md` (step-by-step instructions)
3. **Check:** `frontend/.env.local` and `backend/.env` created
4. **Run:** Frontend and backend in separate terminals
5. **Verify:** Both start without errors
6. **Explore:** Frontend at http://localhost:3000, backend at http://localhost:5000
7. **Check status:** Read `docs/FEATURE_COMPLETION.md`

---

## Project Status at a Glance

| Component | Status | Location |
|-----------|--------|----------|
| **Frontend** | ✅ MVP-ready | `frontend/` |
| **Backend** | ⚠️ Core endpoints ready | `backend/` |
| **Homepage** | ✅ Complete | `frontend/src/app/page.tsx` |
| **Auth Flow** | ✅ Complete | `frontend/src/app/(auth)/` |
| **Creator Dashboard** | ✅ Complete | `frontend/src/app/dashboard/creator/` |
| **Investor Dashboard** | ✅ Complete | `frontend/src/app/dashboard/investor/` |
| **Entrepreneur Onboarding** | ⚠️ Partial | `frontend/src/app/dashboard/entrepreneur/` |
| **API Endpoints** | ⚠️ Partial | `backend/Controllers/` |

See `docs/FEATURE_COMPLETION.md` for full details.

---

## Useful Commands

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Production build
npm run lint            # ESLint
npm run lint -- --fix   # Auto-fix lint errors
```

### Backend
```bash
cd backend
dotnet restore          # Restore NuGet packages
dotnet build            # Compile
dotnet run              # Run app
dotnet watch run        # Auto-reload on changes
dotnet test             # Run tests
dotnet ef migrations add MigrationName  # Create migration
dotnet ef database update               # Apply migrations
```

### Git (from monorepo root)
```bash
cd C:\devs\Mondial
git status              # See changes in both frontend & backend
git add .               # Stage all changes
git commit -m "msg"     # Commit with message
git push origin main    # Push to remote
git pull origin main    # Pull latest
```

---

## Next Steps

- [ ] Read `README.md` for overview
- [ ] Follow `SETUP.md` to set up locally
- [ ] Run both frontend and backend
- [ ] Verify `docs/LAUNCH_READY.md` status
- [ ] Start making changes from a single directory!

**You're now ready to develop full-stack from `C:\devs\Mondial` 🎉**
