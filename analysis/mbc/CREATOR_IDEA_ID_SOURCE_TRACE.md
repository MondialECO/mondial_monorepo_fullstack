# Creator Idea Selection & ideaId Resolution Source-Code Trace

**Repository**: `MondialECO/mondial_monorepo_fullstack`  
**Current Branch**: `dev-hafiz`  
**Baseline HEAD**: `371c0d4b` (`fix(creator): remove redundant brand studio metadata strip from launch assets view`)  
**Working Tree Status**: Read-only source trace comparing baseline `371c0d4b` against the cross-tab synchronization changes.  

---

## 1. Baseline Verification & Git State

### 1.1 Git Status & Baseline Commit Identification
- **Branch**: `dev-hafiz` (tracking `origin/dev-hafiz`)
- **HEAD Commit**: `371c0d4b` (`fix(creator): remove redundant brand studio metadata strip from launch assets view`)
- **Baseline Verification**:
  - `git show 371c0d4b` confirms the pre-change baseline commit.
  - The working tree has been restored to the exact baseline `371c0d4b`.
  - The experimental single-active-idea cross-tab synchronization implementation has been completely rolled back.
  - No resets, stashes, or blanket rollbacks were performed.

---

## 2. Baseline Architecture & Identity Model

| Dimension | Baseline Implementation (`371c0d4b`) | Exact Source Citation |
| :--- | :--- | :--- |
| **Active Idea Selection** | `MyIdeasPage.handleSwitch` calls `creatorJourneyApi.setActiveIdea(ideaId)` → `PATCH /api/creator/ideas/active` | [`src/app/dashboard/creator/myideas/page.tsx:104`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/myideas/page.tsx#L104), [`src/lib/api-creator-journey.ts:448`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/lib/api-creator-journey.ts#L448) |
| **Backend Persistence** | `CreatorJourney.ActiveIdeaId` in MongoDB `CreatorJourneys` collection; `CreatorIdea.LastActiveAt` touched | [`backend/Services/Implementations/CreatorIdeaService.cs:105-115`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/Implementations/CreatorIdeaService.cs#L105-L115) |
| **Tab Isolation** | Tabs are isolated. Each tab maintains its own `sessionStorage` pointer and module `workspaceIdeaId`. Switching in Tab 1 leaves Tab 2 on its current tab-local selection. | [`src/lib/api-creator-journey.ts:39`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/lib/api-creator-journey.ts#L39), [`src/hooks/useCreatorProgressState.ts:308`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/hooks/useCreatorProgressState.ts#L308) |
| **Tab Hydration Precedence** | `requestedIdeaId` → `workspaceIdeaIdRef` → `queryIdeaId` (`?idea=`) → `sessionStorage` → backend `journey.activeIdeaId` | [`src/hooks/useCreatorProgressState.ts:301-342`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/hooks/useCreatorProgressState.ts#L301-L342) |
| **Concurrency & Write Safety** | Optimistic concurrency via `CreatorIdea.Version` header / payload check returning HTTP 409 on conflict. | [`backend/Controllers/CreatorPhase4Controller.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Controllers/CreatorPhase4Controller.cs) |
| **Save Coordination** | Tab-local save promises (`activeSavePromiseRef`) and debounce timers protect within the active view. | [`src/components/creator/phase4/PricingStrategyView.tsx:136`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/components/creator/phase4/PricingStrategyView.tsx#L136) |

---

## 3. Detailed Trace of the ORIGINAL Idea-Selection Flow

### 3.1 Where is an idea selected?
In `src/app/dashboard/creator/myideas/page.tsx`:
1. **`handleSwitch(ideaId)`** (line 99):
   ```typescript
   const handleSwitch = async (ideaId: string) => {
     if (busy) return;
     setBusy(ideaId);
     try {
       const { activeIdeaId } = await creatorJourneyApi.setActiveIdea(ideaId);
       const hydrated = await refetch(ideaId);
       await loadIdeas();
     } finally {
       setBusy(null);
     }
   };
   ```
2. **`handleContinue(idea)`** (line 119):
   ```typescript
   const handleContinue = async (idea: IdeaCard) => {
     if (!idea.isActive) {
       const { activeIdeaId } = await creatorJourneyApi.setActiveIdea(idea.ideaId);
       await refetch(idea.ideaId);
     }
     router.push(await routeForCurrentIdea());
   };
   ```
3. **`handleStartOver()`** (line 159):
   ```typescript
   const handleStartOver = async () => {
     const { ideaId: newIdeaId } = await creatorJourneyApi.createIdea();
     await refetch(newIdeaId);
     router.push(await routeForCurrentIdea());
   };
   ```

### 3.2 What does `setActiveIdea` actually mutate?
- **HTTP Call**: `PATCH /api/creator/ideas/active` with body `{ ideaId }`.
- **Backend Controller**: [`backend/Controllers/CreatorIdeasController.cs:96-111`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Controllers/CreatorIdeasController.cs#L96-L111) calls `_ideas.SetActiveIdeaAsync(userId, request.IdeaId)`.
- **Backend Service**: [`backend/Services/Implementations/CreatorIdeaService.cs:105-115`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/Implementations/CreatorIdeaService.cs#L105-L115):
  ```csharp
  public async Task<CreatorIdea> SetActiveIdeaAsync(string userId, string ideaId)
  {
      var idea = await _ideas.GetOwnedAsync(ideaId, userId);
      if (idea == null)
          throw new CreatorJourneyException(404, "Idea not found.");

      var journey = await _journeys.GetOrCreateAsync(userId);
      await SetActivePointerAsync(journey.Id, ideaId);
      await _ideas.TouchAsync(ideaId, userId);
      return idea;
  }
  ```
  - **Mutates**:
    1. `CreatorJourney.ActiveIdeaId = ideaId` in MongoDB collection `CreatorJourneys`.
    2. `CreatorIdea.LastActiveAt = DateTime.UtcNow` in MongoDB collection `CreatorIdeas`.

### 3.3 Where is the selected idea persisted?
1. **Server-Side**: MongoDB collection `CreatorJourneys` (field `ActiveIdeaId`) keyed by `UserId`.
2. **Client-Side Storage**:
   - `sessionStorage.getItem('creator_workspace_idea_id')` (scoped to browser tab).
   - Module variable `workspaceIdeaId` in `src/lib/api-creator-journey.ts`.
   - React state `state.activeIdeaId` inside `useCreatorProgressState.ts`.

### 3.4 What is the real precedence between identity sources?
At baseline:
1. **Explicit Function Argument**: `requestedIdeaId` in `hydrate(ideaId)` (Highest).
2. **Module Heap Variable**: `workspaceIdeaIdRef.current` in `useCreatorProgressState.ts`.
3. **URL Query Param**: `searchParams.get('idea')` (legacy query param name).
4. **Tab Storage**: `sessionStorage.getItem('creator_workspace_idea_id')`.
5. **Backend Journey Default**: `journey.activeIdeaId` returned by GET `/creator/journey`.

In Page Views (e.g. `PricingPageContent`, `AssetsPageContent`):
```typescript
const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';
```
Precedence in Page Components:
`URL query (?ideaId=...)` > `React Context (progressState.activeIdeaId)` > `Empty String`.

### 3.5 Does `creatorJourneyApi.get()` without an argument fetch the account selection?
In baseline `src/lib/api-creator-journey.ts` line 118:
```typescript
get: async (ideaId?: string | null): Promise<JourneyResponse> => {
  const resolved = ideaId ?? workspaceIdeaId;
  const res = await api.get('/creator/journey', resolved ? { params: { ideaId: resolved } } : undefined);
  return unwrap<JourneyResponse>(res.data);
}
```
**Answer**: If module variable `workspaceIdeaId` had been set in that tab, calling `creatorJourneyApi.get()` without arguments injected `{ params: { ideaId: workspaceIdeaId } }`. If `workspaceIdeaId` was null, it made a parameter-less request, which prompted the backend to return `journey.ActiveIdeaId`.

### 3.6 Can an explicit idea-scoped read change the backend active selection?
**NO.** In `backend/Services/Implementations/CreatorJourneyService.cs` line 95:
```csharp
public async Task<CreatorIdea?> TryResolveIdeaAsync(CreatorJourney j, string ideaId = null)
```
The method is pure read-only (`NEVER creates ideas and NEVER mutates database state.`). It fetches the idea from `_creatorIdeas.GetOwnedAsync(ideaId, j.UserId)` and overlays its data onto the transient journey DTO in memory without updating `CreatorJourney.ActiveIdeaId` in MongoDB.

### 3.7 How do API reads, writes, expectedVersion, and version caches bind to an idea?
- **Reads**: `GET /api/creator/phase4/*?ideaId={ideaId}`. Controller extracts `ideaId`, queries MongoDB with `UserId == currentUserId && Id == ideaId`, and returns data with response header `X-Creator-Idea-Version`.
- **Writes**: `POST/PATCH /api/creator/phase4/*` accepts `{ ideaId, expectedVersion }`.
- **Concurrency Check**: Backend compares `expectedVersion` with `CreatorIdea.Version`. If equal, applies update and increments version; if mismatched, throws `CreatorJourneyException(409)`.
- **Version Cache**: Frontend `ideaVersions = new Map<string, number>()` in `src/lib/api-creator-journey.ts` records versions keyed by `ideaId`.

---

## 4. Trace of Actual Page Consumers

### 4.1 Creator Dashboard (`src/app/dashboard/creator/page.tsx`)
- **Initial Load**: Reads `useCreatorProgress()`, resolving `state.activeIdeaId`.
- **Queries**:
  - `useCreatorDashboardSummary(state.activeIdeaId)` with key `['creator', 'dashboardSummary', activeIdeaId ?? 'active']`.
  - `useMyIdeas()` with key `['creator', 'myIdeas']`.
- **Navigation**: Uses `withIdeaContext(action.route, state.activeIdeaId)` to append `?ideaId=...` to next-step links.

### 4.2 Phase 4 Pricing (`src/app/dashboard/creator/phase-4/pricing/page.tsx`)
- **Initial Load**: `effectiveIdeaId = searchParams.get('ideaId') || progressState?.activeIdeaId || ''`.
- **Queries**: `getPricingStrategy(effectiveIdeaId)` loads `/api/creator/phase4/pricing?ideaId={effectiveIdeaId}`.
- **Mutations**:
  - `generatePricingStrategy(effectiveIdeaId)`
  - `refreshPricingStrategy(effectiveIdeaId)`
  - `updatePricingOffer(effectiveIdeaId, req)`
- **Navigation**: `router.push('/dashboard/creator/phase-4/gtm?ideaId=' + ideaId)`.

### 4.3 Phase 4 Launch Assets & `/assets` Alias (`src/app/dashboard/creator/phase-4/launch-assets/page.tsx` & `assets/page.tsx`)
- **Route Alias**: `launch-assets/page.tsx` exports directly from `../assets/page`.
- **Initial Load**: `effectiveIdeaId = searchParams.get('ideaId') || progressState?.activeIdeaId || ''`.
- **Queries**: `getLaunchAssets(effectiveIdeaId)` loads `/api/creator/phase4/launch-assets?ideaId={effectiveIdeaId}`.
- **Mutations**:
  - `generateLaunchAssets(effectiveIdeaId)`
  - `refreshLaunchAssets(effectiveIdeaId)`
  - `updateLaunchAssets(effectiveIdeaId, req)`
  - `createNewVersion(effectiveIdeaId)`
  - `selectVersion(effectiveIdeaId)`
  - `shareLaunchAssets(effectiveIdeaId, version)` returns `shareToken`. Public site URL is `/p/launch/${shareToken}`.
  - `getSourceCode(effectiveIdeaId, version)` downloads asset bundle.

---

## 5. Analysis of Why Original Code Did Not Synchronize Tabs

In the original code (`371c0d4b`):
1. The backend **already had** an account-level active idea pointer (`CreatorJourney.ActiveIdeaId`).
2. However, every browser tab operated in a siloed state:
   - `sessionStorage` (`creator_workspace_idea_id`) was strictly tab-local.
   - `workspaceIdeaId` was an in-memory module variable isolated to each tab's JavaScript heap.
   - There was **no cross-tab messaging channel** (`BroadcastChannel` or `storage` event listener).
   - Navigation links in `AppSidebar.tsx` and `withIdeaContext` read the current tab's URL `searchParams.get('ideaId')`, keeping the old idea pinned in that specific tab.
3. Therefore, when Tab 1 switched to Idea B, Tab 2 was never notified, retained `sessionStorage = Idea A`, and continued querying Idea A.

---

## 6. Cancelled Single-Active-Idea Synchronization Experiment

The cross-tab synchronization approach (`creator-tab-sync.ts`, `CreatorActiveIdeaSync.tsx`, forced tab reload on `BroadcastChannel`/`storage` events) was evaluated and subsequently cancelled:
1. **Rationale for Rollback**: Product requirement direction shifted away from automatic cross-tab forced reloads and discarded unsaved work; modifications to the original multi-idea / tab handling will be planned separately.
2. **Rollback Verification**: All synchronization files, sequence counters, unmount/blur save cancellation guards, and layout coordinators were cleanly removed with zero residual dangling imports.
3. **Preserved Baseline State**: All baseline Phase 4 Launch Preparation workflows, Launch Assets UI updates (metadata block removal in `371c0d4b`), idea-scoped reads/writes, and concurrency protections remain intact.

---

## 7. Baseline Regression & Typecheck Verification

- **All Creator Unit Tests**:
  - Command: `npm test -- --run src/__tests__/creator/`
  - Output: Verified clean baseline test suite execution
- **Phase 4 Launch Preparation Tests**:
  - Command: `npm test -- --run phase4`
  - Output: Verified clean Phase 4 test execution
- **TypeScript Full Compilation**:
  - Command: `npx tsc --noEmit`
  - Output: Exit code 0 (Zero type errors)
