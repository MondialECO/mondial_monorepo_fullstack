export type AnalyticsMetricState = 'available' | 'notTracked' | 'notEnoughActivity';
export interface AnalyticsMetric { state: AnalyticsMetricState; value?: number | null; previousValue?: number | null; changePercentage?: number | null; unit: string; reason?: string | null }
export interface AnalyticsPeriod { range: string; from: string; to: string; comparisonFrom: string; comparisonTo: string; computedAt: string }
export interface AnalyticsOverview { grossRevenue: AnalyticsMetric; netRevenue: AnalyticsMetric; completedWork: AnalyticsMetric; submittedProposals: AnalyticsMetric; acceptedProposals: AnalyticsMetric; clients: AnalyticsMetric; averageDeliveryDays: AnalyticsMetric; onTimeRate: AnalyticsMetric }
export interface ServiceAnalytics { serviceId?: string | null; title: string; category: string; customUnattributed: boolean; status: string; impressions: AnalyticsMetric; serviceViews: AnalyticsMetric; clickThroughRate: AnalyticsMetric; enquiries: AnalyticsMetric; orders: AnalyticsMetric; conversionRate: AnalyticsMetric; enquiryConversion: AnalyticsMetric; averageSellingPrice: AnalyticsMetric; averageDeliveryDays: AnalyticsMetric; orderCompletionRate: AnalyticsMetric; onTimeDeliveryRate: AnalyticsMetric; cancellationRate: AnalyticsMetric; repeatOrders: AnalyticsMetric; grossRevenue: AnalyticsMetric; netRevenue: AnalyticsMetric }
export interface ProposalAnalytics { drafts: AnalyticsMetric; submitted: AnalyticsMetric; viewed: AnalyticsMetric; changesRequested: AnalyticsMetric; revised: AnalyticsMetric; clientReviewing: AnalyticsMetric; accepted: AnalyticsMetric; acceptanceRate: AnalyticsMetric; averageProposalValue: AnalyticsMetric; declined: AnalyticsMetric; withdrawn: AnalyticsMetric; expired: AnalyticsMetric; convertedToProject: AnalyticsMetric; proposalViewRate: AnalyticsMetric; clientResponseRate: AnalyticsMetric }
export interface TrustSignalAnalytics { key: string; label: string; weight: number; hasData: boolean; value?: number | null }
export interface ProfileAnalytics { trustScore: AnalyticsMetric; trustSignals: TrustSignalAnalytics[]; disputePenalty: AnalyticsMetric; profileCompleteness: AnalyticsMetric; verificationStatus: string; tierLevel: number; tierMeaning: string; skillsTestsTaken: AnalyticsMetric; skillsTestsPassed: AnalyticsMetric; latestSkillsTestScore: AnalyticsMetric; portfolioItems: AnalyticsMetric; publishedServices: AnalyticsMetric; profileViews: AnalyticsMetric; searchAppearances: AnalyticsMetric; portfolioViews: AnalyticsMetric; profileSaves: AnalyticsMetric; contactRate: AnalyticsMetric; portfolioEngagement: AnalyticsMetric }
export interface AnalyticsBreakdown { key: string; label: string; gross: number; commission: number; net: number; count: number }
export interface RevenueAnalytics { gross: AnalyticsMetric; net: AnalyticsMetric; commission: AnalyticsMetric; availableBalance: AnalyticsMetric; pendingBalance: AnalyticsMetric; protectedEscrow: AnalyticsMetric; withdrawn: AnalyticsMetric; averageProjectValue: AnalyticsMetric; highestProjectValue: AnalyticsMetric; byService: AnalyticsBreakdown[]; byClient: AnalyticsBreakdown[]; byMonth: AnalyticsBreakdown[]; byCategory: AnalyticsBreakdown[] }
export interface ActiveClientAnalytics { clientId: string; completedProjects: number; netRevenue: number }
export interface ClientAnalytics { totalClients: AnalyticsMetric; newClients: AnalyticsMetric; returningClients: AnalyticsMetric; repeatClients: AnalyticsMetric; repeatClientRate: AnalyticsMetric; completedEngagements: AnalyticsMetric; onTimeDeliveryRate: AnalyticsMetric; repeatClientRevenue: AnalyticsMetric; averageProjectsPerClient: AnalyticsMetric; averageClientLifetimeValue: AnalyticsMetric; averageClientRating: AnalyticsMetric; reviewCount: AnalyticsMetric; averageQualityRating: AnalyticsMetric; averageCommunicationRating: AnalyticsMetric; averageDeliveryRating: AnalyticsMetric; disputesOpened: AnalyticsMetric; disputesResolved: AnalyticsMetric; adverseDisputes: AnalyticsMetric; mostActiveClients: ActiveClientAnalytics[] }
export interface GrowthObservation { ruleId: string; title: string; message: string; tone: string; suggestedActions: string[] }
export interface AnalyticsEmptyStates { notEnoughActivityYet: boolean; noPublishedServices: boolean; noRevenueActivity: boolean }
export interface AnalyticsDashboard { period: AnalyticsPeriod; currency: string; availableCurrencies: string[]; historyStartedAt?: string | null; hasMinimumHistory: boolean; includesRecordsWithoutTestProvenance: boolean; dataLimitation: string; overview: AnalyticsOverview; services: ServiceAnalytics[]; proposals: ProposalAnalytics; profile: ProfileAnalytics; revenue: RevenueAnalytics; clients: ClientAnalytics; observations: GrowthObservation[]; unavailableObservationRuleIds: string[]; emptyStates: AnalyticsEmptyStates }
export interface AnalyticsFilters { range: string; currency: string; from?: string; to?: string }
export interface GrowthTask { id: string; taskType: string; title: string; description: string; status: string; triggerRuleId?: string | null; relatedEntityType?: string | null; relatedEntityId?: string | null; createdAt: string; updatedAt: string; expiresAt?: string | null }
export interface CreateGrowthTaskPayload { taskType: string; title: string; description: string; relatedEntityType?: string; relatedEntityId?: string; expiresAt?: string }

