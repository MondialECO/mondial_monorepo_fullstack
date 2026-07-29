import { describe, expect, it } from "vitest";
import {
  editorHref,
  focusElementId,
  isValidFocus,
  legacyProfileRedirect,
  normalizeStep,
  PROFILE_EDITOR_ROUTE,
  PROFILE_VIEW_ROUTE,
  SECTION_EDIT_HREF,
} from "@/lib/service-provider/profile-navigation";

describe("service provider profile navigation", () => {
  it("keeps Profile View and the editor on separate routes", () => {
    expect(PROFILE_VIEW_ROUTE).toBe("/dashboard/serviceprovider/profile");
    expect(PROFILE_EDITOR_ROUTE).toBe("/dashboard/serviceprovider/profile/edit");
    expect(PROFILE_EDITOR_ROUTE.startsWith(PROFILE_VIEW_ROUTE)).toBe(true);
  });

  it("normalises every invalid step to a usable step", () => {
    expect(normalizeStep("1")).toBe(1);
    expect(normalizeStep("4")).toBe(4);
    expect(normalizeStep("0")).toBe(1);
    expect(normalizeStep("9")).toBe(4);
    expect(normalizeStep("banana")).toBe(1);
    expect(normalizeStep(null)).toBe(1);
    expect(normalizeStep(undefined)).toBe(1);
  });

  it("routes each section edit action to the step that owns the field", () => {
    expect(SECTION_EDIT_HREF.profile()).toContain("step=1");
    expect(SECTION_EDIT_HREF.media()).toContain("step=1");
    expect(SECTION_EDIT_HREF.media()).toContain("focus=media");
    expect(SECTION_EDIT_HREF.about()).toContain("focus=overview");
    expect(SECTION_EDIT_HREF.about()).toContain("step=1");
    expect(SECTION_EDIT_HREF.experience()).toContain("step=2");
    expect(SECTION_EDIT_HREF.education()).toContain("step=2");
    expect(SECTION_EDIT_HREF.skills()).toContain("step=3");
    expect(SECTION_EDIT_HREF.languages()).toContain("step=3");
    expect(SECTION_EDIT_HREF.credentials()).toContain("step=4");
  });

  it("keeps portfolio and services on their existing managers, not in the wizard", () => {
    expect(SECTION_EDIT_HREF.portfolio()).not.toContain("/profile/edit");
    expect(SECTION_EDIT_HREF.services()).toBe("/dashboard/serviceprovider/services");
  });

  it("normalises the legacy inline-edit link to the new editor", () => {
    expect(legacyProfileRedirect("edit")).toBe(editorHref({ step: 1 }));
    // The trust view is still a read-only section of the profile page.
    expect(legacyProfileRedirect("trust")).toBeNull();
    expect(legacyProfileRedirect(null)).toBeNull();
  });

  it("builds a distinct result state", () => {
    expect(editorHref({ result: true })).toContain("state=result");
    expect(editorHref({ result: true })).not.toContain("step=");
  });

  it("exposes stable focus element ids", () => {
    expect(isValidFocus("overview")).toBe(true);
    expect(isValidFocus("nonsense")).toBe(false);
    expect(focusElementId("overview")).toBe("sp-editor-focus-overview");
  });
});
