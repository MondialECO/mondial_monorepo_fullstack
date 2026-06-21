"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  FolderLock,
  Handshake,
  Info,
  Lock,
  MessageCircleQuestion,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  WifiOff,
  Star,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { useAuth } from "@/context/AuthContext";

type ChannelKind =
  | "ai"
  | "support"
  | "service_provider"
  | "entrepreneur"
  | "investor"
  | "legal";

type Conversation = {
  id: string;
  initials: string;
  name: string;
  role: string;
  channel: ChannelKind;
  project: string;
  preview: string;
  time: string;
  unread?: number;
  status: "online" | "pending" | "locked" | "offline";
  group: string;
};

type ThreadCard =
  | { type: "file"; fileType: string; title: string; desc: string }
  | { type: "stats"; title: string; subtitle: string; tiles: [string, string, ("green" | "amber" | "blue" | "gray")?][] }
  | { type: "milestone"; title: string; status: string; statusColor: "blue" | "green" | "amber" | "gray"; rows: [string, string, string?][]; btns?: [string, "blue" | "green" | "amber" | "destructive" | "ghost" | "disabled"][] }
  | { type: "offer"; kind: "buyout" | "equity" | "seed" | "safe"; title: string; status: string; statusColor: "blue" | "green" | "amber" | "gray"; rows: [string, string, string?][]; btns?: [string, "blue" | "green" | "amber" | "destructive" | "ghost" | "disabled"][]; warning?: string; note?: string }
  | { type: "nda"; title: string; subtitle: string; visible: string[]; locked: string[] }
  | { type: "levelup"; title: string; subtitle: string; tiles: [string, string][] }
  | { type: "interests"; items: { name: string; role: string; msg: string; status: string; statusColor: "blue" | "green" | "amber" | "gray"; btns: [string, "blue" | "green" | "amber" | "destructive" | "ghost" | "disabled"][] }[] };

type ThreadMessage = {
  id: string;
  author: string;
  role: string;
  time: string;
  body: string;
  mine?: boolean;
  system?: boolean;
  cards?: ThreadCard[];
};

type ActionScreen =
  | "attachments"
  | "ai_coach"
  | "support_case"
  | "work_order"
  | "provider_revision"
  | "provider_approval"
  | "deal_offer"
  | "nda_gate"
  | "accept_offer"
  | "decline_reason"
  | "investor_terms"
  | "investor_pack"
  | "legal_request"
  | "handoff"
  | "files";

// ---- Base mock conversations ----
const baseConversations: Conversation[] = [
  {
    id: "conv-project-coach",
    initials: "AI",
    name: "Project Coach",
    role: "AI Coach",
    channel: "ai",
    project: "AutoInvoice",
    preview: "Your readiness moved to Marketplace Ready.",
    time: "2m",
    status: "online",
    group: "AI + Project Setup",
  },
  {
    id: "conv-identity-support",
    initials: "ID",
    name: "Identity Support",
    role: "Support",
    channel: "support",
    project: "Verification",
    preview: "Your creator profile is cleared for offers.",
    time: "1h",
    status: "online",
    group: "AI + Project Setup",
  },
  {
    id: "conv-brand-provider",
    initials: "NL",
    name: "Nora Lee",
    role: "Branding Provider",
    channel: "service_provider",
    project: "AutoInvoice",
    preview: "Logo delivery is ready for review.",
    time: "18m",
    status: "pending",
    group: "Service Providers",
  },
  {
    id: "conv-finance-provider",
    initials: "FP",
    name: "Finance Pro Studio",
    role: "Finance Provider",
    channel: "service_provider",
    project: "Forecast",
    preview: "Revenue model updated with your pricing.",
    time: "Fri",
    status: "online",
    group: "Service Providers",
  },
  {
    id: "conv-ip-legal",
    initials: "IP",
    name: "IP Legal Expert",
    role: "IP Legal Expert",
    channel: "legal",
    project: "AutoInvoice",
    preview: "Draft mutual NDA is ready to send.",
    time: "3m",
    status: "online",
    group: "Service Providers",
  },
  {
    id: "conv-landing-gtm",
    initials: "LP",
    name: "LandingPro",
    role: "GTM LandingPro",
    channel: "service_provider",
    project: "AutoInvoice",
    preview: "Milestone 1 GTM Wireframe review in progress.",
    time: "2d",
    status: "online",
    group: "Service Providers",
  },
  {
    id: "conv-marketplace",
    initials: "MK",
    name: "Marketplace Listing",
    role: "Marketplace",
    channel: "ai",
    project: "AutoInvoice",
    preview: "3 entrepreneur interests received.",
    time: "5m",
    status: "online",
    group: "Marketplace + Offers",
  },
  {
    id: "conv-aster-buyout",
    initials: "AK",
    name: "Aster Kitchen Group",
    role: "Entrepreneur",
    channel: "entrepreneur",
    project: "AutoInvoice",
    preview: "Full buyout offer needs your response.",
    time: "Now",
    status: "locked",
    group: "Marketplace + Offers",
  },
  {
    id: "conv-mira-equity",
    initials: "ME",
    name: "Mira Equity Labs",
    role: "Entrepreneur",
    channel: "entrepreneur",
    project: "AutoInvoice",
    preview: "Co-founder equity structure is in draft.",
    time: "Yesterday",
    status: "pending",
    group: "Marketplace + Offers",
  },
  {
    id: "conv-northstar-investor",
    initials: "NS",
    name: "Northstar Seed Fund",
    role: "Investor",
    channel: "investor",
    project: "AutoInvoice",
    preview: "Investor terms are ready for protected review.",
    time: "Today",
    status: "locked",
    group: "Investors",
  },
  {
    id: "conv-sophie-seed",
    initials: "SC",
    name: "Sophie Chen",
    role: "Investor",
    channel: "investor",
    project: "AutoInvoice",
    preview: "Seed term sheet received.",
    time: "Now",
    status: "online",
    group: "Investors",
  },
  {
    id: "conv-company-formation",
    initials: "CF",
    name: "Company Formation",
    role: "Legal Workspace",
    channel: "legal",
    project: "Level Up",
    preview: "Shareholder module unlocks after deal choice.",
    time: "Mon",
    status: "offline",
    group: "Big Jump",
  },
  {
    id: "conv-level-up",
    initials: "★",
    name: "Level Up",
    role: "Level Up",
    channel: "support",
    project: "Verified Entrepreneur",
    preview: "Founder badge and matching unlocked.",
    time: "Now",
    status: "online",
    group: "Big Jump",
  },
];

// Map status colors to badge variants
function mapStatusColorToBadgeVariant(color: "blue" | "gray" | "green" | "amber"): "default" | "success" | "destructive" | "outline" | "secondary" | "warning" | "info" {
  switch (color) {
    case "green":
      return "success";
    case "amber":
      return "warning";
    case "blue":
      return "info";
    case "gray":
      return "secondary";
  }
}

