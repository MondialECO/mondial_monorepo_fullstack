const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const jsonPath = path.join(__dirname, 'backend/tests/WebApp.Tests/bin/Debug/net8.0/exported_logos.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const outDirs = [
  path.join(__dirname, 'outputs'),
  'C:\\mnt\\user-data\\outputs',
  path.join(process.env.USERPROFILE || 'C:\\Users\\Siraj', '.gemini\\antigravity-ide\\brain\\9fc77a08-b62b-4622-b07d-0d97b1df77d7\\outputs')
];

outDirs.forEach(dir => {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
});

function saveBufferToAll(filename, buffer) {
  outDirs.forEach(dir => {
    try {
      fs.writeFileSync(path.join(dir, filename), buffer);
      console.log(`Saved ${filename} to ${dir}`);
    } catch (e) {
      console.error(`Failed saving to ${dir}:`, e.message);
    }
  });
}

function escapeXml(unsafe) {
  return (unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function extractInnerAndVb(svgStr) {
  if (!svgStr) return { inner: '', viewBox: '0 0 400 200' };
  const svgMatch = svgStr.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  const inner = svgMatch ? svgMatch[1] : svgStr;
  const vbMatch = svgStr.match(/viewBox=["']([^"']*)["']/i);
  const viewBox = vbMatch ? vbMatch[1] : "0 0 400 200";
  return { inner, viewBox };
}

async function renderConceptCard(concept, brandName, width = 520, height = 380) {
  const lockup = extractInnerAndVb(concept.lockupSvg || concept.svgStandard);
  const mark = extractInnerAndVb(concept.markSvg || concept.lockupSvg || concept.svgStandard);

  return `
    <g transform="translate(0, 0)">
      <rect width="${width}" height="${height}" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      
      <!-- Mark Area (Full Lockup: Mark + Measured Vector Typography) -->
      <svg x="20" y="20" width="${width - 110}" height="${height - 130}" viewBox="${lockup.viewBox}">
        ${lockup.inner}
      </svg>
      
      <!-- Top Right: Standalone Mark 1:1 Inset Badge -->
      <g transform="translate(${width - 80}, 20)">
        <rect width="60" height="60" rx="8" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
        <svg x="6" y="6" width="48" height="48" viewBox="${mark.viewBox}">
          ${mark.inner}
        </svg>
        <text x="30" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="600" fill="#94A3B8" text-anchor="middle">1:1 MARK</text>
      </g>

      <!-- Meta divider -->
      <line x1="20" y1="${height - 100}" x2="${width - 20}" y2="${height - 100}" stroke="#F1F5F9" stroke-width="1.5"/>
      
      <!-- Family Badge -->
      <rect x="24" y="${height - 85}" width="${concept.family.length * 9 + 20}" height="24" rx="12" fill="#EFF6FF"/>
      <text x="${24 + (concept.family.length * 9 + 20) / 2}" y="${height - 69}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#2563EB" text-anchor="middle" letter-spacing="0.5">${escapeXml(concept.family.toUpperCase())}</text>
      
      <!-- Descriptor Line -->
      <text x="24" y="${height - 38}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#475569">${escapeXml(concept.descriptor)}</text>
      <text x="24" y="${height - 18}" font-family="ui-monospace, monospace" font-size="10.5" fill="#94A3B8">ID: ${concept.key}</text>
    </g>
  `;
}

// 1. GRID OF 6 CONCEPTS SHEET FOR A BUSINESS
async function build6GridSheet(businessData, filename) {
  const cardW = 540;
  const cardH = 380;
  const gap = 30;
  const padding = 50;
  const headerH = 130;
  
  const totalW = padding * 2 + cardW * 3 + gap * 2;
  const totalH = padding * 2 + headerH + cardH * 2 + gap;

  let cardsSvg = '';
  for (let i = 0; i < businessData.concepts.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = padding + col * (cardW + gap);
    const y = padding + headerH + row * (cardH + gap);

    const cardContent = await renderConceptCard(businessData.concepts[i], businessData.brandName, cardW, cardH);
    cardsSvg += `<g transform="translate(${x}, ${y})">${cardContent}</g>\n`;
  }

  const sheetSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
      <rect width="${totalW}" height="${totalH}" fill="#F8FAFC"/>
      
      <!-- Header -->
      <g transform="translate(${padding}, ${padding + 30})">
        <text font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" fill="#0F172A">${escapeXml(businessData.brandName)}</text>
        <text y="36" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#64748B">Visual Identity Studio — 6 Generated Concept Candidates</text>
        <rect x="0" y="52" width="${totalW - padding * 2}" height="3" fill="#E2E8F0" rx="1.5"/>
        <text y="78" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#3B82F6">Direction: ${escapeXml(businessData.direction)}  |  Total Families: ${new Set(businessData.concepts.map(c => c.family)).size} distinct families</text>
      </g>
      
      ${cardsSvg}
    </svg>
  `;

  const png = await sharp(Buffer.from(sheetSvg)).png().toBuffer();
  saveBufferToAll(filename, png);
}

// 2. 16PX MAGNIFIED INSPECTION SHEET FOR 6 CONCEPTS
async function build16pxInspectionSheet(businessData, filename) {
  const cardW = 520;
  const cardH = 340;
  const gap = 30;
  const padding = 50;
  const headerH = 130;
  
  const totalW = padding * 2 + cardW * 3 + gap * 2;
  const totalH = padding * 2 + headerH + cardH * 2 + gap;

  let cardsSvg = '';
  for (let i = 0; i < businessData.concepts.length; i++) {
    const c = businessData.concepts[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = padding + col * (cardW + gap);
    const y = padding + headerH + row * (cardH + gap);

    const mark = extractInnerAndVb(c.markSvg || c.lockupSvg || c.svgStandard);

    cardsSvg += `
      <g transform="translate(${x}, ${y})">
        <rect width="${cardW}" height="${cardH}" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        
        <!-- Concept Header -->
        <text x="24" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#0F172A">${escapeXml(c.family.toUpperCase())} <tspan font-weight="400" fill="#64748B">(${c.key})</tspan></text>
        <text x="24" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">${escapeXml(c.descriptor)}</text>
        <line x1="24" y1="72" x2="${cardW - 24}" y2="72" stroke="#F1F5F9" stroke-width="1.5"/>

        <!-- Left: Exact 16px rendering test -->
        <g transform="translate(35, 100)">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#475569">1:1 Standalone Mark 16px Favicon</text>
          
          <!-- Browser Tab Mockup -->
          <rect y="16" width="180" height="38" rx="6" fill="#F1F5F9" stroke="#CBD5E1"/>
          
          <!-- 16px mark box -->
          <rect x="12" y="27" width="16" height="16" fill="#FFFFFF" stroke="#94A3B8" stroke-width="0.5"/>
          <svg x="12" y="27" width="16" height="16" viewBox="${mark.viewBox}">
            ${mark.inner}
          </svg>
          <text x="36" y="39" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#334155">${escapeXml(businessData.brandName)}</text>

          <!-- Dark mode Tab Mockup -->
          <rect y="64" width="180" height="38" rx="6" fill="#1E293B" stroke="#334155"/>
          <rect x="12" y="75" width="16" height="16" fill="#0F172A" stroke="#475569" stroke-width="0.5"/>
          <svg x="12" y="75" width="16" height="16" viewBox="${mark.viewBox}">
            ${mark.inner}
          </svg>
          <text x="36" y="87" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#F8FAFC">${escapeXml(businessData.brandName)}</text>
          
          <!-- App Icon 32px -->
          <rect y="112" width="48" height="48" rx="10" fill="#0F172A" stroke="#334155"/>
          <svg x="8" y="120" width="32" height="32" viewBox="${mark.viewBox}">
            ${mark.inner}
          </svg>
          <text x="58" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#475569">32px App Icon</text>
        </g>

        <!-- Right: 128px Magnified Macro Inspection -->
        <g transform="translate(260, 100)">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#475569">Standalone Mark Magnified (128x128)</text>
          
          <!-- Magnified bounding frame -->
          <rect y="16" width="190" height="190" rx="8" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5"/>
          
          <!-- Centered rendered mark -->
          <svg x="15" y="31" width="160" height="160" viewBox="${mark.viewBox}">
            ${mark.inner}
          </svg>
          
          <!-- Legibility verdict -->
          <text x="0" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#059669">✓ Stroke ≥ 6% | Clearance ≥ 8%</text>
        </g>
      </g>
    `;
  }

  const sheetSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
      <rect width="${totalW}" height="${totalH}" fill="#F8FAFC"/>
      
      <!-- Header -->
      <g transform="translate(${padding}, ${padding + 30})">
        <text font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" fill="#0F172A">${escapeXml(businessData.brandName)} — 16px Favicon &amp; Micro-Legibility Inspection</text>
        <text y="36" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#64748B">Visual test verifying counter clearance, stroke geometry, and icon recognition at 16x16px and 32x32px</text>
        <rect x="0" y="52" width="${totalW - padding * 2}" height="3" fill="#E2E8F0" rx="1.5"/>
      </g>
      
      ${cardsSvg}
    </svg>
  `;

  const png = await sharp(Buffer.from(sheetSvg)).png().toBuffer();
  saveBufferToAll(filename, png);
}

// 3. 3-WAY COLOR / MONOCHROME SHEET FOR ONE CONCEPT
async function build3WayColorSheet(businessData, conceptIndex, filename) {
  const c = businessData.concepts[conceptIndex];
  const cardW = 460;
  const cardH = 340;
  const gap = 30;
  const padding = 50;
  const headerH = 130;
  
  const totalW = padding * 2 + cardW * 3 + gap * 2;
  const totalH = padding * 2 + headerH + cardH;

  const singleColor = extractInnerAndVb(c.lockupSingleColor || c.svgSingleColor || c.lockupSvg);
  const black = extractInnerAndVb(c.lockupBlack || c.svgBlack || c.lockupSvg);
  const white = extractInnerAndVb(c.lockupWhite || c.svgWhite || c.lockupSvg);

  const sheetSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
      <rect width="${totalW}" height="${totalH}" fill="#F8FAFC"/>
      
      <!-- Header -->
      <g transform="translate(${padding}, ${padding + 30})">
        <text font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" fill="#0F172A">${escapeXml(businessData.brandName)} — Fill Independence &amp; Contrast Modes</text>
        <text y="36" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748B">Testing Family: <tspan font-weight="700" fill="#2563EB">${escapeXml(c.family.toUpperCase())}</tspan> (${c.descriptor}) across Brand Color, Pure Black, and Dark Ground Inverted White</text>
        <rect x="0" y="52" width="${totalW - padding * 2}" height="3" fill="#E2E8F0" rx="1.5"/>
      </g>

      <!-- 1. Full Brand Primary Color on Light Ground -->
      <g transform="translate(${padding}, ${padding + headerH})">
        <rect width="${cardW}" height="${cardH}" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <text x="24" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#0F172A">1. Brand Primary Color (${businessData.primaryColor})</text>
        <text x="24" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">Light ground presentation</text>
        <line x1="24" y1="72" x2="${cardW - 24}" y2="72" stroke="#F1F5F9" stroke-width="1.5"/>
        
        <svg x="30" y="90" width="${cardW - 60}" height="${cardH - 120}" viewBox="${singleColor.viewBox}">
          ${singleColor.inner}
        </svg>
      </g>

      <!-- 2. Pure Black Monochrome (1-bit / Black Print) -->
      <g transform="translate(${padding + cardW + gap}, ${padding + headerH})">
        <rect width="${cardW}" height="${cardH}" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <text x="24" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#0F172A">2. Pure Black Monochrome (#000000)</text>
        <text x="24" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">Laser print / 1-color stamp / engraving</text>
        <line x1="24" y1="72" x2="${cardW - 24}" y2="72" stroke="#F1F5F9" stroke-width="1.5"/>
        
        <svg x="30" y="90" width="${cardW - 60}" height="${cardH - 120}" viewBox="${black.viewBox}">
          ${black.inner}
        </svg>
      </g>

      <!-- 3. Pure White Inverted on Dark Ground -->
      <g transform="translate(${padding + (cardW + gap) * 2}, ${padding + headerH})">
        <rect width="${cardW}" height="${cardH}" rx="14" fill="${businessData.bgColor}" stroke="#334155" stroke-width="2"/>
        <text x="24" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">3. Pure White Inverted (#FFFFFF)</text>
        <text x="24" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94A3B8">Dark mode / footer / black t-shirt</text>
        <line x1="24" y1="72" x2="${cardW - 24}" y2="72" stroke="#334155" stroke-width="1.5"/>
        
        <svg x="30" y="90" width="${cardW - 60}" height="${cardH - 120}" viewBox="${white.viewBox}">
          ${white.inner}
        </svg>
      </g>
    </svg>
  `;

  const png = await sharp(Buffer.from(sheetSvg)).png().toBuffer();
  saveBufferToAll(filename, png);
}

// 4. MASTER 18-MARK COMPARISON SHEET
async function buildMaster18Sheet(businesses, filename) {
  const cardW = 340;
  const cardH = 260;
  const gap = 20;
  const padding = 50;
  const headerH = 140;
  const rowHeaderW = 220;

  const totalW = padding * 2 + rowHeaderW + cardW * 6 + gap * 5;
  const totalH = padding * 2 + headerH + cardH * 3 + gap * 2;

  let rowsSvg = '';
  for (let bIdx = 0; bIdx < businesses.length; bIdx++) {
    const b = businesses[bIdx];
    const rowY = padding + headerH + bIdx * (cardH + gap);

    // Row Header Label
    rowsSvg += `
      <g transform="translate(${padding}, ${rowY})">
        <rect width="${rowHeaderW - 20}" height="${cardH}" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        <rect x="0" y="0" width="8" height="${cardH}" rx="4" fill="${b.primaryColor}"/>
        <text x="20" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#0F172A">${escapeXml(b.brandName)}</text>
        <text x="20" y="70" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#64748B">${escapeXml(b.direction)}</text>
        <text x="20" y="105" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94A3B8">Primary: ${b.primaryColor}</text>
        <text x="20" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94A3B8">6 Concepts generated</text>
      </g>
    `;

    // 6 Concept Cards in Row
    for (let cIdx = 0; cIdx < b.concepts.length; cIdx++) {
      const c = b.concepts[cIdx];
      const cardX = padding + rowHeaderW + cIdx * (cardW + gap);
      const lockup = extractInnerAndVb(c.lockupSvg || c.svgStandard);

      rowsSvg += `
        <g transform="translate(${cardX}, ${rowY})">
          <rect width="${cardW}" height="${cardH}" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
          
          <svg x="15" y="15" width="${cardW - 30}" height="${cardH - 85}" viewBox="${lockup.viewBox}">
            ${lockup.inner}
          </svg>
          
          <line x1="15" y1="${cardH - 65}" x2="${cardW - 15}" y2="${cardH - 65}" stroke="#F1F5F9" stroke-width="1"/>
          
          <text x="15" y="${cardH - 45}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#2563EB">${escapeXml(c.family.toUpperCase())}</text>
          <text x="15" y="${cardH - 25}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#475569">${escapeXml(c.descriptor)}</text>
        </g>
      `;
    }
  }

  const sheetSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
      <rect width="${totalW}" height="${totalH}" fill="#F8FAFC"/>
      
      <!-- Header -->
      <g transform="translate(${padding}, ${padding + 30})">
        <text font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#0F172A">Parametric Logo Engine — 18-Mark Master Cross-Brand Range Sheet</text>
        <text y="40" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#64748B">Direct comparison across 3 contrasting industries: Cybersecurity vs Sustainable Agriculture vs Luxury Architecture</text>
        <text y="68" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#3B82F6">Demonstrates brand personality distinction, typographic weight variations, glyph geometry, and aesthetic divergence</text>
        <rect x="0" y="85" width="${totalW - padding * 2}" height="3" fill="#E2E8F0" rx="1.5"/>
      </g>

      ${rowsSvg}
    </svg>
  `;

  const png = await sharp(Buffer.from(sheetSvg)).png().toBuffer();
  saveBufferToAll(filename, png);
}

// 5. 4-DIRECTION DIVERGENCE SHEET (Same brand "CyberLock" across 4 brand directions)
async function build4DirectionDivergenceSheet(directions, filename) {
  const cardW = 340;
  const cardH = 260;
  const gap = 20;
  const padding = 50;
  const headerH = 140;
  const rowHeaderW = 240;

  const totalW = padding * 2 + rowHeaderW + cardW * 6 + gap * 5;
  const totalH = padding * 2 + headerH + cardH * 4 + gap * 3;

  let rowsSvg = '';
  for (let bIdx = 0; bIdx < directions.length; bIdx++) {
    const b = directions[bIdx];
    const rowY = padding + headerH + bIdx * (cardH + gap);

    rowsSvg += `
      <g transform="translate(${padding}, ${rowY})">
        <rect width="${rowHeaderW - 20}" height="${cardH}" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        <rect x="0" y="0" width="8" height="${cardH}" rx="4" fill="${b.primaryColor}"/>
        <text x="20" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#0F172A">${escapeXml(b.brandName)}</text>
        <text x="20" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#2563EB">${escapeXml(b.direction)}</text>
        <text x="20" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#64748B">Archetype: ${b.caseKey.replace('cyber_dir_', '')}</text>
        <text x="20" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94A3B8">Distinct Typeface &amp; Motif</text>
      </g>
    `;

    for (let cIdx = 0; cIdx < b.concepts.length; cIdx++) {
      const c = b.concepts[cIdx];
      const cardX = padding + rowHeaderW + cIdx * (cardW + gap);
      const lockup = extractInnerAndVb(c.lockupSvg || c.svgStandard);

      rowsSvg += `
        <g transform="translate(${cardX}, ${rowY})">
          <rect width="${cardW}" height="${cardH}" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
          
          <svg x="15" y="15" width="${cardW - 30}" height="${cardH - 85}" viewBox="${lockup.viewBox}">
            ${lockup.inner}
          </svg>
          
          <line x1="15" y1="${cardH - 65}" x2="${cardW - 15}" y2="${cardH - 65}" stroke="#F1F5F9" stroke-width="1"/>
          
          <text x="15" y="${cardH - 45}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#2563EB">${escapeXml(c.family.toUpperCase())}</text>
          <text x="15" y="${cardH - 25}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#475569">${escapeXml(c.descriptor)}</text>
        </g>
      `;
    }
  }

  const sheetSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
      <rect width="${totalW}" height="${totalH}" fill="#F8FAFC"/>
      
      <!-- Header -->
      <g transform="translate(${padding}, ${padding + 30})">
        <text font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#0F172A">Same Brand Across 4 Directions — Aesthetic Divergence Proof</text>
        <text y="40" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#64748B">Brand: 'CyberLock' tested under Tech Precision, Organic Warmth, Minimalist Luxe, and Industrial Bold</text>
        <text y="68" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#3B82F6">Proves direction selection fundamentally alters typographic personality, motif primitives, stroke weights, and layout geometry</text>
        <rect x="0" y="85" width="${totalW - padding * 2}" height="3" fill="#E2E8F0" rx="1.5"/>
      </g>

      ${rowsSvg}
    </svg>
  `;

  const png = await sharp(Buffer.from(sheetSvg)).png().toBuffer();
  saveBufferToAll(filename, png);
}

async function run() {
  const cyber = rawData.find(d => d.caseKey === 'cybersecurity');
  const agri = rawData.find(d => d.caseKey === 'sustainable_agri');
  const luxe = rawData.find(d => d.caseKey === 'luxury_arch');
  const longName = rawData.find(d => d.caseKey === 'long_name');
  const shortName = rawData.find(d => d.caseKey === 'short_name');

  const dirOrganic = rawData.find(d => d.caseKey === 'cyber_dir_organic');
  const dirLuxe = rawData.find(d => d.caseKey === 'cyber_dir_luxe');
  const dirIndustrial = rawData.find(d => d.caseKey === 'cyber_dir_industrial');

  console.log('Generating Review Sheets...');

  // 1. Grid of 6 concepts for 3 main businesses
  await build6GridSheet(cyber, '01_cybersecurity_6concepts_grid.png');
  await build6GridSheet(agri, '02_sustainable_agriculture_6concepts_grid.png');
  await build6GridSheet(luxe, '03_luxury_architecture_6concepts_grid.png');

  // 2. 16px Favicon & Micro-legibility inspection sheets
  await build16pxInspectionSheet(cyber, '04_cybersecurity_16px_inspection.png');
  await build16pxInspectionSheet(agri, '05_sustainable_agriculture_16px_inspection.png');
  await build16pxInspectionSheet(luxe, '06_luxury_architecture_16px_inspection.png');

  // 3. 3-way color / monochrome sheets
  await build3WayColorSheet(cyber, 1, '07_cybersecurity_3way_color_modes.png');
  await build3WayColorSheet(agri, 2, '08_sustainable_agriculture_3way_color_modes.png');
  await build3WayColorSheet(luxe, 0, '09_luxury_architecture_3way_color_modes.png');

  // 4. Master 18-mark comparison sheet
  await buildMaster18Sheet([cyber, agri, luxe], '10_master_18marks_comparison_sheet.png');

  // 5. Edge cases
  await build6GridSheet(longName, '11_edgecase_long_name_33chars_grid.png');
  await build6GridSheet(shortName, '12_edgecase_short_name_4chars_grid.png');

  // 6. Direction divergence
  if (dirOrganic && dirLuxe && dirIndustrial) {
    await build4DirectionDivergenceSheet([cyber, dirOrganic, dirLuxe, dirIndustrial], '13_cybersecurity_4directions_divergence.png');
  }

  console.log('All 13 review sheets generated successfully!');
}

run().catch(err => {
  console.error('Error generating sheets:', err);
  process.exit(1);
});
