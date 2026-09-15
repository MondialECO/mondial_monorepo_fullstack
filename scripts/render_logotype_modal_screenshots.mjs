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

function generateLogoTypeModalHtml(caseType = 'cyberlock') {
  const isShort = caseType === 'short';
  const brandName = isShort ? 'Vera' : 'CyberLock Sentinel';
  const charLength = isShort ? 4 : 18;
  const wordCount = isShort ? 1 : 2;
  const targetApp = isShort ? 'Mobile App' : 'Website & SaaS';
  const directionName = isShort ? 'Organic Vitality' : 'Modern Precision';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Logo Type Chooser Modal - Architectural Forms</title>
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

      <!-- 3. Logo Type (Active) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 shadow-2xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-primary text-white">
          <span class="font-mono font-bold">3</span>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Logo Type</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 4. Logo Creation -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Creation</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 5. Colour System -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Colour</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 6. Typography -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Type</span>
      </button>
    </div>

    <!-- Right: Studio status -->
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-muted border border-border/60 text-muted-foreground">
        <span class="size-2 rounded-full bg-primary animate-pulse"></span>
        STEP 3 ACTIVE
      </span>
    </div>
  </header>

  <!-- Studio Background Dot-Grid with Accumulated Strategy & Direction Cards in Background -->
  <main class="relative flex-1 w-full p-6 md:p-10 canvas-grid flex flex-col items-center">
    <!-- Dimmed Modal Backdrop -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm">
      
      <!-- Logo Type Chooser Modal Window -->
      <div class="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden bg-white">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg class="size-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">
                  STEP 3 OF 7
                </span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs font-medium text-muted-foreground">
                  Architectural Mark Form
                </span>
              </div>
              <h2 class="text-lg font-heading font-bold text-foreground">
                Choose Your Logo Type Archetype
              </h2>
            </div>
          </div>

          <button class="size-8 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Top Context Strip: Real Strategy & Direction Data -->
        <div class="px-6 py-3 bg-muted/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">Brand:</span>
            <span class="font-semibold text-foreground font-heading">${brandName}</span>
            <span class="font-mono text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-border/60">
              ${charLength} chars • ${wordCount} ${wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <svg class="size-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span>Target: <strong class="text-foreground">${targetApp}</strong></span>
            </div>
            <span class="text-muted-foreground">•</span>
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <svg class="size-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
              <span>Direction: <strong class="text-foreground">${directionName}</strong></span>
            </div>
          </div>
        </div>

        <!-- 3x2 Grid of Six Generic Type Cards -->
        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            
            <!-- 1. Wordmark -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-28 w-full bg-neutral-100 border-b border-border/50 flex flex-col items-center justify-center p-3 select-none">
                <span class="font-mono text-xl font-bold tracking-[0.2em] text-neutral-900">NORTHLINE</span>
                <div class="h-0.5 w-16 bg-neutral-400 rounded-full mt-1.5"></div>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-sm font-heading font-bold text-foreground tracking-tight">Wordmark</h3>
                    <span class="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">Typographic</span>
                  </div>
                  <p class="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    A standalone typographic mark where the business name itself forms the primary visual identity.
                  </p>
                  <div class="space-y-1.5 text-[11px] mb-3">
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-emerald-600 shrink-0">GOOD WHEN:</span>
                      <span class="text-muted-foreground leading-tight">Distinctive, punchy names where direct name recognition is paramount.</span>
                    </div>
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-amber-600 shrink-0">TRADE-OFF:</span>
                      <span class="text-muted-foreground leading-tight">Lacks an independent symbol for standalone app icons and favicons.</span>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-border/50">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    ${isShort ? `
                      <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-700 border-emerald-500/25">Strong fit for you</span>
                    ` : `
                      <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border/60">Workable</span>
                    `}
                    <span class="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Click to Select</span>
                  </div>
                  <p class="text-[10px] text-muted-foreground leading-relaxed">
                    ${isShort
                      ? 'At 4 characters across a single word, a clean typographic wordmark delivers instant, punchy brand clarity.'
                      : 'At 18 characters, a wordmark remains legible on desktop headers but requires tracked kerning for smaller screen displays.'}
                  </p>
                </div>
              </div>
            </div>

            <!-- 2. Symbol + Name (Selected for CyberLock) -->
            <div class="group relative flex flex-col rounded-xl border border-primary ring-2 ring-primary/20 shadow-md bg-card overflow-hidden">
              <div class="relative h-28 w-full bg-neutral-100 border-b border-border/50 flex items-center justify-center gap-3 p-3 select-none">
                <div class="size-10 rounded-xl bg-neutral-900 flex items-center justify-center shadow-xs">
                  <svg viewBox="0 0 24 24" class="size-5.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <div class="flex flex-col">
                  <span class="font-mono text-base font-bold text-neutral-900 tracking-wider">NORTHLINE</span>
                  <span class="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">SOLUTIONS</span>
                </div>
                <div class="absolute top-2.5 right-2.5 size-5.5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                  <svg class="size-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-sm font-heading font-bold text-foreground tracking-tight">Symbol + Name</h3>
                    <span class="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">Combination</span>
                  </div>
                  <p class="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    A balanced lockup pairing an independent symbol mark alongside the business name typography.
                  </p>
                  <div class="space-y-1.5 text-[11px] mb-3">
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-emerald-600 shrink-0">GOOD WHEN:</span>
                      <span class="text-muted-foreground leading-tight">Modular ecosystems requiring both a full header lockup and an isolated icon.</span>
                    </div>
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-amber-600 shrink-0">TRADE-OFF:</span>
                      <span class="text-muted-foreground leading-tight">Requires strict spacing guidelines to prevent visual crowding.</span>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-border/50">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-700 border-emerald-500/25">Strong fit for you</span>
                    <span class="text-[11px] font-semibold text-primary">Active Selection</span>
                  </div>
                  <p class="text-[10px] text-muted-foreground leading-relaxed">
                    Pairs a distinctive standalone mark with your ${charLength}-character name, providing maximum flexibility across ${targetApp} and documentation.
                  </p>
                </div>
              </div>
            </div>

            <!-- 3. Monogram -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-28 w-full bg-neutral-100 border-b border-border/50 flex items-center justify-center p-3 select-none">
                <div class="relative size-14 rounded-2xl border-2 border-neutral-900 bg-neutral-50 flex items-center justify-center">
                  <span class="font-mono text-2xl font-black text-neutral-900 tracking-tighter">NL</span>
                  <div class="absolute -bottom-1 -right-1 size-3.5 bg-neutral-900 rounded-full flex items-center justify-center">
                    <div class="size-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-sm font-heading font-bold text-foreground tracking-tight">Monogram</h3>
                    <span class="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">Initial Lockup</span>
                  </div>
                  <p class="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    An interconnected or framed composition created from the primary initials of the business name.
                  </p>
                  <div class="space-y-1.5 text-[11px] mb-3">
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-emerald-600 shrink-0">GOOD WHEN:</span>
                      <span class="text-muted-foreground leading-tight">Multi-word or longer names that need compact distillation in avatars and favicons.</span>
                    </div>
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-amber-600 shrink-0">TRADE-OFF:</span>
                      <span class="text-muted-foreground leading-tight">Requires repeated market exposure before audiences link the initials to the full name.</span>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-border/50">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    ${isShort ? `
                      <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border/60">Workable</span>
                    ` : `
                      <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-700 border-emerald-500/25">Strong fit for you</span>
                    `}
                    <span class="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Click to Select</span>
                  </div>
                  <p class="text-[10px] text-muted-foreground leading-relaxed">
                    ${isShort
                      ? 'A single-letter monogram is viable, though short names (4 chars) rarely require severe abbreviation.'
                      : "Distills 'CyberLock Sentinel' into an authoritative 'CS' monogram, solving small-scale avatar constraints effortlessly."}
                  </p>
                </div>
              </div>
            </div>

            <!-- 4. Geometric Abstract -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-28 w-full bg-neutral-100 border-b border-border/50 flex items-center justify-center p-3 select-none">
                <svg viewBox="0 0 60 60" class="size-12" fill="none">
                  <rect x="10" y="10" width="40" height="40" rx="8" stroke="#18181B" stroke-width="2.5" />
                  <circle cx="30" cy="30" r="12" stroke="#71717A" stroke-width="2" stroke-dasharray="3 2" />
                  <polygon points="30,18 40,36 20,36" fill="#18181B" />
                </svg>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-sm font-heading font-bold text-foreground tracking-tight">Geometric Abstract</h3>
                    <span class="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">Non-Figurative</span>
                  </div>
                  <p class="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    A conceptual geometric form communicating precision, technology, or momentum.
                  </p>
                  <div class="space-y-1.5 text-[11px] mb-3">
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-emerald-600 shrink-0">GOOD WHEN:</span>
                      <span class="text-muted-foreground leading-tight">Modern tech and infrastructure brands seeking distinctiveness without clichés.</span>
                    </div>
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-amber-600 shrink-0">TRADE-OFF:</span>
                      <span class="text-muted-foreground leading-tight">Relies on consistent strategic storytelling to build metaphorical meaning.</span>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-border/50">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-700 border-emerald-500/25">Strong fit for you</span>
                    <span class="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Click to Select</span>
                  </div>
                  <p class="text-[10px] text-muted-foreground leading-relaxed">
                    Echoes your '${directionName}' direction with engineered geometric structure without figurative clichés.
                  </p>
                </div>
              </div>
            </div>

            <!-- 5. Minimal Pictorial / Icon -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-28 w-full bg-neutral-100 border-b border-border/50 flex items-center justify-center p-3 select-none">
                <div class="size-12 rounded-full border border-neutral-300 bg-neutral-50 flex items-center justify-center shadow-2xs">
                  <svg viewBox="0 0 24 24" class="size-6 text-neutral-900" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-sm font-heading font-bold text-foreground tracking-tight">Minimal Pictorial / Icon</h3>
                    <span class="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">Recognizable Glyph</span>
                  </div>
                  <p class="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    A stylized visual metaphor conveying core functionality (e.g. shield, node, gateway) with high legibility.
                  </p>
                  <div class="space-y-1.5 text-[11px] mb-3">
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-emerald-600 shrink-0">GOOD WHEN:</span>
                      <span class="text-muted-foreground leading-tight">Brands centered around a clear physical or digital concept with high recognition.</span>
                    </div>
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-amber-600 shrink-0">TRADE-OFF:</span>
                      <span class="text-muted-foreground leading-tight">Risk of industry clichés if the metaphor is not given a unique twist.</span>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-border/50">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-700 border-emerald-500/25">Strong fit for you</span>
                    <span class="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Click to Select</span>
                  </div>
                  <p class="text-[10px] text-muted-foreground leading-relaxed">
                    Delivers an instantly recognizable pictorial symbol optimized for 16px to 32px UI scaling across ${targetApp}.
                  </p>
                </div>
              </div>
            </div>

            <!-- 6. Minimal Lineform -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-28 w-full bg-neutral-100 border-b border-border/50 flex items-center justify-center p-3 select-none">
                <svg viewBox="0 0 60 60" class="size-12" fill="none" stroke="#18181B" stroke-width="2">
                  <line x1="12" y1="30" x2="48" y2="30" stroke-width="3" />
                  <circle cx="30" cy="30" r="18" stroke-dasharray="4 2" />
                  <line x1="30" y1="12" x2="30" y2="48" />
                </svg>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-sm font-heading font-bold text-foreground tracking-tight">Minimal Lineform</h3>
                    <span class="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">Reductive</span>
                  </div>
                  <p class="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    An ultra-clean single-weight line structure stripped of all decorative embellishment.
                  </p>
                  <div class="space-y-1.5 text-[11px] mb-3">
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-emerald-600 shrink-0">GOOD WHEN:</span>
                      <span class="text-muted-foreground leading-tight">High-end and architectural brands prioritizing timeless subtlety and restraint.</span>
                    </div>
                    <div class="flex items-start gap-1.5">
                      <span class="font-mono text-[10px] font-semibold text-amber-600 shrink-0">TRADE-OFF:</span>
                      <span class="text-muted-foreground leading-tight">Can feel understated if surrounding typography lacks character.</span>
                    </div>
                  </div>
                </div>
                <div class="pt-2 border-t border-border/50">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border/60">Workable</span>
                    <span class="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Click to Select</span>
                  </div>
                  <p class="text-[10px] text-muted-foreground leading-relaxed">
                    Clean reductive aesthetic offering balanced, modern corporate restraint.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">
              Selected Type: <strong class="text-foreground font-semibold">Symbol + Name</strong>
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button class="px-3 py-1.5 text-xs font-medium rounded-lg border border-border/60 text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 shadow-sm flex items-center gap-1.5">
              <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <span>Use Symbol + Name</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </main>
</body>
</html>`;
}

function generateLogoTypeConfirmedCanvasHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Studio Canvas - Step 3 Confirmed</title>
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

  <!-- 1. Top Fixed Progress Bar (Steps 1, 2, 3 Complete, Step 4 Logo Creation Unlocked) -->
  <header class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-2xs">
    <div class="flex items-center gap-3 min-w-[200px]">
      <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted">
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
      <div class="h-0.5 w-3 rounded-full bg-primary/40"></div>

      <!-- 4. Logo Creation (Unlocked & Active) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 shadow-2xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-primary text-white">
          <span class="font-mono font-bold">4</span>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Creation</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 5. Colour System -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Colour</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 6. Typography -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Type</span>
      </button>
    </div>

    <!-- Right: Studio status -->
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-muted border border-border/60 text-muted-foreground">
        <span class="size-2 rounded-full bg-emerald-500"></span>
        STEP 3 COMPLETE
      </span>
    </div>
  </header>

  <!-- Studio Canvas Stack -->
  <main class="relative flex-1 w-full p-6 md:p-10 canvas-grid flex flex-col items-center">
    <div class="w-full max-w-4xl space-y-6">

      <!-- Strategy Result Card (Step 1) -->
      <div class="group relative w-full rounded-2xl border border-border/80 bg-white p-6 shadow-xs hover:border-primary/50 transition-all">
        <div class="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">STEP 1</span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs text-muted-foreground font-medium">Brand Strategy Foundation</span>
              </div>
              <h3 class="text-base font-bold text-foreground">CyberLock Sentinel</h3>
            </div>
          </div>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Review & Edit
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Core Positioning</span>
            <p class="text-xs text-foreground font-medium">Zero-compromise cloud security automation for DevSecOps teams.</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Personality Traits</span>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-border/60 text-foreground">Precise</span>
              <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-border/60 text-foreground">Resilient</span>
              <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-border/60 text-foreground">Autonomous</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Direction Result Card (Step 2) -->
      <div class="group relative w-full rounded-2xl border border-border/80 bg-white p-6 shadow-xs hover:border-primary/50 transition-all">
        <div class="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">STEP 2</span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs text-muted-foreground font-medium">Visual Direction</span>
              </div>
              <h3 class="text-base font-bold text-foreground">Modern Precision</h3>
            </div>
          </div>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Review & Edit
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Direction Feel</span>
            <p class="text-xs text-foreground font-medium">Balanced, confident and technically refined.</p>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Harmonized Palette</span>
            <div class="flex items-center gap-1.5">
              <div class="size-7 rounded-lg border border-black/10 bg-[#0F172A]"></div>
              <div class="size-7 rounded-lg border border-black/10 bg-[#2563EB]"></div>
              <div class="size-7 rounded-lg border border-black/10 bg-[#60A5FA]"></div>
              <div class="size-7 rounded-lg border border-black/10 bg-[#F8FAFC]"></div>
            </div>
          </div>
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Type Pairing</span>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold text-foreground">Space Grotesk</span>
              <span class="text-[11px] text-muted-foreground font-medium">Body: Plus Jakarta Sans</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Logo Type Result Card (Step 3 - Real Data "Symbol + Name") -->
      <div class="group relative w-full rounded-2xl border border-border/80 bg-white p-6 shadow-xs hover:border-primary/50 transition-all">
        <div class="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">STEP 3</span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs text-muted-foreground font-medium">Logo Type Archetype</span>
              </div>
              <h3 class="text-base font-bold text-foreground">Symbol + Name</h3>
            </div>
          </div>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Review & Edit
          </button>
        </div>

        <div class="flex items-center justify-between rounded-xl bg-muted/20 border border-border/40 p-4">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <div>
              <span class="text-xs font-semibold text-foreground">
                Selected Family: Symbol + Name
              </span>
              <p class="text-[11px] text-muted-foreground">
                Directs parametric geometry generation across the 6 candidate concept models.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</body>
</html>`;
}

async function renderScreenshots() {
  console.log('Launching browser to capture Logo Type Modal screenshots...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });

  // 1. Logo Type Chooser Modal with 3x2 Generic Greyscale Grid
  console.log('Rendering 12_logotype_chooser_modal_grid.png...');
  await page.setContent(generateLogoTypeModalHtml('cyberlock'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '12_logotype_chooser_modal_grid.png'), fullPage: false });

  // 2. Short Name Idea ("Vera") Divergence
  console.log('Rendering 13_logotype_short_vs_long_divergence.png...');
  await page.setContent(generateLogoTypeModalHtml('short'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '13_logotype_short_vs_long_divergence.png'), fullPage: false });

  // 3. Logo Type Confirmed Canvas Card
  console.log('Rendering 14_logotype_confirmed_canvas.png...');
  await page.setContent(generateLogoTypeConfirmedCanvasHtml());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '14_logotype_confirmed_canvas.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots generated successfully in outputs directory!');
}

renderScreenshots().catch(console.error);
