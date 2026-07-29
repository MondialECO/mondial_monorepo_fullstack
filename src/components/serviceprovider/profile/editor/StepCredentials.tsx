"use client";

import { useRef, useState } from "react";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SpCard,
  SpEmptyState,
  SpFormField,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
} from "@/components/serviceprovider/ui";
import {
  useDeleteCredential,
  useUploadCredentialDocument,
  useUpsertCredential,
} from "@/hooks/queries/service-provider";
import { CREDENTIAL_FILE, EDITOR_LIMITS } from "@/lib/service-provider/profile-editor";
import { focusElementId } from "@/lib/service-provider/profile-navigation";
import {
  CREDENTIAL_KINDS,
  CREDENTIAL_STATUS_LABELS,
  type CredentialKind,
  type CredentialStatus,
  type ProviderCredential,
} from "@/types/service-provider";

const STATUS_TONE: Record<CredentialStatus, "neutral" | "positive" | "warning" | "negative"> = {
  Draft: "neutral",
  PendingReview: "warning",
  Verified: "positive",
  Rejected: "negative",
  ResubmissionRequired: "warning",
  Expired: "negative",
};

const readableKind = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

function formatBytes(bytes?: number | null) {
  if (!bytes) return null;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileError(file: File) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!CREDENTIAL_FILE.extensions.includes(extension as (typeof CREDENTIAL_FILE.extensions)[number])) {
    return "Use a PDF, PNG or JPG file.";
  }
  if (file.size > CREDENTIAL_FILE.maxBytes) {
    return `The document must be ${CREDENTIAL_FILE.maxBytes / 1024 / 1024} MB or smaller.`;
  }
  return null;
}

/**
 * Step 4 — credentials. These are independent records: each save persists
 * immediately and survives a failed profile submit, so nothing here lives in the
 * editor draft. Status is server-controlled — an upload can never reach Verified
 * and never assigns a tier.
 */
