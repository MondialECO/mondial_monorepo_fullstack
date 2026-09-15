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

function generateDirectionModalHtml(state = 'initial') {
  const isAdjusted = state === 'adjusted';
  const isExhausted = state === 'exhausted';
  const usedCap = isExhausted ? 3 : 0;
  const remainingCap = isExhausted ? 0 : 3;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Direction Modal - Visual Specimen</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Space+Grotesk:wght@300..700&family=Syne:wght@400..800&display=swap" rel="stylesheet">
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
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-space { font-family: 'Space Grotesk', sans-serif; }
    .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-syne { font-family: 'Syne', sans-serif; }
    .font-jetbrains { font-family: 'JetBrains Mono', monospace; }
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

      <!-- 2. Direction (Active) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 shadow-2xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-primary text-white">
          <span class="font-mono font-bold">2</span>
        </div>
        <span class="hidden md:inline text-xs tracking-tight">Direction</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-border"></div>

      <!-- 3. Logo Type (Locked) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/60 opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted text-muted-foreground">
          <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
        STEP 2 ACTIVE
      </span>
    </div>
  </header>

  <!-- Studio Background Dot-Grid with Accumulated Strategy Card in Background -->
  <main class="relative flex-1 w-full p-6 md:p-10 canvas-grid flex flex-col items-center">
    <!-- Dimmed Modal Backdrop -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm">
      
      <!-- Direction Board Modal Window -->
      <div class="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden bg-white">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg class="size-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">
                  STEP 2 OF 7
                </span>
                <span class="text-xs text-muted-foreground">•</span>
                <span class="text-xs font-medium text-muted-foreground">
                  Visual Direction Board
                </span>
              </div>
              <h2 class="text-lg font-heading font-bold text-foreground">
                Select Your Visual Direction
              </h2>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Regenerate All Four Button -->
            <div class="flex items-center gap-2 bg-background border border-border/80 rounded-xl p-1 px-2.5 shadow-2xs">
              <button
                type="button"
                ${isExhausted ? 'disabled' : ''}
                class="h-7 px-2 text-xs font-medium gap-1.5 flex items-center hover:bg-muted text-foreground disabled:opacity-50"
              >
                <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                <span>Regenerate all four</span>
              </button>

              <div class="h-4 w-px bg-border/60"></div>

              <!-- 7 credits chip -->
              <span class="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                <svg class="size-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                7 CREDITS
              </span>

              <!-- Shared Cap Badge -->
              ${isExhausted ? `
                <span class="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 tabular-nums shrink-0">
                  0/3 LEFT
                </span>
              ` : `
                <span class="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50 tabular-nums shrink-0">
                  ${remainingCap}/3 LEFT
                </span>
              `}
            </div>

            <!-- Close button -->
            <button class="size-8 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Scrollable Candidates Grid -->
        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <!-- Candidate 1: Modern Precision (Selected) -->
            <div class="group relative flex flex-col rounded-xl border border-primary ring-2 ring-primary/20 shadow-md bg-card overflow-hidden">
              <!-- Abstract Specimen Band -->
              <div class="relative h-36 w-full flex items-center justify-between p-5 overflow-hidden border-b border-border/40 select-none ${isAdjusted ? 'bg-[#0B132B] text-[#E0E1DD]' : 'bg-[#0F172A] text-[#F8FAFC]'}">
                <!-- Abstract Geometric Motif (Technical Lattice) -->
                <div class="absolute right-2 top-0 bottom-0 w-36 pointer-events-none flex items-center justify-center opacity-60">
                  <svg viewBox="0 0 120 120" class="size-full" fill="none">
                    <defs>
                      <pattern id="grid-p1" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2563EB" stroke-width="0.75" stroke-opacity="0.4" />
                        <circle cx="10" cy="10" r="1.5" fill="#F8FAFC" fill-opacity="0.8" />
                      </pattern>
                    </defs>
                    <rect width="120" height="120" fill="url(#grid-p1)" />
                    <rect x="25" y="25" width="70" height="70" stroke="#2563EB" stroke-width="2" />
                    <line x1="15" y1="60" x2="105" y2="60" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="2 2" />
                    <line x1="60" y1="15" x2="60" y2="105" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="2 2" />
                  </svg>
                </div>

                <!-- Large Letterform Specimen -->
                <div class="relative z-10 flex flex-col justify-between h-full">
                  <span class="font-space text-4xl sm:text-5xl tracking-tight leading-none ${isAdjusted ? 'font-bold' : 'font-semibold'}">
                    C
                  </span>
                  <span class="font-jakarta text-[11px] opacity-85 tracking-normal">
                    Aa Bb Gg 123 • Modern Precision
                  </span>
                </div>

                <!-- Selected Check Badge -->
                <div class="size-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                  <svg class="size-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>

              <!-- 4-Swatch Color Strip -->
              <div class="grid grid-cols-4 h-5 w-full border-b border-border/40">
                <div class="h-full w-full bg-[#0F172A]" title="#0F172A"></div>
                <div class="h-full w-full ${isAdjusted ? 'bg-[#1D4ED8]' : 'bg-[#2563EB]'}" title="#2563EB"></div>
                <div class="h-full w-full ${isAdjusted ? 'bg-[#93C5FD]' : 'bg-[#60A5FA]'}" title="#60A5FA"></div>
                <div class="h-full w-full bg-[#F8FAFC]" title="#F8FAFC"></div>
              </div>

              <!-- Details -->
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <h3 class="text-base font-heading font-bold text-foreground tracking-tight">Modern Precision</h3>
                    <span class="font-mono text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                      Space Grotesk + Plus Jakarta Sans
                    </span>
                  </div>
                  <p class="text-xs font-medium text-foreground/90 leading-relaxed mb-2.5">
                    Balanced, confident and technically refined.
                  </p>
                  <div class="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">Why this fits</span>
                    <p class="text-[11px] text-muted-foreground leading-relaxed">
                      Aligns with enterprise security positioning with architectural clarity and modern infrastructure precision.
                    </p>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span class="font-mono text-[10px] text-muted-foreground">Motif: technical lattice</span>
                  <span class="font-semibold text-xs text-primary">Active Selection</span>
                </div>
              </div>
            </div>

            <!-- Candidate 2: Organic Vitality -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-36 w-full flex items-center justify-between p-5 overflow-hidden border-b border-border/40 select-none bg-[#064E3B] text-[#ECFDF5]">
                <div class="absolute right-2 top-0 bottom-0 w-36 pointer-events-none flex items-center justify-center opacity-60">
                  <svg viewBox="0 0 120 120" class="size-full" fill="none">
                    <path d="M20,100 C40,40 80,40 100,20 C100,60 70,90 20,100 Z" stroke="#10B981" stroke-width="2" fill="#10B981" fill-opacity="0.15" />
                    <circle cx="60" cy="60" r="30" stroke="#ECFDF5" stroke-width="1.5" stroke-dasharray="3 3" />
                  </svg>
                </div>
                <div class="relative z-10 flex flex-col justify-between h-full">
                  <span class="font-syne text-4xl sm:text-5xl tracking-tight leading-none font-bold">C</span>
                  <span class="font-jakarta text-[11px] opacity-85 tracking-normal">Aa Bb Gg 123 • Organic Vitality</span>
                </div>
              </div>
              <div class="grid grid-cols-4 h-5 w-full border-b border-border/40">
                <div class="h-full w-full bg-[#064E3B]"></div>
                <div class="h-full w-full bg-[#10B981]"></div>
                <div class="h-full w-full bg-[#6EE7B7]"></div>
                <div class="h-full w-full bg-[#ECFDF5]"></div>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <h3 class="text-base font-heading font-bold text-foreground tracking-tight">Organic Vitality</h3>
                    <span class="font-mono text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                      Syne + Plus Jakarta Sans
                    </span>
                  </div>
                  <p class="text-xs font-medium text-foreground/90 leading-relaxed mb-2.5">
                    Dynamic, restorative and naturally structured.
                  </p>
                  <div class="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">Why this fits</span>
                    <p class="text-[11px] text-muted-foreground leading-relaxed">
                      Emphasizes adaptive cyber defense resilience and organic network self-healing mechanisms.
                    </p>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span class="font-mono text-[10px] text-muted-foreground">Motif: organic growth</span>
                  <span class="font-medium text-xs text-muted-foreground">Click to Select</span>
                </div>
              </div>
            </div>

            <!-- Candidate 3: Classic Editorial -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-36 w-full flex items-center justify-between p-5 overflow-hidden border-b border-border/40 select-none bg-[#1C1917] text-[#FFFBEB]">
                <div class="absolute right-2 top-0 bottom-0 w-36 pointer-events-none flex items-center justify-center opacity-60">
                  <svg viewBox="0 0 120 120" class="size-full" fill="none">
                    <line x1="15" y1="20" x2="105" y2="20" stroke="#B45309" stroke-width="2.5" />
                    <line x1="15" y1="100" x2="105" y2="100" stroke="#B45309" stroke-width="2.5" />
                    <circle cx="60" cy="60" r="24" stroke="#B45309" stroke-width="1.5" />
                  </svg>
                </div>
                <div class="relative z-10 flex flex-col justify-between h-full">
                  <span class="font-cinzel text-4xl sm:text-5xl tracking-tight leading-none font-bold">C</span>
                  <span class="font-jakarta text-[11px] opacity-85 tracking-normal">Aa Bb Gg 123 • Classic Editorial</span>
                </div>
              </div>
              <div class="grid grid-cols-4 h-5 w-full border-b border-border/40">
                <div class="h-full w-full bg-[#1C1917]"></div>
                <div class="h-full w-full bg-[#B45309]"></div>
                <div class="h-full w-full bg-[#FDE68A]"></div>
                <div class="h-full w-full bg-[#FFFBEB]"></div>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <h3 class="text-base font-heading font-bold text-foreground tracking-tight">Classic Editorial</h3>
                    <span class="font-mono text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                      Cinzel + Plus Jakarta Sans
                    </span>
                  </div>
                  <p class="text-xs font-medium text-foreground/90 leading-relaxed mb-2.5">
                    Authoritative, timeless and distinguished.
                  </p>
                  <div class="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">Why this fits</span>
                    <p class="text-[11px] text-muted-foreground leading-relaxed">
                      Brings institutional credibility and trusted durability suitable for defense and finance enterprise accounts.
                    </p>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span class="font-mono text-[10px] text-muted-foreground">Motif: editorial classic</span>
                  <span class="font-medium text-xs text-muted-foreground">Click to Select</span>
                </div>
              </div>
            </div>

            <!-- Candidate 4: Monolithic Structure -->
            <div class="group relative flex flex-col rounded-xl border border-border/80 hover:border-primary/50 bg-card overflow-hidden">
              <div class="relative h-36 w-full flex items-center justify-between p-5 overflow-hidden border-b border-border/40 select-none bg-[#18181B] text-[#FAFAFA]">
                <div class="absolute right-2 top-0 bottom-0 w-36 pointer-events-none flex items-center justify-center opacity-60">
                  <svg viewBox="0 0 120 120" class="size-full" fill="none">
                    <polygon points="60,15 105,90 15,90" stroke="#71717A" stroke-width="2.5" stroke-dasharray="4 2" />
                    <circle cx="60" cy="65" r="14" fill="#71717A" fill-opacity="0.25" />
                  </svg>
                </div>
                <div class="relative z-10 flex flex-col justify-between h-full">
                  <span class="font-jetbrains text-4xl sm:text-5xl tracking-tight leading-none font-bold">C</span>
                  <span class="font-space text-[11px] opacity-85 tracking-normal">Aa Bb Gg 123 • Monolithic Structure</span>
                </div>
              </div>
              <div class="grid grid-cols-4 h-5 w-full border-b border-border/40">
                <div class="h-full w-full bg-[#18181B]"></div>
                <div class="h-full w-full bg-[#71717A]"></div>
                <div class="h-full w-full bg-[#E4E4E7]"></div>
                <div class="h-full w-full bg-[#FAFAFA]"></div>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <h3 class="text-base font-heading font-bold text-foreground tracking-tight">Monolithic Structure</h3>
                    <span class="font-mono text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                      JetBrains Mono + Space Grotesk
                    </span>
                  </div>
                  <p class="text-xs font-medium text-foreground/90 leading-relaxed mb-2.5">
                    Bold, resolute and uncompromising.
                  </p>
                  <div class="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">Why this fits</span>
                    <p class="text-[11px] text-muted-foreground leading-relaxed">
                      Reinforces zero-trust cryptographic solidity with stark, engineered typographic clarity.
                    </p>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span class="font-mono text-[10px] text-muted-foreground">Motif: geometric structure</span>
                  <span class="font-medium text-xs text-muted-foreground">Click to Select</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Free "Adjust" Strip for Selected Candidate -->
          <div class="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="size-4 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" x2="20" y1="21" y2="21"/><line x1="4" x2="20" y1="14" y2="14"/><line x1="4" x2="20" y1="7" y2="7"/><circle cx="8" cy="21" r="2"/><circle cx="16" cy="14" r="2"/><circle cx="12" cy="7" r="2"/></svg>
                <span class="font-heading text-xs font-bold text-foreground">
                  Fine-tune Selected Direction (Modern Precision)
                </span>
                <span class="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                  Free / No Credits
                </span>
              </div>
              <span class="text-[11px] text-muted-foreground hidden sm:inline">
                Adjustments do not count against your 3/3 regenerate cap
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <!-- Palette Variant -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-mono font-medium text-muted-foreground">
                  Palette Variant
                </label>
                <div class="grid grid-cols-3 gap-1">
                  <button class="px-2 py-1 text-xs rounded border capitalize ${isAdjusted ? 'bg-background border-border/80 text-muted-foreground' : 'bg-primary text-white border-primary font-medium'}">default</button>
                  <button class="px-2 py-1 text-xs rounded border capitalize ${isAdjusted ? 'bg-primary text-white border-primary font-medium' : 'bg-background border-border/80 text-muted-foreground'}">vibrant</button>
                  <button class="px-2 py-1 text-xs rounded border capitalize bg-background border-border/80 text-muted-foreground">muted</button>
                </div>
              </div>

              <!-- Contrast Balance -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-mono font-medium text-muted-foreground">
                  Contrast Balance
                </label>
                <div class="grid grid-cols-3 gap-1">
                  <button class="px-2 py-1 text-xs rounded border capitalize bg-background border-border/80 text-muted-foreground">soft</button>
                  <button class="px-2 py-1 text-xs rounded border capitalize ${isAdjusted ? 'bg-background border-border/80 text-muted-foreground' : 'bg-primary text-white border-primary font-medium'}">balanced</button>
                  <button class="px-2 py-1 text-xs rounded border capitalize ${isAdjusted ? 'bg-primary text-white border-primary font-medium' : 'bg-background border-border/80 text-muted-foreground'}">high</button>
                </div>
              </div>

              <!-- Display Weight -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-mono font-medium text-muted-foreground">
                  Display Weight
                </label>
                <div class="grid grid-cols-3 gap-1">
                  <button class="px-2 py-1 text-xs rounded border capitalize bg-background border-border/80 text-muted-foreground">regular</button>
                  <button class="px-2 py-1 text-xs rounded border capitalize ${isAdjusted ? 'bg-background border-border/80 text-muted-foreground' : 'bg-primary text-white border-primary font-medium'}">medium</button>
                  <button class="px-2 py-1 text-xs rounded border capitalize ${isAdjusted ? 'bg-primary text-white border-primary font-medium' : 'bg-background border-border/80 text-muted-foreground'}">bold</button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">
              Selected: <strong class="text-foreground font-semibold">Modern Precision</strong>
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button class="px-3 py-1.5 text-xs font-medium rounded-lg border border-border/60 text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 shadow-sm flex items-center gap-1.5">
              <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <span>Use Modern Precision</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </main>
</body>
</html>`;
}

function generateConfirmedCanvasHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Studio Canvas - Step 2 Confirmed</title>
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

  <!-- 1. Top Fixed Progress Bar (Steps 1 & 2 Completed, Step 3 Logo Type Unlocked) -->
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
      <div class="h-0.5 w-3 rounded-full bg-primary/40"></div>

      <!-- 3. Logo Type (Unlocked & Active) -->
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
        <span class="size-2 rounded-full bg-emerald-500"></span>
        STEP 2 COMPLETE
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

      <!-- Direction Result Card (Step 2 - Real Bundled Fonts, Space Grotesk + Plus Jakarta Sans) -->
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
          <!-- Feel Line -->
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
            <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1">Direction Feel</span>
            <p class="text-xs text-foreground font-medium leading-relaxed">Balanced, confident and technically refined.</p>
          </div>

          <!-- Color Palette Swatches -->
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-2">
              <svg class="size-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/></svg>
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider">Harmonized Palette</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="size-7 rounded-lg border border-black/10 bg-[#0F172A]" title="#0F172A"></div>
              <div class="size-7 rounded-lg border border-black/10 bg-[#2563EB]" title="#2563EB"></div>
              <div class="size-7 rounded-lg border border-black/10 bg-[#60A5FA]" title="#60A5FA"></div>
              <div class="size-7 rounded-lg border border-black/10 bg-[#F8FAFC]" title="#F8FAFC"></div>
            </div>
          </div>

          <!-- Type Pairing (Real Bundled Fonts Space Grotesk + Plus Jakarta Sans) -->
          <div class="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <svg class="size-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
              <span class="text-[10px] font-mono font-semibold uppercase tracking-wider">Type Pairing</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold text-foreground">Space Grotesk</span>
              <span class="text-[11px] text-muted-foreground font-medium">Body: Plus Jakarta Sans</span>
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
  console.log('Launching browser to capture Direction Modal screenshots...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });

  // 1. Initial 2x2 Direction Boards Modal
  console.log('Rendering 08_direction_board_grid.png...');
  await page.setContent(generateDirectionModalHtml('initial'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '08_direction_board_grid.png'), fullPage: false });

  // 2. Adjust Strip Fine-Tuning Active (Scroll to bottom of modal body)
  console.log('Rendering 09_direction_adjust_strip.png...');
  await page.setContent(generateDirectionModalHtml('adjusted'));
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, '09_direction_adjust_strip.png'), fullPage: false });

  // 3. Direction Confirmed on Canvas Stack
  console.log('Rendering 10_direction_confirmed_canvas.png...');
  await page.setContent(generateConfirmedCanvasHtml());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '10_direction_confirmed_canvas.png'), fullPage: false });

  // 4. Regenerate Cap Exhausted (0/3 LEFT)
  console.log('Rendering 11_direction_regenerate_cap_exhausted.png...');
  await page.setContent(generateDirectionModalHtml('exhausted'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, '11_direction_regenerate_cap_exhausted.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots generated successfully in outputs directory!');
}

renderScreenshots().catch(console.error);
