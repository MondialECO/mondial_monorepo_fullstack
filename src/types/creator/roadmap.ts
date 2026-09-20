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
  estimatedEffort: RoadmapTaskEffort;
  estimatedDuration?: string;
  dependencies: string[];
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
  roadmap: OperationalRoadmap;
  updateAvailable: boolean;
  changedSources: string[];
  totalTasks: number;
  activeTasks: number;
  criticalTasks: number;
  completedTasks: number;
}

export interface UpdateRoadmapTaskRequest {
  taskId: string;
  status?: RoadmapTaskStatus;
  notes?: string;
  targetWindow?: string;
}
