# Documentation Index

Essential guides for Mondial development and testing.

## 🚀 Quick Start

1. **[../SETUP.md](../SETUP.md)** — Environment setup (5 minutes)
2. **[CONFIGURATION.md](CONFIGURATION.md)** — Config settings (read first)
3. **[LOCAL_AUTH_TEST.md](LOCAL_AUTH_TEST.md)** — Run auth test (30 minutes)
4. **[../README.md](../README.md)** — Project overview

## ⚙️ Configuration

- **[CONFIGURATION.md](CONFIGURATION.md)** — All settings reference
  - MongoDB, JWT, Email SMTP, Redis, CORS
  - Environment variables & validation
  - Production deployment checklist

## 🔐 Authentication

- **[LOCAL_AUTH_TEST.md](LOCAL_AUTH_TEST.md)** — Complete 30-min testing guide
  - Register, login, email confirmation, protected routes, logout
  - Includes troubleshooting & success criteria

## 📁 Backend Documentation

- **[../backend/README.md](../backend/README.md)** — API endpoints & architecture
- **[../backend/DEPLOYMENT.md](../backend/DEPLOYMENT.md)** — Deployment guide
- **[../backend/OPERATIONS.md](../backend/OPERATIONS.md)** — Monitoring & ops

## 🖥️ Frontend Documentation

- **[../frontend/CLAUDE.md](../frontend/CLAUDE.md)** — Code conventions & patterns

## 📊 Structure

```
Mondial/
├── frontend/              Next.js 16 + React 19
├── backend/               ASP.NET Core 8
├── docs/                  This directory
├── README.md              Monorepo overview
└── SETUP.md               Setup instructions
```

## ✅ Pre-Launch Checklist

- [ ] .NET 8 SDK installed
- [ ] Environment variables configured
- [ ] Backend starts: `dotnet watch run`
- [ ] Frontend starts: `npm run dev`
- [ ] Complete LOCAL_AUTH_TEST.md
- [ ] All tests pass
- [ ] No console errors (F12)

## 🎯 Timeline

- **May 20:** Infrastructure ready ✅
- **May 21:** Final testing
- **May 22:** MVP Launch 🚀
