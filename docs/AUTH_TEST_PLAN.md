# Authentication Testing Plan

**Date:** 2026-05-20  
**Goal:** Verify login, signup, and auth flow work end-to-end

---

## Prerequisites

### 1. Environment Setup

**Backend** (`backend/.env`):
```env
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=localhost,1433;Database=Mondial;User Id=sa;Password=YourPassword;TrustServerCertificate=true;
JWT_SECRET=dev-secret-key-min-32-chars
JwtSettings:Key=dev-secret-key-min-32-chars
JwtSettings:Issuer=http://localhost:5000
JwtSettings:Audience=http://localhost:3000
MongoDbSettings:ConnectionString=mongodb://localhost:27017
MongoDbSettings:DatabaseName=Mondial
Redis:Configuration=localhost:6379
Redis:InstanceName=Mondial
Email:SmtpServer=smtp.gmail.com
Email:SmtpPort=587
Email:SenderEmail=your-email@gmail.com
Email:SenderPassword=your-app-password
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. Services Required

- **SQL Server** (User database)
- **MongoDB** (Optional - for advanced features)
- **Redis** (Optional - for caching)

For MVP testing, only **SQL Server** is essential.

---

## Test Cases

### Test 1: Backend API - Register User

**Endpoint:** `POST http://localhost:5000/api/auth/register`

**Request:**
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "name": "Test User",
  "user": "Creator"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully! Please check your email for confirmation.",
  "data": {
    "id": "user-uuid",
    "email": "testuser@example.com"
  }
}
```

**Checks:**
- ✓ Status code is 201
- ✓ User created in database
- ✓ Confirmation email sent (check email or logs)
- ✓ User has "Creator" role assigned

---

### Test 2: Backend API - Confirm Email (Mock)

Since email confirmation requires external email service, you can mock this by:

**Option A: Direct Database Update**
```sql
UPDATE AspNetUsers 
SET EmailConfirmed = 1 
WHERE Email = 'testuser@example.com'
```

**Option B: Use Real Email**
- Use a test Gmail account with app password
- Set in `.env`: `Email:SenderPassword`
- Confirm email via link in email

---

### Test 3: Backend API - Login (Invalid Email)

**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Request:**
```json
{
  "email": "nonexistent@example.com",
  "password": "AnyPassword123!"
}
```

**Expected Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

**Checks:**
- ✓ Returns 401 Unauthorized
- ✓ Generic message (doesn't reveal user doesn't exist)
- ✓ Audit log records failed attempt

---

### Test 4: Backend API - Login (Invalid Password)

**Request:**
```json
{
  "email": "testuser@example.com",
  "password": "WrongPassword123!"
}
```

**Expected Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

**Checks:**
- ✓ Returns 401
- ✓ Audit log records failed attempt

---

### Test 5: Backend API - Login (Email Not Confirmed)

**Request (before email confirmed):**
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response (401):**
```json
{
  "message": "You need to confirm your email before logging in."
}
```

**Checks:**
- ✓ Returns 401
- ✓ Specific message about email confirmation
- ✓ Prevents login until email confirmed

---

### Test 6: Backend API - Login (Success)

**Request (after email confirmed):**
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "name": "Test User",
      "roles": ["Creator"]
    }
  }
}
```

**Checks:**
- ✓ Returns 200 OK
- ✓ Token is valid JWT
- ✓ Token contains user ID, role
- ✓ Audit log records successful login
- ✓ `LastLogin` updated in database

---

### Test 7: Backend API - Authenticated Request

**Endpoint:** `GET http://localhost:5000/api/auth/me`

**Headers:**
```
Authorization: Bearer <token-from-login>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "testuser@example.com",
    "name": "Test User",
    "roles": ["Creator"]
  }
}
```

**Checks:**
- ✓ Token is accepted
- ✓ User data returned
- ✓ Returns 401 if token missing or invalid

---

### Test 8: Frontend - Signup Flow

**Steps:**
1. Open http://localhost:3000/signup
2. Fill form:
   - Full Name: "Test User"
   - Email: "frontendtest@example.com"
   - Password: "TestPassword123!"
   - Role: "Creator"
3. Click "Sign Up"

**Expected:**
- ✓ Form validates input
- ✓ Shows success message
- ✓ Redirects to email confirmation page
- ✓ User created in backend database

**Check:** Look for user in database:
```sql
SELECT Email, EmailConfirmed, User FROM AspNetUsers WHERE Email = 'frontendtest@example.com'
```

---

### Test 9: Frontend - Login Flow (Unconfirmed Email)

**Steps:**
1. Open http://localhost:3000/login
2. Enter credentials:
   - Email: "frontendtest@example.com"
   - Password: "TestPassword123!"
3. Click "Sign In"

**Expected:**
- ✓ Shows error: "You need to confirm your email before logging in"
- ✓ Stays on login page
- ✓ Form clears (or shows error inline)

---

### Test 10: Frontend - Login Flow (Success)

**Prerequisites:** Email confirmed (update database or use real email)

**Steps:**
1. Open http://localhost:3000/login
2. Enter valid credentials
3. Click "Sign In"

