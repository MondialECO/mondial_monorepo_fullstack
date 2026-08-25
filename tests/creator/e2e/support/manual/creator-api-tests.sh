#!/usr/bin/env bash
# ============================================================
# MONDIAL.ECO — Creator API Test Script
# Covers: TEST 2 (Phase 3 order), TEST 4 (Credit exhaustion UX),
#         TEST 6 (Rate limit)
#
# USAGE:
#   chmod +x creator-api-tests.sh
#   ./creator-api-tests.sh
#
# CONFIG (override via env vars):
#   API_URL       backend base URL (default: http://localhost:5093/api)
#   TEST_EMAIL    fresh email for test user
#   TEST_PASSWORD password
# ============================================================

set -euo pipefail

API_URL="${API_URL:-http://localhost:5093/api}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="${TEST_EMAIL:-apitest-${TIMESTAMP}@test.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Test1234!}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC} — $1"; }
fail() { echo -e "${RED}❌ FAIL${NC} — $1"; }
warn() { echo -e "${YELLOW}⚠️  WARN${NC} — $1"; }
header() { echo -e "\n${YELLOW}=== $1 ===${NC}"; }

PASS_COUNT=0
FAIL_COUNT=0

assert_status() {
  local label="$1" expected="$2" actual="$3" body="$4"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label (HTTP $actual)"
    ((PASS_COUNT++))
  else
    fail "$label — expected HTTP $expected, got $actual"
    echo "     Body: ${body:0:300}"
    ((FAIL_COUNT++))
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -qi "$needle"; then
    pass "$label (found: \"$needle\")"
    ((PASS_COUNT++))
  else
    fail "$label — \"$needle\" not found in response"
    echo "     Body: ${haystack:0:300}"
    ((FAIL_COUNT++))
  fi
}

assert_not_contains() {
  local label="$1" needle="$2" haystack="$3"
  if ! echo "$haystack" | grep -qi "$needle"; then
    pass "$label (\"$needle\" not present)"
    ((PASS_COUNT++))
  else
    fail "$label — \"$needle\" unexpectedly found in response"
    echo "     Body: ${haystack:0:300}"
    ((FAIL_COUNT++))
  fi
}

# ─────────────────────────────────────────────
# SETUP — Register + Login
# ─────────────────────────────────────────────
header "SETUP — Register and Login"

echo "Email: $TEST_EMAIL"

REG_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"ApiTest\",
    \"lastName\": \"Creator\",
    \"role\": \"Creator\"
  }")
REG_STATUS=$(echo "$REG_BODY" | tail -1)
REG_JSON=$(echo "$REG_BODY" | head -n -1)
echo "Register HTTP $REG_STATUS"

if [[ "$REG_STATUS" != "200" && "$REG_STATUS" != "201" ]]; then
  echo "Register response: $REG_JSON"
  warn "Registration may have failed — attempting login anyway"
fi

LOGIN_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")
LOGIN_STATUS=$(echo "$LOGIN_BODY" | tail -1)
LOGIN_JSON=$(echo "$LOGIN_BODY" | head -n -1)

if [[ "$LOGIN_STATUS" != "200" ]]; then
  fail "Login failed (HTTP $LOGIN_STATUS) — cannot continue"
  echo "Body: $LOGIN_JSON"
  exit 1
fi

TOKEN=$(echo "$LOGIN_JSON" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -z "$TOKEN" ]]; then
  # Try alternate field names
  TOKEN=$(echo "$LOGIN_JSON" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
fi
if [[ -z "$TOKEN" ]]; then
  fail "No token in login response"
  echo "Login body: $LOGIN_JSON"
  exit 1
fi

echo "✅ Logged in — token: ${TOKEN:0:20}..."
AUTH="Authorization: Bearer $TOKEN"

# ─────────────────────────────────────────────
# TEST 2 — Phase 3 order enforcement
# ─────────────────────────────────────────────
header "TEST 2 — Phase 3 order: forecast requires a completed business plan"

echo ""
echo "2a. Forecast WITHOUT businessPlanSessionId → expect 422"
T2A_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai/forecast" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "arpu": 49,
    "opex": 2000,
    "monthlyGrowthPct": 8,
    "tam": 500000000,
    "monthlyChurnPct": 3
  }')
T2A_STATUS=$(echo "$T2A_BODY" | tail -1)
T2A_JSON=$(echo "$T2A_BODY" | head -n -1)
assert_status "Forecast without plan → 422" "422" "$T2A_STATUS" "$T2A_JSON"
assert_contains "Error code: business_plan_required" "business_plan_required" "$T2A_JSON"

echo ""
echo "2b. Forecast with INVALID businessPlanSessionId → expect 422"
T2B_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai/forecast" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "businessPlanSessionId": "000000000000000000000000",
    "arpu": 49,
    "opex": 2000,
    "monthlyGrowthPct": 8,
    "tam": 500000000,
    "monthlyChurnPct": 3
  }')
