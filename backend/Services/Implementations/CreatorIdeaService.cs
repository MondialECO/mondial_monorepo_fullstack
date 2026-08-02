using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Services.Implementations
{
    /// <summary>
    /// Multi-idea STEP 3 service. Resolves/manages CreatorIdea documents and computes
    /// per-idea phase status by composing an idea with the user-level markers, then
    /// delegating to the UNCHANGED derivation engine
    /// (<see cref="ICreatorJourneyService.ComputePhaseStatusAsync"/>) through a
    /// transient journey-shaped view — one engine, no drift.
    ///
    /// NOT yet wired: no controller calls this until the step-4 cutover. Journey
    /// pointer writes (ActiveIdeaId / LeveledUpIdeaId) are targeted atomic $set
    /// updates — never a full-document replace.
    /// </summary>
    public class CreatorIdeaService : ICreatorIdeaService
    {
        private readonly MongoDbContext _context;
        private readonly ICreatorIdeaStore _ideas;
        private readonly ICreatorJourneyService _journeys;

        public CreatorIdeaService(
            MongoDbContext context,
            ICreatorIdeaStore ideas,
            ICreatorJourneyService journeys)
        {
            _context = context;
            _ideas = ideas;
            _journeys = journeys;
        }

        public async Task<CreatorIdea> GetOrCreateIdeaAsync(string userId, string ideaId = null)
        {
            // Explicit id → owner-scoped fetch, 404 on miss. NEVER fall back to the
            // active idea: a silent fallback would let a foreign/stale route id appear
            // to "work" while showing the wrong idea's data, masking bugs and probing.
            if (!string.IsNullOrEmpty(ideaId))
            {
                var owned = await _ideas.GetOwnedAsync(ideaId, userId);
                if (owned == null)
                    throw new CreatorJourneyException(404, "Idea not found.");
                return owned;
            }

            var journey = await _journeys.GetOrCreateAsync(userId);

            // Active pointer → resolve it (owner-scoped).
            if (!string.IsNullOrEmpty(journey.ActiveIdeaId))
            {
                var active = await _ideas.GetOwnedAsync(journey.ActiveIdeaId, userId);
                if (active != null)
                    return active;
                // Stale pointer (idea deleted/missing): fall through to recovery below.
            }

            // No (valid) active idea. Prefer the user's most recent idea over minting a
            // blank one — repointing preserves their data; creating would look like loss.
            var existing = await _ideas.ListByUserAsync(userId);
            if (existing.Count > 0)
            {
                await SetActivePointerAsync(journey.Id, existing[0].Id);
                return existing[0];
            }

            // Truly no ideas → mint the first, seeded from the journey's inline blocks
            // (empty for a fresh user; the pre-migration content for a legacy one —
            // matching the backfill and the Phase-2 finalize mint).
            var idea = new CreatorIdea
            {
                UserId = userId,
                Status = "active",
                Project = journey.Project ?? new CreatorJourneyProject(),
                Phase2Data = journey.Phase2Data ?? new CreatorPhase2Data(),
                Phase3Data = journey.Phase3Data ?? new CreatorPhase3Data(),
                Phase4Data = journey.Phase4Data ?? new CreatorPhase4Data(),
                Phase5Data = journey.Phase5Data ?? new CreatorPhase5Data(),
                SmartMatchmaking = journey.Phase6Data?.SmartMatchmaking ?? new CreatorSmartMatchmaking(),
                OutputSnapshots = journey.OutputSnapshots ?? new CreatorOutputSnapshots(),
            };
            await _ideas.AddAsync(idea);
            await SetActivePointerAsync(journey.Id, idea.Id);
            return idea;
        }

        public Task<List<CreatorIdea>> ListIdeasByUserAsync(string userId)
            => _ideas.ListByUserAsync(userId);

        public async Task<CreatorIdea> CreateIdeaAsync(string userId)
        {
            // Ensure the journey (pointer home) exists, then mint a BLANK idea — a new
            // idea starts empty; existing ideas are never touched.
            var journey = await _journeys.GetOrCreateAsync(userId);

            var idea = new CreatorIdea { UserId = userId, Status = "active" };
            await _ideas.AddAsync(idea);
            await SetActivePointerAsync(journey.Id, idea.Id);
            return idea;
        }

        public async Task<CreatorIdea> SetActiveIdeaAsync(string userId, string ideaId)
        {
            var idea = await _ideas.GetOwnedAsync(ideaId, userId);
            if (idea == null)
                throw new CreatorJourneyException(404, "Idea not found.");

            var journey = await _journeys.GetOrCreateAsync(userId);
            await SetActivePointerAsync(journey.Id, ideaId);
            await _ideas.TouchAsync(ideaId, userId);
            return idea;
        }

        public Task<ComputedJourneyStatus> ComputePhaseStatusAsync(CreatorIdea idea, bool phase1Complete, bool ideaLeveledUp)
        {
            // Adapter view: the engine reads Project/Phase2-5/Phase6(LevelUpTriggered,
            // SmartMatchmaking)/UserId — all supplied here. LevelUpTriggered is true only
            // for THE leveled-up idea, so the user's other ideas never inherit Phase-6
            // completion. Transient — never persisted.
            var view = new CreatorJourney
            {
                UserId = idea.UserId,
                Project = idea.Project,
                Phase2Data = idea.Phase2Data,
                Phase3Data = idea.Phase3Data,
                Phase4Data = idea.Phase4Data,
                Phase5Data = idea.Phase5Data,
                Phase6Data = new CreatorPhase6Data
                {
                    LevelUpTriggered = ideaLeveledUp,
                    SmartMatchmaking = idea.SmartMatchmaking ?? new CreatorSmartMatchmaking(),
                },
            };
            return _journeys.ComputePhaseStatusAsync(view, phase1Complete);
        }

        public async Task MarkIdeaLeveledUpAsync(string userId, string ideaId)
        {
            var idea = await _ideas.GetOwnedAsync(ideaId, userId);
            if (idea == null)
                throw new CreatorJourneyException(404, "Idea not found.");

            // Atomic once-per-user: match only while unset (or already this idea — the
            // idempotent re-call). First write wins; a different idea afterwards is 409.
            var res = await _context.CreatorJourneys.UpdateOneAsync(
                j => j.UserId == userId && (j.LeveledUpIdeaId == null || j.LeveledUpIdeaId == ideaId),
                Builders<CreatorJourney>.Update
                    .Set(j => j.LeveledUpIdeaId, ideaId)
                    .Set(j => j.UpdatedAt, DateTime.UtcNow));

            if (res.MatchedCount == 0)
                throw new CreatorJourneyException(409, "Another idea has already been taken through Level Up.");
        }

        /// <summary>Atomic ActiveIdeaId repoint ($set only — never a document replace).</summary>
        private Task SetActivePointerAsync(string journeyId, string ideaId)
            => _context.CreatorJourneys.UpdateOneAsync(
                j => j.Id == journeyId,
                Builders<CreatorJourney>.Update
                    .Set(j => j.ActiveIdeaId, ideaId)
                    .Set(j => j.UpdatedAt, DateTime.UtcNow));
    }
}
