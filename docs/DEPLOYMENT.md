# Deployment Guide

Deploy to production: Frontend on Vercel, Backend on AWS EC2.

## FRONTEND (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL=https://api.mondial.eco`
4. Deploy

## BACKEND (AWS EC2)

1. Create EC2 instance (t3.medium)
2. Install .NET 8 and Docker
3. Build release build:
   ```bash
   dotnet publish -c Release
   ```
4. Setup systemd service
5. Configure Nginx reverse proxy with SSL
6. Start service

## DATABASE

MongoDB Atlas (production):
- Create cluster
- Add whitelist IP
- Setup connection string

## CI/CD

GitHub Actions:
- Lint + build on every push
- Run tests
- Deploy to Vercel/EC2 on main merge

See `.github/workflows/deploy.yml`

## MONITORING

- CloudWatch logs
- Health checks: `/health` endpoint
- Error tracking: Sentry (optional)

See full guide in monorepo docs.
