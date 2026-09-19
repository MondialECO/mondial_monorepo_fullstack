import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let lockupSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" width="100%" height="100%">
  <g transform="translate(15, 12)">
    <rect x="0" y="0" width="66" height="66" rx="14" fill="none" stroke="#0052FF" stroke-width="5" />
    <path d="M22 22 H44 V34 H22 V44 H44" fill="none" stroke="#0052FF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="96" y="52" font-family="Inter, sans-serif" font-size="28" font-weight="700" fill="#09090B">Auto<tspan fill="#0052FF">Invoice</tspan></text>
</svg>`;

let markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect x="8" y="8" width="84" height="84" rx="18" fill="none" stroke="#0052FF" stroke-width="6.5" />
  <path d="M30 30 H70 V48 H30 V68 H70" fill="none" stroke="#0052FF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

let stackedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="100%" height="100%">
  <g transform="translate(68, 10)">
    <rect x="0" y="0" width="64" height="64" rx="14" fill="none" stroke="#0052FF" stroke-width="5" />
    <path d="M20 20 H44 V32 H20 V44 H44" fill="none" stroke="#0052FF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="100" y="112" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="#09090B">Auto<tspan fill="#0052FF">Invoice</tspan></text>
</svg>`;

let blackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" width="100%" height="100%">
  <g transform="translate(15, 12)">
    <rect x="0" y="0" width="66" height="66" rx="14" fill="none" stroke="#000000" stroke-width="5" />
    <path d="M22 22 H44 V34 H22 V44 H44" fill="none" stroke="#000000" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="96" y="52" font-family="Inter, sans-serif" font-size="28" font-weight="700" fill="#000000">AutoInvoice</text>
</svg>`;

let whiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" width="100%" height="100%">
  <g transform="translate(15, 12)">
    <rect x="0" y="0" width="66" height="66" rx="14" fill="none" stroke="#FFFFFF" stroke-width="5" />
    <path d="M22 22 H44 V34 H22 V44 H44" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="96" y="52" font-family="Inter, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">AutoInvoice</text>
</svg>`;

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
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            heading: ['Inter', 'sans-serif'],
            mono: ['DM Mono', 'monospace'],
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
      font-family: 'Inter', sans-serif;
      background-color: #64748B;
      margin: 0;
      padding: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #09090B;
    }
  </style>
