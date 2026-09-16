using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests.Creator
{
    public class BrandKitDirectDbAuditTests
    {
        private readonly ITestOutputHelper _output;
        private const string ConnectionString = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
        private const string DatabaseName = "MondialEcoDev";

        public BrandKitDirectDbAuditTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task AuditBrandKitsInDatabase()
        {
            var client = new MongoClient(ConnectionString);
            var db = client.GetDatabase(DatabaseName);
            var collection = db.GetCollection<BrandKit>("brandKits");

            var allKits = await collection.Find(FilterDefinition<BrandKit>.Empty).ToListAsync();
            _output.WriteLine($"=== TOTAL BRAND KITS IN DB: {allKits.Count} ===");

            int completeCount = 0;
            int completeWithNullColorsConfirmedAt = 0;
            int completeWithNullTypographyConfirmedAt = 0;
            int completeWithBothConfirmedAt = 0;

            foreach (var kit in allKits)
            {
                var isComplete = string.Equals(kit.Status, "complete", StringComparison.OrdinalIgnoreCase);
                if (isComplete) completeCount++;

                var colorsConfirmed = kit.Colors?.ConfirmedAt;
                var typoConfirmed = kit.Typography?.ConfirmedAt;

                if (isComplete)
                {
                    if (colorsConfirmed == null) completeWithNullColorsConfirmedAt++;
                    if (typoConfirmed == null) completeWithNullTypographyConfirmedAt++;
                    if (colorsConfirmed != null && typoConfirmed != null) completeWithBothConfirmedAt++;
                }

                _output.WriteLine($"Kit Id: {kit.Id} | IdeaId: {kit.IdeaId} | Status: {kit.Status} | CurrentStep: {kit.CurrentStep} | Strategy.ConfirmedAt: {kit.Strategy?.ConfirmedAt:u} | Direction.SelectedAt: {kit.Direction?.SelectedAt:u} | Logo.ApprovedAt: {kit.Logo?.ApprovedAt:u} | Colors.ConfirmedAt: {colorsConfirmed:u} | Typography.ConfirmedAt: {typoConfirmed:u}");
            }

            _output.WriteLine("=== SUMMARY AUDIT REPORT ===");
            _output.WriteLine($"Total Brand Kits: {allKits.Count}");
            _output.WriteLine($"Complete Status Kits: {completeCount}");
            _output.WriteLine($"Complete with Colors.ConfirmedAt == null: {completeWithNullColorsConfirmedAt}");
            _output.WriteLine($"Complete with Typography.ConfirmedAt == null: {completeWithNullTypographyConfirmedAt}");
            _output.WriteLine($"Complete with BOTH ConfirmedAt != null: {completeWithBothConfirmedAt}");
        }
    }
}