export function StepCredentials({ credentials }: { credentials: ProviderCredential[] }) {
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProviderCredential | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const upsert = useUpsertCredential();
  const upload = useUploadCredentialDocument();
  const remove = useDeleteCredential();

  async function addCredential() {
    setFeedback(null);
    try {
      await upsert.mutateAsync({ kind: "Certification", title: "New credential" });
      setFeedback({ status: "success", message: "Credential added. Add its details and document." });
    } catch {
      setFeedback({ status: "error", message: "The credential could not be added. Try again." });
    }
  }

  async function saveCredential(credential: ProviderCredential, patch: Partial<ProviderCredential>) {
    setFeedback(null);
    try {
      await upsert.mutateAsync({
        id: credential.id,
        kind: (patch.kind ?? credential.kind) as CredentialKind,
        title: patch.title ?? credential.title,
        issuingOrganization: patch.issuingOrganization ?? credential.issuingOrganization,
        issuedAt: patch.issuedAt ?? credential.issuedAt,
        expiresAt: patch.expiresAt ?? credential.expiresAt,
        credentialNumber: patch.credentialNumber ?? credential.credentialNumber,
      });
    } catch {
      setFeedback({ status: "error", message: "The credential could not be saved. Try again." });
    }
  }

  async function uploadDocument(credential: ProviderCredential, file?: File) {
    if (!file) return;
    setFeedback(null);

    const invalid = fileError(file);
    if (invalid) {
      setFeedback({ status: "error", message: invalid });
      return;
    }

    setUploadingId(credential.id);
    setProgress(0);
    try {
      await upload.mutateAsync({ credentialId: credential.id, file, onProgress: setProgress });
      setFeedback({ status: "success", message: "Document uploaded. It will be reviewed after you submit." });
    } catch {
      // A failed replacement leaves the previous document in place server-side.
      setFeedback({
        status: "error",
        message: "The document could not be uploaded. Your previous document is unchanged.",
      });
    } finally {
      setUploadingId(null);
      setProgress(null);
      const input = fileInputs.current[credential.id];
      if (input) input.value = "";
    }
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    setFeedback(null);
    try {
      await remove.mutateAsync(pendingDelete.id);
      setFeedback({ status: "success", message: "Credential removed." });
    } catch {
      setFeedback({ status: "error", message: "The credential could not be removed." });
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <SpCard id={focusElementId("credentials")} tabIndex={-1} className="scroll-mt-24 outline-none">
        <SpSectionHeader
          title="Certification & license upload"
          description="Provide copies of relevant certifications or degrees."
        />

        <p className="mt-4 text-xs leading-5 text-[#6B7280]" role="status">
          Basic file validation is active. Production security scanning is not yet enabled.
        </p>
        <p className="mt-1 text-xs leading-5 text-[#6B7280]">
          Credentials are reviewed by Mondial.eco after you submit. Uploading a document does not
          verify it and does not change your tier.
        </p>

        <div className="mt-6 space-y-4" aria-live="polite">
          {feedback && (
            <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>
          )}

          {credentials.length === 0 && (
            <SpEmptyState
              icon={FileText}
              title="No credentials added"
              description="Add a certification, license or degree to strengthen your profile."
            />
          )}

          {credentials.map((credential, index) => (
            <fieldset key={credential.id} className="rounded-xl border border-[#E5E7EB] p-4">
              <legend className="px-1 text-sm font-semibold text-[#171717]">
                {credential.title.trim() || `Credential ${index + 1}`}
              </legend>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <SpStatusBadge tone={STATUS_TONE[credential.status]}>
                  {CREDENTIAL_STATUS_LABELS[credential.status]}
                </SpStatusBadge>
                {credential.reviewNote && (
                  <span className="text-xs text-[#B42318]">{credential.reviewNote}</span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SpFormField id={`credential-${credential.id}-kind`} label="Credential type">
                  <Select
                    value={credential.kind}
                    onValueChange={(value) =>
                      saveCredential(credential, { kind: value as CredentialKind })
                    }
                  >
                    <SelectTrigger aria-label={`Credential type for ${credential.title || `credential ${index + 1}`}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_KINDS.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {readableKind(kind)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SpFormField>

                <SpFormField id={`credential-${credential.id}-title`} label="Title" required>
                  <Input
                    maxLength={EDITOR_LIMITS.credentialTitle}
                    defaultValue={credential.title}
                    onBlur={(event) => saveCredential(credential, { title: event.target.value })}
                    placeholder="e.g. UX Certification 2025"
                  />
                </SpFormField>

                <SpFormField id={`credential-${credential.id}-issuer`} label="Issuing organisation">
                  <Input
                    maxLength={EDITOR_LIMITS.issuer}
                    defaultValue={credential.issuingOrganization ?? ""}
                    onBlur={(event) =>
                      saveCredential(credential, { issuingOrganization: event.target.value })
                    }
                    placeholder="e.g. Nielsen Norman Group"
                  />
                </SpFormField>

                <SpFormField
                  id={`credential-${credential.id}-number`}
                  label="Credential number"
                  description="Only visible to you and reviewers."
                >
                  <Input
                    maxLength={EDITOR_LIMITS.credentialNumber}
                    defaultValue={credential.credentialNumber ?? ""}
                    onBlur={(event) =>
                      saveCredential(credential, { credentialNumber: event.target.value })
                    }
                  />
                </SpFormField>

                <SpFormField id={`credential-${credential.id}-issuedAt`} label="Issue date">
                  <Input
                    type="date"
                    defaultValue={credential.issuedAt?.slice(0, 10) ?? ""}
                    onBlur={(event) =>
                      saveCredential(credential, { issuedAt: event.target.value || null })
                    }
                  />
                </SpFormField>

                <SpFormField
                  id={`credential-${credential.id}-expiresAt`}
                  label="Expiry date"
                  description="Leave blank if it does not expire."
                >
                  <Input
                    type="date"
                    defaultValue={credential.expiresAt?.slice(0, 10) ?? ""}
                    onBlur={(event) =>
                      saveCredential(credential, { expiresAt: event.target.value || null })
                    }
                  />
                </SpFormField>
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] p-4">
                {credential.documentUrl ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-[#374151]">
                      <FileText className="size-4 shrink-0 text-[#6B7280]" aria-hidden="true" />
                      <span className="truncate">{credential.documentFileName ?? "Uploaded document"}</span>
                      {formatBytes(credential.documentBytes) && (
                        <span className="shrink-0 text-xs text-[#6B7280]">
                          {formatBytes(credential.documentBytes)}
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">No document uploaded yet.</p>
                )}

                <p className="mt-2 text-xs text-[#6B7280]">{CREDENTIAL_FILE.acceptLabel}</p>

                <input
                  ref={(element) => {
                    fileInputs.current[credential.id] = element;
                  }}
                  id={`credential-${credential.id}-file`}
                  type="file"
                  className="sr-only"
                  accept={CREDENTIAL_FILE.accept}
                  aria-label={`Upload document for ${credential.title || `credential ${index + 1}`}`}
                  onChange={(event) => uploadDocument(credential, event.target.files?.[0])}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={uploadingId === credential.id}
                    onClick={() => fileInputs.current[credential.id]?.click()}
                  >
                    <Upload className="size-4" aria-hidden="true" />
                    {credential.documentUrl ? "Replace document" : "Upload document"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 text-[#B42318]"
                    onClick={() => setPendingDelete(credential)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                    <span className="sr-only">{` ${credential.title || `credential ${index + 1}`}`}</span>
                  </Button>
                </div>

                {uploadingId === credential.id && progress !== null && (
                  <div role="status" aria-live="polite" className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-[#4B5563]">
                      <span>Uploading</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} aria-label={`Document upload ${progress} percent`} />
                  </div>
                )}
              </div>
            </fieldset>
          ))}

          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={credentials.length >= EDITOR_LIMITS.credentials || upsert.isPending}
            onClick={addCredential}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add credential
          </Button>
        </div>
      </SpCard>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {pendingDelete?.title || "this credential"}?</DialogTitle>
            <DialogDescription>
              The credential and its uploaded document are permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending}
              onClick={confirmRemove}
            >
              {remove.isPending ? "Removing…" : "Remove credential"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