</head>
<body>

  <!-- Modal Container -->
  <div class="relative flex flex-col w-[1200px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
    
    <!-- Modal Header -->
    <div class="px-8 pt-6 pb-0 border-b border-border/70 bg-card">
      <div class="flex items-start justify-between gap-4 pb-4">
        <div class="space-y-1 max-w-2xl">
          <h1 class="text-[26px] font-semibold tracking-tight text-foreground font-sans">
            Your logo, in every form
          </h1>
          <p class="text-sm text-muted-foreground font-mono leading-relaxed">
            Seven variations built from Concept 04. Same geometry throughout — only arrangement and colour change.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border/80 bg-background text-foreground hover:bg-muted text-sm font-mono cursor-pointer shadow-2xs">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Download set</span>
          </button>

          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 text-muted-foreground border border-border/70 font-sans tracking-wide">
            STEP <span class="font-mono font-semibold text-foreground mx-1">4</span> OF <span class="font-mono font-semibold text-foreground ml-1">6</span>
          </span>

          <button class="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted transition-colors">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 6-Segment Workflow Steps Track -->
      <div class="grid grid-cols-6 gap-3.5 pt-2 pb-3.5">
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-foreground/80 font-mono">
            <svg class="size-3 text-emerald-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            <span>Strategy</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-foreground/80 font-mono">
            <svg class="size-3 text-emerald-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            <span>Direction</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-emerald-500"></div>
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-foreground/80 font-mono">
            <svg class="size-3 text-emerald-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            <span>Logo type</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-primary shadow-2xs"></div>
          <div class="flex items-center justify-center gap-1 text-xs font-semibold text-foreground font-mono">
            <span>Logo</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-muted border border-border/40"></div>
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground/60 font-mono">
            <svg class="size-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Colour</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-muted border border-border/40"></div>
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground/60 font-mono">
            <svg class="size-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Typography</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable Body -->
    <div class="p-8 space-y-6 bg-card">
      
      <!-- Section 1: Batch Summary Metadata Strip -->
      <div class="rounded-xl border border-border/80 bg-muted/20 px-5 py-3 flex items-center justify-between">
        <div class="flex items-center gap-6 text-xs">
          <div class="flex items-center">
            <span class="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">SOURCE</span>
            <span class="font-mono text-[13px] font-medium text-foreground ml-2">Concept 04</span>
          </div>
          <div class="h-3.5 w-px bg-border/80"></div>
          <div class="flex items-center">
            <span class="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">VARIATIONS</span>
            <span class="font-sans text-[13px] font-semibold text-foreground ml-2">7</span>
          </div>
          <div class="h-3.5 w-px bg-border/80"></div>
          <div class="flex items-center">
            <span class="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">FORMATS</span>
            <span class="font-sans text-[13px] font-semibold text-foreground ml-2">SVG + PNG</span>
          </div>
          <div class="h-3.5 w-px bg-border/80"></div>
          <div class="flex items-center">
            <span class="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">COST</span>
            <span class="font-mono text-[13px] text-foreground ml-2">Free, derived</span>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-sans text-xs font-medium">
          <svg class="size-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
          <span>No credits used</span>
        </div>
      </div>

      <!-- Section 2: Logo Variations Set -->
      <div class="space-y-5">
        
        <!-- Row 1: 3 Wide Tiles -->
        <div class="grid grid-cols-3 gap-5">
          
          <!-- Tile 1: PRIMARY -->
          <div class="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-2xs">
            <div class="relative h-[185px] bg-muted/15 border-b border-border/60 flex items-center justify-center p-6">
              <div class="absolute top-3.5 right-3.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-semibold tracking-wider">PRIMARY</span>
              </div>
              <div class="w-full max-h-[110px] flex items-center justify-center">
                ${lockupSvg}
              </div>
            </div>
            <div class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <span class="font-sans text-[11px] font-bold text-foreground tracking-wider">PRIMARY</span>
                <span class="font-sans text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">3:1</span>
              </div>
              <p class="font-mono text-[13px] text-muted-foreground mt-1">
                Default — website header, deck cover, documents.
              </p>
            </div>
          </div>

          <!-- Tile 2: HORIZONTAL -->
          <div class="group rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-2xs">
            <div class="relative h-[185px] bg-muted/15 border-b border-border/60 flex items-center justify-center p-6">
              <div class="w-full max-h-[110px] flex items-center justify-center">
                ${lockupSvg}
              </div>
              <div class="absolute top-3.5 right-3.5 flex items-center gap-1.5 opacity-100 transition-opacity">
                <button class="flex size-7 items-center justify-center rounded-md border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground shadow-2xs">
                  <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                </button>
                <div class="relative">
                  <button class="flex size-7 items-center justify-center rounded-md border border-border/80 bg-background/90 text-muted-foreground hover:text-foreground shadow-2xs">
                    <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                  </button>
                  <div class="absolute right-0 top-full mt-1.5 whitespace-nowrap px-2 py-1 rounded bg-[#09090B] text-white text-[11px] font-mono shadow-md">
                    Redraw just this variation
                  </div>
                </div>
              </div>
            </div>
            <div class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <span class="font-sans text-[11px] font-bold text-foreground tracking-wider">HORIZONTAL</span>
                <span class="font-sans text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">4:1</span>
              </div>
              <p class="font-mono text-[13px] text-muted-foreground mt-1">
                Wide spaces — navigation bars, email signatures.
              </p>
            </div>
          </div>

          <!-- Tile 3: STACKED -->
          <div class="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-2xs">
            <div class="relative h-[185px] bg-muted/15 border-b border-border/60 flex items-center justify-center p-6">
              <div class="w-full max-h-[140px] flex items-center justify-center">
                ${stackedSvg}
              </div>
            </div>
            <div class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <span class="font-sans text-[11px] font-bold text-foreground tracking-wider">STACKED</span>
                <span class="font-sans text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">1:1</span>
              </div>
              <p class="font-mono text-[13px] text-muted-foreground mt-1">
                Square spaces — profile images, avatars.
              </p>
            </div>
          </div>

        </div>

        <!-- Row 2: 4 Narrower Tiles -->
        <div class="grid grid-cols-4 gap-5">
          
          <!-- Tile 4: ICON-ONLY -->
          <div class="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-2xs">
            <div class="relative h-[185px] bg-muted/15 border-b border-border/60 flex flex-col items-center justify-center gap-2 p-3">
              <div class="size-16 flex items-center justify-center">
                ${markSvg}
              </div>
              <div class="flex items-end justify-center gap-4 pt-1">
                <div class="flex flex-col items-center gap-1">
                  <div class="size-7 rounded border border-border/60 bg-card flex items-center justify-center p-0.5 shadow-2xs">
                    ${markSvg}
                  </div>
                  <span class="font-sans text-[9px] text-muted-foreground">64px</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                  <div class="size-5 rounded-[3px] border border-border/60 bg-card flex items-center justify-center p-0.5 shadow-2xs">
                    ${markSvg}
                  </div>
                  <span class="font-sans text-[9px] text-muted-foreground">32px</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                  <div class="size-3.5 rounded-[2px] border border-border/60 bg-card flex items-center justify-center p-[1px] shadow-2xs">
                    ${markSvg}
                  </div>
                  <span class="font-sans text-[9px] text-muted-foreground">16px</span>
                </div>
              </div>
            </div>
            <div class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <span class="font-sans text-[11px] font-bold text-foreground tracking-wider">ICON-ONLY</span>
                <span class="font-sans text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">1:1</span>
              </div>
              <p class="font-mono text-[13px] text-muted-foreground mt-1">
                Favicon, app icon, social avatar.
              </p>
            </div>
          </div>

          <!-- Tile 5: BLACK -->
          <div class="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-2xs">
            <div class="relative h-[185px] bg-muted/15 border-b border-border/60 flex items-center justify-center p-6">
              <div class="w-full max-h-[110px] flex items-center justify-center">
                ${blackSvg}
              </div>
            </div>
            <div class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <span class="font-sans text-[11px] font-bold text-foreground tracking-wider">BLACK</span>
                <span class="font-sans text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">3:1</span>
              </div>
              <p class="font-mono text-[13px] text-muted-foreground mt-1">
                Print, contracts, fax-grade documents.
              </p>
            </div>
          </div>

          <!-- Tile 6: WHITE -->
          <div class="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-2xs">
            <div class="relative h-[185px] bg-[#0A1128] border-b border-border/60 flex items-center justify-center p-6">
              <div class="w-full max-h-[110px] flex items-center justify-center">
                ${whiteSvg}
              </div>
            </div>
            <div class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <span class="font-sans text-[11px] font-bold text-foreground tracking-wider">WHITE</span>
                <span class="font-sans text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">3:1</span>
              </div>
              <p class="font-mono text-[13px] text-muted-foreground mt-1">
                Dark backgrounds, photography, merch.
              </p>
            </div>
          </div>

          <!-- Tile 7: TRANSPARENT -->
          <div class="rounded-xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-2xs">
            <div class="relative h-[185px] bg-muted/10 border-b border-border/60 flex items-center justify-center p-6 overflow-hidden">
              <div class="absolute inset-0 opacity-60" style="background-image: linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0px;"></div>
              <div class="absolute top-3.5 right-3.5 z-10">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-background/90 border border-border/60 text-muted-foreground font-sans text-[9px] font-semibold">PNG · ALPHA</span>
              </div>
              <div class="w-full max-h-[110px] flex items-center justify-center relative z-10">
                ${lockupSvg}
              </div>
            </div>
            <div class="p-4 bg-card">
              <div class="flex items-center gap-2">
                <span class="font-sans text-[11px] font-bold text-foreground tracking-wider">TRANSPARENT</span>
                <span class="font-sans text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">3:1</span>
              </div>
              <p class="font-mono text-[13px] text-muted-foreground mt-1">
                Overlays and placement on any background.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- Modal Footer -->
    <div class="flex items-center justify-between gap-4 p-6 px-8 border-t border-border/80 bg-background/60">
      <button class="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer">
        <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>
        <span>Back to Concepts</span>
      </button>

      <button class="inline-flex items-center gap-2 px-6 h-10 rounded-lg text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer">
        <svg class="size-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
        <span>Approve all seven</span>
        <svg class="size-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
      </button>
    </div>

  </div>

</body>
</html>`;
}

async function render() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  
  const html = generateHtml();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, '01_variation_set_modal_figma_matching.png'), fullPage: true });
  console.log('Saved 01_variation_set_modal_figma_matching.png');

  await browser.close();
}

render().catch(console.error);