**Expected:**
- ✓ Shows loading state
- ✓ Redirects to dashboard (e.g., `/dashboard/creator`)
- ✓ Token stored in localStorage
- ✓ User profile displayed (hello message with name)
- ✓ Navbar shows user is logged in

**Check:** Open DevTools → Application → Local Storage:
```
key: "token"
value: "eyJhbGciOi..." (JWT token)

key: "user"
value: {"id":"...", "name":"...", "role":"..."}
```

---

### Test 11: Frontend - Session Persistence

**Steps:**
1. Login successfully
2. Refresh page (F5)
3. Check if still logged in

**Expected:**
- ✓ Stays on dashboard (redirects to login if needed)
- ✓ User profile persists
- ✓ Token still valid

**Check:** AuthProvider should hydrate from localStorage on mount

---

### Test 12: Frontend - Logout

**Steps:**
1. While logged in, click profile/logout button
2. Verify redirect to login page

**Expected:**
- ✓ localStorage cleared (token, user removed)
- ✓ Redirects to `/login`
- ✓ Cannot access protected pages without re-login

---

### Test 13: Frontend - Password Reset

**Steps:**
1. Go to http://localhost:3000/forgot-password
2. Enter email: "testuser@example.com"
3. Click "Send Reset Link"

**Expected:**
- ✓ Shows success message
- ✓ Email sent (check inbox or logs)
- ✓ User can click link and set new password

---

### Test 14: API - Token Expiration (if implemented)

**Request:**
```bash
curl -H "Authorization: Bearer <expired-token>" \
  http://localhost:5000/api/auth/me
```

**Expected:**
- ✓ Returns 401 Unauthorized
- ✓ Frontend triggers re-login or token refresh

---

## How to Run Tests

### Option 1: Manual Testing

```bash
# Terminal 1: Start backend
cd C:\devs\Mondial\backend
dotnet watch run

# Terminal 2: Start frontend
cd C:\devs\Mondial\frontend
npm run dev

# Terminal 3: Test API with curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

### Option 2: Postman Testing

1. Import `backend/postman-collection.json` (if exists)
2. Set environment variables:
   - `base_url`: http://localhost:5000
   - `token`: (auto-captured from login response)
3. Run test sequence:
   - Register → Confirm Email → Login → Get Profile

### Option 3: Frontend UI Testing

1. Open http://localhost:3000
2. Navigate to `/login` and `/signup`
3. Test complete user flows
4. Check browser console for errors
5. Check Network tab for API calls

---

## Debugging Checklist

If tests fail:

### Backend Issues
- [ ] Check backend is running: http://localhost:5000/health
- [ ] Verify `.env` has correct values
- [ ] Check logs in terminal for errors
- [ ] Verify SQL Server is running: `sqlcmd -S localhost,1433 -U sa -P YourPassword`
- [ ] Check email service config (SMTP)
- [ ] Verify JWT secret is at least 32 characters

### Frontend Issues
- [ ] Check frontend is running: http://localhost:3000
- [ ] Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`
- [ ] Check browser console (F12) for errors
- [ ] Check Network tab → api calls → Response for error messages
- [ ] Verify axios interceptor is attaching token header

### Both
- [ ] Check CORS is enabled on backend (should allow http://localhost:3000)
- [ ] Verify ports aren't blocked by firewall
- [ ] Check if token was actually stored in localStorage

---

## Success Criteria

✅ All 14 tests pass:
- Register new user
- Email confirmation (mock or real)
- Login with invalid credentials (error)
- Login with valid credentials (success)
- Authenticated API request (token accepted)
- Signup via frontend
- Login via frontend
- Session persistence
- Logout clears session
- Password reset flow works
- Token expiration handled
- UI error messages clear
- Audit logs record attempts
- No sensitive data exposed

---

## Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| Email confirmation not working | Update database directly: `UPDATE AspNetUsers SET EmailConfirmed = 1 WHERE Email = '...'` |
| CORS errors | Check `CORS_AllowedOrigins` in backend .env |
| Token not attached to API calls | Check `axios.ts` interceptor is configured |
| Login fails but no error message | Check browser console and backend logs |
| LocalStorage not persisting | Check browser privacy settings allow local storage |

---

## Final Report Template

```
✅ AUTHENTICATION TEST REPORT
Date: 2026-05-20
Tester: [Your Name]

BACKEND TESTS:
- Register: ✓ PASS / ✗ FAIL
- Confirm Email: ✓ PASS / ✗ FAIL
- Login (invalid): ✓ PASS / ✗ FAIL
- Login (valid): ✓ PASS / ✗ FAIL
- Auth Request: ✓ PASS / ✗ FAIL

FRONTEND TESTS:
- Signup Flow: ✓ PASS / ✗ FAIL
- Login Flow: ✓ PASS / ✗ FAIL
- Session Persistence: ✓ PASS / ✗ FAIL
- Logout: ✓ PASS / ✗ FAIL

ISSUES FOUND:
1. [Description]
2. [Description]

RECOMMENDATIONS:
1. [Fix needed]
2. [Improvement]

OVERALL: ✓ READY FOR MVP / ✗ NOT READY - [Reason]
```

---

Start with Test 1-7 (Backend API), then Test 8-12 (Frontend UI). Report results!
