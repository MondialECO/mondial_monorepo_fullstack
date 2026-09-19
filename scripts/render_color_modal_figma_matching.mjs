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

function generateColorModalHtml(tab = 'website', theme = 'light') {
  const brandName = 'Mondial';
  const isDark = theme === 'dark';

  const roles = [
    {
      name: 'Primary',
      hex: '#3C61DD',
      rgb: '60, 97, 221',
      note: 'Buttons, links, the one thing you want clicked.',
      badge: 'Core Brand',
      ratio: '5.4:1',
      verdict: 'AA',
      isLocked: false,
      isEdited: false
    },
    {
      name: 'Secondary',
      hex: '#0E1726',
      rgb: '14, 23, 38',
      note: 'Headlines, navigation, dense text areas.',
      badge: null,
      ratio: '12.6:1',
      verdict: 'AAA',
      isLocked: true,
      isEdited: false
    },
    {
      name: 'Accent',
      hex: '#6366F1',
      rgb: '99, 102, 241',
      note: 'Highlights, badges, small emphasis only.',
      badge: null,
      ratio: '4.6:1',
      verdict: 'AA',
      isLocked: false,
      isEdited: true
    },
    {
      name: 'Background',
      hex: '#F8F9FB',
      rgb: '248, 249, 251',
      note: 'Page and surface background.',
      badge: null,
      ratio: null,
      verdict: null,
      isLocked: true,
      isEdited: false
    },
    {
      name: 'Text',
      hex: '#111827',
      rgb: '17, 24, 39',
      note: 'Body copy on background.',
      badge: null,
      ratio: '15.2:1',
      verdict: 'AAA',
      isLocked: false,
      isEdited: false
    }
  ];

  const primaryColor = '#3C61DD';
  const secondaryColor = '#0E1726';
  const accentColor = '#6366F1';
  const bgColor = '#F8F9FB';
  const textColor = '#111827';

  return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <title>Step 5 - Color System Modal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['DM Sans', 'sans-serif'],
            heading: ['Inter', 'sans-serif'],
            mono: ['DM Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'DM Sans', sans-serif; background-color: ${isDark ? '#090D16' : '#F1F3F7'}; margin: 0; }
    .font-heading { font-family: 'Inter', sans-serif; }
    .font-mono { font-family: 'DM Mono', monospace; }
  </style>
</head>
<body class="p-4 md:p-8 flex items-center justify-center min-h-screen">
  <div class="relative w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
    
    <!-- 1. Header & Progress Bar Track -->
    <div class="px-6 sm:px-8 pt-6 pb-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div class="flex items-start justify-between gap-4 pb-4">
        <div class="space-y-1.5 max-w-2xl">
          <h1 class="text-2xl sm:text-[26px] font-semibold tracking-tight text-slate-900 dark:text-white font-heading">
            Your colour system
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
            Five roles pulled from your logo. Each one has a job — change any of them without touching the rest.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium shadow-xs">
            <svg class="size-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            <span>Regenerate palette</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              2/3 LEFT
            </span>
          </div>

          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-sans">
            STEP <span class="font-mono font-semibold text-slate-900 dark:text-white mx-1">5</span> OF <span class="font-mono font-semibold text-slate-900 dark:text-white ml-1">6</span>
          </span>

          <button type="button" class="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- 6-Segment Workflow Steps Track -->
      <div class="grid grid-cols-6 gap-2 sm:gap-3.5 pt-2 pb-3.5">
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-emerald-500/80"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
            <svg class="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Strategy</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-emerald-500/80"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
            <svg class="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Direction</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-emerald-500/80"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
            <svg class="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Logo type</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-emerald-500/80"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
            <svg class="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Logo</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-blue-600"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white">
            <span>Colour</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-600">
            <svg class="size-2.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Typography</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Scrolling Modal Body -->
    <div class="p-6 sm:p-8 space-y-6 overflow-y-auto">
      
      <!-- VARIANT ROW: Palette Mood Filter Strip -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <span class="text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            PALETTE MOOD:
          </span>
          <div class="flex items-center gap-1.5">
            <button class="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs">
              As generated
            </button>
            <button class="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700">
              Calmer
            </button>
            <button class="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700">
              Warmer
            </button>
            <button class="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700">
              Higher contrast
            </button>
          </div>
        </div>

        <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
          Switching mood is free — it doesn't use a regenerate.
        </span>
      </div>

      <!-- SECTION A: 5 CANONICAL ROLE ROWS -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200/80 dark:divide-slate-800 overflow-hidden shadow-2xs">
        ${roles.map((r, idx) => `
          <div class="flex flex-col md:flex-row md:items-center justify-between p-4.5 gap-4 ${r.isEdited ? 'bg-blue-50/20 dark:bg-blue-950/20 border-l-2 border-l-blue-600' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}">
            <!-- Left: Swatch + Text -->
            <div class="flex items-center gap-4 min-w-[280px]">
              <div class="relative size-[68px] rounded-xl border ${r.name === 'Background' ? 'border-slate-300 dark:border-slate-700 shadow-inner' : 'border-black/10'} shrink-0 overflow-hidden shadow-2xs" style="background-color: ${r.hex}">
              </div>
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-base font-bold font-heading text-slate-900 dark:text-white">
                    ${r.name}
                  </span>
                  ${r.badge ? `<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">${r.badge}</span>` : ''}
                  ${r.isLocked ? `<span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"><svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> LOCKED</span>` : ''}
                  ${r.isEdited ? `<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">EDITED 1M AGO</span>` : ''}
                </div>
                <p class="text-xs font-sans text-slate-500 dark:text-slate-400 leading-normal max-w-sm">
                  ${r.note}
                </p>
              </div>
            </div>

            <!-- Center: Values Block -->
            <div class="flex items-center gap-6 min-w-[200px]">
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm font-bold font-mono text-slate-900 dark:text-white tracking-wide">
                    ${r.hex}
                  </span>
                  <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-colors">
                    <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
                <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
                  RGB ${r.rgb}
                </span>
              </div>
            </div>

            <!-- Contrast Block -->
            <div class="flex items-center justify-start md:justify-center min-w-[140px]">
              ${r.name === 'Background' ? `
                <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
                  Used as a ground, not for text.
                </span>
              ` : `
                <span class="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                  ${r.ratio} · ${r.verdict}
                </span>
              `}
            </div>

            <!-- Right: Controls -->
            <div class="flex items-center gap-1.5 justify-end">
              <button class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title="Adjust this role only — free">
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>
              </button>
              <button class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title="Copy Hex">
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="p-2 rounded-lg border transition-colors ${r.isLocked ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700'}">
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- SECTION B: LIVE APPLICATION PREVIEW ("How it looks together") -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold font-heading text-slate-900 dark:text-white">
            How it looks together
          </h3>

          <div class="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold ${tab === 'website' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}">
              <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              <span>Website</span>
            </button>
            <button class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium ${tab === 'invoice' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}">
              <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Invoice</span>
            </button>
            <button class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium ${tab === 'deck' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}">
              <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>
              <span>Deck</span>
            </button>
          </div>
        </div>

        <!-- 220px Tall Preview Band -->
        <div class="h-[220px] rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-hidden relative shadow-inner" style="background-color: ${bgColor}">
          ${tab === 'website' ? `
            <div class="flex flex-col justify-between h-full">
              <!-- Top Bar -->
              <div class="flex items-center justify-between pb-3 border-b border-black/10">
                <div class="flex items-center gap-2">
                  <div class="size-5 rounded-md flex items-center justify-center font-bold text-xs" style="background-color: ${primaryColor}; color: ${bgColor}">
                    M
                  </div>
                  <span class="text-xs font-bold font-heading" style="color: ${secondaryColor}">
                    ${brandName}
                  </span>
                </div>

                <div class="flex items-center gap-3 text-[11px] font-medium" style="color: ${textColor}">
                  <span class="opacity-80">Platform</span>
                  <span class="opacity-80">Solutions</span>
                  <span class="opacity-80">Pricing</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold" style="background-color: ${accentColor}15; color: ${accentColor}; border: 1px solid ${accentColor}30">
                    Live Network
                  </span>
                </div>
              </div>

              <!-- Hero Body -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div class="space-y-1">
                  <h4 class="text-lg font-bold font-heading tracking-tight leading-snug" style="color: ${textColor}">
                    Empowering Next-Gen Autonomous Systems
                  </h4>
                  <p class="text-xs font-sans max-w-md leading-relaxed" style="color: ${textColor}; opacity: 0.75">
                    Engineered with pure contrast harmony, live WCAG 2.1 compliance, and verified enterprise security.
                  </p>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button class="px-4 py-2 rounded-lg text-xs font-bold shadow-xs" style="background-color: ${primaryColor}; color: ${bgColor}">
                    Get Started
                  </button>
                  <button class="px-3.5 py-2 rounded-lg text-xs font-semibold border" style="background-color: transparent; color: ${textColor}; border-color: ${textColor}30">
                    Documentation
                  </button>
                </div>
              </div>

              <!-- Footer Stats Strip -->
              <div class="flex items-center gap-6 pt-2 border-t border-black/10 text-[10px] font-mono" style="color: ${textColor}; opacity: 0.65">
                <span>99.99% Uptime SLA</span>
                <span>·</span>
                <span>Zero-Trust Architecture</span>
                <span>·</span>
                <span>Global Edge Deployments</span>
              </div>
            </div>
          ` : tab === 'invoice' ? `
            <div class="flex flex-col justify-between h-full text-xs">
              <div class="flex items-center justify-between pb-3 border-b border-black/10">
                <div class="flex items-center gap-2">
                  <div class="size-5 rounded-md flex items-center justify-center font-bold text-xs" style="background-color: ${primaryColor}; color: ${bgColor}">
                    M
                  </div>
                  <span class="font-bold text-sm font-heading" style="color: ${secondaryColor}">
                    ${brandName} Technologies Inc.
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[11px]" style="color: ${textColor}; opacity: 0.7">
                    #INV-2026-089
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold" style="background-color: ${accentColor}15; color: ${accentColor}; border: 1px solid ${accentColor}30">
                    PAID
                  </span>
                </div>
              </div>

              <div class="space-y-1.5 py-2">
                <div class="flex justify-between font-mono text-[11px] pb-1 border-b border-black/5" style="color: ${textColor}; opacity: 0.6">
                  <span>DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>
                <div class="flex justify-between font-medium text-xs" style="color: ${textColor}">
                  <span>Enterprise Platform Subscription (Annual)</span>
                  <span class="font-mono font-bold">$12,000.00</span>
                </div>
                <div class="flex justify-between font-medium text-xs" style="color: ${textColor}">
                  <span>Dedicated Edge Compute Cluster</span>
                  <span class="font-mono font-bold">$3,500.00</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-black/10">
                <span class="text-[11px] font-mono" style="color: ${textColor}; opacity: 0.7">
                  DUE UPON RECEIPT
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold" style="color: ${textColor}">
                    TOTAL:
                  </span>
                  <span class="text-base font-bold font-mono" style="color: ${primaryColor}">
                    $15,500.00 USD
                  </span>
                </div>
              </div>
            </div>
          ` : `
            <div class="flex flex-col justify-between h-full">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold" style="background-color: ${accentColor}15; color: ${accentColor}; border: 1px solid ${accentColor}30">
                    EXECUTIVE SUMMARY
                  </span>
                  <span class="text-xs font-mono" style={{ color: textColor, opacity: 0.5 }}>
                    SLIDE 04
                  </span>
                </div>
                <span class="text-xs font-bold font-heading" style="color: ${secondaryColor}">
                  ${brandName}
                </span>
              </div>

              <div class="space-y-1.5 py-1">
                <h4 class="text-xl font-bold font-heading tracking-tight" style="color: ${textColor}">
                  Accelerating Market Adoption with Autonomous Value
                </h4>
                <p class="text-xs max-w-lg leading-relaxed" style="color: ${textColor}; opacity: 0.75">
                  Capturing market share through deterministic infrastructure, unified APIs, and zero friction creator-to-investor liquidity.
                </p>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-2 border-t border-black/10">
                <div class="p-2.5 rounded-lg border flex flex-col" style="background-color: ${primaryColor}08; border-color: ${primaryColor}20">
                  <span class="text-base font-bold font-mono" style="color: ${primaryColor}">+142%</span>
                  <span class="text-[10px] font-mono" style="color: ${textColor}; opacity: 0.7">MoM Growth</span>
                </div>
                <div class="p-2.5 rounded-lg border flex flex-col" style="background-color: ${accentColor}08; border-color: ${accentColor}20">
                  <span class="text-base font-bold font-mono" style="color: ${accentColor}">99.4%</span>
                  <span class="text-[10px] font-mono" style="color: ${textColor}; opacity: 0.7">Retention</span>
                </div>
                <div class="p-2.5 rounded-lg border flex flex-col" style="background-color: ${secondaryColor}08; border-color: ${secondaryColor}20">
                  <span class="text-base font-bold font-mono" style="color: ${secondaryColor}">$4.2M</span>
                  <span class="text-[10px] font-mono" style="color: ${textColor}; opacity: 0.7">Annual ARR</span>
                </div>
              </div>
            </div>
          `}
        </div>
      </div>

    </div>

    <!-- 3. Modal Footer -->
    <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 shrink-0">
      <div class="flex items-center gap-2 text-xs text-slate-500 font-mono">
        <svg class="size-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span>5 Canonical Roles · Free Hex Edits · 3-Cap Palette Regen</span>
      </div>

      <div class="flex items-center gap-3">
        <button class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button class="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs">
          <span>Confirm Colour System</span>
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>

  </div>
</body>
</html>`;
}

async function renderScreenshots() {
  console.log('Launching browser for Color System Modal screenshots...');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  const scenarios = [
    { tab: 'website', theme: 'light', name: '01_color_modal_website_tab_light.png' },
    { tab: 'invoice', theme: 'light', name: '02_color_modal_invoice_tab_light.png' },
    { tab: 'deck', theme: 'light', name: '03_color_modal_deck_tab_light.png' },
    { tab: 'website', theme: 'dark', name: '04_color_modal_website_tab_dark.png' },
  ];

  for (const s of scenarios) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const html = generateColorModalHtml(s.tab, s.theme);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const outPath = path.join(outputDir, s.name);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot: ${outPath}`);
  }

  await browser.close();
  console.log('Done rendering Color System Modal screenshots.');
}

renderScreenshots().catch(console.error);
