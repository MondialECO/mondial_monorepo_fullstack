# 🌐 Browser Testing Guide - Full API Integration

**Status:** ✅ All APIs implemented and integrated into frontend  
**Date:** 2026-05-21  
**Frontend:** Next.js 16 + React 19  
**Backend Required:** ASP.NET Core running on http://localhost:5000

---

## 🚀 QUICK START - Setup

### Prerequisites
1. ✅ Backend running: `dotnet run` in `/backend` folder
2. ✅ MongoDB running on `localhost:27017`
3. ✅ Frontend running: `npm run dev` in `/frontend` folder

### Environment Check

**Frontend `.env.local` should have:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_API_TIMEOUT=30000
```

**Backend `.env` should have:**
```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__MongoDb=mongodb://localhost:27017/mondial
Jwt__Secret=your-secret-key
SendGrid__ApiKey=optional
```

---

## 📋 Testing Checklist - What to Check

### Test 1: Signup & Login Flow
**Path:** `http://localhost:3000/auth/signup`

#### What should render:
```
✓ Signup form with email/password fields
✓ "I agree to terms" checkbox
✓ Submit button
✓ Link to login page
```

#### What to test:
1. Fill in email: `test@mondial.eco`
2. Fill in password: `TestPassword123!`
3. Check "I agree to terms"
4. Click "Sign Up"

#### Expected result:
```
✓ Page shows "Creating account..."
✓ Redirects to /auth/signup/role after 2-3 seconds
✓ JWT token stored in localStorage
```

#### Verify in Browser DevTools (F12):
```javascript
// Open Console tab and run:
localStorage.getItem('token')  // Should show JWT token
localStorage.getItem('userId') // Should show user ID
```

---

### Test 2: Company Creation (Phase 1)
**Path:** `http://localhost:3000/dashboard/entrepreneur/phase-1/create`

#### What should render:
```
✓ Header: "Create Your Company Profile"
✓ Form with fields:
  - Company Name (text input)
  - Industry (dropdown with SaaS, FinTech, etc.)
  - Website (URL input)
  - Company Tagline (textarea)
✓ Back and Create Company buttons
```

#### What to test:
1. **Fill Form:**
   - Company Name: `TechStartup Inc`
   - Industry: `SaaS`
   - Website: `https://techstartup.com`
   - Tagline: `Revolutionary SaaS platform`

2. **Submit:**
   - Click "Create Company"
   - Should show "Creating..." loader

#### Expected result:
```
✓ Shows success message: "Company created! Redirecting..."
✓ Redirects to /dashboard/entrepreneur
✓ New company appears in list
✓ Phase 1 marked as "Complete"
```

#### Verify in DevTools Network Tab:
```
1. Open DevTools → Network tab
2. Create company
3. Should see POST request to: http://localhost:5000/api/companies
4. Response should show: 
   {
     "id": "xxx",
     "companyName": "TechStartup Inc",
     "currentPhase": 1,
     "trustScore": 30
   }
```

---

### Test 3: Phase 2 - Legal Information (Step 1)
**Path:** `http://localhost:3000/dashboard/entrepreneur/phase-2/step-1`

#### What should render:
```
✓ Form titled "Legal Information"
✓ Fields:
  - Legal Name (text)
  - Registration Number/SIRET (text)
  - Legal Structure (dropdown: SARL, SAS, EURL, etc.)
  - Incorporation Date (date picker)
  - Registered Address (text)
  - Country (dropdown)
  - NAF Code (text)
✓ Progress bar showing Phase 2 Step 1/3
```

#### What to test:
1. Fill all fields:
   ```
   Legal Name: TechStartup SARL
   SIRET: 12345678901234
   Structure: SARL
   Date: 2023-01-15
   Address: 123 Tech Avenue, Paris
   Country: France
   NAF: 6202A
   ```
2. Click "Save & Continue"

#### Expected result:
```
✓ Shows "Saving..." loader
✓ Shows "✓ Legal info saved"
✓ Redirects to /phase-2/step-2
✓ Progress bar updates
```

#### Verify in MongoDB:
```bash
# Terminal 3: Connect to MongoDB
mongosh mondial

# Run this query:
db.companies.findOne({ companyName: "TechStartup Inc" })

# Should show:
{
  _id: ObjectId(...),
  legalInfo: {
    legalName: "TechStartup SARL",
    registrationNumber: "12345678901234",
    ...
  }
}
```

---

### Test 4: Phase 2 - Document Upload (Step 2)
**Path:** `http://localhost:3000/dashboard/entrepreneur/phase-2/step-2`

#### What should render:
```
✓ Upload area with drag-and-drop
✓ "Click to select file" text
✓ File format info: "PDF, DOC, DOCX, XLS, XLSX"
✓ Previous documents list (if any)
✓ Progress indicator
```

#### What to test:
1. **Create test file:**
   ```bash
   echo "Sample business document" > test_document.pdf
   ```

2. **Upload the file:**
   - Drag file to drop zone OR click to browse
   - Select test_document.pdf

