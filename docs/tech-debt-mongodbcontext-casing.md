# Tech debt — `MongoDbContext.ApplicationUsers` collection-name casing

**Filed:** 2026-08-03. **Status:** open, planned batch.
**Tactical chat-only mitigation shipped:** `5eb458a`.
**Estimated scope:** 1–2 focused sessions. Not a small fix — do not bundle.

---

## Root cause

`backend/DbContext/MongoDbContext.cs:227`:

```csharp
public virtual IMongoCollection<ApplicationUser> ApplicationUsers =>
    _database.GetCollection<ApplicationUser>("ApplicationUsers");
```

Identity does not use that name. `AspNetCore.Identity.MongoDbCore 6.0.0` resolves the
collection through `MongoDbGenericRepository 1.6.2`:

1. `MongoDbContext.GetCollectionName<TDocument>()` is the entry point.
2. It first calls `GetAttributeCollectionName<T>()` — *"Extracts the CollectionName
   attribute from the entity type, if any."* The package docs state the attribute *"takes
   precedence of course, and if not present the library will fall back to your Pluralize
   method."*
3. `ApplicationUser` carries **no** `[CollectionName]` attribute, so it falls through to
   `Pluralize<TDocument>()` — *"Very naively pluralizes a TDocument type name"* — followed
   by `InflectorExtensions.Camelize`, *"Same as Pascalize except that the first character
   is lower case."*

`ApplicationUser` → pluralize → `ApplicationUsers` → camelize → **`applicationUsers`**.

MongoDB collection names are case-sensitive, and `GetCollection` on a name that does not
exist returns an empty collection rather than throwing. Every read through the property
therefore returns zero documents, silently, and every write matches zero documents.

Confirmed against the live dev database (2026-08-03):

| Collection | Exists | Documents |
|---|---|---|
| `applicationUsers` | yes | 50 (`Name` populated on all 50) |
| `applicationRoles` | yes | 5 |
| `ApplicationUsers` | **no** | — |
| `users` | **no** | — |

Every other collection in the database is PascalCase, because they come from
`MongoDbContext.GetCollection<T>("PascalName")`. Only Identity's two are camelCase. The
bug is two naming conventions in one database.

---

## Consumers affected

### Read paths (7) — currently return empty

| Site | Consequence |
|---|---|
| `Controllers/ChatController.cs:129` | **Mitigated in `5eb458a`** — participant names were null |
| `Controllers/CreatorController.cs:109` | user lookup returns nothing |
| `Controllers/CreatorController.cs:344` | user lookup returns nothing |
| `Controllers/InvestorPhaseController.cs:368` | user lookup returns nothing |
| `Controllers/VarificationController.cs:64` | user list empty |
| `Services/CompanyService.cs:3166` | founder lookup returns null |
| `Services/CompanyService.cs:3180` | user lookup returns null |

Fixing these is a strict improvement: they have never worked, and correcting the binding
makes them start returning real data.

### Write paths (2) — currently silent no-ops

Neither uses upsert, so both match zero documents and create nothing. **This is why no
phantom `ApplicationUsers` collection exists locally.**

**`Controllers/CreatorController.cs:692`** — `FindOneAndUpdateAsync` setting
`CreatorProfile.CrossRoadsDecision` to `PATH_A` / `PATH_B`, with
`ReturnDocument.After`. Matches nothing, returns null, and the handler then returns
`404 "User not found"`. **The Crossroads decision has never persisted, and the endpoint
has always 404'd.** Fixing the binding makes it write and start returning 200.

**`Controllers/CreatorPhase6Controller.cs:302-303`** — `UpdateOneAsync` setting
`EntrepreneurProfile.CompanyId` and `AddToSet` on `Roles`, inside a transaction (session
and non-session variants). **Creator→Entrepreneur role promotion has never been
written.** Fixing the binding makes the promotion persist.

### `"users"` paths (2) — a *second*, distinct bug

These target a third name, `users`, which also does not exist. A casing fix to
`MongoDbContext` will not touch them; they need a rename.

**`Program.cs:763`** — startup `UpdateManyAsync` setting `Onboarding = { Phase = 0 }` on
legacy users where `Onboarding` is null. Wrapped in try/catch that logs *"Onboarding
backfill skipped (non-fatal)"*, so it has silently done nothing on every boot.

