'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload, Loader } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  SpCard,
  SpMutationFeedback,
} from '@/components/serviceprovider/ui';
import type { ServiceListing, GalleryImage, PreviewVideo } from '@/types/service-catalog';
import { useUpdateListing } from '@/hooks/queries/service-catalog';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';
import {
  uploadListingGalleryImage as apiUploadGalleryImage,
  deleteListingGalleryImage as apiDeleteGalleryImage,
  uploadListingPreviewVideo as apiUploadPreviewVideo,
  deleteListingPreviewVideo as apiDeletePreviewVideo,
} from '@/lib/api-service-provider';

const MAX_VIDEO_DURATION_SECONDS = 60;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_GALLERY_IMAGES = 20;

export function WizardStep5Gallery({
  listing,
  onListingUpdate,
  onNext,
  onBack,
}: {
  listing: ServiceListing;
  onListingUpdate: (updated: ServiceListing) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const updateListing = useUpdateListing();
  const [previewVideo, setPreviewVideo] = useState<PreviewVideo | null>(listing.previewVideo ?? null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(listing.galleryImages ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = async (file: File) => {
    if (file.size > MAX_VIDEO_BYTES) {
      setError(`Video must be smaller than 50 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const video = await apiUploadPreviewVideo(listing.id, file);
      setPreviewVideo(video as PreviewVideo);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (file: File) => {
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      setError(`Gallery is limited to ${MAX_GALLERY_IMAGES} images.`);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image must be smaller than 8 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const image = await apiUploadGalleryImage(listing.id, file);
      setGalleryImages([...galleryImages, image as GalleryImage]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const deleteGalleryImage = async (id: string) => {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await apiDeleteGalleryImage(listing.id, id);
      setGalleryImages(updated.galleryImages ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete image.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVideo = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await apiDeletePreviewVideo(listing.id);
      setPreviewVideo(updated.previewVideo ?? null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete video.');
    } finally {
      setIsSaving(false);
    }
  };

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= galleryImages.length) return;
    setGalleryImages((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      // Update displayOrder
      updated.forEach((img, i) => {
        img.displayOrder = i;
      });
      return updated;
    });
  };

  const handleNext = async () => {
    onListingUpdate({
      ...listing,
      previewVideo,
      galleryImages,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <SpCard className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">Preview Video</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Add an optional video showcasing your service.
          </p>
        </div>

        {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}

        <div className="rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-8 text-center">
          {isUploading ? (
            <>
              <Loader className="mx-auto size-8 animate-spin text-[#3C61DD]" aria-hidden="true" />
              <p className="mt-2 font-medium text-[#171717]">Uploading video…</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto size-8 text-[#9CA3AF]" aria-hidden="true" />
              <p className="mt-2 font-medium text-[#171717]">Drag and drop your video here</p>
              <p className="mt-1 text-sm text-[#6B7280]">or click to browse</p>
              <p className="mt-2 text-xs text-[#9CA3AF]">Max 60 seconds, 50 MB</p>
            </>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) handleVideoUpload(file);
            }}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={isUploading}
          >
            Select Video
          </Button>
        </div>

        {previewVideo && (
          <div className="rounded-lg border border-[#E5E7EB] p-4 space-y-4">
            <div className="relative bg-[#000000] rounded-lg overflow-hidden">
              <video
                src={resolveProviderMediaUrl(previewVideo.publicUrl)!}
                controls
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#171717]">Video uploaded</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {Math.floor(previewVideo.durationSeconds)} seconds • {(previewVideo.bytes / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deleteVideo}
                disabled={isSaving}
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </SpCard>

      <SpCard className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">Portfolio Images</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Showcase your best work with a gallery of project images. Drag to reorder.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((image, index) => (
            <div key={image.id} className="relative overflow-hidden rounded-lg border border-[#E5E7EB]">
              <div className="relative aspect-square bg-[#F9FAFB]">
                <Image
                  src={resolveProviderMediaUrl(image.publicUrl)!}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveGalleryImage(index, -1)}
                  disabled={index === 0 || isSaving}
                  title="Move left"
                >
                  ←
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveGalleryImage(index, 1)}
                  disabled={index === galleryImages.length - 1 || isSaving}
                  title="Move right"
                >
                  →
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteGalleryImage(image.id)}
                  title="Delete"
                  disabled={isSaving}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}

          {galleryImages.length < MAX_GALLERY_IMAGES && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-4 hover:border-[#3C61DD] disabled:opacity-50"
            >
              {isUploading ? (
                <Loader className="size-8 animate-spin text-[#3C61DD]" aria-hidden="true" />
              ) : (
                <>
                  <Plus className="size-8 text-[#9CA3AF]" aria-hidden="true" />
                  <span className="mt-2 text-sm text-[#6B7280]">Add image</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) handleImageUpload(file);
          }}
          className="hidden"
        />

        {galleryImages.length > 0 && (
          <p className="text-xs text-[#6B7280]">
            {galleryImages.length} / {MAX_GALLERY_IMAGES} images
          </p>
        )}
      </SpCard>

      <SpCard>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack} variant="outline" disabled={isSaving || isUploading}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={isSaving || isUploading}>
            {isSaving || isUploading ? 'Saving…' : 'Next: Review & Publish'}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </SpCard>
    </div>
  );
}
