# Fix 04 — Notification Mark-Read 500 (P1)

Scope: notification mark-read only. AI / SignalR transport / messaging logic / deals / marketplace / matching / service-provider / entrepreneur / auth / onboarding untouched. No schema change, no contract change, notification generation and unread-count logic unchanged.

## SECTION A — Root Cause (proven, not assumed)

**`Notification.Id` (a MongoDB `ObjectId`) is serialized to JSON as an object, not a 24-hex string, so the frontend sends `"[object Object]"` to `POST /api/notification/read/{id}`, and the controller's `ObjectId.Parse(id)` throws `FormatException` → unhandled → 500.**

Traced full path and reproduced live (logged in as demo.creator):

1. **Model** (`Notification.cs`): `[BsonId] public ObjectId Id`. No string representation for JSON.
2. **Controller GET** (`NotificationController.GetNotifications`) returns the raw `Notification` entity (no DTO).
3. **Serialization**: System.Text.Json has no built-in `ObjectId` converter, so it emits the struct's public fields. Observed `GET /api/notification` response:
   ```json
   "id": { "timestamp":1780848088, "machine":11276487, "pid":5245, "increment":4270383, "creationTime":"2026-06-07T16:01:28Z" }
   ```
   (`typeof id === "object"`.) The frontend type (`AppNotification.id: string`) and comment ("ids are opaque strings on the wire") show this violates the intended contract.
4. **Frontend** (`api-notifications.ts`): `markAsRead(id)` → `api.post(\`/notification/read/${id}\`)`. With `id` an object, the template literal yields `"[object Object]"`. (`NotificationBell` passes `n.id` to the mutation.)
5. **Controller POST** (`MarkAsRead`): `ObjectId.Parse("[object Object]")` → throws.
6. Reproduced 500 directly — response body:
   ```
   FormatException: '[object Object]' is not a valid 24 digit hex string.
   ```

So: notifications generate fine, list loads, unread count is correct — but mark-read 500s because the id never round-trips as a parseable string, and the parse is unguarded.

## SECTION B — Files Modified
1. `backend/Serialization/ObjectIdJsonConverter.cs` — **new**, tiny `JsonConverter<ObjectId>` (hex string ↔ ObjectId).
2. `backend/Models/DatabaseModels/Notification.cs` — annotate `Id` and `ReferenceId` with `[JsonConverter(typeof(ObjectIdJsonConverter))]`.
3. `backend/Controllers/NotificationController.cs` — `ObjectId.TryParse` guard in `MarkAsRead` (malformed id → 404, never 500).
4. `backend/Services/Repository/NotificationRepository.cs` — `MatchedCount > 0` (idempotent repeat mark-read).

No frontend changes (the frontend already expects `id: string`; the fix makes the backend honor that contract).

## SECTION C — Exact Fix

`ObjectIdJsonConverter.cs` (new):
```csharp
public sealed class ObjectIdJsonConverter : JsonConverter<ObjectId>
{
    public override ObjectId Read(ref Utf8JsonReader reader, Type t, JsonSerializerOptions o)
        => ObjectId.TryParse(reader.GetString(), out var id) ? id : ObjectId.Empty;

    public override void Write(Utf8JsonWriter writer, ObjectId value, JsonSerializerOptions o)
        => writer.WriteStringValue(value.ToString());
}
```

`Notification.cs` — id fields now serialize as 24-hex strings (Bson/Mongo storage unchanged):
```csharp
[BsonId]
[JsonConverter(typeof(ObjectIdJsonConverter))]
public ObjectId Id { get; set; }
...
[BsonElement("ReferenceId")]
[JsonConverter(typeof(ObjectIdJsonConverter))]
public ObjectId? ReferenceId { get; set; }
```

`NotificationController.MarkAsRead` — defensive parse:
```csharp
if (!ObjectId.TryParse(id, out var objectId))
    return NotFound();
var updated = await _service.MarkAsRead(objectId, CurrentUserId);
if (!updated) return NotFound();
return Ok();
```

`NotificationRepository.MarkAsRead` — idempotent:
```csharp
return result.MatchedCount > 0;   // was ModifiedCount > 0
```

Contract preserved: route `POST /api/notification/read/{id}` and 200/404 responses unchanged; GET still returns the same fields (only `id`/`referenceId` change from a broken object to the intended string).

## SECTION D — Build Results
- **Backend `dotnet build`: not runnable in this audit sandbox (no .NET SDK installed).** Changes are type-safe and use only existing symbols (`JsonConverter<ObjectId>`, `ObjectId.TryParse`, `UpdateResult.MatchedCount`). The backend runs via `dotnet run` (not `watch`), so the fix is **not live until the backend is restarted**.
- **Notification tests:** `backend/tests/.../NotificationAndChatServiceTests.cs` is **entirely commented out** (no active notification unit tests; the stale commented test even uses the old single-arg `MarkAsRead`). Nothing to run or break.
- **Frontend `npx tsc --noEmit`:** no frontend files were changed in this fix. The attempted run was cut off by the sandbox's 45s limit and emitted spurious `TS1005` parse errors only in three unrelated files from Fixes 01/03 (`entrepreneur/layout.tsx`, `(phases)/layout.tsx`, `connection-manager.ts`) — those files are verified valid and running live in dev (e.g. `connection-manager.ts:82` is `export function ensureStarted(hub: HubName): Promise<void> {`). Recommend a clean `tsc`/`next build` in CI.

## SECTION E — Verification Results

**Before (live, current backend) — reproduced:**
- `GET /api/notification` → `id` is a JSON object (`typeof === "object"`).
- `POST /api/notification/read/[object Object]` → **500**, `FormatException: '[object Object]' is not a valid 24 digit hex string`.

**After (expected once backend is restarted):**
- `GET /api/notification` → `id` is a 24-hex string; list still loads (unchanged fields).
- `POST /api/notification/read/{hexId}` (own, unread) → **200**; that item's `isRead` flips → derived unread count decreases.
- Repeat `POST` on the same (now-read) notification → **200** (idempotent via `MatchedCount`).
- Malformed/foreign id → **404** (never 500); foreign-id anti-enumeration preserved.
- Other notification endpoint (`GET`) unaffected.

I reproduced the failing state this session and can run the full A/B (500 → 200, unread-count decrement, repeat-safe) the moment the backend is restarted — just say it's restarted.

## SECTION F — Remaining Risks
- **Verification pending a backend restart** (no SDK in sandbox; `dotnet run` not `watch`). High confidence; not yet proven on a running build.
- `ReferenceId` is `ObjectId?`; the per-property converter relies on .NET 8 System.Text.Json applying a `JsonConverter<ObjectId>` to a `Nullable<ObjectId>` member (supported). Current data has `referenceId: null`, so even an edge case wouldn't surface in the demo.
- Converter is applied **per-property on the Notification model only** — no app-wide serialization change, so no blast radius to other endpoints.
- `MatchedCount` deliberately changes repeat mark-read from 404 → 200 (idempotent) for an owned, already-read notification; foreign/unknown ids still return 404. This serves the "repeated mark-read is safe" requirement and does not affect unread-count logic (count is derived client-side from `isRead`).
