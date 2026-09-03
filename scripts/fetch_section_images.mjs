import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';

const data = JSON.parse(fs.readFileSync('scripts/figma_homepage_node_data.json', 'utf8'));
const rootNode = Object.values(data.nodes)[0].document;

const children = [...rootNode.children];
children.sort((a, b) => (a.absoluteBoundingBox?.y ?? 0) - (b.absoluteBoundingBox?.y ?? 0));
const sections = children.filter(c => (c.absoluteBoundingBox?.height ?? 0) > 30);

async function downloadSectionImages() {
  const nodeIds = sections.map(s => s.id);
  console.log(`Requesting renders for ${nodeIds.length} sections: ${nodeIds.join(', ')}`);
  
  const imgUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(nodeIds.join(','))}&format=png&scale=2`;
  const imgRes = await fetch(imgUrl, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  
  if (!imgRes.ok) {
    console.error(`Failed to fetch renders: ${imgRes.status}`);
    return;
  }
  
  const imgData = await imgRes.json();
  const outDir = 'public/figma_sections';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  for (let idx = 0; idx < sections.length; idx++) {
    const sec = sections[idx];
    const url = imgData.images?.[sec.id];
    if (url) {
      console.log(`Downloading render for Section ${idx + 1} (${sec.name})...`);
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const safeName = `sec_${idx + 1}_${sec.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)}.png`;
      fs.writeFileSync(path.join(outDir, safeName), Buffer.from(buf));
      console.log(`✓ Saved ${safeName}`);
    }
  }
}

downloadSectionImages().catch(console.error);