**`Services/Ai/AiCreditSeeder.cs:35`** — `GrantStarterCreditsAsync` reads all user ids to
grant starter credits. Reads empty, grants zero, always returns 0. **No user has ever
received starter credits through this path.**

### Integration tests (3) — pinned to the wrong names

| Test | Name used |
|---|---|
| `LevelUpTransactionIntegrationTests.cs:159` | `"ApplicationUsers"` |
| `LevelUpTransactionIntegrationTests.cs:172` | `"ApplicationUsers"` |
| `AiPersistenceIntegrationTests.cs:164` | `"users"` |

These seed their own fixtures, so they pass against collections that do not match
production. They will keep passing after a fix while production behaviour changes
underneath — the exact failure mode of pinning tests to the wrong data.

---

## Canonical fix — three options

**Option A — surgical.** Correct the literal at `MongoDbContext.cs:227` to
`"applicationUsers"`. Smallest diff; matches today's Identity convention exactly. Risk:
the name is asserted in two places (Identity's convention and our literal) with nothing
keeping them in step, so a package upgrade that changes the inflector reintroduces the
bug silently.

**Option B — attribute-based.** Add
`[CollectionName("applicationUsers")]` (`MongoDbGenericRepository.Attributes`) to
`ApplicationUser`. This is the library's own documented override and takes precedence over
the convention, so Identity and `MongoDbContext` would both read one declaration on the
type. Stronger guarantee than A. **Must be verified against Identity's own resolution
before adopting** — the attribute changes Identity's behaviour too, so the value has to
match the existing collection exactly or Identity starts reading an empty collection,
turning a display bug into an auth outage.

**Option C — composite.** Option B, plus renaming the two `"users"` references
(`Program.cs:763`, `AiCreditSeeder.cs:35`) and updating the three integration tests.
Fixes both bugs and removes the misleading fixtures in one pass. Largest blast radius;
strongest end state.

Recommendation: **Option C, sequenced**, with Option B verified in isolation first.

---

## Migration considerations

**No local data migration is needed.** No phantom `ApplicationUsers` or `users`
collection exists, because every write path is a non-upsert update and MongoDB
materialises a collection only on first insert. Nothing is stranded.

**Production requires a per-environment check** before deploying: confirm neither
`ApplicationUsers` nor `users` exists in each target database. If either does, an upsert
ran at some point and the documents in it are orphaned — they must be reconciled against
`applicationUsers` before the binding changes, or the data becomes unreachable.

**Behaviour activation is the real risk, not data loss.** Per write path:

| Path | Activation risk |
|---|---|
| Crossroads decision | **Triggers an idle feature.** The decision has never existed on any user. Downstream code that reads `CrossRoadsDecision` has only ever seen it absent — confirm it handles a populated value before enabling. |
| Entrepreneur promotion | **Triggers an idle feature.** Role `AddToSet` will start granting the Entrepreneur role. Verify the role exists and that gaining it mid-session behaves (menu, guards, dashboards). |
| Onboarding backfill | **Safe but bulk.** Runs at startup across all 50 users at once, setting `Onboarding.Phase = 0`, which bounces them through the onboarding gate on next login. Intended, but it lands on everyone simultaneously the first time it works. |
| Starter credits | **Safe but bulk.** Grants starter credits to every existing user on first successful run. `TryGrantInitialAsync` is described as idempotent — verify that before running, or every user gets credits repeatedly. |

---

## Test coverage requirements

The three tests above must be corrected **in the same commit as the binding**, not after.
Leaving them pinned to the wrong names means the suite stays green while production
behaviour changes, which is worse than having no test.

Beyond the rename, the batch should add at least one test that fails today: a read through
`MongoDbContext.ApplicationUsers` asserting it returns a user that Identity created. That
is the assertion whose absence let this survive.

---

## Recommended sequencing

1. Verify Option B in isolation — annotate `ApplicationUser`, confirm Identity still
   resolves `applicationUsers` and login works.
2. Fix the binding and the three integration tests in one commit.
3. Rename the two `"users"` references (second bug) in a separate commit.
4. Manually verify each write path in dev: Crossroads decision persists and returns 200;
   Creator→Entrepreneur promotion writes both `CompanyId` and the role.
5. Check each production environment for phantom `ApplicationUsers` / `users` collections;
   document and reconcile anything found.
6. Deploy behind a flag if available, otherwise in a low-traffic window — the onboarding
   backfill and credit grant both fire once, for every user, on first successful boot.
