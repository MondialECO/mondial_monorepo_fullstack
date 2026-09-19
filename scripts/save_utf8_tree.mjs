import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_direction_node.json', 'utf8'));
const root = data.nodes['57012:9066']?.document;

let lines = [];
function printNodeRecursive(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let extra = '';
  if (node.characters) extra += ` text="${node.characters.replace(/\n/g, '\\n')}"`;
  if (node.fills && node.fills.length > 0) {
    const f = node.fills[0];
    if (f.type === 'SOLID' && f.color) {
      extra += ` fill=rgba(${Math.round(f.color.r*255)},${Math.round(f.color.g*255)},${Math.round(f.color.b*255)},${f.opacity ?? 1})`;
    }
  }
  lines.push(`${indent}- [${node.type}] "${node.name}"${extra}`);
  if (node.children) {
    for (const child of node.children) {
      printNodeRecursive(child, depth + 1);
    }
  }
}

printNodeRecursive(root);
fs.writeFileSync('scripts/direction_full_tree_utf8.txt', lines.join('\n'), 'utf8');
console.log('Saved to scripts/direction_full_tree_utf8.txt, lines:', lines.length);
