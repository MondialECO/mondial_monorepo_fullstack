import fs from 'fs';

const d1 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79254.json', 'utf8'));
const bg = d1.children[0].children[0].children[0];
console.log('=== DECORATIVE BG ELEMENTS ===');
bg.children?.forEach((c, i) => {
  console.log(`[${i}] ${c.id}: "${c.name}" (${c.type})`);
  console.log('  fills:', JSON.stringify(c.fills));
  console.log('  effects:', JSON.stringify(c.effects));
  console.log('  box:', JSON.stringify(c.absoluteBoundingBox));
});
