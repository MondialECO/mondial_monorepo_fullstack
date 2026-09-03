import fs from 'fs';

const d1 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79254.json', 'utf8'));
console.log('=== HERO CHILDREN ===');
d1.children?.forEach((c, i) => {
  console.log(`[${i}] ${c.id}: "${c.name}" (${c.type}) y=${c.absoluteBoundingBox?.y} h=${c.absoluteBoundingBox?.height}`);
});

const d2 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79428.json', 'utf8'));
console.log('=== DETAILS CHILDREN ===');
d2.children?.forEach((c, i) => {
  console.log(`[${i}] ${c.id}: "${c.name}" (${c.type}) y=${c.absoluteBoundingBox?.y} h=${c.absoluteBoundingBox?.height}`);
});
