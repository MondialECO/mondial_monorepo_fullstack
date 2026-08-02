import { afterEach, describe, expect, it, vi } from "vitest";
import { validateProviderImage } from "@/lib/service-provider/provider-media";

afterEach(() => vi.unstubAllGlobals());

describe("provider image client validation", () => {
  it("accepts matching PNG content after browser decode", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 800, height: 800, close: vi.fn() }));
    const result = await validateProviderImage(file(pngBytes(), "portrait.png", "image/png"), "profile");
    expect(result).toEqual({ width: 800, height: 800 });
  });

  it("rejects unsupported declared types, oversized files and signature mismatches", async () => {
    await expect(validateProviderImage(file(new Uint8Array([1]), "avatar.svg", "image/svg+xml"), "profile")).rejects.toThrow(/JPEG, PNG or WebP/);
    await expect(validateProviderImage(file(new Uint8Array(5 * 1024 * 1024 + 1), "avatar.png", "image/png"), "profile")).rejects.toThrow(/5 MB or smaller/);
    await expect(validateProviderImage(file(new Uint8Array([1, 2, 3]), "avatar.png", "image/png"), "profile")).rejects.toThrow(/does not match/);
  });

  it("rejects animated PNG payloads before preview", async () => {
    const animated = new Uint8Array([...pngBytes(), ...[..."acTL"].map((value) => value.charCodeAt(0))]);
    await expect(validateProviderImage(file(animated, "animated.png", "image/png"), "cover")).rejects.toThrow(/Animated images/);
  });
});

function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function file(bytes: Uint8Array, name: string, type: string) {
  return new File([bytes], name, { type });
}
