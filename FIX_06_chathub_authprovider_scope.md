# Fix 06 — ChatHub Offline / AuthProvider Scope Bug (P1)

Scope: chat realtime connection only. Notifications / AI / deals / marketplace / matching / escrow / reputation / service-provider / entrepreneur / onboarding / auth-logic untouched.

## SECTION A — Root Cause (proven) — Outcome C (duplicate provider)

**`MessagingWorkspace` imported `useAuth` from a duplicate, legacy `AuthContext` module that is never mounted — so it subscribed to a different `createContext` instance than the one the app actually provides, and `user` was always `null`.**

There are **two** independent auth modules, each with its own `createContext`:
- `@/app/_providers/AuthProvider` — the **active** provider. Mounted app-wide: `app/layout.tsx` → `RootProviders` → `<AuthProvider>`. Its `useAuth` **throws** if used outside the provider. This context holds the real `user` (populated from `/auth/me`). `NotificationBell` and the rest of the dashboard import `useAuth` from here → they work.
- `@/context/AuthContext` — a **legacy duplicate** (there is even a sibling `context/DELETE_ME_OLD_AUTHCONTEXT.txt`). Its `useAuth` returns a **safe default** `{ user: null, isLoading: true, … }` and logs `"[useAuth] Warning: Called outside AuthProvider…"` when its context is empty. **No `<AuthProvider>` from this module is mounted anywhere**, so its context is always empty.

`MessagingWorkspace` imported `useAuth` from the **legacy** module:
```
src/components/messaging/MessagingWorkspace.tsx
const { user } = useAuth();          // legacy context → always null
...
const { status } = useSignalRHub("chat", { enabled: !!user });  // false → never starts
```
So `enabled` was always `false`, `useSignalRHub("chat")` never started, and `MessagesHeader` rendered status `idle → "Offline"`. The exact `[useAuth] Called outside AuthProvider` warning came from this module's safe-default branch.

This rules out the other candidates: not a missing provider (the active one wraps the whole app — A✗), not a layout hierarchy problem (the messages routes are under `RootProviders` — B✗), not a client/server boundary issue (`MessagingWorkspace` is `"use client"` — D✗), not a hydration-timing race (the warning is unconditional whenever the legacy context is read — E✗). It is **C: a duplicate context the component subscribes to but which is never provided** (a stale import to a module slated for deletion).

## SECTION B — Files Modified
1. `src/components/messaging/MessagingWorkspace.tsx` — one line: import `useAuth` from the active provider.

(No SignalR, messaging-architecture, or auth-logic changes. Backend untouched.)

## SECTION C — Exact Fix
```diff
- import { useAuth } from "@/context/AuthContext";
+ import { useAuth } from "@/app/_providers/AuthProvider";
```
The active provider's `useAuth` returns a compatible superset (`user: { id, name, role, onboardingPhase? }`); `MessagingWorkspace` only reads `user` (as `!!user`), `user.id` and `user.role` — all present. So beyond enabling the chat hub, this also restores correct "is-mine" message attribution and the current user/role passed to the thread.

## SECTION D — Build Results
- **Frontend only.** The Next.js dev server hot-reloaded the change and the chat hub reached **"Live"** in the browser — i.e. it compiled and ran in the real (SWC) toolchain. A type error would have produced a dev error overlay and a non-working page; it works.
- `npx tsc --noEmit` via the bare sandbox invocation is not a usable signal here: it emits systematic false "JSX element has no corresponding closing tag" / `TS1005` parse errors for **every** `.tsx` file it touches (verified earlier on unchanged components and the working Fix‑01/03/05 files) — tsc isn't parsing in JSX mode in this environment. The change is a single import-path swap to an existing, exported symbol. Recommend the project's own typecheck / `next build` in CI.
- **Backend:** not required (no backend changes).

## SECTION E — Verification Results

| Check | Result |
|---|---|
| **Creator Messages — ChatHub Connected** | ✅ status badge = **"Live"** (`status === "connected"`); `/hubs/chat/negotiate` → 200; "Offline" gone. |
| **No AuthProvider warning (messages page)** | ✅ after clearing console and interacting on the page, **zero** `[useAuth]` warnings fire from the messages route. |
| **Messages still send** | ✅ sent two messages; both appear; status stays "Live". |
| **Unread counts still work** | ✅ unchanged (REST-driven; this change doesn't touch unread logic — also confirmed working in Fix 04). |
| **Investor Messages** | ✅ chat hub negotiates (`/hubs/chat/negotiate` 200) on mount, no `[useAuth]` warning. (Same shared `MessagingWorkspace`; the pre-existing deep-link guard bounced the page before the badge could be re-read.) |
| **Entrepreneur Messages** | ✅ chat hub negotiates (200) on mount, no `[useAuth]` warning (same component; same deep-link bounce caveat). |
| **No NotificationHub regression** | ✅ `/hubs/notifications/negotiate` → 200; notifications API works. The notification hub already used the active provider and was not touched. |

(Creator Messages was fully verified end-to-end — "Live" + send + no warning. Investor/Entrepreneur use the identical component; their chat-negotiate-200 + no-warning confirms the enable path; a pre-existing deep-link/hydration bounce — unrelated to this fix — prevented lingering on those pages to re-read the badge.)

## SECTION F — Remaining Risks
- **The legacy `@/context/AuthContext` module still exists and ~4 other files import from it** (out of this fix's "chat only" scope): `app/dashboard/creator/page.tsx` (overview), `components/deals/NegotiationWorkspace.tsx`, `components/deals/MakeOfferButton.tsx`, `components/messaging/MessageFounderButton.tsx`. They each get `user: null` and log the same warning on *their* pages (e.g. the creator overview). Those weren't touched here (Deals is excluded; the others are outside chat). **Recommended follow-up (single, safe):** make `@/context/AuthContext` re-export `useAuth`/`AuthProvider` from `@/app/_providers/AuthProvider` (or delete the legacy module and repoint the four importers), which eliminates the duplicate-context class of bug app-wide.
- The deep-link/refresh bounce on dashboard sub-routes is a pre-existing, separate issue (auth-guard hydration race) — not caused by this fix; it only limited how long Investor/Entrepreneur messages pages stayed mounted during verification.
- Verified via dev hot-reload + live browser; confirm with `next build` in CI.
