"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { SpMutationFeedback } from "@/components/serviceprovider/ui";
import {
  cropProviderImage,
  PROVIDER_IMAGE_RULES,
  type ProviderImageKind,
  validateProviderImage,
} from "@/lib/service-provider/provider-media";
import { cn } from "@/lib/utils";

type Props = {
  kind: ProviderImageKind;
  label: string;
  currentUrl?: string;
  currentAlt?: string;
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  onRemove: () => Promise<void>;
  className?: string;
  compact?: boolean;
  successMessage?: string;
};

export function ProviderImageUploader({
  kind,
  label,
  currentUrl,
  currentAlt = "",
  onUpload,
  onRemove,
  className,
  compact,
  successMessage,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function selectFile(file?: File) {
    if (!file) return;
    setError(null);
    setSuccess(null);
    setValidating(true);
    try {
      await validateProviderImage(file, kind);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPositionX(50);
      setPositionY(50);
      setZoom(1);
    } catch (reason) {
      setSelectedFile(null);
      setError(reason instanceof Error ? reason.message : "The image could not be validated.");
    } finally {
      setValidating(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function closeCrop() {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setProgress(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  async function saveCrop() {
    if (!selectedFile) return;
    setError(null);
    setProgress(0);
    try {
      const cropped = await cropProviderImage(selectedFile, kind, positionX, positionY, zoom);
      await onUpload(cropped, setProgress);
      setProgress(100);
      setSuccess(successMessage ?? `${label} saved.`);
      closeCrop();
    } catch (reason) {
      setError(uploadErrorMessage(reason, `${label} could not be saved. Your previous image is unchanged.`));
      setProgress(null);
    }
  }

  async function confirmRemove() {
    setRemoving(true);
    setError(null);
    setSuccess(null);
    try {
      await onRemove();
      setRemoveOpen(false);
      setSuccess(`${label} removed.`);
      requestAnimationFrame(() => triggerRef.current?.focus());
    } catch (reason) {
      setError(uploadErrorMessage(reason, `${label} could not be removed. Your current image is unchanged.`));
      setRemoveOpen(false);
    } finally {
      setRemoving(false);
    }
  }

  const rule = PROVIDER_IMAGE_RULES[kind];
  const isProfile = kind === "profile";
  const isCover = kind === "cover";
  const previewClass = isProfile ? "aspect-square rounded-full" : isCover ? "aspect-[3/1] rounded-xl" : "aspect-[16/10] rounded-xl";

  return (
    <div className={cn("space-y-3", className)}>
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-[#171717]">{label}</p>
          <p className="mt-1 text-xs leading-5 text-[#6B7280]">
            JPEG, PNG or WebP · up to {rule.maxBytes / 1024 / 1024} MB · {rule.recommendation}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]" role="status">
            Basic file validation is active. Production security scanning is not yet enabled.
          </p>
        </div>
      )}
      <div className={cn("flex items-center gap-4", isCover && !compact && "items-end")}>
        {!compact && (
          <div className={cn("relative overflow-hidden border border-[#E5E7EB] bg-[#F4F5F7]", previewClass, isProfile ? "size-24 shrink-0" : "w-40 max-w-[44vw]")}>
            {currentUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUrl} alt={currentAlt} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[#9CA3AF]">
                {isProfile ? <Camera className="size-6" aria-hidden="true" /> : <ImagePlus className="size-7" aria-hidden="true" />}
                <span className="sr-only">No {label.toLowerCase()} set</span>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            aria-label={`Choose ${label.toLowerCase()}`}
            aria-describedby={`${inputId}-error`}
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => inputRef.current?.click()}
            disabled={validating}
          >
            {validating ? <RefreshCw className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {currentUrl ? "Replace" : "Upload"} <span className="sr-only">{label}</span>
          </Button>
          {currentUrl && (
            <Button type="button" variant="outline" className="min-h-11 text-[#B42318]" onClick={() => setRemoveOpen(true)}>
              <Trash2 className="size-4" />Remove <span className="sr-only">{label}</span>
            </Button>
          )}
        </div>
      </div>

      <div id={`${inputId}-error`} aria-live="polite">
        {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}
        {success && <SpMutationFeedback status="success">{success}</SpMutationFeedback>}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && progress === null && closeCrop()}>
        <DialogContent className="max-h-[94vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop and position {label.toLowerCase()}</DialogTitle>
            <DialogDescription>
              The saved image is re-encoded after cropping. Use the sliders or arrow keys to position it.
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="space-y-5">
              <div className={cn("relative mx-auto w-full max-w-2xl overflow-hidden border border-[#D1D5DB] bg-[#F4F5F7]", previewClass)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Crop preview"
                  className="size-full object-cover"
                  style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})` }}
                />
                {isCover && (
                  <>
                    <div className="pointer-events-none absolute inset-x-[12%] inset-y-[18%] rounded border border-dashed border-white/90" aria-hidden="true" />
                    <div className="pointer-events-none absolute bottom-0 left-[7%] size-[24%] max-h-[78%] rounded-full border-2 border-dashed border-white/90 bg-black/10" aria-hidden="true" />
                    <span className="sr-only">Dashed guides indicate the mobile safe area and profile-image overlap area.</span>
                  </>
                )}
              </div>
              {isCover && <p className="text-xs text-[#6B7280]">Keep important details inside the central safe area and away from the avatar overlap guide.</p>}
              <div className="grid gap-4 sm:grid-cols-3">
                <RangeControl label="Horizontal position" value={positionX} onChange={setPositionX} />
                <RangeControl label="Vertical position" value={positionY} onChange={setPositionY} />
                <RangeControl label="Zoom" value={Math.round(zoom * 100)} min={100} max={200} onChange={(value) => setZoom(value / 100)} suffix="%" />
              </div>
              {progress !== null && (
                <div role="status" aria-live="polite">
                  <div className="mb-2 flex justify-between text-sm text-[#4B5563]"><span>Uploading</span><span>{progress}%</span></div>
                  <Progress value={progress} aria-label={`${label} upload ${progress} percent`} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeCrop} disabled={progress !== null}>Cancel</Button>
            <Button type="button" onClick={saveCrop} disabled={progress !== null}>Save image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {label.toLowerCase()}?</DialogTitle>
            <DialogDescription>The current image remains visible unless removal succeeds.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveOpen(false)} disabled={removing}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmRemove} disabled={removing}>{removing ? "Removing…" : "Remove image"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function uploadErrorMessage(error: unknown, fallback: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? (error instanceof Error ? error.message : fallback);
}

function RangeControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  return (
    <div className="block text-sm font-medium text-[#374151]">
      <div className="flex justify-between gap-2">
        <span id={labelId}>{label}</span>
        <span id={valueId} aria-live="polite">{value}{suffix}</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 h-11 w-full accent-[#3C61DD]" aria-labelledby={labelId} />
    </div>
  );
}
