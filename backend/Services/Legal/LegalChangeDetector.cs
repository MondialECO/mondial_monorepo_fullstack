using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Services.Legal
{
    /// <summary>
    /// Centralized deterministic difference calculator and human-safe label repository
    /// for legal business profile signals in Creator Phase 3.
    /// Strictly protects UI from leaking internal variable/code identifiers.
    /// </summary>
    public static class LegalChangeDetector
    {
        public static readonly Dictionary<string, string> SignalLabels = new(StringComparer.OrdinalIgnoreCase)
        {
            ["IsB2C"] = "Consumer customers",
            ["IsB2B"] = "Enterprise / B2B customers",
            ["HasSubscription"] = "Subscription revenue model",
            ["HasOnlinePayments"] = "Online payment processing",
            ["CollectsPersonalData"] = "Personal-data processing",
            ["UsesAnalyticsOrTracking"] = "User tracking & analytics",
            ["HasEmployees"] = "Salaried employees",
            ["HasContractors"] = "External contractors",
            ["HasPhysicalPremises"] = "Commercial lease / premises",
            ["IsSaaS"] = "Cloud SaaS software",
            ["IsEcommerce"] = "E-commerce sales",
            ["IsMarketplace"] = "Marketplace platform",
            ["IsConsulting"] = "Consulting services",
            ["IsPhysicalBusiness"] = "Physical storefront / workshop",
            ["HasWebsite"] = "Public website / portal",
            ["SellsProducts"] = "Physical goods sales",
            ["SellsServices"] = "Service / licensing offerings",
            ["MayBeRegulatedActivity"] = "Regulated sector activity"
        };

        public static string GetHumanLabel(string signalKey)
        {
            return SignalLabels.TryGetValue(signalKey, out var label) ? label : signalKey;
        }

        public static List<LegalSignalDiff> ComputeDiffs(LegalBusinessProfile? previous, LegalBusinessProfile? current)
        {
            var diffs = new List<LegalSignalDiff>();
            if (previous == null || current == null)
            {
                return diffs;
            }

            void CompareSignal(string key, BusinessSignal prev, BusinessSignal curr)
            {
                var label = GetHumanLabel(key);
                if (prev.Value != curr.Value)
                {
                    var isAdded = !prev.Value && curr.Value;
                    diffs.Add(new LegalSignalDiff
                    {
                        SignalKey = key,
                        HumanLabel = label,
                        PreviousValue = prev.Value,
                        CurrentValue = curr.Value,
                        ChangeType = isAdded ? "added" : "removed",
                        HumanDescription = isAdded ? $"+ {label}" : $"- {label}"
                    });
                }
            }

            CompareSignal("IsB2C", previous.IsB2C, current.IsB2C);
            CompareSignal("IsB2B", previous.IsB2B, current.IsB2B);
            CompareSignal("HasSubscription", previous.HasSubscription, current.HasSubscription);
            CompareSignal("HasOnlinePayments", previous.HasOnlinePayments, current.HasOnlinePayments);
            CompareSignal("CollectsPersonalData", previous.CollectsPersonalData, current.CollectsPersonalData);
            CompareSignal("UsesAnalyticsOrTracking", previous.UsesAnalyticsOrTracking, current.UsesAnalyticsOrTracking);
            CompareSignal("HasEmployees", previous.HasEmployees, current.HasEmployees);
            CompareSignal("HasContractors", previous.HasContractors, current.HasContractors);
            CompareSignal("HasPhysicalPremises", previous.HasPhysicalPremises, current.HasPhysicalPremises);
            CompareSignal("IsSaaS", previous.IsSaaS, current.IsSaaS);
            CompareSignal("IsEcommerce", previous.IsEcommerce, current.IsEcommerce);
            CompareSignal("IsMarketplace", previous.IsMarketplace, current.IsMarketplace);
            CompareSignal("IsConsulting", previous.IsConsulting, current.IsConsulting);
            CompareSignal("IsPhysicalBusiness", previous.IsPhysicalBusiness, current.IsPhysicalBusiness);
            CompareSignal("HasWebsite", previous.HasWebsite, current.HasWebsite);
            CompareSignal("SellsProducts", previous.SellsProducts, current.SellsProducts);
            CompareSignal("SellsServices", previous.SellsServices, current.SellsServices);

            // Regulated activity check
            if (previous.MayBeRegulatedActivity.Value != current.MayBeRegulatedActivity.Value ||
                previous.MayBeRegulatedActivity.Confidence != current.MayBeRegulatedActivity.Confidence)
            {
                var label = GetHumanLabel("MayBeRegulatedActivity");
                var isAdded = current.MayBeRegulatedActivity.Value || current.MayBeRegulatedActivity.Confidence == SignalConfidenceLevels.Unknown;
                diffs.Add(new LegalSignalDiff
                {
                    SignalKey = "MayBeRegulatedActivity",
                    HumanLabel = label,
                    PreviousValue = previous.MayBeRegulatedActivity.Value,
                    CurrentValue = current.MayBeRegulatedActivity.Value,
                    ChangeType = isAdded ? "added" : "removed",
                    HumanDescription = isAdded ? $"+ {label}" : $"- {label}"
                });
            }

            return diffs;
        }

        public static List<string> FormatHumanChangeList(List<LegalSignalDiff> diffs)
        {
            return diffs.Select(d => d.HumanDescription).ToList();
        }
    }
}
