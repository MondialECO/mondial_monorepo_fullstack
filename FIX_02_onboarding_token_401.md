# Fix 02 — Signup Onboarding 401 Loop (P0)

Scope: onboarding-token validation only. AI / SignalR / messaging / notifications / deals / matching / service-provider / entrepreneur-dashboard untouched.

## SECTION A — Root Cause

**Inbound JWT claim remapping renamed the `email` claim, so the validator read it as null.**

Generation — `JwtTokenHelper.GenerateOnboardingToken` writes these claims:
`sub`, `email` (raw short name), `ClaimTypes.Role` (long URI), `token_type`, `jti`.
The emitted token payload (captured live) contains exactly:
`["sub", "email", "http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "token_type", "jti", "exp", "iss", "aud"]`.

Validation — `AuthController.ValidateOnboardingToken` read claims via
`JwtSecurityTokenHandler`, which inherits the process-wide
`DefaultMapInboundClaims = true` (the code comment in that method even says so).
With inbound mapping on, the handler rewrites known short claim names to the long
`ClaimTypes.*` URIs **when the token is read back**:
- `"sub"` → `ClaimTypes.NameIdentifier`
- `"email"` → `ClaimTypes.Email`

The controller already compensated for `sub` (it falls back to
`ClaimTypes.NameIdentifier`), but for email it only did
`principal.FindFirst("email")` — which is **null** after remapping. So:

```
if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(role) || tokenType != "onboarding")
    return UnauthorizedResponse("Invalid token claims");   // email == null → always 401
```

Every new signup hit this, producing `401 "Invalid token claims"` even though the
token was valid and unexpired — and the frontend mislabels that 401 as
"Registration Link Expired", looping back to `/signup`.

**Note on the audit hypothesis:** the PAT guessed a *role*-claim mismatch. The
mechanism (inbound claim-type remapping) was right, but `role` actually worked —
it's written as the long `ClaimTypes.Role` URI, which `FindFirst(ClaimTypes.Role)`
matches. The claim that broke is **`email`**.

## SECTION B — Files Modified
- `backend/Controllers/AuthController.cs` — `ValidateOnboardingToken` action only.

(No change needed to `JwtTokenHelper` — the token is well-formed; the defect was on the read side.)

## SECTION C — Exact Fix

Look up `email` (and, defensively, `role`) under **both** the raw JWT name and the
mapped `ClaimTypes.*` URI, mirroring the existing `userId` fallback. Also removed a
leftover debug `Console.WriteLine` that dereferenced `principal` *before* the null
check (a latent `NullReferenceException` → 500 on genuinely invalid tokens).

```csharp
if (principal == null)
    return UnauthorizedResponse("Invalid or expired token");

// DefaultMapInboundClaims = true remaps raw JWT names to long ClaimTypes.* URIs
// on read:  "sub" -> NameIdentifier,  "email" -> Email.  (role is already written
// as ClaimTypes.Role.)  Read each value under BOTH names so validation is correct
// regardless of the mapping setting.
var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
          ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
var email  = principal.FindFirst("email")?.Value
          ?? principal.FindFirst(ClaimTypes.Email)?.Value;     // <-- the fix
var role   = principal.FindFirst(ClaimTypes.Role)?.Value
          ?? principal.FindFirst("role")?.Value;               // defensive
var tokenType = principal.FindFirst("token_type")?.Value;

if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(role) || tokenType != "onboarding")
    return UnauthorizedResponse("Invalid token claims");
```

`ClaimTypes.Email` is in `System.Security.Claims`, already imported/used in this file.

## SECTION D — Build Results
- No .NET SDK in the audit sandbox, so I could not run `dotnet build` here.
- The backend dev process is `dotnet run` (not `dotnet watch`), so **the change is not live until the backend is restarted.** The running server still has the old code.
- The edit is type-safe and uses symbols already present in the file (`ClaimTypes.*`, `FindFirst`); no new types, usings, or dependencies.
- **Action required:** restart the backend (`Ctrl-C` the dev-monorepo and re-run `npm run dev-monorepo`, or `dotnet run` in `/backend`). Recommend `dotnet build` in CI.

## SECTION E — Tests

Before (live, current backend) — bug reproduced:
- `POST /api/auth/register` (Name/User/Email/Password) → **201**, returns `onboardingToken`.
- `POST /api/auth/validate-onboarding-token` with that token → **401 "Invalid token claims"**.
- Decoded token payload literally contains a short `email` claim and a long-URI `role` claim → confirms the remap mechanism.

After (pending backend restart) — expected:
- Same endpoint with a fresh token → **200**, body `{ userId, email, role }` populated.
- `/signup` → `/signup/role` → account created → `/signup/onboarding` loads instead of looping to `/signup`.

I captured a still-valid onboarding token during this session and can run the exact
A/B (same token → 401 before, 200 after) the moment the backend is restarted — just
say it's restarted.

## SECTION F — Remaining Risks
- **Verification is pending a backend restart** (sandbox has no .NET SDK; dev uses `dotnet run`, not `watch`). High confidence the fix is correct, but it is not yet proven on a running build.
- The frontend still shows the misleading "Registration Link Expired" copy for *any* validation failure — cosmetic, out of scope here; worth correcting separately so real failures read accurately.
- Onboarding email-OTP / `confirm-email` paths were not exercised (no inbox); unrelated to this claim fix.
- If a future change sets `MapInboundClaims = false` globally, the raw-name lookups (`"email"`, `"sub"`) handle that case too — the dual lookup is intentionally mapping-agnostic.
