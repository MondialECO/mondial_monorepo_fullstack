import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read exported logos
const exportedLogosPath = path.resolve(__dirname, '../backend/tests/exported_logos.json');
const exportedLogos = JSON.parse(fs.readFileSync(exportedLogosPath, 'utf8'));
const cyberCase = exportedLogos.find(c => c.caseKey === 'cybersecurity');
const concept2 = cyberCase.concepts.find(c => c.key === 'concept_2');

const variations = {
  primary: {
    title: 'Primary Logo',
    subtitle: 'Default lockup for hero brand placements',
    note: 'Primary brand mark for websites, app headers, and principal marketing collateral.',
    svg: concept2.lockupSvg,
    isWide: true,
  },
  horizontal: {
    title: 'Horizontal Lockup',
    subtitle: 'Navbars, headers & landscape banners',
    note: 'Wide aspect-ratio lockup engineered for compact navigation bars and letterheads.',
    svg: concept2.lockupSvg,
    isWide: true,
  },
  stacked: {
    title: 'Stacked Lockup',
    subtitle: 'Square cards, badges & centered packaging',
    note: 'Centered composition balanced for square avatars, certificates, and packaging.',
    svg: concept2.lockupSvg,
    isWide: true,
  },
  icon_only: {
    title: 'Icon Only',
    subtitle: 'Multi-scale favicons, avatars & app icons',
    note: 'Pure glyph rendered with optical scaling down to 16px favicon dimensions.',
    svg: concept2.markSvg,
    isIcon: true,
    isWide: false,
  },
  black: {
    title: 'Black Monochrome',
    subtitle: 'Single-ink print, fax & light high-contrast',
    note: '100% black vector geometry for monochrome reproduction and documentation.',
    svg: concept2.lockupBlack,
    isWide: false,
  },
  white: {
    title: 'White Monochrome',
    subtitle: 'Dark backgrounds, photography & video overlays',
    note: 'High-contrast white vector mark isolated on dark media substrates.',
    svg: concept2.lockupWhite,
    isWhite: true,
    isWide: false,
  },
  transparent: {
    title: 'Transparent Background',
    subtitle: 'Alpha channel for overlays & fluid backdrops',
    note: 'True 32-bit RGBA alpha channel preview over standard transparency matrix.',
    svg: concept2.lockupSvg,
    isTransparent: true,
    isWide: false,
  },
};

const outputDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Variation Set Modal - Real Render</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'DM Sans', 'sans-serif'],
            heading: ['DM Sans', 'Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            background: '#FFFFFF',
            foreground: '#09090B',
            card: '#FFFFFF',
            'card-foreground': '#09090B',
            primary: '#0052FF',
            'primary-foreground': '#FFFFFF',
            muted: '#F4F4F5',
            'muted-foreground': '#71717A',
            border: '#E4E4E7',
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', 'DM Sans', sans-serif;
      background-color: #0B0F17;
      margin: 0;
      padding: 32px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }
    .checkerboard-stage {
      background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      background-color: #ffffff;
    }
  </style>
