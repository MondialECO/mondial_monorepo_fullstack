import fs from 'fs';

const d1 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79254.json', 'utf8'));
const grid = d1.children[0].children[0].children[2];
console.log('=== PRICING GRID CHILDREN ===');
grid.children?.forEach((c, i) => {
  console.log(`[${i}] ${c.id}: "${c.name}" (${c.type})`);
  c.children?.forEach((sub, j) => {
    console.log(`   [${j}] ${sub.id}: "${sub.name}" (${sub.type})`);
  });
});
