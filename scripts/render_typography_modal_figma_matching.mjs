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

function generateTypographyModalHtml(selectedPairing = 'syne', theme = 'light') {
  const brandName = 'AutoInvoice';
  const brandTagline = 'Get paid without the awkward email';
  const isDark = theme === 'dark';

  const pairings = [
    {
      id: 'syne',
      display: 'Syne',
      text: 'DM Sans',
      desc: 'Geometric and assertive, with a neutral workhorse underneath.',
      license: 'Open licence',
      weights: '5 weights',
      kb: '48kb'
    },
    {
      id: 'jakarta',
      display: 'Plus Jakarta Sans',
      text: 'Inter',
      desc: 'Warmer headlines, same clarity in body copy.',
      license: 'Open licence',
      weights: '6 weights',
      kb: '52kb'
    },
    {
      id: 'space',
      display: 'Space Grotesk',
      text: 'Inter',
      desc: 'Technical and precise, closer to documentation.',
      license: 'Open licence',
      weights: '4 weights',
      kb: '44kb'
    }
  ];

  const currentPairing = pairings.find(p => p.id === selectedPairing) || pairings[0];

  return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <title>Step 6 - Typography System Modal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Space+Grotesk:wght@300..700&family=Syne:wght@400..800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['DM Sans', 'sans-serif'],
            heading: ['Inter', 'sans-serif'],
            mono: ['DM Mono', 'monospace'],
            syne: ['Syne', 'sans-serif'],
            jakarta: ['Plus Jakarta Sans', 'sans-serif'],
            space: ['Space Grotesk', 'sans-serif'],
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
            Your typography
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
            Two families, four roles. The display face carries personality; the text face carries everything people actually read.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium shadow-xs">
            <svg class="size-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            <span>Suggest other pairings</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              1/3 LEFT
            </span>
          </div>

          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-sans">
            STEP <span class="font-mono font-semibold text-slate-900 dark:text-white mx-1">6</span> OF <span class="font-mono font-semibold text-slate-900 dark:text-white ml-1">6</span>
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
          <div class="h-1.5 w-full rounded-full bg-emerald-500/80"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
            <svg class="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Colour</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 text-center">
          <div class="h-1.5 w-full rounded-full bg-blue-600"></div>
          <div class="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white">
            <span>Typography</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Scrolling Modal Body -->
    <div class="p-6 sm:p-8 space-y-7 overflow-y-auto">
      
      <!-- SECTION A: PAIRING CHOICE ("PICK A PAIRING") -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              PICK A PAIRING
            </span>
            <span class="hidden sm:inline text-xs text-slate-400">·</span>
            <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              DISPLAY FAMILY: <strong class="text-slate-900 dark:text-white font-semibold">${currentPairing.display}</strong> · TEXT FAMILY: <strong class="text-slate-900 dark:text-white font-semibold">${currentPairing.text}</strong>
            </span>
          </div>

          <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
            Tuning below updates automatically
          </span>
        </div>

        <!-- 3 Pairing Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${pairings.map((p) => {
            const isSelected = p.id === selectedPairing;
            return `
              <div class="group relative flex flex-col rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${isSelected ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-blue-600/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'}">
                <div class="h-[130px] p-4 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-center gap-1.5 relative border-b border-slate-200/80 dark:border-slate-800">
                  ${isSelected ? `
                    <div class="absolute top-3 right-3 size-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <svg class="size-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>
                    </div>
                  ` : ''}
                  <h4 class="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white truncate" style="font-family: '${p.display}', sans-serif;">
                    ${brandName}
                  </h4>
                  <p class="text-xs font-sans text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed" style="font-family: '${p.text}', sans-serif;">
                    ${brandTagline}
                  </p>
                </div>

                <div class="p-4 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <span class="text-sm font-bold font-mono text-slate-900 dark:text-white block">
                      ${p.display} + ${p.text}
                    </span>
                    <p class="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      ${p.desc}
                    </p>
                  </div>

                  <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    <span>${p.license}</span>
                    <span>·</span>
                    <span>${p.weights}</span>
                    <span>·</span>
                    <span>${p.kb}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- SECTION B: FOUR ROLES SPECIMEN EDITOR ("FOUR ROLES") -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            FOUR ROLES
          </span>
          <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
            Tuning is free
          </span>
        </div>

        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200/80 dark:divide-slate-800 overflow-hidden shadow-2xs">
          
          <!-- ROW 1: Logo type (LOCKED STATE) -->
          <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <div class="space-y-1 max-w-xs">
              <div class="flex items-center gap-2">
                <span class="text-base font-bold font-heading text-slate-900 dark:text-white">
                  Logo type
                </span>
                <span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> LOCKED
                </span>
              </div>
              <p class="text-xs font-sans text-slate-500 dark:text-slate-400 leading-normal">
                Locked to your wordmark. Changing this would redraw your logo.
              </p>
              <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 block pt-0.5">
                Bound to approved logo concept
              </span>
            </div>

            <div class="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
              <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
                ${currentPairing.display} · Bold · 40px / 44
              </span>
              <div class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white" style="font-family: '${currentPairing.display}', sans-serif;">
                ${brandName}
              </div>
            </div>
          </div>

          <!-- ROW 2: Heading -->
          <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
            <div class="space-y-1 max-w-xs">
              <span class="text-base font-bold font-heading text-slate-900 dark:text-white block">
                Heading
              </span>
              <p class="text-xs font-sans text-slate-500 dark:text-slate-400 leading-normal">
                Page titles, section headers, deck slides.
              </p>
              
              <div class="flex items-center gap-2 pt-2">
                <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400">Weight:</span>
                <span class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium">Bold (700)</span>
              </div>
            </div>

            <div class="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
              <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
                ${currentPairing.display} · Bold · 40px / 46
              </span>
              <div class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug md:text-right" style="font-family: '${currentPairing.display}', sans-serif;">
                ${brandTagline}
              </div>
            </div>
          </div>

          <!-- ROW 3: Body -->
          <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
            <div class="space-y-1 max-w-xs">
              <span class="text-base font-bold font-heading text-slate-900 dark:text-white block">
                Body
              </span>
              <p class="text-xs font-sans text-slate-500 dark:text-slate-400 leading-normal">
                Paragraph copy, descriptions, customer communication.
              </p>

              <div class="flex items-center gap-2 pt-2">
                <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400">Weight:</span>
                <span class="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium">Regular (400)</span>
              </div>
            </div>

            <div class="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
              <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
                ${currentPairing.text} · Regular · 16px / 24
              </span>
              <p class="text-sm font-sans text-slate-600 dark:text-slate-300 leading-relaxed max-w-md md:text-right" style="font-family: '${currentPairing.text}', sans-serif;">
                Crafted specifically for autonomous workflows. Clean typography hierarchy ensures complete legibility across high-density creator dashboards.
              </p>
            </div>
          </div>

          <!-- ROW 4: Button & label -->
          <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
            <div class="space-y-1 max-w-xs">
              <span class="text-base font-bold font-heading text-slate-900 dark:text-white block">
                Button & label
              </span>
              <p class="text-xs font-sans text-slate-500 dark:text-slate-400 leading-normal">
                Action triggers, badges, navigation items, metrics.
              </p>
            </div>

            <div class="flex-1 flex flex-col items-start md:items-end gap-2.5 min-w-[280px]">
              <span class="text-xs font-mono text-slate-400 dark:text-slate-500">
                ${currentPairing.text} · Medium · 14px / 20
              </span>
              <div class="flex items-center gap-3 flex-wrap">
                <button class="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs" style="font-family: '${currentPairing.text}', sans-serif;">
                  Explore ${brandName}
                </button>
                <span class="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" style="font-family: '${currentPairing.text}', sans-serif;">
                  ● Active Network
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- 3. Modal Footer -->
    <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 shrink-0">
      <div class="flex items-center gap-2 text-xs text-slate-500 font-mono">
        <svg class="size-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span>2 Font Families · 4 Canonical Roles · Zero Credit Hand-Tuning</span>
      </div>

      <div class="flex items-center gap-3">
        <button class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button class="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs">
          <span>Confirm & Complete Brand Kit</span>
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>

  </div>
</body>
</html>`;
}

async function renderScreenshots() {
  console.log('Launching browser for Typography System Modal screenshots...');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  const scenarios = [
    { pairing: 'syne', theme: 'light', name: '01_typography_modal_syne_light.png' },
    { pairing: 'jakarta', theme: 'light', name: '02_typography_modal_jakarta_light.png' },
    { pairing: 'space', theme: 'light', name: '03_typography_modal_space_light.png' },
    { pairing: 'syne', theme: 'dark', name: '04_typography_modal_syne_dark.png' },
  ];

  for (const s of scenarios) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const html = generateTypographyModalHtml(s.pairing, s.theme);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const outPath = path.join(outputDir, s.name);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot: ${outPath}`);
  }

  await browser.close();
  console.log('Done rendering Typography System Modal screenshots.');
}

renderScreenshots().catch(console.error);
