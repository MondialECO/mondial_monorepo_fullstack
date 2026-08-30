import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { menu } from "@/lib/menu";
import { getAllMenuHrefs } from "@/lib/menu-navigation";
import { readOnboardingPhase } from "@/lib/auth-contract";
import {
  parseStrictUserRole,
  resolvePrimaryRole,
  ROLE_DASHBOARD_ROUTES,
  UserRole,
} from "@/lib/roles";

function appRoutes(): Set<string> {
  const appRoot = path.join(process.cwd(), "src", "app");
  const pageFiles: string[] = [];

  function visit(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      if (entry.isFile() && entry.name === "page.tsx") pageFiles.push(absolute);
    }
  }

  visit(appRoot);

  return new Set(
    pageFiles.map((file) => {
      const relative = path.relative(appRoot, path.dirname(file)).replaceAll("\\", "/");
      const route = relative
        .split("/")
        .filter((segment) => segment && !(segment.startsWith("(") && segment.endsWith(")")))
        .join("/");
      return route ? `/${route}` : "/";
    })
  );
}

const routes = appRoutes();

function expectRoute(route: string) {
  expect(routes.has(route), `${route} must have a page.tsx in the canonical src/app tree`).toBe(true);
}

describe("authenticated dashboard route contract", () => {
  it("AuthenticatedCreator_CanNavigateNestedPage", () => {
    expectRoute("/dashboard/creator");
    expectRoute("/dashboard/creator/profile");
    expectRoute("/dashboard/creator/messages");
    expectRoute("/dashboard/creator/notifications");
    expectRoute("/dashboard/creator/project-studio");
    expectRoute("/dashboard/creator/phase-1");
  });

  it("AuthenticatedEntrepreneur_CanNavigateNestedPage", () => {
    expectRoute("/dashboard/entrepreneur");
    expectRoute("/dashboard/entrepreneur/companies");
    expectRoute("/dashboard/entrepreneur/messages");
    expectRoute("/dashboard/entrepreneur/deals");
    expectRoute("/dashboard/entrepreneur/phase-1");
  });

  it("AuthenticatedInvestor_CanNavigateNestedPage", () => {
    expectRoute("/dashboard/investor");
    expectRoute("/dashboard/investor/discovery");
    expectRoute("/dashboard/investor/incoming-matches");
    expectRoute("/dashboard/investor/pipeline");
    expectRoute("/dashboard/investor/messages");
  });

  it("AuthenticatedServiceProvider_CanNavigateNestedPage", () => {
    expectRoute("/dashboard/serviceprovider");
    expectRoute("/dashboard/serviceprovider/profile");
    expectRoute("/dashboard/serviceprovider/leads");
    expectRoute("/dashboard/serviceprovider/workroom");
    expectRoute("/dashboard/serviceprovider/messages");
  });

  it("OnboardingPhase1_DoesNotRedirectToNonexistentRoute", () => {
    expect(readOnboardingPhase({ onboarding: { phase: 1 } })).toBe(1);
    expect(readOnboardingPhase({ Onboarding: { phase: 1 } })).toBe(1);

    for (const role of [
      UserRole.CREATOR,
      UserRole.ENTREPRENEUR,
      UserRole.INVESTOR,
      UserRole.SERVICE_PROVIDER,
    ]) {
      expectRoute(ROLE_DASHBOARD_ROUTES[role]);
    }
    expectRoute("/onboarding");
  });

  it("RoleNormalization_UsesCanonicalRouteSegment", () => {
    expect(parseStrictUserRole("Creator")).toBe(UserRole.CREATOR);
    expect(parseStrictUserRole("creator")).toBe(UserRole.CREATOR);
    expect(parseStrictUserRole("Service Provider")).toBe(UserRole.SERVICE_PROVIDER);
    expect(parseStrictUserRole("service-provider")).toBe(UserRole.SERVICE_PROVIDER);
    expect(parseStrictUserRole("service_provider")).toBe(UserRole.SERVICE_PROVIDER);
    expect(ROLE_DASHBOARD_ROUTES[UserRole.SERVICE_PROVIDER]).toBe(
      "/dashboard/serviceprovider"
    );
  });

  it("InvalidRole_DoesNotCrashRouteResolution", () => {
    expect(parseStrictUserRole("unknown-role")).toBeNull();
    expect(resolvePrimaryRole(["unknown-role"])).toBeNull();
    expect(resolvePrimaryRole(undefined)).toBeNull();
  });

  it("SidebarHrefs_AllResolveToExistingRoutes", () => {
    const hrefs = Object.values(menu).flatMap(getAllMenuHrefs);
    const paths = [...new Set(hrefs.map((href) => href.split("?")[0]))];
    const missing = paths.filter((href) => !routes.has(href));
    expect(missing).toEqual([]);
  });

  it("legacy frontend entry point delegates to the canonical app", () => {
    const legacyPackage = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "frontend", "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(legacyPackage.scripts?.dev).toBe("npm --prefix .. run dev");
    expect(legacyPackage.scripts?.build).toBe("npm --prefix .. run build");
  });
});
