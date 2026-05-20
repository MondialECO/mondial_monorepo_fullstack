# Configuration Guide

**Date:** 2026-05-20  
**Status:** ✅ Configured and Ready

---

## Overview

Mondial uses environment-based configuration for all services (database, email, JWT, etc.). Configuration is read from `.env` files (development) and environment variables (production).

---

## Backend Configuration

### File Location
```
backend/.env
```

### Required Settings

#### Database (MongoDB)
```env
MongoDbSettings__ConnectionString=mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/
MongoDbSettings__DatabaseName=MondialEcoDev
```

**Details:**
- Connection string includes credentials
- Database name must match MongoDB instance
- Must be set before startup (validation fails if missing)

#### JWT (Authentication)
```env
JwtSettings__Issuer=mondialbusiness.eu
JwtSettings__Audience=mondialbusiness.eu
JwtSettings__Key=SuperSecretKey1234567890@mondialbusiness.eu
JwtSettings__ExpiryHours=8
```

**Details:**
- **Key:** Must be at least 32 bytes (256-bit) for HMAC-SHA256
- **Issuer/Audience:** Should match your domain
- **ExpiryHours:** How long tokens remain valid (default: 8 hours)
- Must be set before startup (validation fails if missing)

#### Email (SMTP)
```env
EmailSettings__SmtpServer=smtp.zoho.com
EmailSettings__Port=587
EmailSettings__Email=info@mondialbusiness.eu
EmailSettings__Password=Sirajul700.23#
```

**Details:**
- Using Zoho Mail SMTP
- Port 587 = TLS encryption
- Email must be valid sender address
- Must be set before startup (validation fails if missing)

#### Redis (Cache/Sessions)
```env
Redis__Configuration=localhost:6379
Redis__InstanceName=Mondial
```

**Details:**
- Optional for MVP (can use in-memory cache as fallback)
- Used for distributed caching and session management
- Local development uses localhost:6379

#### CORS (Cross-Origin)
```env
Cors__AllowedOrigins__0=http://localhost:3000
Cors__AllowedOrigins__1=https://mondialbusiness.eu
```

**Details:**
- Allows frontend on specified origins to access backend
- Index-based array (0, 1, 2, ...)
- Includes both development (localhost) and production domains

#### Additional Settings
```env
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000
BaseUrl=http://localhost:3000
AllowedHosts=*
ConnectionStrings__DefaultConnection=Server=localhost,1433;Database=Mondial;...
```

---

## Frontend Configuration

### File Location
```
frontend/.env.local
```

### Required Settings

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_DEV_MODE=false
```

**Details:**
- `NEXT_PUBLIC_API_URL`: Backend API endpoint
  - Development: `http://localhost:5000/api`
  - Production: `https://api.mondialbusiness.eu/api`
- `NEXT_PUBLIC_DEV_MODE`: Debug mode (false for production)

---

## Environment Variables Priority

Configuration is read in this order (first match wins):

1. **Environment Variables** (shell/system)
2. **.env file** in application root
3. **Defaults in code** (if specified)

### Example
If both environment variable and `.env` file exist:
```bash
# Environment variable (higher priority)
export JwtSettings__Key=EnvVarKey

# .env file (lower priority)
JwtSettings__Key=DotEnvKey

# Result: Uses EnvVarKey
```

---

## Validation

### Backend Startup Validation

The backend validates required configuration at startup:

```csharp
// In StartupConfigValidation.cs
- MongoDbSettings:ConnectionString ✅
- MongoDbSettings:DatabaseName ✅
- JwtSettings:Issuer ✅
- JwtSettings:Audience ✅
- JwtSettings:Key (min 32 bytes) ✅
- EmailSettings:SmtpServer ✅
- EmailSettings:Email ✅
- EmailSettings:Password ✅
```

**If validation fails:**
- Application refuses to start
- Error message lists missing settings
- Check `.env` file or environment variables

### Example Error
```
Application configuration is invalid. Supply these via:
  - Missing required configuration: 'JwtSettings:Key'
  - 'JwtSettings:Key' must be at least 32 bytes (256-bit)
```

---

## Configuration Files Reference

| File | Purpose | Committed to Git |
|------|---------|------------------|
| `backend/.env` | Backend secrets & config | ❌ No (add to .gitignore) |
| `frontend/.env.local` | Frontend config | ❌ No (add to .gitignore) |
| `backend/.env.example` | Example template | ✅ Yes |
| `frontend/.env.example` | Example template | ✅ Yes |

---

## Production Deployment

### Before deploying to production:

1. **Change JWT Secret**
   ```env
   JwtSettings__Key=<generate-strong-32-char-key>
   ```

2. **Update Domains**
   ```env
   JwtSettings__Issuer=mondialbusiness.eu
   JwtSettings__Audience=mondialbusiness.eu
   BaseUrl=https://mondialbusiness.eu
   ```

3. **Update CORS Origins**
   ```env
   Cors__AllowedOrigins__0=https://mondialbusiness.eu
   # Remove localhost entries
   ```

4. **Update API URLs**
   ```env
   # Frontend
   NEXT_PUBLIC_API_URL=https://api.mondialbusiness.eu/api
   ```

5. **Set Environment**
   ```env
   ASPNETCORE_ENVIRONMENT=Production
   ```

6. **Secure Storage**
   - Use cloud provider's secret manager (Azure Key Vault, AWS Secrets Manager, etc.)
   - Never commit `.env` files with secrets
   - Rotate secrets regularly

---

## Troubleshooting

### "Missing required configuration: 'JwtSettings:Key'"
- Check `.env` file exists in `backend/` directory
- Verify `JwtSettings__Key` is set
- Key must be at least 32 characters

### "CORS error: Origin not allowed"
- Backend CORS not configured correctly
- Check `Cors__AllowedOrigins` in `.env`
- Add frontend origin (e.g., `http://localhost:3000`)

### "Email service connection failed"
- Check SMTP credentials in `.env`
- Verify SMTP server is accessible
- Check firewall/network access to `smtp.zoho.com:587`

### "MongoDB connection timeout"
- Check MongoDB connection string format
- Verify network access to MongoDB Atlas
- Check IP whitelist in MongoDB Atlas

---

## Configuration Checklist

### Before Development
- [ ] `.env` file created in `backend/`
- [ ] All required fields filled in
- [ ] MongoDB connection tested
- [ ] SMTP credentials valid
- [ ] JWT key is 32+ bytes
- [ ] Frontend `.env.local` configured

### Before Testing
- [ ] `dotnet watch run` starts without config errors
- [ ] `npm run dev` loads without errors
- [ ] Login endpoint responds
- [ ] Email sending works (check logs)

### Before Production
- [ ] All secrets changed from development values
- [ ] CORS origins updated to production domain
- [ ] Base URL points to production
- [ ] Environment set to Production
- [ ] Secrets stored in secure vault
- [ ] No `.env` files with secrets in repository

---

## Reference

**Config File Path:** `backend/.env`  
**Validation File:** `backend/Configuration/StartupConfigValidation.cs`  
**Email Service:** `backend/Services/Email/EmailBackgroundService.cs`  
**JWT Config:** `backend/Program.cs` (lines 154-181)  
**CORS Config:** `backend/Program.cs` (lines 115-134)

---

**Status:** ✅ Fully Configured and Ready
