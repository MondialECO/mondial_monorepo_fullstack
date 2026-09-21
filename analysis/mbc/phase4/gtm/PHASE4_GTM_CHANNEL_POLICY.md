# Phase 4.7 — GTM Channel Strategy & Reason Codes

## 1. Supported Acquisition Channels

- `FounderLedSales`: Direct outbound, 1-on-1 discovery calls, pilot proposals.
- `OrganicSocial`: Thought leadership, building in public, problem education.
- `ColdOutreach`: Targeted email outreach to verified ICP lists.
- `InboundContent`: Technical guides, case studies, comparison pages.
- `Partnerships`: Co-marketing, reciprocal referrals with complementary services.
- `Communities`: Niche forums, Slack/Discord groups, industry guilds.
- `PaidSearch`: High-intent keyword search campaigns.
- `PaidSocial`: Targeted sponsored posts.
- `MarketplacePresence`: Listing on relevant B2B/B2C aggregators.
- `EventNetworking`: Industry trade shows, founder meetups.
- `ReferralProgram`: Structured incentive loops for existing users.
- `DirectMail`: High-touch physical mail for targeted enterprise accounts.

---

## 2. Deterministic Reason Codes (`GtmRecommendationReason`)

1. `SEGMENT_REACHABLE`: Primary segment can be reliably engaged via this channel.
2. `FOUNDER_CAPABILITY_MATCH`: Founder has direct or covered domain competence.
3. `DELEGATION_AVAILABLE`: Phase 4.4 confirmed agency or contractor support for this channel.
4. `BUDGET_COMPATIBLE`: Channel spend requirements align with spendable cash.
5. `BUDGET_NOT_CONFIRMED`: Channel requires ad spend but no spendable cash is confirmed.
6. `SALES_MOTION_MATCH`: Motion matches sales complexity (e.g., Consultative sales -> FounderLedSales).
7. `PRICE_MODEL_MATCH`: Price floor can absorb channel acquisition costs.
8. `LONG_SALES_CYCLE`: Channel has a multi-month ramp; flagged for early initiation.
9. `LOW_FOUNDER_CAPACITY`: Founder availability (<10h/wk) forces deferral of high-effort channels.
10. `OFFER_NOT_VALIDATED`: Offer packaging requires qualitative discovery first.
11. `PRICE_NOT_VALIDATED`: Pricing is `NeedsValidation`; paid channels deferred to avoid cash burn.
12. `SEARCH_INTENT_SUPPORTED`: Verified search volume exists for the problem category.
13. `PARTNERSHIP_FIT`: Ecosystem partners already service target customers without competing.
14. `INSUFFICIENT_EVIDENCE`: No data to ground recommendation; deferred.
