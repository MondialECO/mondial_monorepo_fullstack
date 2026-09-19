# Mondial Business Creation (MBC) — Gap Analysis
## Creator Phase 3: Legal & Compliance Intelligence Audit

**Audit Date:** September 19, 2026  
**Severity Classification Scale:**
- **BLOCKER:** System cannot function correctly, violates core platform principles, or poses regulatory/legal liability if shipped.
- **HIGH:** Core workflow deficiency, significant UX impediment, or major architectural risk requiring resolution before MVP launch.
- **MEDIUM:** Functional limitation or technical debt that can be managed temporarily but degrades long-term maintainability.
- **LOW:** Polish item, secondary enhancement, or edge-case ergonomics.
- **OPTIONAL / LATER:** Post-MVP expansion feature (e.g. multi-country EU expansion, automated INPI API filings).

---

## 1. Product Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-PROD-01** | Legal Positioning & Claims | **BLOCKER** | Risk of user misunderstanding self-attestation as official legal certification. | UI displays "All critical regulatory and legal milestones achieved" without disclaimers. | Enforce Canon disclaimer: *"Planning guidance only. Not legal advice. Consult vetted French legal counsel before filing."* |
| **GAP-PROD-02** | Heuristic Rules vs Real Law | **BLOCKER** | Step 3.5 evaluates only `isFinTech` vs generic items. Non-FinTech SaaS, E-commerce, Marketplaces receive identical static checklists. | `CreatorPhase3Controller.GenerateLegalChecklist` has 12 hardcoded items with one boolean check (`isFinTech`). | Personalized applicability logic based on verified French legal rules (SaaS, B2C, Marketplace, Subscription, Consulting, etc.). |
| **GAP-PROD-03** | Missing Information Handling | **HIGH** | The system does not detect when crucial regulatory data is absent (e.g., whether physical premises exist, whether activity is regulated). | System generates a generic checklist regardless of missing inputs; zero follow-up mechanism exists. | Quick clarification question flow when business data is ambiguous (e.g. "Does your activity require professional licensing in France?"). |
| **GAP-PROD-04** | Business Plan Missing Legal Section | **HIGH** | The synthesized Business Plan (Step 3.3) has 11 sections but completely omits the Legal & Regulatory Framework. | `BusinessPlanOutputDto` contains 7 sections; UI displays 11 sections; none are Legal. | Section 12: "Legal & Regulatory Framework" must be populated and synchronized with Step 3.5 findings. |
| **GAP-PROD-05** | Stage-Based Sequencing | **MEDIUM** | Checklist items are grouped by domain (Corporate, IP, Privacy, Regulatory) rather than operational execution stage. | Founders see all 12 items simultaneously without knowing what must be done *Before Creation* vs *Before First Sale*. | Group requirements by chronological stage: *1. Before Company Creation, 2. At Creation, 3. Before Launch, 4. Before First Sale, 5. Ongoing*. |

---

## 2. Frontend Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-FE-01** | Full Legal Workspace UI | **HIGH** | `/phase-3/compliance/page.tsx` is a simple single-column card list, lacking a modern 3-pane workbench. | Single column list with basic checkboxes and inline expandable text blocks. | 3-pane responsive layout: Left stage navigation, Center requirements/evidence canvas, Right MBC AI context rail. |
| **GAP-FE-02** | Phase 3 Dashboard Smart Card | **HIGH** | Phase 3 dashboard lacks a dedicated Legal & Compliance smart card with detected archetype badges. | Phase 3 dashboard only displays generic progress metrics across the 7 steps. | Dedicated card displaying: Planning Readiness %, France Rules badge, detected archetypes (e.g., `SaaS • B2C • Subscription`), and action count. |
| **GAP-FE-03** | Document/Evidence Attachment UI | **MEDIUM** | Founders cannot attach proof files (e.g. proof of address, trademark receipt) directly to checklist items. | No file upload dropzone exists on checklist items; user can only toggle status checkbox. | Inline drag-and-drop file upload on items requiring evidence, linking to `CreatorIdeaDocument`. |
| **GAP-FE-04** | Official Source Transparency | **MEDIUM** | Checklist items display hardcoded plain text with no links to official French authorities. | Text reads "Implement GDPR protocols" with zero citation to CNIL or Service-Public. | Official source badge with verified external URL (e.g., `CNIL Deliberation`, `Code de commerce L. 123-1`, `Service-Public.fr`). |
| **GAP-FE-05** | Real-Time Concurrency Feedback | **LOW** | Clicking checkboxes rapidly causes debounce / race conditions with `creatorJourneyApi.updateLegalItem`. | Status toggles optimistically; rapid cycling can desynchronize UI from backend. | Concurrency lock / disabling button while PATCH is in flight (`busyItem` exists but needs robust queueing). |

