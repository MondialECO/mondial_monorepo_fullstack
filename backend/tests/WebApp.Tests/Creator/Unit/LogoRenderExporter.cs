using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using Xunit;

namespace WebApp.Tests.Creator.Unit
{
    public class LogoRenderExporter
    {
        [Fact]
        public async Task ExportAllReviewLogoData()
        {
            var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "raw_logo_exports");
            Directory.CreateDirectory(outputDir);

            var envMock = new Mock<IWebHostEnvironment>();
            envMock.Setup(e => e.WebRootPath).Returns(outputDir);

            var registry = new LogoMarkRendererRegistry();
            var service = new LogoGenerationService(registry, env: envMock.Object);

            var testCases = new List<(string Key, string Name, List<string> Traits, string DirName, string PrimaryColor, string BgColor)>
            {
                (
                    "cybersecurity",
                    "CyberLock",
                    new List<string> { "precision", "technical", "security", "bold" },
                    "Tech Precision",
                    "#0052FF",
                    "#0F172A"
                ),
                (
                    "sustainable_agri",
                    "TerraHarvest",
                    new List<string> { "organic", "sustainable", "warmth", "earthy" },
                    "Organic Warmth",
                    "#2D6A4F",
                    "#F4F1DE"
                ),
                (
                    "luxury_arch",
                    "Maison Forma",
                    new List<string> { "minimal", "editorial", "luxury", "bespoke" },
                    "Minimalist Luxe",
                    "#B38E5D",
                    "#121212"
                ),
                (
                    "long_name",
                    "BioSynthetic Quantum Therapeutics",
                    new List<string> { "scientific", "advanced", "clinical", "precision" },
                    "Clinical Precision",
                    "#0EA5E9",
                    "#090D16"
                ),
                (
                    "short_name",
                    "Onyx",
                    new List<string> { "bold", "compact", "premium", "geometric" },
                    "High Impact Bold",
                    "#6366F1",
                    "#0A0A0B"
                ),
                // 4 Directions for same brand (Directional Divergence Sheet)
                (
                    "cyber_dir_organic",
                    "CyberLock",
                    new List<string> { "organic", "sustainable", "warmth" },
                    "Organic Warmth",
                    "#10B981",
                    "#064E3B"
                ),
                (
                    "cyber_dir_luxe",
                    "CyberLock",
                    new List<string> { "luxury", "editorial", "bespoke", "architecture" },
                    "Refined Luxury",
                    "#D97706",
                    "#1C1917"
                ),
                (
                    "cyber_dir_industrial",
                    "CyberLock",
                    new List<string> { "bold", "heavy", "industrial", "power" },
                    "Industrial Bold",
                    "#EF4444",
                    "#18181B"
                )
            };

            var exportPayload = new List<object>();

            foreach (var tc in testCases)
            {
                var idea = new CreatorIdea
                {
                    Id = tc.Key,
                    Project = new CreatorJourneyProject { Name = tc.Name }
                };
                var kit = new BrandKit
                {
                    Strategy = new BrandStrategy { PersonalityTraits = tc.Traits },
                    Direction = new BrandDirection
                    {
                        SelectedDirectionKey = "d1",
                        Candidates = new List<BrandDirectionCandidate>
                        {
                            new() { Key = "d1", Name = tc.DirName }
                        }
                    }
                };

                var concepts = await service.GenerateConceptsAsync(idea, kit);

                var conceptList = new List<object>();
                foreach (var c in concepts)
                {
                    var markSvg = registry.RenderMarkSvg(c.Parameters!, tc.Name);
                    var lockupSvg = registry.RenderLockupSvg(c.Parameters!, tc.Name);
                    var lockupSingleColor = registry.RenderLockupSvg(c.Parameters!, tc.Name, tc.PrimaryColor);
                    var lockupBlack = registry.RenderLockupSvg(c.Parameters!, tc.Name, "#000000");
                    var lockupWhite = registry.RenderLockupSvg(c.Parameters!, tc.Name, "#FFFFFF");

                    conceptList.Add(new
                    {
                        key = c.Key,
                        family = c.Parameters!.Family,
                        descriptor = c.DescriptorLine,
                        parameters = c.Parameters.Values,
                        markSvg = markSvg,
                        lockupSvg = lockupSvg,
                        lockupSingleColor = lockupSingleColor,
                        lockupBlack = lockupBlack,
                        lockupWhite = lockupWhite,
                        markAssetUri = c.MarkAssetUri,
                        lockupAssetUri = c.LockupAssetUri
                    });
                }

                exportPayload.Add(new
                {
                    caseKey = tc.Key,
                    brandName = tc.Name,
                    direction = tc.DirName,
                    primaryColor = tc.PrimaryColor,
                    bgColor = tc.BgColor,
                    concepts = conceptList
                });
            }

            var json = JsonSerializer.Serialize(exportPayload, new JsonSerializerOptions { WriteIndented = true });
            var exportFilePath = Path.Combine(Directory.GetCurrentDirectory(), "exported_logos.json");
            await File.WriteAllTextAsync(exportFilePath, json);

            var rootDir = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "../../../../"));
            var rootExport = Path.Combine(rootDir, "exported_logos.json");
            await File.WriteAllTextAsync(rootExport, json);
        }
    }
}
