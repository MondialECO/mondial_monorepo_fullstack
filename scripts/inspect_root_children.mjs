import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_direction_node.json', 'utf8'));
const root = data.nodes['57012:9066']?.document;

console.log('Root name:', root.name);
console.log('Root children:');
for (const child of root.children) {
  console.log('-', child.name, `(${child.type})`);
}