export interface ProviderDashboardIdentity {
  name: string;
  initials: string;
  imagePath?: string | null;
  verificationStatus: string;
  tierLevel: number;
  tierLabel: string;
  availableNow: boolean;
}

export interface ProviderDashboardMetrics {
  availableBalance: number;
  pendingEscrow: number;
  activeEngagements: number;
  deliverablesDueThisWeek: number;
  deliverablesDueToday: number;
  newLeads: number;
  nearestLeadExpiryAt?: string | null;
}

export interface ProviderDashboardTrust {
  hasEnoughData: boolean;
  score?: number | null;
  status: string;
}

export interface ProviderDashboardAttention {
  type: string;
  title: string;
  detail: string;
  action: string;
  href: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  dueAt?: string | null;
  matchPercentage?: number | null;
}

export interface ProviderDashboardLast30Days {
  briefsReviewed: number;
  proposalsSent: number;
  deliverablesSubmitted: number;
  averageResponseState: 'available' | 'notEnoughActivity';
  averageResponseMinutes?: number | null;
  averageResponseReason?: string | null;
}

export interface ProviderDashboardServiceViews {
  state: 'available' | 'notTracked';
  impressions?: number | null;
  clicks?: number | null;
  reason: string;
}

export interface ProviderDashboardActivity {
  type: string;
  text: string;
  occurredAt: string;
  href: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'slate';
}

export interface ProviderDashboardProgress {
  state: 'available' | 'notTracked';
  value?: number | null;
  detail: string;
}

export interface ProviderDashboard {
  computedAt: string;
  currency: string;
  provider: ProviderDashboardIdentity;
  metrics: ProviderDashboardMetrics;
  trust: ProviderDashboardTrust;
  attention: ProviderDashboardAttention[];
  last30Days: ProviderDashboardLast30Days;
  serviceViews: ProviderDashboardServiceViews;
  recentActivity: ProviderDashboardActivity[];
  profileStrength: ProviderDashboardProgress;
  tierProgress: ProviderDashboardProgress;
}
