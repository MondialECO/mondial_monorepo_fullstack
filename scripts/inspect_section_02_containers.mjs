import fs from 'fs';

const d2 = JSON.parse(fs.readFileSync('scripts/pricing_sections/deep_56939_79428.json', 'utf8'));
const main = d2.children[0];
main.children?.forEach((sec, i) => {
  console.log(`\n=== PART ${i}: "${sec.name}" CONTAINER CHILDREN ===`);
  const cont = sec.children[0];
  cont.children?.forEach((c, j) => {
    console.log(`  [${j}] ${c.id}: "${c.name}" (${c.type})`);
  });
});
