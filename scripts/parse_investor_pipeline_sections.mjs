import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_investor_pipeline_node.json', 'utf8'));
const doc = data.nodes['56877:114549'].document;

console.log('--- SECTION ORDER BY Y COORDINATE ---');
const sortedChildren = [...doc.children].sort((a, b) => (a.absoluteBoundingBox?.y || 0) - (b.absoluteBoundingBox?.y || 0));

sortedChildren.forEach((c, idx) => {
  console.log(`[${idx}] ID: ${c.id}, Y: ${c.absoluteBoundingBox?.y}, Height: ${c.absoluteBoundingBox?.height}, Name: "${c.name}"`);
});

fs.mkdirSync('scripts/investor_pipeline_sections', { recursive: true });

sortedChildren.forEach((c, idx) => {
  fs.writeFileSync(`scripts/investor_pipeline_sections/sec_${idx}_${c.id.replace(':', '_')}.json`, JSON.stringify(c, null, 2));
});
console.log('Saved individual sections to scripts/investor_pipeline_sections/');
