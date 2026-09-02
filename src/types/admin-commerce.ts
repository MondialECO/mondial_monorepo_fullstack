export interface AdminCommerceMetrics {
  totalEscrowHeld?: number;
  activeEscrowContractsCount?: number;
  totalPlatformRevenue?: number;
  allTimeGMV?: number;
  openDisputesCount?: number;
  disputedAmountTotal?: number;
  pendingPayoutsCount?: number;
  pendingPayoutsAmount?: number;
  defaultCommissionPercentage?: number;
  activeEngagements?: number;
  completedEngagements?: number;
  openDisputes?: number;
  pendingPayoutRequests?: number;
  pendingPayoutVolume?: number;
  recentTransactionVolume30Days?: number;
  currency: string;
}

export interface AdminEngagementListItem {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  contractValue: number;
  currency: string;
  status: string;
  escrowStatus: string;
  milestonesCount: number;
  completionPercentage: number;
  createdAt: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  hasDispute: boolean;
}

export interface AdminParty {
  id: string;
  name: string;
  email: string;
  userName: string;
  roles: string[];
  phoneNumber?: string;
  emailConfirmed: boolean;
  kycStatus: string;
}

export interface AdminContractSummary {
  id: string;
  status: string;
  providerSignedAt?: string;
  clientSignedAt?: string;
  price: number;
  currency: string;
  pricingType: string;
  deliveryTimeValue: number;
  deliveryTimeUnit: string;
  includedRevisionCount: number;
  unlimitedRevisions: boolean;
  deliverables: string[];
  hourlyRate?: number;
  weeklyHourLimit?: number;
}

export interface AdminMilestone {
  id: string;
  engagementId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  displayOrder: number;
  status: string;
  escrowStatus: string;
  dueDate?: string;
  submittedAt?: string;
  approvedAt?: string;
  refundedAt?: string;
  disputeOpenedAt?: string;
  disputeResolvedAt?: string;
  disputeOutcome?: string;
  includedRevisionCount: number;
  usedRevisionCount: number;
  unlimitedRevisions: boolean;
  completionCriteria: string;
}

export interface AdminDeliverable {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  version: string;
  status: string;
  submittedAt: string;
  filesCount: number;
  linksCount: number;
}

export interface AdminFileMeta {
  id: string;
  milestoneId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  createdAt: string;
}

export interface AdminFinancialTransaction {
  id: string;
  createdAt: string;
  releasedAt?: string;
  transactionType: string;
  paymentStatus: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  engagementId?: string;
  engagementTitle?: string;
  milestoneId?: string;
  idempotencyKey: string;
}

export interface AdminEngagementDetail {
  id: string;
  proposalId: string;
  contractId: string;
  title: string;
  description: string;
  contractValue: number;
  currency: string;
  status: string;
  escrowStatus: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  client: AdminParty;
  provider: AdminParty;
  contract?: AdminContractSummary;
  milestones: AdminMilestone[];
  deliverables: AdminDeliverable[];
  transactions: AdminFinancialTransaction[];
  files: AdminFileMeta[];
}

export interface AdminDisputeListItem {
  milestoneId: string;
  milestoneTitle: string;
  engagementId: string;
  engagementTitle: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  amount: number;
  currency: string;
  disputeOpenedAt?: string;
  disputeResolvedAt?: string;
  status: string;
  outcome?: string;
  revisionCount: number;
}

export interface AdminDisputeDetail {
  milestone: AdminMilestone;
  engagement: AdminEngagementListItem;
  contract?: AdminContractSummary;
  deliverables: AdminDeliverable[];
  revisionHistory: Array<{
    id: string;
    milestoneId: string;
    requestedBy: string;
    description: string;
    requestedChanges: string[];
    status: string;
    scopeClassification: string;
    createdAt: string;
  }>;
  relatedTransactions: AdminFinancialTransaction[];
  currentDisputeOutcome?: string;
  disputeOpenedAt?: string;
  disputeResolvedAt?: string;
}

export interface AdminEscrowMilestoneItem {
  milestoneId: string;
  engagementId: string;
  engagementTitle?: string;
  title: string;
  clientName: string;
  providerName: string;
  amount: number;
  currency: string;
  status: string;
  fundedAt?: string;
  dueDate?: string;
  deliverablesCount: number;
  canRelease: boolean;
  hasDispute: boolean;
}

export interface AdminPayoutListItem {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  amount: number;
  currency: string;
  status: string;
  payoutMethodId?: string;
  payoutMethodLabel?: string;
  payoutMethod?: string;
  maskedDestination?: string;
  destinationDetails?: string;
  gatewayReference?: string;
  grossAmount?: number;
  feeAmount?: number;
  netAmount?: number;
  createdAt: string;
  requestedAt?: string;
  completedAt?: string;
}

export interface AdminPayoutRequestDto extends AdminPayoutListItem {
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  requestedAt?: string;
}

export interface AdminPayoutDetail {
  payout: AdminPayoutListItem;
  provider: AdminParty;
  availableBalance: number;
  withdrawnTotal: number;
  pendingPayoutsTotal: number;
  previousPayouts: AdminPayoutListItem[];
}

export interface AdminCommissionTierDto {
  tierLevel: number;
  tierName: string;
  commissionPercentage: number;
  eligibility: string;
  matchingPriority: string;
}

export interface AdminCommissionConfigDto {
  defaultCommissionPercentage: number;
  minimumFeeAmount: number;
  currency: string;
  categoryOverrides: Record<string, number>;
  isLocked?: boolean;
  policyStatement?: string;
  tiers?: AdminCommissionTierDto[];
  updatedAt?: string;
  updatedByAdminId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
