# Deployment Runbook — Mondial

Step-by-step procedures for deploying to staging and production environments.

## Prerequisites

- GitHub account with push access to `MondialECO/Mondial.Client` and `MondialECO/Mondial` repositories
- SSH access to staging and production servers
- Slack channel for deployment notifications
- Environment variables configured in GitHub Secrets (see CI-CD-SETUP.md)

## Staging Deployment

**Automatic:** Staging deploys automatically after successful CI/CD on the `main` branch.

**Manual trigger (if needed):**
```bash
git checkout main
git pull origin main
gh workflow run frontend-deploy.yml -f environment=staging
```

**Verify:** Check Slack for deployment notification. Test at `https://staging.mondial.eco`

## Production Deployment

**Always manual** — requires explicit approval.

### Pre-deployment Checklist

- [ ] All tests pass on `main` branch (check GitHub Actions)
- [ ] Code review completed and approved
- [ ] Changelog updated with version number and release notes
- [ ] Database migrations tested on staging
- [ ] API endpoints verified against ENDPOINTS.md
- [ ] Performance metrics acceptable (LCP <2.5s, INP <100ms, CLS <0.1)
- [ ] No critical bugs open in Linear

### Step 1: Frontend Deployment

```bash
# Trigger deployment
gh workflow run frontend-deploy.yml -f environment=production

# Or via GitHub UI:
# 1. Go to Actions → frontend-deploy workflow
# 2. Click "Run workflow" → Select branch: main → Click "Run"
```

**Verification:**
```bash
# SSH into production server
ssh deploy@prod.mondial.eco

# Check running container
docker ps | grep mondial-frontend

# View logs
docker logs -f <container-id>

# Test endpoint
curl https://mondial.eco/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-21T10:30:00Z",
  "version": "1.0.0"
}
```

### Step 2: Backend Deployment

```bash
# Trigger deployment
gh workflow run backend-deploy.yml -f environment=production

# Or via GitHub UI
```

**Verification:**
```bash
# SSH into production server
ssh deploy@prod.mondial.eco

# Check running container
docker ps | grep mondial-backend

# View logs
docker logs -f <container-id>

# Test API
curl -X GET https://api.mondial.eco/health
```

Expected response:
```json
{
  "status": "Healthy",
  "checks": {
    "database": "Connected",
    "cache": "Connected"
  }
}
```

### Step 3: Post-Deployment Verification

Run smoke tests:
```bash
# Login test
curl -X POST https://api.mondial.eco/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mondial.eco","password":"password"}'

# Entrepreneur endpoint
curl -X GET https://api.mondial.eco/companies/1/current-phase \
  -H "Authorization: Bearer <token>"
```

Monitor for 10 minutes:
- No spike in error rate (CloudWatch or Datadog)
- Response time within baseline ±10%
- No database connection issues
- Slack channel clean (no error notifications)

## Rollback Procedure

If production deployment fails or critical bugs are discovered:

### Frontend Rollback

```bash
# Check recent deployments
ssh deploy@prod.mondial.eco
docker images | grep mondial-frontend | head -10

# Revert to previous image
docker stop <current-container>
docker run -d --name mondial-frontend-old \
  -p 3000:3000 \
  mondial-frontend:<previous-tag>

# Verify
curl https://mondial.eco
```

### Backend Rollback

```bash
ssh deploy@prod.mondial.eco
docker images | grep mondial-backend | head -10

docker stop <current-container>
docker run -d --name mondial-backend-old \
  -p 5000:5000 \
  mondial-backend:<previous-tag>

# Verify
curl https://api.mondial.eco/health
```

### Post-Rollback

1. **Notify team:** Post in Slack #deployments channel
2. **File incident:** Create Linear ticket documenting the issue
3. **Root cause analysis:** Meeting to discuss what went wrong
4. **Fix & retry:** Address the issue, re-test, re-deploy

## Common Issues & Fixes

### Frontend Won't Start

**Symptom:** `Error: ENOENT: no such file or directory`

**Fix:**
```bash
ssh deploy@prod.mondial.eco
docker logs -f <container>
# Look for missing env vars

# Update environment
docker exec <container> printenv | grep NEXT_PUBLIC_API_URL

# If missing, redeploy with correct secrets
gh workflow run frontend-deploy.yml -f environment=production
```

### Backend DB Connection Timeout

**Symptom:** `MongoClient initialization timeout after 30000ms`

**Fix:**
```bash
# Check MongoDB server
ssh deploy@prod.mondial.eco
nc -zv mongodb.prod.internal 27017

# If unreachable, check network
sudo ufw status
sudo iptables -L | grep 27017

# Restart MongoDB if needed
docker restart mongodb-container
```

### High API Latency After Deploy

**Symptom:** Requests taking >2s, CloudWatch shows CPU spike

**Fix:**
```bash
# Check resource usage
docker stats mondial-backend

# If CPU >80%, rebuild image (may be caching issue)
gh workflow run backend-ci.yml --ref main

# Then re-deploy once CI passes
gh workflow run backend-deploy.yml -f environment=production
```

## Monitoring Post-Deployment

### Key Metrics to Watch (First 24h)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | >1% | Investigate logs, consider rollback |
| P95 Latency | >2s | Check database, consider scaling |
| Database Connections | >80% | Scale connection pool or database |
| Memory Usage | >85% | Restart containers or scale pods |

### Access Dashboards

- **Frontend Performance:** https://vercel.com/dashboard/mondial
- **Backend Monitoring:** https://datadog.com (or internal monitoring tool)
- **Database:** MongoDB Atlas dashboard at mongodb.com

## Emergency Contacts

- **On-Call Engineer:** Slack channel #oncall
- **DevOps Lead:** @devops-team
- **Product Manager:** @pm-team
- **Customer Support Lead:** @support-team

## Deployment Log Template

Keep a record after each production deployment:

```
Date: 2026-05-21
Deployer: Masud Reza
Version: 1.5.0

Frontend Changes:
- Fixed Phase 5 advisor matching UI
- Performance: bundle size -3.2KB

Backend Changes:
- Added investor matching job scheduling
- DB migration: companies → add ai_review_status

Tests Passed: ✅ All (123 frontend, 45 backend)
Smoke Tests: ✅ All passing
Issues: None
Rollback Needed: No
```
