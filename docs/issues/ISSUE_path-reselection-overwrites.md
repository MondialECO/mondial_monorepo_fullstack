# Issue: Returning User Can Re-Choose Path Without Confirmation

**Status:** Filed  
**Date:** 2026-07-25  
**Component:** Creator Phase 2 Smart Gate (`/dashboard/creator/phase-2/page.tsx`)

## Problem

A user who has already selected a path (refinement or discovery) and made progress can return to the Smart Gate entry screen and re-select a different path. This silently overwrites their prior selection with no confirmation or warning.

## Scenario

1. User chooses **Refinement** path → enters Clarifier → completes several questions
2. User manually navigates back to `/dashboard/creator/phase-2` (Smart Gate)
3. User clicks **Discovery** button instead
4. Prior refinement session state is overwritten
5. User is routed to discovery flow with no indication of what was lost

## Current Behavior

The handlers are stateless re-entry points:
```typescript
const handleSelectRefinement = () => {
  setEntryPath("already_have_idea");  // ← Overwrites any prior selection
  updateProject({ exists: true });    // ← Same, no conflict check
  router.push("/dashboard/creator/phase-2/clarifier");
};

const handleSelectDiscovery = () => {
  updateProject({ exists: true });    // ← Overwrites silently
  router.push("/dashboard/creator/phase-2/discovery");
};
```

Neither handler checks if a path was already chosen or if progress was made in a prior flow.

## Why This Matters

For users who have already invested time in clarifying or discovering:
- Accidental re-selection of a different path is irreversible
- No warning or confirmation prevents the overwrite
- Lost work has no recovery mechanism (no drafts, no undo)

## Possible Solutions

1. **Redirect on Return** — If a path is already recorded and the user navigates to Smart Gate, redirect them directly to their current step in that path
2. **Confirmation Dialog** — Show a "You've already started this path. Do you want to switch?" dialog before overwriting
3. **Read-Only View** — If a path exists, show the Smart Gate in read-only mode with a "Resume" button instead of "Select"
4. **Audit & Recovery** — Keep a history of prior paths/attempts so users can recover or compare

## Recommendation

Verify with product:
- Is re-selection an intentional feature (e.g., "restart your journey")?
- If not, implement a redirect or confirmation to prevent silent loss of work
- Consider the UX for users who genuinely want to restart vs. those who accidentally navigate back

## Notes

- This is pre-existing (not introduced by Phase 2 chrome/restyle work)
- It only manifests if the user deliberately navigates back to Smart Gate (not part of the normal flow)
- The handlers themselves are correct and must not be changed; the fix belongs at the route level or in a guard
