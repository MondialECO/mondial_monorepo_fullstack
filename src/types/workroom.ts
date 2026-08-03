// Literal unions below mirror the C# enums in backend/Models/DatabaseModels/Workroom.cs,
// which serialise as names since f673521. Order and spelling must track that file.
export type DeliverableStatusValue = 'Draft' | 'Submitted' | 'Locked' | 'Superseded' | 'Approved' | 'Restricted';
export type RevisionScopeValue = 'WithinScope' | 'NeedsClarification' | 'PotentialScopeChange' | 'ConfirmedScopeChange';
export type RevisionRequestStatusValue = 'FeedbackCollecting' | 'Submitted' | 'Accepted' | 'InProgress' | 'Resolved' | 'Declined' | 'Cancelled';
export type WorkroomTaskVisibilityValue = 'ClientVisible' | 'ProviderPrivate' | 'SharedTeam';
export type WorkroomTaskStatusValue = 'NotStarted' | 'InProgress' | 'Blocked' | 'Completed' | 'Cancelled';
export type ClientInputTypeValue = 'File' | 'Decision' | 'Feedback' | 'Approval' | 'Clarification' | 'Meeting';
export type ClientInputStatusValue = 'Requested' | 'Supplied' | 'Cancelled';
export type WorkroomFileStatusValue = 'Selected' | 'Uploading' | 'Scanning' | 'Ready' | 'Failed' | 'Archived' | 'Restricted';
export type ReviewVisibilityValue = 'Public' | 'Private';
export type ReviewVerificationStatusValue = 'Pending' | 'Verified' | 'Rejected';

