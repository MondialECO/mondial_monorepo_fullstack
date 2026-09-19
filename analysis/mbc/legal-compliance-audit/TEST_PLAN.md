# Mondial Business Creation (MBC) — Test Plan
## Creator Phase 3: Legal & Compliance Intelligence

**Audit Date:** September 19, 2026  
**Status:** Verification & Testing Specification for Target Architecture

---

## 1. Core Verification Strategy

To guarantee zero regressions, strict statutory accuracy, and full tenant isolation, testing spans 4 tiers:
1. **Unit Tests (.NET 8):** Test `BusinessProfileClassifier`, `FranceLegalRulesCatalog`, and `LegalApplicabilityEngine` against deterministic synthetic inputs.
2. **Integration Tests (.NET 8 + MongoDB):** Test `CreatorPhase3Controller`, `CreatorIdeaDocumentsController`, and `CreatorPhase6Controller.LevelUpAsync` with in-memory Mongo test containers.
3. **Frontend Component & E2E Tests (Jest / Playwright):** Test 3-pane Legal Workspace, stage navigation, drag-and-drop evidence upload, and AI rail interactions.
4. **Security & Data Isolation Tests:** Test tenant scoping (`UserId` + `IdeaId`), IDOR resistance, upload file extension validation, and AI prompt sanitization.

---

## 2. Comprehensive Test Scenarios

### Scenario 1: SaaS B2B France
- **Inputs:**
  - `Project.Sector`: "B2B SaaS / Enterprise Workflow"
  - `BusinessModel.canvas.customerSegments`: `["Enterprises", "Mid-market corporations"]`
  - `BusinessModel.canvas.revenueStreams`: `["Annual software license", "Implementation fee"]`
  - `BusinessModel.canvas.keyPartners`: `["AWS", "Azure"]`
- **Expected Legal Engine Behavior:**
  - Detects: `SaaS`, `B2B`, `OnlinePayment = false` (invoicing/SEPA), `PersonalData = true` (B2B business contacts).
  - Selected Requirements:
    - RGPD B2B compliance & Data Processing Agreements (DPA / CNIL)
    - Conditions Générales de Vente (CGV) inter-entreprises (Code de commerce L441-1)
    - Proprietary IP Assignment agreements for software code
    - Standard commercial contracts (SLA, NDA)
    - SAS formation via INPI Guichet unique
  - Excluded Requirements:
    - B2C 14-day consumer withdrawal rules (EXCLUDED)
    - Cookie banner for consumer tracking (EXCLUDED)
    - Consumer mediation service (EXCLUDED)

---

### Scenario 2: SaaS B2C Subscription France
- **Inputs:**
  - `Project.Sector`: "EdTech / Consumer App"
  - `BusinessModel.canvas.customerSegments`: `["Individual students", "Lifelong learners"]`
  - `BusinessModel.canvas.revenueStreams`: `["€19/month recurring subscription"]`
  - `BusinessModel.canvas.keyPartners`: `["Stripe"]`
- **Expected Legal Engine Behavior:**
  - Detects: `SaaS`, `B2C`, `Subscription`, `OnlinePayment`, `PersonalData`.
  - Selected Requirements:
    - DGCCRF / Code de la consommation: Mandatory 14-day right of withdrawal (`droit de rétractation`) notice & waiver checkbox before instant digital delivery.
    - Subscription auto-renewal notice & direct cancellation button (Loi "résiliation en 3 clics").
    - CNIL strict cookie/tracker consent banner (opt-in before non-essential cookies).
    - Terms of Service (CGU/CGV) with consumer dispute mediation body (Médiateur de la consommation).
    - PCI-DSS SAQ-A compliance via Stripe hosted checkout.

---

### Scenario 3: E-commerce B2C France (Physical Products)
- **Inputs:**
  - `Project.Sector`: "Sustainable Apparel"
  - `BusinessModel.canvas.keyActivities`: `["Warehousing", "Physical order fulfillment"]`
  - `BusinessModel.canvas.channels`: `["Shopify online store", "Parcel shipping"]`
