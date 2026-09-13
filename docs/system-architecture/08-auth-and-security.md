# Mondial ECO — Authentication & Authorization Security Architecture

This document specifies the end-to-end authentication, session persistence, role-based access control (RBAC), and ownership-level security enforcement across both frontend and backend layers.

---

## 1. Authentication Lifecycle

```
[ User Browser ]
       │
       │ 1. Submit Credentials (POST /api/auth/login)
       ▼
[ Kestrel Middleware Pipeline ]
       │
       │ 2. Rate Limiter Policy "auth" (Max 5 attempts / min / IP)
       │ 3. FluentValidation (LoginRequestModelValidator)
       ▼
[ AuthController & ASP.NET Identity ]
       │
       │ 4. Find user by email in `applicationUsers` collection
       │ 5. Verify PBKDF2 / Identity password hash
       │ 6. Read authoritative `ApplicationUser.Roles[]` list
       │ 7. Mint JWT Token:
       │    - Claims: sub (UserId), email, roles (string[])
       │    - Signing: HMAC-SHA256 with 256-bit secret key
       │    - Expiry: 8 hours (Clock skew: 30 seconds)
       ▼
[ Browser Storage & Axios Client ]
       │
       │ 8. Client stores token in localStorage (`token`)
       │ 9. AuthProvider updates context state (`isAuthenticated = true`)
       │ 10. `storage` event listener propagates login/logout across all open tabs
       ▼
[ Subsequent API Requests ]
       │
       │ 11. Axios Interceptor injects `Authorization: Bearer <token>`
       ▼
[ ASP.NET Core JwtBearer Engine ]
       │
       │ 12. Validate signature, issuer, audience, and expiry
       │ 13. `OnTokenValidated` hook ensures `sub` is mapped to `ClaimTypes.NameIdentifier`
       │ 14. Populate `HttpContext.User` ClaimsPrincipal with roles
       ▼
[ Controller & Service Security Boundaries ]
       │
       │ 15. [Authorize(Roles = "...")] verifies role possession
       │ 16. Service-level Ownership Guard: `AssertAccess(CurrentUserId == Entity.OwnerId)`
```

---

## 2. Multi-Tab Synchronization & Session Storage

- **Storage Target**: JWT token is stored in browser `localStorage` under key `"token"`.
- **Cross-Tab Event Listener**:
  ```ts
  // src/app/_providers/AuthProvider.tsx
  useEffect(() => {
    const syncAuth = () => {
      const tokenFromStorage = localStorage.getItem('token');
      if (!tokenFromStorage) {
        setToken(null);
        setUser(null);
        setIsBackendVerified(false);
      }
    };
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);
  ```
- **Logout Action**: Calling `logout()` clears `localStorage.removeItem("token")`, triggering the `storage` event in all sibling tabs and instantly redirecting all active windows to `/login`.

---

## 3. Axios Interceptors & Silent Token Refresh (`src/lib/axios.ts`)

- **Request Interceptor**:
  - Automatically attaches `Bearer <token>` to outbound requests unless running in SSR.
- **Response Interceptor (401 Handling)**:
  - Bypasses public auth paths (`/auth/login`, `/auth/register`, etc.) so normal validation errors do not cause refresh loops.
  - Queues concurrent failing requests in `failedQueue`.
  - Sends a single refresh request to `/auth/refresh-token`.
  - Upon receiving the refreshed token, replaces it in `localStorage`, flushes the queue, and retries all original requests transparently.

---

## 4. Multi-Role Authorization & Owner Checks

### A. Multiple Role Accounts
Mondial ECO natively supports multi-role accounts (e.g. a user who is both a `Creator` and an `Entrepreneur`).
- **Data Source**: Stored as an array in `ApplicationUser.Roles` in MongoDB.
- **Claims Mapping**: Emitted into the JWT payload as multiple `role` claims.
- **Primary Role Resolution**: `resolvePrimaryRole(user.roles)` selects the default landing dashboard according to strict priority order:
  1. `SuperAdmin`
  2. `Admin`
  3. `Entrepreneur`
  4. `Investor`
  5. `ServiceProvider`
  6. `Creator`

### B. Two-Tier Authorization Enforcement
1. **Coarse-Grained Layer (Controller Attributes)**:
   - `[Authorize]`: Caller must provide a valid signature.
   - `[Authorize(Roles = "Creator")]`: Caller must possess the `Creator` role.
   - `[Authorize(Policy = "AdminAccess")]`: Caller must possess `Admin` or `SuperAdmin`.
2. **Fine-Grained Layer (Service Ownership Verification)**:
   - Coarse-grained role checks are never sufficient to access user data.
   - Every service operation resolves `CurrentUserId` from `User.FindFirst(ClaimTypes.NameIdentifier)` and executes an explicit ownership assertion:
     ```csharp
     if (idea.CreatorId != currentUserId)
         throw new UnauthorizedAccessException("Forbidden: caller does not own this resource.");
     ```
   - Deals use `DealAccessContext` to verify whether the caller is the founder, the investor, or the creator before granting access to terms or documents.
