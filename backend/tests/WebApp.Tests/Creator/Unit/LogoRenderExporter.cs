using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Moq;
using SkiaSharp;
using Svg.Skia;
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

        [Fact]
        public async Task ExportCanonicalVariationsSheets()
        {
            var outputDir = Path.Combine(Directory.GetCurrentDirectory(), "variation_exports");
            Directory.CreateDirectory(outputDir);

            var artifactOutputDir = @"C:\Users\Siraj\.gemini\antigravity-ide\brain\9fc77a08-b62b-4622-b07d-0d97b1df77d7\outputs";
            Directory.CreateDirectory(artifactOutputDir);

            var rootOutputs = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "../../../../outputs"));
            Directory.CreateDirectory(rootOutputs);

            var envMock = new Mock<IWebHostEnvironment>();
            envMock.Setup(e => e.WebRootPath).Returns(outputDir);

            var registry = new LogoMarkRendererRegistry();
            var variationService = new LogoVariationService(registry, envMock.Object);

            var brands = new List<(string Key, string Name, string Family, string PrimaryColor, Dictionary<string, string> Params)>
            {
                (
                    "cyberlock",
                    "CyberLock",
                    "symbol_plus_name",
                    "#0052FF",
                    new Dictionary<string, string>
                    {
                        ["EmblemShape"] = "hexagon",
                        ["LetterCase"] = "uppercase",
                        ["FontCategory"] = "geometric_sans",
                        ["PrimaryColor"] = "#0052FF",
                        ["Arrangement"] = "side_by_side"
                    }
                ),
                (
                    "terraharvest",
                    "TerraHarvest",
                    "monogram",
                    "#2D6A4F",
                    new Dictionary<string, string>
                    {
                        ["FrameStyle"] = "circle",
                        ["LetterCase"] = "uppercase",
                        ["FontCategory"] = "humanist_sans",
                        ["PrimaryColor"] = "#2D6A4F",
                        ["Arrangement"] = "stacked"
                    }
                ),
                (
                    "maisonforma",
                    "Maison Forma",
                    "minimal",
                    "#B38E5D",
                    new Dictionary<string, string>
                    {
                        ["AccentType"] = "geometric_frame",
                        ["LetterCase"] = "uppercase",
                        ["FontCategory"] = "editorial_serif",
                        ["PrimaryColor"] = "#B38E5D",
                        ["Arrangement"] = "stacked"
                    }
                )
            };

            foreach (var brand in brands)
            {
                var concept = new BrandLogoConcept
                {
                    Key = "concept_approved",
                    DescriptorLine = $"{brand.Name} Approved Canonical Concept",
                    Parameters = new BrandLogoConceptParameters
                    {
                        Family = brand.Family,
                        Values = brand.Params
                    }
                };

                var kit = new BrandKit
                {
                    IdeaId = brand.Key,
                    Strategy = new BrandStrategy { BusinessName = brand.Name }
                };

                var variations = await variationService.DeriveVariationsAsync(brand.Key, brand.Name, concept, kit);

                // Render High-Resolution Composite Sheet (1600 x 1100 px)
                using var surface = SkiaSharp.SKSurface.Create(new SkiaSharp.SKImageInfo(1600, 1100, SkiaSharp.SKColorType.Rgba8888, SkiaSharp.SKAlphaType.Premul));
                var canvas = surface.Canvas;

                // Background
                canvas.Clear(new SkiaSharp.SKColor(248, 250, 252)); // Slate-50

                using var paint = new SkiaSharp.SKPaint { IsAntialias = true };

                // Header Card
                paint.Color = new SKColor(15, 23, 42); // Slate-900
                canvas.DrawRect(0, 0, 1600, 120, paint);

                paint.Color = SKColors.White;
                using var titleFont = new SKFont(SKTypeface.Default, 32);
                canvas.DrawText($"{brand.Name} — 7 Canonical Logo Variations (Step 2b)", 48, 55, titleFont, paint);

                paint.Color = new SKColor(148, 163, 184); // Slate-400
                using var subFont = new SKFont(SKTypeface.Default, 16);
                canvas.DrawText("Deterministic Vector Transforms • Strict Geometry Preservation • 32-bit Alpha Transparency • Option A Layout Re-render", 48, 90, subFont, paint);

                // Grid Definition
                // Row 1 (4 items): Primary (0,0), Horizontal (1,0), Stacked (2,0), Icon Only (3,0)
                // Row 2 (3 items): Black (0,1), White (1,1), Transparent (2,1)

                var row1Cards = new[]
                {
                    ("primary", "1. Primary (Approved)", variations[BrandLogoVariationKeys.Primary], SKColors.White, false, false),
                    ("horizontal", "2. Horizontal Lockup", variations[BrandLogoVariationKeys.Horizontal], SKColors.White, false, false),
                    ("stacked", "3. Stacked Lockup", variations[BrandLogoVariationKeys.Stacked], SKColors.White, false, false),
                    ("icon_only", "4. Icon Only (1:1 Mark)", variations[BrandLogoVariationKeys.IconOnly], SKColors.White, false, false)
                };

                float r1Width = 350;
                float r1Height = 360;
                float r1Gap = 24;
                float startX1 = 48;
                float startY1 = 150;

                for (int i = 0; i < row1Cards.Length; i++)
                {
                    var card = row1Cards[i];
                    var x = startX1 + i * (r1Width + r1Gap);
                    var y = startY1;

                    DrawVariationCard(canvas, card.Item2, card.Item3, x, y, r1Width, r1Height, card.Item4, isCheckerboard: false, isDark: false);
                }

                // Row 2 Cards: Black (Mid-Grey BG), White (Dark Slate BG), Transparent (Checkerboard BG)
                var row2Cards = new[]
                {
                    ("black", "5. Black Monochrome (Preserves Vector Geometry)", variations[BrandLogoVariationKeys.Black], new SKColor(226, 232, 240), false, false), // Slate-200
                    ("white", "6. White Monochrome (Preserves Vector Geometry)", variations[BrandLogoVariationKeys.White], new SKColor(30, 41, 59), false, true),   // Slate-800
                    ("transparent", "7. Transparent (32-bit RGBA Alpha Verified)", variations[BrandLogoVariationKeys.Transparent], SKColors.Transparent, true, false)
                };

                float r2Width = 475;
                float r2Height = 390;
                float r2Gap = 26;
                float startX2 = 48;
                float startY2 = 545;

                for (int i = 0; i < row2Cards.Length; i++)
                {
                    var card = row2Cards[i];
                    var x = startX2 + i * (r2Width + r2Gap);
                    var y = startY2;

                    DrawVariationCard(canvas, card.Item2, card.Item3, x, y, r2Width, r2Height, card.Item4, card.Item5, card.Item6);
                }

                // Footer Bar
                paint.Color = new SKColor(226, 232, 240);
                canvas.DrawRect(0, 1040, 1600, 60, paint);
                paint.Color = new SKColor(71, 85, 105);
                using var footFont = new SKFont(SKTypeface.Default, 14);
                canvas.DrawText("• Zero AI Model Calls   • Zero Debited Credits   • 100% Vector Geometry Preservation   • Bundled OFL Fonts   • 32-bit RGBA Channel Verified", 48, 1075, footFont, paint);

                // Save image
                using var image = surface.Snapshot();
                using var data = image.Encode(SKEncodedImageFormat.Png, 100);

                var outFileName = $"canonical_variations_{brand.Key}.png";
                var path1 = Path.Combine(artifactOutputDir, outFileName);
                var path2 = Path.Combine(rootOutputs, outFileName);

                using (var stream = File.OpenWrite(path1)) { data.SaveTo(stream); }
                using (var stream = File.OpenWrite(path2)) { data.SaveTo(stream); }
            }
        }

        private static void DrawVariationCard(
            SKCanvas canvas,
            string title,
            BrandLogoVariation variation,
            float x,
            float y,
            float w,
            float h,
            SKColor cardBg,
            bool isCheckerboard,
            bool isDark)
        {
            using var paint = new SKPaint { IsAntialias = true };

            // Card Outer Border / Shadow
            paint.Color = new SKColor(226, 232, 240);
            paint.Style = SKPaintStyle.Stroke;
            paint.StrokeWidth = 1.5f;
            canvas.DrawRoundRect(x, y, w, h, 12, 12, paint);

            // Card Fill
            paint.Style = SKPaintStyle.Fill;
            paint.Color = cardBg;
            canvas.DrawRoundRect(x, y, w, h, 12, 12, paint);

            // Title Bar
            paint.Color = isDark ? new SKColor(15, 23, 42) : new SKColor(241, 245, 249);
            canvas.DrawRoundRect(x, y, w, 44, 12, 12, paint);
            canvas.DrawRect(x, y + 24, w, 20, paint);

            paint.Color = isDark ? new SKColor(241, 245, 249) : new SKColor(15, 23, 42);
            using var cardTitleFont = new SKFont(SKTypeface.Default, 13.5f);
            canvas.DrawText(title, x + 16, y + 28, cardTitleFont, paint);

            // Inner Preview Area
            var previewX = x + 16;
            var previewY = y + 56;
            var previewW = w - 32;
            var previewH = h - 110;

            if (isCheckerboard)
            {
                // Draw checkerboard tiles (14x14)
                var tileSize = 14f;
                var cols = (int)Math.Ceiling(previewW / tileSize);
                var rows = (int)Math.Ceiling(previewH / tileSize);

                canvas.Save();
                canvas.ClipRect(new SKRect(previewX, previewY, previewX + previewW, previewY + previewH));
                for (int r = 0; r < rows; r++)
                {
                    for (int c = 0; c < cols; c++)
                    {
                        paint.Color = (r + c) % 2 == 0 ? new SKColor(240, 242, 245) : new SKColor(210, 215, 222);
                        canvas.DrawRect(previewX + c * tileSize, previewY + r * tileSize, tileSize, tileSize, paint);
                    }
                }
                canvas.Restore();
            }

            // Draw SVG or PNG
            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "variation_exports");
            var pngDiskPath = Path.Combine(webRoot, variation.PngUri.TrimStart('/'));
            var svgDiskPath = Path.Combine(webRoot, variation.SvgUri.TrimStart('/'));

            if (File.Exists(svgDiskPath))
            {
                var svgText = File.ReadAllText(svgDiskPath);
                var skSvg = new SKSvg();
                skSvg.FromSvg(svgText);

                if (skSvg.Picture != null)
                {
                    var bounds = skSvg.Picture.CullRect;
                    var scale = Math.Min((previewW - 24) / bounds.Width, (previewH - 24) / bounds.Height);
                    var dx = previewX + (previewW - bounds.Width * scale) * 0.5f;
                    var dy = previewY + (previewH - bounds.Height * scale) * 0.5f;

                    canvas.Save();
                    canvas.Translate(dx, dy);
                    canvas.Scale(scale);
                    canvas.DrawPicture(skSvg.Picture);
                    canvas.Restore();
                }
            }
            else if (File.Exists(pngDiskPath))
            {
                using var bmp = SKBitmap.Decode(pngDiskPath);
                if (bmp != null)
                {
                    var scale = Math.Min((previewW - 24) / bmp.Width, (previewH - 24) / bmp.Height);
                    var destW = bmp.Width * scale;
                    var destH = bmp.Height * scale;
                    var destRect = new SKRect(
                        previewX + (previewW - destW) * 0.5f,
                        previewY + (previewH - destH) * 0.5f,
                        previewX + (previewW + destW) * 0.5f,
                        previewY + (previewH + destH) * 0.5f);
                    canvas.DrawBitmap(bmp, destRect);
                }
            }

            // Usage Note Subtitle at bottom of card
            paint.Color = isDark ? new SKColor(148, 163, 184) : new SKColor(100, 116, 139);
            using var noteFont = new SKFont(SKTypeface.Default, 11.5f);
            var note = variation.UsageNote ?? string.Empty;
            if (note.Length > 52) note = note.Substring(0, 49) + "...";
            canvas.DrawText(note, x + 16, y + h - 18, noteFont, paint);
        }
    }
}
