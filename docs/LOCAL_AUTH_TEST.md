# Authentication Testing Guide — Local Development

**Date:** 2026-05-20  
**Status:** Ready for testing  
**Time Required:** 30 minutes

---

## Quick Setup (5 min)

### Terminal 1: Start Backend
```bash
cd C:\devs\Mondial\backend
dotnet watch run
# Wait for: "Now listening on: http://localhost:5000"
```

### Terminal 2: Start Frontend
```bash
cd C:\devs\Mondial\frontend
npm run dev
# Wait for: "▲ Next.js 16.1.7 - Local: http://localhost:3000"
```

### Environment Check
The following are now configured:
- ✅ Frontend API URL: `http://localhost:5000/api` (from env)
- ✅ Backend Base URL: `http://localhost:3000` (for confirmation links)
- ✅ CORS: Enabled for localhost:3000
- ✅ JWT Secret: Configured in backend
- ✅ Database: SQL Server (ensure running)

---

## Test 1: User Registration (Signup)

### Steps:
1. Open `http://localhost:3000/signup`
2. Fill form:
   - **Full Name:** `Test User 1`
   - **Email:** `test1@example.com`
   - **Password:** `TestPassword123!`
   - **Role:** Select `Creator`
3. Click **Sign Up**

### Expected Results:
- ✅ Form validates without errors
- ✅ Shows "Check your email" confirmation message
- ✅ User created in database with `EmailConfirmed = 0`
- ✅ No console errors (F12)
- ✅ No 500 errors in backend logs

### Check Database:
```sql
SELECT Email, EmailConfirmed, User FROM AspNetUsers WHERE Email = 'test1@example.com'
```

---

## Test 2: Email Confirmation (Mock)

Since SMTP might not be configured, manually confirm email:

```sql
UPDATE AspNetUsers 
SET EmailConfirmed = 1 
WHERE Email = 'test1@example.com'
```

---

## Test 3: Login with Unconfirmed Email

### Steps:
1. Go to `http://localhost:3000/login`
2. Enter:
   - **Email:** `test1@example.com`
   - **Password:** `TestPassword123!`
3. Click **Sign In**

### Expected Results (BEFORE running Test 2):
- ❌ Should fail with error: "You need to confirm your email before logging in."
- ✅ Stays on login page
- ✅ Shows error message to user

---

## Test 4: Login with Confirmed Email

### Prerequisites:
- Run **Test 2** first to confirm email in database

### Steps:
1. Go to `http://localhost:3000/login`
2. Enter credentials:
   - **Email:** `test1@example.com`
   - **Password:** `TestPassword123!`
3. Click **Sign In**

### Expected Results:
- ✅ Loading spinner appears
- ✅ Redirects to `/dashboard/creator`
- ✅ Shows user greeting: "Hello, Test User 1 👋"
- ✅ Token stored in localStorage
- ✅ No console errors
- ✅ Backend logs show successful login

### Verify Token:
1. Press **F12** (DevTools)
2. Go to **Application → Local Storage → http://localhost:3000**
3. Check entries:
   - `token` = Valid JWT token
   - `user` = `{"id":"...","name":"Test User 1","role":"Creator"}`

---

## Test 5: Protected Routes

### Test 5a: Access Dashboard While Logged In
1. From Test 4, you should still be on `/dashboard/creator`
2. Refresh page (F5)
3. Should remain logged in (token persists)

### Expected Results:
- ✅ Still on dashboard
- ✅ User info still visible
- ✅ Token still in localStorage

### Test 5b: Try Dashboard Without Login
1. Open new incognito/private window
2. Go to `http://localhost:3000/dashboard/creator`

### Expected Results:
- ❌ Redirects to `/login`
- ✅ Cannot access protected routes without auth

---

## Test 6: Logout

### Steps:
1. While logged in on dashboard
2. Look for logout option (usually in profile menu or topbar)
3. Click **Logout**

### Expected Results:
- ✅ Redirects to `/login`
- ✅ localStorage cleared (token and user removed)
- ✅ Cannot access `/dashboard` anymore without re-login

