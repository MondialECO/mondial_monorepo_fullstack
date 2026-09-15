using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using SkiaSharp;
using Svg.Skia;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class LogoVariationService : ILogoVariationService
    {
        private readonly IWebHostEnvironment? _env;
        private readonly LogoMarkRendererRegistry _rendererRegistry;

        public LogoVariationService(
            LogoMarkRendererRegistry rendererRegistry,
            IWebHostEnvironment? env = null)
        {
            _rendererRegistry = rendererRegistry ?? throw new ArgumentNullException(nameof(rendererRegistry));
            _env = env;
        }

        public async Task<Dictionary<string, BrandLogoVariation>> DeriveVariationsAsync(
            string ideaId,
            string brandName,
            BrandLogoConcept approvedConcept,
            WebApp.Models.DatabaseModels.BrandKit kit,
            CancellationToken cancellationToken = default)
        {
            if (approvedConcept == null) throw new ArgumentNullException(nameof(approvedConcept));
            if (string.IsNullOrWhiteSpace(ideaId)) throw new ArgumentException("Idea ID is required", nameof(ideaId));
            if (string.IsNullOrWhiteSpace(brandName))
                brandName = kit?.Strategy?.NameDisplayForm ?? kit?.Strategy?.BusinessName ?? "Brand";

            var conceptKey = approvedConcept.Key ?? "concept_1";
            var rawParams = approvedConcept.Parameters ?? new BrandLogoConceptParameters
            {
                Family = "symbol_plus_name"
            };

            // Render canonical SVGs from approved parameters
            var lockupSvg = _rendererRegistry.RenderLockupSvg(rawParams, brandName);
            var markSvg = _rendererRegistry.RenderMarkSvg(rawParams, brandName);

            // Ensure source assets are saved if not already
            var lockupAssetUri = !string.IsNullOrEmpty(approvedConcept.LockupAssetUri)
                ? approvedConcept.LockupAssetUri
                : await SaveSvgAssetAsync(ideaId, $"{conceptKey}_lockup", lockupSvg);

            var markAssetUri = !string.IsNullOrEmpty(approvedConcept.MarkAssetUri)
                ? approvedConcept.MarkAssetUri
                : await SaveSvgAssetAsync(ideaId, $"{conceptKey}_mark", markSvg);

            var currentArrangement = rawParams.Values.GetValueOrDefault("Arrangement", "side_by_side").ToLowerInvariant();

            // 1. Primary
            var primaryPngUri = await SavePngAssetAsync(ideaId, $"variations/{conceptKey}_primary", lockupSvg);
            var primaryVariation = new BrandLogoVariation
            {
                SvgUri = lockupAssetUri,
                PngUri = primaryPngUri,
                UsageNote = "Primary full-color brand lockup for light backgrounds."
            };

            // 2. Icon Only (byte-identical to MarkAssetUri)
            var iconOnlyPngUri = await SavePngAssetAsync(ideaId, $"variations/{conceptKey}_icon_only", markSvg);
            var iconOnlyVariation = new BrandLogoVariation
            {
                SvgUri = markAssetUri,
                PngUri = iconOnlyPngUri,
                UsageNote = "Standalone 1:1 symbol for favicons, app icons, and profile avatars."
            };

            // 3. Horizontal
            BrandLogoVariation horizontalVariation;
            if (currentArrangement != "stacked")
            {
                horizontalVariation = new BrandLogoVariation
                {
                    SvgUri = lockupAssetUri,
                    PngUri = primaryPngUri,
                    UsageNote = "Horizontal lockup optimized for web headers and navigation bars."
                };
            }
            else
            {
                var horizontalParams = CloneParametersWithArrangement(rawParams, "side_by_side");
                var horizontalSvg = _rendererRegistry.RenderLockupSvg(horizontalParams, brandName);
                var horizontalSvgUri = await SaveSvgAssetAsync(ideaId, $"variations/{conceptKey}_horizontal", horizontalSvg);
                var horizontalPngUri = await SavePngAssetAsync(ideaId, $"variations/{conceptKey}_horizontal", horizontalSvg);
                horizontalVariation = new BrandLogoVariation
                {
                    SvgUri = horizontalSvgUri,
                    PngUri = horizontalPngUri,
                    UsageNote = "Horizontal lockup optimized for web headers and navigation bars."
                };
            }

            // 4. Stacked
            BrandLogoVariation stackedVariation;
            if (currentArrangement == "stacked")
            {
                stackedVariation = new BrandLogoVariation
                {
                    SvgUri = lockupAssetUri,
                    PngUri = primaryPngUri,
                    UsageNote = "Centered stacked emblem for vertical layouts, packaging, and signboards."
                };
            }
            else
            {
                var stackedParams = CloneParametersWithArrangement(rawParams, "stacked");
                var stackedSvg = _rendererRegistry.RenderLockupSvg(stackedParams, brandName);
                var stackedSvgUri = await SaveSvgAssetAsync(ideaId, $"variations/{conceptKey}_stacked", stackedSvg);
                var stackedPngUri = await SavePngAssetAsync(ideaId, $"variations/{conceptKey}_stacked", stackedSvg);
                stackedVariation = new BrandLogoVariation
                {
                    SvgUri = stackedSvgUri,
                    PngUri = stackedPngUri,
                    UsageNote = "Centered stacked emblem for vertical layouts, packaging, and signboards."
                };
            }

            // 5. Black (Color-only transform: geometry unchanged)
            var blackSvg = TransformToMonochrome(lockupSvg, "#000000");
            var blackSvgUri = await SaveSvgAssetAsync(ideaId, $"variations/{conceptKey}_black", blackSvg);
            var blackPngUri = await SavePngAssetAsync(ideaId, $"variations/{conceptKey}_black", blackSvg);
            var blackVariation = new BrandLogoVariation
            {
                SvgUri = blackSvgUri,
                PngUri = blackPngUri,
                UsageNote = "Monochrome single-color black for laser printing, stamps, and physical engraving."
            };

            // 6. White (Color-only transform: geometry unchanged)
            var whiteSvg = TransformToMonochrome(lockupSvg, "#FFFFFF");
            var whiteSvgUri = await SaveSvgAssetAsync(ideaId, $"variations/{conceptKey}_white", whiteSvg);
            var whitePngUri = await SavePngAssetAsync(ideaId, $"variations/{conceptKey}_white", whiteSvg);
            var whiteVariation = new BrandLogoVariation
            {
                SvgUri = whiteSvgUri,
                PngUri = whitePngUri,
                UsageNote = "Pure white knockout for dark photography, dark-mode interfaces, and black apparel."
            };

            // 7. Transparent
            var transparentPngUri = await SavePngAssetAsync(ideaId, $"variations/{conceptKey}_transparent", lockupSvg);
            var transparentVariation = new BrandLogoVariation
            {
                SvgUri = lockupAssetUri,
                PngUri = transparentPngUri,
                UsageNote = "Full-color lockup on transparent alpha canvas for overlaying on diverse backdrops."
            };

            return new Dictionary<string, BrandLogoVariation>(StringComparer.OrdinalIgnoreCase)
            {
                [BrandLogoVariationKeys.Primary] = primaryVariation,
                [BrandLogoVariationKeys.Horizontal] = horizontalVariation,
                [BrandLogoVariationKeys.Stacked] = stackedVariation,
                [BrandLogoVariationKeys.IconOnly] = iconOnlyVariation,
                [BrandLogoVariationKeys.Black] = blackVariation,
                [BrandLogoVariationKeys.White] = whiteVariation,
                [BrandLogoVariationKeys.Transparent] = transparentVariation
            };
        }

        private static BrandLogoConceptParameters CloneParametersWithArrangement(
            BrandLogoConceptParameters source,
            string targetArrangement)
        {
            var cloned = new BrandLogoConceptParameters
            {
                Family = source.Family,
                Descriptor = source.Descriptor,
                Values = new Dictionary<string, string>(source.Values ?? new())
            };
            cloned.Values["Arrangement"] = targetArrangement;
            return cloned;
        }

        private static string TransformToMonochrome(string svgContent, string colorHex)
        {
            // Replace fill attributes where fill is not none/transparent
            var fillRegex = new Regex(@"fill=""(?!none\b|transparent\b)[^""]+""", RegexOptions.IgnoreCase);
            var strokeRegex = new Regex(@"stroke=""(?!none\b|transparent\b)[^""]+""", RegexOptions.IgnoreCase);

            var result = fillRegex.Replace(svgContent, $"fill=\"{colorHex}\"");
            result = strokeRegex.Replace(result, $"stroke=\"{colorHex}\"");
            return result;
        }

        private async Task<string> SaveSvgAssetAsync(string ideaId, string relativeKey, string svgContent)
        {
            var webRoot = _env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var relativeFilePath = Path.Combine("brand-assets", "logos", ideaId, $"{relativeKey}.svg");
            var targetFilePath = Path.Combine(webRoot, relativeFilePath);
            var parentDir = Path.GetDirectoryName(targetFilePath);
            if (!string.IsNullOrEmpty(parentDir)) Directory.CreateDirectory(parentDir);

            await File.WriteAllTextAsync(targetFilePath, svgContent);
            return $"/brand-assets/logos/{ideaId}/{relativeKey}.svg".Replace('\\', '/');
        }

        private async Task<string> SavePngAssetAsync(string ideaId, string relativeKey, string svgContent)
        {
            var webRoot = _env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var relativeFilePath = Path.Combine("brand-assets", "logos", ideaId, $"{relativeKey}.png");
            var targetFilePath = Path.Combine(webRoot, relativeFilePath);
            var parentDir = Path.GetDirectoryName(targetFilePath);
            if (!string.IsNullOrEmpty(parentDir)) Directory.CreateDirectory(parentDir);

            using var svg = new SKSvg();
            svg.FromSvg(svgContent);
            if (svg.Picture != null)
            {
                var width = (int)Math.Ceiling(svg.Picture.CullRect.Width);
                var height = (int)Math.Ceiling(svg.Picture.CullRect.Height);
                if (width <= 0) width = 400;
                if (height <= 0) height = 160;

                using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
                using var canvas = new SKCanvas(bitmap);
                canvas.Clear(SKColors.Transparent);
                canvas.DrawPicture(svg.Picture);
                canvas.Flush();

                using var image = SKImage.FromBitmap(bitmap);
                using var data = image.Encode(SKEncodedImageFormat.Png, 100);
                await using var fileStream = File.Create(targetFilePath);
                data.SaveTo(fileStream);
            }

            return $"/brand-assets/logos/{ideaId}/{relativeKey}.png".Replace('\\', '/');
        }
    }
}
