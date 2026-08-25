# ============================================================
# MONDIAL.ECO - Creator AI API test harness (PowerShell)
# Works on Windows PowerShell 5.1 AND PowerShell 7+ (no '??', pure ASCII).
#
# Run the backend (dotnet run in /backend) + MongoDB first, then:
#   cd tests
#   powershell -ExecutionPolicy Bypass -File .\creator\e2e\support\manual\creator-api-tests.ps1
#   powershell -ExecutionPolicy Bypass -File .\creator\e2e\support\manual\creator-api-tests.ps1 -Demo   # use the demo account directly
#
# Auth fallback: if register / login / the universal-phase gate blocks the
# fresh account, the harness automatically falls back to the demo account
# (demo.creator@local.com). Pass -Demo to start with it.
#
# Covers: TEST 1 (lazy grant), TEST 2 (forecast 422), TEST 6 (rate 429),
#         TEST 4 (credit exhaustion -> 402, semi-manual Mongo step).
# UI-only: TEST 3 / 5 / 7 need a browser.
# Env overrides: API_URL, TEST_EMAIL, TEST_PASSWORD
# ============================================================
param([switch]$Demo)

$API_URL       = if ($env:API_URL)       { $env:API_URL }       else { "http://localhost:5093/api" }
$API_URL       = $API_URL.TrimEnd("/")
$STAMP         = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$TEST_EMAIL    = if ($env:TEST_EMAIL)     { $env:TEST_EMAIL }    else { "apitest-$STAMP@test.com" }
$TEST_PASSWORD = if ($env:TEST_PASSWORD)  { $env:TEST_PASSWORD } else { "Test1234!" }
$DEMO_EMAIL    = 'demo.creator@local.com'
$DEMO_PASSWORD = 'demo.creator@local.comA1'

$script:PASS = 0; $script:FAIL = 0; $script:SKIP = 0

function H($m)   { Write-Host "`n=== $m ===" -ForegroundColor Cyan }
function Ok($m)  { Write-Host "  PASS  $m" -ForegroundColor Green;  $script:PASS++ }
function No($m)  { Write-Host "  FAIL  $m" -ForegroundColor Red;    $script:FAIL++ }
function Sk($m)  { Write-Host "  SKIP  $m" -ForegroundColor Yellow; $script:SKIP++ }
function Note($m){ Write-Host "  $m" -ForegroundColor Gray }

# Cross-version request: returns @{ Status; Json; Raw } and NEVER throws on 4xx/5xx.
function Api($method, $path, $body, $token) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $json = $null
  if ($null -ne $body) { $json = ($body | ConvertTo-Json -Depth 10) }
  try {
    $r = Invoke-WebRequest -Method $method -Uri "$API_URL$path" -Headers $headers -Body $json -UseBasicParsing -ErrorAction Stop
    $j = $null; if ($r.Content) { try { $j = $r.Content | ConvertFrom-Json } catch { $j = $null } }
    return @{ Status = [int]$r.StatusCode; Json = $j; Raw = "$($r.Content)" }
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { return @{ Status = 0; Json = $null; Raw = $_.Exception.Message } }
    $code = 0; try { $code = [int]$resp.StatusCode } catch { $code = 0 }
    $raw = ""; if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $raw = $_.ErrorDetails.Message }
    $j = $null; if ($raw) { try { $j = $raw | ConvertFrom-Json } catch { $j = $null } }
    return @{ Status = $code; Json = $j; Raw = $raw }
  }
}

function Data($r) { if ($r.Json -and ($r.Json.PSObject.Properties.Name -contains "data")) { $r.Json.data } else { $r.Json } }

# Tolerant register (ignores "already in use") then login. Returns @{token;userid;email} or $null.
function Authenticate($email, $pass, $label) {
  Note "Auth ($label): $email"
  $reg = Api "POST" "/auth/register" @{ name = "Tanvir Ahmed"; email = $email; password = $pass; user = "Creator" } $null
  if ($reg.Status -eq 201 -or $reg.Status -eq 200) { Note "  registered new account." }
  elseif ($reg.Raw -match "already in use|in use|exists") { Note "  account exists - logging in." }
  else { Note "  register HTTP $($reg.Status) ($($reg.Json.message)) - trying login anyway." }
  $login = Api "POST" "/auth/login" @{ email = $email; password = $pass } $null
  if ($login.Status -ne 200) { Note "  login failed HTTP $($login.Status): $($login.Json.message)"; return $null }
  $tok = (Data $login).token
  $uid = (Data $login).user.id; if (-not $uid) { $uid = (Data $login).user.Id }
  if (-not $tok) { Note "  login ok but no token in response."; return $null }
  return @{ token = $tok; userid = $uid; email = $email }
}

