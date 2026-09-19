import fs from 'fs';

const raw = fs.readFileSync('scripts/figma_step1_strategy_node.json', 'utf8');
const data = JSON.parse(raw);
const doc = Object.values(data.nodes)[0]?.document;

function findNode(node, name) {
  if (node.name.includes(name)) {
    console.log('Found:', node.name);
    if (node.children) {
      node.children.forEach(c => console.log('  Child:', c.name, `(${c.type})`));
    }
  }
  if (node.children) {
    node.children.forEach(c => findNode(c, name));
  }
}

console.log('--- Finding Right Column ---');
findNode(doc, 'Right Column');

console.log('--- Finding Footer / Actions ---');
findNode(doc, 'Footer');
findNode(doc, 'Modal Footer');
findNode(doc, 'Action');
findNode(doc, 'Button');