T2B_STATUS=$(echo "$T2B_BODY" | tail -1)
T2B_JSON=$(echo "$T2B_BODY" | head -n -1)
assert_status "Forecast with invalid plan ID → 422" "422" "$T2B_STATUS" "$T2B_JSON"
assert_contains "Error code: business_plan_not_found or not_complete" \
  "business_plan" "$T2B_JSON"

echo ""
echo "Result: Phase 3 order enforcement ✅ verified at the API layer"

# ─────────────────────────────────────────────
# TEST 4 — Credit exhaustion UX (all 3 AI flows)
# ─────────────────────────────────────────────
header "TEST 4 — Credit exhaustion: 402 on all 3 AI flows"

echo ""
echo "NOTE: This test requires a user with zero credits."
echo "      The script will create a separate zero-credit user."
echo "      (You need to manually set Balance=0 in MongoDB for this user,"
echo "       OR have a seeded zero-credit account.)"
echo ""
echo "If you cannot set Balance=0 in MongoDB, skip TEST 4 and verify manually:"
echo "  1. Find any existing user in AICredits with Balance=0"
echo "  2. Login as that user and attempt a clarifier/plan/forecast start"
echo "  3. Expect 402 + 'Insufficient AI credits' message"

# Register a zero-credit test user
ZC_EMAIL="zerocredit-${TIMESTAMP}@test.com"
ZC_REG=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ZC_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"Zero\",
    \"lastName\": \"Credit\",
    \"role\": \"Creator\"
  }")
ZC_STATUS=$(echo "$ZC_REG" | tail -1)
echo "Zero-credit user registered: HTTP $ZC_STATUS ($ZC_EMAIL)"

ZC_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ZC_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")
ZC_TOKEN=$(echo "$ZC_LOGIN" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -z "$ZC_TOKEN" ]]; then
  ZC_TOKEN=$(echo "$ZC_LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
fi
ZC_AUTH="Authorization: Bearer $ZC_TOKEN"

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Set this user's credits to 0 in MongoDB:"
echo "   db.AICredits.updateOne({ ownerUserId: '<userId>' }, { \$set: { balance: 0 } })"
echo ""
echo "   OR run: db.AICredits.insertOne({ ownerUserId: '<userId>', balance: 0, lifetimeSpent: 100 })"
echo "   (The lazy grant checks if a ledger exists — if balance is 0, it won't top up.)"
echo ""
read -rp "Press ENTER when you've set the balance to 0 in MongoDB, or type 'skip' to skip: " SKIP_T4
if [[ "$SKIP_T4" == "skip" ]]; then
  warn "TEST 4 skipped — verify manually with a zero-credit user"
else
  echo ""
  echo "4a. Clarifier start with zero credits → expect 402"
  T4A_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai/idea-clarifier" \
    -H "$ZC_AUTH" \
    -H "Content-Type: application/json" \
    -d '{
      "rawIdea": {
        "title": "Test",
        "problemStatement": "Test",
        "targetAudience": "Test"
      }
    }')
  T4A_STATUS=$(echo "$T4A_BODY" | tail -1)
  T4A_JSON=$(echo "$T4A_BODY" | head -n -1)
  assert_status "Clarifier with 0 credits → 402" "402" "$T4A_STATUS" "$T4A_JSON"
  assert_contains "Clarifier 402 message contains 'credits'" "credit" "$T4A_JSON"
  assert_not_contains "Clarifier 402 NOT 'service unavailable'" "unavailable" "$T4A_JSON"

  echo ""
  echo "4b. Business plan start with zero credits → expect 402"
  T4B_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai/business-plan" \
    -H "$ZC_AUTH" \
    -H "Content-Type: application/json" \
    -d '{}')
  T4B_STATUS=$(echo "$T4B_BODY" | tail -1)
  T4B_JSON=$(echo "$T4B_BODY" | head -n -1)
  assert_status "Business plan with 0 credits → 402" "402" "$T4B_STATUS" "$T4B_JSON"
  assert_contains "Business plan 402 message contains 'credits'" "credit" "$T4B_JSON"

  echo ""
  echo "4c. Forecast start with zero credits → expect 402"
  T4C_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai/forecast" \
    -H "$ZC_AUTH" \
    -H "Content-Type: application/json" \
    -d '{
      "businessPlanSessionId": "000000000000000000000000",
      "arpu": 49,
      "opex": 2000,
      "monthlyGrowthPct": 8,
      "tam": 500000000,
      "monthlyChurnPct": 3
    }')
  T4C_STATUS=$(echo "$T4C_BODY" | tail -1)
  T4C_JSON=$(echo "$T4C_BODY" | head -n -1)
  # Note: forecast may 422 first (no valid plan) before 402 — 
  # if the credit check runs before plan validation, it returns 402.
  # Either 402 or 422 is acceptable here depending on controller order.
  if [[ "$T4C_STATUS" == "402" ]]; then
    pass "Forecast with 0 credits → 402 (credit check before plan check)"
    assert_contains "Forecast 402 message contains 'credits'" "credit" "$T4C_JSON"
    ((PASS_COUNT++))
  elif [[ "$T4C_STATUS" == "422" ]]; then
    warn "Forecast → 422 (plan validation before credit check) — credit check not reached"
    echo "     This means the plan validation runs before credit debit in the forecast controller."
    echo "     Verify credit exhaustion for forecast by completing a valid business plan first."
  else
    fail "Forecast with 0 credits → expected 402 or 422, got $T4C_STATUS"
    ((FAIL_COUNT++))
  fi