---

## 3. Backend Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-BE-01** | Deterministic Applicability Engine | **BLOCKER** | No backend engine exists to evaluate business profile attributes against statutory legal rules. | `CreatorPhase3Controller.GenerateLegalChecklist` only has 2 hardcoded lists of strings. | Dedicated `ILegalApplicabilityEngine` evaluating `CreatorIdea.Project`, `BusinessModelSession`, and `ForecastSession` against France legal rules. |
| **GAP-BE-02** | Stale Analysis & Invalidation | **HIGH** | When a founder updates their Business Model (e.g., adds subscriptions or switches to B2C), the checklist does not invalidate. | Checklist is generated once and remains unchanged until manual regeneration. | Change detection: compute a content hash (`BusinessSnapshotHash`) and flag the legal analysis as `isPotentiallyOutdated`. |
| **GAP-BE-03** | Granular Status Lifecycle | **MEDIUM** | Checklist items only support `pending`, `in_progress`, and `done`. | Missing intermediate workflow statuses needed for legal diligence. | Support expanded statuses: `Not Started`, `Needs Information`, `Action Required`, `In Progress`, `Evidence Uploaded`, `Completed`, `Not Applicable`. |
| **GAP-BE-04** | Background Job Execution | **LOW** | Legal checklist generation is currently synchronous in `CreatorPhase3Controller.GenerateLegalChecklist`. | Synchronous HTTP call. If AI explanation or complex matching is added, request will exceed timeout. | Deterministic rules evaluate fast (<50ms synchronously); heavy AI explanations route through Hangfire background queue. |

---

## 4. Data-Model Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-DATA-01** | Substandard Checklist Item Schema | **BLOCKER** | `CreatorLegalChecklistItem` lacks metadata fields for legal compliance. | Only has: `Id`, `Label`, `Category`, `Status`, `Badge`, `ShowFindSp`, `SpSpecialty`, `AiGenerable`. | Must include: `Jurisdiction`, `Domain`, `Stage`, `WhyItApplies`, `OfficialSource`, `OfficialSourceUrl`, `Priority`, `EvidenceDocumentId`. |
| **GAP-DATA-02** | Missing Legal Assessment Entity | **HIGH** | No persistent model records the evaluated legal profile, detected business archetypes, or rules version. | Checklist items are stored bare inside `CreatorIdea.Phase3Data.LegalChecklist`. | Create `CreatorLegalAssessment` storing `EvaluatedAt`, `RulesVersion` (e.g. `"FR-2026.1"`), `DetectedArchetypes`, `ReadinessScore`, `Checklist`. |
| **GAP-DATA-03** | Restricted Document Vault Types | **HIGH** | `CreatorIdeaDocumentTypes` in `CreatorIdea.cs` strictly supports only `business_plan` and `financial_forecast`. | Any uploaded legal document is rejected by `CreatorIdeaDocumentTypes.IsSupported`. | Extend `CreatorIdeaDocumentTypes` with `legal_evidence`, `kbis_extract`, `statuts_draft`, `proof_of_address`, `dpa_contract`. |
| **GAP-DATA-04** | Zero Carry-Forward on Level Up | **HIGH** | `CreatorPhase6Controller.LevelUpAsync` transfers company name and cap table, but drops all legal checklist items and evidence. | Creator legal work is abandoned upon becoming an Entrepreneur; Entrepreneur Phase 2 starts from blank. | Transfer verified legal items and documents into `Companies.Documents` and `Companies.Legal` upon Level Up. |

---

## 5. AI Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-AI-01** | Risk of AI Hallucinating Legal Statutes | **BLOCKER** | If an LLM is asked "What laws apply to my startup?", it will hallucinate non-existent French code articles. | Generic LLM calls without strict grounding. | **Strict Separation:** Deterministic rules engine selects applicable requirements and citations; LLM is restricted strictly to plain-language explanation and drafting. |
| **GAP-AI-02** | Missing Legal Task Handler | **HIGH** | No `IAiTaskHandler` exists for legal analysis or explanation in `backend/Services/Ai/Jobs/`. | Handlers exist for Clarifier, BusinessPlan, BusinessModel, Forecast, IdeaGenerator. None for Legal. | Register `LegalExplainerHandler` implementing `IAiTaskHandler` with dynamic token limit configuration. |
| **GAP-AI-03** | Prompt Template & Output Schema | **MEDIUM** | No prompt template exists in `PromptTemplate.cs` for contextual legal explanation. | Only Probe, Clarifier, BusinessPlan, Forecast, BusinessModel templates exist. | Add `PromptTemplate.LegalExplanation` with locked JSON output schema and safety rules injection. |

