# Complete Testing Guide - Mondial Full-Stack

This guide ensures everything is real (not mocked) and the full user flow works end-to-end.

---

## PHASE 1: SETUP & PREREQUISITES

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
dotnet restore
```

### 2. Configure Environment

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_API_TIMEOUT=30000
```

**Backend `.env`:**
```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__MongoDb=mongodb://localhost:27017/mondial
Jwt__Secret=test-secret-key-for-development-only
SendGrid__ApiKey=your-sendgrid-api-key-or-test
AWS__AccessKey=test-access-key-or-actual
AWS__SecretKey=test-secret-key-or-actual
```

### 3. Start MongoDB

```bash
# Docker
docker run -d -p 27017:27017 --name mondial-db mongo:6.0

# Or local
mongosh < scripts/01-init-database.mongodb
```

---

## PHASE 2: BUILD VERIFICATION

### Frontend Build

```bash
cd frontend
npm run build
```

**Expected Output:**
```
✓ Client builds successfully
✓ Static exports generated
✓ All routes prerendered
✓ No TypeScript errors
```

### Backend Build

```bash
cd backend
dotnet build -c Release
```

**Expected Output:**
```
✓ Compiles without warnings
✓ All NuGet packages restored
✓ Ready for tests
```

---

## PHASE 3: UNIT TESTS (REAL, NOT MOCKED)

### Frontend Unit Tests

```bash
cd frontend
npm install  # Installs @testing-library dependencies
npm run test
```

**Tests Cover:**
- ✅ API endpoints return correct data
- ✅ Form inputs handle changes correctly
- ✅ Form validation works
- ✅ Loading states appear
- ✅ Error messages display properly

**Run individually:**
```bash
npm run test -- api-entrepreneur.test.ts
npm run test -- FormTemplates.test.tsx
```

### Backend Unit Tests

```bash
cd backend
dotnet test
```

**Tests Cover:**
- ✅ CompanyController receives requests correctly
- ✅ CreateCompany saves to database
- ✅ UpdateLegalInfo updates database
- ✅ SaveRevenue calculates correctly
- ✅ AdvancePhase validates phase requirements
- ✅ Document uploads to S3 (mocked in tests)
- ✅ AI review enqueue returns job ID

---

## PHASE 4: REAL INTEGRATION TEST (END-TO-END USER FLOW)

### Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
dotnet run
```

**Output should show:**
```
info: Application started. Press Ctrl+C to shut down.
info: Hosting environment: Development
info: Application listening on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Output should show:**
```
▲ Next.js 16.1.7
✓ Ready in 2.3s
✓ Ready on http://localhost:3000
```

---

## PHASE 5: MANUAL USER FLOW TEST (REAL DATA)

### Test 1: User Registration & Login

1. Go to http://localhost:3000/auth/signup
2. Create account:
   - Email: `test@mondial.eco`
   - Password: `TestPassword123!`
3. Verify in MongoDB:
   ```bash
   mongosh
   use mondial
   db.users.findOne({email: "test@mondial.eco"})
   # Should show created user with JWT token
   ```

✅ **Expected:** User created in DB, JWT token in localStorage

### Test 2: Create Company (Phase 1)

1. Dashboard shows "New Company" button
2. Click → Fill form:
   - Name: "Test StartUp Inc"
   - Industry: "SaaS"
   - Website: "https://teststartup.com"
   - Tagline: "The best test startup"
3. Submit
4. Verify in MongoDB:
   ```bash
   db.companies.findOne({companyName: "Test StartUp Inc"})
   # Should show: currentPhase: 1, trustScore: 30
   ```

✅ **Expected:** Company saved in DB, appears on dashboard

### Test 3: Phase 2 Step 1 - Legal Info

1. Dashboard → Click company → Phase 2 Step 1
2. Fill form:
   - Legal Name: "Test SARL"
   - SIRET: "12345678901234"
   - Structure: "SARL"
   - Date: "2023-01-01"
   - Address: "123 Main St"
   - Country: "France"
3. Submit
4. Verify in MongoDB:
   ```bash
   db.companies.findOne({companyName: "Test StartUp Inc"})
   # Should show: phase2_legalInfo populated
   ```

✅ **Expected:** Legal info saved, can navigate to Phase 2 Step 2

### Test 4: Phase 2 Step 2 - Document Upload

1. Phase 2 Step 2 page
2. Create test PDF:
   ```bash
   echo "Test document" > test.pdf
   ```
3. Upload file
4. Verify in S3 (or test bucket):
   ```bash
   aws s3 ls s3://your-bucket/documents/
   # Should show the uploaded file
   ```

✅ **Expected:** File uploaded to S3, document status shows "pending"

### Test 5: Phase 3 Step 1 - Revenue

1. Phase 3 Step 1
2. Enter quarterly revenue:
   - Q1: 10,000
   - Q2: 15,000
   - Q3: 20,000
   - Q4: 25,000
3. Submit
4. Verify in MongoDB:
   ```bash
   db.companies.findOne({companyName: "Test StartUp Inc"})
   # Should show: phase3_revenue with all values
   ```

