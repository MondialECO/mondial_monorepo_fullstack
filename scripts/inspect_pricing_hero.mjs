import fs from 'fs';

const d1 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79254.json', 'utf8'));
const frame1 = d1.children[0].children[0];
console.log('=== HERO FRAME 1 CHILDREN ===');
frame1.children?.forEach((c, i) => {
  console.log(`[${i}] ${c.id}: "${c.name}" (${c.type})`);
});