#### Expected result:
```
✓ Shows progress bar: "Uploading... 50%"
✓ When done: "✓ Document uploaded"
✓ File appears in "Uploaded Documents" list
✓ Status shows "pending"
```

#### Verify in S3 (if configured):
```bash
# Check if file was uploaded to S3
aws s3 ls s3://your-bucket-name/documents/
# Should show: test_document.pdf
```

#### Verify in MongoDB:
```bash
mongosh mondial
db.documents.findOne({ fileName: "test_document.pdf" })
# Should show S3 key and upload timestamp
```

---

### Test 5: Phase 2 - Beneficial Owners (Step 3)
**Path:** `http://localhost:3000/dashboard/entrepreneur/phase-2/step-3`

#### What should render:
```
✓ "Beneficial Owners" heading
✓ Table with columns: Name, Role, Nationality, Ownership %
✓ "Add Owner" button
✓ Existing owners list (if any)
```

#### What to test:
1. Click "Add Owner"
2. Fill in:
   ```
   Full Name: John Doe
   Role: CEO
   Nationality: French
   Ownership: 60%
   ```
3. Click "Add"
4. Add second owner:
   ```
   Full Name: Jane Smith
   Role: CTO
   Nationality: German
   Ownership: 40%
   ```

#### Expected result:
```
✓ Both owners appear in table
✓ Total ownership: 100%
✓ Can edit (click row) or delete owners
✓ Submit shows "Saving owners..."
```

---

### Test 6: Phase 3 - Revenue Input (Step 1)
**Path:** `http://localhost:3000/dashboard/entrepreneur/phase-3/step-1`

#### What should render:
```
✓ Title: "Annual Revenue"
✓ 4 input fields: Q1, Q2, Q3, Q4
✓ Auto-calculated fields:
  - ARR (Annual Recurring Revenue)
  - Growth % (Q4 vs Q1)
  - MRR (Monthly Recurring)
```

#### What to test:
1. Enter quarterly revenue:
   ```
   Q1: 10,000
   Q2: 15,000
   Q3: 20,000
   Q4: 25,000
   ```

#### Expected result:
```
✓ ARR auto-calculates: 70,000
✓ Growth %: 150% (25k - 10k / 10k * 100)
✓ MRR shows: 5,833
✓ Clicking "Next" saves to database
```

#### Verify API call (DevTools Network):
```
POST /api/companies/{companyId}/revenue
Body: {
  "q1Revenue": 10000,
  "q2Revenue": 15000,
  "q3Revenue": 20000,
  "q4Revenue": 25000
}

Response: { "success": true }
```

---

### Test 7: Phase 4 - Cap Table & Dilution
**Path:** `http://localhost:3000/dashboard/entrepreneur/phase-4`

#### What should render:
```
✓ Current cap table (pie chart or table)
  - Founder A: 60%
  - Founder B: 40%
  
✓ Dilution Simulator with 3 tabs:
  - Scenario A: Series A $10M
  - Scenario B: Series A $20M  
  - Scenario C: Series B $50M
```

#### What to test:
1. Click on each scenario tab
2. Verify dilution calculations

#### Expected result - Scenario A (Series A $10M):
```
Post-Money Valuation: $50M
Investor Equity: 20%
Founder A: 60% → 48%
Founder B: 40% → 32%
New Investor: 20%
Total: 100%
```

#### Verify in DevTools Network:
```
POST /api/companies/{companyId}/dilution-simulation
Response shows 3 scenarios with different dilutions
```

---

### Test 8: Phase 7 - AI Review
**Path:** `http://localhost:3000/dashboard/entrepreneur/phase-7`

#### What should render:
```
✓ "AI Expert Review" section
✓ "Start AI Review" button
✓ Job Status indicator (if job running)
✓ Results area (hidden until complete)
```

#### What to test:
1. Click "Start AI Review"
2. Watch status update

#### Expected result:
```
✓ Button becomes disabled, shows "Processing..."
✓ Status updates: "Queued" → "Processing" → "Complete"
✓ Shows AI Score: 75/100
✓ Shows insights and recommendations
✓ Auto-polls every 2 seconds
✓ Stops polling when complete
```

#### Verify in DevTools Network:
```
1. POST /api/jobs/{companyId}/ai-review
   Response: { "jobId": "job-123", "status": "queued" }

2. GET /api/jobs/{jobId} (polls every 2s)
   Response updates: 
   - "status": "processing"
   - "progress": 50
   - Eventually: "status": "completed"
```

#### Verify in MongoDB:
```bash
mongosh mondial
db.backgroundJobs.findOne({ _id: ObjectId("job-123") })
# Should show status: "completed", result with scores
```

---

### Test 9: Dashboard Overview
**Path:** `http://localhost:3000/dashboard/entrepreneur`

#### What should render:
```
✓ Company List with:
  - Company name
  - Current phase (1-9)
  - Trust score (0-100)
  - Progress bar
  - Phase status badges
  
✓ Phase cards showing:
  - 9 phases with icons
  - Completed phases: ✓ Green checkmark
  - Current phase: Highlighted with progress
  - Locked phases: Lock icon
  
✓ Quick actions:
  - "Create New Company" button
  - "View Details" for each company
```

