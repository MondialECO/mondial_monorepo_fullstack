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

const concepts = cyberCase.concepts.map((c, idx) => ({
  key: c.key,
  family: c.family,
  descriptor: c.descriptor,
  markSvg: c.markSvg,
  lockupSvg: c.lockupSvg,
  regenerateCount: idx === 3 ? 3 : idx === 1 ? 1 : idx === 2 ? 2 : 0
}));

function formatLogoFamily(family) {
  if (!family) return "Mark";
  const map = {
    symbol_plus_name: "Symbol + Name",
    combination_mark: "Combination Mark",
    minimal_pictorial: "Minimal Pictorial",
    geometric_abstract: "Geometric Abstract",
    wordmark: "Wordmark",
    monogram: "Monogram",
    emblem: "Emblem",
    minimal: "Minimal",
  };
  const normalized = family.toLowerCase().trim();
  if (map[normalized]) return map[normalized];
  return family.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

const outputDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateHtml(viewMode = 'mark', selectedConceptKey = 'concept_2', isCompareMode = false, compareSelection = []) {
  const selectedConcept = concepts.find(c => c.key === selectedConceptKey);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Logo Creation Modal - Real Render</title>
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
            accent: '#F4F4F5',
            'accent-foreground': '#09090B',
            border: '#E4E4E7',
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', 'DM Sans', sans-serif;
      background-color: #F8FAFC;
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
  </style>
</head>
<body>
  <div class="w-full max-w-6xl flex flex-col bg-white rounded-3xl border border-border shadow-xl overflow-hidden min-h-[760px]">
    <!-- Top Header -->
    <header class="flex items-center justify-between border-b border-border bg-white px-6 py-4">
      <div class="flex items-center gap-3">
        <button class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back
        </button>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">Step 4 of 7</span>
            <span class="text-muted-foreground text-xs">•</span>
            <span class="text-xs text-muted-foreground">Logo Creation</span>
          </div>
          <h1 class="font-heading font-bold text-lg text-foreground tracking-tight">Select Your Brand Mark</h1>
        </div>
      </div>

      <!-- View Modes & Compare Toggle -->
      <div class="flex items-center gap-3">
        <div class="inline-flex rounded-xl border border-border bg-muted/40 p-1 text-xs">
          <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'mark' ? 'bg-white font-medium text-foreground shadow-sm' : 'text-muted-foreground'}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            <span>Mark only</span>
          </button>
          <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'invoice' ? 'bg-white font-medium text-foreground shadow-sm' : 'text-muted-foreground'}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>On an invoice</span>
          </button>
          <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${viewMode === '16px' ? 'bg-white font-medium text-foreground shadow-sm' : 'text-muted-foreground'}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            <span>At 16px</span>
          </button>
        </div>

        <button class="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
          <span>Compare two</span>
        </button>
      </div>
    </header>

    <!-- 3x2 Grid Main Content -->
    <main class="flex-1 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${concepts.map((concept, index) => {
          const used = concept.regenerateCount;
          const remaining = Math.max(0, 3 - used);
          const isExhausted = remaining === 0;
          const isSelected = concept.key === selectedConceptKey;

          return `
          <div class="group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 min-h-[290px] bg-white ${
            isSelected
              ? 'border-primary ring-2 ring-primary/20 shadow-md'
              : 'border-border hover:border-border hover:shadow-xs'
          }">
            <!-- Top Bar: Title & Counter -->
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-heading font-semibold text-xs text-foreground truncate">
                  Concept ${index + 1}: ${concept.descriptor.split(' ')[0]} ${formatLogoFamily(concept.family)}
                </span>
              </div>

              ${isExhausted ? `
                <span class="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 tabular-nums shrink-0" title="Maximum 3 regenerations reached">
                  0/3 LEFT
                </span>
              ` : `
                <span class="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/70 tabular-nums shrink-0" title="${remaining} of 3 regenerations left">
                  ${remaining}/3 LEFT
                </span>
              `}
            </div>

            <!-- View Mode Canvas Area -->
            <div class="relative flex-1 flex items-center justify-center py-2 px-1 min-h-[145px]">
              ${viewMode === 'mark' ? `
                <div class="relative w-28 h-28 flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-border/50">
                  ${concept.markSvg}
                </div>
              ` : ''}

              ${viewMode === 'invoice' ? `
                <div class="w-full max-w-[290px] rounded-xl border border-border/70 bg-white p-3 shadow-xs">
                  <div class="flex items-start justify-between border-b border-border/60 pb-2.5 mb-2.5">
                    <div class="w-28 h-7 flex items-center">
                      ${concept.lockupSvg}
                    </div>
                    <div class="text-right">
                      <span class="font-mono text-[9px] font-semibold text-foreground tracking-wider block">#INV-2026-0042</span>
                      <span class="text-[9px] text-muted-foreground block">15 Sep 2026</span>
                    </div>
                  </div>
                  <div class="space-y-1 text-[10px]">
                    <div class="flex justify-between text-muted-foreground">
                      <span>Enterprise Security Protocol</span>
                      <span class="font-mono font-medium text-foreground">$12,450.00</span>
                    </div>
                    <div class="flex justify-between font-semibold text-foreground pt-1 border-t border-dashed border-border/60">
                      <span>Total Due</span>
                      <span class="font-mono text-primary">$12,450.00</span>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${viewMode === '16px' ? `
                <div class="flex items-center justify-center gap-6 w-full py-1">
                  <!-- Native 16px Scale -->
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="size-11 rounded-xl border border-border/70 bg-slate-50/80 flex items-center justify-center shadow-2xs">
                      <div class="size-4 flex items-center justify-center overflow-hidden">
                        ${concept.markSvg}
                      </div>
                    </div>
                    <span class="font-mono text-[9px] text-muted-foreground font-medium">16×16px</span>
                  </div>

                  <!-- 4x Magnification Loupe -->
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="relative size-20 rounded-2xl border border-primary/30 bg-white shadow-sm flex items-center justify-center overflow-hidden p-2">
                      <div class="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:8px_8px]"></div>
                      <div class="size-14 flex items-center justify-center scale-150 transform filter drop-shadow-xs z-10">
                        ${concept.markSvg}
                      </div>
                    </div>
                    <span class="font-mono text-[9px] font-semibold text-primary">4× Inspection</span>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Descriptor line -->
            <p class="text-[11px] text-muted-foreground line-clamp-1 mt-2 mb-3">
              ${concept.descriptor}
            </p>

            <!-- Bottom Action Footer -->
            <div class="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-white'
                }">
                  ${isSelected ? '<svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
                </div>
                <span class="text-xs font-medium ${isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground'}">
                  ${isSelected ? 'Selected' : 'Select'}
                </span>
              </div>

              <button class="h-7 px-2.5 rounded-lg border border-border/80 text-[11px] font-medium flex items-center gap-1.5 ${
                isExhausted ? 'opacity-40 cursor-not-allowed bg-muted/40 text-muted-foreground' : 'text-foreground hover:bg-muted'
              }" ${isExhausted ? 'disabled' : ''}>
                <svg class="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Regenerate</span>
              </button>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </main>

    <!-- Bottom Action Footer -->
    <footer class="flex items-center justify-between border-t border-border bg-white px-6 py-4 mt-auto">
      <div class="text-xs text-muted-foreground">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          Selected: <strong class="text-foreground font-semibold">Refined Wordmark</strong>
        </span>
      </div>

      <div class="flex items-center gap-3">
        <button class="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg">Cancel</button>
        <button class="h-10 px-5 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shadow-sm">
          <span>Confirm & Continue with Refined Wordmark</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function generateCompareHtml() {
  const conceptA = concepts[0];
  const conceptB = concepts[1];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Side-by-Side Comparison Overlay</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
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
            primary: '#0052FF',
            border: '#E4E4E7',
            muted: '#F4F4F5',
            'muted-foreground': '#71717A',
            foreground: '#09090B'
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', 'DM Sans', sans-serif;
      background-color: rgba(15, 23, 42, 0.6);
      margin: 0;
      padding: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div class="w-full max-w-5xl rounded-3xl border border-border bg-white shadow-2xl p-6 flex flex-col">
    <!-- Overlay Header -->
    <div class="flex items-center justify-between border-b border-border pb-4 mb-6">
      <div>
        <h3 class="font-heading font-bold text-lg text-foreground">Side-by-Side Concept Comparison</h3>
        <p class="text-xs text-muted-foreground">Compare mark geometry, context scalability, and contrast between two concepts.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View mode switcher -->
        <div class="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          <button class="px-3 py-1 rounded-md bg-white font-medium text-foreground shadow-xs">Mark</button>
          <button class="px-3 py-1 rounded-md text-muted-foreground">Invoice</button>
          <button class="px-3 py-1 rounded-md text-muted-foreground">16px</button>
        </div>

        <!-- Light/Dark Canvas Switcher -->
        <div class="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          <button class="p-1.5 rounded-md bg-white text-foreground shadow-xs" title="Light canvas">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </button>
          <button class="p-1.5 rounded-md text-muted-foreground" title="Dark canvas">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          </button>
        </div>

        <button class="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Two-Column Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Concept A Card -->
      <div class="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <span class="font-heading font-semibold text-sm text-foreground">Concept 1: Minimal Bars</span>
          <button class="h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>Select this concept</span>
          </button>
        </div>
        <div class="min-h-[260px] rounded-xl flex items-center justify-center p-6 border border-border/60 bg-white">
          <div class="w-36 h-36 flex items-center justify-center p-3">
            ${conceptA.markSvg}
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-4 text-center line-clamp-2">${conceptA.descriptor}</p>
      </div>

      <!-- Concept B Card -->
      <div class="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <span class="font-heading font-semibold text-sm text-foreground">Concept 2: Refined Wordmark</span>
          <button class="h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>Select this concept</span>
          </button>
        </div>
        <div class="min-h-[260px] rounded-xl flex items-center justify-center p-6 border border-border/60 bg-white">
          <div class="w-36 h-36 flex items-center justify-center p-3">
            ${conceptB.markSvg}
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-4 text-center line-clamp-2">${conceptB.descriptor}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // 1. Mark only view
  await page.setContent(generateHtml('mark', 'concept_2'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const markPath = path.join(outputDir, '01_logo_creation_3x2_grid.png');
  await page.screenshot({ path: markPath, fullPage: true });
  console.log(`Saved: ${markPath}`);

  // 2. Invoice composite view
  await page.setContent(generateHtml('invoice', 'concept_2'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const invoicePath = path.join(outputDir, '02_logo_creation_invoice_view.png');
  await page.screenshot({ path: invoicePath, fullPage: true });
  console.log(`Saved: ${invoicePath}`);

  // 3. 16px inspection view
  await page.setContent(generateHtml('16px', 'concept_2'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const microPath = path.join(outputDir, '03_logo_creation_16px_inspection_view.png');
  await page.screenshot({ path: microPath, fullPage: true });
  console.log(`Saved: ${microPath}`);

  // 4. Compare overlay view
  await page.setContent(generateCompareHtml(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const comparePath = path.join(outputDir, '04_logo_creation_compare_overlay.png');
  await page.screenshot({ path: comparePath, fullPage: true });
  console.log(`Saved: ${comparePath}`);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
