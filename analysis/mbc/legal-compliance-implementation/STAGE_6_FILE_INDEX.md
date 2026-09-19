# STAGE 6 FILE INDEX — LEGAL & COMPLIANCE INTELLIGENCE (FRANCE MVP)

| File Path | Purpose | Modification Type | Dependencies |
| :--- | :--- | :--- | :--- |
| `src/components/creator/Phase3LegalCard.tsx` | Stage 6 Smart Dashboard Card displaying Legal Planning Readiness, France rules badge, stage counters, profile chips, stale detection, and CTA | Created | React, TanStack Query, Lucide Icons, shadcn/ui Card, Badge, Progress, Button |
| `src/lib/api-creator-journey.ts` | Added TypeScript contracts (`LegalComplianceOverview`, `CreatorLegalAssessmentDto`, etc.) and API client methods (`getLegalOverview`, `evaluateLegalCompliance`, etc.) | Modified | Axios, journey-api types |
| `src/app/dashboard/creator/page.tsx` | Imported and integrated `Phase3LegalCard` into the primary left column of the Creator Dashboard | Modified | `Phase3LegalCard.tsx`, React |
| `src/app/dashboard/creator/phase-3/compliance/page.tsx` | Added `useSearchParams` to preserve `ideaId` when navigating from the smart card | Modified | Next.js navigation, React |
| `analysis/mbc/legal-compliance-implementation/STAGE_6_REPORT.md` | Comprehensive Stage 6 integration report | Created | Markdown Documentation |
| `analysis/mbc/legal-compliance-implementation/STAGE_6_FILE_INDEX.md` | File index and dependency mapping for Stage 6 | Created | Markdown Documentation |
