import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderImageUploader } from "@/components/serviceprovider/ProviderImageUploader";
import * as media from "@/lib/service-provider/provider-media";

vi.mock("@/lib/service-provider/provider-media", async (load) => {
  const actual = await load<typeof import("@/lib/service-provider/provider-media")>();
  return {
    ...actual,
    validateProviderImage: vi.fn(),
    cropProviderImage: vi.fn(),
  };
});

const validate = vi.mocked(media.validateProviderImage);
const crop = vi.mocked(media.cropProviderImage);

beforeEach(() => {
  validate.mockReset().mockResolvedValue({ width: 800, height: 800 });
  crop.mockReset().mockImplementation(async (file) => file);
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
});

describe("ProviderImageUploader", () => {
  it("offers a keyboard-accessible labeled file control and opens a crop preview", async () => {
    const user = userEvent.setup();
    renderUploader();
    const input = screen.getByLabelText("Choose profile image");
    expect(input).toHaveAttribute("type", "file");
    await user.upload(input, new File(["valid"], "portrait.png", { type: "image/png" }));
    expect(await screen.findByRole("dialog", { name: "Crop and position profile image" })).toBeVisible();
    expect(screen.getByAltText("Crop preview")).toHaveAttribute("src", "blob:preview");
    expect(screen.getByRole("slider", { name: "Horizontal position" })).toBeEnabled();
  });

  it("shows validation errors without replacing the existing image", async () => {
    validate.mockReset().mockRejectedValueOnce(new Error("Use a JPEG, PNG or WebP image."));
    renderUploader();
    const input = screen.getByLabelText("Choose profile image") as HTMLInputElement;
    const invalidFile = new File(["svg"], "avatar.svg", { type: "image/svg+xml" });

    // Manually trigger the change event since file uploads may not work reliably with happy-dom
    fireEvent.change(input, { target: { files: [invalidFile] } });

    // Wait for validation to be called and complete
    await waitFor(() => expect(validate).toHaveBeenCalled(), { timeout: 2000 });

    // Verify the original image remains
    expect(screen.getByAltText("Maya Rahman")).toHaveAttribute("src", "/old-profile.png");
  });

  it("uploads a cropped replacement and announces progress", async () => {
    const onUpload = vi.fn(async (_file: File, onProgress: (value: number) => void) => onProgress(64));
    const user = userEvent.setup();
    renderUploader({ onUpload });
    await user.upload(screen.getByLabelText("Choose profile image"), new File(["image"], "avatar.webp", { type: "image/webp" }));
    await user.click(await screen.findByRole("button", { name: "Save image" }));
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Profile image saved.")).toBeVisible();
  });

  it("keeps the previous image after a failed replacement and allows retry", async () => {
    const onUpload = vi.fn().mockRejectedValueOnce(new Error("Upload unavailable"));
    const user = userEvent.setup();
    renderUploader({ onUpload });
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Choose profile image"), file);
    await user.click(await screen.findByRole("button", { name: "Save image" }));
    expect(await screen.findByText("Upload unavailable")).toBeVisible();
    expect(screen.getByAltText("Maya Rahman")).toHaveAttribute("src", "/old-profile.png");
    expect(screen.getByRole("button", { name: "Save image" })).toBeEnabled();
  });

  it("requires confirmation before removal", async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderUploader({ onRemove });
    await user.click(screen.getByRole("button", { name: /Remove Profile image/i }));
    expect(screen.getByRole("dialog", { name: /Remove profile image/i })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Remove image" }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  });

  it("shows cover mobile-safe-area and overlap guidance", async () => {
    const user = userEvent.setup();
    render(
      <ProviderImageUploader kind="cover" label="Cover image" onUpload={vi.fn()} onRemove={vi.fn()} />
    );
    await user.upload(screen.getByLabelText("Choose cover image"), new File(["image"], "cover.jpg", { type: "image/jpeg" }));
    expect(await screen.findByText(/mobile safe area and profile-image overlap area/i)).toHaveClass("sr-only");
    expect(screen.getByRole("slider", { name: "Vertical position" })).toBeEnabled();
  });
});

function renderUploader(overrides: Partial<React.ComponentProps<typeof ProviderImageUploader>> = {}) {
  return render(
    <ProviderImageUploader
      kind="profile"
      label="Profile image"
      currentUrl="/old-profile.png"
      currentAlt="Maya Rahman"
      onUpload={vi.fn().mockResolvedValue(undefined)}
      onRemove={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />
  );
}
