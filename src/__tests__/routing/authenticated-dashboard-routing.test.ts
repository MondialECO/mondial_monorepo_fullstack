import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { menu } from "@/lib/menu";
import { getAllMenuHrefs } from "@/lib/menu-navigation";
import { readOnboardingPhase } from "@/lib/auth-contract";
import {
  parseStrictUserRole,
  resolvePrimaryRole,
  getRoleDashboardRoute,
  resolvePostLoginRedirect,
  isValidDashboardRouteForUser,
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

  it("PostLoginRedirect_ResolvesCanonicalDashboardForEveryRole", () => {
    // 1. Creator
    expect(getRoleDashboardRoute(UserRole.CREATOR)).toBe("/dashboard/creator");
    expect(getRoleDashboardRoute("Creator")).toBe("/dashboard/creator");
    expect(resolvePostLoginRedirect({ role: UserRole.CREATOR, roles: [UserRole.CREATOR], onboardingPhase: 1 })).toBe("/dashboard/creator");
    expectRoute("/dashboard/creator");

    // 2. Entrepreneur
    expect(getRoleDashboardRoute(UserRole.ENTREPRENEUR)).toBe("/dashboard/entrepreneur");
    expect(getRoleDashboardRoute("Entrepreneur")).toBe("/dashboard/entrepreneur");
    expect(resolvePostLoginRedirect({ role: UserRole.ENTREPRENEUR, roles: [UserRole.ENTREPRENEUR], onboardingPhase: 1 })).toBe("/dashboard/entrepreneur");
    expectRoute("/dashboard/entrepreneur");

    // 3. Investor
    expect(getRoleDashboardRoute(UserRole.INVESTOR)).toBe("/dashboard/investor");
    expect(getRoleDashboardRoute("Investor")).toBe("/dashboard/investor");
    expect(resolvePostLoginRedirect({ role: UserRole.INVESTOR, roles: [UserRole.INVESTOR], onboardingPhase: 1 })).toBe("/dashboard/investor");
    expectRoute("/dashboard/investor");

    // 4. Service Provider
    expect(getRoleDashboardRoute(UserRole.SERVICE_PROVIDER)).toBe("/dashboard/serviceprovider");
    expect(getRoleDashboardRoute("ServiceProvider")).toBe("/dashboard/serviceprovider");
    expect(getRoleDashboardRoute("Service Provider")).toBe("/dashboard/serviceprovider");
    expect(resolvePostLoginRedirect({ role: UserRole.SERVICE_PROVIDER, roles: [UserRole.SERVICE_PROVIDER], onboardingPhase: 1 })).toBe("/dashboard/serviceprovider");
    expectRoute("/dashboard/serviceprovider");

    // 5. Admin
    expect(getRoleDashboardRoute(UserRole.ADMIN)).toBe("/dashboard/admin");
    expect(getRoleDashboardRoute("Admin")).toBe("/dashboard/admin");
    expect(resolvePostLoginRedirect({ role: UserRole.ADMIN, roles: [UserRole.ADMIN], onboardingPhase: 1 })).toBe("/dashboard/admin");
    expectRoute("/dashboard/admin");

    // 6. SuperAdmin
    expect(getRoleDashboardRoute(UserRole.SUPERADMIN)).toBe("/dashboard/admin");
    expect(getRoleDashboardRoute("SuperAdmin")).toBe("/dashboard/admin");
    expect(resolvePostLoginRedirect({ role: UserRole.SUPERADMIN, roles: [UserRole.SUPERADMIN], onboardingPhase: 1 })).toBe("/dashboard/admin");

    // Multi-role priority resolution
    const multiUser = {
      role: UserRole.CREATOR,
      roles: [UserRole.CREATOR, UserRole.ENTREPRENEUR],
      onboardingPhase: 1,
    };
    expect(getRoleDashboardRoute(multiUser)).toBe("/dashboard/entrepreneur");
    expect(resolvePostLoginRedirect(multiUser)).toBe("/dashboard/entrepreneur");

    // Unknown role fallback
    expect(getRoleDashboardRoute("NonExistentRole")).toBe("/dashboard/creator");
    expect(resolvePostLoginRedirect({ role: "NonExistentRole" as any, roles: [], onboardingPhase: 1 })).toBe("/dashboard/creator");

    // Onboarding Phase 0 gate
    expect(resolvePostLoginRedirect({ role: UserRole.CREATOR, roles: [UserRole.CREATOR], onboardingPhase: 0 })).toBe("/onboarding");

    // Valid callback preservation
    expect(
      resolvePostLoginRedirect(
        { role: UserRole.INVESTOR, roles: [UserRole.INVESTOR], onboardingPhase: 1 },
        "/dashboard/investor/discovery"
      )
    ).toBe("/dashboard/investor/discovery");

    // Invalid callback fallback
    expect(
      resolvePostLoginRedirect(
        { role: UserRole.CREATOR, roles: [UserRole.CREATOR], onboardingPhase: 1 },
        "https://malicious.site/phishing"
      )
    ).toBe("/dashboard/creator");

    // Unauthorized callback fallback (e.g. Creator accessing SuperAdmin security route)
    expect(
      resolvePostLoginRedirect(
        { role: UserRole.CREATOR, roles: [UserRole.CREATOR], onboardingPhase: 1 },
        "/dashboard/admin/security"
      )
    ).toBe("/dashboard/creator");

    // Route validation checks
    expect(isValidDashboardRouteForUser({ role: UserRole.CREATOR, roles: [UserRole.CREATOR] }, "/dashboard/creator/messages")).toBe(true);
    expect(isValidDashboardRouteForUser({ role: UserRole.CREATOR, roles: [UserRole.CREATOR] }, "/dashboard/admin/users")).toBe(false);
    expect(isValidDashboardRouteForUser({ role: UserRole.ADMIN, roles: [UserRole.ADMIN] }, "/dashboard/admin/users")).toBe(true);
    expect(isValidDashboardRouteForUser({ role: UserRole.ADMIN, roles: [UserRole.ADMIN] }, "/dashboard/admin/security")).toBe(false);
    expect(isValidDashboardRouteForUser({ role: UserRole.SUPERADMIN, roles: [UserRole.SUPERADMIN] }, "/dashboard/admin/security")).toBe(true);
    expect(isValidDashboardRouteForUser({ role: UserRole.CREATOR, roles: [UserRole.CREATOR] }, "/dashboard/nonexistent")).toBe(false);
    expect(isValidDashboardRouteForUser({ role: UserRole.CREATOR, roles: [UserRole.CREATOR] }, "/login")).toBe(false);

    // Stale/alias callback normalization
    expect(
      resolvePostLoginRedirect(
        { role: UserRole.SUPERADMIN, roles: [UserRole.SUPERADMIN], onboardingPhase: 1 },
        "/dashboard/superadmin"
      )
    ).toBe("/dashboard/admin");

    expect(
      resolvePostLoginRedirect(
        { role: UserRole.SERVICE_PROVIDER, roles: [UserRole.SERVICE_PROVIDER], onboardingPhase: 1 },
        "/dashboard/service-provider/services"
      )
    ).toBe("/dashboard/serviceprovider/services");
  });

  it("legacy frontend entry point delegates to the canonical app", () => {
    const legacyPackage = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "frontend", "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(legacyPackage.scripts?.dev).toBe("npm --prefix .. run dev");
    expect(legacyPackage.scripts?.build).toBe("npm --prefix .. run build");
  });
});
