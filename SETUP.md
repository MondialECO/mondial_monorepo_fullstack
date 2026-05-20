# Monorepo Setup Guide

This guide walks you through setting up the Mondial monorepo locally.

## Prerequisites

### System Requirements
- Windows 10/11 or macOS/Linux
- 8GB RAM minimum (16GB recommended)
- 10GB free disk space

### Required Software
1. **Node.js & npm**
   - Download: https://nodejs.org/ (v18+)
   - Verify: `node --version` && `npm --version`

2. **.NET 8 SDK**
   - Download: https://dotnet.microsoft.com/download/dotnet/8.0
   - Verify: `dotnet --version`

3. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

4. **SQL Server** (for backend)
   - Option A: Docker (easiest)
   - Option B: SQL Server Express (local install)
   - Option C: Cloud database (Azure SQL, AWS RDS, etc.)

5. **Code Editor** (pick one)
   - VS Code (free) — great for both frontend and backend
   - Visual Studio Community (free) — best for .NET backend
   - JetBrains Rider (paid) — excellent for full-stack

---

## Step 1: Clone Repository (if needed)

If you haven't already, clone the monorepo:

```bash
cd C:\devs
git clone <repo-url> Mondial
# or if already cloned:
cd Mondial
git pull origin main
```

---

## Step 2: Set Up SQL Server (Backend Dependency)

### Option A: Docker (Recommended for Windows)

```bash
# Install Docker Desktop: https://www.docker.com/products/docker-desktop

# Start SQL Server container
docker run -e ACCEPT_EULA=Y -e SA_PASSWORD=MyPassword123 \
  -p 1433:1433 \
  -d \
  mcr.microsoft.com/mssql/server:2022-latest

# Verify it's running
docker ps  # Should show the container running
```

### Option B: SQL Server Express (Local Install)

Download from: https://www.microsoft.com/en-us/sql-server/sql-server-express

During installation:
- Authentication mode: **SQL Server and Windows Authentication**
- Default credentials: `sa` / (your password)

---

## Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF

# Verify setup
npm run lint
npm run build
```

If successful, you'll see: `✓ Built in 45s` (or similar).

---

## Step 4: Backend Setup

```bash
cd backend

# Restore NuGet packages
dotnet restore

# Create environment file
cat > .env << EOF
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=localhost,1433;Database=Mondial;User Id=sa;Password=MyPassword123;TrustServerCertificate=true;
JWT_SECRET=your-dev-secret-key-change-in-production
CORS_AllowedOrigins=http://localhost:3000
EOF

# Update database (create tables)
dotnet ef database update

# Verify setup
dotnet build
```

If successful, you'll see: `Build succeeded.` (or similar).

---

## Step 5: Start Development Servers

### Terminal 1 — Frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
> next dev
  ▲ Next.js 16.1.7
  - Local:        http://localhost:3000
  - Environments: .env.local
```

Open http://localhost:3000 in your browser.

### Terminal 2 — Backend

```bash
cd backend
dotnet watch run
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
```

---

## Step 6: Verify Full-Stack Setup

1. **Frontend loads:** http://localhost:3000
2. **Login page works:** http://localhost:3000/login
3. **Backend API responds:** 
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"healthy"}`

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find what's using it (on Windows)
netstat -ano | findstr :3000

# Kill the process or use different port
# Change in: frontend/next.config.ts
```

### "Cannot connect to SQL Server"
- Verify Docker container is running: `docker ps`
- Check connection string matches your setup
- Try connecting with: `sqlcmd -S localhost,1433 -U sa -P MyPassword123`

### "ESLint errors on startup"
```bash
cd frontend
npm run lint -- --fix  # Auto-fix errors
```

### ".NET build fails"
```bash
cd backend
dotnet clean
dotnet restore
dotnet build
```

### "npm install hangs"
```bash
cd frontend
npm cache clean --force
npm install
```

---

## Environment Variables Checklist

### Frontend (`frontend/.env.local`)
- [ ] `NEXT_PUBLIC_DEV_MODE=false`
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:5000`

### Backend (`backend/.env`)
- [ ] `ASPNETCORE_ENVIRONMENT=Development`
- [ ] `ConnectionStrings__DefaultConnection=...` (matches your SQL Server)
- [ ] `JWT_SECRET=dev-key-here`
- [ ] `CORS_AllowedOrigins=http://localhost:3000`

---

## Next Steps

Once everything is running:

1. **Explore the app:**
   - Homepage: http://localhost:3000
   - Login: http://localhost:3000/login
   - Creator dashboard: http://localhost:3000/dashboard/creator (after login)

2. **Make your first change:**
   - Edit `frontend/src/app/page.tsx`
   - Save → see it reload in browser instantly

3. **Read the docs:**
   - `frontend/CLAUDE.md` — Frontend conventions
   - `backend/README.md` — Backend architecture
   - `docs/` — Project status & features

4. **Start developing:**
   - Create a feature branch: `git checkout -b feature/your-feature`
   - Push commits regularly
   - Create pull requests for review

---

## Daily Workflow

```bash
# Start of day
git pull origin main

# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
dotnet watch run

# Make changes, both auto-reload
# ...

# Before commit
cd frontend && npm run lint -- --fix
cd backend && dotnet build

# Commit
git add .
git commit -m "feat: your change"
git push origin feature/your-feature
```

---

## Getting Help

- **Frontend issues:** Check `frontend/README.md` or `frontend/CLAUDE.md`
- **Backend issues:** Check `backend/README.md`
- **Monorepo issues:** This file or `README.md`
- **Feature status:** See `docs/FEATURE_COMPLETION.md`
- **Recent changes:** See `docs/PERFORMANCE_FIXES.md`, `docs/AUDIT.md`
