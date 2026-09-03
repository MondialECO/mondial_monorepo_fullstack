import fs from 'fs';

const d1 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79254.json', 'utf8'));
const sec = d1.children[0];
console.log('=== HERO SECTION CHILDREN ===');
sec.children?.forEach((c, i) => {
  console.log(`[${i}] ${c.id}: "${c.name}" (${c.type})`);
});

const d2 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79428.json', 'utf8'));
const main = d2.children[0];
console.log('=== DETAILS MAIN CHILDREN ===');
main.children?.forEach((c, i) => {
  console.log(`[${i}] ${c.id}: "${c.name}" (${c.type})`);
});
