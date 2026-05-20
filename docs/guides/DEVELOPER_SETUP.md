# Developer Setup Guide

Complete instructions for setting up the Mondial development environment locally.

## System Requirements

- **OS:** macOS 12+, Windows 11, or Linux (Ubuntu 20.04+)
- **Node.js:** 18.x or 20.x (install from https://nodejs.org)
- **Docker:** For running backend locally (install from https://docker.com)
- **Git:** For version control (install from https://git-scm.com)
- **MongoDB Compass** (optional): GUI for MongoDB inspection
- **Postman** (optional): For API testing

---

## Step 1: Clone Repositories

### Frontend

```bash
cd ~/projects  # or your preferred directory
git clone https://github.com/MondialECO/Mondial.Client.git
cd Mondial.Client
```

### Backend (optional, if developing API features)

```bash
cd ~/projects
git clone https://github.com/MondialECO/Mondial.git
cd Mondial
```

---

## Step 2: Frontend Setup

### Install Dependencies

```bash
cd ~/projects/Mondial.Client
npm install
```

**Expected output:**
```
added 250+ packages in 45s
```

If you see warnings like `WARN deprecated`, that's normal. If you see `npm ERR!`, check your Node.js version:

```bash
node --version   # Should be v18.x or v20.x
npm --version    # Should be v9.x or v10.x
```

### Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Authentication
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_SENTRY_DSN=<ask team for this>
```

**Note:** Never commit `.env.local` to git (already in `.gitignore`)

### Verify Build

```bash
npm run build
```

**Expected output:**
```
✓ compiled successfully
```

If you see TypeScript errors, run:

```bash
npm run lint
# Fix errors with:
npm run lint -- --fix
```

---

## Step 3: Backend Setup (Optional)

### Prerequisites

Install .NET 8.0 SDK:
```bash
# macOS
brew install dotnet

# Windows (via chocolatey)
choco install dotnet-sdk

# Linux
curl https://dot.net/v1/dotnet-install.sh -O
sudo bash dotnet-install.sh --channel 8.0
```

### Setup

```bash
cd ~/projects/Mondial
dotnet restore
```

### Environment Variables

Create `appsettings.Development.json`:

```json
{
  "MongoDb": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "mondial_dev"
  },
  "Jwt": {
    "SecretKey": "your-super-secret-key-min-32-chars-long",
    "Issuer": "mondial.local",
    "Audience": "mondial-app"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}
```

### Run MongoDB (via Docker)

```bash
docker run -d \
  --name mondial-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

Verify connection:
```bash
docker exec mondial-mongo mongosh \
  -u admin -p password \
  --eval "db.version()"
```

### Start Backend

```bash
cd ~/projects/Mondial
dotnet run
```

**Expected output:**
```
info: Microsoft.Hosting.Lifetime
      Listening on http://localhost:5000
```

---

## Step 4: Start Frontend Dev Server

```bash
cd ~/projects/Mondial.Client
npm run dev
```

**Expected output:**
```
> next dev
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local
```

Open http://localhost:3000 in your browser.

---

## Step 5: Verify Setup

### Frontend Checks

1. **Homepage loads:** http://localhost:3000
   - See Mondial logo, navigation, hero section
   - No console errors (press F12 → Console tab)

2. **Login page loads:** http://localhost:3000/login
   - Email input, password input, submit button visible
   - No styling issues (check DevTools)

3. **Sign up flow:** http://localhost:3000/signup
   - Role selection: Founder, Advisor, Investor, Admin
   - Email validation working

### Backend Checks

```bash
# Health check
curl http://localhost:5000/health
# Should return: { "status": "Healthy" }

# Login test
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mondial.local","password":"password123"}'
# Should return JWT token
```

### Database Checks

```bash
# Connect to MongoDB
docker exec -it mondial-mongo mongosh -u admin -p password

# Inside mongosh shell:
show databases
use mondial_dev
show collections
db.users.findOne()
```

---

## Development Workflow

### Daily Startup

```bash
# Terminal 1 (Backend)
cd ~/projects/Mondial
dotnet run

# Terminal 2 (Frontend)
cd ~/projects/Mondial.Client
npm run dev

# Terminal 3 (MongoDB, if not using Docker Desktop)
docker start mondial-mongo
```

### File Changes

**Frontend:** Changes auto-reload (Fast Refresh enabled)
**Backend:** Changes require restart (press Ctrl+C, then `dotnet run`)

### Creating New Components

```bash
# shadcn/ui component (button, input, modal, etc.)
npx shadcn@latest add <component>

# Custom component (reusable logic)
touch src/components/features/NewFeature.tsx

# Hook (state/effects logic)
touch src/hooks/useNewFeature.ts

# Page (route)
mkdir -p src/app/dashboard/new-page
touch src/app/dashboard/new-page/page.tsx
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/phase-9-implementation

# Make changes...

# Stage changes
git add src/app/dashboard/entrepreneur/phase-9/

# Commit with message
git commit -m "feat: implement Phase 9 deal execution UI"

# Push branch
git push origin feature/phase-9-implementation

# Open pull request on GitHub
# - Title: "Phase 9 UI Implementation"
# - Description: What changed and why
# - Link to Linear ticket (if applicable)
```

---

## Testing

### Frontend Unit Tests

```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode (re-run on file changes)
npm run test -- Button   # Run specific test file
```

### Frontend Build & Performance

```bash
npm run build
# Generates .next/ directory (production build)

npm run build -- --debug
# Shows bundle analysis
```

### Backend Tests

```bash
cd ~/projects/Mondial
dotnet test
# Runs all xUnit tests
```

---

## Debugging

### Frontend Debugging

1. **Browser DevTools:**
   - Press F12 (or Cmd+Option+I on Mac)
   - Console tab: See errors and logs
   - Network tab: Inspect API calls
   - Elements tab: Inspect HTML/CSS

2. **VS Code Debugger:**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Next.js",
         "type": "chrome",
         "request": "launch",
         "url": "http://localhost:3000",
         "webRoot": "${workspaceFolder}"
       }
     ]
   }
   ```
   Then press F5 to debug.

3. **Console Logs:**
   ```typescript
   console.log('debug:', value);  // Use console.log liberally
   console.error('error:', error); // For errors
   console.table(array);           // For arrays/objects
   ```

### Backend Debugging

1. **Console Logs:**
   ```csharp
   Logger.LogInformation("Debug: {@Value}", value);
   Logger.LogError(exception, "Error occurred");
   ```

2. **VS/Rider Debugger:**
   - Set breakpoint (click line number)
   - Run with `dotnet run`
   - Execution pauses at breakpoint
   - Inspect variables in Debug panel

---

## Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: `Port 3000 already in use`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### Issue: `MongoClient initialization timeout`

**Solution:**
```bash
# Verify Docker is running
docker ps

