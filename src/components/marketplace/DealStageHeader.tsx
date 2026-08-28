import React from "react";
import { Check, ShieldAlert, Sparkles } from "lucide-react";

export type DealPipelineStage =
  | "OFFER_NEGOTIATION"
  | "ROLES_PENDING"
  | "CAP_TABLE_PENDING"
  | "LEGAL_PENDING"
  | "SIGNING_PENDING"
  | "ACTIVATION_PENDING"
  | "PARTNERSHIP_ACTIVE"
  | "REJECTED"
  | "WITHDRAWN";

interface DealStageHeaderProps {
  currentStage: DealPipelineStage | string;
  className?: string;
}

const STAGES = [
  { key: "OFFER", label: "Commercial Offer", num: 1 },
  { key: "ROLES", label: "Roles & Resp", num: 2 },
  { key: "CAP_TABLE", label: "Equity Structure", num: 3 },
  { key: "LEGAL", label: "Legal Review", num: 4 },
  { key: "SIGNING", label: "Sign Agreement", num: 5 },
  { key: "ACTIVE", label: "Partnership Active", num: 6 },
];

function getStageIndex(stage: string): number {
  switch (stage) {
    case "OFFER_NEGOTIATION":
      return 0;
    case "ROLES_PENDING":
      return 1;
    case "CAP_TABLE_PENDING":
      return 2;
    case "LEGAL_PENDING":
    case "LEGAL_REVIEW_PENDING":
      return 3;
    case "SIGNING_PENDING":
    case "SIGNATURE_PENDING":
      return 4;
    case "ACTIVATION_PENDING":
    case "PARTNERSHIP_ACTIVE":
      return 5;
    default:
      return 1;
  }
}

export const DealStageHeader: React.FC<DealStageHeaderProps> = ({ currentStage, className = "" }) => {
  const currentIndex = getStageIndex(currentStage);
  const isRejected = currentStage === "REJECTED" || currentStage === "WITHDRAWN";

  return (
    <div className={`w-full bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm text-foreground ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
              Partnership Formation Pipeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Co-founder agreement progression &amp; bilateral confirmations
            </p>
          </div>
        </div>

        {isRejected ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 border border-destructive/30 text-destructive">
            <ShieldAlert className="w-3.5 h-3.5" />
            Terminated
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
            Stage {Math.min(currentIndex + 1, 6)} of 6: {STAGES[Math.min(currentIndex, 5)].label}
          </span>
        )}
      </div>

      {/* Progress pipeline steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
        {STAGES.map((step, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div
              key={step.key}
              className={`relative flex flex-col p-2.5 rounded-lg border transition-all ${
                isPassed
                  ? "bg-success-light/40 border-success-strong/30 text-success-strong"
                  : isCurrent
                  ? "bg-primary/5 border-primary/60 text-primary ring-1 ring-primary/30"
                  : "bg-muted/20 border-border text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                    isPassed
                      ? "bg-success-light text-success-strong border border-success-strong/40"
                      : isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                  {isPassed ? "Done" : isCurrent ? "Active" : "Pending"}
                </span>
              </div>
              <span className="text-xs font-medium truncate text-foreground">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