function Start-Clarifier($token) {
  Api "POST" "/ai/idea-clarifier" @{ rawIdea = @{
    title = "AutoInvoice";
    problemStatement = "Freelancers lose time and money chasing unpaid invoices.";
    targetAudience = "Freelancers and independent contractors";
    existingAlternatives = "Manual reminders or pricey enterprise tools";
    description = "Automated multi-channel reminders, escalating templates, one-click legal letters." } } $token
}

Write-Host "`nMondial Creator AI - API harness" -ForegroundColor Cyan
Note "API: $API_URL"

# ---- preflight ----
$ping = Api "GET" "/ai/usage" $null $null   # 401 = up; 0 = down
if ($ping.Status -eq 0) { No "Backend unreachable at $API_URL - start it with 'dotnet run' in /backend. Aborting."; exit 1 }
Note "Backend reachable (HTTP $($ping.Status) on /ai/usage)."

# ---- auth (with demo fallback) ----
H "SETUP - authenticate"
if ($Demo) { $TEST_EMAIL = $DEMO_EMAIL; $TEST_PASSWORD = $DEMO_PASSWORD }
$auth = Authenticate $TEST_EMAIL $TEST_PASSWORD "primary"
if (-not $auth -and $TEST_EMAIL -ne $DEMO_EMAIL) {
  Note "Primary auth failed - falling back to demo account."
  $auth = Authenticate $DEMO_EMAIL $DEMO_PASSWORD "demo-fallback"
}
if (-not $auth) { No "Could not authenticate (primary or demo). Aborting."; exit 1 }
$TOKEN = $auth.token; $USERID = $auth.userid
Note "Authenticated as $($auth.email) (userId $USERID)"

# ===================== TEST 1 - Credits lazy grant =====================
H "TEST 1 - Credits lazy grant"
$clar = Start-Clarifier $TOKEN
# Universal-phase / onboarding gate -> fall back to the demo account and retry once.
if (($clar.Status -eq 401 -or $clar.Status -eq 403) -and $auth.email -ne $DEMO_EMAIL) {
  Note "AI call gated (HTTP $($clar.Status)) - likely universal-phase. Falling back to demo account."
  $d = Authenticate $DEMO_EMAIL $DEMO_PASSWORD "demo-fallback"
  if ($d) { $auth = $d; $TOKEN = $d.token; $USERID = $d.userid; $clar = Start-Clarifier $TOKEN }
}
Note "POST /ai/idea-clarifier -> HTTP $($clar.Status)"
if ($clar.Status -eq 200) {
  Note "Clarifier session: $((Data $clar).sessionId)"
  $u = Api "GET" "/ai/usage" $null $TOKEN
  $bal = [int](Data $u).creditBalance; $grant = [int](Data $u).lifetimeGranted; $spent = [int](Data $u).lifetimeSpent
  Note "Usage: lifetimeGranted=$grant lifetimeSpent=$spent creditBalance=$bal"
  # Robust for fresh AND reused accounts: grant is the 100 starter (idempotent),
  # balance must equal granted-spent, and at least this run's clarifier was debited.
  if ($grant -eq 100 -and $bal -eq ($grant - $spent) -and $spent -ge 1) {
    if ($bal -eq 99) { Ok "TEST 1: fresh account - lazy grant 100, debited 1 -> balance 99." }
    else { Ok "TEST 1: lazy grant=100 confirmed; ledger consistent (spent=$spent, balance=$bal). [reused account]" }
  } else { No "TEST 1: invariant broken - expected granted=100 and balance=granted-spent; got granted=$grant spent=$spent balance=$bal." }
}
elseif ($clar.Status -eq 402) { No "TEST 1: 402 on FIRST AI call - lazy grant did NOT fire (or reused account already at 0)." }
elseif ($clar.Status -eq 503) { Sk "TEST 1: 503 (AI disabled or provider/key issue) - not a credits failure. Check Ai:Enabled + OpenRouter key." }
elseif ($clar.Status -eq 401 -or $clar.Status -eq 403) { No "TEST 1: $($clar.Status) gate even on demo account - onboarding/universal-phase blocks AI. $($clar.Json.message)" }
else { No "TEST 1: unexpected HTTP $($clar.Status): $($clar.Raw)" }

