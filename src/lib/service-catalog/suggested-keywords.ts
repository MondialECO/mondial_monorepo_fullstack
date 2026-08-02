// Deterministic category → common keywords lookup for Step 1 (Service Catalog wizard).
// Not based on live search analytics (which don't exist per §9); a static mapping
// to help providers understand common terms for each category.

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Development: ['web development', 'app development', 'backend', 'API', 'database', 'deployment'],
  Design: ['UI design', 'UX design', 'logo design', 'branding', 'wireframes', 'prototypes'],
  Marketing: ['content marketing', 'social media', 'copywriting', 'SEO', 'email campaigns', 'analytics'],
  Legal: ['contracts', 'compliance', 'intellectual property', 'terms of service', 'privacy policy'],
  Finance: ['accounting', 'bookkeeping', 'tax planning', 'financial modeling', 'budgeting'],
  Accounting: ['tax preparation', 'audit', 'payroll', 'reconciliation', 'financial statements'],
  Operations: ['process improvement', 'project management', 'workflow optimization', 'systems setup'],
  Strategy: ['business planning', 'competitive analysis', 'market research', 'growth strategy'],
  DueDiligence: ['financial due diligence', 'legal review', 'market assessment', 'risk analysis'],
  FundraisingSupport: ['pitch deck', 'financial projections', 'investor relations', 'fundraising strategy'],
  AiAutomation: ['workflow automation', 'AI integration', 'data processing', 'chatbots', 'analytics automation'],
  HrRecruitment: ['recruiting', 'onboarding', 'training', 'employee engagement', 'HR policies'],
  Other: ['consulting', 'advisory', 'implementation', 'support'],
};

export function getSuggestedKeywordsForCategory(category: string): string[] {
  return CATEGORY_KEYWORDS[category] ?? CATEGORY_KEYWORDS.Other ?? [];
}