- **Expected Legal Engine Behavior:**
  - Detects: `Ecommerce`, `B2C`, `PhysicalGoods`, `Shipping`.
  - Selected Requirements:
    - CGV e-commerce physique: Delivery times, transfer of risk, return shipping costs.
    - Legal warranty of conformity (2 years) & hidden defects warranty (`garantie des vices cachés`).
    - Packaging & recycling compliance (identifiant unique REP / ADEME).
    - Obligatory legal mentions (`Mentions légales`) including hosting provider, registered address, and SIRET.

---

### Scenario 4: Marketplace France (Two-Sided Platform)
- **Inputs:**
  - `Project.Sector`: "Freelance Specialist Platform"
  - `BusinessModel.canvas.keyActivities`: `["Matching buyers and service providers", "Escrow handling"]`
  - `BusinessModel.canvas.revenueStreams`: `["12% commission on completed transactions"]`
- **Expected Legal Engine Behavior:**
  - Detects: `Marketplace`, `Intermediation`, `PlatformOperator`.
  - Selected Requirements:
    - Platform operator transparency obligations (Article L111-7 du Code de la consommation: ranking algorithms, fee disclosure).
    - Separate Terms for Sellers/Providers (CGU Prestataires) and Terms for Buyers (CGU Clients).
    - Payment intermediation compliance: Verification that platform uses licensed payment service provider (PSP / Agent de PSP exemption check with ACPR).
    - Mandatory annual tax reporting notification to URSSAF / DGFIP for transactions facilitated on platform.

---

### Scenario 5: Consulting / Professional Services France
- **Inputs:**
  - `Project.Sector`: "Strategic Advisory & Management Consulting"
  - `BusinessModel.canvas.keyActivities`: `["Client advisory sessions", "Bespoke report delivery"]`
  - `BusinessModel.canvas.revenueStreams`: `["Daily consulting rate (€1,200/day)"]`
- **Expected Legal Engine Behavior:**
  - Detects: `Consulting`, `B2B`, `Services`.
  - Selected Requirements:
    - Assurance Responsabilité Civile Professionnelle (RC Pro) - strongly recommended/required for consulting contracts.
    - Standard Consulting Agreement (Contrat de prestation de services) with defined obligation de moyens vs obligation de résultat.
    - Non-disclosure and client confidentiality covenants.
    - Invoicing rules (Mention obligatoire: pénalités de retard, indemnité forfaitaire de 40€ pour frais de recouvrement).

---

### Scenario 6: Physical Business (Local Retail / Hospitality)
- **Inputs:**
  - `Project.Sector`: "Specialty Coffee Shop & Roastery"
  - `BusinessModel.canvas.keyResources`: `["Commercial lease", "Espresso machinery", "Retail store"]`
- **Expected Legal Engine Behavior:**
  - Detects: `PhysicalBusiness`, `Premises`, `FoodBeverage`.
  - Selected Requirements:
    - Commercial lease (Bail commercial 3/6/9) registration.
    - ERP (Établissement Recevant du Public) accessibility and fire safety authorization.
    - Hygiene training (HACCP) and declaration to DDPP.
    - SACEM license if music is played in the store.
    - Municipal display authorization for store signage (`enseigne commerciale`).

---

### Scenario 7: Regulated Activity Uncertain
- **Inputs:**
  - `Project.Concept`: "FinTech mobile micro-lending and wallet service."
  - `BusinessModel.canvas.revenueStreams`: `["Interest spread", "Interchange fee"]`
- **Expected Legal Engine Behavior:**
  - Classifier flags: `IsRegulatedActivityUncertain = true`.
  - System initiates a Clarification Step in the UI:
    - *"Your business involves financial transfers or lending, which may be regulated by the ACPR (Banque de France). Do you plan to hold customer funds directly or partner with a licensed banking-as-a-service provider?"*
  - User answers: "Partnering with licensed BaaS".
  - System dynamically adjusts roadmap: removes requirement for full credit institution license, adds requirement for BaaS partnership agreement & Agent de PSP registration.

