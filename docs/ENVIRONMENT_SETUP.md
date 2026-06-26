# Environment Setup Guide

Complete this checklist to get Mondial running locally with all external services.

## Prerequisites
- Node.js 20+
- .NET 8 SDK
- MongoDB 6.0+
- Docker (optional)

## 1. FRONTEND SETUP

```bash
cd frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_API_TIMEOUT=30000
```

Run:
```bash
npm run dev
# Opens http://localhost:3000
```

## 2. BACKEND SETUP

```bash
cd backend
dotnet restore
dotnet build -c Release
```

Create `.env`:
```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__MongoDb=mongodb://localhost:27017/mondial
Jwt__Secret=your-dev-secret-key-here
SendGrid__ApiKey=your-sendgrid-api-key
AWS__AccessKey=your-aws-access-key
AWS__SecretKey=your-aws-secret-key
```

Run:
```bash
dotnet run
# Listens on http://localhost:5000
```

## 3. DATABASE

MongoDB (Docker):
```bash
docker run -d -p 27017:27017 --name mondial-db mongo:6.0
```

Initialize:
```bash
mongosh < ../scripts/01-init-database.mongodb
```

## 4. CREDENTIALS

- **SendGrid**: Sign up at https://sendgrid.com, get API key
- **AWS S3**: Create bucket + IAM user with S3 access
- **MongoDB**: Atlas or local

## 5. VERIFY

1. Frontend: http://localhost:3000 → signup/login
2. Backend: http://localhost:5000/health → 200 OK
3. Create company and navigate phases

Done!
