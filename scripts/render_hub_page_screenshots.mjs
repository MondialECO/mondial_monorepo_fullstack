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

function generateHubPageHtml() {
  const brandName = 'CyberLock Sentinel';
  const displayFamily = 'Space Grotesk';
  const textFamily = 'Plus Jakarta Sans';
  const logoFamily = 'Space Grotesk';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Kit Hub - ${brandName}</title>
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
      background-color: #FAFAFA;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="relative flex flex-col min-h-screen w-full">

  <!-- Top Global Nav Breadcrumb -->
  <nav class="sticky top-0 z-30 flex w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md px-8 py-3.5 items-center justify-between">
    <div class="flex items-center gap-3">
      <button class="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        <span>Back to Idea Overview</span>
      </button>
      <span class="text-zinc-300">/</span>
      <span class="font-mono text-xs font-bold text-zinc-900">${brandName}</span>
      <span class="text-zinc-300">/</span>
      <span class="text-xs text-zinc-500 font-medium">Brand Kit</span>
    </div>

    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
        <svg class="size-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
        COMPLETE & SYNCED
      </span>
    </div>
  </nav>

  <!-- Main Container -->
  <main class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-8 py-10">

    <!-- 1. Hero / Header Section -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-200 pb-8">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-extrabold tracking-tight text-zinc-900 font-heading">
            ${brandName} Brand Kit
          </h1>
          <span class="font-mono text-xs font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded">
            v3.0 (Active)
          </span>
        </div>
        <p class="text-sm text-zinc-500 max-w-2xl">
          Unified visual identity design tokens, production SVG assets, color scales, and typography specs.
        </p>
      </div>

      <!-- Action Cluster: Exactly ONE filled blue button -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <button class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 shadow-sm transition-colors">
          <svg class="size-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Version History</span>
        </button>

        <button class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 shadow-sm transition-colors">
          <svg class="size-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          <span>Open Studio</span>
        </button>

        <button class="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0052FF] hover:bg-[#0047DB] rounded-lg shadow-sm transition-colors">
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span>Download Brand Kit (.zip)</span>
        </button>
      </div>
    </section>

    <!-- 2. Logo & Variations Section -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-zinc-900 font-heading">Logo Assets & Variations</h2>
          <p class="text-xs text-zinc-500">7 production SVG assets derived from the approved Sentinel Shield mark.</p>
        </div>
        <button class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50">
          <svg class="size-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Edit in Studio
        </button>
      </div>

      <!-- Master Hero Mark + 6 Variations Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Master Mark (Dark Background) -->
        <div class="md:col-span-1 p-6 rounded-2xl bg-[#09090B] border border-zinc-800 flex flex-col justify-between relative group shadow-sm">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">PRIMARY HERO MARK</span>
            <span class="font-mono text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded">Vector SVG</span>
          </div>

          <div class="py-8 flex flex-col items-center justify-center gap-3">
            <div class="size-16 rounded-2xl bg-zinc-800 flex items-center justify-center p-3 shadow-inner">
              <svg class="size-10 text-[#0052FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span class="text-xl font-bold text-white tracking-tight" style="font-family: '${logoFamily}', sans-serif;">
              ${brandName}
            </span>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-zinc-800/80">
            <span class="font-mono text-[11px] text-zinc-400">Sentinel Shield Lockup</span>
            <button class="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded transition-colors">
              <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              Copy SVG
            </button>
          </div>
        </div>

        <!-- 6 Variations Grid -->
        <div class="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <!-- Var 1: Primary Lockup -->
          <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col justify-between gap-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold text-zinc-500">Primary Lockup</span>
              <button class="font-mono text-[10px] text-zinc-400 hover:text-zinc-800">Copy</button>
            </div>
            <div class="py-4 flex items-center justify-center gap-2">
              <svg class="size-5 text-[#0052FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span class="font-bold text-xs text-zinc-900">${brandName}</span>
            </div>
            <span class="font-mono text-[9px] text-zinc-400 text-center">Horizontal Lockup</span>
          </div>

          <!-- Var 2: Secondary / Stacked -->
          <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col justify-between gap-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold text-zinc-500">Secondary Lockup</span>
              <button class="font-mono text-[10px] text-zinc-400 hover:text-zinc-800">Copy</button>
            </div>
            <div class="py-3 flex flex-col items-center justify-center gap-1">
              <svg class="size-6 text-[#0052FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span class="font-bold text-[11px] text-zinc-900 text-center leading-none">${brandName}</span>
            </div>
            <span class="font-mono text-[9px] text-zinc-400 text-center">Stacked Lockup</span>
          </div>

          <!-- Var 3: Symbol Mark Only -->
          <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col justify-between gap-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold text-zinc-500">Symbol Mark</span>
              <button class="font-mono text-[10px] text-zinc-400 hover:text-zinc-800">Copy</button>
            </div>
            <div class="py-3 flex items-center justify-center">
              <div class="size-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                <svg class="size-6 text-[#0052FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>
            <span class="font-mono text-[9px] text-zinc-400 text-center">Standalone Icon</span>
          </div>

          <!-- Var 4: Monochrome Light -->
          <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col justify-between gap-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold text-zinc-500">Monochrome Light</span>
              <button class="font-mono text-[10px] text-zinc-400 hover:text-zinc-800">Copy</button>
            </div>
            <div class="py-4 flex items-center justify-center gap-2">
              <svg class="size-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span class="font-bold text-xs text-black">${brandName}</span>
            </div>
            <span class="font-mono text-[9px] text-zinc-400 text-center">100% Solid Black</span>
          </div>

          <!-- Var 5: Monochrome Dark -->
          <div class="p-4 rounded-xl border border-zinc-800 bg-[#09090B] flex flex-col justify-between gap-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold text-zinc-400">Monochrome Dark</span>
              <button class="font-mono text-[10px] text-zinc-400 hover:text-white">Copy</button>
            </div>
            <div class="py-4 flex items-center justify-center gap-2">
              <svg class="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span class="font-bold text-xs text-white">${brandName}</span>
            </div>
            <span class="font-mono text-[9px] text-zinc-500 text-center">100% Reverse White</span>
          </div>

          <!-- Var 6: Favicon / App Icon -->
          <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col justify-between gap-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold text-zinc-500">Favicon (16/32px)</span>
              <button class="font-mono text-[10px] text-zinc-400 hover:text-zinc-800">Copy</button>
            </div>
            <div class="py-3 flex items-center justify-center gap-3">
              <div class="size-8 rounded bg-[#0052FF] flex items-center justify-center text-white">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div class="size-4 rounded-xs bg-[#0052FF] flex items-center justify-center text-white">
                <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>
            <span class="font-mono text-[9px] text-zinc-400 text-center">Pixel-aligned Icons</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Harmonized Colour Palette Section -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-zinc-900 font-heading">Colour System & Tokens</h2>
          <p class="text-xs text-zinc-500">5 canonical roles with deterministic WCAG contrast ratios against #FFFFFF background.</p>
        </div>
        <button class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50">
          <svg class="size-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Edit in Studio
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <!-- Swatch 1: Primary -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
          <div class="h-16 w-full rounded-lg bg-[#0F172A] border border-zinc-200/50 shadow-inner"></div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-900">Primary</span>
              <span class="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">14.8:1 AAA</span>
            </div>
            <div class="font-mono text-xs text-zinc-700 font-semibold">#0F172A</div>
            <div class="font-mono text-[10px] text-zinc-400">rgb(15, 23, 42)</div>
          </div>
        </div>

        <!-- Swatch 2: Secondary -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
          <div class="h-16 w-full rounded-lg bg-[#2563EB] border border-zinc-200/50 shadow-inner"></div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-900">Secondary</span>
              <span class="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold">4.6:1 AA</span>
            </div>
            <div class="font-mono text-xs text-zinc-700 font-semibold">#2563EB</div>
            <div class="font-mono text-[10px] text-zinc-400">rgb(37, 99, 235)</div>
          </div>
        </div>

        <!-- Swatch 3: Accent -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
          <div class="h-16 w-full rounded-lg bg-[#10B981] border border-zinc-200/50 shadow-inner"></div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-900">Accent</span>
              <span class="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold">3.4:1 AA Large</span>
            </div>
            <div class="font-mono text-xs text-zinc-700 font-semibold">#10B981</div>
            <div class="font-mono text-[10px] text-zinc-400">rgb(16, 185, 129)</div>
          </div>
        </div>

        <!-- Swatch 4: Background -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
          <div class="h-16 w-full rounded-lg bg-[#FFFFFF] border border-zinc-300 shadow-inner"></div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-900">Background</span>
              <span class="font-mono text-[10px] text-zinc-400">Canvas</span>
            </div>
            <div class="font-mono text-xs text-zinc-700 font-semibold">#FFFFFF</div>
            <div class="font-mono text-[10px] text-zinc-400">rgb(255, 255, 255)</div>
          </div>
        </div>

        <!-- Swatch 5: Text -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-xs">
          <div class="h-16 w-full rounded-lg bg-[#09090B] border border-zinc-200/50 shadow-inner"></div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-900">Text</span>
              <span class="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">18.2:1 AAA</span>
            </div>
            <div class="font-mono text-xs text-zinc-700 font-semibold">#09090B</div>
            <div class="font-mono text-[10px] text-zinc-400">rgb(9, 9, 11)</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Harmonized Typography Section -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-zinc-900 font-heading">Typography Specimens & Scale</h2>
          <p class="text-xs text-zinc-500">4 canonical roles with optical weights and size scales.</p>
        </div>
        <button class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50">
          <svg class="size-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Edit in Studio
        </button>
      </div>

      <div class="space-y-3">
        <!-- Role 1: Logo type (Permanent Mark) -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase">ROLE 1</span>
              <span class="text-xs font-bold text-zinc-900">Logo type</span>
              <span class="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                <svg class="size-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                Permanent mark
              </span>
            </div>
            <div class="text-xl font-bold text-zinc-900" style="font-family: '${logoFamily}', sans-serif;">
              ${brandName}
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span>Family: ${logoFamily}</span>
            <span>·</span>
            <span>Weight: 700 Bold</span>
          </div>
        </div>

        <!-- Role 2: Heading -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-1 max-w-xl">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase">ROLE 2</span>
              <span class="text-xs font-bold text-zinc-900">Heading</span>
            </div>
            <div class="text-xl font-bold text-zinc-900" style="font-family: '${displayFamily}', sans-serif;">
              Zero compromise enterprise security architecture
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span>Family: ${displayFamily}</span>
            <span>·</span>
            <span>Weight: 700 Bold</span>
            <span>·</span>
            <span>Scale: 32px</span>
          </div>
        </div>

        <!-- Role 3: Body -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-1 max-w-xl">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase">ROLE 3</span>
              <span class="text-xs font-bold text-zinc-900">Body</span>
            </div>
            <div class="text-xs text-zinc-600 leading-relaxed" style="font-family: '${textFamily}', sans-serif;">
              Crafted specifically for enterprise SecOps teams. Autonomous threat containment, zero-trust cryptographic verification, and intuitive telemetry interfaces.
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span>Family: ${textFamily}</span>
            <span>·</span>
            <span>Weight: 400 Regular</span>
            <span>·</span>
            <span>Scale: 16px</span>
          </div>
        </div>

        <!-- Role 4: Button & label -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] font-bold text-zinc-400 uppercase">ROLE 4</span>
              <span class="text-xs font-bold text-zinc-900">Button & label</span>
            </div>
            <div class="pt-1">
              <span class="inline-block px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold" style="font-family: '${textFamily}', sans-serif;">
                Explore ${brandName}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span>Family: ${textFamily}</span>
            <span>·</span>
            <span>Weight: 600 SemiBold</span>
            <span>·</span>
            <span>Scale: 14px</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Strategy Facts & Visual Direction Overview -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Strategy Card -->
      <div class="p-5 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-xs">
        <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 class="text-sm font-bold text-zinc-900">Brand Strategy Constraints</h3>
          <button class="font-mono text-xs text-zinc-500 hover:text-zinc-900">Edit</button>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div><span class="font-mono text-[10px] text-zinc-400 block">INDUSTRY</span><span class="font-semibold text-zinc-800">Cybersecurity</span></div>
          <div><span class="font-mono text-[10px] text-zinc-400 block">AUDIENCE</span><span class="font-semibold text-zinc-800">Enterprise SecOps</span></div>
          <div><span class="font-mono text-[10px] text-zinc-400 block">TRAITS</span><span class="font-semibold text-zinc-800">Precise, Resilient</span></div>
          <div><span class="font-mono text-[10px] text-zinc-400 block">TONE</span><span class="font-semibold text-zinc-800">Authoritative</span></div>
        </div>
      </div>

      <!-- Direction Card -->
      <div class="p-5 rounded-xl border border-zinc-200 bg-white space-y-4 shadow-xs">
        <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 class="text-sm font-bold text-zinc-900">Visual Direction</h3>
          <button class="font-mono text-xs text-zinc-500 hover:text-zinc-900">Edit</button>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-zinc-900">Modern Precision</span>
            <span class="font-mono text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">Direction 2 of 4</span>
          </div>
          <p class="text-xs text-zinc-500">
            Balanced and technically refined visual architecture with high contrast telemetry displays.
          </p>
        </div>
      </div>
    </section>

    <!-- 6. Version History Panel (Bounded 3 snapshots) -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">Version History</h2>
          <span class="font-mono text-[10px] text-zinc-400">(Latest 3 Snapshots)</span>
        </div>
        <span class="font-mono text-xs text-zinc-400">Auto-saved on step confirmations</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Snapshot 1: Current -->
        <div class="p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/20 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-emerald-800">v3.0 (Active)</span>
            <span class="font-mono text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded font-bold">CURRENT</span>
          </div>
          <div class="text-xs text-zinc-600 font-medium">Typography harmonized & completed</div>
          <div class="font-mono text-[10px] text-zinc-400">Today at 18:12 · Auto-saved</div>
        </div>

        <!-- Snapshot 2: Previous -->
        <div class="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2 hover:border-zinc-300 transition-colors">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-zinc-700">v2.0</span>
            <button class="font-mono text-[10px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded transition-colors">
              Restore
            </button>
          </div>
          <div class="text-xs text-zinc-600">Colours confirmed (Modern Precision)</div>
          <div class="font-mono text-[10px] text-zinc-400">Today at 18:01 · Auto-saved</div>
        </div>

        <!-- Snapshot 3: Earliest -->
        <div class="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2 hover:border-zinc-300 transition-colors">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-zinc-700">v1.0</span>
            <button class="font-mono text-[10px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded transition-colors">
              Restore
            </button>
          </div>
          <div class="text-xs text-zinc-600">Logo variations generated</div>
          <div class="font-mono text-[10px] text-zinc-400">Today at 16:14 · Auto-saved</div>
        </div>
      </div>
    </section>

    <!-- 7. "Used by" Honest Tiles (Zero Fabrication: 4 generators show "Not connected yet") -->
    <section class="space-y-3">
      <div>
        <h2 class="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">Downstream Generators</h2>
        <p class="text-xs text-zinc-500">Live integration status with Phase 2 generator pipelines.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <!-- Tile 1: Business Plan -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-2 shadow-xs">
          <div class="flex items-center gap-2 text-zinc-700">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span class="text-xs font-bold">Business Plan</span>
          </div>
          <span class="inline-block font-mono text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
            Not connected yet
          </span>
        </div>

        <!-- Tile 2: Landing Page -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-2 shadow-xs">
          <div class="flex items-center gap-2 text-zinc-700">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
            <span class="text-xs font-bold">Landing Page</span>
          </div>
          <span class="inline-block font-mono text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
            Not connected yet
          </span>
        </div>

        <!-- Tile 3: Pitch Deck -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-2 shadow-xs">
          <div class="flex items-center gap-2 text-zinc-700">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
            <span class="text-xs font-bold">Pitch Deck</span>
          </div>
          <span class="inline-block font-mono text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
            Not connected yet
          </span>
        </div>

        <!-- Tile 4: Invoices & Receipts -->
        <div class="p-4 rounded-xl border border-zinc-200 bg-white space-y-2 shadow-xs">
          <div class="flex items-center gap-2 text-zinc-700">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/></svg>
            <span class="text-xs font-bold">Invoices & Receipts</span>
          </div>
          <span class="inline-block font-mono text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
            Not connected yet
          </span>
        </div>
      </div>
    </section>

    <!-- 8. Coming Soon Phase 2 Brand Modules -->
    <section class="p-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/40 space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs font-bold text-zinc-500 uppercase tracking-wider">UPCOMING EXTENSIONS</span>
        <span class="font-mono text-[10px] text-zinc-400 bg-white px-2.5 py-0.5 rounded border border-zinc-200">Phase 2.5 Roadmap</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-600">
        <div class="space-y-1">
          <span class="font-bold text-zinc-800">Social Media Asset Kits</span>
          <p class="text-zinc-500 text-[11px]">Automated banners, avatars, and post templates styled with brand tokens.</p>
        </div>
        <div class="space-y-1">
          <span class="font-bold text-zinc-800">Interactive Guidelines Portal</span>
          <p class="text-zinc-500 text-[11px]">Shareable web URL with token copy and live component preview for external agencies.</p>
        </div>
        <div class="space-y-1">
          <span class="font-bold text-zinc-800">Multi-Channel Export Presets</span>
          <p class="text-zinc-500 text-[11px]">Figma tokens, Tailwind CSS themes, and native iOS / Android color catalogs.</p>
        </div>
      </div>
    </section>

  </main>

</body>
</html>`;
}

function generateCascadeWarningDialogHtml() {
  const brandName = 'CyberLock Sentinel';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cascade Warning Dialog</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Inter', 'DM Sans', sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #FAFAFA;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="relative flex flex-col min-h-screen w-full">

  <!-- Background Dimmed Hub -->
  <div class="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    
    <!-- Cascade Warning Dialog -->
    <div class="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5">
      
      <!-- Warning Header -->
      <div class="flex items-start gap-4">
        <div class="size-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-600">
          <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div class="space-y-1">
          <span class="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">
            Upstream Edit Warning
          </span>
          <h3 class="text-base font-bold text-zinc-900">
            Editing Visual Direction will invalidate downstream sections
          </h3>
          <p class="text-xs text-zinc-500">
            Revising this upstream step changes the foundational visual rules of ${brandName}.
          </p>
        </div>
      </div>

      <!-- Invalidation Bullet List -->
      <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5 text-xs">
        <span class="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
          THE FOLLOWING COMPLETED STEPS WILL BE RESET & RECALCULATED:
        </span>
        <ul class="space-y-1.5 text-zinc-700">
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-amber-500"></span>
            <span><strong>Step 4: Logo Concept & 7 Variations</strong> (palette & style bindings)</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-amber-500"></span>
            <span><strong>Step 5: Harmonized Colour System</strong> (5 roles will be re-seeded)</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-amber-500"></span>
            <span><strong>Step 6: Harmonized Typography System</strong> (font pairings & scales)</span>
          </li>
        </ul>
      </div>

      <p class="text-xs text-zinc-500">
        A version snapshot of your current kit will be preserved automatically in Version History before opening the Studio.
      </p>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
        <button class="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors">
          Cancel & Keep Current Kit
        </button>
        <button class="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors">
          Proceed to Visual Direction
        </button>
      </div>

    </div>
  </div>

</body>
</html>`;
}