# ===================== TEST 2 - Phase-3 order guard =====================
H "TEST 2 - forecast requires a business plan"
$f1 = Api "POST" "/ai/forecast" @{ arpu = 49; opex = 2000; monthlyGrowthPct = 8; tam = 500000000; monthlyChurnPct = 3 } $TOKEN
Note "POST /ai/forecast (no businessPlanSessionId) -> HTTP $($f1.Status)"
if ($f1.Status -eq 422 -and $f1.Raw -match "business_plan_required") { Ok "TEST 2: 422 business_plan_required." }
elseif ($f1.Status -eq 422) { Ok "TEST 2: 422 (msg: $($f1.Raw)) - rejected without a plan." }
else { No "TEST 2: expected 422, got HTTP $($f1.Status): $($f1.Raw)" }

$f2 = Api "POST" "/ai/forecast" @{ businessPlanSessionId = "000000000000000000000000"; arpu = 49; opex = 2000; monthlyGrowthPct = 8; tam = 500000000; monthlyChurnPct = 3 } $TOKEN
if ($f2.Status -eq 422) { Ok "TEST 2b: invalid plan id -> 422 ($($f2.Json.message))." } else { No "TEST 2b: expected 422, got $($f2.Status)." }

# ===================== TEST 6 - Rate limit (20/min) =====================
H "TEST 6 - ai rate limit = 20/min/user (forecast: 422 fast, no credits/OpenRouter burned)"
$codes = @()
for ($i = 1; $i -le 21; $i++) {
  $r = Api "POST" "/ai/forecast" @{ arpu = 1; opex = 1; monthlyGrowthPct = 1; tam = 1; monthlyChurnPct = 1 } $TOKEN
  $codes += $r.Status
  if ($r.Status -eq 429) { break }
}
$first429 = [Array]::IndexOf($codes, 429) + 1
Note ("Statuses: " + ($codes -join ","))
if ($codes -contains 429) { Ok "TEST 6: 429 at request #$first429 - limiter active (distinct from 402)." }
else { No "TEST 6: no 429 in 21 calls - check the ai policy (20/min) in Program.cs." }

# ===================== TEST 4 - Credit exhaustion (semi-manual) =====================
H "TEST 4 - credit exhaustion -> 402 (NOT 503), no retry in UI"
Note "Set this user's Balance=0 in Mongo, then continue:"
Write-Host ""
Write-Host "  mongosh `"<your-mongo-uri>`" --eval `"db.getSiblingDB('MondialEcoDev').AICredits.updateOne({ OwnerUserId: '$USERID' }, { `$set: { Balance: NumberInt(0) } })`"" -ForegroundColor White
Write-Host ""
$ans = Read-Host "Press ENTER after Balance=0 is set to assert 402, or type 'skip'"
if ($ans -and $ans.ToLower() -eq "skip") {
  Sk "TEST 4: skipped (run the mongosh line above, then re-run with TEST_EMAIL=$($auth.email))."
} else {
  $z = Start-Clarifier $TOKEN
  Note "Clarifier at zero balance -> HTTP $($z.Status): $($z.Json.message)"
  if ($z.Status -eq 402 -and $z.Raw -notmatch "unavailable") { Ok "TEST 4: 402 insufficient credits (not 503)." }
  elseif ($z.Status -eq 503) { No "TEST 4: 503 - provider-billing path; local zero-balance should be 402." }
  else { No "TEST 4: expected 402, got HTTP $($z.Status). (Did Balance=0 persist? fields are OwnerUserId/Balance.)" }
}

# ===================== summary =====================
H "SUMMARY"
Write-Host ("  pass={0}  fail={1}  skip={2}" -f $script:PASS, $script:FAIL, $script:SKIP) -ForegroundColor Cyan
Note "Account: $($auth.email)  (userId $USERID)"
Note "UI-only next: TEST 3 (full AI flow + real charts), TEST 5 (Level-Up + bridge), TEST 7 (dashboard de-mock)."
if ($script:FAIL -gt 0) { Write-Host "  OVERALL: FAIL" -ForegroundColor Red; exit 1 }
Write-Host "  OVERALL: PASS (API subset)" -ForegroundColor Green; exit 0
