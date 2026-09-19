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

function generateBrandingEntryHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Brand Identity Options</title>
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
<body class="bg-background text-foreground min-h-screen flex flex-col antialiased">
  <!-- Progress Bar (78% filled) -->
  <div class="h-[3px] w-full bg-[#E4E4E7]">
    <div class="h-full bg-[#0052FF]" style="width: 78%;"></div>
  </div>

  <!-- Top Header Bar -->
  <header class="flex items-center justify-between border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md px-8 py-4">
    <button class="flex items-center gap-2 text-xs font-semibold text-[#71717A] hover:text-[#09090B] transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      Back
    </button>
    <div class="inline-flex items-center gap-1.5 rounded-full border border-[#0052FF]/20 bg-[#0052FF]/10 px-3 py-1 text-xs font-semibold text-[#0052FF]">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
      </svg>
      Phase 2 of 6 — Visual Identity
    </div>
  </header>

  <!-- Section Heading -->
  <div class="px-6 pt-12 pb-8 sm:px-10 max-w-2xl mx-auto w-full text-center">
    <span class="text-xs font-bold text-[#0052FF] uppercase tracking-wider">
      Step 2.3
    </span>
    <h1 class="text-3xl font-extrabold text-[#09090B] mt-2 tracking-tight">
      Build your brand identity
    </h1>
    <p class="text-sm text-[#71717A] mt-2.5 leading-relaxed">
      Craft a complete, production-ready brand identity kit in a guided 7-step studio session.
    </p>
  </div>

  <!-- Single Primary Studio Card -->
  <div class="flex-1 flex flex-col items-center px-6 sm:px-10 pb-16 max-w-3xl mx-auto w-full space-y-6">
    <div class="w-full rounded-2xl border border-[#E4E4E7] bg-white shadow-sm hover:shadow-md transition-shadow">
      <div class="p-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="flex size-12 items-center justify-center rounded-xl bg-[#0052FF]/10 text-[#0052FF] shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor"></polygon>
              </svg>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0052FF] bg-[#0052FF]/10 px-2 py-0.5 rounded">
                  7-Step Guided Session
                </span>
              </div>
              <h3 class="text-xl font-bold text-[#09090B]">
                Brand Visual Identity Studio
              </h3>
              <p class="text-xs text-[#71717A] leading-relaxed">
                A comprehensive, interactive studio session producing a cohesive brand kit across logo, colour, and typography systems.
              </p>
            </div>
          </div>
        </div>

        <!-- Deliverables Box -->
        <div class="bg-[#F4F4F5]/60 border border-[#E4E4E7] rounded-xl p-5 space-y-3.5">
          <span class="text-[10px] font-mono font-bold text-[#71717A] uppercase tracking-wider block">
            What you will produce (6 concrete deliverables)
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex items-start gap-2.5 text-xs text-[#71717A]">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="leading-tight">Brand strategy confirmed (positioning, target audience, traits & avoid list)</span>
            </div>
            <div class="flex items-start gap-2.5 text-xs text-[#71717A]">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="leading-tight">Curated visual direction & moodboard</span>
            </div>
            <div class="flex items-start gap-2.5 text-xs text-[#71717A]">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="leading-tight">Architectural logo concepts in your chosen mark archetype</span>
            </div>
            <div class="flex items-start gap-2.5 text-xs text-[#71717A]">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="leading-tight">Full set of 7 canonical logo variations (including transparent checkerboard)</span>
            </div>
            <div class="flex items-start gap-2.5 text-xs text-[#71717A]">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="leading-tight">5-role colour system with deterministic WCAG contrast evaluation</span>
            </div>
            <div class="flex items-start gap-2.5 text-xs text-[#71717A]">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="leading-tight">4-role typography system with optical role specimens</span>
            </div>
          </div>
        </div>

        <!-- Primary Action Button -->
        <div class="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E4E4E7]">
          <span class="text-xs text-[#71717A] font-mono">
            Estimated time: ~5 minutes
          </span>
          <button class="w-full sm:w-auto px-8 py-3 rounded-xl font-bold bg-[#0052FF] text-white hover:bg-[#0047E0] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm">
            <span>Open Brand Studio</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Quiet Secondary Row (Skip) & Marketplace Notice -->
    <div class="flex flex-col items-center space-y-3.5 text-center pt-2">
      <button class="text-xs font-semibold text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
        <span>Skip for now</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
        </svg>
      </button>

      <p class="text-xs text-[#71717A]/75 max-w-md leading-relaxed">
        Prefer a human designer? Hiring verified designers arrives when the marketplace opens.
      </p>
    </div>
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
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  const html = generateBrandingEntryHtml();
  await page.setContent(html, { waitUntil: 'networkidle' });

  const destPath = path.join(outputDir, '25_brand_studio_entry_redesigned.png');
  await page.screenshot({ path: destPath, fullPage: true });

  console.log(`Saved screenshot to ${destPath}`);
  await browser.close();
}

renderScreenshot().catch(console.error);
