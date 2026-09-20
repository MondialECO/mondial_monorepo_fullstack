using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class CapabilityMatcher : ICapabilityMatcher
    {
        private static readonly Dictionary<string, HashSet<string>> Taxonomy = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Web / Software Development"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "software development", "web development", "full-stack development", "frontend development",
                "backend development", "software engineering", "programming", "coding", "web developer",
                "software engineer", "developer", "react", "next.js", "nextjs", "vue", "vue.js", "angular",
                "node", "nodejs", "node.js", "c#", ".net", "dotnet", "asp.net", "asp.net core", "python",
                "django", "flask", "fastapi", "java", "spring", "spring boot", "golang", "go", "php",
                "laravel", "wordpress", "ruby", "rails", "ruby on rails", "sql", "postgresql", "mongodb",
                "docker", "kubernetes", "aws", "azure", "gcp", "cloud", "devops", "mobile development",
                "react native", "flutter", "ios", "android", "swift", "kotlin", "api", "rest api", "graphql",
                "typescript", "javascript", "html", "css"
            },
            ["Product / UI Design"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "ui design", "ux design", "ui/ux design", "ui/ux", "product design", "web design",
                "graphic design", "figma", "sketch", "adobe xd", "prototyping", "wireframing",
                "design system", "user research", "interaction design", "visual design", "photoshop", "illustrator"
            },
            ["Paid Acquisition"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "paid acquisition", "paid media", "paid ads", "performance marketing", "facebook ads",
                "meta ads", "google ads", "google adwords", "ppc", "sem", "tiktok ads", "media buying",
                "advertising", "growth marketing"
            },
            ["Organic Marketing & Content"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "seo", "search engine optimization", "content marketing", "social media", "social media marketing",
                "copywriting", "organic marketing", "community management", "email marketing", "inbound marketing",
                "blogging", "public relations", "pr"
            },
            ["Sales & Business Development"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "sales", "b2b sales", "b2c sales", "business development", "lead generation", "outreach",
                "cold calling", "negotiation", "account management", "crm", "customer acquisition",
                "partnership development"
            },
            ["Finance & Accounting"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "accounting", "bookkeeping", "financial modeling", "corporate finance", "budgeting",
                "financial analysis", "cash flow management", "comptabilité", "gestion financière"
            },
            ["Legal & Compliance"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "legal", "contract law", "compliance", "gdpr", "rgpd", "intellectual property", "ip law",
                "regulatory compliance", "droit", "juridique"
            }
        };

        public string NormalizeCapability(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            var clean = Regex.Replace(input.Trim().ToLowerInvariant(), @"[^\w\s\.\#\+\-]", "");
            return clean;
        }

        public bool BelongsToTaxonomy(string skillName, string targetCategory)
        {
            if (string.IsNullOrWhiteSpace(skillName) || string.IsNullOrWhiteSpace(targetCategory))
                return false;

            if (Taxonomy.TryGetValue(targetCategory, out var aliases))
            {
                var norm = NormalizeCapability(skillName);
                return aliases.Contains(norm) || aliases.Any(a => norm.Contains(a) || a.Contains(norm));
            }

            return false;
        }

        public CapabilityMatchResult MatchCapability(string requiredCapability, IEnumerable<ProfileSkill> declaredSkills)
        {
            if (string.IsNullOrWhiteSpace(requiredCapability))
            {
                return new CapabilityMatchResult
                {
                    IsMatched = false,
                    Status = ConstructionItemStatus.Missing,
                    Reason = "No required capability specified."
                };
            }

            var normReq = NormalizeCapability(requiredCapability);
            var skillsList = declaredSkills?.Where(s => !string.IsNullOrWhiteSpace(s.Name)).ToList() ?? new List<ProfileSkill>();

            // 1. Identify which taxonomy group the required capability belongs to (if any)
            string? targetGroup = null;
            foreach (var (groupName, aliases) in Taxonomy)
            {
                if (NormalizeCapability(groupName) == normReq || aliases.Contains(normReq) || aliases.Any(a => a.Length >= 4 && (normReq.Contains(a) || a.Contains(normReq))))
                {
                    targetGroup = groupName;
                    break;
                }
            }

            // 2. Direct or taxonomy-based match on declared skills
            ProfileSkill? bestSkill = null;
            string matchedGroup = targetGroup ?? normReq;

            foreach (var skill in skillsList)
            {
                var normSkill = NormalizeCapability(skill.Name);

                // Exact or direct lexical match
                if (normSkill == normReq)
                {
                    bestSkill = skill;
                    break;
                }

                // Match through taxonomy group (aliases require exact match or word-level contains for long terms)
                if (targetGroup != null && Taxonomy[targetGroup].Any(a => a == normSkill || (a.Length >= 4 && (normSkill.Contains(a) || a.Contains(normSkill)))))
                {
                    bestSkill = skill;
                    break;
                }
            }

            if (bestSkill != null)
            {
                return EvaluateSkillProficiency(bestSkill, matchedGroup);
            }

            // 3. Ambiguous / Partial word match check: if ambiguous, return NeedsReview rather than Missing
            foreach (var skill in skillsList)
            {
                var normSkill = NormalizeCapability(skill.Name);
                if (normSkill.Length >= 4 && (normReq.Contains(normSkill) || normSkill.Contains(normReq)))
                {
                    return new CapabilityMatchResult
                    {
                        IsMatched = true,
                        Status = ConstructionItemStatus.NeedsReview,
                        Reason = $"Declared skill '{bestSkill?.Name ?? skill.Name}' may relate to required capability '{requiredCapability}', but proficiency and equivalence need review.",
                        MatchedSkill = skill,
                        MatchedCapabilityGroup = matchedGroup
                    };
                }
            }

            // 4. Truly missing
            return new CapabilityMatchResult
            {
                IsMatched = false,
                Status = ConstructionItemStatus.Missing,
                Reason = $"No matching capability declared in professional profile for '{requiredCapability}'.",
                MatchedCapabilityGroup = matchedGroup
            };
        }

        private static CapabilityMatchResult EvaluateSkillProficiency(ProfileSkill skill, string group)
        {
            var level = skill.Level?.Trim();

            if (string.IsNullOrWhiteSpace(level))
            {
                return new CapabilityMatchResult
                {
                    IsMatched = true,
                    Status = ConstructionItemStatus.NeedsReview,
                    Reason = $"You declared '{skill.Name}', but your proficiency level has not been confirmed.",
                    MatchedSkill = skill,
                    MatchedCapabilityGroup = group
                };
            }

            if (string.Equals(level, "Advanced", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(level, "Expert", StringComparison.OrdinalIgnoreCase))
            {
                return new CapabilityMatchResult
                {
                    IsMatched = true,
                    Status = ConstructionItemStatus.Ready,
                    Reason = $"Strong capability declared: '{skill.Name}' at {level} level.",
                    MatchedSkill = skill,
                    MatchedCapabilityGroup = group
                };
            }

            if (string.Equals(level, "Comfortable", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(level, "Intermediate", StringComparison.OrdinalIgnoreCase))
            {
                return new CapabilityMatchResult
                {
                    IsMatched = true,
                    Status = ConstructionItemStatus.Ready,
                    Reason = $"Usable founder capability declared: '{skill.Name}' at {level} level.",
                    MatchedSkill = skill,
                    MatchedCapabilityGroup = group
                };
            }

            if (string.Equals(level, "Beginner", StringComparison.OrdinalIgnoreCase))
            {
                return new CapabilityMatchResult
                {
                    IsMatched = true,
                    Status = ConstructionItemStatus.Partial,
                    Reason = $"Foundational capability declared: '{skill.Name}' at Beginner level; additional support or upskilling will be beneficial.",
                    MatchedSkill = skill,
                    MatchedCapabilityGroup = group
                };
            }

            // Unrecognized level string
            return new CapabilityMatchResult
            {
                IsMatched = true,
                Status = ConstructionItemStatus.NeedsReview,
                Reason = $"Declared skill '{skill.Name}' has unverified proficiency level '{level}'.",
                MatchedSkill = skill,
                MatchedCapabilityGroup = group
            };
        }
    }
}