// ContractTerms KEEPS string | number. Its four enums — PricingModel, DeliveryTimeUnit,
// DeliveryDayType, DeliveryStartRule — live in ApplicationUser.cs and ServiceCatalog.cs,
// not Workroom.cs, so f673521 did not annotate them and they still arrive as integers.
// Callers must keep going through the label helpers in lib/workroom-format.
export interface ContractTerms { price: number; currency: string; pricingType: string | number; deliveryTimeValue: number; deliveryTimeUnit: string | number; deliveryDayType: string | number; deliveryStartRule: string | number; includedRevisionCount: number; unlimitedRevisions: boolean; revisionRequestWindowDays: number; deliverables: string[]; allowsParallelMilestones: boolean; hourlyRate?: number | null; weeklyHourLimit?: number | null }
export interface Engagement { id: string; proposalId: string; providerId: string; clientId: string; clientDisplayName: string; providerDisplayName: string; contractId: string; title: string; description: string; contractValue: number; currency: string; startDate?: string | null; expectedEndDate?: string | null; actualEndDate?: string | null; currentMilestoneId?: string | null; completionPercentage: number; engagementStatus: string; escrowStatus: string; pausedAt?: string | null; accumulatedPausedMinutes: number; createdAt: string; updatedAt: string }
export interface Contract { id: string; terms: ContractTerms; providerSignedAt?: string | null; clientSignedAt?: string | null; status: string; simpleConsentStub: boolean }
export interface Milestone { id: string; title: string; description: string; amount: number; currency: string; displayOrder: number; startDate?: string | null; dueDate?: string | null; completionCriteria: string; remainingRevisions: number; unlimitedRevisions: boolean; status: string; escrowStatus: string; deliveryClockState: string; extensionRequested: boolean; approvedExtensionDays: number; reviewWindowEndsAt?: string | null; autoReleaseAt?: string | null; disputeOpenedAt?: string | null; disputeReviewEndsAt?: string | null; disputeOutcome?: string | null; disputeResolvedAt?: string | null; refundedAt?: string | null }
export interface Deliverable { id: string; milestoneId: string; title: string; description: string; version: string; fileIds: string[]; externalLinks: string[]; submissionMessage: string; clientInstructions: string; submittedAt: string; deliverableStatus: DeliverableStatusValue }
export interface RevisionRequest { id: string; milestoneId: string; deliverableId: string; description: string; requestedChanges: string[]; dueDate?: string | null; scopeClassification: RevisionScopeValue; revisionRequestStatus: RevisionRequestStatusValue }
export interface WorkroomTask { id: string; title: string; description: string; dueDate?: string | null; visibility: WorkroomTaskVisibilityValue; status: WorkroomTaskStatusValue }
export interface ClientInput { id: string; type: ClientInputTypeValue; description: string; dueDate?: string | null; deliveryImpact: string; status: ClientInputStatusValue }
// storagePath is server-root-relative ("/uploads/documents/{guid}.ext"), served by the
// auth-gated download endpoint (3b11c98) rather than statically.
export interface WorkroomFile { id: string; engagementId: string; milestoneId?: string | null; uploadedBy: string; originalName: string; storagePath: string; contentType: string; sizeBytes: number; status: WorkroomFileStatusValue; providerPrivate: boolean; immutable: boolean; createdAt: string }
export interface HourlyTimeEntry { id: string; engagementId: string; providerId: string; startedAt: string; endedAt: string; description: string; clientApproved: boolean; createdAt: string }
export interface Review { id: string; engagementId: string; clientId: string; providerId: string; overallRating: number; qualityRating: number; communicationRating: number; deliveryRating: number; professionalismRating: number; valueRating: number; writtenReview: string; providerResponse?: string | null; visibility: ReviewVisibilityValue; submittedAt: string; verificationStatus: ReviewVerificationStatusValue }
export interface WorkroomDetail { engagement: Engagement; contract: Contract; milestones: Milestone[]; deliverables: Deliverable[]; revisionRequests: RevisionRequest[]; tasks: WorkroomTask[]; clientInputRequests: ClientInput[]; files: WorkroomFile[]; hourlyTimeEntries: HourlyTimeEntry[]; review?: Review | null }
export interface FinancialTransaction { id: string; engagementId?: string; milestoneId?: string | null; clientId?: string; grossAmount: number; currency: string; commissionAmount: number; netAmount: number; transactionType: string; paymentStatus: string; createdAt: string; releasedAt?: string | null }
export interface PayoutMethod { id: string; rail: string; displayName: string; maskedDescriptor: string; verified: boolean; createdAt: string }
export interface FinancialSettings { payoutMethods: PayoutMethod[]; defaultPayoutMethodId?: string | null; accountOnHold: boolean; minimumPayoutAmount: number; tax: { legalName?: string; countryCode?: string; taxIdentifierMasked?: string | null; vatRegistered: boolean; vatNumberMasked?: string | null } }
export interface Payout { id: string; payoutMethodId: string; amount: number; currency: string; status: string; createdAt: string; updatedAt: string; completedAt?: string | null }
export interface Invoice { id: string; invoiceNumber: string; engagementId: string; milestoneId?: string | null; grossAmount: number; commissionAmount: number; netAmount: number; currency: string; approvalDate?: string | null; releaseDate?: string | null; status: string; correctsInvoiceId?: string | null; createdAt: string }
export interface FinancialSummary { workInProgress: number; inReview: number; pending: number; available: number; withdrawn: number; onHold: number; protectedEscrow: number; grossEarnings: number; commissionPaid: number; netEarnings: number; currency: string; availableCurrencies: string[]; transactions: FinancialTransaction[]; payouts: Payout[]; invoices: Invoice[]; settings: FinancialSettings }
export interface FinancialStatement { from: string; to: string; openingBalance: number; gross: number; commission: number; adjustments: number; payouts: number; closingBalance: number; transactions: FinancialTransaction[] }
export interface TaxSettingsPayload { legalName: string; countryCode: string; taxIdentifierMasked?: string; vatRegistered: boolean; vatNumberMasked?: string }
export interface SubmitDeliverablePayload { title: string; description: string; fileIds: string[]; externalLinks: string[]; submissionMessage: string; clientInstructions: string; allDeliverablesIncluded: boolean; filesReviewed: boolean; noUnrelatedPrivateInfo: boolean; readyForReview: boolean; majorScopeVersion: boolean }
export interface CreateTaskPayload { title: string; description: string; milestoneId?: string | null; assigneeId?: string; dueDate?: string | null; visibility: string }
export interface CreateClientInputPayload { type: string; description: string; milestoneId?: string | null; dueDate?: string | null; deliveryImpact: string }
export interface CreateTimeEntryPayload { startedAt: string; endedAt: string; description: string }