function generateVersionHistoryRestoreDialogHtml() {
  const brandName = 'CyberLock Sentinel';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Version History Restore Dialog</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Inter', 'DM Sans', sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #FAFAFA;
      color: #09090B;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="relative flex flex-col min-h-screen w-full">

  <!-- Background Dimmed Hub -->
  <div class="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    
    <!-- Restore Confirmation Dialog -->
    <div class="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5">
      
      <!-- Warning Header -->
      <div class="flex items-start gap-4">
        <div class="size-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-[#0052FF]">
          <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </div>
        <div class="space-y-1">
          <span class="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
            Confirm Snapshot Restore
          </span>
          <h3 class="text-base font-bold text-zinc-900">
            Restore Brand Kit to v2.0?
          </h3>
          <p class="text-xs text-zinc-500">
            This will replace the current active state with snapshot taken today at 18:01.
          </p>
        </div>
      </div>

      <!-- Detail Box -->
      <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-wider">TARGET SNAPSHOT</span>
          <span class="font-mono text-[10px] text-zinc-600 bg-zinc-200/60 px-2 py-0.5 rounded">v2.0</span>
        </div>
        <div class="text-xs text-zinc-700 font-semibold">
          Colours confirmed (Modern Precision palette)
        </div>
        <p class="text-xs text-zinc-500 pt-1 border-t border-zinc-200/60">
          An automatic backup of your current active kit (v3.0) will be taken immediately before restoring so no work is ever lost.
        </p>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
        <button class="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors">
          Cancel
        </button>
        <button class="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-sm transition-colors">
          Restore Snapshot v2.0
        </button>
      </div>

    </div>
  </div>

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

  console.log('Rendering Screenshot 22: Brand Kit Hub Full Page...');
  await page.setContent(generateHubPageHtml(), { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, '22_brand_kit_hub_full_page.png'), fullPage: true });

  console.log('Rendering Screenshot 23: Cascade Warning Dialog...');
  await page.setContent(generateCascadeWarningDialogHtml(), { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, '23_hub_cascade_warning_dialog.png'), fullPage: true });

  console.log('Rendering Screenshot 24: Version History Restore Dialog...');
  await page.setContent(generateVersionHistoryRestoreDialogHtml(), { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, '24_hub_version_history_restore_dialog.png'), fullPage: true });

  await browser.close();
  console.log('All hub page screenshots successfully rendered.');
}

renderScreenshots().catch(console.error);
