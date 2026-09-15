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

function generateColorModalHtml(scenario = 'default') {
  const brandName = 'CyberLock Sentinel';

  const roles = [
    {
      name: 'Primary',
      hex: '#0F172A',
      rgb: '15, 23, 42',
      note: 'Core dominant brand tone',
      ratio: '14.8:1',
      verdict: 'AAA',
      isLocked: false
    },
    {
      name: 'Secondary',
      hex: scenario === 'fail' ? '#94A3B8' : '#2563EB',
      rgb: scenario === 'fail' ? '148, 163, 184' : '37, 99, 235',
      note: 'Supporting brand tint',
      ratio: scenario === 'fail' ? '2.4:1' : '4.6:1',
      verdict: scenario === 'fail' ? 'FAIL' : 'AA',
      isLocked: true
    },
    {
      name: 'Accent',
      hex: '#10B981',
      rgb: '16, 185, 129',
      note: 'Action badges & interactive highlights',
      ratio: '3.4:1',
      verdict: 'AA Large',
      isLocked: false
    },
    {
      name: 'Background',
      hex: '#FFFFFF',
      rgb: '255, 255, 255',
      note: 'Ground canvas',
      ratio: null,
      verdict: null,
      isLocked: true
    },
    {
      name: 'Text',
      hex: '#09090B',
      rgb: '9, 9, 11',
      note: 'High-contrast typography & body copy',
      ratio: '18.2:1',
      verdict: 'AAA',
      isLocked: false
    }
  ];

  const primaryHex = roles[0].hex;
  const secondaryHex = roles[1].hex;
  const accentHex = roles[2].hex;
  const bgHex = roles[3].hex;
  const textHex = roles[4].hex;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Harmonized Colour System Modal - Step 5</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Space+Grotesk:wght@300..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
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
  <header class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-2xs">
    <div class="flex items-center gap-3 min-w-[200px]">
      <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted">
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7m7 7H5"/></svg>
        Back
      </button>
      <div class="hidden sm:flex flex-col">
        <span class="text-[11px] font-bold text-foreground">${brandName}</span>
        <span class="text-[10px] text-muted-foreground font-mono">Visual Identity Studio</span>
      </div>
    </div>

    <!-- Center: 6-Segment Progress Track -->
    <div class="flex items-center gap-1.5 md:gap-2">
      <!-- 1. Strategy (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Strategy</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/40"></div>

      <!-- 2. Direction (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Direction</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/40"></div>

      <!-- 3. Logo Type (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Logo Type</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/40"></div>

      <!-- 4. Mark (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Mark</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-blue-500"></div>

      <!-- 5. Colours (Active Modal) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ring-2 ring-blue-500/20 shadow-xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-blue-600 text-white font-mono">5</div>
        <span class="text-xs font-bold tracking-tight">Colours</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-muted"></div>

      <!-- 6. Typography (Upcoming) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted font-mono">6</div>
        <span class="hidden md:inline text-xs tracking-tight">Typography</span>
      </button>
    </div>

    <!-- Right Controls: Credits -->
    <div class="flex items-center gap-3 min-w-[200px] justify-end">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-mono">
        <svg class="size-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>42 credits</span>
      </div>
    </div>
  </header>

  <!-- 2. Dimmed Canvas Background -->
  <main class="flex-1 w-full bg-[#FAFAFA] p-8 flex items-center justify-center relative">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-xs z-20 transition-opacity"></div>

    <!-- 3. Modal Container (Step 5 Colour System) -->
    <div class="relative z-30 w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Modal Header -->
      <div class="flex items-start justify-between border-b border-border/80 px-6 py-5 bg-gradient-to-b from-slate-50/80 to-white shrink-0">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-bold font-mono tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              STEP 5 OF 7 · COLOUR SYSTEM
            </span>
            <span class="text-[11px] font-mono text-muted-foreground">
              Deterministic WCAG 2.1 Contrast
            </span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-foreground">
            Harmonized Colour System
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            Review 5 canonical brand color roles derived from your mark and direction. Edit hex values directly or tune the mood.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50 tabular-nums shrink-0">
            3/3 LEFT
          </span>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-border/80">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Regenerate Palette</span>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-6">
        
        <!-- Palette Mood Filter Strip -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-border/80">
          <div class="flex items-center gap-2">
            <svg class="size-4 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            <span class="text-xs font-bold text-foreground">PALETTE MOOD:</span>
            <span class="text-[11px] text-muted-foreground">Free instant tuning</span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button class="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow-xs">As generated</button>
            <button class="px-3 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-border">Calmer</button>
            <button class="px-3 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-border">Warmer</button>
            <button class="px-3 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-border">Higher contrast</button>
          </div>
        </div>

        <!-- 5 Roles Single Card List -->
        <div class="rounded-xl border border-border bg-white divide-y divide-border/80 overflow-hidden shadow-2xs">
          ${roles.map((r) => `
            <div class="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-slate-50/50 transition-colors">
              
              <!-- Left: Swatch + Names -->
              <div class="flex items-center gap-3.5 min-w-[220px]">
                <div class="relative size-11 rounded-xl border border-black/10 shadow-inner shrink-0 overflow-hidden" style="background-color: ${r.hex}"></div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-foreground">${r.name}</span>
                    ${r.isLocked ? `
                      <span class="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-border/60">
                        <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Locked
                      </span>
                    ` : ''}
                  </div>
                  <p class="text-[11px] text-muted-foreground leading-tight mt-0.5">${r.note}</p>
                </div>
              </div>

              <!-- Center: Hex & RGB -->
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-border/80">
                  <span class="text-xs font-mono font-bold text-foreground">${r.hex}</span>
                  <button class="text-muted-foreground hover:text-foreground p-0.5 rounded">
                    <svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
                <span class="hidden sm:inline text-xs font-mono text-muted-foreground">RGB: ${r.rgb}</span>
              </div>

              <!-- Right: Contrast Badge & Lock -->
              <div class="flex items-center gap-3 justify-end min-w-[200px]">
                ${
                  r.name === 'Background'
                    ? `<span class="text-[11px] font-mono text-muted-foreground">Used as a ground, not for text</span>`
                    : r.verdict === 'AAA'
                    ? `<span class="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"><svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>${r.ratio} AAA</span>`
                    : r.verdict === 'AA' || r.verdict === 'AA Large'
                    ? `<span class="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 border border-teal-500/20"><svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>${r.ratio} ${r.verdict}</span>`
                    : `<span class="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20"><svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${r.ratio} FAIL</span>`
                }

                <button class="p-2 rounded-lg border ${r.isLocked ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-muted-foreground hover:text-foreground border-border'}">
                  ${r.isLocked ? `
                    <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  ` : `
                    <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  `}
                </button>
              </div>

            </div>
          `).join('')}
        </div>

        <!-- Proportion Distribution Bar -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>PROPORTION RATIO (60-30-10 RULE)</span>
            <span>60% Ground · 30% Primary/Text · 10% Accent/Secondary</span>
          </div>
          <div class="h-3 w-full rounded-full overflow-hidden flex shadow-inner border border-black/10">
            <div style="width: 60%; background-color: ${bgHex};"></div>
            <div style="width: 20%; background-color: ${primaryHex};"></div>
            <div style="width: 10%; background-color: ${textHex};"></div>
            <div style="width: 6%; background-color: ${secondaryHex};"></div>
            <div style="width: 4%; background-color: ${accentHex};"></div>
          </div>
        </div>

        <!-- Live Mock UI Application Preview -->
        <div class="rounded-xl border border-border p-5 space-y-3 bg-slate-50/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <svg class="size-3.5 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>LIVE UI APPLICATION PREVIEW</span>
            </div>
            <span class="text-[10px] font-mono text-muted-foreground">Real-time Mock Fragment</span>
          </div>

          <div class="p-6 rounded-xl border shadow-sm" style="background-color: ${bgHex}; border-color: ${textHex}20;">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border" style="background-color: ${secondaryHex}15; color: ${secondaryHex}; border-color: ${secondaryHex}30;">
                    ENTERPRISE READY
                  </span>
                  <span class="text-[11px] font-semibold" style="color: ${accentHex};">● Active Network</span>
                </div>
                <h4 class="text-lg font-bold tracking-tight" style="color: ${textHex};">
                  Autonomous Infrastructure Suite
                </h4>
                <p class="text-xs leading-relaxed max-w-lg" style="color: ${textHex}B3;">
                  Experience deterministic contrast pairing with live WCAG 2.1 compliance across high-density creator dashboards.
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button type="button" class="px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-opacity hover:opacity-90" style="background-color: ${primaryHex}; color: ${bgHex};">
                  Deploy Node
                </button>
                <button type="button" class="px-3.5 py-2 rounded-lg text-xs font-semibold border" style="background-color: transparent; color: ${textHex}; border-color: ${textHex}30;">
                  Documentation
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-white shrink-0">
        <div class="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <svg class="size-3.5 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span>5 Canonical Roles · Free Hex Edits · 3-Cap Palette Regen</span>
        </div>

        <div class="flex items-center gap-3">
          <button class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20">
            <span>Confirm Colour System</span>
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

    </div>
  </main>
</body>
</html>`;
}

function generateConfirmedCanvasHtml() {
  const brandName = 'CyberLock Sentinel';

  const roles = [
    { name: 'Primary', hex: '#0F172A', ratio: '14.8:1', verdict: 'AAA', isLocked: false },
    { name: 'Secondary', hex: '#2563EB', ratio: '4.6:1', verdict: 'AA', isLocked: true },
    { name: 'Accent', hex: '#10B981', ratio: '3.4:1', verdict: 'AA Large', isLocked: false },
    { name: 'Background', hex: '#FFFFFF', ratio: null, verdict: null, isLocked: true },
    { name: 'Text', hex: '#09090B', ratio: '18.2:1', verdict: 'AAA', isLocked: false }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Studio Canvas - Colour System Confirmed</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Space+Grotesk:wght@300..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
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
      background-color: #F8FAFC;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="flex flex-col min-h-screen w-full">

  <!-- 1. Top Fixed Progress Bar -->
  <header class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-2xs">
    <div class="flex items-center gap-3 min-w-[200px]">
      <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted">
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7m7 7H5"/></svg>
        Dashboard
      </button>
      <div class="hidden sm:flex flex-col">
        <span class="text-[11px] font-bold text-foreground">${brandName}</span>
        <span class="text-[10px] text-muted-foreground font-mono">Visual Identity Studio</span>
      </div>
    </div>

    <!-- Center: 6-Segment Progress Track -->
    <div class="flex items-center gap-1.5 md:gap-2">
      <!-- 1. Strategy (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Strategy</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/40"></div>

      <!-- 2. Direction (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Direction</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/40"></div>

      <!-- 3. Logo Type (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Logo Type</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/40"></div>

      <!-- 4. Mark (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Mark</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/40"></div>

      <!-- 5. Colours (Completed) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-600 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Colours</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-blue-500"></div>

      <!-- 6. Typography (Unlocked Active) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ring-2 ring-blue-500/20 shadow-xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-blue-600 text-white font-mono">6</div>
        <span class="text-xs font-bold tracking-tight">Typography</span>
      </button>
    </div>

    <!-- Right Controls: Credits -->
    <div class="flex items-center gap-3 min-w-[200px] justify-end">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-mono">
        <svg class="size-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>42 credits</span>
      </div>
    </div>
  </header>

  <!-- 2. Main Studio Canvas with Confirmed Cards -->
  <main class="flex-1 w-full p-6 md:p-10 max-w-6xl mx-auto space-y-6">
    
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Brand Identity Canvas</h1>
        <p class="text-xs text-muted-foreground mt-0.5 font-mono">
          5 of 7 Milestones Confirmed · Step 6 (Typography) Unlocked
        </p>
      </div>
      <button class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
        <span>Configure Typography (Step 6)</span>
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>

    <!-- Canvas Accumulated Result Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <!-- Step 1: Strategy Result Card -->
      <div class="rounded-xl border border-emerald-500/30 bg-white p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-border/60 pb-2.5">
          <span class="text-[10px] font-mono font-bold text-muted-foreground">STEP 1 · STRATEGY</span>
          <span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> CONFIRMED
          </span>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Business Name</span>
          <p class="text-sm font-bold text-foreground">CyberLock Sentinel</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Core Positioning</span>
          <p class="text-xs text-slate-700">Autonomous network defense with zero compromise.</p>
        </div>
      </div>

      <!-- Step 2: Direction Result Card -->
      <div class="rounded-xl border border-emerald-500/30 bg-white p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-border/60 pb-2.5">
          <span class="text-[10px] font-mono font-bold text-muted-foreground">STEP 2 · DIRECTION</span>
          <span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> CONFIRMED
          </span>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Selected Mood</span>
          <p class="text-sm font-bold text-foreground">Modern Precision</p>
        </div>
        <div class="flex items-center gap-2 text-xs font-mono text-slate-600">
          <span>Space Grotesk</span>
          <span>+</span>
          <span>Plus Jakarta Sans</span>
        </div>
      </div>

      <!-- Step 3: Logo Type Result Card -->
      <div class="rounded-xl border border-emerald-500/30 bg-white p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-border/60 pb-2.5">
          <span class="text-[10px] font-mono font-bold text-muted-foreground">STEP 3 · LOGO TYPE</span>
          <span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> CONFIRMED
          </span>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Mark Architecture</span>
          <p class="text-sm font-bold text-foreground">Symbol + Name</p>
        </div>
        <p class="text-xs text-slate-600">Integrated emblem paired alongside brand name.</p>
      </div>

      <!-- Step 4: Logo Mark Result Card -->
      <div class="rounded-xl border border-emerald-500/30 bg-white p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-border/60 pb-2.5">
          <span class="text-[10px] font-mono font-bold text-muted-foreground">STEP 4 · BRAND MARK</span>
          <span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> CONFIRMED
          </span>
        </div>
        <div class="h-16 flex items-center justify-center bg-slate-50 rounded-lg p-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 80" width="100%" height="100%">
            <polygon points="44,16 68,30 68,58 44,72 20,58 20,30" fill="none" stroke="#0F172A" stroke-width="4"/>
            <text x="44" y="52" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="22" fill="#0F172A" text-anchor="middle">C</text>
            <text x="86" y="50" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="18" fill="#0F172A" letter-spacing="1">CYBERLOCK SENTINEL</text>
          </svg>
        </div>
        <p class="text-xs text-muted-foreground">7 Canonical Variations Derived</p>
      </div>

      <!-- Step 5: Confirmed Colour System Result Card (ColorsResultCard) -->
      <div class="rounded-xl border border-emerald-500/40 bg-white shadow-sm overflow-hidden md:col-span-2">
        <div class="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/20">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] font-bold text-muted-foreground tracking-wider uppercase">STEP 5</span>
            <span class="text-xs font-semibold text-foreground">Harmonized Colour System</span>
          </div>
          <span class="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            CONFIRMED
          </span>
        </div>

        <div class="p-4 space-y-4">
          <!-- 5 Swatches -->
          <div class="grid grid-cols-5 gap-3">
            ${roles.map((r) => `
              <div class="flex flex-col gap-1.5">
                <div class="h-12 w-full rounded-xl border border-black/10 relative shadow-2xs" style="background-color: ${r.hex}">
                  ${r.isLocked ? `
                    <div class="absolute top-1 right-1 size-4 rounded bg-black/40 backdrop-blur-xs flex items-center justify-center text-white">
                      <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  ` : ''}
                </div>
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-foreground truncate">${r.name}</span>
                  <span class="text-[10px] font-mono text-muted-foreground">${r.hex}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Verified Contrast Ratios -->
          <div class="pt-3 border-t border-dashed border-border/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="p-2.5 rounded-lg bg-slate-50 border border-border/60">
              <span class="text-[10px] text-muted-foreground font-mono">Primary vs Ground</span>
              <p class="text-xs font-bold text-emerald-700 font-mono mt-0.5">14.8:1 AAA Pass</p>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-border/60">
              <span class="text-[10px] text-muted-foreground font-mono">Secondary vs Ground</span>
              <p class="text-xs font-bold text-teal-700 font-mono mt-0.5">4.6:1 AA Pass</p>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-border/60">
              <span class="text-[10px] text-muted-foreground font-mono">Accent vs Ground</span>
              <p class="text-xs font-bold text-teal-700 font-mono mt-0.5">3.4:1 AA Large</p>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-border/60">
              <span class="text-[10px] text-muted-foreground font-mono">Text vs Ground</span>
              <p class="text-xs font-bold text-emerald-700 font-mono mt-0.5">18.2:1 AAA Pass</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</body>
</html>`;
}

async function render() {
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // 1. Overview screenshot
  const htmlOverview = generateColorModalHtml('default');
  await page.setContent(htmlOverview, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const path1 = path.join(outputDir, '16_color_system_modal_overview.png');
  await page.screenshot({ path: path1, fullPage: true });
  console.log(`Rendered: ${path1}`);

  // 2. Manual edit with FAIL contrast chip screenshot
  const htmlFail = generateColorModalHtml('fail');
  await page.setContent(htmlFail, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const path2 = path.join(outputDir, '17_color_system_manual_edit_and_fail.png');
  await page.screenshot({ path: path2, fullPage: true });
  console.log(`Rendered: ${path2}`);

  // 3. Confirmed canvas result card screenshot
  const htmlCanvas = generateConfirmedCanvasHtml();
  await page.setContent(htmlCanvas, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const path3 = path.join(outputDir, '18_color_system_confirmed_canvas.png');
  await page.screenshot({ path: path3, fullPage: true });
  console.log(`Rendered: ${path3}`);

  await browser.close();
}

render().catch(console.error);
