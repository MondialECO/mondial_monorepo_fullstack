# Who owns a Company? — Terminology audit & canonical-term decision

**Date:** 2026-06-23 · **Question:** Are companies owned by Founders, Creators, Entrepreneurs, or Company Representatives?
**Method:** traced the term across Figma, backend entities, and UI. No code modified.

## TL;DR

Companies are owned by the **Entrepreneur** *role* (`Company.OwnerId` → an `ApplicationUser` in the Entrepreneur role), but that person is surfaced to users — in both Figma and the live UI — as a **"Founder."** **"Creator"** is the *earlier, separate* role that owns pre-company **BusinessIdeas**; the same human becomes an Entrepreneur through an explicit **"creator → entrepreneur transition."** **"Company Representative" does not exist anywhere in the product** (0 occurrences) — it is a distractor.

**Recommended canonical term: `Founder`** for the product/domain noun (the human who owns/leads a company), keeping **`Entrepreneur`** strictly as the internal auth-role identifier. Retire "Creator" for company owners and never introduce "Company Representative."

## What each source actually uses

| Source | Term(s) | Evidence |
|---|---|---|
| **Backend — role/auth** | **Entrepreneur** | `UserRole.ENTREPRENEUR`; `CompanyController.cs:225` "Promotes a Creator's BusinessIdea into an **entrepreneur** Company"; `Companies.cs` "Entrepreneur phases start at 2" |
| **Backend — Company FK** | **Owner** (generic) | `Companies.cs:14` `public string OwnerId` — the authoritative ownership field; no `FounderId`/`EntrepreneurId` on the entity |
| **Backend — identity/deal** | **Founder** | `BusinessIdeas.cs:22,107` `FounderIdentity` / `class FounderIdentity`; `DealExecution.cs:131` "**Founder** = ApplicationUser id; investor = catalogue InvestorId" |
| **Backend — idea stage** | **Creator** | `BusinessIdeas.cs:11` `CreatorId`; `CreatorDtos.cs`; `Companies.cs:15-17` provenance: "**creator→entrepreneur transition**" |
| **Figma** | **Founder** (primary); "Entrepreneur" only in legal copy | frame **"Phase 6 founder profile-overview"** (`22225:9271`); repeated **"Founder Info"** components; visible "**Founder** & CEO"; discovery search "Search Deals, Sectors, **founders**…"; term-sheet **signature block labelled "Entrepreneur"**; bio prose "…a fintech **entrepreneur**…" |
| **UI strings** | **Founder** (person-facing) vs **Entrepreneur** (role/route) | `Founder` ≈ **169** hits — "Contact Founder", "Message Founder", "Awaiting founder response", "back technical founders"; `Entrepreneur` ≈ **550** hits — role enum, `/dashboard/entrepreneur`, phase system, self-label "Demo Entrepreneur · Entrepreneur"; `Creator` ≈ **63**; `Representative` = **0** |

## The actual domain model (why the terms diverge)

```
Sign up → CREATOR (default role)  ──owns──►  BusinessIdea   (CreatorId, FounderIdentity)
            │
            │  "creator → entrepreneur transition"  (CompanyController:225,
            │   Company.SourceBusinessIdeaId records provenance)
            ▼
         ENTREPRENEUR (role)        ──owns──►  Company        (Company.OwnerId)
            │                                   phases 2–9, funding, cap table,
            │                                   data room, deals
            ▼
   surfaced to INVESTORS as ──────────────────► "FOUNDER"
   (Contact Founder · Founder profile · Founder ownership · deal "Founder")
```

So three different layers each picked a different word for the *same* human:
- **Role/identity layer** → `Entrepreneur` (and `Creator` for the pre-company stage).
- **Company entity FK** → generic `Owner` (`OwnerId`).
- **Product / investor-facing / Figma** → `Founder`.

There is **no** "Company Representative" anywhere — neither entity, role, DTO, nor UI string.

## Recommendation — one canonical term

**Use `Founder` as the canonical domain noun for "the person who owns/leads a Company."**

Rationale:
1. **It already wins where it matters to users.** Figma names the screen "founder profile" and its components "Founder Info"; investor-facing UI is almost entirely "Founder" (Contact/Message/Awaiting Founder). Investors say "founder," not "entrepreneur."
2. **It is role-agnostic.** A person mid "creator → entrepreneur transition" is awkward to call either "Creator" (too early) or "Entrepreneur" (a system role); "Founder" cleanly names their *relationship to the company*.
3. **`Entrepreneur` is overloaded** — it's simultaneously an auth role, a route namespace (`/dashboard/entrepreneur`), and a phase namespace. Reusing it as the human-facing noun perpetuates the ambiguity.

**Guardrails (so this stays a vocabulary decision, not a risky refactor):**
- **Keep `Entrepreneur` as the internal role enum value** (`UserRole.ENTREPRENEUR`, routes, phase keys). Do **not** rip out the ~550 references; "Entrepreneur" = *the role a Founder holds once they own a Company.*
- **Standardize all user-facing copy on "Founder"** (it mostly already is). When the role must be shown to the founder themselves, prefer "Founder" over "Entrepreneur" in product copy.
- **Reserve "Creator"** exclusively for the **pre-company idea stage** (`BusinessIdeas.CreatorId`). Don't use "Creator" to mean company owner.
- **Never introduce "Company Representative."** It has no backing in the model.
- *Optional cleanup:* the entity FK is `Company.OwnerId` (generic "Owner"). Leave as-is, but document that **Owner == Founder == the Entrepreneur-role user** so future code doesn't invent a fourth synonym.

**One-line glossary to adopt:**
> A **Creator** publishes **Ideas**. When an Idea becomes a real venture, the Creator becomes an **Entrepreneur** (the role) and owns a **Company**; in all product and investor-facing surfaces that person is called the **Founder**.
