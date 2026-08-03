using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

/// <summary>
/// Collapses ProposalSource into the two client-acquisition channels the Earnings tab
/// reports, and splits released revenue between them.
///
/// Split out of AnalyticsService as a pure function for the same reason
/// AnalyticsBucketWindow was: the classification and the ratio arithmetic are the parts
/// that can silently be wrong, and they are the parts that need no database. The
/// integration tests cover the transaction-to-proposal wiring; these rules are unit-tested
/// directly, so they stay verified on machines without Docker.
/// </summary>
public static class AnalyticsClientSource
{
    /// <summary>
    /// True for sources reached through the Leads / matching flow, false for the ones where
    /// the client found the listing themselves.
    ///
    /// A switch rather than a set literal so adding a ProposalSource member is a deliberate
    /// decision: an unclassified source throws instead of defaulting into Marketplace and
    /// quietly skewing the split.
    /// </summary>
    public static bool IsEcosystemMatch(ProposalSource source) => source switch
    {
        ProposalSource.StandardProposal or ProposalSource.DirectInvitationProposal or ProposalSource.CustomOffer => true,
        ProposalSource.PublishedPackagePurchase or ProposalSource.PackageAddOn or ProposalSource.ChangeRequest => false,
        _ => throw new ArgumentOutOfRangeException(nameof(source), source, "Unclassified ProposalSource — assign it to a client-source channel."),
    };

    /// <summary>
    /// Splits a set of already-resolved originations by channel, counted by head. Each
    /// element is one CLIENT's originating source; null means it could not be traced.
    ///
    /// Shares IsEcosystemMatch with the revenue split above rather than restating the
    /// enum-to-channel mapping, so the Clients tab and the Earnings tab can never disagree
    /// about which channel a source belongs to.
    /// </summary>
    public static ClientOriginationAnalyticsResponse SplitCounts(IEnumerable<ProposalSource?> originations)
    {
        int ecosystem = 0, marketplace = 0, unattributed = 0;
        foreach (var source in originations)
        {
            if (source is null) unattributed++;
            else if (IsEcosystemMatch(source.Value)) ecosystem++;
            else marketplace++;
        }

        var response = new ClientOriginationAnalyticsResponse
        {
            EcosystemClients = ecosystem,
            MarketplaceClients = marketplace,
            UnattributedClients = unattributed,
        };

        var attributed = ecosystem + marketplace;
        if (attributed == 0)
        {
            var reason = unattributed > 0
                ? "The clients active in this period could not be traced back to a proposal, so their origin is unknown."
                : "No client completed work in this period, so there is no origination split to calculate.";
            response.EcosystemMatch = new AnalyticsMetricResponse { State = "notEnoughActivity", Unit = "percent", Reason = reason };
            response.MarketplaceSearch = new AnalyticsMetricResponse { State = "notEnoughActivity", Unit = "percent", Reason = reason };
            return response;
        }

        // Marketplace takes the remainder, exactly as the revenue split does, so the pair
        // totals 100 rather than 33.3/33.3 against a full-width bar.
        var ecosystemPercent = Math.Round((decimal)ecosystem / attributed * 100m, 1);
        response.EcosystemMatch = AnalyticsMetricResponse.Available(ecosystemPercent, null, "percent");
        response.MarketplaceSearch = AnalyticsMetricResponse.Available(100m - ecosystemPercent, null, "percent");
        return response;
    }

    /// <summary>
    /// Splits released revenue by channel. A null source means the release could not be
    /// traced back to a proposal; those are excluded from the ratio rather than folded into
    /// a channel, and reported separately so a large untraceable remainder stays visible
    /// instead of silently distorting the percentages.
    /// </summary>
    public static ClientSourceAnalyticsResponse Split(IEnumerable<(ProposalSource? Source, decimal Net)> releases)
    {
        decimal ecosystem = 0m, marketplace = 0m, unattributed = 0m;
        foreach (var (source, net) in releases)
        {
            if (source is null) unattributed += net;
            else if (IsEcosystemMatch(source.Value)) ecosystem += net;
            else marketplace += net;
        }

        var response = new ClientSourceAnalyticsResponse
        {
            EcosystemNet = ecosystem,
            MarketplaceNet = marketplace,
            UnattributedNet = unattributed,
        };

        // No attributable revenue is not a 0%/0% or 50/50 split — there is no ratio to
        // state. The reason distinguishes "nothing was released" from "everything released
        // was untraceable": different problems, with different fixes.
        var attributed = ecosystem + marketplace;
        if (attributed <= 0m)
        {
            var reason = unattributed > 0m
                ? "Released revenue in this period could not be traced back to a proposal, so its source is unknown."
                : "No revenue was released in this period, so there is no source split to calculate.";
            response.EcosystemMatch = new AnalyticsMetricResponse { State = "notEnoughActivity", Unit = "percent", Reason = reason };
            response.MarketplaceSearch = new AnalyticsMetricResponse { State = "notEnoughActivity", Unit = "percent", Reason = reason };
            return response;
        }

        // Marketplace is the remainder of the same rounding rather than its own division, so
        // the pair always totals exactly 100 and cannot render as 49.9/49.9 against a bar
        // drawn to full width.
        var ecosystemPercent = Math.Round(ecosystem / attributed * 100m, 1);
        response.EcosystemMatch = AnalyticsMetricResponse.Available(ecosystemPercent, null, "percent");
        response.MarketplaceSearch = AnalyticsMetricResponse.Available(100m - ecosystemPercent, null, "percent");
        return response;
    }
}
