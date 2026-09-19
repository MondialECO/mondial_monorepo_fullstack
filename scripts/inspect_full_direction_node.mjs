import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_direction_node.json', 'utf8'));
const root = data.nodes['57012:9066']?.document;

function printNodeTree(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let text = node.characters ? ` -> text: "${node.characters}"` : '';
  console.log(`${indent}[${node.type}] ${node.name} (id: ${node.id})${text}`);
  if (node.children) {
    for (const child of node.children) {
      printNodeTree(child, depth + 1);
    }
  }
}

printNodeTree(root);
