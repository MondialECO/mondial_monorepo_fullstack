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

function generateLogoCreationStepHtml() {
  const brandName = 'CyberLock Sentinel';
  const selectedFamily = 'Symbol + Name';

  // 6 distinct Symbol + Name concepts generated for CyberLock Sentinel
  const concepts = [
    {
      key: 'concept_1',
      title: 'Hexagonal Crest Lockup',
      descriptor: "Hexagonal emblem framing 'C' with structured Space Grotesk type",
      shape: 'hexagon',
      shapeName: 'Hexagon Crest',
      arrangement: 'side_by_side',
      selected: true,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" width="100%" height="100%">
        <polygon points="54,20 84,37 84,73 54,90 24,73 24,37" fill="none" stroke="#0F172A" stroke-width="5" stroke-linejoin="round"/>
        <text x="54" y="65" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="28" fill="#0F172A" text-anchor="middle">C</text>
        <g transform="translate(108, 62)">
          <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="22" fill="#0F172A" letter-spacing="1">CYBERLOCK SENTINEL</text>
        </g>
      </svg>`
    },
    {
      key: 'concept_2',
      title: 'Shield Insignia Lockup',
      descriptor: "Shield insignia enclosing brand initial with balanced lockup",
      shape: 'shield',
      shapeName: 'Shield Insignia',
      arrangement: 'side_by_side',
      selected: false,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" width="100%" height="100%">
        <path d="M54,20 Q84,20 84,48 Q84,78 54,90 Q24,78 24,48 Q24,20 54,20 Z" fill="none" stroke="#0F172A" stroke-width="5" stroke-linejoin="round"/>
        <text x="54" y="64" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="28" fill="#0F172A" text-anchor="middle">C</text>
        <g transform="translate(108, 62)">
          <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="22" fill="#0F172A" letter-spacing="1">CYBERLOCK SENTINEL</text>
        </g>
      </svg>`
    },
    {
      key: 'concept_3',
      title: 'Circular Medallion Lockup',
      descriptor: "Circular medallion emblem positioned above centered brand name",
      shape: 'circle',
      shapeName: 'Circular Seal',
      arrangement: 'stacked',
      selected: false,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 160" width="100%" height="100%">
        <circle cx="170" cy="50" r="32" fill="none" stroke="#0F172A" stroke-width="5"/>
        <circle cx="170" cy="50" r="26" fill="none" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="3 3"/>
        <text x="170" y="60" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="26" fill="#0F172A" text-anchor="middle">C</text>
        <g transform="translate(170, 126)">
          <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="18" fill="#0F172A" letter-spacing="2" text-anchor="middle">CYBERLOCK SENTINEL</text>
        </g>
      </svg>`
    },
    {
      key: 'concept_4',
      title: 'Diamond Frame Lockup',
      descriptor: "Diamond insignia with geometric cut accent in high-contrast styling",
      shape: 'diamond',
      shapeName: 'Precision Diamond',
      arrangement: 'side_by_side',
      selected: false,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" width="100%" height="100%">
        <rect x="24" y="20" width="56" height="56" rx="4" transform="rotate(45 52 48)" fill="none" stroke="#0F172A" stroke-width="5"/>
        <text x="52" y="58" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="26" fill="#0F172A" text-anchor="middle">C</text>
        <g transform="translate(108, 62)">
          <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="22" fill="#0F172A" letter-spacing="1">CYBERLOCK SENTINEL</text>
        </g>
      </svg>`
    },
    {
      key: 'concept_5',
      title: 'Rounded Tech Seal',
      descriptor: "Rounded rectangular seal with modern technical typography",
      shape: 'rounded_rect',
      shapeName: 'Tech Seal',
      arrangement: 'side_by_side',
      selected: false,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" width="100%" height="100%">
        <rect x="24" y="22" width="60" height="60" rx="14" fill="none" stroke="#0F172A" stroke-width="5"/>
        <line x1="38" y1="52" x2="70" y2="52" stroke="#3B82F6" stroke-width="2"/>
        <text x="54" y="62" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="28" fill="#0F172A" text-anchor="middle">C</text>
        <g transform="translate(108, 62)">
          <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="22" fill="#0F172A" letter-spacing="1">CYBERLOCK SENTINEL</text>
        </g>
      </svg>`
    },
    {
      key: 'concept_6',
      title: 'Architectural Square Lockup',
      descriptor: "Architectural square mark set above stacked name typography",
      shape: 'square',
      shapeName: 'Square Keystone',
      arrangement: 'stacked',
      selected: false,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 160" width="100%" height="100%">
        <rect x="138" y="18" width="64" height="64" rx="4" fill="none" stroke="#0F172A" stroke-width="5"/>
        <path d="M152,32 L188,68 M188,32 L152,68" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="2 2"/>
        <text x="170" y="60" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="26" fill="#0F172A" text-anchor="middle">C</text>
        <g transform="translate(170, 126)">
          <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="18" fill="#0F172A" letter-spacing="2" text-anchor="middle">CYBERLOCK SENTINEL</text>
        </g>
      </svg>`
    }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Logo Creation Modal (3a) - Filtered to Symbol + Name</title>
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
      <div class="h-0.5 w-3 rounded-full bg-blue-500"></div>

      <!-- 4. Logo Creation (Active Modal) -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ring-2 ring-blue-500/20 shadow-xs">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-blue-600 text-white font-mono">4</div>
        <span class="text-xs font-bold tracking-tight">Logo Creation</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-muted"></div>

      <!-- 5. Variations -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted font-mono">5</div>
        <span class="hidden md:inline text-xs tracking-tight">Variations</span>
      </button>
      <div class="h-0.5 w-3 rounded-full bg-muted"></div>

      <!-- 6. Colors & Typography -->
      <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground opacity-60">
        <div class="flex size-4 items-center justify-center rounded-full text-[9px] bg-muted font-mono">6</div>
        <span class="hidden md:inline text-xs tracking-tight">System</span>
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

    <!-- 3. Modal Container (3a Logo Creation) -->
    <div class="relative z-30 w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Modal Header -->
      <div class="flex items-start justify-between border-b border-border/80 px-6 py-5 bg-gradient-to-b from-slate-50/80 to-white">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-bold font-mono tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              STEP 4 OF 7 · LOGO CREATION (3a)
            </span>
            <span class="text-[11px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <svg class="size-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              FILTERED TO STEP 3: ${selectedFamily.toUpperCase()}
            </span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-foreground">
            Select Your Primary Brand Mark
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            Generated 6 bespoke <span class="font-semibold text-foreground">Symbol + Name</span> lockups tailored to <span class="font-semibold text-foreground">${brandName}</span> in Space Grotesk.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- View Modes -->
          <div class="flex items-center bg-slate-100 p-0.5 rounded-lg border border-border/60 text-xs font-medium">
            <button class="px-2.5 py-1 rounded-md bg-white text-foreground shadow-2xs font-semibold">Mark Lockup</button>
            <button class="px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground">Invoice (120px)</button>
            <button class="px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground">Favicon (16px)</button>
          </div>
          <button class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-border/80">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7"/></svg>
            Compare
          </button>
        </div>
      </div>

      <!-- Modal Body: 3x2 Grid of 6 Generated Concepts -->
      <div class="p-6 bg-slate-50/50">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${concepts.map((c, idx) => `
            <div class="group relative flex flex-col rounded-xl border-2 transition-all overflow-hidden ${
              c.selected
                ? 'border-blue-600 bg-white ring-4 ring-blue-500/10 shadow-md'
                : 'border-border bg-white hover:border-slate-300 hover:shadow-sm'
            }">
              
              <!-- Card Top Header -->
              <div class="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-slate-50/60">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                    0${idx + 1}
                  </span>
                  <span class="text-xs font-semibold text-slate-800 truncate">${c.title}</span>
                </div>
                <span class="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-full border border-border/60">
                  ${c.shapeName}
                </span>
              </div>

              <!-- SVG Canvas Area -->
              <div class="flex items-center justify-center p-6 h-40 bg-white">
                <div class="w-full h-full flex items-center justify-center">
                  ${c.svg}
                </div>
              </div>

              <!-- Card Bottom Info -->
              <div class="p-3.5 border-t border-border/60 bg-slate-50/30 flex-1 flex flex-col justify-between">
                <p class="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  ${c.descriptor}
                </p>

                <div class="flex items-center justify-between pt-2 border-t border-dashed border-border/80">
                  <div class="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <span class="inline-block size-1.5 rounded-full bg-blue-500"></span>
                    <span>Space Grotesk</span>
                  </div>

                  <button class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100">
                    <svg class="size-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    <span>Regen (0/3)</span>
                  </button>
                </div>
              </div>

              ${c.selected ? `
                <div class="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                  <svg class="size-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-white">
        <div class="flex items-center gap-3">
          <button class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-border">
            ← Change Logo Type (Step 3)
          </button>
          <div class="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>Selected: <strong class="text-foreground">Concept 01 (Hexagonal Crest Lockup)</strong></span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">
            <span>Confirm Mark & Derive 7 Variations</span>
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
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

  const html = generateLogoCreationStepHtml();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const screenshotPath = path.join(outputDir, '15_logotype_to_creation_handoff.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Rendered: ${screenshotPath}`);

  await browser.close();
}

render().catch(console.error);