✅ **Expected:** Revenue saved, growth percentages calculated correctly

### Test 6: Phase 7 - AI Review (Background Job)

1. Phase 7 page
2. Click "Start AI Review"
3. Observe job status updating (polling every 2s)
4. Verify in MongoDB:
   ```bash
   db.backgroundJobs.findOne({companyType: "ai_review"})
   # Should show status changing: queued → processing → completed
   ```

✅ **Expected:** Job enqueued, status updates in real-time

### Test 7: Full Phase Progression

1. Complete Phase 2 (all 3 steps)
2. Complete Phase 3 (all 3 steps)
3. Verify company phase advances to 4
4. Dashboard shows updated progress bar

✅ **Expected:** Phase gating works, can't skip phases

---

## PHASE 6: API VERIFICATION (NOT MOCKED)

### Check All Endpoints Are Connected

**Create Company:**
```bash
curl -X POST http://localhost:5000/api/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "API Test Co",
    "industry": "FinTech",
    "website": "https://api-test.com",
    "tagline": "Testing API"
  }'

# Expected: 200 OK with company data
```

**Get Company List:**
```bash
curl -X GET http://localhost:5000/api/companies/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with array of companies
```

**Update Legal Info:**
```bash
curl -X POST http://localhost:5000/api/companies/{companyId}/legal-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Test SARL",
    "registrationNumber": "12345678901234",
    "legalStructure": "SARL",
    "incorporationDate": "2023-01-01",
    "registeredAddress": "123 Main St",
    "country": "France"
  }'

# Expected: 200 OK
```

**Enqueue AI Review:**
```bash
curl -X POST http://localhost:5000/api/companies/{companyId}/ai-review/enqueue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 202 Accepted with jobId
```

---

## PHASE 7: VERIFY REAL DATA FLOW

### Check Database State After Tests

```bash
mongosh mondial
```

**Users:**
```javascript
db.users.find().pretty()
// Should show test user with hashed password
```

**Companies:**
```javascript
db.companies.find().pretty()
// Should show company with all phase data
```

**Documents:**
```javascript
db.documents.find().pretty()
// Should show uploaded documents with S3 keys
```

**Background Jobs:**
```javascript
db.backgroundJobs.find().pretty()
// Should show AI review job with completion status
```

---

## PHASE 8: VERIFY REAL API CALLS (NOT MOCKED)

### Proof of Real Integration

1. **Frontend → Backend Communication:**
   - Open DevTools (F12)
   - Network tab
   - Create company
   - Should see POST request to http://localhost:5000/api/companies
   - Response includes MongoDB _id

2. **Database Writes:**
   - Create company in UI
   - Immediately query MongoDB: `db.companies.findOne({companyName: "..."})`
   - Data should exist (REAL, not mocked)

3. **File Upload (S3):**
   - Upload document in Phase 2
   - Check S3 bucket
   - File should exist with correct path

4. **Background Jobs:**
   - Trigger AI review
   - Check MongoDB: `db.backgroundJobs.findOne()`
   - Job status should change from "queued" to "processing" to "completed"

---

## PHASE 9: COVERAGE REPORT

### Generate Test Coverage

**Frontend:**
```bash
npm run test:coverage
```

**Expected Output:**
```
Statements   : XX% ( XX / XX )
Branches     : XX% ( XX / XX )
Functions    : XX% ( XX / XX )
Lines        : XX% ( XX / XX )
```

Target: **>80% coverage**

**Backend:**
```bash
dotnet test /p:CollectCoverage=true
```

---

## CHECKLIST: REAL NOT MOCKED

- [ ] User registration saves to MongoDB (not mocked)
- [ ] Company creation writes to MongoDB
- [ ] Legal info updates in database
- [ ] Documents upload to S3
- [ ] Revenue saved in database
- [ ] Equity structure saved correctly
- [ ] API endpoints connected to database
- [ ] Background jobs stored in MongoDB
- [ ] All queries return real database data
- [ ] Phase gating enforced by backend
- [ ] Form validation on backend
- [ ] JWT tokens stored in localStorage
- [ ] Authentication required on protected routes

---

## TROUBLESHOOTING

**"Cannot connect to MongoDB"**
```bash
docker ps | grep mondial-db
# If not running:
docker run -d -p 27017:27017 mongo:6.0
```

**"API returns 401 Unauthorized"**
```javascript
// Check localStorage for token
localStorage.getItem('token')
// If missing, re-login
```

**"Document upload fails"**
```bash
# Check S3 credentials in .env
# Ensure bucket exists and IAM user has permissions
aws s3 ls  # Should list buckets
```

**"Build fails with TypeScript errors"**
```bash
npm run lint
# Fix errors and rebuild
npm run build
```

---

## SUCCESS CRITERIA

✅ All tests pass (unit + integration)  
✅ Build succeeds without errors  
✅ Real database writes verified  
✅ API calls reach backend  
✅ User flow works end-to-end  
✅ No mock data in production flow  
✅ All 9 phases accessible and functional  
✅ Background jobs process correctly  
✅ All documentation complete  

**You now have a REAL, fully-tested, production-ready application.**
