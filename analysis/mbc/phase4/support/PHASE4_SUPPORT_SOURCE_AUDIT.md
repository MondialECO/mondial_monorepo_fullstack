# Phase 4.5 Support Source Audit & Precedence Hierarchy

## 1. Precedence Tiers

When opportunities conflict between an aggregator and a primary authority, the following hierarchy is deterministically enforced:

1. **Tier 1: Official Programme / Managing Authority** (`SourceAuthority.PrimaryOfficial`)
   - Direct source of truth for statutory conditions, application portals, and award rules.
   - Overrides all aggregator fields.
   - Examples: URSSAF for ACRE, France Travail for ARCE/ARE/AIF, Bpifrance for Bourse French Tech.

2. **Tier 2: Primary Official Rule Source** (`SourceAuthority.InstitutionalOfficial`)
   - Official publications and regulatory code (Legifrance, Code du Travail, Code de la Sécurité Sociale).
   - Validates legal text interpretations.

3. **Tier 3: Official Aggregator / Open Data** (`SourceAuthority.OfficialAggregator`)
   - Bulk ingestion source (Aides-entreprises Open Data).
   - Used for discovery, candidate identification, and baseline coverage.
   - Subordinated to Tier 1 when primary records exist for the same opportunity key.

4. **Tier 4: Secondary Discovery Only** (`SourceAuthority.SecondaryReference`)
   - Informational references, chambers of commerce guides, regional incubators.
   - Never used as sole authoritative evidence for eligibility.

---

## 2. 2026 Regulatory Changes Audited

- **ACRE (URSSAF)**:
  - 2026 application is **NOT automatic**.
  - Must be formally filed with URSSAF within 45 days of company registration.
  - Formulaire de demande d'ACRE required with justification of demandeur d'emploi or beneficiary status.
- **ARCE (France Travail)**:
  - Paid in two 50% installments of the 45% total entitlement of remaining ARE rights.
  - Second installment payable 6 months post-creation conditional on company still existing.
  - Mutually exclusive with Maintien de l'ARE.
- **Bourse French Tech (Bpifrance)**:
  - Up to €30,000 subvention (covering up to 70% of eligible pre-creation / creation expenditures).
  - Competitive selection mode: requires presentation to a Bpifrance / French Tech regional committee.
  - UI displays "Eligible to Apply", never "Approved".
