import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_direction_node.json', 'utf8'));
const root = data.nodes['57012:9066']?.document;

function printNodeAll(node, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${node.name} (${node.type}) ${node.characters ? `:: "${node.characters}"` : ''}`);
  if (node.children) {
    for (const c of node.children) {
      printNodeAll(c, depth + 1);
    }
  }
}

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

const c3 = findNode(root, 'CARD 3');
if (c3) {
  console.log('=== CARD 3 ===');
  printNodeAll(c3);
}

const c4 = findNode(root, 'CARD 4');
if (c4) {
  console.log('=== CARD 4 ===');
  printNodeAll(c4);
}