---

## Test 7: API Authentication

### Test token attachment to requests:

```bash
# Get token from localStorage or use login response
TOKEN="<paste-jwt-token-here>"

# Test 1: Request WITHOUT token (should fail)
curl -X GET http://localhost:5000/api/auth/me

# Should return: 401 Unauthorized

# Test 2: Request WITH token (should succeed)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Should return: 200 OK with user data
```

---

## Test 8: Invalid Login

### Steps:
1. Go to `http://localhost:3000/login`
2. Try with wrong credentials:
   - **Email:** `test1@example.com`
   - **Password:** `WrongPassword123!`
3. Click **Sign In**

### Expected Results:
- ❌ Shows error: "Invalid email or password"
- ✅ Stays on login page
- ✅ Generic message (doesn't reveal user doesn't exist)
- ✅ Backend logs show failed attempt

---

## Test 9: Non-existent Email Login

### Steps:
1. Go to `http://localhost:3000/login`
2. Try with non-existent email:
   - **Email:** `nonexistent@example.com`
   - **Password:** `AnyPassword123!`
3. Click **Sign In**

### Expected Results:
- ❌ Shows error: "Invalid email or password"
- ✅ Same generic message (security best practice)
- ✅ Audit log records failed attempt

---

## Troubleshooting

### Backend won't start
```bash
# Check port 5000 available
netstat -ano | findstr :5000

# Check SQL Server running
sqlcmd -S localhost,1433 -U sa -P YourPassword

# Verify .NET installed
dotnet --version
```

### Frontend won't load
```bash
# Clear cache
rm -rf frontend/.next
npm run dev

# Check Node version
node --version  # Should be v18+
```

### Login fails with network error
1. Check **DevTools → Network** tab
2. Look for failed API call to `/api/auth/login`
3. Check response status code
4. If 500, check **backend logs** for error

### Token not attaching to requests
1. Check **DevTools → Application → Local Storage**
2. Verify `token` key exists
3. Check **DevTools → Network** tab
4. Look for `Authorization: Bearer <token>` header

### CORS Error in browser console
1. Check backend CORS configuration
2. Verify `CORS_AllowedOrigins=http://localhost:3000` in `.env`
3. Restart backend after changing CORS

---

## Success Criteria ✅

All tests pass when:

### Backend
- ✅ Register endpoint creates user
- ✅ Email confirmed in database
- ✅ Login with valid credentials returns JWT
- ✅ Invalid credentials return 401
- ✅ Token valid for API requests
- ✅ Unconfirmed email blocks login
- ✅ Audit logs record attempts

### Frontend
- ✅ Signup form validates and submits
- ✅ Login form accepts credentials
- ✅ Token stored in localStorage
- ✅ Redirects to correct dashboard
- ✅ Protected routes require auth
- ✅ Session persists on refresh
- ✅ Logout clears session
- ✅ Error messages are clear

### Integration
- ✅ Frontend sends token with requests
- ✅ Backend accepts and validates token
- ✅ CORS works (no errors)
- ✅ No console errors (F12)
- ✅ No network errors

---

## Manual Test Checklist

```
Backend Tests:
☐ Register user
☐ Confirm email in DB
☐ Login succeeds with confirmed email
☐ Login fails with unconfirmed email
☐ Login fails with wrong password
☐ Token attaches to API requests
☐ Logout clears token

Frontend Tests:
☐ Signup page loads and validates
☐ Login page loads and submits
☐ Token persists in localStorage
☐ Redirects to dashboard on login
☐ Dashboard requires authentication
☐ Session persists on refresh
☐ Logout clears session

Integration:
☐ No CORS errors
☐ No console errors (F12)
☐ No network errors (DevTools)
☐ API responds with correct data
☐ Audit logs record events
```

---

## Next Steps

1. **Run this test guide** (30 min)
2. **Document results** in `AUTH_TEST_RESULTS.md`
3. **Fix any failures** immediately
4. **Sign off** with date/time
5. **Deploy** with confidence

---

**Status: Ready for Testing** ✅
