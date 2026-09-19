# STAGE 7 FILE INDEX — LEGAL & COMPLIANCE INTELLIGENCE (FRANCE MVP)

| File Path | Purpose | Modification Type | Dependencies |
| :--- | :--- | :--- | :--- |
| `src/app/dashboard/creator/phase-3/compliance/page.tsx` | Rebuilt into full 3-Pane Legal Workspace integrating Left Nav, Center Canvas, and Right AI Rail | Modified | React, TanStack Query, Phase3SetupShell, Lucide |
| `src/components/creator/legal/LegalStageNavigation.tsx` | Left pane chronological stage navigation with completion progress and breakdown | Created | React, shadcn Badge & Progress, Lucide |
| `src/components/creator/legal/LegalRequirementCanvas.tsx` | Center pane primary canvas handling Overview synthesis and deep requirement detail view | Created | React, shadcn Card, Button, Badge, Lucide |
| `src/components/creator/legal/LegalAiGuideRail.tsx` | Right pane contextual AI guide rail providing summaries, checklists, and statutory FAQs | Created | React, shadcn Card, Button, Badge, Lucide |
| `src/components/creator/legal/LegalEvidenceModal.tsx` | Modal for linking existing vault documents or uploading new evidence files | Created | React, shadcn Dialog, Button, Badge, Lucide |
| `src/lib/api-creator-documents.ts` | Extended `CreatorIdeaDocumentType` with legal types and added `creatorDocumentsApi.upload` | Modified | Axios, FormData |
| `backend/Controllers/CreatorIdeaDocumentsController.cs` | Added secure `POST upload` endpoint for idea-scoped document uploads | Modified | ASP.NET Core, MongoDB Driver |
| `analysis/mbc/legal-compliance-implementation/STAGE_7_REPORT.md` | Comprehensive Stage 7 implementation report | Created | Markdown Documentation |
| `analysis/mbc/legal-compliance-implementation/STAGE_7_FILE_INDEX.md` | File index and dependency mapping for Stage 7 | Created | Markdown Documentation |
