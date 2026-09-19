import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_direction_node.json', 'utf8'));
const root = data.nodes['57012:9066']?.document;

function printTree(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let info = `${indent}- [${node.type}] "${node.name}"`;
  if (node.characters) {
    info += ` (text: "${node.characters.replace(/\n/g, ' ')}")`;
  }
  if (node.visible === false) {
    info += ` [HIDDEN]`;
  }
  console.log(info);
  if (node.children) {
    for (const child of node.children) {
      printTree(child, depth + 1);
    }
  }
}

console.log('=== FULL DIRECTION NODE TREE ===');
printTree(root);