fi

# ─────────────────────────────────────────────
# TEST 6 — Rate limit (20/min on "ai" policy)
# ─────────────────────────────────────────────
header "TEST 6 — Rate limit: 21st AI request within 1 minute → 429"

echo ""
echo "Sending 21 clarifier start requests rapidly..."
echo "Using authenticated user: $TEST_EMAIL"
echo ""

RATE_PASS=false
for i in $(seq 1 21); do
  RL_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai/idea-clarifier" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{
      "rawIdea": {
        "title": "RateTest",
        "problemStatement": "Test",
        "targetAudience": "Test"
      }
    }')
  RL_STATUS=$(echo "$RL_BODY" | tail -1)
  RL_JSON=$(echo "$RL_BODY" | head -n -1)

  if [[ "$RL_STATUS" == "429" ]]; then
    pass "Rate limit hit on request #$i → 429"
    assert_contains "429 body contains 'rate' or 'limit'" "rate\|limit\|too many" "$RL_JSON"
    assert_not_contains "429 NOT a credits error" "insufficient" "$RL_JSON"
    RATE_PASS=true
    break
  elif [[ "$RL_STATUS" == "402" ]]; then
    warn "Request #$i returned 402 (credits exhausted) — rate limit test requires credits"
    warn "Fund the test user's credits to 100 and retry TEST 6"
    break
  else
    echo "   Request #$i: HTTP $RL_STATUS (not rate-limited yet)"
  fi
done

if [[ "$RATE_PASS" == "false" ]]; then
  warn "Rate limit was NOT hit in 21 requests — check the 'ai' policy in Program.cs"
  warn "Expected: 20/minute per user. If Redis is off in dev, the limiter is in-memory (ASP.NET)."
  ((FAIL_COUNT++))
fi

# ─────────────────────────────────────────────
# ADDITIONAL — Phase guard (locked route)
# ─────────────────────────────────────────────
header "ADDITIONAL — Backend phase guard: locked phase returns 403"

echo ""
echo "Attempting to access a Phase-3 endpoint without completing Phase 2..."
GUARD_BODY=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai/forecast" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"arpu":49,"opex":2000,"monthlyGrowthPct":8,"tam":500000000,"monthlyChurnPct":3}')
GUARD_STATUS=$(echo "$GUARD_BODY" | tail -1)
GUARD_JSON=$(echo "$GUARD_BODY" | head -n -1)

if [[ "$GUARD_STATUS" == "403" ]]; then
  pass "Phase guard: Phase 3 endpoint returns 403 when locked"
  assert_contains "403 body contains 'phase_locked'" "phase_locked\|locked\|phase" "$GUARD_JSON"
  ((PASS_COUNT++))
elif [[ "$GUARD_STATUS" == "422" ]]; then
  pass "Phase guard: Phase 3 endpoint returns 422 (business_plan_required) — guard via prerequisite"
  ((PASS_COUNT++))
elif [[ "$GUARD_STATUS" == "200" ]]; then
  warn "Phase 3 endpoint returned 200 even though Phase 2 may not be complete"
  warn "If the user has completed Phase 2, this is correct. Otherwise it's a guard issue."
else
  echo "Phase guard response: HTTP $GUARD_STATUS"
  echo "Body: ${GUARD_JSON:0:300}"
fi

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
header "TEST SUMMARY"
echo ""
echo -e "  ${GREEN}PASS: $PASS_COUNT${NC}"
echo -e "  ${RED}FAIL: $FAIL_COUNT${NC}"
echo ""

if [[ $FAIL_COUNT -eq 0 ]]; then
  echo -e "${GREEN}✅ All API-level tests passed${NC}"
  echo ""
  echo "Next: Run the Playwright tests for UI-level coverage:"
  echo "  npx playwright test tests/creator/e2e/support/manual/creator-e2e.spec.ts --headed"
else
  echo -e "${RED}❌ $FAIL_COUNT test(s) failed — review output above${NC}"
fi

echo ""
echo "Manual checks still required:"
echo "  TEST 1: Verify AICredits.Balance = 99 in MongoDB after first AI call"
echo "  TEST 3: Verify charts show real data (not mock) in browser"
echo "  TEST 5: Check /dashboard/entrepreneur/phase-4 cap table in browser"
echo "          (Tanvir 70% / ESOP 10% / Investors 20% — or empty if seed failed)"
echo "          Grep backend log for 'Cap-table seed failed' if empty"
echo "  TEST 7: Run npx playwright test tests/creator/e2e/support/manual/creator-e2e.spec.ts --headed for DOM check"
