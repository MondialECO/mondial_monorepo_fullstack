# System Architecture — Mondial

High-level overview of the 9-phase entrepreneur onboarding system, API architecture, and data flow.

## System Overview

Mondial is a SaaS platform connecting entrepreneurs with investors through an AI-powered matching engine. The system guides entrepreneurs through 9 phases of company setup and investor engagement.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mondial Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Next.js 16 + React 19 + Tailwind)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Homepage  │  Auth (Login/Signup)                    │   │
│  │  Dashboard │  Role-based UI (Founder/Advisor/etc)    │   │
│  │  9-Phase   │  Entrepreneur Onboarding Flow           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕ (HTTP/REST)                      │
│  Backend (ASP.NET Core 8 + MongoDB)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication Service  (JWT)                       │   │
│  │  Company Service         (Phases 1-4)                │   │
│  │  Advisor Matching        (Phase 5)                   │   │
│  │  Data Room Management    (Phase 6)                   │   │
│  │  AI Review Engine        (Phase 7)                   │   │
│  │  Investor Matching       (Phase 8)                   │   │
│  │  Deal Execution Service  (Phase 9)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕ (MongoDB)                        │
│  Data Layer (MongoDB Atlas)                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  users, companies, dataRooms, deals, interactions   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 9-Phase Entrepreneur Flow

### Phase 1: Company Basics
- Create company profile (name, industry, stage)
- Upload company logo
- Locked: Until Phase 1 complete
- **Endpoints:** POST /companies/create, POST /companies/{id}/update-logo

### Phase 2: Legal Information
- Upload incorporation documents (certificate of incorporation, bylaws)
- Select legal structure (LLC, C-Corp, etc.)
- Add company registration number
- Locked: Until Phase 2 complete
- **Endpoints:** POST /companies/{id}/update-legal, POST /documents/upload

### Phase 3: Financial Metrics
- Revenue information (annual, monthly recurring)
- Gross margin %
- Customer metrics (CAC, LTV)
- Locked: Until Phase 3 complete
- **Endpoints:** POST /companies/{id}/revenue, POST /companies/{id}/valuation

### Phase 4: Cap Table & Dilution
- Add shareholders (founders, employees, investors)
- Ownership percentages
- Calculate dilution scenarios
- Locked: Until Phase 4 complete
- **Endpoints:** GET /companies/{id}/cap-table, POST /companies/{id}/cap-table

### Phase 5: Advisor Matching
- AI-powered advisor matching based on company profile
- Locked: Until Phase 4 complete
- Status: Under development
- **Endpoints:** GET /advisors/matches (future)

### Phase 6: Data Room
- Upload company documents (financial statements, contracts, etc.)
- Grant investor access with NDA requirement
- Track document access logs
- Locked: Until Phase 5 complete
- **Endpoints:** POST /dataroom/documents, POST /dataroom/access, GET /dataroom

### Phase 7: AI Review
- AI engine reviews company profile
- Generates investment recommendation score
- Identifies data gaps and improvement suggestions
- Locked: Until Phase 6 complete
- **Endpoints:** POST /companies/{id}/ai-review, GET /companies/{id}/ai-review-status

### Phase 8: Investor Matching
- Background job matches company with investor profiles
- Display matched investors with compatibility scores
- Log investor interactions (calls, emails, meetings)
- Locked: Until Phase 7 complete
- **Endpoints:** GET /investor-matches, POST /investor-interaction, POST /jobs/{id}/investor-matching

### Phase 9: Deal Execution
- Create deal with selected investor
- Manage term sheet (valuation, equity %, pro-rata rights)
- Track closing checklist (legal review, board approval, funding received)
- Close deal and record completion
- Locked: Until Phase 8 complete
- **Endpoints:** POST /deals, GET /deals/{id}, PUT /deals/{id}/term-sheet, POST /deals/{id}/close

## API Architecture

### Authentication Flow

```
1. User submits email + password → POST /auth/login
2. Backend validates credentials against MongoDB users collection
3. Backend generates JWT token (exp: 7 days)
4. Frontend stores token in localStorage (or httpOnly cookie)
5. All subsequent requests include: Authorization: Bearer <token>
6. Backend validates token on each request (via middleware)
7. On expiry, user redirected to login
```

### Request/Response Pattern

All API endpoints follow REST conventions:

```
Request:
POST /companies/1/revenue
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "annualRevenue": 500000,
  "monthlyRecurring": 45000,
  "customerCount": 250
}

Response (200 OK):
{
  "id": "company-1",
  "phase": 3,
  "revenue": {
    "annualRevenue": 500000,
    "monthlyRecurring": 45000,
    "customerCount": 250,
    "updatedAt": "2026-05-21T10:30:00Z"
  }
}
```

### Error Handling

