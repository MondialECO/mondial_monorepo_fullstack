# Quick Authentication Test — 30 Minutes

**Goal:** Verify auth works end-to-end  
**Time:** ~30 minutes

---

## 1. Prepare Environment (5 min)

### Create `frontend/.env.local`
```env
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Create `backend/.env`
```env
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=localhost,1433;Database=Mondial;User Id=sa;Password=YourPassword;TrustServerCertificate=true;
JWT_SECRET=thisisalongdevsecretkeymin32characters
JwtSettings:Key=thisisalongdevsecretkeymin32characters
JwtSettings:Issuer=http://localhost:5000
JwtSettings:Audience=http://localhost:3000
CORS_AllowedOrigins=http://localhost:3000
Email:SmtpServer=smtp.gmail.com
Email:SmtpPort=587
Email:SenderEmail=test@gmail.com
Email:SenderPassword=app-password-here
```

---

## 2. Start Services (5 min)

### Terminal 1: Backend
```bash
cd C:\devs\Mondial\backend
dotnet watch run
# Wait for: "Now listening on: http://localhost:5000"
```

### Terminal 2: Frontend
```bash
cd C:\devs\Mondial\frontend
npm run dev
# Wait for: "▲ Next.js 16.1.7 - Local: http://localhost:3000"
```

---

## 3. Test Backend API (10 min)

### Test 1: Health Check
```bash
curl http://localhost:5000/health
# Expected: {"status":"healthy"}
```

### Test 2: Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "user": "Creator"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully!",
  "data": {
    "id": "...",
    "email": "test@example.com"
  }
}
```

### Test 3: Mock Email Confirmation
Since SMTP may not be configured, mock confirmation:

**Option A: SQL Query**
```sql
-- Connect to your SQL Server database
SELECT * FROM AspNetUsers WHERE Email = 'test@example.com'
UPDATE AspNetUsers SET EmailConfirmed = 1 WHERE Email = 'test@example.com'
```

**Option B: Use Postman/Insomnia**
- Create a request to `POST /api/auth/confirm-email`
- Body: `{"userId":"[from-register-response]","token":"dummy"}`
- (May need real token from email if service works)

### Test 4: Login (Success)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "name": "Test User",
      "roles": ["Creator"]
    }
  }
}
```

**Save the token for next test!**

### Test 5: Authenticated Request
```bash
# Use token from Test 4
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "roles": ["Creator"]
  }
}
```

**✅ If you got here, backend auth works!**

---

## 4. Test Frontend UI (10 min)

### Test 1: Signup Page
1. Open http://localhost:3000/signup
2. Fill form:
   - Full Name: "Frontend Test"
   - Email: "frontend@example.com"
   - Password: "TestPassword123!"
   - Role: "Creator"
3. Click "Sign Up"

**Expected:**
- ✅ No form errors
- ✅ Shows "Check your email" message
- ✅ Can see email confirmation UI

**Backend Check:**
```sql
SELECT * FROM AspNetUsers WHERE Email = 'frontend@example.com'
-- Should show new user with EmailConfirmed = 0
```

### Test 2: Confirm Email (Mock)
```sql
UPDATE AspNetUsers 
SET EmailConfirmed = 1 
WHERE Email = 'frontend@example.com'
```

### Test 3: Login Page
1. Go to http://localhost:3000/login
2. Enter:
   - Email: "frontend@example.com"
   - Password: "TestPassword123!"
3. Click "Sign In"

**Expected:**
- ✅ Loading spinner shows
- ✅ Redirects to http://localhost:3000/dashboard/creator
- ✅ Shows "Hello, Frontend Test 👋"
- ✅ Navbar shows user is logged in

**Check localStorage:**
1. Press F12 (DevTools)
2. Go to Application → Local Storage → http://localhost:3000
3. Should see:
   - `token`: JWT token
   - `user`: `{"id":"...","name":"Frontend Test","role":"Creator"}`

### Test 4: Logout
1. While logged in, click profile menu
2. Click "Logout"

**Expected:**
- ✅ Redirects to http://localhost:3000/login
- ✅ localStorage cleared (token, user gone)
- ✅ Cannot access /dashboard without login

### Test 5: Session Persistence
1. Login again
2. Press F5 (refresh)
3. Should stay logged in

**Expected:**
- ✅ Still on dashboard
- ✅ User profile still visible
- ✅ Token still in localStorage

**✅ If you got here, frontend auth works!**

---

## Summary Checklist

### Backend ✅
- [ ] Health check passes
- [ ] User registration works
- [ ] Email confirmation updates DB
- [ ] Login returns JWT token
- [ ] Token valid for API requests
- [ ] Invalid credentials return 401

### Frontend ✅
- [ ] Signup form works
- [ ] Login form works  
- [ ] Token stored in localStorage
- [ ] Redirects to dashboard on login
- [ ] Token attached to API requests
- [ ] Session persists on refresh
- [ ] Logout clears session

### Overall ✅
- [ ] No console errors (F12)
- [ ] No network errors (DevTools → Network)
- [ ] No error logs in backend terminal
- [ ] Both servers running smoothly

---

## If Tests Fail

### Backend Won't Start
```bash
# Check SQL Server running
sqlcmd -S localhost,1433 -U sa -P YourPassword

# Check port 5000 available
netstat -ano | findstr :5000

# Check JWT secret length (min 32 chars)
echo "thisisalongdevsecretkeymin32characters" | wc -c
```

### Frontend Won't Load
```bash
# Check Node version
node --version    # Should be v18+

# Clear cache
rm -rf frontend/node_modules package-lock.json
npm install

# Check port 3000 available
netstat -ano | findstr :3000
```

### Login Fails
- [ ] Email confirmed in database?
- [ ] Password exact match (case sensitive)?
- [ ] Token in Authorization header?
- [ ] CORS enabled on backend?
- [ ] Check backend logs for error details

### Token Not Working
- [ ] Check token is valid JWT (jwt.io)
- [ ] Check `Authorization: Bearer <token>` format
- [ ] Check JWT secret matches between frontend & backend
- [ ] Check token not expired

---

## Success = MVP Ready! 🎉

If all tests pass:
1. ✅ Auth is production-ready
2. ✅ Can launch May 22
3. ✅ Deploy with confidence

**Estimated time:** 30 minutes for full test cycle
