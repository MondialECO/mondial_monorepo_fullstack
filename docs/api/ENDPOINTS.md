# API Documentation

## Overview

The Mondial API is a RESTful API built with ASP.NET Core 8.0 and MongoDB. All endpoints require authentication via JWT tokens.

**Base URL:** `https://api.mondialbusiness.eu/api`

## Authentication

### JWT Bearer Token
All requests must include the Authorization header:
```
Authorization: Bearer {token}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["Entrepreneur"]
  }
}
```

---

## Company Endpoints

### Get Current Phase
```http
GET /companies/current-phase
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "companyId": "comp-123",
  "currentPhase": 2,
  "completedPhases": [1],
  "overallProgressPercent": 25,
  "trustScore": 50,
  "isInvestorReady": false,
  "createdAt": "2025-05-21T10:00:00Z",
  "lastUpdatedAt": "2025-05-21T11:00:00Z"
}
```

### Create Company (Phase 1)
```http
POST /companies
Content-Type: application/json
Authorization: Bearer {token}

{
  "companyName": "Tech Startup Inc",
  "industry": "SaaS",
  "website": "https://techstartup.com",
  "tagline": "Building the future"
}
```

**Response:** `201 Created`

### Get Company
```http
GET /companies/{companyId}
Authorization: Bearer {token}
```

### Update Legal Info (Phase 2)
```http
POST /companies/{companyId}/legal
Content-Type: application/json
Authorization: Bearer {token}

{
  "legalName": "Tech Startup LLC",
  "registrationNumber": "REG-123456",
  "legalStructure": "LLC",
  "incorporationDate": "2023-01-15",
  "registeredAddress": "123 Tech St, SF",
  "country": "USA",
  "nafCode": "6201Z"
}
```

### Upload Document (Phase 2)
```http
POST /companies/{companyId}/documents
Content-Type: multipart/form-data
Authorization: Bearer {token}

- documentType: "articles_of_incorporation"
- fileName: "articles.pdf"
- fileContent: <binary>
```

### Save Revenue Data (Phase 3)
```http
POST /companies/{companyId}/revenue
Content-Type: application/json
Authorization: Bearer {token}

{
  "q1Revenue": 10000,
  "q2Revenue": 15000,
  "q3Revenue": 20000,
  "q4Revenue": 25000
}
```

### Calculate Valuation (Phase 3)
```http
POST /companies/{companyId}/valuation
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "totalRevenue": 70000,
  "finalValuation": 5000000,
  "monthlyRecurringRevenue": 5833.33,
  "annualRecurringRevenue": 70000,
  "runwayMonths": 24,
  "growthRate": 25.0,
  "lastUpdatedAt": "2025-05-21T11:00:00Z"
}
```

### Get Cap Table (Phase 4)
```http
GET /companies/{companyId}/cap-table
Authorization: Bearer {token}
```

---

## Investor Endpoints

### Get Matched Investors (Phase 8)
```http
GET /companies/{companyId}/investors/matches
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "inv-123",
    "name": "Tech Ventures Fund",
    "firmName": "Tech Ventures",
    "minCheckSize": 50000,
    "maxCheckSize": 1000000,
    "matchScore": 85,
    "preferredSectors": ["SaaS", "AI"],
    "preferredStages": ["Seed", "Series A"]
  }
]
```

### Log Investor Interaction (Phase 8)
```http
POST /companies/{companyId}/investors/{investorId}/interaction
Content-Type: application/json
Authorization: Bearer {token}

{
  "type": "call",
  "notes": "Initial discussion about investment opportunity"
}
```

---

## Data Room Endpoints

### Upload Data Room Document (Phase 6)
```http
POST /companies/{companyId}/dataroom/documents
Content-Type: multipart/form-data
Authorization: Bearer {token}

- documentType: "financial_statements"
- category: "financial"
- fileName: "2024_financial_statements.pdf"
- fileContent: <binary>
```

### Get Data Room Status (Phase 6)
```http
GET /companies/{companyId}/dataroom/status
Authorization: Bearer {token}
```

### Grant Data Room Access (Phase 6)
```http
POST /companies/{companyId}/dataroom/access
Content-Type: application/json
Authorization: Bearer {token}

{
  "investorId": "inv-123",
  "accessLevel": "read",
  "expirationDays": 30
}
```

---

## Deal Endpoints

### Create Deal (Phase 9)
```http
POST /companies/{companyId}/deals
Content-Type: application/json
Authorization: Bearer {token}

{
  "investorId": "inv-123",
  "amount": 1000000,
  "valuation": 10000000,
  "equityPercentage": 10,
  "termSheet": {
    "proRataRights": true,
    "liquidationPreference": 1.0
  }
}
```

### Get Deal
```http
GET /deals/{dealId}
Authorization: Bearer {token}
```

### Update Term Sheet (Phase 9)
```http
PUT /deals/{dealId}/term-sheet
Content-Type: application/json
Authorization: Bearer {token}

{
  "amount": 1250000,
  "valuation": 12500000,
  "equityPercentage": 10
}
```

### Progress Checklist (Phase 9)
```http
POST /deals/{dealId}/checklist
Content-Type: application/json
Authorization: Bearer {token}

{
  "itemId": "checklist-1",
  "completed": true
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Validation failed",
  "message": "Company name is required",
  "statusCode": 400
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

---

## Rate Limiting

- **Limit:** 100 requests per minute
- **Header:** `X-RateLimit-Remaining`
- **Reset:** Hourly

---

## Pagination

List endpoints support pagination:
```http
GET /companies?skip=0&limit=20
```

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "skip": 0,
  "limit": 20
}
```

---

## Webhooks

### Configure Webhook
```http
POST /webhooks
Content-Type: application/json
Authorization: Bearer {token}

{
  "url": "https://yourapp.com/webhooks/mondiai",
  "events": ["deal.created", "company.phase_completed"]
}
```

### Webhook Events
- `company.created`
- `company.phase_completed`
- `deal.created`
- `deal.signed`
- `document.uploaded`
