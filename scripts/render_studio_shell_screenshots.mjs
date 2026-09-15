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

const outputDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateStudioShellHtml(overlayModal = null) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Visual Identity Studio - Real Render</title>
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
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #EFEFF1;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }
    .canvas-grid {
      background-image: radial-gradient(#cbd5e1 1.3px, transparent 1.3px);
      background-size: 24px 24px;
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
<body class="relative flex flex-col min-h-screen w-full">

  <!-- 1. Top Fixed Progress Bar -->
  <header class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-2xs">
    <!-- Left Context -->
    <div class="flex items-center gap-3 min-w-[200px]">
      <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="m12 19-7-7 7-7m7 7H5"/>
        </svg>
        Back
      </button>
      <div class="hidden sm:flex flex-col">
        <span class="text-[11px] font-bold text-foreground line-clamp-1">CyberLock</span>
        <span class="text-[10px] text-muted-foreground font-mono">Visual Identity Studio</span>
      </div>
    </div>

    <!-- Center: 6-Segment Progress Track -->
    <div class="flex items-center gap-1.5 md:gap-2">
      <!-- 1. Strategy (Complete) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/80">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-500 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Strategy</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/60"></div>

      <!-- 2. Direction (Complete) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/80">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-500 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Direction</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/60"></div>

      <!-- 3. Logo Type (Complete) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/80">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-500 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Logo Type</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-primary/60"></div>

      <!-- 4. Logo (Active) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 shadow-2xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-primary text-white">
          <span class="font-mono font-bold">4</span>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Logo</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 5. Colour (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60 cursor-not-allowed">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Colour</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 6. Typography (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60 cursor-not-allowed">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Typography</span>
      </button>
    </div>

    <!-- Right: Studio Live Status -->
    <div class="flex items-center justify-end min-w-[200px]">
      <span class="text-[11px] text-muted-foreground font-mono font-medium">Studio Live • Step 4 Active</span>
    </div>
  </header>

  <!-- 2. Full-Bleed Canvas with Result Cards -->
  <main class="canvas-grid flex-1 w-full px-4 md:px-8 py-8 flex flex-col items-center justify-start gap-6 overflow-y-auto">
    <div class="w-full max-w-4xl flex flex-col items-center gap-6">

      <!-- Step 1 Result Card: Strategy -->
      <div class="group relative w-full rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer">
        <div class="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">STEP 1</span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs text-muted-foreground font-medium">Brand Strategy</span>
              </div>
              <h3 class="text-base font-bold text-foreground tracking-tight">CyberLock</h3>
            </div>
          </div>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Review & Edit
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">Concept</span>
            </div>
            <p class="text-xs text-foreground font-medium line-clamp-2">Autonomous AI defense system for cloud infrastructure.</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-500">Audience</span>
            </div>
            <p class="text-xs text-foreground font-medium line-clamp-2">Enterprise DevOps and SecOps teams</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-500">Positioning</span>
            </div>
            <p class="text-xs text-foreground font-medium line-clamp-2">Zero-compromise cloud security automation.</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-500">Archetype</span>
            </div>
            <p class="text-xs text-foreground font-medium line-clamp-1">The Guardian</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-500">Traits</span>
            </div>
            <p class="text-xs text-foreground font-medium line-clamp-1">Precise, Resilient, Autonomous</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-500">Avoidances</span>
            </div>
            <p class="text-xs text-foreground font-medium line-clamp-1">Cliché padlocks, Generic shields</p>
          </div>
        </div>
      </div>

      <!-- Step 2 Result Card: Direction -->
      <div class="group relative w-full rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer">
        <div class="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">STEP 2</span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs text-muted-foreground font-medium">Visual Direction</span>
              </div>
              <h3 class="text-base font-bold text-foreground tracking-tight">Technical Precision</h3>
            </div>
          </div>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Review & Edit
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1">Direction Feel</span>
            <p class="text-xs text-foreground font-medium leading-relaxed">Engineered authority with crisp mathematical balance.</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-2">Harmonized Palette</span>
            <div class="flex items-center gap-1.5">
              <div class="size-7 rounded-lg border border-black/10 shadow-2xs" style="background-color: #0052FF;"></div>
              <div class="size-7 rounded-lg border border-black/10 shadow-2xs" style="background-color: #0F172A;"></div>
              <div class="size-7 rounded-lg border border-black/10 shadow-2xs" style="background-color: #38BDF8;"></div>
              <div class="size-7 rounded-lg border border-black/10 shadow-2xs" style="background-color: #F8FAFC;"></div>
              <div class="size-7 rounded-lg border border-black/10 shadow-2xs" style="background-color: #09090B;"></div>
            </div>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1">Type Pairing</span>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold text-foreground">Inter (Display)</span>
              <span class="text-[11px] text-muted-foreground font-medium">Body: Inter Regular</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3 Result Card: Logo Type -->
      <div class="group relative w-full rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer">
        <div class="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">STEP 3</span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs text-muted-foreground font-medium">Logo Type Archetype</span>
              </div>
              <h3 class="text-base font-bold text-foreground tracking-tight">Wordmark</h3>
            </div>
          </div>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Review & Edit
          </button>
        </div>

        <div class="flex items-center justify-between rounded-xl bg-muted/20 border border-border/40 p-4">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </div>
            <div>
              <span class="text-xs font-semibold text-foreground">Selected Family: Wordmark</span>
              <p class="text-[11px] text-muted-foreground">Custom kerned typographic treatment with balanced letterform weighting.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>

  ${overlayModal ? `
  <!-- Dimmed Modal Backdrop Overlay -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 md:p-6 overflow-y-auto">
    <div class="relative flex flex-col w-full max-w-6xl max-h-[92vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in duration-200">
      
      <!-- Modal Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:px-8 md:py-6 border-b border-border/80 bg-background/50">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
              <span class="font-mono font-semibold mr-1">STEP 5 OF 7</span> • LOGO VARIATIONS
            </span>
            <span class="text-xs text-muted-foreground font-mono">CyberLock</span>
          </div>
          <h1 class="text-xl md:text-2xl font-bold tracking-tight text-foreground">Brand Variation Set</h1>
          <p class="text-xs md:text-sm text-muted-foreground">Seven production-ready variations have been derived from your approved concept.</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/80 bg-background text-xs font-medium text-foreground shadow-2xs">
            <svg class="size-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15V3m9 12v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5"/></svg>
            Download set (.zip)
          </button>
          <button class="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Modal Body (Preview of Top & Bottom Row) -->
      <div class="p-5 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Core Lockup Formats</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="rounded-xl border border-border/80 bg-card p-4 min-h-[160px] flex flex-col justify-between">
              <span class="text-sm font-semibold text-foreground">Primary Logo</span>
              <div class="flex h-20 items-center justify-center bg-muted/20 rounded-lg p-2">
                <div class="scale-90">${concept2.lockupSvg}</div>
              </div>
              <span class="text-[10px] text-muted-foreground font-mono">Primary hero lockup</span>
            </div>
            <div class="rounded-xl border border-border/80 bg-card p-4 min-h-[160px] flex flex-col justify-between">
              <span class="text-sm font-semibold text-foreground">Horizontal Lockup</span>
              <div class="flex h-20 items-center justify-center bg-muted/20 rounded-lg p-2">
                <div class="scale-90">${concept2.lockupSvg}</div>
              </div>
              <span class="text-[10px] text-muted-foreground font-mono">Header & navbar</span>
            </div>
            <div class="rounded-xl border border-border/80 bg-card p-4 min-h-[160px] flex flex-col justify-between">
              <span class="text-sm font-semibold text-foreground">Stacked Lockup</span>
              <div class="flex h-20 items-center justify-center bg-muted/20 rounded-lg p-2">
                <div class="scale-90">${concept2.lockupSvg}</div>
              </div>
              <span class="text-[10px] text-muted-foreground font-mono">Centered packaging</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between p-5 md:px-8 border-t border-border/80 bg-background/60">
        <button class="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
          Back to Concepts
        </button>
        <button class="inline-flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-sm font-semibold text-white shadow-md">
          <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Approve all seven
        </button>
      </div>

    </div>
  </div>
  ` : ''}

</body>
</html>`;
}

async function renderScreenshots() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 2,
  });

  // 1. Studio Canvas with Accumulated Result Cards
  const htmlCanvas = generateStudioShellHtml(null);
  await page.setContent(htmlCanvas, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const canvasPath = path.join(outputDir, '04_studio_shell_canvas_accumulated_cards.png');
  await page.screenshot({ path: canvasPath, fullPage: true });
  console.log(`Saved: ${canvasPath}`);

  // 2. Studio Shell with Active Modal Overlay & Dimmed Canvas
  const htmlOverlay = generateStudioShellHtml('variations');
  await page.setContent(htmlOverlay, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const overlayPath = path.join(outputDir, '05_studio_shell_overlay_modal.png');
  await page.screenshot({ path: overlayPath, fullPage: true });
  console.log(`Saved: ${overlayPath}`);

  await browser.close();
}

renderScreenshots().catch((err) => {
  console.error('Error rendering shell screenshots:', err);
  process.exit(1);
});
