import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_homepage_node_data.json', 'utf8'));
const rootNode = Object.values(data.nodes)[0].document;

const children = [...rootNode.children];
children.sort((a, b) => (a.absoluteBoundingBox?.y ?? 0) - (b.absoluteBoundingBox?.y ?? 0));

console.log('=== SECTIONS IN EXACT VISUAL TOP-TO-BOTTOM ORDER ===\n');

children.forEach((sec, idx) => {
  const box = sec.absoluteBoundingBox;
  const y = box ? Math.round(box.y) : 0;
  const w = box ? Math.round(box.width) : 0;
  const h = box ? Math.round(box.height) : 0;
  console.log(`[#${idx + 1}] y=${y}, size=${w}x${h} | Name: "${sec.name}" (${sec.type})`);
  
  // Recursively collect headline / text
  const texts = [];
  function collectText(n) {
    if (n.characters && n.characters.trim()) {
      texts.push(`"${n.characters.replace(/\n/g, ' ').trim()}"`);
    }
    if (n.children) n.children.forEach(collectText);
  }
  collectText(sec);
  console.log(`     Text preview (${texts.length} elements): ${texts.slice(0, 5).join(' | ')}\n`);
});