# Restart MongoDB
docker stop mondial-mongo
docker start mondial-mongo

# Or rebuild
docker rm mondial-mongo
docker run -d --name mondial-mongo -p 27017:27017 mongo:latest
```

### Issue: API calls failing (CORS error)

**Solution:**
Check that both frontend and backend are running:
```bash
# Test backend health
curl http://localhost:5000/health

# Check .env.local has correct API URL
cat .env.local | grep NEXT_PUBLIC_API_URL
```

### Issue: TypeScript type errors

**Solution:**
```bash
npm run lint
npm run lint -- --fix  # Auto-fix where possible
```

---

## Code Quality

### ESLint (Linting)

```bash
npm run lint              # Check errors
npm run lint -- --fix    # Auto-fix
```

### TypeScript (Type Checking)

```bash
npx tsc --noEmit   # Check types without compiling
```

### Formatting (Prettier - optional)

```bash
npx prettier --write src/   # Format all files
```

---

## Performance Profiling

### Frontend Bundle Analysis

```bash
npm run build -- --analyze
```

Opens a visual breakdown of bundle size by package.

### Frontend Runtime Performance

1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click record circle
4. Interact with page
5. Click stop
6. Analyze timeline

---

## Architecture Overview (Local)

```
http://localhost:3000 (Frontend)
        ↓ (HTTP API calls)
http://localhost:5000 (Backend API)
        ↓ (Database queries)
mongodb://localhost:27017 (MongoDB)
```

All three must be running for full functionality.

---

## IDE Setup (VS Code)

### Recommended Extensions

1. **ES7+ React/Redux/React-Native snippets**
   - `dsznajder.es7-react-js-snippets`

2. **Prettier - Code formatter**
   - `esbenp.prettier-vscode`

3. **ESLint**
   - `dbaeumer.vscode-eslint`

4. **Thunder Client** (API testing)
   - `rangav.vscode-thunder-client`

5. **MongoDB for VS Code**
   - `mongodb.mongodb-vscode`

### Settings (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript", "typescript"],
  "eslint.format.enable": true
}
```

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (frontend) |
| `npm run build` | Production build (frontend) |
| `npm run lint` | Check code quality |
| `npm run test` | Run unit tests |
| `dotnet run` | Start dev server (backend) |
| `dotnet test` | Run backend tests |
| `git log --oneline` | View recent commits |
| `git status` | Check changed files |

---

## Getting Help

- **Team:** Slack #dev-help channel
- **Docs:** This folder (`docs/`)
- **Issues:** Linear (track bugs/features)
- **Code Reviews:** Pull requests on GitHub

---

## First-Time Developer Checklist

- [ ] Cloned both repositories (Mondial.Client and Mondial)
- [ ] Installed Node.js 18+ and .NET 8.0 SDK
- [ ] Ran `npm install` and `dotnet restore`
- [ ] Created `.env.local` with API URL
- [ ] Started MongoDB via Docker
- [ ] Started backend (`dotnet run`)
- [ ] Started frontend (`npm run dev`)
- [ ] Verified homepage loads at http://localhost:3000
- [ ] Verified API responds at http://localhost:5000/health
- [ ] Verified database connection
- [ ] Created feature branch for first task
- [ ] Assigned yourself to a Linear ticket

---

**Welcome to Mondial! 🚀**
