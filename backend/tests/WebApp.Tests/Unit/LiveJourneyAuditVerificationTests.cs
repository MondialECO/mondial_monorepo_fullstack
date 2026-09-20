using System;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests.Unit
{
    public class LiveJourneyAuditVerificationTests
    {
        private readonly ITestOutputHelper _output;

        public LiveJourneyAuditVerificationTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task Audit_RealMongo_CreatorJourneys_FormationAndMultiFounder()
        {
            var connStr = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/?retryWrites=true&w=majority";
            var client = new MongoClient(connStr);
            var db = client.GetDatabase("MondialEcoDev");
            var journeysColl = db.GetCollection<BsonDocument>("CreatorJourneys");

            var allJourneys = await journeysColl.Find(Builders<BsonDocument>.Filter.Empty).ToListAsync();
            _output.WriteLine($"[AUDIT] Total CreatorJourneys in DB: {allJourneys.Count}");

            int withFormation = 0;
            int withSasu = 0;
            int withSas = 0;
            int withSarl = 0;
            int multiFounderWithSasu = 0;
            int journeysWithBrokenFormation = 0;

            foreach (var doc in allJourneys)
            {
                var id = doc.Contains("_id") ? doc["_id"].ToString() : "unknown";
                var ideaId = doc.Contains("IdeaId") ? doc["IdeaId"].ToString() : (doc.Contains("ideaId") ? doc["ideaId"].ToString() : "null");
                var userId = doc.Contains("UserId") ? doc["UserId"].ToString() : (doc.Contains("userId") ? doc["userId"].ToString() : "null");

                BsonDocument p3 = null;
                if (doc.Contains("Phase3Data") && doc["Phase3Data"].IsBsonDocument) p3 = doc["Phase3Data"].AsBsonDocument;
                else if (doc.Contains("phase3Data") && doc["phase3Data"].IsBsonDocument) p3 = doc["phase3Data"].AsBsonDocument;

                BsonDocument fg = null;
                if (p3 != null)
                {
                    if (p3.Contains("FormationGenerator") && p3["FormationGenerator"].IsBsonDocument) fg = p3["FormationGenerator"].AsBsonDocument;
                    else if (p3.Contains("formationGenerator") && p3["formationGenerator"].IsBsonDocument) fg = p3["formationGenerator"].AsBsonDocument;
                }

                if (fg != null)
                {
                    string recType = fg.Contains("RecommendedType") ? fg["RecommendedType"].AsString : (fg.Contains("recommendedType") ? fg["recommendedType"].AsString : "");
                    string recReason = fg.Contains("RecommendationReason") ? fg["RecommendationReason"].AsString : (fg.Contains("recommendationReason") ? fg["recommendationReason"].AsString : "");

                    if (!string.IsNullOrEmpty(recType))
                    {
                        withFormation++;
                        _output.WriteLine($"Journey: {id}, IdeaId: {ideaId}, RecType: {recType}");

                        if (recType == "SAS-U") withSasu++;
                        else if (recType == "SAS") withSas++;
                        else if (recType == "SARL") withSarl++;

                        // Check if reason or data indicates multi-founder or derived from older inverted logic
                        bool hasMultiFounderSignals = false;
                        if (fg.Contains("CofounderDraft") && fg["CofounderDraft"].IsBsonDocument)
                        {
                            var cd = fg["CofounderDraft"].AsBsonDocument;
                            if (cd.Contains("RoleNeeded") && !string.IsNullOrWhiteSpace(cd["RoleNeeded"].AsString))
                                hasMultiFounderSignals = true;
                        }

                        if (hasMultiFounderSignals && recType == "SAS-U")
                        {
                            multiFounderWithSasu++;
                            journeysWithBrokenFormation++;
                            _output.WriteLine($"  -> FLAGGED: Multi-founder with SAS-U! Reason: {recReason}");
                        }
                    }
                }
            }

            _output.WriteLine("==================================================================");
            _output.WriteLine($"[AUDIT SUMMARY]");
            _output.WriteLine($"Total CreatorJourneys: {allJourneys.Count}");
            _output.WriteLine($"Journeys with Formation Generator: {withFormation}");
            _output.WriteLine($"Recommended Breakdown - SAS-U: {withSasu}, SAS: {withSas}, SARL: {withSarl}");
            _output.WriteLine($"Multi-founder Journeys holding SAS-U: {multiFounderWithSasu}");
            _output.WriteLine($"Journeys with broken formation logic: {journeysWithBrokenFormation}");
            _output.WriteLine("==================================================================");
        }
    }
}
