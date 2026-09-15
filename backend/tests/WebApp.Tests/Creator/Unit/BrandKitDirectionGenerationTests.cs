using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Creator.BrandKit.DirectionEngine;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;
using Xunit.Abstractions;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Tests.Creator.Unit
{
    public class BrandKitDirectionGenerationTests
    {
        private readonly ITestOutputHelper _output;

        public BrandKitDirectionGenerationTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task Fallback_synthesis_produces_four_valid_distinct_candidates_with_fallback_provenance()
        {
            var service = new DirectionGenerationService(aiProvider: null, modelRouter: null, logger: NullLogger<DirectionGenerationService>.Instance);

            var idea = new CreatorIdea { Id = "idea_test", Project = new CreatorJourneyProject { Name = "CyberLock" } };
            var kit = new BrandKitModel
            {
                IdeaId = "idea_test",
                Strategy = new BrandStrategy
                {
                    BusinessName = "CyberLock",
                    Industry = new BrandProvenancedText { Value = "Cybersecurity" },
                    Positioning = new BrandProvenancedText { Value = "Enterprise Cryptographic Security" },
                    TargetAudience = new BrandProvenancedText { Value = "Chief Information Security Officers" },
                    PersonalityTraits = new List<string> { "Precise", "Resilient", "Defensive" },
                    AvoidList = new List<string> { "Playful", "Cartoonish" },
                    ConfirmedAt = DateTime.UtcNow
                }
            };

            var candidates = await service.GenerateCandidatesAsync(idea, kit);

            candidates.Should().NotBeNull();
            candidates.Should().HaveCount(4);

            // Verify Provenance
            candidates.Should().OnlyContain(c => c.Provenance == "fallback");

            // Verify ColorPalette is 4 hex values with no role keys
            foreach (var c in candidates)
            {
                c.ColorPalette.Should().HaveCount(4);
                c.ColorPalette.Should().OnlyContain(hex => hex.StartsWith("#") && hex.Length == 7);
                DirectionGenerationService.ValidBundledFonts.Should().Contain(c.DisplayTypeface);
                DirectionGenerationService.ValidBundledFonts.Should().Contain(c.TextTypeface);
                DirectionGenerationService.ValidMotifKeys.Should().Contain(c.MotifKey);
            }

            // Verify Distinctness
            DirectionGenerationService.ValidateDistinctness(candidates, out var err).Should().BeTrue(err);
        }

        [Fact]
        public async Task Ai_generation_success_sets_ai_provenance_and_preserves_distinctness()
        {
            var mockAi = new Mock<IAiProvider>();
            var mockRouter = new Mock<IModelRouter>();
            mockRouter.Setup(r => r.Resolve(It.IsAny<string>())).Returns("anthropic/claude-3.5-sonnet");

            var fakeJsonResponse = @"{
              ""candidates"": [
                {
                  ""name"": ""Cryptographic Vault"",
                  ""feel_line"": ""Mathematical precision meets impenetrable security"",
                  ""rationale"": ""Built for high-trust institutional security infrastructure."",
                  ""color_palette"": [""#0052FF"", ""#0F172A"", ""#38BDF8"", ""#F8FAFC""],
                  ""display_typeface"": ""Space Grotesk"",
                  ""text_typeface"": ""JetBrains Mono"",
                  ""motif_key"": ""geometric_structure""
                },
                {
                  ""name"": ""Organic Cybernetic"",
                  ""feel_line"": ""Adaptive resilience with neural fluidity"",
                  ""rationale"": ""Reflects self-healing autonomous cybersecurity defense networks."",
                  ""color_palette"": [""#10B981"", ""#064E3B"", ""#6EE7B7"", ""#F0FDF4""],
                  ""display_typeface"": ""Plus Jakarta Sans"",
                  ""text_typeface"": ""Plus Jakarta Sans"",
                  ""motif_key"": ""organic_growth""
                },
                {
                  ""name"": ""Sovereign Bastion"",
                  ""feel_line"": ""Authoritative institutional prestige and permanence"",
                  ""rationale"": ""Positions CyberLock as the gold standard of enterprise cryptographic governance."",
                  ""color_palette"": [""#D97706"", ""#451A03"", ""#FCD34D"", ""#FFFBEB""],
                  ""display_typeface"": ""Cinzel"",
                  ""text_typeface"": ""Plus Jakarta Sans"",
                  ""motif_key"": ""editorial_classic""
                },
                {
                  ""name"": ""Quantum Matrix"",
                  ""feel_line"": ""High-velocity cryptographic computation and raw power"",
                  ""rationale"": ""Conveys speed and quantum-resistant cryptographic breakthroughs."",
                  ""color_palette"": [""#8B5CF6"", ""#1E1B4B"", ""#C4B5FD"", ""#EEF2FF""],
                  ""display_typeface"": ""Syne"",
                  ""text_typeface"": ""JetBrains Mono"",
                  ""motif_key"": ""technical_lattice""
                }
              ]
            }";

            mockAi.Setup(ai => ai.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = fakeJsonResponse,
                    Model = "anthropic/claude-3.5-sonnet",
                    Usage = new AiTokenUsage(520, 380, 900),
                    EstimatedCost = 0.0072m
                });

            var service = new DirectionGenerationService(mockAi.Object, mockRouter.Object, NullLogger<DirectionGenerationService>.Instance);

            var idea = new CreatorIdea { Id = "idea_cyber", Project = new CreatorJourneyProject { Name = "CyberLock" } };
            var kit = new BrandKitModel
            {
                IdeaId = "idea_cyber",
                Strategy = new BrandStrategy
                {
                    BusinessName = "CyberLock",
                    Industry = new BrandProvenancedText { Value = "Cybersecurity" },
                    ConfirmedAt = DateTime.UtcNow
                }
            };

            var candidates = await service.GenerateCandidatesAsync(idea, kit);

            candidates.Should().NotBeNull();
            candidates.Should().HaveCount(4);
            candidates.Should().OnlyContain(c => c.Provenance == "ai");
            candidates.Should().OnlyContain(c => !c.AvoidListSubstituted);

            DirectionGenerationService.ValidateDistinctness(candidates, out var err).Should().BeTrue(err);
        }

        [Fact]
        public void Avoid_list_filter_substitutes_conflicting_colors_and_motifs_and_sets_flag()
        {
            var rawCandidates = new List<BrandDirectionCandidate>
            {
                new()
                {
                    Key = "candidate_1",
                    Name = "Tech Blue Direction",
                    FeelLine = "High precision",
                    Rationale = "Rationale",
                    ColorPalette = new List<string> { "#0052FF", "#0F172A", "#38BDF8", "#F8FAFC" }, // Has blue
                    DisplayTypeface = "Space Grotesk",
                    TextTypeface = "Plus Jakarta Sans",
                    MotifKey = "technical_lattice", // Violates avoid "lattice"
                    Provenance = "ai",
                    AvoidListSubstituted = false
                },
                new()
                {
                    Key = "candidate_2",
                    Name = "Warm Ochre Direction",
                    FeelLine = "Warmth",
                    Rationale = "Rationale",
                    ColorPalette = new List<string> { "#D97706", "#451A03", "#FCD34D", "#FFFBEB" },
                    DisplayTypeface = "Cinzel",
                    TextTypeface = "Plus Jakarta Sans",
                    MotifKey = "editorial_classic",
                    Provenance = "ai",
                    AvoidListSubstituted = false
                }
            };

            var avoidList = new List<string> { "blue", "navy", "lattice", "shield" };

            var processed = DirectionGenerationService.EnforceAvoidList(rawCandidates, avoidList, isFallback: false);

            processed[0].AvoidListSubstituted.Should().BeTrue();
            // Palette should no longer contain blue hues
            processed[0].ColorPalette.Should().NotContain("#0052FF");
            // Motif should no longer be technical_lattice
            processed[0].MotifKey.Should().NotBe("technical_lattice");

            // Candidate 2 does not violate avoid list
            processed[1].AvoidListSubstituted.Should().BeFalse();
            processed[1].ColorPalette.Should().Contain("#D97706");
            processed[1].MotifKey.Should().Be("editorial_classic");
        }

        [Fact]
        public async Task Controller_generate_endpoint_enforces_confirmed_strategy_prerequisite()
        {
            var mockJourneys = new Mock<ICreatorJourneyService>();
            var mockStore = new Mock<IBrandKitStore>();
            var mockDirGen = new Mock<IDirectionGenerationService>();

            var idea = new CreatorIdea { Id = "idea_1", UserId = "user_1" };
            var unconfirmedKit = new BrandKitModel
            {
                IdeaId = "idea_1",
                UserId = "user_1",
                Strategy = new BrandStrategy { BusinessName = "Unconfirmed Co", ConfirmedAt = null }
            };

            mockJourneys.Setup(j => j.ResolveIdeaAsync("user_1", "idea_1")).ReturnsAsync(idea);
            mockStore.Setup(s => s.GetByIdeaIdAsync("idea_1", "user_1")).ReturnsAsync(unconfirmedKit);

            var controller = new CreatorBrandKitController(
                mockJourneys.Object,
                mockStore.Object,
                directionGenerationService: mockDirGen.Object);

            var userClaims = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "user_1") }, "TestAuth"));
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = userClaims } };

            var result = await controller.GenerateDirections("idea_1");

            var badReq = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            var response = badReq.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("Strategy must be confirmed");

            mockDirGen.Verify(g => g.GenerateCandidatesAsync(It.IsAny<CreatorIdea>(), It.IsAny<BrandKitModel>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Three_contrasting_benchmark_businesses_direction_generation_evaluation()
        {
            var mockAi = new Mock<IAiProvider>();
            var mockRouter = new Mock<IModelRouter>();

            // Setup AI completions for the 3 businesses
            mockAi.Setup(ai => ai.CompleteAsync(It.Is<AiCompletionRequest>(r => r.Messages[1].Content.Contains("CyberLock")), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = @"{
                      ""candidates"": [
                        {
                          ""name"": ""Cryptographic Vault"",
                          ""feel_line"": ""Mathematical certainty and resilient institutional defense"",
                          ""rationale"": ""Aligns with zero-trust cryptographic enterprise posture."",
                          ""color_palette"": [""#0052FF"", ""#0F172A"", ""#38BDF8"", ""#F8FAFC""],
                          ""display_typeface"": ""Space Grotesk"",
                          ""text_typeface"": ""JetBrains Mono"",
                          ""motif_key"": ""geometric_structure""
                        },
                        {
                          ""name"": ""Zero-Trust Sovereign"",
                          ""feel_line"": ""Authoritative institutional permanence and governance"",
                          ""rationale"": ""Positions CyberLock as the foundational trust layer for critical infrastructure."",
                          ""color_palette"": [""#4F46E5"", ""#18181B"", ""#818CF8"", ""#F8FAFC""],
                          ""display_typeface"": ""Syne"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""bold_abstract""
                        },
                        {
                          ""name"": ""Autonomous Sentinel"",
                          ""feel_line"": ""Dynamic real-time telemetry and adaptive defense"",
                          ""rationale"": ""Communicates high-velocity cryptographic threat mitigation."",
                          ""color_palette"": [""#059669"", ""#064E3B"", ""#34D399"", ""#F0FDF4""],
                          ""display_typeface"": ""JetBrains Mono"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""technical_lattice""
                        },
                        {
                          ""name"": ""Heritage Cipher"",
                          ""feel_line"": ""Refined bespoke architectural security craft"",
                          ""rationale"": ""Appeals to executive risk committees seeking timeless stability."",
                          ""color_palette"": [""#B38E5D"", ""#1C1917"", ""#FCD34D"", ""#FFFBEB""],
                          ""display_typeface"": ""Cinzel"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""editorial_classic""
                        }
                      ]
                    }",
                    Model = "anthropic/claude-3.5-sonnet",
                    Usage = new AiTokenUsage(540, 390, 930),
                    EstimatedCost = 0.0074m
                });

            mockAi.Setup(ai => ai.CompleteAsync(It.Is<AiCompletionRequest>(r => r.Messages[1].Content.Contains("TerraHarvest")), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = @"{
                      ""candidates"": [
                        {
                          ""name"": ""Biosphere Precision"",
                          ""feel_line"": ""Data-driven agronomy and controlled environmental vitality"",
                          ""rationale"": ""Communicates advanced sensor-enabled vertical cultivation systems."",
                          ""color_palette"": [""#10B981"", ""#064E3B"", ""#6EE7B7"", ""#F0FDF4""],
                          ""display_typeface"": ""Plus Jakarta Sans"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""organic_growth""
                        },
                        {
                          ""name"": ""Sunlit Canopy"",
                          ""feel_line"": ""Warm agricultural abundance and natural regeneration"",
                          ""rationale"": ""Connects consumers to pure, closed-loop sustainable produce."",
                          ""color_palette"": [""#D97706"", ""#451A03"", ""#FBBF24"", ""#FFFBEB""],
                          ""display_typeface"": ""Cinzel"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""editorial_classic""
                        },
                        {
                          ""name"": ""Hydro-Grid Industrial"",
                          ""feel_line"": ""Clean modular vertical engineering and scalable yields"",
                          ""rationale"": ""Tailored for industrial agtech infrastructure investors."",
                          ""color_palette"": [""#0284C7"", ""#0F172A"", ""#38BDF8"", ""#F0F9FF""],
                          ""display_typeface"": ""Space Grotesk"",
                          ""text_typeface"": ""JetBrains Mono"",
                          ""motif_key"": ""geometric_structure""
                        },
                        {
                          ""name"": ""Raw Agronomy Power"",
                          ""feel_line"": ""High-impact planetary regeneration and agricultural disruption"",
                          ""rationale"": ""Projects bold scale and transformative ecological impact."",
                          ""color_palette"": [""#4F46E5"", ""#18181B"", ""#A5B4FC"", ""#F8FAFC""],
                          ""display_typeface"": ""Syne"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""bold_abstract""
                        }
                      ]
                    }",
                    Model = "anthropic/claude-3.5-sonnet",
                    Usage = new AiTokenUsage(530, 385, 915),
                    EstimatedCost = 0.0073m
                });

            mockAi.Setup(ai => ai.CompleteAsync(It.Is<AiCompletionRequest>(r => r.Messages[1].Content.Contains("Maison Forma")), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = @"{
                      ""candidates"": [
                        {
                          ""name"": ""Atelier Monolith"",
                          ""feel_line"": ""Sculptural monumentalism and quiet architectural luxury"",
                          ""rationale"": ""Elevates bespoke residential commissions with uncompromised materiality."",
                          ""color_palette"": [""#B38E5D"", ""#1C1917"", ""#D4AF37"", ""#FAFAF9""],
                          ""display_typeface"": ""Cinzel"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""editorial_classic""
                        },
                        {
                          ""name"": ""Modernist Geometry"",
                          ""feel_line"": ""Pure proportion, daylight choreography, and modernist discipline"",
                          ""rationale"": ""Highlights mathematical precision and bespoke architectural engineering."",
                          ""color_palette"": [""#0F172A"", ""#334155"", ""#94A3B8"", ""#F8FAFC""],
                          ""display_typeface"": ""Space Grotesk"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""geometric_structure""
                        },
                        {
                          ""name"": ""Organic Biophilia"",
                          ""feel_line"": ""Sensual materiality woven seamlessly into living landscape"",
                          ""rationale"": ""Resonates with ultra-high-net-worth clients desiring natural sanctuary homes."",
                          ""color_palette"": [""#2D6A4F"", ""#1B4332"", ""#74C69D"", ""#F4F1DE""],
                          ""display_typeface"": ""Plus Jakarta Sans"",
                          ""text_typeface"": ""Plus Jakarta Sans"",
                          ""motif_key"": ""organic_growth""
                        },
                        {
                          ""name"": ""Bespoke Monogram Luxe"",
                          ""feel_line"": ""Signature artisan craft and generational heritage"",
                          ""rationale"": ""Frames Maison Forma as an exclusive private architectural salon."",
                          ""color_palette"": [""#4F46E5"", ""#18181B"", ""#818CF8"", ""#F8FAFC""],
                          ""display_typeface"": ""Syne"",
                          ""text_typeface"": ""JetBrains Mono"",
                          ""motif_key"": ""minimal_monogram""
                        }
                      ]
                    }",
                    Model = "anthropic/claude-3.5-sonnet",
                    Usage = new AiTokenUsage(555, 395, 950),
                    EstimatedCost = 0.0076m
                });

            var service = new DirectionGenerationService(mockAi.Object, mockRouter.Object, NullLogger<DirectionGenerationService>.Instance);

            var benchmarkBusinesses = new[]
            {
                (
                    Name: "CyberLock",
                    Industry: "Cybersecurity / Cryptographic Infrastructure",
                    Positioning: "Institutional Zero-Trust Hardware & Software Cryptography",
                    Audience: "Chief Information Security Officers & Infrastructure Security Architects",
                    Traits: new List<string> { "Precise", "Resilient", "Authoritative", "Mathematical" },
                    AvoidList: new List<string> { "Playful", "Cartoonish" }
                ),
                (
                    Name: "TerraHarvest",
                    Industry: "Sustainable Agriculture / Vertical Farming",
                    Positioning: "Closed-Loop Zero-Pesticide Automated Agronomy",
                    Audience: "Eco-Conscious Urban Retailers & Global Food Distributors",
                    Traits: new List<string> { "Vital", "Regenerative", "Scientific", "Approachable" },
                    AvoidList: new List<string> { "Toxic", "Chemical" }
                ),
                (
                    Name: "Maison Forma",
                    Industry: "Luxury Boutique Architecture / High-End Residential",
                    Positioning: "Bespoke Sculptural Living Sanctuaries",
                    Audience: "Discerning High-Net-Worth Private Clients & Connoisseurs",
                    Traits: new List<string> { "Sophisticated", "Sculptural", "Timeless", "Discreet" },
                    AvoidList: new List<string> { "Cheap", "Loud", "Garish" }
                )
            };

            int totalFallbackCount = 0;
            int totalAvoidSubstitutions = 0;

            _output.WriteLine("==========================================================================");
            _output.WriteLine("STEP 2C VISUAL DIRECTION GENERATION BENCHMARK EVALUATION");
            _output.WriteLine("==========================================================================");

            foreach (var b in benchmarkBusinesses)
            {
                var idea = new CreatorIdea { Id = $"idea_{b.Name.ToLower()}", Project = new CreatorJourneyProject { Name = b.Name } };
                var kit = new BrandKitModel
                {
                    IdeaId = idea.Id,
                    Strategy = new BrandStrategy
                    {
                        BusinessName = b.Name,
                        Industry = new BrandProvenancedText { Value = b.Industry },
                        Positioning = new BrandProvenancedText { Value = b.Positioning },
                        TargetAudience = new BrandProvenancedText { Value = b.Audience },
                        PersonalityTraits = b.Traits,
                        AvoidList = b.AvoidList,
                        ConfirmedAt = DateTime.UtcNow
                    }
                };

                var candidates = await service.GenerateCandidatesAsync(idea, kit);

                candidates.Should().NotBeNull();
                candidates.Should().HaveCount(4);

                bool isValid = DirectionGenerationService.ValidateDistinctness(candidates, out var distinctnessErr);
                isValid.Should().BeTrue($"Candidates for {b.Name} must satisfy distinctness invariants. Error: {distinctnessErr}");

                _output.WriteLine($"\n--- BUSINESS: {b.Name.ToUpperInvariant()} ({b.Industry}) ---");
                foreach (var c in candidates)
                {
                    if (c.Provenance == "fallback") totalFallbackCount++;
                    if (c.AvoidListSubstituted) totalAvoidSubstitutions++;

                    _output.WriteLine($"  [{c.Key}] {c.Name} (Provenance: {c.Provenance}, AvoidSubstituted: {c.AvoidListSubstituted})");
                    _output.WriteLine($"      Feel Line   : \"{c.FeelLine}\"");
                    _output.WriteLine($"      Rationale   : \"{c.Rationale}\"");
                    _output.WriteLine($"      Palette     : [{string.Join(", ", c.ColorPalette)}]");
                    _output.WriteLine($"      Typography  : Display = {c.DisplayTypeface}, Text = {c.TextTypeface}");
                    _output.WriteLine($"      Motif Key   : {c.MotifKey}");
                }
            }

            _output.WriteLine("\n==========================================================================");
            _output.WriteLine($"SUMMARY: Total Fallbacks = {totalFallbackCount}/12 candidates (Fallback Rate: {totalFallbackCount * 100.0 / 12:F1}%)");
            _output.WriteLine($"         Total Avoid Substitutions = {totalAvoidSubstitutions}/12 candidates");
            _output.WriteLine("==========================================================================");
        }
    }
}