---

### Scenario 8: Missing Project Information
- **Inputs:**
  - Fresh Creator who completed Clarifier with bare-bones answers (e.g. 5-word solution, no detailed revenue streams defined yet).
- **Expected Legal Engine Behavior:**
  - System does NOT crash or hallucinate defaults.
  - Generates the Universal Baseline Requirements (Guichet Unique INPI, Dépôt de capital, Mentions légales, RGPD de base).
  - Displays a banner in the Legal Workspace: *"Additional business model details needed. Once you refine your monetization in Step 3.2, specific e-commerce or subscription rules will appear here."*

---

### Scenario 9: Business Model Changed (Change Detection)
- **Steps:**
  1. Creator initially defined B2B SaaS (10 legal items generated).
  2. Creator navigates back to Step 3.2 (Business Model) and adds a B2C freemium tier and Stripe checkout.
  3. Creator returns to Step 3.5 (Legal).
- **Expected Legal Engine Behavior:**
  - `BusinessSnapshotHash` divergence detected (`IsPotentiallyOutdated = true`).
  - Alert banner displayed: *"Your business model changed (B2C & online payments added). Update your legal roadmap to see new statutory obligations."*
  - User clicks "Update Legal Roadmap":
    - Existing completed items are preserved.
    - New B2C consumer rights and Stripe PCI-DSS requirements are merged cleanly into the roadmap.

---

### Scenario 10: User Uploads Evidence Document
- **Steps:**
  1. Creator views requirement: *"Dépôt des Fonds & Attestation de blocage"*.
  2. Clicks "Upload Evidence" and attaches `attestation_depot_banque.pdf` (1.8 MB).
- **Expected Legal Engine Behavior:**
  - Backend verifies file extension (`.pdf`), MIME type, and size (<10 MB).
  - Saves file to uploads directory under idea-scoped subfolder.
  - Creates `CreatorIdeaDocument` record (`DocumentType = "capital_deposit_cert"`).
  - Links `document.Id` to requirement's `EvidenceDocumentId`.
  - Item status automatically flips to `evidence_uploaded` / `done`.
  - Planning Readiness score increments immediately.

---

### Scenario 11: Creator Converts to Entrepreneur (Level Up)
- **Steps:**
  1. Creator completes Phase 3, Phase 4, Phase 5, and triggers Level Up in Phase 6.
  2. `POST /api/creator/phase6/level-up` executes.
- **Expected Legal Engine Behavior:**
  - Company record created in `Companies`.
  - All verified legal evidence documents (`attestation_depot_banque.pdf`, `kbis_extract.pdf`) are mapped to `Companies.Documents` and `Companies.DataRoomDocuments`.
  - Company legal structure is confirmed as SAS.
  - When user is redirected to `/dashboard/entrepreneur`, Phase 2 displays the uploaded bank certificate and Kbis as verified.

---

### Scenario 12: Official Source or Network Unavailable
- **Inputs:**
  - External network disruption or user offline.
- **Expected Legal Engine Behavior:**
  - The local, versioned `FranceRules.json` catalogue is served from memory with zero external network dependency.
  - The system never fails because external government sites cannot be reached.
  - Official source links remain clickable external anchors opening in new browser tabs.

---

### Scenario 13: AI Generation / OpenRouter Fails
- **Steps:**
  1. Founder clicks "Explain simply" or "Draft standard template" in the right AI rail.
  2. OpenRouter returns HTTP 504 Gateway Timeout or HTTP 429 Rate Limit.
- **Expected Legal Engine Behavior:**
  - The core Legal Roadmap and checklist remain 100% functional and interactive.
  - The right AI rail displays an honest, retryable error state: *"AI explanation temporarily unavailable. Your legal requirements and official citations remain fully accurate above. [Retry AI]"*
  - Zero credits are debited from the user's account.