</head>
<body>

  <!-- Modal Container -->
  <div class="relative flex flex-col w-full max-w-6xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in duration-200">
    
    <!-- Modal Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:px-8 md:py-6 border-b border-border/80 bg-background/50">
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
            <span class="font-mono font-semibold mr-1">STEP 5 OF 7</span> • LOGO VARIATIONS
          </span>
          <span class="text-xs text-muted-foreground font-mono">
            CyberLock
          </span>
        </div>
        <h1 class="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Brand Variation Set
        </h1>
        <p class="text-xs md:text-sm text-muted-foreground">
          Seven production-ready variations have been derived from your approved concept.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/80 bg-background hover:bg-muted text-xs font-medium text-foreground shadow-2xs transition-colors"
        >
          <svg class="size-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 15V3m9 12v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5"/>
          </svg>
          Download set (.zip)
        </button>

        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal Body -->
    <div class="p-5 md:p-8 space-y-6">
      
      <!-- Top Row: Core Formats (3 Wide Cards) -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <svg class="size-3.5 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12.83 2.18a2 2 0 00-1.66 0L2.6 6.08a1 1 0 000 1.83l8.58 3.91a2 2 0 001.66 0l8.58-3.9a1 1 0 000-1.83zM2 12a1 1 0 00.58.91l8.6 3.91a2 2 0 001.65 0l8.58-3.9A1 1 0 0022 12M2 17a1 1 0 00.58.91l8.6 3.91a2 2 0 001.65 0l8.58-3.9A1 1 0 0022 17"/>
          </svg>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Core Lockup Formats
          </h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${['primary', 'horizontal', 'stacked'].map(key => {
            const item = variations[key];
            return `
            <div class="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md min-h-[220px]">
              <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex flex-col">
                  <span class="text-sm font-semibold tracking-tight text-foreground">
                    ${item.title}
                  </span>
                  <span class="text-[11px] text-muted-foreground line-clamp-1">
                    ${item.subtitle}
                  </span>
                </div>
                <button
                  type="button"
                  title="Download file"
                  class="inline-flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M12 15V3m9 12v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5"/>
                  </svg>
                </button>
              </div>

              <!-- Artwork Stage -->
              <div class="flex flex-1 items-center justify-center my-2">
                <div class="relative flex h-[100px] w-full items-center justify-center rounded-lg bg-muted/20 border border-border/40 p-4">
                  <div class="max-h-full max-w-full flex items-center justify-center">
                    ${item.svg}
                  </div>
                </div>
              </div>

              <div class="mt-2 pt-2.5 border-t border-border/40">
                <p class="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                  ${item.note}
                </p>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Bottom Row: Specialized Modes (4 Narrow Cards) -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <span class="size-1.5 rounded-full bg-primary/60"></span>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Specialized & Contrast Modes
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${['icon_only', 'black', 'white', 'transparent'].map(key => {
            const item = variations[key];
            let stageContent = '';

            if (item.isIcon) {
              stageContent = `
              <div class="flex flex-col items-center justify-center gap-2 py-1 w-full">
                <div class="flex items-end justify-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="relative size-16 p-2 rounded-xl bg-card border border-border shadow-2xs flex items-center justify-center overflow-hidden">
                      <div class="max-h-full max-w-full flex items-center justify-center">
                        ${item.svg}
                      </div>
                    </div>
                    <span class="text-[10px] font-mono text-muted-foreground tabular-nums">64×64px</span>
                  </div>
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="relative size-8 p-1 rounded-md bg-card border border-border shadow-2xs flex items-center justify-center overflow-hidden">
                      <div class="max-h-full max-w-full flex items-center justify-center">
                        ${item.svg}
                      </div>
                    </div>
                    <span class="text-[10px] font-mono text-muted-foreground tabular-nums">32×32px</span>
                  </div>
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="relative size-4 p-0.5 rounded-[3px] bg-card border border-border shadow-2xs flex items-center justify-center overflow-hidden">
                      <div class="max-h-full max-w-full flex items-center justify-center">
                        ${item.svg}
                      </div>
                    </div>
                    <span class="text-[10px] font-mono text-muted-foreground tabular-nums">16×16px</span>
                  </div>
                </div>
              </div>
              `;
            } else if (item.isWhite) {
              stageContent = `
              <div class="relative flex h-[100px] w-full items-center justify-center rounded-lg bg-[#0F172A] p-4 shadow-inner">
                <div class="max-h-full max-w-full flex items-center justify-center filter drop-shadow-sm">
                  ${item.svg}
                </div>
              </div>
              `;
            } else if (item.isTransparent) {
              stageContent = `
              <div class="checkerboard-stage relative flex h-[100px] w-full items-center justify-center rounded-lg border border-border/60 p-4 shadow-inner">
                <div class="max-h-full max-w-full flex items-center justify-center relative z-10">
                  ${item.svg}
                </div>
              </div>
              `;
            } else {
              stageContent = `
              <div class="relative flex h-[100px] w-full items-center justify-center rounded-lg bg-muted/20 border border-border/40 p-4">
                <div class="max-h-full max-w-full flex items-center justify-center">
                  ${item.svg}
                </div>
              </div>
              `;
            }

            return `
            <div class="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md min-h-[200px]">
              <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex flex-col">
                  <span class="text-sm font-semibold tracking-tight text-foreground">
                    ${item.title}
                  </span>
                  <span class="text-[11px] text-muted-foreground line-clamp-1">
                    ${item.subtitle}
                  </span>
                </div>
                <button
                  type="button"
                  title="Download file"
                  class="inline-flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M12 15V3m9 12v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5"/>
                  </svg>
                </button>
              </div>

              <!-- Artwork Stage -->
              <div class="flex flex-1 items-center justify-center my-2">
                ${stageContent}
              </div>

              <div class="mt-2 pt-2.5 border-t border-border/40">
                <p class="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                  ${item.note}
                </p>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex items-center justify-between gap-4 p-5 md:px-8 border-t border-border/80 bg-background/60">
      <button
        type="button"
        class="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 12H5m7-7l-7 7 7 7"/>
        </svg>
        Back to Concepts
      </button>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-6 h-10 rounded-lg bg-primary hover:bg-blue-700 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98]"
        >
          <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Approve all seven
          <svg class="size-4 ml-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M5 12h14m-7-7l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

  </div>

</body>
</html>`;
}

async function renderScreenshots() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 2,
  });

  const html = generateHtml();
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for Google Fonts to load
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  // 1. Full Modal Screenshot
  const fullModalPath = path.join(outputDir, '01_variation_set_modal_overview.png');
  await page.screenshot({ path: fullModalPath, fullPage: true });
  console.log(`Saved: ${fullModalPath}`);

  // 2. Focused Crop on 3 Core Lockups
  const coreLockupsSelector = page.locator('div.grid-cols-1.md\\:grid-cols-3');
  const coreLockupPath = path.join(outputDir, '02_variation_set_core_lockups.png');
  await coreLockupsSelector.screenshot({ path: coreLockupPath });
  console.log(`Saved: ${coreLockupPath}`);

  // 3. Focused Crop on 4 Specialized Modes
  const specializedSelector = page.locator('div.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
  const specializedPath = path.join(outputDir, '03_variation_set_specialized_modes.png');
  await specializedSelector.screenshot({ path: specializedPath });
  console.log(`Saved: ${specializedPath}`);

  await browser.close();
}

renderScreenshots().catch((err) => {
  console.error('Error rendering screenshots:', err);
  process.exit(1);
});
