import JSZip from "jszip";
import type { BrandKit } from "@/types/creator/brand-kit";
import { resolveMediaUrl } from "./brand-kit-media";

export interface BrandKitExportOptions {
  customBrandName?: string;
}

/**
 * Packages and triggers download of a production BrandKit ZIP archive in the client browser.
 * Includes:
 * 1. /logos/ (canonical vector lockups and icon variations in SVG)
 * 2. /tokens/colors.json
 * 3. /tokens/typography.json
 * 4. /tokens/brand-tokens.css
 * 5. README.md
 *
 * Fails loudly with an explicit Error if any logo asset cannot be fetched,
 * preventing silent omission of brand assets from the exported ZIP.
 */
export async function exportBrandKitZip(
  kit: BrandKit,
  customBrandName?: string
): Promise<void> {
  const brandName =
    customBrandName ||
    kit.strategy?.nameDisplayForm ||
    kit.strategy?.businessName ||
    "Brand";

  const zip = new JSZip();
  const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "brand";
  const rootFolder = zip.folder(`${slug}-brand-kit`) || zip;

  // 1. Determine canonical logo variations with concept fallbacks matching BrandKitHubView
  const logoVariations = kit.logo?.variations ?? {};
  const approvedConcept =
    kit.logo?.concepts?.find(
      (c) => c.key === kit.logo?.selectedConceptKey
    ) || kit.logo?.concepts?.[0];

  const targets: Array<{ fileKey: string; uri: string | null | undefined }> = [
    {
      fileKey: "primary",
      uri:
        logoVariations.horizontal?.svgUri ||
        logoVariations.primary?.svgUri ||
        approvedConcept?.lockupAssetUri ||
        approvedConcept?.markAssetUri,
    },
    {
      fileKey: "horizontal",
      uri:
        logoVariations.horizontal?.svgUri ||
        logoVariations.primary?.svgUri ||
        approvedConcept?.lockupAssetUri ||
        approvedConcept?.markAssetUri,
    },
    {
      fileKey: "stacked",
      uri:
        logoVariations.stacked?.svgUri ||
        logoVariations.secondary?.svgUri ||
        approvedConcept?.lockupAssetUri ||
        approvedConcept?.markAssetUri,
    },
    {
      fileKey: "icon-only",
      uri:
        logoVariations.icon_only?.svgUri ||
        logoVariations.monogram?.svgUri ||
        approvedConcept?.markAssetUri,
    },
    {
      fileKey: "black",
      uri:
        logoVariations.black?.svgUri ||
        logoVariations.inverted_dark?.svgUri ||
        approvedConcept?.lockupAssetUri,
    },
    {
      fileKey: "white",
      uri:
        logoVariations.white?.svgUri ||
        logoVariations.inverted_light?.svgUri ||
        approvedConcept?.lockupAssetUri,
    },
    {
      fileKey: "transparent",
      uri:
        logoVariations.transparent?.svgUri ||
        logoVariations.badge_stamp?.svgUri ||
        approvedConcept?.lockupAssetUri,
    },
  ];

  // Filter down to unique targets that have a defined URI
  const activeTargets: Array<{ fileKey: string; uri: string }> = [];
  const seenFileKeys = new Set<string>();

  for (const t of targets) {
    if (t.uri && !seenFileKeys.has(t.fileKey)) {
      seenFileKeys.add(t.fileKey);
      activeTargets.push({ fileKey: t.fileKey, uri: t.uri });
    }
  }

  // Also include any custom keys present in kit.logo.variations
  for (const [key, variation] of Object.entries(logoVariations)) {
    const fileKey = key.replace(/_/g, "-");
    if (variation.svgUri && !seenFileKeys.has(fileKey)) {
      seenFileKeys.add(fileKey);
      activeTargets.push({ fileKey, uri: variation.svgUri });
    }
  }

  if (activeTargets.length === 0) {
    throw new Error(
      "No logo assets found in brand kit. Confirm your visual identity concept before exporting."
    );
  }

  // 2. Fetch and package each logo SVG into /logos/
  const logosFolder = rootFolder.folder("logos");
  const failedAssets: Array<{ fileKey: string; reason: string }> = [];

  for (const item of activeTargets) {
    const filename = `${slug}-${item.fileKey}.svg`;
    const rawUri = item.uri;

    try {
      if (rawUri.startsWith("data:image/svg+xml;base64,")) {
        const base64Data = rawUri.split(",")[1];
        logosFolder?.file(filename, base64Data, { base64: true });
      } else if (rawUri.startsWith("data:image/svg+xml,")) {
        const rawSvg = decodeURIComponent(rawUri.replace("data:image/svg+xml,", ""));
        logosFolder?.file(filename, rawSvg);
      } else if (rawUri.startsWith("<svg")) {
        logosFolder?.file(filename, rawUri);
      } else {
        // Canonical URL resolution via resolveMediaUrl
        const resolvedUrl = resolveMediaUrl(rawUri, kit.version);
        if (!resolvedUrl) {
          failedAssets.push({ fileKey: item.fileKey, reason: "Invalid asset URI" });
          continue;
        }

        const res = await fetch(resolvedUrl);
        if (!res.ok) {
          failedAssets.push({
            fileKey: item.fileKey,
            reason: `HTTP ${res.status} ${res.statusText}`,
          });
          continue;
        }

        const svgText = await res.text();
        if (!svgText || !svgText.includes("<svg")) {
          failedAssets.push({
            fileKey: item.fileKey,
            reason: "Response did not contain valid SVG markup",
          });
          continue;
        }

        logosFolder?.file(filename, svgText);
      }
    } catch (err: any) {
      failedAssets.push({
        fileKey: item.fileKey,
        reason: err?.message || "Network error during download",
      });
    }
  }

  // Fail loudly if any logo could not be packaged
  if (failedAssets.length > 0) {
    const errorDetails = failedAssets
      .map((f) => `${f.fileKey} (${f.reason})`)
      .join(", ");
    throw new Error(
      `Failed to export brand kit: could not retrieve logo assets for ${errorDetails}.`
    );
  }

  // 3. Tokens Folder: colors.json
  const tokensFolder = rootFolder.folder("tokens");
  const colorTokens = {
    brandName,
    paletteName:
      kit.direction?.candidates?.find(
        (c) => c.key === kit.direction?.selectedDirectionKey
      )?.name || "Primary Palette",
    roles: (kit.colors?.roles ?? []).map((r) => ({
      role: r.roleName,
      hex: r.hex,
      rgb: r.rgb,
      contrastAgainstGround: r.contrastRatio ? `${r.contrastRatio}:1` : "Ground",
      wcagVerdict: r.contrastVerdict || "N/A",
      usageNote: r.usageNote,
    })),
  };
  tokensFolder?.file("colors.json", JSON.stringify(colorTokens, null, 2));

  // 4. Tokens Folder: typography.json
  const typographyTokens = {
    brandName,
    families: {
      display: kit.typography?.families?.displayFamily || { name: "Syne" },
      text: kit.typography?.families?.textFamily || { name: "DM Sans" },
    },
    roles: (kit.typography?.roles ?? []).map((r) => ({
      role: r.roleName,
      family: r.family,
      weight: r.weight,
      size: r.size,
      lineHeight: r.lineHeight,
      specimenText: r.specimenText,
      isPermanent: r.roleName === "Logo type",
    })),
  };
  tokensFolder?.file("typography.json", JSON.stringify(typographyTokens, null, 2));

  // 5. Tokens Folder: brand-tokens.css
  const cssTokens = `:root {
  /* Brand Colours */
  --brand-primary: ${kit.colors?.roles?.find((r) => r.roleName === "Primary")?.hex || "#1B365D"};
  --brand-secondary: ${kit.colors?.roles?.find((r) => r.roleName === "Secondary")?.hex || "#4B6B94"};
  --brand-accent: ${kit.colors?.roles?.find((r) => r.roleName === "Accent")?.hex || "#2EC4B6"};
  --brand-background: ${kit.colors?.roles?.find((r) => r.roleName === "Background")?.hex || "#F8FAFC"};
  --brand-text: ${kit.colors?.roles?.find((r) => r.roleName === "Text")?.hex || "#0F172A"};

  /* Typography Families */
  --font-brand-display: "${kit.typography?.families?.displayFamily?.name || "Syne"}", sans-serif;
  --font-brand-text: "${kit.typography?.families?.textFamily?.name || "DM Sans"}", sans-serif;
}
`;
  tokensFolder?.file("brand-tokens.css", cssTokens);

  // 6. README.md Summary
  const readmeContent = `# ${brandName} — Brand Identity Kit

**Industry**: ${kit.strategy?.industry?.value || "N/A"}
**Positioning**: ${kit.strategy?.positioning?.value || "N/A"}
**Tone**: ${kit.strategy?.tonePosition || "Balanced"}
**Status**: All identity assets verified.

---
### Included Assets:
1. \`/logos/\`: Production-grade logo mark lockup variations (${activeTargets.length} SVG files).
2. \`/tokens/colors.json\`: Harmonized 5-role WCAG contrast color palette.
3. \`/tokens/typography.json\`: Optical typography scales and role assignments.
4. \`/tokens/brand-tokens.css\`: Ready-to-use CSS Custom Properties.
`;
  rootFolder.file("README.md", readmeContent);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${slug}-brand-kit.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
