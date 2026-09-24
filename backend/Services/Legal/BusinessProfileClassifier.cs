using System.Text.RegularExpressions;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Services.Legal
{
    /// <summary>
    /// Deterministic classifier that extracts normalized business signals and their provenance
    /// from existing Creator artifacts (CreatorIdea.Project, BusinessModelSession, MarketStudySession, ForecastSession).
    /// Zero LLM hallucination: 100% deterministic keyword and structural mapping.
    /// </summary>
    public class BusinessProfileClassifier
    {
        public LegalBusinessProfile Classify(
            CreatorJourneyProject? project,
            BsonDocument? businessModelContent = null,
            BsonDocument? marketStudyContent = null,
            BsonDocument? forecastContent = null)
        {
            var profile = new LegalBusinessProfile
            {
                Country = "France",
                Jurisdiction = "FR",
                BusinessName = project?.Name ?? string.Empty,
                RawSector = project?.Sector ?? string.Empty,
                RawCategory = project?.Category ?? string.Empty
            };

            // Aggregate text corpuses for pattern matching
            var projectCorpus = string.Join(" ", new[]
            {
                project?.Name,
                project?.Tagline,
                project?.Concept,
                project?.TargetUser,
                project?.Problem,
                project?.Solution,
                project?.Sector,
                project?.Category,
                project?.TargetMarket,
                project?.Tags != null ? string.Join(" ", project.Tags) : string.Empty
            }.Where(s => !string.IsNullOrWhiteSpace(s))).ToLowerInvariant();

            var canvasCorpus = ExtractCanvasCorpus(businessModelContent).ToLowerInvariant();
            var marketCorpus = ExtractMarketCorpus(marketStudyContent).ToLowerInvariant();
            var forecastCorpus = ExtractForecastCorpus(forecastContent).ToLowerInvariant();

            var combinedCorpus = $"{projectCorpus} {canvasCorpus} {marketCorpus} {forecastCorpus}";

            // 1. Archetype: SaaS
            profile.IsSaaS = DetectSaaS(projectCorpus, canvasCorpus, combinedCorpus);

            // 2. Archetype: E-commerce
            profile.IsEcommerce = DetectEcommerce(projectCorpus, canvasCorpus, combinedCorpus);

            // 3. Archetype: Marketplace
            profile.IsMarketplace = DetectMarketplace(projectCorpus, canvasCorpus, combinedCorpus);

            // 4. Archetype: Consulting
            profile.IsConsulting = DetectConsulting(projectCorpus, canvasCorpus, combinedCorpus);

            // 5. Archetype: Physical Business
            profile.IsPhysicalBusiness = DetectPhysicalBusiness(projectCorpus, canvasCorpus, combinedCorpus);

            // 6. Customers: B2B vs B2C
            var (isB2B, isB2C) = DetectCustomerSegments(project?.TargetUser, project?.TargetMarket, projectCorpus, canvasCorpus, marketCorpus, combinedCorpus);
            profile.IsB2B = isB2B;
            profile.IsB2C = isB2C;

            // 7. Monetization: Subscription
            profile.HasSubscription = DetectSubscription(canvasCorpus, forecastCorpus, combinedCorpus);

            // 8. Monetization: Online Payments
            profile.HasOnlinePayments = DetectOnlinePayments(profile.IsSaaS.Value, profile.IsEcommerce.Value, profile.IsMarketplace.Value, canvasCorpus, combinedCorpus);

            // 9. Delivery: Has Website / App
            profile.HasWebsite = DetectWebsite(profile.IsSaaS.Value, profile.IsEcommerce.Value, profile.IsMarketplace.Value, projectCorpus, combinedCorpus);

            // 10. Offer: Sells Products vs Services
            profile.SellsProducts = DetectSellsProducts(profile.IsEcommerce.Value, combinedCorpus);
            profile.SellsServices = DetectSellsServices(profile.IsSaaS.Value, profile.IsConsulting.Value, combinedCorpus);

            // 11. Privacy: Personal Data
            profile.CollectsPersonalData = DetectCollectsPersonalData(profile.HasWebsite.Value, profile.IsSaaS.Value, profile.IsEcommerce.Value, combinedCorpus);

            // 12. Privacy: Analytics / Tracking
            profile.UsesAnalyticsOrTracking = DetectAnalyticsOrTracking(profile.HasWebsite.Value, combinedCorpus);

            // 13. Workforce & Operations
            profile.HasEmployees = DetectEmployees(forecastCorpus, canvasCorpus, combinedCorpus);
            profile.HasContractors = DetectContractors(canvasCorpus, combinedCorpus);
            profile.HasPhysicalPremises = DetectPhysicalPremises(profile.IsPhysicalBusiness.Value, canvasCorpus, combinedCorpus);

            // 14. Regulatory: Regulated Activity
            profile.MayBeRegulatedActivity = DetectRegulatedActivity(projectCorpus, combinedCorpus, out var regNotes);
            profile.RegulatoryNotes = regNotes;

            return profile;
        }

        private static BusinessSignal DetectSaaS(string projectCorpus, string canvasCorpus, string combined)
        {
            if (ContainsAny(projectCorpus, "saas", "software as a service", "logiciel en mode saas"))
            {
                return BusinessSignal.Confirmed(true, "CreatorIdea.Project.Sector/Concept", "Explicit SaaS designation in project core.");
            }
            if (ContainsAny(canvasCorpus, "saas", "subscription software", "cloud platform", "plateforme cloud", "logiciel cloud"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.canvas", "Cloud platform or SaaS detected in business model canvas.");
            }
            if (ContainsAny(combined, "plateforme web", "web platform", "application web", "api service", "logiciel web"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession/Project", "Web application or API service architecture detected.");
            }
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "No SaaS keywords identified in project or business model.");
        }

        private static BusinessSignal DetectEcommerce(string projectCorpus, string canvasCorpus, string combined)
        {
            if (ContainsAny(projectCorpus, "e-commerce", "ecommerce", "boutique en ligne", "vente en ligne de produits"))
            {
                return BusinessSignal.Confirmed(true, "CreatorIdea.Project.Concept", "Explicit e-commerce designation in project definition.");
            }
            if (ContainsAny(canvasCorpus, "panier d'achat", "expedition", "shipping", "livraison de colis", "stock de produits"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.canvas", "Physical product shipping and online checkout detected.");
            }
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "No e-commerce sales operations detected.");
        }

        private static BusinessSignal DetectMarketplace(string projectCorpus, string canvasCorpus, string combined)
        {
            if (ContainsAny(combined, "marketplace", "place de marché", "plateforme de mise en relation", "intermédiation", "commission sur transactions"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession/Project", "Intermediation or two-sided marketplace dynamics detected.");
            }
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "Single-sided direct sales model.");
        }

        private static BusinessSignal DetectConsulting(string projectCorpus, string canvasCorpus, string combined)
        {
            if (ContainsAny(combined, "consulting", "conseil", "prestation de services", "cabinet de conseil", "advisory", "audit", "expertise"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession/Project", "Professional consulting or advisory services model detected.");
            }
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "No consulting services model detected.");
        }

        private static BusinessSignal DetectPhysicalBusiness(string projectCorpus, string canvasCorpus, string combined)
        {
            if (ContainsAny(combined, "magasin", "boutique physique", "restaurant", "commerce de proximité", "point de vente physique", "atelier de fabrication"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession/Project", "Physical storefront or brick-and-mortar operations detected.");
            }
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "Purely digital or non-storefront operations.");
        }

        private static (BusinessSignal isB2B, BusinessSignal isB2C) DetectCustomerSegments(
            string? targetUser,
            string? targetMarket,
            string projectCorpus,
            string canvasCorpus,
            string marketCorpus,
            string combined)
        {
            var target = (targetUser ?? string.Empty).ToLowerInvariant();
            var market = (targetMarket ?? string.Empty).ToLowerInvariant();
            var b2bIndicators = new[] { "b2b", "entreprises", "entreprise", "pme", "eti", "professionnels", "grands comptes", "corporates", "businesses", "managers", "cac 40", "directeurs", "directions" };
            var b2cIndicators = new[] { "b2c", "particuliers", "consommateurs", "grand public", "individus", "utilisateurs", "consumers", "individuals", "familles" };

            bool hasB2B = ContainsAny(target, b2bIndicators) || ContainsAny(market, b2bIndicators) || ContainsAny(canvasCorpus, b2bIndicators) || ContainsAny(marketCorpus, b2bIndicators) || ContainsAny(projectCorpus, b2bIndicators);
            bool hasB2C = ContainsAny(target, b2cIndicators) || ContainsAny(market, b2cIndicators) || ContainsAny(canvasCorpus, b2cIndicators) || ContainsAny(marketCorpus, b2cIndicators);

            // Absence of evidence: when neither B2B nor B2C indicators exist
            if (!hasB2B && !hasB2C)
            {
                var b2bUnknown = BusinessSignal.Unknown("CreatorIdea.Project.TargetUser/Market", "Customer segment (B2B vs B2C) not explicitly specified in project context.");
                var b2cUnknown = BusinessSignal.Unknown("CreatorIdea.Project.TargetUser/Market", "Customer segment (B2B vs B2C) not explicitly specified in project context.");
                return (b2bUnknown, b2cUnknown);
            }

            var b2bSignal = hasB2B
                ? BusinessSignal.Derived(true, "CreatorIdea.Project.TargetUser/Market", "B2B enterprise or professional customer segments targeted.")
                : BusinessSignal.Derived(false, "CreatorIdea.Project.TargetUser", "Direct B2C focus indicated without B2B enterprise segments.");

            var b2cSignal = hasB2C
                ? BusinessSignal.Derived(true, "CreatorIdea.Project.TargetUser/Market", "B2C consumer or individual end-user segments targeted.")
                : BusinessSignal.Derived(false, "CreatorIdea.Project.TargetUser", "Direct B2B focus indicated without consumer retail segments.");

            return (b2bSignal, b2cSignal);
        }

        private static BusinessSignal DetectSubscription(string canvasCorpus, string forecastCorpus, string combined)
        {
            if (ContainsAny(canvasCorpus, "subscription", "abonnement", "mrr", "mensuel", "annuel", "récurrent", "recurring", "forfait"))
            {
                return BusinessSignal.Confirmed(true, "BusinessModelSession.canvas.revenueStreams", "Subscription or recurring monetization model defined.");
            }
            if (ContainsAny(forecastCorpus, "mrr", "arr", "churn", "abonnés", "subscribers"))
            {
                return BusinessSignal.Derived(true, "ForecastSession", "Financial forecast models recurring subscription metrics.");
            }
            if (string.IsNullOrWhiteSpace(canvasCorpus) && string.IsNullOrWhiteSpace(forecastCorpus))
            {
                return BusinessSignal.Unknown("BusinessModelSession.canvas", "Monetization model not yet specified.");
            }
            return BusinessSignal.Derived(false, "BusinessModelSession.canvas", "One-off or usage-based pricing rather than recurring subscription.");
        }

        private static BusinessSignal DetectOnlinePayments(bool isSaaS, bool isEcommerce, bool isMarketplace, string canvasCorpus, string combined)
        {
            if (ContainsAny(combined, "stripe", "adyen", "paypal", "carte bancaire", "paiement en ligne", "checkout", "prélèvement sepa"))
            {
                return BusinessSignal.Confirmed(true, "BusinessModelSession.keyPartners", "Explicit online payment gateway integration configured.");
            }
            if (isSaaS || isEcommerce || isMarketplace)
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.channels", "Digital SaaS, e-commerce, or marketplace operations entail online payment processing.");
            }
            if (string.IsNullOrWhiteSpace(canvasCorpus) && string.IsNullOrWhiteSpace(combined))
            {
                return BusinessSignal.Unknown("BusinessModelSession.channels", "Payment collection mechanism not specified.");
            }
            return BusinessSignal.Derived(false, "BusinessModelSession", "Commercial invoicing or offline settlement model without card checkout.");
        }

        private static BusinessSignal DetectWebsite(bool isSaaS, bool isEcommerce, bool isMarketplace, string projectCorpus, string combined)
        {
            if (isSaaS || isEcommerce || isMarketplace)
            {
                return BusinessSignal.Derived(true, "CreatorIdea.Project", "Digital service archetype requires a public website or mobile application.");
            }
            if (ContainsAny(combined, "site internet", "site web", "web app", "application mobile", "portail web", "vitrine en ligne"))
            {
                return BusinessSignal.Confirmed(true, "CreatorIdea.Project.Channels", "Public digital website presence confirmed.");
            }
            if (string.IsNullOrWhiteSpace(combined))
            {
                return BusinessSignal.Unknown("CreatorIdea.Project.Channels", "Digital channel presence not yet defined.");
            }
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "Purely physical or offline operations without digital channel.");
        }

        private static BusinessSignal DetectSellsProducts(bool isEcommerce, string combined)
        {
            if (isEcommerce || ContainsAny(combined, "produits physiques", "marchandises", "stock", "matériel", "hardware", "articles vendus"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.canvas", "Sale of physical goods or hardware detected.");
            }
            if (string.IsNullOrWhiteSpace(combined))
            {
                return BusinessSignal.Unknown("BusinessModelSession.canvas", "Product vs service catalog not yet specified.");
            }
            return BusinessSignal.Derived(false, "BusinessModelSession.canvas", "Pure service or digital intangible software offering.");
        }

        private static BusinessSignal DetectSellsServices(bool isSaaS, bool isConsulting, string combined)
        {
            if (isSaaS || isConsulting || ContainsAny(combined, "prestation", "service", "accompagnement", "abonnement logiciel", "licence"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.canvas", "Service or software licensing business model.");
            }
            if (string.IsNullOrWhiteSpace(combined))
            {
                return BusinessSignal.Unknown("BusinessModelSession.canvas", "Product vs service catalog not yet specified.");
            }
            return BusinessSignal.Derived(false, "BusinessModelSession.canvas", "No commercial service offering detected.");
        }

        private static BusinessSignal DetectCollectsPersonalData(bool hasWebsite, bool isSaaS, bool isEcommerce, string combined)
        {
            if (ContainsAny(combined, "compte utilisateur", "email", "données personnelles", "formulaire", "contact", "user account", "sign up", "inscription"))
            {
                return BusinessSignal.Confirmed(true, "CreatorIdea.Project / Website", "Collection of customer emails, user accounts, or contact details confirmed.");
            }
            if (hasWebsite || isSaaS || isEcommerce)
            {
                return BusinessSignal.Derived(true, "CreatorIdea.Project / Website", "Digital application or storefront standardly processes user account/order data under RGPD.");
            }
            if (string.IsNullOrWhiteSpace(combined))
            {
                return BusinessSignal.Unknown("CreatorIdea.Project", "Personal data collection practices not specified.");
            }
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "Offline business with no user account or personal customer data processing.");
        }

        private static BusinessSignal DetectAnalyticsOrTracking(bool hasWebsite, string combined)
        {
            if (ContainsAny(combined, "google analytics", "mixpanel", "cookies", "traceurs", "tracking", "pixel", "mesure d'audience", "matomo"))
            {
                return BusinessSignal.Confirmed(true, "BusinessModelSession.canvas", "Explicit analytics and user tracking tools deployed.");
            }
            if (hasWebsite)
            {
                return BusinessSignal.Derived(true, "Website standard", "Web applications deploy audience measurement or session analytics standardly.");
            }
            if (string.IsNullOrWhiteSpace(combined))
            {
                return BusinessSignal.Unknown("BusinessModelSession", "Analytics or tracking deployment not specified.");
            }
            return BusinessSignal.Derived(false, "BusinessModelSession", "No digital tracking tools detected.");
        }

        private static BusinessSignal DetectEmployees(string forecastCorpus, string canvasCorpus, string combined)
        {
            if (ContainsAny(forecastCorpus, "salaires", "masse salariale", "recrutement", "employés", "payroll", "fte", "salariés"))
            {
                return BusinessSignal.Confirmed(true, "ForecastSession.OpEx", "Forecast financial model includes payroll or salaried personnel.");
            }
            if (ContainsAny(canvasCorpus, "équipe salariée", "recrutement de développeurs", "commerciaux salariés"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.keyResources", "Key resources outline salaried team members.");
            }
            if (!string.IsNullOrWhiteSpace(forecastCorpus))
            {
                return BusinessSignal.Derived(false, "ForecastSession", "Forecast model confirms zero salaried employee payroll for Year 1.");
            }
            return BusinessSignal.Unknown("ForecastSession", "Employment structure and salaried headcount not yet modeled in forecast.");
        }

        private static BusinessSignal DetectContractors(string canvasCorpus, string combined)
        {
            if (ContainsAny(canvasCorpus, "freelance", "prestataire", "sous-traitant", "agence externe", "contractor"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.keyPartners", "Partnership model relies on external contractors or agencies.");
            }
            if (!string.IsNullOrWhiteSpace(canvasCorpus))
            {
                return BusinessSignal.Derived(false, "BusinessModelSession.keyPartners", "Business model canvas does not flag external contractor dependencies.");
            }
            return BusinessSignal.Unknown("BusinessModelSession", "Contractor and subcontractor relationships not yet defined.");
        }

        private static BusinessSignal DetectPhysicalPremises(bool isPhysicalBusiness, string canvasCorpus, string combined)
        {
            if (isPhysicalBusiness || ContainsAny(canvasCorpus, "bail commercial", "loyer commercial", "entrepôt", "bureaux loués", "local professionnel"))
            {
                return BusinessSignal.Derived(true, "BusinessModelSession.costStructure", "Physical commercial lease or premises required.");
            }
            if (!string.IsNullOrWhiteSpace(canvasCorpus) || !string.IsNullOrWhiteSpace(combined))
            {
                return BusinessSignal.Derived(false, "BusinessModelSession", "Remote operations with no commercial lease requirements flagged.");
            }
            return BusinessSignal.Unknown("BusinessModelSession", "Physical premises requirements not yet specified.");
        }

        private static BusinessSignal DetectRegulatedActivity(string projectCorpus, string combined, out string? notes)
        {
            var regulatedKeywords = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["santé"] = "Secteur médical / santé humaine : peut nécessiter un agrément ARS ou inscription à l'Ordre des médecins.",
                ["médical"] = "Dispositif médical ou activité de santé : conformité ANSM ou agrément requise.",
                ["pharmacie"] = "Secteur pharmaceutique : inscription obligatoire à l'Ordre des pharmaciens.",
                ["banque"] = "Services bancaires : agrément ACPR obligatoire.",
                ["assurance"] = "Courtage ou distribution d'assurances : immatriculation ORIAS requise.",
                ["fintech"] = "Activité financière / paiement : statut d'Établissement de Paiement ou PSP agréé ACPR.",
                ["avocat"] = "Profession juridique réglementée : Barreau obligatoire.",
                ["expert-comptable"] = "Ordre des Experts-Comptables obligatoire.",
                ["sécurité privée"] = "Sécurité privée : autorisation d'exercer délivrée par le CNAPS.",
                ["transport de personnes"] = "Transport public ou VTC : carte professionnelle et inscription registre VTC requises.",
                ["immobilier"] = "Transaction immobilière : carte professionnelle Loi Hoguet (CCI) obligatoire."
            };

            foreach (var (kw, note) in regulatedKeywords)
            {
                if (Regex.IsMatch(combined, $@"\b{Regex.Escape(kw)}\b", RegexOptions.IgnoreCase))
                {
                    notes = note;
                    return BusinessSignal.Unknown("CreatorIdea.Project.Sector/Concept", $"Ambiguity detected: sector keyword '{kw}' matches a regulated activity under French law. Confirmation required.");
                }
            }

            notes = null;
            return BusinessSignal.Derived(false, "CreatorIdea.Project", "Standard commercial activity without regulated professional license requirements.");
        }

        private static bool ContainsAny(string text, params string[] phrases)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            foreach (var p in phrases)
            {
                if (text.Contains(p, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }

        private static string ExtractCanvasCorpus(BsonDocument? content)
        {
            if (content == null) return string.Empty;
            var parts = new List<string>();

            if (content.TryGetValue("canvas", out var canvas) && canvas.IsBsonDocument)
            {
                var doc = canvas.AsBsonDocument;
                foreach (var el in doc.Elements)
                {
                    parts.Add(el.Value.ToString() ?? string.Empty);
                }
            }

            if (content.TryGetValue("revenueTiers", out var tiers))
            {
                parts.Add(tiers.ToString() ?? string.Empty);
            }

            return string.Join(" ", parts);
        }

        private static string ExtractMarketCorpus(BsonDocument? content)
        {
            if (content == null) return string.Empty;
            return content.ToJson();
        }

        private static string ExtractForecastCorpus(BsonDocument? content)
        {
            if (content == null) return string.Empty;
            return content.ToJson();
        }
    }
}
