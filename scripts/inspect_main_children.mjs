import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_direction_node.json', 'utf8'));
const root = data.nodes['57012:9066']?.document;

function findNode(node, name) {
  if (node.name && node.name.includes(name)) return node;
  if (node.children) {
    for (const c of node.children) {
      const res = findNode(c, name);
      if (res) return res;
    }
  }
  return null;
}

const main = findNode(root, 'Main');
console.log('Main children:');
for (const child of main.children) {
  console.log('-', child.name, `(${child.type})`);
  if (child.children) {
    for (const sub of child.children) {
      console.log('  --', sub.name, `(${sub.type})`);
    }
  }
}