#### What to test:
1. Verify created company appears in list
2. Click on company to see details
3. Check phase progress is accurate

#### Expected result:
```
✓ Company shows:
  - Name: "TechStartup Inc"
  - Phase: 3 (completed 1-2)
  - Trust Score: 60/100
  - Progress: 33% (3/9 phases)
  
✓ Clicking company shows:
  - All phase details
  - Completed items with ✓
  - Next steps highlighted
```

---

## 🔍 What to Check in Browser DevTools

### Network Tab
1. Open DevTools (F12)
2. Click **Network** tab
3. Perform action (e.g., create company)
4. Check requests:
   ```
   ✓ POST /api/companies
   ✓ Status: 200 OK
   ✓ Response contains company ID and phase
   ```

### Console Tab
Check for errors:
```javascript
// Should be NO red errors after actions
// Should see successful API responses
localStorage.getItem('token') // JWT token
localStorage.getItem('companyId') // Current company
```

### Application Tab
- **Storage → localStorage:**
  ```
  token: eyJhbGc...
  userId: user-123
  companyId: company-456
  ```

- **Storage → Cookies:**
  ```
  session: (if server-side sessions enabled)
  ```

### Performance Tab
1. Record performance
2. Create company
3. Check:
   ```
   ✓ Network requests: <1 second each
   ✓ Re-renders: <100ms
   ✓ No memory leaks
   ```

---

## ✅ Complete Test Flow (Start to Finish)

### Estimated Time: 10 minutes

```
1. Signup                              (1 min)
   → /auth/signup → /auth/signup/role → /dashboard/entrepreneur

2. Create Company                      (1 min)
   → /phase-1/create → /dashboard

3. Phase 2 Step 1 (Legal)              (2 min)
   → Fill form → Save → Auto-advance to Step 2

4. Phase 2 Step 2 (Documents)          (2 min)
   → Upload test PDF → Verify in S3

5. Phase 2 Step 3 (Owners)             (1 min)
   → Add 2 owners → Verify in DB

6. Phase 3 Step 1 (Revenue)            (1 min)
   → Enter amounts → Check auto-calculations

7. View Dashboard                      (1 min)
   → See company progress → Check phase status
```

---

## 🐛 Common Issues & Fixes

### "API request failed"
```
✓ Check backend is running: dotnet run
✓ Check MongoDB is running: mongosh
✓ Check .env.local has correct NEXT_PUBLIC_API_BASE_URL
✓ Check network tab for 401/403 (auth issues)
```

### "401 Unauthorized"
```
✓ Token might be expired
✓ Clear localStorage and login again
✓ Check backend JWT secret matches
```

### "Document not uploading"
```
✓ Check S3 credentials in backend .env
✓ Check IAM user has s3:PutObject permission
✓ Check bucket exists and is accessible
```

### "AI Review not starting"
```
✓ Check Hangfire is configured in backend
✓ Check Redis/memory job storage is working
✓ Check background job service logs
```

---

## 📊 What Success Looks Like

After completing all tests:

```
✅ Signup works → Token in localStorage
✅ Company created → Shows in dashboard
✅ Phase 2 data saved → In MongoDB
✅ Document uploaded → In S3
✅ Revenue calculated → Shows ARR/MRR
✅ AI Review completes → Shows score
✅ All phases accessible → Progress bar updates
✅ No console errors → Clean DevTools
✅ Network requests fast → <1s each
```

---

## 📝 Test Results Template

Copy and fill in as you test:

```
Test Results - Date: ____

□ Signup works
  - Token visible: YES/NO
  - Redirected correctly: YES/NO
  - Email stored: YES/NO

□ Company Creation
  - Form renders: YES/NO
  - Submit works: YES/NO
  - Appears in list: YES/NO

□ Phase 2 Step 1
  - Form validates: YES/NO
  - Saves to DB: YES/NO
  - Advances to Step 2: YES/NO

□ Document Upload
  - File accepts: YES/NO
  - Shows progress: YES/NO
  - Uploads to S3: YES/NO

□ Phase 3 Revenue
  - Auto-calculates: YES/NO
  - Values persist: YES/NO
  - Saved to DB: YES/NO

□ Phase 4 Dilution
  - Scenarios show: YES/NO
  - Calculations correct: YES/NO
  - Can switch tabs: YES/NO

□ Phase 7 AI Review
  - Can start job: YES/NO
  - Status updates: YES/NO
  - Shows results: YES/NO

□ Dashboard
  - Shows all companies: YES/NO
  - Progress bar updates: YES/NO
  - Phase status accurate: YES/NO

Overall: ✅ PASS / ⚠️ ISSUES FOUND
```

---

## 🎯 Summary

All 40+ APIs are implemented in the frontend and wired to backend. Test by:

1. **Start backend:** `dotnet run`
2. **Start frontend:** `npm run dev`
3. **Open browser:** http://localhost:3000
4. **Follow test flow** above
5. **Check DevTools** for errors
6. **Verify MongoDB** for data persistence

Everything is **REAL** - not mocked. Actual data flows to database and file storage.
