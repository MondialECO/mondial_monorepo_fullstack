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

function generateStrategyModalHtml(mode = 'initial') {
  const isEdited = mode === 'edited';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Strategy Review Modal - Real Render</title>
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
    .canvas-grid {
      background-image: radial-gradient(#cbd5e1 1.3px, transparent 1.3px);
      background-size: 24px 24px;
    }
  </style>
</head>
<body class="relative flex flex-col min-h-screen w-full">

  <!-- 1. Top Fixed Progress Bar -->
  <header class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-2xs">
    <div class="flex items-center gap-3 min-w-[200px]">
      <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground">
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7m7 7H5"/></svg>
        Back
      </button>
      <div class="hidden sm:flex flex-col">
        <span class="text-[11px] font-bold text-foreground">CyberLock Sentinel</span>
        <span class="text-[10px] text-muted-foreground font-mono">Visual Identity Studio</span>
      </div>
    </div>

    <!-- Center: 6-Segment Progress Track -->
    <div class="flex items-center gap-1.5 md:gap-2">
      <!-- 1. Strategy (Active) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 shadow-2xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-primary text-white">
          <span class="font-mono font-bold">1</span>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Strategy</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 2. Direction (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60 cursor-not-allowed">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Direction</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 3. Logo Type (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60 cursor-not-allowed">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Logo Type</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 4. Logo (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60 cursor-not-allowed">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
      <span class="text-[11px] text-muted-foreground font-mono font-medium">Studio Live • Step 1 Active</span>
    </div>
  </header>

  <!-- 2. Full-Bleed Canvas -->
  <main class="canvas-grid flex-1 w-full px-4 md:px-8 py-8 flex flex-col items-center justify-center">
    <div class="text-center text-muted-foreground font-mono text-xs">
      [Studio Canvas Dot-Grid Background]
    </div>
  </main>

  <!-- 3. Dimmed Backdrop & Strategy Review Modal -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 md:p-6 overflow-y-auto">
    <div class="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in duration-200">
      
      <!-- Modal Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:px-8 md:py-6 border-b border-border/80 bg-background/50">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              <span class="font-mono font-semibold mr-1">STEP 1 OF 6</span> • BRAND STRATEGY
            </span>
            <span class="text-xs text-muted-foreground font-mono">CyberLock Sentinel</span>
          </div>
          <h1 class="text-xl md:text-2xl font-bold tracking-tight text-foreground">Brand Strategy Foundation</h1>
          <p class="text-xs md:text-sm text-muted-foreground">Review and calibrate the core strategic pillars pulled from your venture project before proceeding to visual direction.</p>
        </div>
        <button class="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted transition-colors self-start sm:self-center">
          <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 md:p-8 space-y-7 overflow-y-auto">
        
        <!-- Section 1: Pulled Strategic Foundations -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">1. Core Venture Inputs (Pulled from Project)</h2>
            <span class="text-[11px] font-mono text-muted-foreground">Click edit to refine any item</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <!-- Card 1: Business Name -->
            <div class="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">Business Name</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">stated</span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-sm font-bold text-foreground">CyberLock Sentinel</p>
                <button class="p-1 text-muted-foreground hover:text-foreground">
                  <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              </div>
            </div>

            <!-- Card 2: Industry -->
            <div class="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-600">Industry / Sector</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">stated</span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-foreground">Cybersecurity & Cloud Infrastructure</p>
                <button class="p-1 text-muted-foreground hover:text-foreground">
                  <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              </div>
            </div>

            <!-- Card 3: Concept -->
            <div class="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40 md:col-span-2">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600">Core Concept</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">stated</span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-foreground font-medium">Autonomous AI defense system for cloud infrastructure.</p>
                <button class="p-1 text-muted-foreground hover:text-foreground">
                  <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              </div>
            </div>

            <!-- Card 4: Target Audience -->
            <div class="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-600">Target Audience</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">stated</span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-foreground font-medium">Enterprise DevOps and SecOps teams</p>
                <button class="p-1 text-muted-foreground hover:text-foreground">
                  <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              </div>
            </div>

            <!-- Card 5: Positioning -->
            <div class="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-600">Market Positioning</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">stated</span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-xs text-foreground font-medium">Zero-compromise cloud security automation.</p>
                <button class="p-1 text-muted-foreground hover:text-foreground">
                  <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Name Display Form Selector -->
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">2. Name Display Form</h2>
            <span class="text-[11px] text-muted-foreground">Determines default casing on brand marks</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="flex flex-col justify-between p-3.5 rounded-xl border border-primary bg-primary/5 shadow-2xs cursor-pointer">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-foreground tracking-tight">CyberLock Sentinel</span>
                <div class="flex size-4 items-center justify-center rounded-full bg-primary text-white">
                  <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
              </div>
              <span class="text-[10px] font-mono text-muted-foreground">Standard / As Entered</span>
            </div>

            <div class="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-white hover:border-border cursor-pointer">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-foreground tracking-tight">CYBERLOCK SENTINEL</span>
                <div class="size-4 rounded-full border border-border/80"></div>
              </div>
              <span class="text-[10px] font-mono text-muted-foreground">All Caps Display</span>
            </div>

            <div class="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-white hover:border-border cursor-pointer">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-foreground tracking-tight">cyberlock sentinel</span>
                <div class="size-4 rounded-full border border-border/80"></div>
              </div>
              <span class="text-[10px] font-mono text-muted-foreground">Modern Lowercase</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Personality Traits Pills -->
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-1.5">
              <svg class="size-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
              <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">3. Personality Traits</h2>
            </div>
            <span class="text-[11px] font-mono text-muted-foreground">Free to edit • ${isEdited ? '4' : '3'} selected</span>
          </div>

          <div class="flex flex-wrap items-center gap-2 p-3.5 rounded-xl border border-border/80 bg-white">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/60 text-foreground border border-border/60">
              Precise
              <svg class="size-3 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/60 text-foreground border border-border/60">
              Resilient
              <svg class="size-3 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/60 text-foreground border border-border/60">
              Autonomous
              <svg class="size-3 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </span>
            ${isEdited ? `
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Hyper-scalable
              <svg class="size-3 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </span>
            ` : ''}

            <div class="flex items-center gap-1.5 ml-auto">
              <input type="text" placeholder="Add trait..." class="w-32 rounded-lg border border-border/80 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"/>
              <button class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-medium">
                <svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg>
                Add
              </button>
            </div>
          </div>
        </div>

        <!-- Section 4: Sector Avoidances -->
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-1.5">
              <svg class="size-3.5 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">4. Visual Avoidances (Exclusions)</h2>
            </div>
            <span class="text-[11px] font-mono text-muted-foreground">Free to edit • Clichés to avoid</span>
          </div>

          <div class="space-y-2.5 p-3.5 rounded-xl border border-border/80 bg-white">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                Cliché padlocks
                <svg class="size-3 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                Generic shields
                <svg class="size-3 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </span>
              ${isEdited ? `
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                Cartoon mascots
                <svg class="size-3 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </span>
              ` : ''}

              <div class="flex items-center gap-1.5 ml-auto">
                <input type="text" placeholder="Add avoidance..." class="w-36 rounded-lg border border-border/80 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"/>
                <button class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium">
                  <svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg>
                  Add
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-border/40">
              <span class="text-[10px] font-mono text-muted-foreground">Suggestions:</span>
              <div class="flex flex-wrap gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/40">
                  + Overused swooshes
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/40">
                  + Literal circuit lines
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 5: Tone & First Appearance -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-xl border border-border/80 bg-white p-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono mb-2.5">Tone Position</h3>
            <div class="grid grid-cols-3 gap-2">
              <div class="px-3 py-1.5 rounded-lg text-xs font-medium text-center bg-primary text-white border border-primary shadow-2xs">Balanced</div>
              <div class="px-3 py-1.5 rounded-lg text-xs font-medium text-center bg-muted/40 text-muted-foreground border border-border/60">Technical</div>
              <div class="px-3 py-1.5 rounded-lg text-xs font-medium text-center bg-muted/40 text-muted-foreground border border-border/60">Approachable</div>
            </div>
          </div>

          <div class="rounded-xl border border-border/80 bg-white p-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono mb-2.5">Primary Brand Medium</h3>
            <div class="w-full rounded-lg border border-border/80 bg-white px-3 py-1.5 text-xs font-medium text-foreground">
              Digital & Website Hero
            </div>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 md:px-8 border-t border-border/80 bg-background/60">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span class="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">0 CREDITS</span>
          <span>Refining strategy is free of charge</span>
        </div>

        <div class="flex items-center gap-3">
          <button class="px-4 py-2 rounded-lg border border-border/80 bg-white text-xs font-medium text-muted-foreground hover:text-foreground">Cancel</button>
          <button class="inline-flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-sm font-semibold text-white shadow-md">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
            Confirm Brand Strategy
          </button>
        </div>
      </div>

    </div>
  </div>

</body>
</html>`;
}

function generateConfirmedCanvasHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Studio Canvas - Strategy Confirmed</title>
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
    .canvas-grid {
      background-image: radial-gradient(#cbd5e1 1.3px, transparent 1.3px);
      background-size: 24px 24px;
    }
  </style>
</head>
<body class="relative flex flex-col min-h-screen w-full">

  <!-- Top Fixed Progress Bar: Step 1 Complete, Step 2 Active -->
  <header class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-2xs">
    <div class="flex items-center gap-3 min-w-[200px]">
      <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground">
        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7m7 7H5"/></svg>
        Back
      </button>
      <div class="hidden sm:flex flex-col">
        <span class="text-[11px] font-bold text-foreground">CyberLock Sentinel</span>
        <span class="text-[10px] text-muted-foreground font-mono">Visual Identity Studio</span>
      </div>
    </div>

    <!-- 6-Segment Progress Track -->
    <div class="flex items-center gap-1.5 md:gap-2">
      <!-- 1. Strategy (Complete) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/80">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-emerald-500 text-white">
          <svg class="size-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Strategy</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-emerald-500/60"></div>

      <!-- 2. Direction (Active - Unlocked!) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 shadow-2xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-primary text-white">
          <span class="font-mono font-bold">2</span>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Direction</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 3. Logo Type (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60 cursor-not-allowed">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Logo Type</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 4. Logo (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60 cursor-not-allowed">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
      <span class="text-[11px] text-muted-foreground font-mono font-medium">Studio Live • Step 2 Active</span>
    </div>
  </header>

  <!-- Full-Bleed Canvas with Confirmed Strategy Result Card -->
  <main class="canvas-grid flex-1 w-full px-4 md:px-8 py-8 flex flex-col items-center justify-start gap-6 overflow-y-auto">
    <div class="w-full max-w-4xl flex flex-col items-center gap-6">

      <!-- Step 1 Result Card: Confirmed Brand Strategy -->
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
              <h3 class="text-base font-bold text-foreground tracking-tight">CyberLock Sentinel</h3>
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
            <p class="text-xs text-foreground font-medium line-clamp-1">Precise, Resilient, Autonomous, Hyper-scalable</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-500">Avoidances</span>
            </div>
            <p class="text-xs text-foreground font-medium line-clamp-1">Cliché padlocks, Generic shields, Cartoon mascots</p>
          </div>
        </div>
      </div>

    </div>
  </main>

</body>
</html>`;
}

async function renderScreenshots() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 2,
  });

  // 1. Modal with Initial Pulled Creator Data & Provenance Chips
  const htmlInitial = generateStrategyModalHtml('initial');
  await page.setContent(htmlInitial, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const initialPath = path.join(outputDir, '07_strategy_review_modal_pulled_data.png');
  await page.screenshot({ path: initialPath, fullPage: true });
  console.log(`Saved: ${initialPath}`);

  // 2. Modal with Edited Traits and Avoidance Entry
  const htmlEdited = generateStrategyModalHtml('edited');
  await page.setContent(htmlEdited, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const editedPath = path.join(outputDir, '08_strategy_review_modal_edited_traits.png');
  await page.screenshot({ path: editedPath, fullPage: true });
  console.log(`Saved: ${editedPath}`);

  // 3. Studio Canvas with Strategy Result Card after Confirm
  const htmlConfirmedCanvas = generateConfirmedCanvasHtml();
  await page.setContent(htmlConfirmedCanvas, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const confirmedCanvasPath = path.join(outputDir, '09_strategy_confirmed_canvas_result_card.png');
  await page.screenshot({ path: confirmedCanvasPath, fullPage: true });
  console.log(`Saved: ${confirmedCanvasPath}`);

  await browser.close();
}

renderScreenshots().catch((err) => {
  console.error('Error rendering screenshots:', err);
  process.exit(1);
});
