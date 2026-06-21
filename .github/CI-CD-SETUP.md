# CI/CD Pipeline Setup

This document describes the automated CI/CD pipelines for the Mondial project.

## Overview

The project uses GitHub Actions for continuous integration and deployment across frontend and backend services.

## Workflows

### Frontend CI (`frontend-ci.yml`)
- **Trigger:** Push to main/devreza, PR to main
- **Jobs:**
  1. **Lint and Test**
    - Node.js 18.x and 20.x
    - Runs ESLint
    - Builds Next.js application
  2. **Tests**
    - Runs Vitest suite
    - Uploads coverage to Codecov
  3. **Security Audit**
    - Runs npm audit for production dependencies

### Backend CI (`backend-ci.yml`)
- **Trigger:** Push to main/devreza, PR to main
- **Jobs:**
  1. **Build and Test**
    - .NET 8.0
    - Builds WebApp.csproj
    - Runs xUnit tests
    - Uploads test results
  2. **Code Quality**
    - StyleCop analysis
    - Dependency vulnerability checks

### Frontend Deploy (`frontend-deploy.yml`)
- **Trigger:** On workflow_dispatch (manual) or after Frontend CI success on main
- **Environments:**
  - Staging: Auto-deploy on main push
  - Production: Manual trigger only
- **Actions:**
  - Build Next.js app with environment variables
  - Deploy to Vercel/hosting platform
  - Notify Slack channel

### Backend Deploy (`backend-deploy.yml`)
- **Trigger:** On workflow_dispatch (manual) or after Backend CI success on main
- **Environments:**
  - Staging: Auto-deploy on main push
  - Production: Manual trigger only
- **Actions:**
  - Build .NET application
  - Publish release artifacts
  - Deploy to server
  - Notify Slack channel

## Required Secrets

Add these secrets to your GitHub repository settings:

### Deployment
- `VERCEL_TOKEN` - Vercel authentication token (for Next.js hosting)
- `SSH_PRIVATE_KEY` - SSH key for server deployments
- `DEPLOY_USER` - SSH username for deployments
- `DEPLOY_SERVER_STAGING` - Staging server address
- `DEPLOY_SERVER_PROD` - Production server address

### Notifications
- `SLACK_WEBHOOK_URL` - Slack webhook for deployment notifications

## Configuration Steps

### 1. GitHub Repository Setup
```bash
# Add secrets via GitHub UI or CLI
gh secret set VERCEL_TOKEN --body "your-token"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/..."
```

### 2. Environment Configuration
Set environment variables in each GitHub environment:

**Staging:**
- `NEXT_PUBLIC_API_URL=https://api-staging.mondialbusiness.eu`
- `DATABASE_URL=staging-db-connection-string`

**Production:**
- `NEXT_PUBLIC_API_URL=https://api.mondialbusiness.eu`
- `DATABASE_URL=prod-db-connection-string`

### 3. Branch Protection Rules
Configure main branch:
- Require status checks to pass
- Require branches to be up to date before merging
- Dismiss stale PR approvals
- Require code review from code owners

### 4. Slack Integration
Create webhook in Slack:
1. Go to Slack App Directory
2. Search for "Incoming Webhooks"
3. Configure for your channel
4. Copy webhook URL to GitHub secrets

## Manual Deployment

### Deploy to Staging
```bash
gh workflow run frontend-deploy.yml -f environment=staging
gh workflow run backend-deploy.yml -f environment=staging
```

### Deploy to Production
```bash
gh workflow run frontend-deploy.yml -f environment=production
gh workflow run backend-deploy.yml -f environment=production
```

## Monitoring

### GitHub Actions Dashboard
- Monitor in Settings > Actions
- View logs and artifacts
- Re-run failed jobs

### Slack Notifications
- Deployment start/success/failure
- Test results summary
- Build status updates

## Troubleshooting

### CI Failures
1. Check GitHub Actions logs
2. Run locally: `npm run lint && npm run build`
3. Review recent code changes
4. Check for missing dependencies

### Deployment Issues
1. Verify secrets are set correctly
2. Check server connectivity
3. Review deployment logs in Actions
4. Verify environment variables

### Coverage Reports
- View on Codecov dashboard
- Track coverage trends over time
- Set minimum coverage threshold

## Future Enhancements

- [ ] E2E testing with Playwright/Cypress
- [ ] Performance benchmarking
- [ ] Database migration validation
- [ ] Blue-green deployment strategy
- [ ] Automated rollback on failure
- [ ] Load testing before production
- [ ] Database backup automation
