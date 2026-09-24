export type RoadmapStage =
  | 'NOW'
  | 'NEXT_30_DAYS'
  | 'DAYS_30_TO_60'
  | 'DAYS_60_TO_90'
  | 'BEFORE_LAUNCH'
  | 'POST_LAUNCH';

export type RoadmapTaskStatus =
  | 'NotStarted'
  | 'InProgress'
  | 'Blocked'
  | 'Done'
  | 'Skipped'
  | 'NeedsReview';

export type RoadmapTaskPriority =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Optional';

export type RoadmapTaskEffort =
  | 'Very Small'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'Very Large';

export interface RoadmapTask {
  id: string;
  key: string;
  title: string;
  description: string;
  category: string;
  stage: RoadmapStage;
  priority: RoadmapTaskPriority;
  status: RoadmapTaskStatus;
  blocking: boolean;
  why: string;
  expectedResult?: string;
  estimatedEffort: RoadmapTaskEffort;
  estimatedEffortHours?: number;
  estimatedDuration?: string;
  dependencies: string[];
  unblocks?: string[];
  source: string[];
  sourceReference: string[];
  relatedSnapshotItemKey?: string;
  earliestStart?: string;
  targetWindow?: string;
  requiresExternalAction: boolean;
  founderEdited: boolean;
  founderNotes?: string;
  generatedAt: string;
  updatedAt: string;
}

export interface NextBestAction {
  taskId: string;
  title: string;
  whyNow: string;
  priority: RoadmapTaskPriority;
  blocking: boolean;
  source: string[];
}

export interface OperationalRoadmap {
  status: string;
  generatedAt: string;
  updatedAt: string;
  roadmapSummary: string;
  stages: RoadmapStage[];
  tasks: RoadmapTask[];
  nextBestAction?: NextBestAction;
  sourceVersions: Record<string, unknown>;
  founderEdited: boolean;
}

export interface OperationalRoadmapResponse {
  roadmap: OperationalRoadmap | null;
  updateAvailable: boolean;
  changedSources: string[];
  totalTasks?: number;
  totalTasksCount?: number;
  activeTasks?: number;
  activeTasksCount?: number;
  criticalTasks?: number;
  criticalTasksCount?: number;
  completedTasks?: number;
  completedTasksCount?: number;
  ideaVersion?: number;
  weeklyAvailability?: string;
  capacityTier?: string;
  capacityMessage?: string;
  maxNowTasks?: number;
  knownEffortHours?: number | null;
  unestimatedTasksCount?: number;
  planStatus?: string;
}

export interface UpdateRoadmapTaskRequest {
  taskId: string;
  ideaId?: string;
  expectedVersion?: number;
  status?: RoadmapTaskStatus;
  notes?: string;
  founderNotes?: string;
  targetWindow?: string;
  estimatedEffort?: RoadmapTaskEffort | string;
  estimatedEffortHours?: number;
}

export interface UpdateAvailabilityRequest {
  weeklyAvailability: string;
  ideaId?: string;
  expectedVersion?: number;
}
