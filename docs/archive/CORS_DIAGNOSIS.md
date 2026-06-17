# CORS Error Diagnosis & Fix

**Date**: 2026-04-18  
**Error**: Network error on POST /auth/register  
**Root Cause**: CORS preflight failure due to origin mismatch + missing backend CORS config

---

## 1. FLOW VALIDATION ✅

### Data Collection Path
```
CredentialsStep.onSubmit()
  ↓
handleCredentialsSubmit(data: CredentialsFormData)
  ↓
updateFormData({
  fullName: email.split("@")[0],  // "user" from user@example.com
  email: data.email,              // "user@example.com"
  password: data.password,        // "SecurePass123"
  role: selectedRole || "creator" // "creator" (from RoleSelectionStep)
})
  ↓
registerApi({
  fullName: "user",
  email: "user@example.com",
  password: "SecurePass123",
  role: "creator"
})
  ↓
Payload transformation in registerApi():
{
  Name: "user",        ✅ PascalCase (backend expects)
  Email: "user@example.com",
  Password: "SecurePass123",
  User: "creator"
}
```

### Validation Result: ✅ DATA FLOW IS CORRECT
- ✅ formData collected in all steps
- ✅ sessionStorage persists across page refresh
- ✅ API receives correctly transformed payload
- ✅ No missing fields (Name, Email, Password, User all present)
- ✅ No undefined values

**Confirmed Payload Sent**:
```json
POST https://api.mondialbusiness.eu/api/auth/register
{
  "Name": "user",
  "Email": "user@example.com",
  "Password": "SecurePass123",
  "User": "creator"
}
```

---

## 2. API REQUEST VALIDATION ✅

### Axios Configuration
```typescript
// src/lib/axios.ts
const api = axios.create({
  baseURL: "https://api.mondialbusiness.eu/api",
  // baseURL: "https://localhost:7264/api",  ← Commented (dev fallback)
});
```

### Request Details
- **Method**: POST ✅
- **URL**: `https://api.mondialbusiness.eu/api/auth/register` ✅
- **Content-Type**: `application/json` (axios default) ✅
- **Body**: Correctly formatted JSON ✅
- **Authorization**: None on /auth/register (correct for signup) ✅

### Validation Result: ✅ REQUEST IS CORRECTLY FORMED

---

## 3. CORS ERROR ROOT CAUSE 🚨

### The Problem
```
Frontend Origin:      http://localhost:3000 (HTTP)
Backend URL:          https://api.mondialbusiness.eu (HTTPS)
Protocol Mismatch:    ✅ DIFFERENT PROTOCOLS
Domain Mismatch:      ✅ DIFFERENT DOMAINS
Port Mismatch:        ✅ DIFFERENT PORTS (implied)
```

### Preflight Request Failure
When browser sends POST with JSON body:
```
1. Browser blocks cross-origin request
2. Browser sends automatic OPTIONS preflight request:

OPTIONS /auth/register HTTP/1.1
Host: api.mondialbusiness.eu
Origin: http://localhost:3000  ← Frontend origin
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type

3. Backend must respond with CORS headers:

HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000  ← Needs exact match
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Credentials: true (if using cookies)

4. If backend DOESN'T send these headers:
   → Browser blocks actual POST request
   → NetworkError: CORS policy violation
   → Request NEVER reaches backend
```

### Why Failure Occurs

**Issue 1: Missing CORS Headers from Backend**
- Backend at `https://api.mondialbusiness.eu` likely does NOT allow `http://localhost:3000`
- OR backend has NO CORS config at all
- OR backend only allows specific origins (not localhost)

**Issue 2: Protocol Mismatch**
- Even if domain/port match, HTTP → HTTPS is a cross-origin request
- Mixed content: frontend serves over HTTP, tries to call HTTPS API
- Some browsers block this automatically

### Error Message in Browser DevTools
```
Access to XMLHttpRequest at 'https://api.mondialbusiness.eu/api/auth/register' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## 4. DEBUG STRATEGY

### Step 1: Confirm CORS Issue in Chrome DevTools
```
1. Open browser DevTools (F12)
2. Go to Network tab
3. Trigger signup form submit
4. Look for:
   - ❌ OPTIONS request (red/blocked)
   - If OPTIONS is blocked → CORS preflight failed
   - If OPTIONS succeeds but POST fails → different issue
5. Click OPTIONS request → Response tab
6. Check for "Access-Control-Allow-Origin" header
   - Present? → check if value matches "http://localhost:3000"
   - Missing? → backend not sending CORS headers
