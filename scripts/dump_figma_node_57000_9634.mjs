import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_node_57000_9634.json', 'utf-8'));
const root = raw.nodes['57000:9634']?.document;

function walk(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const bbox = node.absoluteBoundingBox ? `${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)} @ (${Math.round(node.absoluteBoundingBox.x)},${Math.round(node.absoluteBoundingBox.y)})` : '';
  const layout = node.layoutMode ? `[${node.layoutMode}, gap=${node.itemSpacing}, pad=T${node.paddingTop} R${node.paddingRight} B${node.paddingBottom} L${node.paddingLeft}]` : '';
  const text = node.characters ? ` "${node.characters.replace(/\n/g, ' ')}"` : '';
  console.log(`${indent}- [${node.type}] "${node.name}" (${bbox}) ${layout}${text}`);
  
  if (node.children) {
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  }
}

console.log('=== FIGMA NODE 57000:9634 TREE ===');
walk(root);
