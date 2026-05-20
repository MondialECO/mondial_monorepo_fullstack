// types/creator/create-idea-model.ts

export type IdeaStage = 'idea' | 'mvp' | 'beta' | 'live' | 'scaling';

export type ProductType = 'product' | 'service' | 'product & service';

export type WeeklyTimeAvailable =
  | 'less_than_5_hours'
  | '5_to_10_hours'
  | '10_to_20_hours'
  | 'more_than_20_hours';

export type IdeaStatus = 'DRAFT' | 'SUBMITTED';

export interface CreateIdeaModel {
  id?: string | null;

  // ===== Concept Overview =====
  name: string;
  problem_statement: string;
  target_audience: string;
  existing_solutions: string;

  // ===== Proposed Solution =====
  solution_description: string;
  stage: IdeaStage;
  differentiation: string;
  client_benefits: string;
  long_term_vision: string;

  // ===== Market Analysis =====
  primary_customer_segment: string;
  geographic_target: string;
  purchasing_behavior: string;
  market_size: string;

  // ===== Business Model =====
  product_type: ProductType;
  planned_price: string;
  sales_channels: string;
  startup_costs: string;
  revenue_12_months: string;

  // ===== Operations =====
  startup_requirements: string;
  prototype_status: 'I Have' | 'Haven’t';
  main_risks: string;

  // ===== Roadmap =====
  goals_30_days: string;
  targets_90_days: string;
  objectives_12_months: string;

  // ===== Risks & Compliance =====
  regulatory_considerations: string;
  legal_risks: string;
  certifications_licenses: string;

  // ===== Founder =====
  business_name: string;
  founder_role: string;
  experience_skills: string;
  prior_project_experience: string;
  weekly_time_available: WeeklyTimeAvailable;
  motivation_vision_statement: string;

  // ===== Equity =====
  amount_required: number;
  equity_percentage: number;

  // ===== Media & Docs =====
  media?: File[];        // images + videos (multipart)
  documents?: File[];   // pdf, docx, ppt

  // ===== Meta =====
  status?: IdeaStatus;  // default: DRAFT
}

// For form state management, we need to handle File objects for media and documents, so we create a separate type that omits the media and documents from CreateIdeaModel and replaces them with File arrays.
export type IdeaFormState = Omit<CreateIdeaModel, 'media' | 'documents'> & {
  media: File[];
  documents: File[];
};

export interface CreateIdeaApiRequest extends CreateIdeaModel {}

export interface SaveIdeaResponse {
  success: boolean;
  message: string;
  id?: string;
}














