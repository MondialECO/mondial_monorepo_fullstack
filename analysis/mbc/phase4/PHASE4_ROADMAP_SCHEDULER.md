# PHASE 4 ROADMAP SCHEDULER SPECIFICATION

## Scheduler Core Algorithm
The `RoadmapScheduler` implements deterministic, DAG-based task sequencing:

### 1. Cycle Prevention
- Before tasks are sequenced, `ValidateAndDetectCycles` runs depth-first search (DFS) with a 3-color node marker (0: unvisited, 1: visiting, 2: visited).
- If a circular dependency (e.g. `Task A -> Task B -> Task A`) is detected, the cycle is intercepted and reported, preventing any infinite loops or deadlocks.

### 2. Temporal Stage Constraints
- Legal checklist items preserve their upstream statutory temporal stage:
  - `before_creation` -> `NOW`
  - `company_creation` -> `NEXT_30_DAYS`
  - `before_launch` / `before_first_sale` -> `BEFORE_LAUNCH`
  - `ongoing` -> `POST_LAUNCH`

### 3. Dependency Elevation
- If Task A depends on Task B, Task A cannot be scheduled earlier than the stage immediately following Task B (or the same stage if unblocked).

### 4. Workload Pacing
- The scheduler computes `nowStageCapacity` from `WeeklyAvailability`.
- If a task is non-blocking and the `NOW` stage has reached capacity, the task is deferred to `NEXT_30_DAYS`.
