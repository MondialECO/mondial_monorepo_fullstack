export type MessengerOfferType =
  | "full_buyout"
  | "cofounder_equity"
  | "investor_terms"
  | "provider_custom"
  | "license_future"
  | "royalty_future";

export type MessengerOfferStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "countered"
  | "declined"
  | "expired";

export type MessengerOfferActor = "creator" | "counterparty";

export interface MessengerOffer {
  id: string;
  conversationId: string;
  type: MessengerOfferType;
  status: MessengerOfferStatus;
  title: string;
  amountLabel: string;
  equityLabel?: string;
  deliveryLabel: string;
  terms: string;
  milestones: string[];
  files: string[];
  expiresAt: string;
  note: string;
  sender: MessengerOfferActor;
  updatedAt: string;
}

export interface MessengerOfferDraft {
  conversationId: string;
  type: MessengerOfferType;
  amountLabel: string;
  equityLabel?: string;
  deliveryLabel: string;
  terms: string;
  milestones: string[];
  files: string[];
  expiresAt: string;
  note: string;
  sender: MessengerOfferActor;
}

export interface MessengerOfferUpdate {
  amountLabel: string;
  equityLabel?: string;
  deliveryLabel: string;
  terms: string;
  milestones: string[];
  files: string[];
  expiresAt: string;
  note: string;
}

export const messengerOfferTypeLabels: Record<MessengerOfferType, string> = {
  full_buyout: "Full Buyout Offer",
  cofounder_equity: "Co-founder / Equity Offer",
  investor_terms: "Investor Terms",
  provider_custom: "Provider Custom Offer",
  license_future: "License Offer",
  royalty_future: "Royalty Offer",
};

export const futureMessengerOfferTypes: MessengerOfferType[] = [
  "license_future",
  "royalty_future",
];

const now = "Just now";

export const initialMessengerOffers: MessengerOffer[] = [
  {
    id: "offer-buyout-1",
    conversationId: "conv-aster-buyout",
    type: "full_buyout",
    status: "sent",
    title: messengerOfferTypeLabels.full_buyout,
    amountLabel: "€72,000",
    deliveryLabel: "IP transfer + 60 day advisory handoff",
    terms:
      "Full transfer of the AutoInvoice concept, brand assets, forecast model, operating notes and working files after NDA unlock.",
    milestones: ["NDA review", "Document unlock", "Payment confirmation", "IP handoff"],
    files: ["Public project summary.pdf", "Offer terms.pdf"],
    expiresAt: "Expires in 5 days",
    note: "Aster wants a clean buyout and short advisory window after closing.",
    sender: "counterparty",
    updatedAt: "10:19",
  },
  {
    id: "offer-equity-1",
    conversationId: "conv-aster-buyout",
    type: "cofounder_equity",
    status: "countered",
    title: messengerOfferTypeLabels.cofounder_equity,
    amountLabel: "€18,000 setup budget",
    equityLabel: "12% equity",
    deliveryLabel: "Creator remains product co-founder",
    terms:
      "Aster funds setup while the creator keeps an operating co-founder role and receives equity in the formed company.",
    milestones: ["Role definition", "Equity review", "Formation checklist", "Operating agreement"],
    files: ["Equity draft.pdf"],
    expiresAt: "Expires in 8 days",
    note: "Counter suggested a smaller equity share with clearer advisory duties.",
    sender: "creator",
    updatedAt: "Yesterday",
  },
  {
    id: "offer-provider-1",
    conversationId: "conv-brand-provider",
    type: "provider_custom",
    status: "draft",
    title: messengerOfferTypeLabels.provider_custom,
    amountLabel: "€1,200",
    deliveryLabel: "Brand polish package",
    terms:
      "Provider delivers marketplace-ready brand refinements, final logo exports and a short brand usage guide.",
    milestones: ["Asset review", "Final exports", "Usage guide"],
    files: ["Logo delivery.zip"],
    expiresAt: "Draft",
    note: "Prepared for the branding provider workroom.",
    sender: "creator",
    updatedAt: "Draft",
  },
  {
    id: "offer-investor-1",
    conversationId: "conv-northstar-investor",
    type: "investor_terms",
    status: "viewed",
    title: messengerOfferTypeLabels.investor_terms,
    amountLabel: "€250,000",
    equityLabel: "8% equity",
    deliveryLabel: "Seed investment terms after data-room access",
    terms:
      "Investor terms are tied to company formation, data-room readiness, NDA status and founder-side approval.",
    milestones: ["NDA signed", "Investor pack shared", "Term review", "Founder approval"],
    files: ["Investor teaser.pdf", "Forecast summary.pdf"],
    expiresAt: "Expires in 10 days",
    note: "Investor wants terms reviewed after the protected pack is unlocked.",
    sender: "counterparty",
    updatedAt: "Today",
  },
  {
    id: "offer-expired-1",
    conversationId: "conv-aster-buyout",
    type: "full_buyout",
    status: "expired",
    title: messengerOfferTypeLabels.full_buyout,
    amountLabel: "€58,000",
    deliveryLabel: "Earlier acquisition proposal",
    terms: "Previous buyout proposal. A newer offer is now active in this thread.",
    milestones: ["Review window"],
    files: [],
    expiresAt: "Expired",
    note: "Archived for context.",
    sender: "counterparty",
    updatedAt: "Last week",
  },
];

export async function listThreadOffers(conversationId: string): Promise<MessengerOffer[]> {
  return initialMessengerOffers.filter((offer) => offer.conversationId === conversationId);
}

export async function sendCustomOffer(draft: MessengerOfferDraft): Promise<MessengerOffer> {
  return {
    ...draft,
    id: `offer-${Date.now()}`,
    title: messengerOfferTypeLabels[draft.type],
    status: "sent",
    updatedAt: now,
  };
}

export async function acceptCustomOffer(offer: MessengerOffer): Promise<MessengerOffer> {
  return { ...offer, status: "accepted", updatedAt: now };
}

export async function counterCustomOffer(
  offer: MessengerOffer,
  update: MessengerOfferUpdate
): Promise<MessengerOffer> {
  return { ...offer, ...update, status: "countered", sender: "creator", updatedAt: now };
}

export async function declineCustomOffer(
  offer: MessengerOffer,
  note: string
): Promise<MessengerOffer> {
  return {
    ...offer,
    status: "declined",
    note: note.trim() || offer.note,
    updatedAt: now,
  };
}