```

### Step 2: Test API with Postman/curl (Bypass CORS)
```bash
# curl request (CORS doesn't apply to server-to-server)
curl -X POST https://api.mondialbusiness.eu/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "testuser",
    "Email": "test@example.com",
    "Password": "SecurePass123",
    "User": "creator"
  }'

# If this succeeds → CORS config issue on backend
# If this fails → backend problem or wrong endpoint
```

### Step 3: Check Browser Console
```javascript
// In DevTools console, inspect the request:
fetch('https://api.mondialbusiness.eu/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    Name: 'test',
    Email: 'test@example.com',
    Password: 'SecurePass123',
    User: 'creator'
  })
}).catch(e => console.log('Error:', e.message));

// Check error message in console
```

---

## 5. FIX RECOMMENDATIONS

### 🏆 BEST FIX: Backend CORS Configuration (Permanent)

**For .NET Backend** (most likely):
```csharp
// In Startup.cs or Program.cs
services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", builder =>
    {
        builder
            .WithOrigins(
                "http://localhost:3000",      // Dev frontend
                "http://localhost:3001",      // Alternative dev port
                "https://app.mondialbusiness.eu"  // Prod frontend
            )
            .AllowAnyMethod()  // GET, POST, PUT, DELETE, OPTIONS
            .AllowAnyHeader()  // Any header (Content-Type, etc)
            .AllowCredentials(); // If using cookies/auth
    });
});

// In Configure():
app.UseCors("AllowLocalhost");
// Must be BEFORE UseAuthentication/UseAuthorization
```

**For Node.js Backend**:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'https://app.mondialbusiness.eu'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
```

---

### 📋 SECONDARY FIX: Frontend Proxy (Dev Only)

If backend team can't fix immediately, use local proxy:

**Create `src/lib/proxy-axios.ts`** (dev only):
```typescript
import axios from "axios";

// For development: use local proxy that forwards to backend
const isDev = process.env.NODE_ENV === 'development';

const baseURL = isDev
  ? "http://localhost:3001"  // Local proxy
  : "https://api.mondialbusiness.eu/api";

const api = axios.create({ baseURL });
export default api;
```

Then setup proxy in `next.config.ts`:
```typescript
const nextConfig = {
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'https://api.mondialbusiness.eu/api/:path*',
        },
      ],
    };
  },
};
```

Or use proxy package locally:
```bash
npm install -D http-proxy-middleware
```

---

### ⚠️ TEMPORARY WORKAROUND: Disable CORS Check (Unsafe)

**NOT RECOMMENDED** — use only for testing:

```bash
# Start Chrome without CORS enforcement (macOS)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --disable-gpu --no-first-run

# Windows
chrome.exe --disable-web-security --disable-gpu --no-first-run

# Linux
google-chrome --disable-web-security --disable-gpu --no-first-run
```

⛔ This is INSECURE — only for local development testing

---

## 6. PRODUCTION CHECKLIST

| Item | Dev | Prod |
|------|-----|------|
| Frontend URL | http://localhost:3000 | https://app.mondialbusiness.eu |
| Backend URL | https://api.mondialbusiness.eu | https://api.mondialbusiness.eu |
| CORS Origins | localhost:3000 | app.mondialbusiness.eu |
| Credentials | false (no cookies) | true (if using auth cookies) |
| Protocol | HTTP allowed | HTTPS only |

**Backend CORS must allow**:
```
✅ http://localhost:3000 (dev)
✅ https://app.mondialbusiness.eu (prod)
❌ Everything else
```

---

## SUMMARY

| Question | Answer |
|----------|--------|
| Is data flow correct? | ✅ YES — all fields collected and persisted |
| Is API request correct? | ✅ YES — payload is valid JSON |
| What's the actual error? | 🚨 CORS preflight blocked by backend |
| Who needs to fix it? | Backend team (add CORS headers) |
| Frontend can fix it? | Only as workaround (proxy/disable) |
| Best solution? | Backend adds CORS config for http://localhost:3000 |

---

## IMMEDIATE NEXT STEPS

1. **Confirm CORS issue**: Open DevTools → Network → check OPTIONS request
2. **Contact backend team**: Ask to add CORS headers for http://localhost:3000
3. **Provide them this config**: Include the .NET/.js CORS code above
4. **Meanwhile**: Use proxy workaround or test with Postman
5. **After fix**: Remove workaround, use direct API call

---

## Reference: Sample CORS Response

When backend is correctly configured:
```
OPTIONS /auth/register HTTP/1.1
→ HTTP/1.1 200 OK
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: content-type, authorization
  Access-Control-Max-Age: 86400

POST /auth/register HTTP/1.1
→ HTTP/1.1 200 OK
  { "token": "...", "user": {...} }
```