// Simple absolute confetti generator
function ConfettiEffect({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{ left: number; delay: number; duration: number; size: number; color: string }>>([]);

  useEffect(() => {
    if (active) {
      const generated = Array.from({ length: 80 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 2,
        size: Math.random() * 8 + 6,
        color: ["#3C50E0", "#00A854", "#B45309", "#38BDF8", "#FBBF24", "#EC4899"][
          Math.floor(Math.random() * 6)
        ],
      }));
      setParticles(generated);
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute top-0 rounded-full"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: 0.8,
            animationName: "fall",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-50px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function CreatorMessengerPage() {
  const { state: progressState, completeStep, advancePhase } = useCreatorProgress();
  const { user } = useAuth();
  const router = useRouter();

  // Resolve current active phase from progressState (1-7)
  const currentPhase = useMemo(() => {
    const js = progressState?.journeyState;
    if (!js) return 1;
    if (js.phase6?.status === "completed") return 7;
    if (js.phase6?.status === "in_progress" || js.phase6?.status === "available") return 6;
    if (js.phase5?.status === "completed") return 6;
    if (js.phase5?.status === "in_progress" || js.phase5?.status === "available") return 5;
    if (js.phase4?.status === "completed") return 5;
    if (js.phase4?.status === "in_progress" || js.phase4?.status === "available") return 4;
    if (js.phase3?.status === "completed") return 4;
    if (js.phase3?.status === "in_progress" || js.phase3?.status === "available") return 3;
    if (js.phase2?.status === "completed") return 3;
    if (js.phase2?.status === "in_progress" || js.phase2?.status === "available") return 2;
    if (js.phase1?.status === "completed") return 2;
    return 1;
  }, [progressState]);

  const selectedPath = progressState?.journeyState?.phase5?.selectedPath ?? null;

  // Track simulated variables locally
  const [activeId, setActiveId] = useState("conv-identity-support");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [composer, setComposer] = useState("");
  const [actionScreen, setActionScreen] = useState<ActionScreen | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  // Simulation state triggers
  const [identityVerified, setIdentityVerified] = useState(false);
  const [brandingApproved, setBrandingApproved] = useState(false);
  const [forecastApproved, setForecastApproved] = useState(false);
  const [ndaSigned, setNdaSigned] = useState(false);
  const [wireframeApproved, setWireframeApproved] = useState(false);
  const [seedFundingEntered, setSeedFundingEntered] = useState(false);
  const [levelUpConfirmed, setLevelUpConfirmed] = useState(false);
  
  // Negotiation states
  const [buyoutAccepted, setBuyoutAccepted] = useState(false);
  const [cofounderOfferState, setCofounderOfferState] = useState<"sent" | "countered" | "accepted">("sent");
  const [sophieOfferState, setSophieOfferState] = useState<"sent" | "countered" | "accepted">("sent");

  // Filter conversations base baseConversations based on active phase / path
  const visibleConversations = useMemo(() => {
    return baseConversations.map((c) => {
      let isLocked = false;
      if (c.id === "conv-brand-provider") isLocked = currentPhase < 2;
      else if (["conv-project-coach", "conv-finance-provider", "conv-ip-legal"].includes(c.id)) {
        isLocked = currentPhase < 3;
      } else if (c.id === "conv-landing-gtm") isLocked = currentPhase < 4;
      else if (c.id === "conv-marketplace") isLocked = currentPhase < 5;
      else if (c.id === "conv-aster-buyout") {
        isLocked = currentPhase < 5 || selectedPath !== "buyout";
      } else if (["conv-mira-equity", "conv-northstar-investor"].includes(c.id)) {
        isLocked = currentPhase < 5 || selectedPath !== "build";
      } else if (["conv-company-formation", "conv-level-up"].includes(c.id)) {
        isLocked = currentPhase < 6;
      } else if (c.id === "conv-sophie-seed") {
        isLocked = currentPhase < 7;
      }

      return {
        ...c,
        status: isLocked ? ("locked" as const) : c.status,
      };
    });
  }, [currentPhase, selectedPath]);

  // Sync default active tab when path / phase updates
  useEffect(() => {
    if (currentPhase === 1) setActiveId("conv-identity-support");
    else if (currentPhase === 2) setActiveId("conv-brand-provider");
    else if (currentPhase === 3) setActiveId("conv-project-coach");
    else if (currentPhase === 4) setActiveId("conv-landing-gtm");
    else if (currentPhase === 5) {
      setActiveId(selectedPath === "buyout" ? "conv-aster-buyout" : "conv-mira-equity");
    } else if (currentPhase === 6) setActiveId("conv-company-formation");
    else if (currentPhase >= 7) setActiveId("conv-sophie-seed");
  }, [currentPhase, selectedPath]);

  const activeConversation = visibleConversations.find((c) => c.id === activeId) ?? visibleConversations[0]!;

  // Dynamic system/user message logs based on states
  const messagesByConversation = useMemo<Record<string, ThreadMessage[]>>(() => {
    return {
      "conv-identity-support": [
        {
          id: "sys-1",
          author: "System",
          role: "System",
          time: "08:00",
          body: "Identity verification is required. Your Creator Innovation Dashboard is locked until your ID and face scan are complete.",
          system: true,
        },
        {
          id: "m-id-1",
          author: "Identity Support",
          role: "Support",
          time: "08:02",
          body: "Welcome to Mondial Ecosysteme. To unlock your Creator Dashboard, please upload a valid government ID and complete the face scan. This ensures a secure deal room environment.",
          cards: [
            {
              type: "stats",
              title: "Verification status",
              subtitle: user?.name || "Creator",
              tiles: [
                ["ID UPLOAD", "Complete", "green"],
                ["FACE SCAN", identityVerified ? "Complete" : "Pending", identityVerified ? "green" : "amber"],
                ["LIVENESS", identityVerified ? "Passed" : "Not started", identityVerified ? "green" : "gray"],
                ["DASHBOARD", identityVerified ? "Unlocked" : "Locked", identityVerified ? "green" : "amber"],
              ],
            },
          ],
        },
        ...(identityVerified
          ? [
              {
                id: "m-id-user-1",
                author: "You",
                role: "Creator",
                time: "08:15",
                body: "Face scan is complete. Am I verified now?",
                mine: true,
              },
              {
                id: "sys-id-2",
                author: "System",
                role: "System",
                time: "08:16",
                body: "Face scan processing. Verification details updated.",
                system: true,
              },
              {
                id: "m-id-3",
                author: "Identity Support",
                role: "Support",
                time: "08:17",
                body: "Verification complete! Your Creator Innovation Dashboard is now unlocked. Welcome to Phase 2 — Project Identity and Branding.",
                cards: [
                  {
                    type: "stats",
                    title: "Verification status",
                    subtitle: user?.name || "Creator",
                    tiles: [
                      ["ID UPLOAD", "Complete", "green"],
                      ["FACE SCAN", "Complete", "green"],
                      ["LIVENESS", "Passed", "green"],
                      ["DASHBOARD", "Unlocked", "green"],
                    ],
                  },
                ],
              },
            ]
          : []),
      ],
      "conv-brand-provider": [
        {
          id: "m-br-1",
          author: "You",
          role: "Creator",
          time: "10:11",
          body: "Hi Nora, I need premium branding for AutoInvoice. Target market: invoice-heavy SMEs. Deliverables: 3 logo concepts and a brand palette.",
          mine: true,
        },
        {
          id: "m-br-2",
          author: "Nora Lee",
          role: "Branding Provider",
          time: "10:14",
          body: "Hello! I reviewed your project summary. I can deliver 3 clean fintech-ready logo concepts and a palette within 5 working days.",
        },
        {
          id: "sys-br-1",
          author: "System",
          role: "System",
          time: "10:15",
          body: "Escrow funded for Milestone 1. Expected delivery in 5 working days.",
          system: true,
        },
        {
          id: "m-br-3",
          author: "Nora Lee",
          role: "Branding Provider",
          time: "Yesterday",
          body: "Hi Tanvir, the first branding concepts package is ready for your review. Check the attachment below.",
          cards: [
            {
              type: "file",
              fileType: "ZIP",
              title: "AutoInvoice_Branding_v1.zip",
              desc: "3 logo concepts · color palettes · avatar guide",
            },
            {
              type: "milestone",
              title: "Logo concepts and brand palette",
              status: brandingApproved ? "Approved" : "Awaiting review",
              statusColor: brandingApproved ? "green" : "amber",
              rows: [
                ["Provider", "Nora Lee"],
                ["Deliverable", "Logo concepts, brand palette"],
                ["Escrow Held", "€480"],
                ["Status", brandingApproved ? "Payment released" : "Awaiting your review"],
              ],
              btns: brandingApproved
                ? undefined
                : [
                    ["Approve branding", "green"],
                    ["Request revision", "ghost"],
                  ],
            },
          ],
        },
        ...(brandingApproved
          ? [
              {
                id: "m-br-user-approved",
                author: "You",
                role: "Creator",
                time: "11:20",
                body: "This looks excellent. I approve the branding concepts and release payment.",
                mine: true,
              },
              {
                id: "sys-br-approved",
                author: "System",
                role: "System",
                time: "11:21",
                body: "Milestone 1 approved. €480 released to Nora Lee. Phase 2 complete.",
                system: true,
              },
              {
                id: "m-br-4",
                author: "Nora Lee",
                role: "Branding Provider",
                time: "11:22",
                body: "Thank you! Escrow received. Moving on to Milestone 2 - final pitch cover designs and deck assets.",
              },
            ]
          : []),
      ],
      "conv-project-coach": [
        {
          id: "sys-coach-1",
          author: "System",
          role: "System",
          time: "12:00",
          body: "Welcome to Phase 3 — Project Intelligence and AI Coach. AI-assisted business models are now active.",
          system: true,
        },
        {
          id: "m-pc-1",
          author: "Project Coach",
          role: "AI Coach",
          time: "12:01",
          body: "Your concept for AutoInvoice is strong. I have analyzed your inputs and generated the baseline 3-year financial forecast.",
          cards: [
            {
              type: "stats",
              title: "AutoInvoice Intelligence",
              subtitle: "FinTech SaaS · Invoice Recovery",
              tiles: [
                ["SECTOR", "FinTech SaaS"],
                ["READINESS", "62%", "amber"],
                ["FORECAST", "Ready", "green"],
                ["BUSINESS PLAN", forecastApproved ? "Ready" : "Draft", forecastApproved ? "green" : "blue"],
              ],
            },
            {
              type: "file",
              fileType: "PDF",
              title: "AutoInvoice_Forecast_3yr.pdf",
              desc: "AI Generated Forecast · Ready for review",
            },
          ],
        },
        ...(forecastApproved
          ? [
              {
                id: "m-pc-user-1",
                author: "You",
                role: "Creator",
                time: "14:10",
                body: "Generate the full business plan and prepare it for FinancePro review.",
                mine: true,
              },
              {
                id: "sys-pc-2",
                author: "System",
                role: "System",
                time: "14:11",
                body: "AI is generating full business plan document...",
                system: true,
              },
              {
                id: "m-pc-2",
                author: "Project Coach",
                role: "AI Coach",
                time: "14:12",
                body: "Done. The final business plan document is ready. You can now share it with a verified Finance Provider for certification.",
                cards: [
                  {
                    type: "file",
                    fileType: "DOC",
                    title: "Business_Plan_Final.docx",
                    desc: "AI draft · Certified for provider review",
                  },
                ],
              },
            ]
          : []),
      ],
      "conv-finance-provider": [
        {
          id: "m-fp-1",
          author: "You",
          role: "Creator",
          time: "14:20",
          body: "Hi FinancePro, I've shared the AI-generated 3-year forecast. Please certify the CAC and operating cost assumptions.",
          mine: true,
        },
        {
          id: "m-fp-2",
          author: "Finance Pro Studio",
          role: "Finance Provider",
          time: "14:24",
          body: "Understood. I've reviewed your unit economics. Two assumptions need adjusting before this is investor-ready:\n1. B2B SME CAC of €18 is too low; update to €65.\n2. Monthly operating cost is model-calculated at €3,200; update to €5,100.",
          cards: [
            {
              type: "stats",
              title: "Forecast Review Summary",
              subtitle: "FinancePro certification notes",
              tiles: [
                ["STRUCTURE", "Solid", "green"],
                ["CAC", forecastApproved ? "Certified" : "Needs revision", forecastApproved ? "green" : "amber"],
                ["OP COST", forecastApproved ? "Certified" : "Needs revision", forecastApproved ? "green" : "amber"],
                ["STATUS", forecastApproved ? "Approved" : "Revise assumptions", forecastApproved ? "green" : "amber"],
              ],
            },
          ],
        },
        ...(forecastApproved
          ? [
              {
                id: "m-fp-user-resub",
                author: "You",
                role: "Creator",
                time: "15:00",
                body: "I have updated the CAC to €65 and operating costs to €5,100. Resubmitting revised forecast.",
                mine: true,
              },
              {
                id: "sys-fp-resub",
                author: "System",
                role: "System",
                time: "15:01",
                body: "Revised forecast v2 uploaded. Certification updated.",
                system: true,
              },
              {
                id: "m-fp-3",
                author: "Finance Pro Studio",
                role: "Finance Provider",
                time: "15:02",
                body: "Assumptions verified. I have certified this forecast as investor-ready. You can now securely share it with buyers after they sign the NDA.",
                cards: [
                  {
                    type: "file",
                    fileType: "PDF",
                    title: "AutoInvoice_Forecast_3yr_v2.pdf",
                    desc: "Certified Investor-Ready Forecast",
                  },
                ],
              },
            ]
          : []),
      ],
      "conv-ip-legal": [
        {
          id: "m-ip-1",
          author: "IP Legal Expert",
          role: "IP Legal Expert",
          time: "15:10",
          body: "Hello. Before sharing private project details or financial models with buyers, setting up a proper NDA is crucial. I have drafted the standard mutual NDA and checklist.",
          cards: [
            {
              type: "stats",
              title: "IP Checklist Status",
              subtitle: "AutoInvoice protection status",
              tiles: [
                ["TRADEMARK", "Not filed", "amber"],
                ["COPYRIGHT", "Protected", "green"],
                ["NDA GATE", ndaSigned ? "Signed" : "Draft ready", ndaSigned ? "green" : "amber"],
                ["IP TRANSFER", ndaSigned ? "Prepared" : "Not prepared", ndaSigned ? "green" : "amber"],
              ],
            },
            {
              type: "file",
              fileType: "PDF",
              title: "AutoInvoice_NDA_Mutual_v1.pdf",
              desc: "Standard mutual NDA draft",
            },
          ],
        },
        ...(ndaSigned
          ? [
              {
                id: "sys-ip-nda-signed",
                author: "System",
                role: "System",
                time: "15:30",
                body: "IP Legal checklists updated. Mutual NDA signed by both parties.",
                system: true,
              },
              {
                id: "m-ip-2",
                author: "IP Legal Expert",
                role: "IP Legal Expert",
                time: "15:31",
                body: "Excellent. I have also prepared the draft IP Transfer Clause and founder Vesting agreements for buyout or equity discussions.",
                cards: [
                  {
                    type: "file",
                    fileType: "PDF",
                    title: "AutoInvoice_IP_Transfer_Clause.pdf",
                    desc: "buyout transfer templates",
                  },
                  {
                    type: "file",
                    fileType: "PDF",
                    title: "AutoInvoice_Equity_Vesting.pdf",
                    desc: "standard co-founder vesting terms",
                  },
                ],
              },
            ]
          : []),
      ],
      "conv-landing-gtm": [
        {
          id: "m-lp-1",
          author: "You",
          role: "Creator",
          time: "16:00",
          body: "Hi LandingPro, I need a GTM landing page. Escrow is funded.",
          mine: true,
        },
        {
          id: "sys-lp-1",
          author: "System",
          role: "System",
          time: "16:01",
          body: "Escrow funded: €1,100. LandingPro work order active.",
          system: true,
        },
        {
          id: "m-lp-2",
          author: "LandingPro",
          role: "GTM LandingPro",
          time: "16:15",
          body: "I've drafted the landing page wireframe. Review the sections and approve to begin development.",
          cards: [
            {
              type: "file",
              fileType: "PDF",
              title: "AutoInvoice_Landing_Wireframe.pdf",
              desc: "Wireframe layout · 4 sections",
            },
            {
              type: "milestone",
              title: "Landing page wireframe and copy",
              status: wireframeApproved ? "Approved" : "In review",
              statusColor: wireframeApproved ? "green" : "amber",
              rows: [
                ["Milestone", "1 of 2"],
                ["Escrow held", "€660"],
                ["Progress", wireframeApproved ? "Approved" : "Awaiting review"],
              ],
              btns: wireframeApproved
                ? undefined
                : [["Approve wireframe", "green"]],
            },
          ],
        },
        ...(wireframeApproved
          ? [
              {
                id: "m-lp-user-wire-app",
                author: "You",
                role: "Creator",
                time: "17:00",
                body: "Wireframe looks great. Let's proceed to development.",
                mine: true,
              },
              {
                id: "sys-lp-wire-app",
                author: "System",
                role: "System",
                time: "17:01",
                body: "Milestone 1 payment released. Milestone 2 in progress.",
                system: true,
              },
            ]
          : []),
      ],
      "conv-marketplace": [
        {
          id: "sys-mk-1",
          author: "System",
          role: "System",
          time: "18:00",
          body: "AutoInvoice Listing is LIVE. Private specifications locked.",
          system: true,
        },
        {
          id: "m-mk-1",
          author: "Marketplace Listing",
          role: "Marketplace",
          time: "18:02",
          body: "Listing live statistics. Verified interests are routed to dedicated threads.",
          cards: [
            {
              type: "stats",
              title: "AutoInvoice Performance",
              subtitle: "FinTech SME Niche",
              tiles: [
                ["VIEWS", "24", "blue"],
                ["INTERESTS", "3", "green"],
                ["OFFERS", buyoutAccepted ? "1 (Accepted)" : "1", "green"],
              ],
            },
            {
              type: "interests",
              items: [
                {
                  name: "Lena Castel · Studio Vertex",
                  role: "Entrepreneur",
                  msg: "Looking to acquire recovery SaaS concepts for buyout.",
                  status: buyoutAccepted ? "Offer accepted" : "Offer received",
                  statusColor: buyoutAccepted ? "green" : "amber",
                  btns: [["View buyout thread", "blue"]],
                },
                {
                  name: "Marco Ferretti · Nexora Labs",
                  role: "Entrepreneur",
                  msg: "Interested in co-founding and distribution integration.",
                  status: cofounderOfferState === "accepted" ? "Offer accepted" : "Pending",
                  statusColor: cofounderOfferState === "accepted" ? "green" : "blue",
                  btns: [["View co-founder thread", "blue"]],
                },
                {
                  name: "Priya Sharma · Arclight",
                  role: "Investor",
                  msg: "Seed investment focus. Interested in unit economics.",
                  status: "Pending",
                  statusColor: "blue",
                  btns: [["View investor thread", "blue"]],
                },
              ],
            },
          ],
        },
      ],
      "conv-aster-buyout": [
        {
          id: "m-as-1",
          author: "Aster Kitchen Group",
          role: "Entrepreneur",
          time: "10:12",
          body: "We reviewed the public summary for AutoInvoice. We want to discuss acquiring the IP and concept outright.",
        },
        {
          id: "m-as-2",
          author: "You",
          role: "Creator",
          time: "10:15",
          body: "Thanks. Forecasts and source files are locked until NDA signature.",
          mine: true,
        },
        {
          id: "m-as-3",
          author: "Aster Kitchen Group",
          role: "Entrepreneur",
          time: "10:18",
          body: "Agreed. We signed the NDA request and uploaded our formal buyout offer.",
        },
        {
          id: "offer-as-buyout",
          author: "Aster Kitchen Group",
          role: "Entrepreneur",
          time: "10:19",
          body: "Formal buyout terms:",
          cards: [
            {
              type: "offer",
              kind: "buyout",
              title: "Full Buyout Offer",
              status: buyoutAccepted ? "accepted" : ndaSigned ? "sent" : "Pre-NDA",
              statusColor: buyoutAccepted ? "green" : ndaSigned ? "blue" : "amber",
              rows: [
                ["Valuation / Amount", "€120,000", "money"],
                ["IP Transferred", "Concepts, brand, forecasts"],
                ["Creator Role", "Optional Advisor (60 days)"],
                ["NDA Status", ndaSigned ? "Signed by both" : "Pending signature"],
              ],
              warning: ndaSigned
                ? undefined
                : "NDA signature is required to accept this buyout offer. Click 'Sign NDA' below.",
              btns: buyoutAccepted
                ? undefined
                : ndaSigned
                  ? [
                      ["Accept buyout offer", "green"],
                      ["Decline offer", "destructive"],
                    ]
                  : [["Sign NDA", "blue"]],
            },
          ],
        },
        ...(ndaSigned
          ? [
              {
                id: "sys-as-nda-done",
                author: "System",
                role: "System",
                time: "10:25",
                body: "NDA countersigned. Private data room files unlocked.",
                system: true,
              },
            ]
          : []),
        ...(buyoutAccepted
          ? [
              {
                id: "m-as-user-acc",
                author: "You",
                role: "Creator",
                time: "11:00",
                body: "I accept the buyout offer. Let's proceed to the legal transfer handoff.",
                mine: true,
              },
              {
                id: "sys-as-acc-done",
                author: "System",
                role: "System",
                time: "11:01",
                body: "Offer accepted. Next-step buyout checklist is unlocked.",
                system: true,
              },
              {
                id: "m-as-4",
                author: "Aster Kitchen Group",
                role: "Entrepreneur",
                time: "11:02",
                body: "Great! Our legal team is initiating company escrow details.",
              },
            ]
          : []),
      ],
      "conv-mira-equity": [
        {
          id: "m-me-1",
          author: "Mira Equity Labs",
          role: "Entrepreneur",
          time: "11:30",
          body: "Hi Tanvir, we want to build this together. We propose a co-founder arrangement. We provide capital and GTM; you retain majority equity.",
          cards: [
            {
              type: "offer",
              kind: "equity",
              title: "Co-founder / Equity Offer",
              status: cofounderOfferState,
              statusColor: cofounderOfferState === "accepted" ? "green" : cofounderOfferState === "countered" ? "amber" : "blue",
              rows: [
                ["Equity Offered", cofounderOfferState === "sent" ? "20% equity" : "17% equity"],
                ["Cash Investment", cofounderOfferState === "sent" ? "€80,000" : "€80,000 + €10k bonus"],
                ["Vesting", "4 years, 1 year cliff"],
                ["IP Ownership", "Retained until exit"],
              ],
              btns: cofounderOfferState === "accepted"
                ? undefined
                : cofounderOfferState === "sent"
                  ? [
                      ["Counter equity %", "blue"],
                      ["Accept proposal", "green"],
                    ]
                  : [["Accept proposal", "green"]],
            },
          ],
        },
        ...(cofounderOfferState === "countered"
          ? [
              {
                id: "m-me-user-counter",
                author: "You",
                role: "Creator",
                time: "12:00",
                body: "I counter at 15%. Given my asset contribution, a smaller equity slice for GTM reflects value better.",
                mine: true,
              },
              {
                id: "sys-me-counter-sent",
                author: "System",
                role: "System",
                time: "12:01",
                body: "Counter-offer sent successfully.",
                system: true,
              },
              {
                id: "m-me-2",
                author: "Mira Equity Labs",
                role: "Entrepreneur",
                time: "12:05",
                body: "Fair points. We can settle at 17% equity, and we will add a €10,000 sign-on bonus to fund your first 2 months.",
              },
            ]
          : []),
        ...(cofounderOfferState === "accepted"
          ? [
              {
                id: "m-me-user-acc",
                author: "You",
                role: "Creator",
                time: "12:15",
                body: "Accepted. 17% co-founder equity terms confirmed. Let's proceed to shareholder formation.",
                mine: true,
              },
              {
                id: "sys-me-acc",
                author: "System",
                role: "System",
                time: "12:16",
                body: "Co-founder agreement signed. Access company formation checklist.",
                system: true,
              },
            ]
          : []),
      ],
      "conv-northstar-investor": [
        {
          id: "m-ns-1",
          author: "Northstar Seed Fund",
          role: "Investor",
          time: "Yesterday",
          body: "We are excited about your fintech recovery metrics. We would like to lead your pre-seed round with a SAFE proposal.",
          cards: [
            {
              type: "offer",
              kind: "safe",
              title: "SAFE Investment Offer",
              status: "sent",
              statusColor: "blue",
              rows: [
                ["Target Amount", "€200,000", "money"],
                ["Valuation Cap", "€2.8M"],
                ["Discount Rate", "25% discount"],
                ["Investor rights", "Pro-rata next round"],
              ],
              btns: [
                ["Counter SAFE terms", "ghost"],
                ["Accept SAFE offer", "green"],
              ],
            },
          ],
        },
      ],
      "conv-sophie-seed": [
        {
          id: "sys-sc-1",
          author: "System",
          role: "System",
          time: "09:00",
          body: "Matchmaker matched Sophie Chen at 94% compatibility. Seed round open.",
          system: true,
        },
        {
          id: "m-sc-1",
          author: "Sophie Chen",
          role: "Investor",
          time: "09:02",
          body: "Hello Tanvir! The 94% match is the highest I've seen. I reviewed the forecasts certified by FinancePro. Lumiere Capital is prepared to lead your Seed round.",
          cards: [
            {
              type: "offer",
              kind: "seed",
              title: "Seed Investment Term Sheet",
              status: sophieOfferState,
              statusColor: sophieOfferState === "accepted" ? "green" : "blue",
              rows: [
                ["Investment Amount", "€450,000", "money"],
                ["Pre-Money Val.", "€3.2M"],
                ["Equity Stake", "12.3%"],
                ["Board Representation", sophieOfferState === "countered" ? "Information rights (12 months)" : "1 Observer seat"],
              ],
              btns: sophieOfferState === "accepted"
                ? undefined
                : [
                    ["Counter board clause", "blue"],
                    ["Accept term sheet", "green"],
                  ],
            },
          ],
        },
        ...(sophieOfferState === "countered"
          ? [
              {
                id: "m-sc-user-board",
                author: "You",
                role: "Creator",
                time: "09:30",
                body: "Hi Sophie. Can we adjust the board seat to information rights only for the first 12 months?",
                mine: true,
              },
              {
                id: "m-sc-2",
                author: "Sophie Chen",
                role: "Investor",
                time: "09:32",
                body: "That is a reasonable request. I've updated the term sheet to information rights only for 12 months.",
              },
            ]
          : []),
        ...(sophieOfferState === "accepted"
          ? [
              {
                id: "m-sc-user-acc",
                author: "You",
                role: "Creator",
                time: "10:00",
                body: "I accept the updated seed term sheet. Ready to start closing.",
                mine: true,
              },
              {
                id: "sys-sc-closing",
                author: "System",
                role: "System",
                time: "10:01",
                body: "🎉 Term sheet accepted! Round closing initiated (estimated close: 4–6 weeks).",
                system: true,
              },
              {
                id: "m-sc-3",
                author: "Sophie Chen",
                role: "Investor",
                time: "10:02",
                body: "Fantastic! Engaging our legal team. Welcome to the Lumiere portfolio!",
              },
            ]
          : []),
      ],
      "conv-company-formation": [
        {
          id: "m-cf-1",
          author: "Company Formation",
          role: "Legal Workspace",
          time: "Yesterday",
          body: "Welcome to your formation workspace. Shareholder equity allocations have been saved.",
          cards: [
            {
              type: "stats",
              title: "Shareholder Allocation",
              subtitle: "AutoInvoice SAS",
              tiles: [
                ["FOUNDER 1", "72% · Tanvir Ahmed", "green"],
                ["FOUNDER 2", "13% · co-founder", "blue"],
                ["ADVISORS", "5%", "gray"],
                ["ESOP", "10%", "gray"],
              ],
            },
            {
              type: "stats",
              title: "Formation Checklist",
              subtitle: "Checklist progress",
              tiles: [
                ["STRUCTURE", "SAS selected", "green"],
                ["SHAREHOLDERS", "Completed", "green"],
                ["SEED FUNDING", seedFundingEntered ? "Completed" : "Pending", seedFundingEntered ? "green" : "amber"],
              ],
            },
          ],
        },
        ...(seedFundingEntered
          ? [
              {
                id: "m-cf-user-fund",
                author: "You",
                role: "Creator",
                time: "16:00",
                body: "Updating seed target: €350,000 target raise at €3.2M valuation.",
                mine: true,
              },
              {
                id: "sys-cf-fund-saved",
                author: "System",
                role: "System",
                time: "16:01",
                body: "Seed funding parameters saved. Formation complete.",
                system: true,
              },
              {
                id: "m-cf-2",
                author: "Company Formation",
                role: "Legal Workspace",
                time: "16:02",
                body: "All legal checklist milestones are complete. Please proceed to the Level Up workspace to certify your founder status.",
              },
            ]
          : []),
      ],
      "conv-level-up": [
        {
          id: "m-lv-1",
          author: "Level Up",
          role: "System",
          time: "09:00",
          body: "All creator steps are complete. Review your verified founder credentials.",
          cards: [
            {
              type: "levelup",
              title: "Level Up to Verified Founder",
              subtitle: "Verify your permanent dashboard role upgrade",
              tiles: [
                ["CURRENT ROLE", "Creator"],
                ["UPGRADED ROLE", "Entrepreneur"],
                ["BADGE", "Founder badge unlocked"],
                ["INVESTORS", "Matchmaking active"],
              ],
            },
          ],
        },
        ...(levelUpConfirmed
          ? [
              {
                id: "sys-lv-leveled",
                author: "System",
                role: "System",
                time: "10:10",
                body: "Role updated. Confetti awarded. Entrepreneur matchmaking is now live.",
                system: true,
              },
              {
                id: "m-lv-2",
                author: "Level Up",
                role: "System",
                time: "10:11",
                body: "Congratulations! You are officially a Verified Entrepreneur. Sophie Chen from Lumiere Capital is matched at 94% compatibility.",
                cards: [
                  {
                    type: "file",
                    fileType: "★",
                    title: "Founder_Badge_AutoInvoice.pdf",
                    desc: "Verified Entrepreneur Certification",
                  },
                ],
              },
            ]
          : []),
      ],
    } as Record<string, ThreadMessage[]>;
  }, [
    user,
    identityVerified,
    brandingApproved,
    forecastApproved,
    ndaSigned,
    wireframeApproved,
    seedFundingEntered,
    levelUpConfirmed,
    buyoutAccepted,
    cofounderOfferState,
    sophieOfferState,
  ]);

  const activeMessages = messagesByConversation[activeId] ?? [];

  // Central interaction handlers
  const handleActionClick = (label: string) => {
    if (label === "Sign NDA") {
      setNdaSigned(true);
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 4000);
      return;
    }

    if (label === "Approve branding") {
      setBrandingApproved(true);
      advancePhase(2); // unlock Phase 3
      return;
    }

    if (label === "Approve wireframe") {
      setWireframeApproved(true);
      advancePhase(4); // unlock Phase 5
      return;
    }

    if (label === "Approve forecast" || label === "Share revised forecast") {
      setForecastApproved(true);
      advancePhase(3); // unlock Phase 4
      return;
    }

    if (label === "Accept buyout offer") {
      setBuyoutAccepted(true);
      advancePhase(5); // Unlock Phase 6
      return;
    }

    if (label === "Counter equity %") {
      setCofounderOfferState("countered");
      return;
    }

    if (label === "Accept proposal") {
      setCofounderOfferState("accepted");
      advancePhase(5);
      return;
    }

    if (label === "Counter board clause") {
      setSophieOfferState("countered");
      return;
    }

    if (label === "Accept term sheet") {
      setSophieOfferState("accepted");
      return;
    }

    if (label === "Add seed funding") {
      setSeedFundingEntered(true);
      completeStep(6, 1);
      return;
    }

    if (label === "Confirm Level Up") {
      setLevelUpConfirmed(true);
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 5000);
      advancePhase(6); // unlock Phase 7 (Sophie Chen)

      // Simulate permanent upgrade inside localStorage auth credentials
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.role = "Entrepreneur";
          localStorage.setItem("user", JSON.stringify(parsed));
        } catch {}
      }
      return;
    }

    // Switch channels for target link CTAs
    const NAV: Record<string, string> = {
      "View Lena's offer": "conv-aster-buyout",
      "View buyout thread": "conv-aster-buyout",
      "View co-founder thread": "conv-mira-equity",
      "View investor thread": "conv-northstar-investor",
      "View all tickets": "conv-identity-support",
      "Start Sophie Chen chat": "conv-sophie-seed",
      "Open Company Formation": "conv-company-formation",
      "Open Level Up Channel": "conv-level-up",
      "Share with FinancePro": "conv-finance-provider",
      "Move to Phase 3": "conv-project-coach",
      "Move to Phase 4": "conv-landing-gtm",
    };

    if (NAV[label]) {
      setActiveId(NAV[label]);
      setMobileThreadOpen(true);
    }
  };

  const handleSendMessage = () => {
    const text = composer.trim();
    if (!text) return;
    setComposer("");
  };

  // Card sub-renderers
  const renderCard = (card: ThreadCard, index: number) => {
    switch (card.type) {
      case "file": {
        const fileIcon = card.fileType === "★" ? (
          <Star className="h-4 w-4 text-warning" />
        ) : (
          <FileText className="h-4 w-4 text-primary" />
        );
        return (
          <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs max-w-sm mt-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {fileIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-foreground">{card.title}</div>
              <div className="truncate text-[10px] text-muted-foreground">{card.desc}</div>
            </div>
          </div>
        );
      }
      case "stats": {
        return (
          <div key={index} className="rounded-xl border border-border bg-card p-3 shadow-xs max-w-md mt-2 space-y-2">
            {card.title && <div className="text-xs font-bold text-foreground">{card.title}</div>}
            <div className="grid grid-cols-2 gap-2">
              {card.tiles.map(([label, val, clr], i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/40 p-2">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase">{label}</div>
                  <div
                    className={cn(
                      "text-xs font-extrabold mt-0.5",
                      clr === "green"
                        ? "text-success-text"
                        : clr === "amber"
                          ? "text-warning"
                          : clr === "blue"
                            ? "text-primary"
                            : "text-foreground"
                    )}
                  >
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case "milestone": {
        return (
          <div key={index} className="rounded-xl border border-border bg-card p-3 shadow-xs max-w-md mt-2 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-extrabold text-foreground">{card.title}</div>
              <Badge
                variant={
                  card.status === "Approved"
                    ? "success"
                    : card.status === "In review"
                      ? "warning"
                      : "outline"
                }
                className="text-[10px]"
              >
                {card.status}
              </Badge>
            </div>
            <div className="divide-y divide-border rounded-lg border border-border bg-muted/20 px-3 py-1">
              {card.rows.map(([label, val], i) => (
                <div key={i} className="flex justify-between py-1.5 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold text-foreground">{val}</span>
                </div>
              ))}
            </div>
            {card.btns && (
              <div className="flex flex-wrap gap-2">
                {card.btns.map(([btnLabel, variant], i) => (
                  <Button
                    key={i}
                    size="sm"
                    className="h-8 text-xs font-bold rounded-lg"
                    variant={variant === "ghost" ? "outline" : "default"}
                    onClick={() => handleActionClick(btnLabel)}
                  >
                    {btnLabel}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      }
      case "offer": {
        return (
          <div key={index} className="rounded-xl border border-border bg-card p-3 shadow-xs max-w-md mt-2 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-extrabold text-foreground flex items-center gap-1">
                <Handshake className="h-4 w-4 text-primary" />
                {card.title}
              </div>
              <Badge variant={card.status === "accepted" ? "success" : "info"} className="text-[10px] capitalize">
                {card.status}
              </Badge>
            </div>
            <div className="divide-y divide-border rounded-lg border border-border bg-muted/20 px-3 py-1">
              {card.rows.map(([label, val, clr], i) => (
                <div key={i} className="flex justify-between py-1.5 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span
                    className={cn(
                      "font-extrabold",
                      clr === "money" ? "text-primary" : "text-foreground"
                    )}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
            {card.warning && (
              <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-[10px] text-destructive leading-relaxed font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {card.warning}
              </div>
            )}
            {card.btns && (
              <div className="flex flex-wrap gap-2">
                {card.btns.map(([btnLabel, variant], i) => (
                  <Button
                    key={i}
                    size="sm"
                    className="h-8 text-xs font-bold rounded-lg"
                    variant={variant === "ghost" ? "outline" : "default"}
                    onClick={() => handleActionClick(btnLabel)}
                  >
                    {btnLabel}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      }
      case "levelup": {
        return (
          <div key={index} className="rounded-xl border border-warning/30 bg-gradient-to-br from-warning/5 to-primary/5 p-4 max-w-md mt-2 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Star className="h-4 w-4 fill-warning" />
              </div>
              <h3 className="text-xs font-black text-foreground">{card.title}</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{card.subtitle}</p>
            <div className="divide-y divide-border rounded-lg border border-border/70 bg-card/50 px-3 py-1">
              {card.tiles.map(([label, val], i) => (
                <div key={i} className="flex justify-between py-1.5 text-[11px]">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-extrabold text-foreground">{val}</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full h-9 text-xs font-bold bg-warning hover:bg-warning/90 text-white rounded-lg shadow-xs"
              onClick={() => handleActionClick("Confirm Level Up")}
            >
              Confirm Level Up
            </Button>
          </div>
        );
      }
      case "interests": {
        return (
          <div key={index} className="mt-2 space-y-2">
            {card.items.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 shadow-xs max-w-md space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground">{item.role}</div>
                  </div>
                  <Badge variant={mapStatusColorToBadgeVariant(item.statusColor)} className="text-[9px]">
                    {item.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.msg}</p>
                <div className="flex justify-end gap-2">
                  {item.btns.map(([btnLabel, variant], bi) => (
                    <Button
                      key={bi}
                      size="sm"
                      className="h-8 text-xs font-bold rounded-lg px-3"
                      variant={variant === "ghost" ? "outline" : "default"}
                      onClick={() => handleActionClick(btnLabel)}
                    >
                      {btnLabel}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground select-none">
      <ConfettiEffect active={confettiActive} />

      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="h-9 rounded-lg px-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/50">
            <Link href="/dashboard/creator">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Creator Messenger
            </div>
            <h1 className="truncate text-xs font-extrabold text-foreground mt-0.5">
              Secure deal room and custom offer workflows
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-7 rounded-lg bg-card text-muted-foreground px-2 text-[10px] font-bold select-none border-border">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline Sync
          </Badge>
          <Badge variant="success" className="h-7 rounded-lg px-2 text-[10px] font-extrabold select-none">
            {currentPhase} active phase
          </Badge>
          <Button
            size="sm"
            className="h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95"
            onClick={() => setContextOpen(true)}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Context details
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_300px]">
        {/* Inbox sidebar */}
        <aside className={cn("min-h-0 border-r border-border bg-card flex flex-col shrink-0", mobileThreadOpen ? "hidden lg:flex" : "flex")}>
          <div className="space-y-2 border-b border-border p-3">
            <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Active Conversations</h2>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-8 rounded-lg bg-background pl-8 text-xs select-text focus-visible:ring-1 focus-visible:ring-border border-border" placeholder="Search threads" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {visibleConversations.map((item) => {
              const active = item.id === activeId;
              const isLocked = item.status === "locked";
              return (
                <button
                  key={item.id}
                  disabled={isLocked}
                  onClick={() => {
                    setActiveId(item.id);
                    setMobileThreadOpen(true);
                  }}
                  className={cn(
                    "relative flex w-full gap-3 px-3 py-3 text-left hover:bg-muted/30 transition-colors border-none bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent",
                    active && "bg-primary/5 hover:bg-primary/5"
                  )}
                >
                  {active && <span className="absolute inset-y-0 left-0 w-1 bg-primary" />}
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">
                      {item.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="truncate text-xs font-extrabold text-foreground">{item.name}</div>
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="truncate text-[10px] text-muted-foreground">{item.role}</div>
                      {isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground mt-1">{item.preview}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Thread */}
        <main className={cn("min-h-0 flex-col bg-background/50", mobileThreadOpen ? "flex" : "hidden lg:flex")}>
          <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg lg:hidden"
                onClick={() => setMobileThreadOpen(false)}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {activeConversation.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xs font-extrabold text-foreground">{activeConversation.name}</h2>
                <p className="text-[10px] text-muted-foreground">{activeConversation.role} · {activeConversation.project}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold rounded-lg border-border" onClick={() => setContextCollapsed(!contextCollapsed)}>
                {contextCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                Context Panel
              </Button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeMessages.map((message) => {
              if (message.system) {
                return (
                  <div key={message.id} className="flex justify-center my-2 select-none">
                    <div className="max-w-md rounded-lg border border-border bg-card/60 px-3 py-1.5 text-center text-[10px] font-bold text-muted-foreground shadow-xs">
                      {message.body}
                    </div>
                  </div>
                );
              }
              return (
                <div key={message.id} className={cn("flex gap-3", message.mine && "justify-end")}>
                  {!message.mine && (
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-muted text-[10px] font-bold">
                        {activeConversation.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[75%] space-y-1", message.mine && "items-end text-right")}>
                    <div className="text-[10px] text-muted-foreground">
                      <span className="font-bold text-foreground mr-1.5">{message.author}</span>
                      {message.time}
                    </div>
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs leading-relaxed shadow-xs",
                        message.mine
                          ? "rounded-tr-xs bg-primary text-primary-foreground"
                          : "rounded-tl-xs border border-border bg-card text-foreground"
                      )}
                    >
                      {message.body}
                    </div>
                    {message.cards?.map((card, i) => renderCard(card, i))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-card p-3 shrink-0">
            <div className="rounded-xl border border-border bg-background p-2">
              <Textarea
                rows={1}
                className="min-h-8 max-h-24 resize-none border-0 bg-transparent px-2 py-1 shadow-none text-xs focus-visible:ring-0 select-text outline-none text-foreground w-full"
                placeholder="Write a secure message..."
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 shrink-0 select-none">
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/50">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/50">
                    <Bot className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" className="h-8 rounded-lg text-xs font-bold px-4 bg-primary text-primary-foreground hover:bg-primary/95" onClick={handleSendMessage}>
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Details Context Panel */}
        <aside className={cn("min-h-0 border-l border-border bg-card flex flex-col shrink-0 overflow-y-auto", contextCollapsed ? "hidden" : "hidden xl:flex")}>
          <div className="border-b border-border p-3 flex items-center justify-between select-none">
            <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Deal context info</h2>
          </div>
          <div className="p-4 space-y-4 select-none">
            <Card className="p-4 space-y-4 border-border bg-muted/20 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">AutoInvoice concept</h3>
                  <p className="text-[10px] text-muted-foreground">Clarity valuation summary</p>
                </div>
                <Badge variant="outline" className="text-[9px]">
                  Phase {currentPhase}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">Readiness Completion</span>
                  <span>{currentPhase === 1 ? "15%" : currentPhase === 2 ? "34%" : currentPhase === 3 ? "62%" : currentPhase === 4 ? "70%" : "86%"}</span>
                </div>
                <Progress value={currentPhase === 1 ? 15 : currentPhase === 2 ? 34 : currentPhase === 3 ? 62 : currentPhase === 4 ? 70 : 86} className="h-1.5" />
              </div>
            </Card>

            <Card className="p-4 space-y-3 border-border shadow-xs bg-muted/20">
              <h3 className="text-xs font-extrabold text-foreground">Action triggers</h3>
              <div className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                {currentPhase === 1 && (
                  <>
                    <p>To advance: upload identity proof and complete liveness check in KYC Support.</p>
                    <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg" onClick={() => handleActionClick("Sign NDA")}>
                      Start liveness check
                    </Button>
                  </>
                )}
                {currentPhase === 2 && (
                  <>
                    <p>To advance: review the branding exports and approve Nora Lee's Milestone 1.</p>
                    <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg" onClick={() => handleActionClick("Approve branding")}>
                      Approve branding
                    </Button>
                  </>
                )}
                {currentPhase === 3 && (
                  <>
                    <p>To advance: resubmit forecast details to FinancePro or request Plan generation.</p>
                    <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg" onClick={() => handleActionClick("Approve forecast")}>
                      Certify forecast
                    </Button>
                  </>
                )}
                {currentPhase === 4 && (
                  <>
                    <p>To advance: certify GTM Landing page wireframe approval in LandingPro.</p>
                    <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg" onClick={() => handleActionClick("Approve wireframe")}>
                      Approve wireframe
                    </Button>
                  </>
                )}
                {currentPhase === 5 && !buyoutAccepted && selectedPath === "buyout" && (
                  <>
                    <p>Acquisition negotiation: click 'Sign NDA' inside the buyout offer card to unlock private documents.</p>
                    <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg animate-pulse" onClick={() => handleActionClick("Sign NDA")}>
                      Execute mutual NDA
                    </Button>
                  </>
                )}
                {currentPhase === 6 && (
                  <>
                    <p>Transition: click 'Add seed funding' inside formation checklist to unlock Level Up transition.</p>
                    <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg" onClick={() => handleActionClick("Add seed funding")}>
                      Save seed raise target
                    </Button>
                  </>
                )}
                {currentPhase >= 7 && (
                  <p>Verified founder round closed. Closing processes will complete in 4-6 weeks.</p>
                )}
              </div>
            </Card>

            <Card className="p-4 space-y-3 border-border shadow-xs bg-muted/20">
              <h3 className="text-xs font-extrabold text-foreground">Sensitive documents</h3>
              <div className="space-y-2">
                {[
                  ["Business Plan", currentPhase >= 3 ? "Unlocked" : "Locked", currentPhase >= 3 ? "green" : "amber"],
                  ["Financial Forecast", forecastApproved ? "Unlocked" : "Certification required", forecastApproved ? "green" : "amber"],
                  ["IP specifications", ndaSigned ? "Unlocked" : "NDA signature required", ndaSigned ? "green" : "amber"],
                ].map(([label, val, clr], i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1">
                    <span className="text-muted-foreground">{label}</span>
                    <Badge variant={clr === "green" ? "success" : "outline"} className="text-[9px]">
                      {val}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </aside>
      </div>

      {/* Context Sheet modal for mobile */}
      <Sheet open={contextOpen} onOpenChange={setContextOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm overflow-y-auto bg-card select-none">
          <SheetHeader className="border-b border-border px-4 py-3 shrink-0">
            <SheetTitle>Deal Context Details</SheetTitle>
            <SheetDescription>Verify active triggers and documents security</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <Card className="p-4 space-y-3 border-border shadow-xs bg-muted/20">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted-foreground">Readiness Completion</span>
                <span>{currentPhase === 1 ? "15%" : currentPhase === 2 ? "34%" : currentPhase === 3 ? "62%" : currentPhase === 4 ? "70%" : "86%"}</span>
              </div>
              <Progress value={currentPhase === 1 ? 15 : currentPhase === 2 ? 34 : currentPhase === 3 ? 62 : currentPhase === 4 ? 70 : 86} className="h-1.5" />
            </Card>
            <Card className="p-4 space-y-3 border-border shadow-xs bg-muted/20">
              <h3 className="text-xs font-extrabold text-foreground">Checklist actions</h3>
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                {currentPhase === 1 && <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg mt-2" onClick={() => { handleActionClick("Sign NDA"); setContextOpen(false); }}>Start face scan</Button>}
                {currentPhase === 2 && <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg mt-2" onClick={() => { handleActionClick("Approve branding"); setContextOpen(false); }}>Approve branding</Button>}
                {currentPhase === 3 && <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg mt-2" onClick={() => { handleActionClick("Approve forecast"); setContextOpen(false); }}>Certify forecast</Button>}
                {currentPhase === 5 && !ndaSigned && <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg mt-2" onClick={() => { handleActionClick("Sign NDA"); setContextOpen(false); }}>Sign mutual NDA</Button>}
                {currentPhase === 6 && <Button className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg mt-2" onClick={() => { handleActionClick("Add seed funding"); setContextOpen(false); }}>Save seed raise target</Button>}
              </div>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
