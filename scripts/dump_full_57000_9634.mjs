import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_node_57000_9634.json', 'utf-8'));
const root = raw.nodes['57000:9634']?.document;

function dumpNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const bbox = node.absoluteBoundingBox ? `${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)} @ (${Math.round(node.absoluteBoundingBox.x)},${Math.round(node.absoluteBoundingBox.y)})` : '';
  const fills = node.fills ? JSON.stringify(node.fills.map(f => f.color || f.type)) : '';
  const layout = node.layoutMode ? `[${node.layoutMode}, gap=${node.itemSpacing}, pad=T${node.paddingTop} R${node.paddingRight} B${node.paddingBottom} L${node.paddingLeft}, align=${node.layoutAlign}, grow=${node.layoutGrow}]` : '';
  const corner = node.cornerRadius !== undefined ? ` r=${node.cornerRadius}` : '';
  const text = node.characters ? ` "${node.characters.replace(/\n/g, ' ')}"` : '';
  
  let out = `${indent}- [${node.type}] "${node.name}" (${bbox})${corner} ${layout}${text}\n`;
  if (node.children) {
    for (const child of node.children) {
      out += dumpNode(child, depth + 1);
    }
  }
  return out;
}

fs.writeFileSync('scripts/figma_57000_9634_full.txt', dumpNode(root));
console.log('✓ Wrote scripts/figma_57000_9634_full.txt');
