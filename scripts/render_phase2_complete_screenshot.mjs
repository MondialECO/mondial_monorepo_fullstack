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

function generateCompletePageHtml() {
  const brandName = 'Aura Botanica';
  const tagline = 'Bio-adaptive organic skincare powered by cellular chronobiology.';
  const problem = 'Synthetic preservatives and endocrine disruptors in traditional cosmetics cause chronic micro-inflammation and cellular barrier breakdown.';
  const solution = 'AI-formulated organic micro-algae extracts and cold-pressed botanical lipids synchronized to circadian skin rhythm.';
  const displayFont = 'Cabinet Grotesk';
  const textFont = 'Plus Jakarta Sans';
  const colors = [
    { role: 'Primary', hex: '#13131B' },
    { role: 'Secondary', hex: '#607EE3' },
    { role: 'Accent', hex: '#009C63' },
    { role: 'Background', hex: '#FFFFFF' },
    { role: 'Text', hex: '#0B1120' },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Phase 2 Complete - ${brandName}</title>
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
  </style>
</head>
<body class="bg-[#FAFAFA] text-[#09090B] min-h-screen flex flex-col antialiased">
  <div class="mx-auto w-full max-w-[640px] px-4 sm:px-6 py-10 sm:py-12 flex flex-col gap-8">
    
    <!-- Success Header -->
    <div class="flex flex-col items-center gap-2.5 text-center">
      <div class="size-16 rounded-full flex items-center justify-center bg-white border border-[#E4E4E7] shadow-xs">
        <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0052FF]/10 border border-[#0052FF]/20">
        <svg class="w-3.5 h-3.5 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
        </svg>
        <span class="text-xs font-semibold text-[#0052FF]">Branding Complete</span>
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-[#09090B]">
        Project Identity Ready.
      </h1>
      <p class="text-sm text-[#71717A] max-w-[500px] leading-relaxed">
        Your project name, visual identity, and strategic direction are complete. Phase 3 AI will generate your full Masterplan.
      </p>
    </div>

    <!-- Card Group -->
    <div class="flex flex-col gap-4">

      <!-- Identity Card -->
      <div class="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-sm flex flex-col gap-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="size-16 rounded-xl border border-[#E4E4E7] bg-white p-2 flex items-center justify-center shrink-0 shadow-xs">
              <svg viewBox="0 0 100 100" class="size-full">
                <rect width="100" height="100" rx="16" fill="#13131B"/>
                <text x="50" y="68" font-family="'Plus Jakarta Sans', sans-serif" font-size="52" font-weight="700" fill="#FFFFFF" text-anchor="middle">A</text>
              </svg>
            </div>
            <div class="space-y-1">
              <h3 class="text-xl font-bold text-[#09090B] tracking-tight">${brandName}</h3>
              <p class="text-xs text-[#71717A] leading-relaxed line-clamp-2">${tagline}</p>
            </div>
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0 self-start">
            <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-xs font-semibold">Identity ready</span>
          </div>
        </div>

        <!-- Compact Visual Identity Preview Strip -->
        <div class="p-3.5 rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-4 flex-wrap">
            <!-- 5 Swatches -->
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4 5 5 0 013-4.5 4 4 0 014.5-3 5 5 0 014.5 3 4 4 0 013 4.5 4 4 0 01-4 4H7z"></path>
              </svg>
              <div class="flex items-center -space-x-1">
                ${colors.map(c => `
                  <div class="size-5 rounded-full border border-white shadow-2xs shrink-0" style="background-color: ${c.hex};" title="${c.role}: ${c.hex}"></div>
                `).join('')}
              </div>
            </div>

            <div class="h-4 w-px bg-[#E4E4E7] hidden sm:block"></div>

            <!-- Typography Pairings -->
            <div class="flex items-center gap-1.5 text-[#71717A] font-mono text-[11px]">
              <svg class="w-3.5 h-3.5 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
              <span class="text-[#09090B] font-semibold">${displayFont}</span>
              <span>/</span>
              <span>${textFont}</span>
            </div>
          </div>

          <!-- Hub Link -->
          <button class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0052FF] hover:underline cursor-pointer">
            <span>View full Brand Kit</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </button>
        </div>

        <div class="flex flex-col gap-3">
          <div class="rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/40 p-4 space-y-1">
            <span class="text-xs font-bold text-[#09090B] uppercase tracking-wider block">Core Problem</span>
            <p class="text-xs text-[#71717A] leading-relaxed">${problem}</p>
          </div>
          <div class="rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/40 p-4 space-y-1">
            <span class="text-xs font-bold text-[#09090B] uppercase tracking-wider block">Solutions</span>
            <p class="text-xs text-[#71717A] leading-relaxed">${solution}</p>
          </div>
        </div>
      </div>

      <!-- Masterplan Card -->
      <div class="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-sm flex flex-col gap-5">
        <div class="space-y-1">
          <span class="text-xs font-bold text-[#0052FF] uppercase tracking-wider">Phase 3 Unlocked!</span>
          <h3 class="text-lg font-bold text-[#09090B]">The Masterplan</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/30 p-3.5">
            <svg class="w-4 h-4 text-[#0052FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span class="text-xs font-semibold text-[#09090B]">AI Business Plan</span>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/30 p-3.5">
            <svg class="w-4 h-4 text-[#0052FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span class="text-xs font-semibold text-[#09090B]">AI Financial Forecast</span>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/30 p-3.5">
            <svg class="w-4 h-4 text-[#0052FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span class="text-xs font-semibold text-[#09090B]">Legal & Structural Checklist</span>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]/30 p-3.5">
            <svg class="w-4 h-4 text-[#0052FF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span class="text-xs font-semibold text-[#09090B]">Formation Generator</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Launch Primary Button -->
    <button class="w-full rounded-xl py-4 font-bold bg-[#0052FF] text-white hover:bg-[#0047E0] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-base">
      <span>Launch Masterplan</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
      </svg>
    </button>

  </div>
</body>
</html>`;
}

async function renderScreenshot() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge' });
  } catch {
    browser = await chromium.launch({ channel: 'chrome' });
  }
  const page = await browser.newPage({
    viewport: { width: 1280, height: 950 },
    deviceScaleFactor: 2,
  });

  const html = generateCompletePageHtml();
  await page.setContent(html, { waitUntil: 'networkidle' });

  const destPath = path.join(outputDir, '26_phase2_complete_screen_updated.png');
  await page.screenshot({ path: destPath, fullPage: true });

  console.log(`Saved screenshot to ${destPath}`);
  await browser.close();
}

renderScreenshot().catch(console.error);
