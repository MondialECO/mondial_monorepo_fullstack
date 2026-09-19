import fs from 'fs';

const raw = fs.readFileSync('scripts/figma_step1_strategy_node.json', 'utf8');
const data = JSON.parse(raw);
const doc = Object.values(data.nodes)[0]?.document;

const modal = doc.children.find(c => c.name.includes('Step 1 Modal Dialog'));
const inner = modal.children[0];
const body = inner.children.find(c => c.name.includes('Scrollable Modal Body') || c.name.includes('Split Columns'));

console.log('Body children:');
body.children.forEach(c => {
  console.log(' -', c.name, `[${c.type}]`);
  if (c.children) {
    c.children.forEach(cc => {
      console.log('   --', cc.name, `[${cc.type}]`);
      if (cc.children) {
        cc.children.forEach(ccc => {
          console.log('      ---', ccc.name, `[${ccc.type}]`);
        });
      }
    });
  }
});
