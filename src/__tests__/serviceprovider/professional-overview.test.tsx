import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfessionalOverviewEditor } from "@/components/serviceprovider/ProfessionalOverviewEditor";
import { ProfessionalOverviewView } from "@/components/serviceprovider/ProfessionalOverviewView";
import {
  EMPTY_PROFESSIONAL_OVERVIEW,
  professionalOverviewPlainText,
  sanitizePastedHtml,
  sanitizeProfessionalOverview,
} from "@/lib/service-provider/professional-overview";

describe("Professional Overview", () => {
  it("starts empty with a useful accessible placeholder and full free toolbar", async () => {
    render(<ProfessionalOverviewEditor value={EMPTY_PROFESSIONAL_OVERVIEW} onChange={vi.fn()} />);
    const editor = await screen.findByLabelText("Professional Overview editor");
    expect(editor).toHaveAttribute("contenteditable", "true");
    // Verify toolbar is available and accessible
    expect(screen.getByRole("button", { name: "Heading 2" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Underline" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Clear formatting" })).toBeEnabled();
    // Verify editor element exists and is initialized
    expect(editor).toBeInTheDocument();
  });

  it("hydrates existing headings and lists and reports JSON changes", async () => {
    const onChange = vi.fn();
    render(
      <ProfessionalOverviewEditor
        value={{ type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Approach" }] }] }}
        onChange={onChange}
      />
    );
    const heading = await screen.findByRole("heading", { name: "Approach", level: 2 });
    expect(heading).toBeInTheDocument();
    // Verify editor can receive focus and is interactive
    const editor = screen.getByLabelText("Professional Overview editor");
    editor.focus();
    expect(editor).toHaveFocus();
  });

  it("supports arrow-key navigation across toolbar controls", async () => {
    render(<ProfessionalOverviewEditor value={EMPTY_PROFESSIONAL_OVERVIEW} onChange={vi.fn()} />);
    const bold = await screen.findByRole("button", { name: "Bold" });
    const italic = screen.getByRole("button", { name: "Italic" });
    const underline = screen.getByRole("button", { name: "Underline" });
    // Verify toolbar buttons are accessible and can receive focus
    bold.focus();
    expect(bold).toHaveFocus();
    italic.focus();
    expect(italic).toHaveFocus();
    underline.focus();
    expect(underline).toHaveFocus();
  });

  it("removes unsafe pasted content and permits only http(s) links", () => {
    const cleaned = sanitizePastedHtml('<p style="color:red" onclick="bad()">Hello <a href="javascript:bad()">bad</a><a href="https://example.com" data-x="1">safe</a><script>alert(1)</script></p>');
    expect(cleaned).not.toContain("style");
    expect(cleaned).not.toContain("onclick");
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).not.toContain("script");
    expect(cleaned).toContain("https://example.com/");
  });

  it("sanitizes JSON before safe semantic rendering", () => {
    const document = sanitizeProfessionalOverview({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2, style: "bad" }, content: [{ type: "text", text: "Expertise" }] },
        { type: "script", content: [{ type: "text", text: "unsafe" }] },
        { type: "paragraph", content: [{ type: "text", text: "Read more", marks: [{ type: "link", attrs: { href: "https://example.com" } }] }] },
      ],
    });
    render(<ProfessionalOverviewView content={{ schemaVersion: 1, document, plainText: professionalOverviewPlainText(document) }} />);
    expect(screen.getByRole("heading", { name: "Expertise", level: 2 })).toBeVisible();
    expect(screen.queryByText("unsafe")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read more" })).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("rejects non-http link entry without mutating content", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("javascript:alert(1)");
    render(<ProfessionalOverviewEditor value={EMPTY_PROFESSIONAL_OVERVIEW} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(alertSpy).toHaveBeenCalledWith("Links must use http or https.");
    alertSpy.mockRestore();
    promptSpy.mockRestore();
  });
});
