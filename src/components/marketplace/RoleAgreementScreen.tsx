import React, { useState } from "react";
import {
  RoleResponsibilityAgreement,
  UpdateRoleAgreementRequest,
  RequestRoleChangesRequest,
} from "@/lib/api-marketplace-projects";
import { DealStageHeader } from "./DealStageHeader";
import {
  CheckCircle2,
  Clock,
  Edit3,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  Send,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

interface RoleAgreementScreenProps {
  dealId: string;
  agreement: RoleResponsibilityAgreement;
  currentUserId: string;
  isCreator: boolean;
  onConfirm: () => Promise<void>;
  onUpdate: (payload: UpdateRoleAgreementRequest) => Promise<void>;
  onRequestChanges: (payload: RequestRoleChangesRequest) => Promise<void>;
  onProceedToCapTable?: () => void;
  isLoading?: boolean;
}

export const RoleAgreementScreen: React.FC<RoleAgreementScreenProps> = ({
  dealId,
  agreement,
  currentUserId,
  isCreator,
  onConfirm,
  onUpdate,
  onRequestChanges,
  onProceedToCapTable,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState("");

  // Editable form state
  const [creatorRole, setCreatorRole] = useState(agreement.creatorRole || "Co-founder");
  const [entrepreneurRole, setEntrepreneurRole] = useState(agreement.entrepreneurRole || "CEO");
  const [creatorResponsibilities, setCreatorResponsibilities] = useState<string[]>(
    agreement.creatorResponsibilities?.length ? [...agreement.creatorResponsibilities] : ["IP & Architecture Handover"]
  );
  const [entrepreneurResponsibilities, setEntrepreneurResponsibilities] = useState<string[]>(
    agreement.entrepreneurResponsibilities?.length
      ? [...agreement.entrepreneurResponsibilities]
      : ["Business Operations", "Fundraising & Capital", "Team Hiring", "Go-To-Market"]
  );
  const [creatorTimeCommitment, setCreatorTimeCommitment] = useState(
    agreement.creatorTimeCommitment || "10 hours / week"
  );
  const [entrepreneurTimeCommitment, setEntrepreneurTimeCommitment] = useState(
    agreement.entrepreneurTimeCommitment || "Full-time (40 hours / week)"
  );
  const [notes, setNotes] = useState(agreement.notes || "");
  const [newCreatorResp, setNewCreatorResp] = useState("");
  const [newEntResp, setNewEntResp] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isConfirmedByMe = isCreator
    ? agreement.creatorConfirmedVersion === agreement.version
    : agreement.entrepreneurConfirmedVersion === agreement.version;

  const isConfirmedByOther = isCreator
    ? agreement.entrepreneurConfirmedVersion === agreement.version
    : agreement.creatorConfirmedVersion === agreement.version;

  const isFullyConfirmed = agreement.status === "CONFIRMED";
  const otherPartyLabel = isCreator ? "Entrepreneur" : "Creator";
  const otherPartyName = isCreator ? agreement.entrepreneurName || "Entrepreneur" : agreement.creatorName || "Creator";

  const handleAddCreatorResp = () => {
    if (!newCreatorResp.trim()) return;
    setCreatorResponsibilities([...creatorResponsibilities, newCreatorResp.trim()]);
    setNewCreatorResp("");
  };

  const handleRemoveCreatorResp = (index: number) => {
    setCreatorResponsibilities(creatorResponsibilities.filter((_, i) => i !== index));
  };

  const handleAddEntResp = () => {
    if (!newEntResp.trim()) return;
    setEntrepreneurResponsibilities([...entrepreneurResponsibilities, newEntResp.trim()]);
    setNewEntResp("");
  };

  const handleRemoveEntResp = (index: number) => {
    setEntrepreneurResponsibilities(entrepreneurResponsibilities.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onUpdate({
        creatorRole,
        entrepreneurRole,
        creatorResponsibilities,
        entrepreneurResponsibilities,
        creatorTimeCommitment,
        entrepreneurTimeCommitment,
        notes,
      });
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update role agreement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onConfirm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to confirm role agreement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRequestChanges = async () => {
    if (!changeFeedback.trim()) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onRequestChanges({ feedback: changeFeedback.trim() });
      setShowRequestChangesModal(false);
      setChangeFeedback("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to request changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-foreground">
      {/* Deal Pipeline Header */}
      <DealStageHeader currentStage={isFullyConfirmed ? "CAP_TABLE_PENDING" : "ROLES_PENDING"} />

      {/* Locked Commercial Terms Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-warning/10 border border-warning/30 text-warning">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">Accepted Commercial Terms (Locked)</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border">
                  Rev #{agreement.commercialTerms?.acceptedRevisionNumber ?? 1}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Economic percentages &amp; vesting are finalized from the accepted Equity Offer and cannot be changed here.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-background p-3 rounded-lg border border-border">
            <span className="text-[11px] font-medium text-muted-foreground">Creator Equity</span>
            <p className="text-lg font-bold text-success-strong mt-0.5">
              {agreement.commercialTerms?.equityPercentage ?? 0}%
            </p>
          </div>
          <div className="bg-background p-3 rounded-lg border border-border">
            <span className="text-[11px] font-medium text-muted-foreground">Cash Component</span>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {agreement.commercialTerms?.cashComponent
                ? `$${agreement.commercialTerms.cashComponent.toLocaleString()}`
                : "None"}
            </p>
          </div>
          <div className="bg-background p-3 rounded-lg border border-border">
            <span className="text-[11px] font-medium text-muted-foreground">Vesting Schedule</span>
            <p className="text-sm font-semibold text-foreground mt-1">
              {agreement.commercialTerms?.vestingEnabled
                ? `${agreement.commercialTerms.vestingMonths} mo (${agreement.commercialTerms.cliffMonths} mo cliff)`
                : "Immediate"}
            </p>
          </div>
          <div className="bg-background p-3 rounded-lg border border-border">
            <span className="text-[11px] font-medium text-muted-foreground">Designated Role</span>
            <p className="text-sm font-semibold text-primary mt-1 truncate">
              {agreement.commercialTerms?.creatorRole || "Co-founder"}
            </p>
          </div>
        </div>
      </div>

      {/* Screen 02 Main Card: Roles & Responsibilities */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        {/* Header with Version & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Role &amp; Responsibility Agreement
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                Version {agreement.version}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Define founder duties, time commitments, and operational ownership before cap table allocation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isFullyConfirmed && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Agreement
              </button>
            )}
            {!isFullyConfirmed && !isEditing && (
              <button
                onClick={() => setShowRequestChangesModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 flex items-center gap-1.5 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Request Changes
              </button>
            )}
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Confirmation Status Banner */}
        {isFullyConfirmed ? (
          <div className="p-4 bg-success-light border border-success-strong/30 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success-strong shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-success-strong">
                Agreement Fully Confirmed (Version {agreement.version})
              </h5>
              <p className="text-xs text-muted-foreground">
                Both {agreement.creatorName || "Creator"} and {agreement.entrepreneurName || "Entrepreneur"} have confirmed
                this exact agreement. Deal stage advanced to Cap Table &amp; Equity Structure.
              </p>
            </div>
          </div>
        ) : isConfirmedByMe ? (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-primary">
                You confirmed Version {agreement.version}
              </h5>
              <p className="text-xs text-muted-foreground">
                Waiting for {otherPartyName} ({otherPartyLabel}) to confirm this version. If either party edits the
                terms, confirmation will reset to ensure bilateral consent.
              </p>
            </div>
          </div>
        ) : isConfirmedByOther ? (
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-warning">
                {otherPartyName} confirmed Version {agreement.version}
              </h5>
              <p className="text-xs text-muted-foreground">
                {otherPartyName} is waiting for your confirmation on Version {agreement.version}. Review the roles below
                and click &quot;Confirm Roles&quot; to advance to Cap Table.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/40 border border-border rounded-xl flex items-start gap-3">
            <Layers className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-foreground">
                Awaiting Bilateral Confirmation (Version {agreement.version})
              </h5>
              <p className="text-xs text-muted-foreground">
                Both parties must review and confirm the responsibilities and time commitments detailed below.
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Founder Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Role Card */}
          <div className="bg-background border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success-strong" />
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Creator Role &amp; Duties
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{agreement.creatorName || "Creator"}</span>
              </div>

              {/* Role Title */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Official Role Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={creatorRole}
                    onChange={(e) => setCreatorRole(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Co-founder & Chief Scientist"
                  />
                ) : (
                  <div className="px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm font-semibold text-foreground">
                    {agreement.creatorRole || "Co-founder & Chief Scientist"}
                  </div>
                )}
              </div>

              {/* Time Commitment */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Time Commitment</label>
                {isEditing ? (
                  <select
                    value={creatorTimeCommitment}
                    onChange={(e) => setCreatorTimeCommitment(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="5 hours / week">5 hours / week (Advisory)</option>
                    <option value="10 hours / week">10 hours / week (Part-time Advisor)</option>
                    <option value="20 hours / week">20 hours / week (Part-time Core)</option>
                    <option value="Full-time (40 hours / week)">Full-time (40 hours / week)</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm text-foreground flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{agreement.creatorTimeCommitment || "10 hours / week"}</span>
                  </div>
                )}
              </div>

              {/* Core Responsibilities */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  Core Responsibilities
                </label>
                <div className="space-y-1.5">
                  {(isEditing ? creatorResponsibilities : agreement.creatorResponsibilities || []).map(
                    (resp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground"
                      >
                        <span className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">•</span>
                          <span>{resp}</span>
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveCreatorResp(idx)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {isEditing && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newCreatorResp}
                        onChange={(e) => setNewCreatorResp(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCreatorResp())}
                        placeholder="Add responsibility..."
                        className="flex-1 px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={handleAddCreatorResp}
                        className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground border border-border flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation status pill */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Creator Confirmation:</span>
              <span
                className={`font-semibold ${
                  agreement.creatorConfirmedVersion === agreement.version
                    ? "text-success-strong flex items-center gap-1"
                    : "text-warning"
                }`}
              >
                {agreement.creatorConfirmedVersion === agreement.version ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed (V{agreement.creatorConfirmedVersion})
                  </>
                ) : (
                  "Pending"
                )}
              </span>
            </div>
          </div>

          {/* Entrepreneur Role Card */}
          <div className="bg-background border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Entrepreneur Role &amp; Duties
                  </h4>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {agreement.entrepreneurName || "Entrepreneur"}
                </span>
              </div>

              {/* Role Title */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Official Role Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={entrepreneurRole}
                    onChange={(e) => setEntrepreneurRole(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Chief Executive Officer (CEO)"
                  />
                ) : (
                  <div className="px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm font-semibold text-foreground">
                    {agreement.entrepreneurRole || "Chief Executive Officer (CEO)"}
                  </div>
                )}
              </div>

              {/* Time Commitment */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Time Commitment</label>
                {isEditing ? (
                  <select
                    value={entrepreneurTimeCommitment}
                    onChange={(e) => setEntrepreneurTimeCommitment(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Full-time (40 hours / week)">Full-time (40 hours / week)</option>
                    <option value="30 hours / week">30 hours / week (Executive)</option>
                    <option value="20 hours / week">20 hours / week (Part-time Lead)</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm text-foreground flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{agreement.entrepreneurTimeCommitment || "Full-time (40 hours / week)"}</span>
                  </div>
                )}
              </div>

              {/* Core Responsibilities */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  Core Responsibilities
                </label>
                <div className="space-y-1.5">
                  {(isEditing ? entrepreneurResponsibilities : agreement.entrepreneurResponsibilities || []).map(
                    (resp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground"
                      >
                        <span className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">•</span>
                          <span>{resp}</span>
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveEntResp(idx)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {isEditing && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newEntResp}
                        onChange={(e) => setNewEntResp(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEntResp())}
                        placeholder="Add responsibility..."
                        className="flex-1 px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={handleAddEntResp}
                        className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground border border-border flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation status pill */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Entrepreneur Confirmation:</span>
              <span
                className={`font-semibold ${
                  agreement.entrepreneurConfirmedVersion === agreement.version
                    ? "text-success-strong flex items-center gap-1"
                    : "text-warning"
                }`}
              >
                {agreement.entrepreneurConfirmedVersion === agreement.version ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed (V{agreement.entrepreneurConfirmedVersion})
                  </>
                ) : (
                  "Pending"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Editing or requesting changes will create Version {agreement.version + 1} and reset confirmations.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? "Saving..." : `Save & Propose V${agreement.version + 1}`}
                </button>
              </>
            ) : isFullyConfirmed ? (
              <button
                type="button"
                onClick={onProceedToCapTable}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Continue to Cap Table &amp; Equity Structure</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmedByMe || isSubmitting || isLoading}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isConfirmedByMe
                    ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                }`}
              >
                {isConfirmedByMe ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success-strong" />
                    <span>Version {agreement.version} Confirmed by You</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm Roles (Version {agreement.version})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Request Changes */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-destructive" />
                Request Changes on Roles &amp; Responsibilities
              </h4>
              <button
                onClick={() => setShowRequestChangesModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Provide feedback for the other founder. Submitting this will mark the agreement as{" "}
              <strong className="text-warning">CHANGES_REQUESTED</strong>, create Version {agreement.version + 1}, and
              reset confirmations.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Feedback / Change Notes</label>
              <textarea
                value={changeFeedback}
                onChange={(e) => setChangeFeedback(e.target.value)}
                rows={4}
                placeholder="e.g. I need you to commit at least 15 hours/week for architecture handover and milestone reviews..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowRequestChangesModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRequestChanges}
                disabled={!changeFeedback.trim() || isSubmitting}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-destructive hover:bg-destructive/90 text-primary-foreground transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Submit Change Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

