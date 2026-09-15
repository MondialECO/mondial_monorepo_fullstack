import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateTypographyModalHtml(scenario = 'default') {
  const brandName = 'CyberLock Sentinel';
  const displayFamily = scenario === 'alt_pair' ? 'Cinzel' : 'Space Grotesk';
  const textFamily = 'Plus Jakarta Sans';
  const logoFamily = 'Space Grotesk';

  const headingWeight = scenario === 'tuning' ? '800 ExtraBold' : '700 Bold';
  const headingSize = scenario === 'tuning' ? '36px' : '32px';
  const bodyWeight = '400 Regular';
  const bodySize = '16px';
  const buttonWeight = '600 SemiBold';
  const buttonSize = '14px';

  const regenCount = scenario === 'cap_exhausted' ? 3 : (scenario === 'tuning' ? 1 : 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Harmonized Typography System Modal - Step 6</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Space+Grotesk:wght@300..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Cinzel:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
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
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #EFEFF1;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="relative flex flex-col min-h-screen w-full">

  <!-- 1. Top Fixed Progress Bar -->
  <header class="sticky top-0 z-40 flex w-full flex-col border-b border-border bg-background/95 backdrop-blur-md">
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back to Idea
        </button>
        <span class="text-border">|</span>
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-bold text-foreground">${brandName}</span>
          <span class="text-xs text-muted-foreground">· Visual Identity Studio</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          STEP 6 OF 6
        </span>
        <span class="font-mono text-xs font-bold text-foreground">100% Complete</span>
      </div>
    </div>

    <!-- 6 Segments Bar -->
    <div class="w-full border-t border-border/40 bg-muted/20 px-6 py-2">
      <div class="mx-auto grid max-w-7xl grid-cols-6 gap-2">
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-foreground">1. Strategy</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-foreground">2. Direction</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-foreground">3. Logo Type</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-foreground">4. Logo</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-foreground">5. Colours</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-primary"></div>
          <span class="font-mono text-[10px] font-bold text-primary">6. Typography</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Backdrop Modal Overlay -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
    <div class="relative w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
      
      <!-- Modal Header -->
      <div class="flex items-start justify-between border-b border-border/80 px-6 py-4 bg-muted/20">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-primary tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded">
              STEP 6 OF 7
            </span>
            <span class="font-mono text-xs text-muted-foreground">
              Final Step of Studio Flow
            </span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-foreground">
            Harmonized Typography System
          </h2>
          <p class="text-xs text-muted-foreground">
            Typeface pairings, optical scales, and role assignments calibrated for ${brandName}.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Shared Regenerate Cap & AI Credit Cost -->
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border/60">
              <svg class="size-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              5 Credits
            </span>
            ${
              regenCount >= 3
                ? `<span class="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 tabular-nums">0/3 LEFT</span>`
                : `<span class="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border tabular-nums">${3 - regenCount}/3 LEFT</span>`
            }
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors ${
                regenCount >= 3 ? 'opacity-50 cursor-not-allowed' : ''
              }"
            >
              <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <span>Suggest pairings</span>
            </button>
          </div>

          <button class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6 overflow-y-auto">
        
        <!-- 1. Bundled Family Summary Section -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
              1. BUNDLED TYPEFACE FAMILIES
            </span>
            <span class="text-xs text-muted-foreground font-mono">
              Display & text pairing
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Display Family Card -->
            <div class="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[10px] font-bold text-primary tracking-wider uppercase">
                  DISPLAY FAMILY
                </span>
                <span class="font-mono text-[10px] text-muted-foreground">
                  133.5 KB web weight
                </span>
              </div>
              <div class="text-2xl font-bold text-foreground" style="font-family: '${displayFamily}', sans-serif;">
                ${displayFamily}
              </div>
              <div class="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span class="font-mono text-[11px]">SIL Open Font License 1.1</span>
                <span class="font-mono text-[11px]">Weights: 400, 500, 700</span>
              </div>
            </div>

            <!-- Text Family Card -->
            <div class="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[10px] font-bold text-primary tracking-wider uppercase">
                  TEXT FAMILY
                </span>
                <span class="font-mono text-[10px] text-muted-foreground">
                  172.1 KB web weight
                </span>
              </div>
              <div class="text-2xl font-bold text-foreground" style="font-family: '${textFamily}', sans-serif;">
                ${textFamily}
              </div>
              <div class="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span class="font-mono text-[11px]">SIL Open Font License 1.1</span>
                <span class="font-mono text-[11px]">Weights: 400, 500, 600, 700, 800</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Four Canonical Role Specimen Rows -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
              2. ROLE SPECIMENS & SCALING
            </span>
            <span class="text-xs text-muted-foreground">
              Per-role tuning is free & uncapped
            </span>
          </div>

          <div class="space-y-3">
            <!-- Role 1: Logo type (Permanent Lock) -->
            <div class="p-4 rounded-xl border border-border bg-card space-y-3">
              <div class="flex items-center justify-between border-b border-border/40 pb-2">
                <div class="flex items-center gap-2">
                  <svg class="size-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  <span class="text-sm font-bold text-foreground">Logo type</span>
                  <span class="font-mono text-xs text-muted-foreground">· ${logoFamily}</span>
                </div>

                <!-- Distinctive Permanent Lock Badge -->
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-mono text-muted-foreground">
                  <svg class="size-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  <span>Bound to approved logo concept</span>
                </div>
              </div>

              <div class="text-2xl font-bold text-foreground tracking-tight" style="font-family: '${logoFamily}', sans-serif;">
                ${brandName}
              </div>
            </div>

            <!-- Role 2: Heading -->
            <div class="p-4 rounded-xl border border-border bg-card space-y-3">
              <div class="flex items-center justify-between border-b border-border/40 pb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-foreground">Heading</span>
                  <span class="font-mono text-xs text-muted-foreground">· ${displayFamily}</span>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-mono text-[10px] text-muted-foreground">WEIGHT:</span>
                    <div class="font-mono text-xs px-2 py-1 rounded border border-border bg-muted/40 text-foreground font-semibold">
                      ${headingWeight}
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-mono text-[10px] text-muted-foreground">SIZE:</span>
                    <div class="font-mono text-xs px-2 py-1 rounded border border-border bg-muted/40 text-foreground font-semibold">
                      ${headingSize}
                    </div>
                  </div>
                </div>
              </div>

              <div class="font-bold text-foreground leading-tight" style="font-family: '${displayFamily}', sans-serif; font-size: ${headingSize};">
                Zero compromise enterprise security architecture
              </div>
            </div>

            <!-- Role 3: Body -->
            <div class="p-4 rounded-xl border border-border bg-card space-y-3">
              <div class="flex items-center justify-between border-b border-border/40 pb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-foreground">Body</span>
                  <span class="font-mono text-xs text-muted-foreground">· ${textFamily}</span>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-mono text-[10px] text-muted-foreground">WEIGHT:</span>
                    <div class="font-mono text-xs px-2 py-1 rounded border border-border bg-muted/40 text-foreground">
                      ${bodyWeight}
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-mono text-[10px] text-muted-foreground">SIZE:</span>
                    <div class="font-mono text-xs px-2 py-1 rounded border border-border bg-muted/40 text-foreground">
                      ${bodySize}
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-muted-foreground leading-relaxed" style="font-family: '${textFamily}', sans-serif; font-size: ${bodySize};">
                Crafted specifically for enterprise SecOps teams. Autonomous threat containment, zero-trust cryptographic verification, and intuitive telemetry interfaces.
              </div>
            </div>

            <!-- Role 4: Button & label -->
            <div class="p-4 rounded-xl border border-border bg-card space-y-3">
              <div class="flex items-center justify-between border-b border-border/40 pb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-foreground">Button & label</span>
                  <span class="font-mono text-xs text-muted-foreground">· ${textFamily}</span>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-mono text-[10px] text-muted-foreground">WEIGHT:</span>
                    <div class="font-mono text-xs px-2 py-1 rounded border border-border bg-muted/40 text-foreground">
                      ${buttonWeight}
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-mono text-[10px] text-muted-foreground">SIZE:</span>
                    <div class="font-mono text-xs px-2 py-1 rounded border border-border bg-muted/40 text-foreground">
                      ${buttonSize}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span
                  class="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow-sm"
                  style="font-family: '${textFamily}', sans-serif; font-size: ${buttonSize};"
                >
                  Explore ${brandName}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Hierarchy Live Layout Preview -->
        <div class="space-y-2">
          <span class="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
            3. LIVE HIERARCHY PREVIEW (CONFIRMED PALETTE)
          </span>

          <div class="p-6 rounded-xl border border-border space-y-4 shadow-sm bg-[#0F172A] text-white">
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <span class="text-base font-bold tracking-tight" style="font-family: '${logoFamily}', sans-serif; color: #FFFFFF;">
                ${brandName}
              </span>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                Verified Optical Scale
              </span>
            </div>

            <div class="space-y-2 max-w-xl">
              <h3 class="font-bold leading-tight" style="font-family: '${displayFamily}', sans-serif; font-size: ${headingSize}; color: #FFFFFF;">
                Autonomous zero-trust protection for cloud infrastructure
              </h3>
              <p class="leading-relaxed text-[#94A3B8]" style="font-family: '${textFamily}', sans-serif; font-size: 15px;">
                Unified security operations platform designed with high-legibility telemetry displays, instantaneous anomaly detection, and automated incident containment.
              </p>
            </div>

            <div class="pt-2">
              <button class="px-5 py-2.5 rounded-lg font-semibold shadow-sm bg-[#2563EB] text-white hover:opacity-90" style="font-family: '${textFamily}', sans-serif; font-size: 14px;">
                Deploy Sentinel Node
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Modal Footer Actions -->
      <div class="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-muted/20">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <svg class="size-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Confirming completes the 6-step Studio identity flow.</span>
        </div>

        <div class="flex items-center gap-3">
          <button class="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button class="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            <span>Confirm & Complete Brand Kit</span>
          </button>
        </div>
      </div>

    </div>
  </div>

</body>
</html>`;
}

function generateCompleteCanvasHtml() {
  const brandName = 'CyberLock Sentinel';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Full Studio Canvas - 6 Cards Complete</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Space+Grotesk:wght@300..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Inter', 'DM Sans', sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #EFEFF1;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="relative flex flex-col min-h-screen w-full pb-16">

  <!-- Fixed Top Header & Progress Bar -->
  <header class="sticky top-0 z-40 flex w-full flex-col border-b border-zinc-200 bg-white/95 backdrop-blur-md">
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900">
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back to Idea
        </button>
        <span class="text-zinc-300">|</span>
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-bold text-zinc-900">${brandName}</span>
          <span class="text-xs text-zinc-500">· Visual Identity Studio</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          IDENTITY COMPLETE
        </span>
        <span class="font-mono text-xs font-bold text-zinc-900">6 of 6 Steps Done (100%)</span>
      </div>
    </div>

    <!-- 6 Segments Bar (All Complete) -->
    <div class="w-full border-t border-zinc-100 bg-zinc-50 px-6 py-2">
      <div class="mx-auto grid max-w-7xl grid-cols-6 gap-2">
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-emerald-700">1. Strategy ✓</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-emerald-700">2. Direction ✓</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-emerald-700">3. Logo Type ✓</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-emerald-700">4. Logo ✓</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-emerald-700">5. Colours ✓</span>
        </div>
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <span class="font-mono text-[10px] font-bold text-emerald-700">6. Typography ✓</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Canvas Container with 6 Cards Stack -->
  <main class="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pt-8">
    
    <!-- 1. Strategy Result Card -->
    <div class="w-full rounded-xl border border-emerald-500/30 bg-white p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STEP 1</span>
          <span class="text-xs font-bold text-zinc-900">Brand Strategy</span>
        </div>
        <span class="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          CONFIRMED
        </span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div><span class="font-mono text-[10px] text-zinc-400 block">INDUSTRY</span><span class="font-semibold text-zinc-800">Cybersecurity</span></div>
        <div><span class="font-mono text-[10px] text-zinc-400 block">AUDIENCE</span><span class="font-semibold text-zinc-800">Enterprise SecOps</span></div>
        <div><span class="font-mono text-[10px] text-zinc-400 block">TRAITS</span><span class="font-semibold text-zinc-800">Precise, Resilient</span></div>
        <div><span class="font-mono text-[10px] text-zinc-400 block">TONE</span><span class="font-semibold text-zinc-800">Authoritative</span></div>
      </div>
    </div>

    <!-- 2. Direction Result Card -->
    <div class="w-full rounded-xl border border-emerald-500/30 bg-white p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STEP 2</span>
          <span class="text-xs font-bold text-zinc-900">Visual Direction</span>
        </div>
        <span class="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          CONFIRMED
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-bold text-zinc-900">Modern Precision</h4>
          <p class="text-xs text-zinc-500">Balanced and technically refined visual architecture.</p>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="size-5 rounded-full bg-[#0F172A] border border-zinc-200"></span>
          <span class="size-5 rounded-full bg-[#2563EB] border border-zinc-200"></span>
          <span class="size-5 rounded-full bg-[#10B981] border border-zinc-200"></span>
          <span class="size-5 rounded-full bg-[#FFFFFF] border border-zinc-200"></span>
        </div>
      </div>
    </div>

    <!-- 3. Logo Type Result Card -->
    <div class="w-full rounded-xl border border-emerald-500/30 bg-white p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STEP 3</span>
          <span class="text-xs font-bold text-zinc-900">Logo Type</span>
        </div>
        <span class="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          CONFIRMED
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <span class="text-sm font-bold text-zinc-900">Symbol + Name</span>
          <p class="text-xs text-zinc-500">Balanced lockup pairing an independent symbol mark alongside business name typography.</p>
        </div>
        <span class="font-mono text-[10px] text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded">Score 94%</span>
      </div>
    </div>

    <!-- 4. Logo Result Card -->
    <div class="w-full rounded-xl border border-emerald-500/30 bg-white p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STEP 4</span>
          <span class="text-xs font-bold text-zinc-900">Logo Concept & Variations</span>
        </div>
        <span class="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          CONFIRMED
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="size-14 rounded-xl bg-zinc-900 flex items-center justify-center p-2 shadow-inner">
            <svg class="size-8 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-zinc-900">Sentinel Shield</h4>
            <p class="text-xs text-zinc-500">7 canonical asset formats derived and saved.</p>
          </div>
        </div>
        <span class="font-mono text-xs text-zinc-500">Contrast 14.5:1 (AAA)</span>
      </div>
    </div>

    <!-- 5. Colour System Result Card -->
    <div class="w-full rounded-xl border border-emerald-500/30 bg-white p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STEP 5</span>
          <span class="text-xs font-bold text-zinc-900">Harmonized Colour System</span>
        </div>
        <span class="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          CONFIRMED
        </span>
      </div>
      <div class="grid grid-cols-5 gap-2">
        <div class="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <span class="size-4 rounded-full bg-[#0F172A] block border border-zinc-300"></span>
          <span class="font-mono text-[10px] font-bold text-zinc-800 block">Primary</span>
          <span class="font-mono text-[9px] text-zinc-500 block">#0F172A</span>
          <span class="font-mono text-[9px] text-emerald-700 font-bold block">14.8:1 AAA</span>
        </div>
        <div class="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <span class="size-4 rounded-full bg-[#2563EB] block border border-zinc-300"></span>
          <span class="font-mono text-[10px] font-bold text-zinc-800 block">Secondary</span>
          <span class="font-mono text-[9px] text-zinc-500 block">#2563EB</span>
          <span class="font-mono text-[9px] text-teal-700 font-bold block">4.6:1 AA</span>
        </div>
        <div class="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <span class="size-4 rounded-full bg-[#10B981] block border border-zinc-300"></span>
          <span class="font-mono text-[10px] font-bold text-zinc-800 block">Accent</span>
          <span class="font-mono text-[9px] text-zinc-500 block">#10B981</span>
          <span class="font-mono text-[9px] text-teal-700 font-bold block">3.4:1 AA Large</span>
        </div>
        <div class="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <span class="size-4 rounded-full bg-[#FFFFFF] block border border-zinc-300"></span>
          <span class="font-mono text-[10px] font-bold text-zinc-800 block">Background</span>
          <span class="font-mono text-[9px] text-zinc-500 block">#FFFFFF</span>
          <span class="font-mono text-[9px] text-zinc-400 block">Ground canvas</span>
        </div>
        <div class="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <span class="size-4 rounded-full bg-[#09090B] block border border-zinc-300"></span>
          <span class="font-mono text-[10px] font-bold text-zinc-800 block">Text</span>
          <span class="font-mono text-[9px] text-zinc-500 block">#09090B</span>
          <span class="font-mono text-[9px] text-emerald-700 font-bold block">18.2:1 AAA</span>
        </div>
      </div>
    </div>

    <!-- 6. Typography System Result Card -->
    <div class="w-full rounded-xl border border-emerald-500/30 bg-white p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STEP 6</span>
          <span class="text-xs font-bold text-zinc-900">Typography System</span>
        </div>
        <span class="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          CONFIRMED
        </span>
      </div>

      <div class="grid grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
        <div>
          <span class="font-mono text-[10px] text-zinc-400 block mb-0.5">DISPLAY FAMILY</span>
          <span class="text-sm font-bold text-zinc-900" style="font-family: 'Space Grotesk', sans-serif;">Space Grotesk</span>
          <span class="font-mono text-[10px] text-zinc-500 block">SIL OFL 1.1 · 133.5 KB</span>
        </div>
        <div>
          <span class="font-mono text-[10px] text-zinc-400 block mb-0.5">TEXT FAMILY</span>
          <span class="text-sm font-bold text-zinc-900" style="font-family: 'Plus Jakarta Sans', sans-serif;">Plus Jakarta Sans</span>
          <span class="font-mono text-[10px] text-zinc-500 block">SIL OFL 1.1 · 172.1 KB</span>
        </div>
      </div>

      <div class="space-y-2.5">
        <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
          <div>
            <span class="font-mono text-[10px] text-zinc-500 block">Logo type (Permanent)</span>
            <span class="text-base font-bold text-zinc-900" style="font-family: 'Space Grotesk', sans-serif;">CyberLock Sentinel</span>
          </div>
          <span class="font-mono text-[10px] text-zinc-400 bg-zinc-200/60 px-2 py-0.5 rounded">Space Grotesk · 700</span>
        </div>

        <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
          <div>
            <span class="font-mono text-[10px] text-zinc-500 block">Heading</span>
            <span class="text-sm font-bold text-zinc-900" style="font-family: 'Space Grotesk', sans-serif;">Zero compromise enterprise infrastructure</span>
          </div>
          <span class="font-mono text-[10px] text-zinc-400">Space Grotesk · 700 · 32px</span>
        </div>

        <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
          <div>
            <span class="font-mono text-[10px] text-zinc-500 block">Body</span>
            <span class="text-xs text-zinc-600" style="font-family: 'Plus Jakarta Sans', sans-serif;">Crafted specifically for enterprise SecOps teams.</span>
          </div>
          <span class="font-mono text-[10px] text-zinc-400">Plus Jakarta Sans · 400 · 16px</span>
        </div>

        <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
          <div>
            <span class="font-mono text-[10px] text-zinc-500 block">Button & label</span>
            <span class="inline-block px-3 py-1 rounded bg-[#0052FF] text-white text-xs font-semibold" style="font-family: 'Plus Jakarta Sans', sans-serif;">Explore CyberLock Sentinel</span>
          </div>
          <span class="font-mono text-[10px] text-zinc-400">Plus Jakarta Sans · 600 · 14px</span>
        </div>
      </div>
    </div>

  </main>

</body>
</html>`;
}

async function renderScreenshots() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  console.log('Rendering Screenshot 19: Typography Modal Overview...');
  await page.setContent(generateTypographyModalHtml('default'), { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, '19_typography_modal_overview.png'), fullPage: true });

  console.log('Rendering Screenshot 20: Role Tuning & Cap State...');
  await page.setContent(generateTypographyModalHtml('tuning'), { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, '20_typography_role_tuning_and_regen_cap.png'), fullPage: true });

  console.log('Rendering Screenshot 21: Full 6-Card Complete Studio Canvas...');
  await page.setContent(generateCompleteCanvasHtml(), { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, '21_full_studio_canvas_6cards_complete.png'), fullPage: true });

  await browser.close();
  console.log('All typography screenshots successfully rendered.');
}

renderScreenshots().catch(console.error);
