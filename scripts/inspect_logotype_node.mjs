import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_logotype_node.json', 'utf8'));
const root = Object.values(raw.nodes)[0].document;

function printTree(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const textInfo = node.characters ? ` -> "${node.characters.replace(/\n/g, ' \\n ')}"` : '';
  const typeInfo = `[${node.type}]`;
  const nameInfo = node.name;
  console.log(`${indent}${nameInfo} ${typeInfo}${textInfo}`);
  if (node.children) {
    for (const child of node.children) {
      printTree(child, depth + 1);
    }
  }
}

console.log('=== FIGMA NODE HIERARCHY ===');
printTree(root);
