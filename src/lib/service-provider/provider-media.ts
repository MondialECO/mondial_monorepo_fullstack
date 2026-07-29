import { API_ORIGIN } from "@/lib/api-config";

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ProviderImageKind = "profile" | "cover" | "portfolio";

export const PROVIDER_IMAGE_RULES = {
  profile: { maxBytes: 5 * 1024 * 1024, width: 800, height: 800, recommendation: "400 × 400 or larger" },
  cover: { maxBytes: 8 * 1024 * 1024, width: 1600, height: 540, recommendation: "1600 × 540 recommended" },
  portfolio: { maxBytes: 8 * 1024 * 1024, width: 1200, height: 750, recommendation: "1200 px wide recommended" },
} as const;

export function resolveProviderMediaUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`;
}

export async function validateProviderImage(file: File, kind: ProviderImageKind) {
  const rule = PROVIDER_IMAGE_RULES[kind];
  if (file.size <= 0) throw new Error("Choose a non-empty image.");
  if (file.size > rule.maxBytes) throw new Error(`Image must be ${rule.maxBytes / 1024 / 1024} MB or smaller.`);
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number]))
    throw new Error("Use a JPEG, PNG or WebP image. SVG and animated images are not supported.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (detected !== file.type) throw new Error("The selected file content does not match its image type.");
  if (isAnimated(bytes, detected)) throw new Error("Animated images are not supported.");

  const dimensions = await decodeDimensions(file);
  if (dimensions.width <= 0 || dimensions.height <= 0) throw new Error("The image could not be decoded.");
  return dimensions;
}

function detectImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((value, index) => bytes[index] === value)) return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  return null;
}

function isAnimated(bytes: Uint8Array, type: string | null) {
  if (type === "image/png") return findAscii(bytes, "acTL");
  if (type === "image/webp") return findAscii(bytes, "ANIM") || findAscii(bytes, "ANMF");
  return false;
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function findAscii(bytes: Uint8Array, value: string) {
  const needle = [...value].map((character) => character.charCodeAt(0));
  outer: for (let index = 0; index <= bytes.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (bytes[index + offset] !== needle[offset]) continue outer;
    }
    return true;
  }
  return false;
}

async function decodeDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const result = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      reject(new Error("The image could not be decoded."));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export async function cropProviderImage(
  file: File,
  kind: ProviderImageKind,
  positionX: number,
  positionY: number,
  zoom: number
) {
  const source = await loadImage(file);
  const { width: targetWidth, height: targetHeight } = PROVIDER_IMAGE_RULES[kind];
  const targetAspect = targetWidth / targetHeight;
  const sourceAspect = source.naturalWidth / source.naturalHeight;
  let cropWidth = source.naturalWidth;
  let cropHeight = source.naturalHeight;
  if (sourceAspect > targetAspect) cropWidth = cropHeight * targetAspect;
  else cropHeight = cropWidth / targetAspect;
  cropWidth /= zoom;
  cropHeight /= zoom;
  const sourceX = (source.naturalWidth - cropWidth) * (positionX / 100);
  const sourceY = (source.naturalHeight - cropHeight) * (positionY / 100);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The crop preview is unavailable in this browser.");
  context.drawImage(source, sourceX, sourceY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
  const contentType = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("The cropped image could not be prepared.")), contentType, 0.9)
  );
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return new File([blob], `provider-image.${extension}`, { type: contentType, lastModified: Date.now() });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The image could not be decoded."));
    };
    image.src = url;
  });
}
