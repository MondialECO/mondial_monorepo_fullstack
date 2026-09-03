import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/figma_homepage_node_data.json', 'utf8'));
const rootNode = Object.values(data.nodes)[0].document;

const children = [...rootNode.children];
children.sort((a, b) => (a.absoluteBoundingBox?.y ?? 0) - (b.absoluteBoundingBox?.y ?? 0));
const sections = children.filter(c => (c.absoluteBoundingBox?.height ?? 0) > 30);

const outDir = 'scripts/sections';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

sections.forEach((sec, idx) => {
  const safeName = sec.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const fileName = `sec_${idx + 1}_${safeName}.json`;
  fs.writeFileSync(path.join(outDir, fileName), JSON.stringify(sec, null, 2));
  console.log(`Saved section ${idx + 1}: ${fileName}`);
});
