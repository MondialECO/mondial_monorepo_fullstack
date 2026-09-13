# Issue: Entry Path Inconsistency Between Refinement and Discovery Handlers

**Status:** Filed  
**Date:** 2026-07-25  
**Component:** Creator Phase 2 Smart Gate (`/dashboard/creator/phase-2/page.tsx`)

## Problem

The two path selection handlers in the Smart Gate entry screen behave asymmetrically:

- **Refinement handler** (`handleSelectRefinement`): Calls `setEntryPath("already_have_idea")` to persist the selected path server-side
- **Discovery handler** (`handleSelectDiscovery`): Does NOT call `setEntryPath()` — the backend infers discovery from working-state instead

## Current Behavior

```typescript
const handleSelectRefinement = () => {
  setEntryPath("already_have_idea");  // ← Explicit server-side recording
  updateProject({ exists: true });
  router.push("/dashboard/creator/phase-2/clarifier");
};

const handleSelectDiscovery = () => {
  // Discovery deliberately does NOT set a server-side entry path — the backend
  // discriminates a Discovery user by persisted working-state (2C-2), and steps
  // 3–5 resume refresh-safe via the resolver (2C-3). Enter the Discovery form.
  updateProject({ exists: true });
  router.push("/dashboard/creator/phase-2/discovery");
};
```

## Why This Matters

This asymmetry is undocumented in the main code. While the comment in the handler suggests this is intentional (relying on backend working-state inference instead of explicit entry-path recording), it creates:
- Inconsistent mental models for future maintainers
- Potential confusion if the backend inference changes
- No audit trail for which path was deliberately chosen (only for refinement)

## Recommendation

Verify with the backend team whether this asymmetry is:
1. **Intentional and required:** If so, document it clearly at the type/constant level and in the refinement handler
2. **Technical debt:** If not, consider making both handlers explicit by having discovery also call `setEntryPath("discovery")` or similar, for consistency and auditability

## Notes

- This is not a bug — the code works correctly
- It is pre-existing (not introduced by the Phase 2 chrome/restyle work)
- It lives in the critical path for creator journey state initialization