| Status | Scenario | Response |
|--------|----------|----------|
| 200 | Success | `{ success: true, data: {...} }` |
| 201 | Created | `{ success: true, data: {...}, id: "..." }` |
| 400 | Invalid input | `{ error: "Invalid email format", code: "VALIDATION_ERROR" }` |
| 401 | Unauthorized | `{ error: "Token expired", code: "UNAUTHORIZED" }` |
| 403 | Forbidden | `{ error: "Access denied", code: "FORBIDDEN" }` |
| 404 | Not found | `{ error: "Company not found", code: "NOT_FOUND" }` |
| 409 | Conflict | `{ error: "Email already registered", code: "CONFLICT" }` |
| 500 | Server error | `{ error: "Internal server error", code: "SERVER_ERROR" }` |

### Rate Limiting

- **Limit:** 100 requests per minute per user
- **Headers:**
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1726873200`
- **Exceeded:** Returns 429 Too Many Requests

## Data Models

### User Collection
```typescript
interface User {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: "founder" | "advisor" | "investor" | "admin";
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Company Collection
```typescript
interface Company {
  _id: ObjectId;
  userId: ObjectId;  // Founder
  currentPhase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  currentStep: number;
  name: string;
  industry: string;
  stage: "idea" | "seed" | "series-a" | "series-b";
  logo?: string;
  legalInfo?: {
    incorporationDate: Date;
    structure: "llc" | "c-corp" | "s-corp";
    registrationNumber: string;
  };
  financials?: {
    annualRevenue: number;
    monthlyRecurring: number;
    grossMargin: number;
    customerLTV: number;
    customerCAC: number;
  };
  capTable?: CapTableEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Deal Collection
```typescript
interface Deal {
  _id: ObjectId;
  companyId: ObjectId;
  investorId: ObjectId;
  status: "draft" | "term-sheet" | "closing" | "closed";
  termSheet: {
    amount: number;
    valuation: number;
    equityPercent: number;
    proRataRights: boolean;
    liquidationPreference: "1x" | "non-participating";
  };
  closingChecklist: {
    item: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  createdAt: Date;
  closedAt?: Date;
}
```

### Data Room Collection
```typescript
interface DataRoom {
  _id: ObjectId;
  companyId: ObjectId;
  documents: {
    fileId: string;
    fileName: string;
    category: "financial" | "legal" | "product" | "team";
    uploadedAt: Date;
    size: number;
  }[];
  accessGrants: {
    investorId: ObjectId;
    grantedAt: Date;
    expiresAt?: Date;
    requiresNda: boolean;
  }[];
  ndaRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Performance Optimization

### Frontend (Next.js)

1. **Server Components by default:** Static content rendered on server, only interactive leaves use `"use client"`
2. **React Compiler enabled:** Automatic memoization, no manual `useMemo` needed
3. **Code splitting:** Heavy modules (editor, charts) imported dynamically
4. **Image optimization:** All images use `next/image` with lazy loading
5. **Bundle size:** Target <200KB (gzipped) for initial page load

### Backend (ASP.NET Core)

1. **Connection pooling:** MongoDB connection reused across requests
2. **Caching:** Redis for frequently accessed data (investor matches, company profiles)
3. **Async/await:** Non-blocking I/O for database queries
4. **Pagination:** Limit 50 docs per API call, support offset/limit
5. **Indexing:** Indexes on userId, companyId, status for fast queries

### Database (MongoDB)

1. **Indexes:** `{ userId: 1 }`, `{ companyId: 1 }`, `{ status: 1 }`
2. **Schema validation:** JSON schema enforced on collection level
3. **TTL indexes:** Auto-delete sessions after 30 days
4. **Sharding:** By companyId for horizontal scaling at 1M+ companies

## Deployment Architecture

### Staging Environment

- **Frontend:** Vercel (automatic deploy on main branch)
- **Backend:** AWS EC2 (Docker container)
- **Database:** MongoDB Atlas (staging cluster)
- **URL:** https://staging.mondial.eco

### Production Environment

- **Frontend:** Vercel (manual deploy trigger)
- **Backend:** AWS EC2 (Docker container + load balancer)
- **Database:** MongoDB Atlas (production cluster with backups)
- **URL:** https://mondial.eco
- **DNS:** CloudFlare for caching + DDoS protection

## Security Measures

1. **JWT tokens:** Signed with RS256, 7-day expiry
2. **HTTPS only:** All traffic encrypted in transit
3. **CORS:** Allow only `mondial.eco` domain
4. **Password hashing:** bcrypt with 12 rounds
5. **SQL injection prevention:** Parameterized queries (not applicable to MongoDB, but input validation enforced)
6. **XSS prevention:** CSP headers, sanitized user input, React escaping
7. **Rate limiting:** 100 req/min per user
8. **Data encryption:** At rest via MongoDB encryption, in transit via TLS

## Monitoring & Observability

1. **Error tracking:** Sentry for frontend/backend errors
2. **Performance monitoring:** Vercel Analytics for frontend, DataDog for backend
3. **Log aggregation:** CloudWatch for centralized logs
4. **Uptime monitoring:** Ping service checks 1x/min
5. **Alerts:** Slack notifications for errors >error rate threshold