---

## 6. Official-Source Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-SRC-01** | Zero Official Source Architecture | **BLOCKER** | Codebase contains zero data structures or catalogs of verified French legal and regulatory requirements. | Plain string labels in controller (`"Business bank account"`). | Structured French Legal Rule Registry (`FranceLegalRulesCatalog`) with official authorities (INPI, CNIL, URSSAF, DGCCRF, Service-Public). |
| **GAP-SRC-02** | Freshness & Versioning Metadata | **MEDIUM** | No mechanism exists to track when a legal rule was last verified or if statutory amendments occurred. | Zero timestamp or versioning on legal rules. | Each rule in the catalog must record `RuleId`, `EffectiveDate`, `LastVerifiedDate`, `SourceUrl`, `RegulatoryBody`. |
| **GAP-SRC-03** | Automated External Scraping (Non-Goal for MVP) | **OPTIONAL / LATER** | Scraping INPI or Service-Public.fr directly at runtime is brittle and error-prone. | No scraping exists. | Curated, versioned JSON catalogue for MVP; dynamic webhooks/scraping deferred to post-MVP. |

---

## 7. Security Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-SEC-01** | Evidence Document IDOR Risk | **HIGH** | Evidence files attached to legal items could be accessed by unauthorized users if not strictly tenant-scoped. | `CreatorIdeaDocumentsController.Download` checks `GetOwnedIdeaAsync`, which is good, but any new evidence endpoints must enforce identical checks. | Strict validation: verify caller owns the `UserId` and `IdeaId` before streaming physical evidence files. |
| **GAP-SEC-02** | File Upload MIME & Path Traversal | **HIGH** | Uploading legal evidence files (PDFs, images) must prevent malicious executable uploads and directory traversal. | `DocumentUploadController` has basic checks, but requires hardening for general evidence. | Enforce strict extension whitelist (`.pdf`, `.jpg`, `.jpeg`, `.png`), magic byte inspection, 10MB size limit, sanitized file names. |
| **GAP-SEC-03** | AI Prompt PII Leakage | **MEDIUM** | Founder personal identity information (e.g. passport numbers, home addresses) could leak into OpenRouter prompts. | Prompts currently send project concept and solution text. | Filter out raw identity documents, passport numbers, and personal addresses before passing context to OpenRouter. |

---

## 8. UX Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-UX-01** | Lack of Visual Stage Progression | **HIGH** | Founders cannot see what is urgent right now vs what is deferred to month 6. | Flat list of 12 items creates cognitive overload and decision paralysis. | Visual stage tabs: "1. Before Company Creation" -> "2. Company Creation" -> "3. Before First Sale". |
| **GAP-UX-02** | Contextual AI Assistant in Workspace | **MEDIUM** | Founders must leave the page to ask questions about legal items. | No contextual AI rail on Step 3.5. | Slide-over / right rail assistant with quick action pills: *"Why does this apply?"*, *"Show official source"*, *"What should I do next?"*. |
| **GAP-UX-03** | Clear Remediation for Low Readiness | **MEDIUM** | In Step 3.7 (Complete), if Legal Readiness is low, the remediation link simply reloads the generic checklist. | "Complete Legal & Compliance Items" routes to `/compliance` with no indication of what is blocking. | Deep link directly highlights the top 2 critical blocking items (e.g., missing business bank account or unassigned IP). |

---

## 9. Documentation Gaps

| Gap ID | Area | Severity | Description | Current State in Code/Docs | Target Requirement |
|---|---|---|---|---|---|
| **GAP-DOC-01** | Canon Out of Sync with Proposed Architecture | **HIGH** | `docs/product/creator-flow-canon.md` describes Step 3.5 as "advisory guidance" with 12 static items. | Canon §5.5 does not describe the Legal & Compliance Intelligence workspace, official France rules, or evidence linking. | Update Canon §5.5 and §11 upon implementation approval to record the new architecture. |
| **GAP-DOC-02** | Source of Truth Document Missing Legal Model | **MEDIUM** | `docs/system-architecture/07-source-of-truth.md` does not list legal compliance collections or evidence models. | Omitted from collection inventory. | Add `CreatorLegalAssessment` and `CreatorIdea.Documents` evidence linkage to the canonical entity map. |
